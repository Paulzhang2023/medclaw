import fs from "node:fs/promises";
import path from "node:path";
import { Static, Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { loadConfig } from "../config/config.js";
import { getAdaptersRoot, loadAdapterFile } from "./adapter-runtime.js";
import type { AdapterCoverageReport } from "./adapter-runtime.js";

export const MedClawCloudAdapterSummarySchema = Type.Object({
  id: Type.String(),
  site: Type.String(),
  version: Type.String(),
  score: Type.Optional(Type.Number()),
  trusted: Type.Optional(Type.Boolean()),
  hosts: Type.Optional(Type.Array(Type.String())),
  title: Type.Optional(Type.String()),
});

export const MedClawCloudAdapterListResponseSchema = Type.Object({
  items: Type.Array(MedClawCloudAdapterSummarySchema),
});

export const MedClawCloudPublishRequestSchema = Type.Object({
  adapter: Type.Object({}, { additionalProperties: true }),
  coverage: Type.Optional(Type.Object({}, { additionalProperties: true })),
});

export const MedClawCloudPublishResponseSchema = Type.Object({
  ok: Type.Boolean(),
  id: Type.String(),
  version: Type.String(),
  reviewStatus: Type.Optional(Type.String()),
});

export const MedClawCloudInstallResponseSchema = Type.Object({
  adapter: Type.Object({}, { additionalProperties: true }),
  coverage: Type.Optional(Type.Object({}, { additionalProperties: true })),
});

export type MedClawCloudAdapterSummary = Static<typeof MedClawCloudAdapterSummarySchema>;
export type MedClawCloudAdapterListResponse = Static<typeof MedClawCloudAdapterListResponseSchema>;
export type MedClawCloudPublishResponse = Static<typeof MedClawCloudPublishResponseSchema>;
export type MedClawCloudInstallResponse = Static<typeof MedClawCloudInstallResponseSchema>;

function resolveRegistryUrl() {
  const cfg = loadConfig();
  const fromConfig = cfg.env?.vars?.MEDCLAW_ADAPTER_REGISTRY_URL?.trim();
  return fromConfig || process.env.MEDCLAW_ADAPTER_REGISTRY_URL?.trim() || "";
}

function resolveRegistryToken() {
  const cfg = loadConfig();
  const fromConfig = cfg.env?.vars?.MEDCLAW_ADAPTER_REGISTRY_TOKEN?.trim();
  return fromConfig || process.env.MEDCLAW_ADAPTER_REGISTRY_TOKEN?.trim() || "";
}

function resolveRegistryReadToken() {
  const cfg = loadConfig();
  const fromConfig = cfg.env?.vars?.MEDCLAW_ADAPTER_REGISTRY_READ_TOKEN?.trim();
  return (
    fromConfig || process.env.MEDCLAW_ADAPTER_REGISTRY_READ_TOKEN?.trim() || resolveRegistryToken()
  );
}

function resolveRegistryUploadToken() {
  const cfg = loadConfig();
  const fromConfig = cfg.env?.vars?.MEDCLAW_ADAPTER_REGISTRY_UPLOAD_TOKEN?.trim();
  return (
    fromConfig ||
    process.env.MEDCLAW_ADAPTER_REGISTRY_UPLOAD_TOKEN?.trim() ||
    resolveRegistryToken()
  );
}

function requireRegistryUrl() {
  const baseUrl = resolveRegistryUrl();
  if (!baseUrl) {
    throw new Error(
      "MedClaw adapter registry URL not configured. Set env.vars.MEDCLAW_ADAPTER_REGISTRY_URL or MEDCLAW_ADAPTER_REGISTRY_URL.",
    );
  }
  return baseUrl.replace(/\/$/, "");
}

async function fetchJson(url: string, init?: RequestInit, authMode: "read" | "upload" = "read") {
  const token = authMode === "upload" ? resolveRegistryUploadToken() : resolveRegistryReadToken();
  const headers = new Headers(init?.headers ?? {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(url, {
    ...init,
    headers,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Registry request failed (${res.status}): ${text}`);
  }
  return text ? (JSON.parse(text) as unknown) : {};
}

function coveragePathForAdapter(adapterPath: string) {
  return adapterPath.replace(/\.adapter\.json$/, ".coverage.json");
}

export async function uploadAdapterToCloud(params: {
  adapterPath: string;
}): Promise<MedClawCloudPublishResponse> {
  const baseUrl = requireRegistryUrl();
  const adapter = await loadAdapterFile(params.adapterPath);
  const coverageRaw = await fs
    .readFile(coveragePathForAdapter(params.adapterPath), "utf8")
    .catch(() => "");
  const coverage = coverageRaw ? (JSON.parse(coverageRaw) as AdapterCoverageReport) : undefined;
  const payload = {
    adapter,
    ...(coverage ? { coverage } : {}),
  };
  if (!Value.Check(MedClawCloudPublishRequestSchema, payload)) {
    throw new Error("Invalid cloud publish payload.");
  }
  const result = await fetchJson(
    `${baseUrl}/v1/adapters/upload`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "upload",
  );
  if (!Value.Check(MedClawCloudPublishResponseSchema, result)) {
    throw new Error("Invalid cloud publish response.");
  }
  return result;
}

export async function listCloudAdapters(params?: {
  site?: string;
  host?: string;
}): Promise<MedClawCloudAdapterSummary[]> {
  const baseUrl = requireRegistryUrl();
  const url = new URL(`${baseUrl}/v1/adapters`);
  if (params?.site?.trim()) {
    url.searchParams.set("site", params.site.trim());
  }
  if (params?.host?.trim()) {
    url.searchParams.set("host", params.host.trim());
  }
  const result = await fetchJson(url.toString(), undefined, "read");
  if (!Value.Check(MedClawCloudAdapterListResponseSchema, result)) {
    throw new Error("Invalid cloud adapter list response.");
  }
  return result.items;
}

export async function installCloudAdapter(params: {
  id: string;
  target: "workspace" | "global";
}): Promise<{ adapterPath: string; coveragePath?: string }> {
  const baseUrl = requireRegistryUrl();
  const result = await fetchJson(
    `${baseUrl}/v1/adapters/${encodeURIComponent(params.id)}`,
    undefined,
    "read",
  );
  if (!Value.Check(MedClawCloudInstallResponseSchema, result)) {
    throw new Error("Invalid cloud adapter install response.");
  }
  const adapter = result.adapter;
  const site = typeof adapter.site === "string" ? adapter.site : "unknown";
  const adapterId = typeof adapter.id === "string" ? adapter.id : params.id;
  const dirName = adapterId.split(".")[1] || site;
  const root = getAdaptersRoot();
  const targetDir = path.join(root, params.target, dirName);
  const adapterPath = path.join(targetDir, `${site}-cloud.adapter.json`);
  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(adapterPath, `${JSON.stringify(adapter, null, 2)}\n`, "utf8");
  let coveragePath: string | undefined;
  if (result.coverage) {
    coveragePath = coveragePathForAdapter(adapterPath);
    await fs.writeFile(coveragePath, `${JSON.stringify(result.coverage, null, 2)}\n`, "utf8");
  }
  return { adapterPath, coveragePath };
}
