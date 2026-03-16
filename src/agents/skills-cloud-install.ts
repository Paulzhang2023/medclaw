import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { extractArchive } from "../infra/archive.js";
import { safePathSegmentHashed } from "../infra/install-safe-path.js";
import { fetchWithSsrFGuard } from "../infra/net/fetch-guard.js";
import { isPathInside } from "../infra/path-guards.js";
import { scanDirectoryWithSummary } from "../security/skill-scanner.js";
import { ensureDir, resolveConfigDir } from "../utils.js";

export type CloudSkillArchiveKind = "zip" | "tar.gz" | "tar.bz2";

export type CloudSkillInstallPayload = {
  skillId: string;
  packageUrl: string;
  archiveKind: CloudSkillArchiveKind;
  expectedSha256?: string;
  timeoutMs?: number;
};

export type CloudSkillInstallResult = {
  ok: boolean;
  message: string;
  installedPath?: string;
  warnings?: string[];
};

function resolveManagedSkillsDir() {
  return path.join(resolveConfigDir(), "skills");
}

function resolveArchiveExtension(kind: CloudSkillArchiveKind) {
  switch (kind) {
    case "tar.gz":
      return ".tar.gz";
    case "tar.bz2":
      return ".tar.bz2";
    default:
      return ".zip";
  }
}

async function sha256File(filePath: string) {
  const hash = createHash("sha256");
  const data = await fs.readFile(filePath);
  hash.update(data);
  return hash.digest("hex");
}

async function downloadArchive(params: { url: string; archivePath: string; timeoutMs: number }) {
  const { response, release } = await fetchWithSsrFGuard({
    url: params.url,
    timeoutMs: params.timeoutMs,
  });
  try {
    if (!response.ok) {
      throw new Error(`skill package download failed (${response.status} ${response.statusText})`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(params.archivePath, buffer);
  } finally {
    await release();
  }
}

async function findSkillRoot(rootDir: string): Promise<string | null> {
  const direct = path.join(rootDir, "SKILL.md");
  try {
    await fs.access(direct);
    return rootDir;
  } catch {
    // continue
  }

  const entries = await fs.readdir(rootDir, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const candidate = path.join(rootDir, entry.name);
    try {
      await fs.access(path.join(candidate, "SKILL.md"));
      return candidate;
    } catch {
      // continue
    }
  }
  return null;
}

export async function installCloudSkillPackage(
  params: CloudSkillInstallPayload,
): Promise<CloudSkillInstallResult> {
  const timeoutMs = Math.max(5_000, params.timeoutMs ?? 120_000);
  const managedSkillsDir = resolveManagedSkillsDir();
  const safeDir = safePathSegmentHashed(params.skillId);
  const destination = path.join(managedSkillsDir, safeDir);
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "medclaw-skill-install-"));

  try {
    await ensureDir(managedSkillsDir);
    const archivePath = path.join(
      tempRoot,
      `package${resolveArchiveExtension(params.archiveKind)}`,
    );
    const extractDir = path.join(tempRoot, "extract");
    await ensureDir(extractDir);

    await downloadArchive({
      url: params.packageUrl,
      archivePath,
      timeoutMs,
    });

    if (params.expectedSha256?.trim()) {
      const actual = await sha256File(archivePath);
      if (actual !== params.expectedSha256.trim().toLowerCase()) {
        return {
          ok: false,
          message: "cloud skill checksum mismatch",
        };
      }
    }

    await extractArchive({
      archivePath,
      destDir: extractDir,
      timeoutMs,
      kind: params.archiveKind === "zip" ? "zip" : "tar",
      ...(params.archiveKind === "tar.gz" ? { tarGzip: true } : {}),
    });

    const skillRoot = await findSkillRoot(extractDir);
    if (!skillRoot) {
      return {
        ok: false,
        message: "cloud skill package does not contain a valid SKILL.md",
      };
    }

    const resolvedSkillRoot = await fs.realpath(skillRoot);
    const resolvedExtractDir = await fs.realpath(extractDir);
    if (!isPathInside(resolvedExtractDir, resolvedSkillRoot)) {
      return {
        ok: false,
        message: "cloud skill package resolved outside extraction directory",
      };
    }

    await fs.rm(destination, { recursive: true, force: true }).catch(() => undefined);
    await fs.cp(skillRoot, destination, { recursive: true, force: true });

    const summary = await scanDirectoryWithSummary(destination);
    if (summary.critical > 0) {
      await fs.rm(destination, { recursive: true, force: true }).catch(() => undefined);
      return {
        ok: false,
        message: `cloud skill rejected by code safety scan (${summary.critical} critical finding(s))`,
      };
    }

    const warnings =
      summary.warn > 0
        ? [
            `Skill installed with ${summary.warn} warning finding(s). Run "openclaw security audit --deep" to inspect details.`,
          ]
        : [];

    return {
      ok: true,
      message: `Installed ${params.skillId} to managed skills`,
      installedPath: destination,
      ...(warnings.length > 0 ? { warnings } : {}),
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    };
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true }).catch(() => undefined);
  }
}
