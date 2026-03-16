import path from "node:path";
import { browserAct } from "../browser/client-actions.js";
import { browserOpenTab, browserSnapshot, browserStart, browserStatus } from "../browser/client.js";
import { loadAdapterFile, buildAdapterEvaluateScript } from "../medclaw/adapter-runtime.js";
import type { RuntimeEnv } from "../runtime.js";
import { defaultRuntime } from "../runtime.js";

function summarizeFieldCoverage(rows: Array<Record<string, unknown>>, columns: string[]) {
  return columns.map((column) => {
    const nonEmpty = rows.filter((row) => {
      const value = row[column];
      return typeof value === "string" ? value.trim().length > 0 : value != null;
    }).length;
    return { field: column, nonEmpty, total: rows.length };
  });
}

async function ensureBrowserReady(profile?: string) {
  const status = await browserStatus(undefined, { profile }).catch(() => null);
  if (!status?.running) {
    await browserStart(undefined, { profile });
  }
}

async function readPageTitle(targetId: string, profile?: string) {
  const snapshot = await browserSnapshot(undefined, {
    format: "ai",
    targetId,
    mode: "efficient",
    maxChars: 1200,
    profile,
  });
  if (snapshot.format !== "ai") {
    return "";
  }
  return (
    snapshot.snapshot
      .split("\n")
      .map((line) => line.trim())
      .find(Boolean) ?? ""
  );
}

export async function validateMedClawAdapterCommand(
  opts: {
    adapter: string;
    url: string;
    pageType?: string;
    profile?: string;
    limit?: number;
  },
  runtime: RuntimeEnv = defaultRuntime,
) {
  const adapterPath = path.resolve(opts.adapter);
  const adapter = await loadAdapterFile(adapterPath);
  const page =
    (opts.pageType
      ? adapter.pages.find((entry) => entry.pageType === opts.pageType)
      : adapter.pages[0]) ?? null;
  if (!page) {
    throw new Error(`No adapter page found in ${adapterPath}`);
  }

  await ensureBrowserReady(opts.profile);
  const tab = await browserOpenTab(undefined, opts.url, { profile: opts.profile });
  const waitForSelector = page.ready?.waitForSelector?.trim();
  if (waitForSelector) {
    await browserAct(
      undefined,
      {
        kind: "wait",
        targetId: tab.targetId,
        selector: waitForSelector,
        timeoutMs: 20_000,
      },
      { profile: opts.profile },
    );
  }

  const script = buildAdapterEvaluateScript(page);
  const result = await browserAct(
    undefined,
    {
      kind: "evaluate",
      targetId: tab.targetId,
      fn: script,
      timeoutMs: 20_000,
    },
    { profile: opts.profile },
  );
  const rows = Array.isArray(result?.result)
    ? (result.result as Array<Record<string, unknown>>)
    : [];
  const limitedRows = rows.slice(0, Math.max(1, opts.limit ?? 5));
  const columns = page.extraction.outputColumns;
  const coverage = summarizeFieldCoverage(limitedRows, columns);
  const title = await readPageTitle(tab.targetId, opts.profile);

  runtime.log(`Adapter: ${adapter.id}`);
  runtime.log(`Adapter file: ${adapterPath}`);
  runtime.log(`Page type: ${page.pageType}`);
  runtime.log(`URL: ${opts.url}`);
  runtime.log(`Target ID: ${tab.targetId}`);
  if (title) {
    runtime.log(`Page title: ${title}`);
  }
  runtime.log(`Rows extracted: ${limitedRows.length}`);
  runtime.log("");
  runtime.log("Field coverage:");
  for (const item of coverage) {
    runtime.log(`- ${item.field}: ${item.nonEmpty}/${item.total}`);
  }
  runtime.log("");
  runtime.log("Sample rows:");
  runtime.log(JSON.stringify(limitedRows, null, 2));
}
