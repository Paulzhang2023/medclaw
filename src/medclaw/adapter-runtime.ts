import fs from "node:fs/promises";
import path from "node:path";
import { Value } from "@sinclair/typebox/value";
import {
  matchRoute,
  MedClawSiteAdapterSchema,
  type MedClawPageAdapter,
  type MedClawSiteAdapter,
} from "./site-adapter-registry.js";

export type SelectedAdapter = {
  adapter: MedClawSiteAdapter;
  page: MedClawPageAdapter;
};

export type AdapterFieldCoverage = {
  field: string;
  nonEmpty: number;
  total: number;
  ratio: number;
};

export type AdapterCoverageReport = {
  schemaVersion: 1;
  adapterId: string;
  score: number;
  trusted: boolean;
  rowsChecked: number;
  generatedAt: string;
  fields: AdapterFieldCoverage[];
};

const AUTOGEN_TRUST_THRESHOLD = 0.45;

export function getAdaptersRoot() {
  return path.resolve(process.cwd(), "medclaw", "site-adapters");
}

function slugifySegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function inferPathPrefix(url: URL) {
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length === 0) {
    return "/";
  }
  return `/${parts[0]}`;
}

function coverageReportPath(adapterPath: string) {
  return adapterPath.replace(/\.adapter\.json$/, ".coverage.json");
}

async function collectAdapterFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectAdapterFiles(fullPath)));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".adapter.json")) {
      files.push(fullPath);
    }
  }
  return files;
}

export async function loadAdapterFile(filePath: string): Promise<MedClawSiteAdapter> {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  if (!Value.Check(MedClawSiteAdapterSchema, parsed)) {
    throw new Error(`Invalid MedClaw adapter schema: ${filePath}`);
  }
  return parsed;
}

async function loadCoverageReport(filePath: string): Promise<AdapterCoverageReport | null> {
  const reportPath = coverageReportPath(filePath);
  const raw = await fs.readFile(reportPath, "utf8").catch(() => "");
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AdapterCoverageReport;
  } catch {
    return null;
  }
}

export type AutogenAdapterReviewEntry = {
  adapterPath: string;
  reportPath: string;
  adapterId: string;
  score: number;
  trusted: boolean;
  rowsChecked: number;
  generatedAt: string;
  fields: AdapterFieldCoverage[];
};

export type PromoteAdapterResult = {
  adapterPath: string;
  coveragePath?: string;
  adapterId: string;
  scope: "workspace" | "global";
};

export async function loadSiteAdapters(site: string): Promise<MedClawSiteAdapter[]> {
  const root = getAdaptersRoot();
  const files = await collectAdapterFiles(root);
  const adapters: MedClawSiteAdapter[] = [];
  for (const file of files) {
    try {
      const parsed = await loadAdapterFile(file);
      if (parsed.site === site) {
        const report = await loadCoverageReport(file);
        const isAutogen = file.includes(`${path.sep}workspace${path.sep}autogen${path.sep}`);
        if (isAutogen && report && !report.trusted) {
          continue;
        }
        adapters.push(parsed);
      }
    } catch {
      continue;
    }
  }
  return adapters.toSorted((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}

export async function listAutogenAdapterReviews(): Promise<AutogenAdapterReviewEntry[]> {
  const root = getAdaptersRoot();
  const autogenRoot = path.join(root, "workspace", "autogen");
  const files = await collectAdapterFiles(autogenRoot);
  const entries: AutogenAdapterReviewEntry[] = [];
  for (const file of files) {
    const report = await loadCoverageReport(file);
    if (!report) {
      continue;
    }
    entries.push({
      adapterPath: file,
      reportPath: coverageReportPath(file),
      adapterId: report.adapterId,
      score: report.score,
      trusted: report.trusted,
      rowsChecked: report.rowsChecked,
      generatedAt: report.generatedAt,
      fields: report.fields,
    });
  }
  return entries.toSorted((a, b) => a.score - b.score);
}

function normalizePromotedAdapterId(adapterId: string, scope: "workspace" | "global") {
  if (adapterId.startsWith("autogen.")) {
    return `${scope}.${adapterId.slice("autogen.".length)}`;
  }
  return `${scope}.${adapterId.replace(/^[^.]+\./, "")}`;
}

export async function promoteAutogenAdapter(params: {
  adapterPath: string;
  scope: "workspace" | "global";
}): Promise<PromoteAdapterResult> {
  const adapter = await loadAdapterFile(params.adapterPath);
  const sourceDirName = path.basename(path.dirname(params.adapterPath));
  const fileName = path.basename(params.adapterPath);
  const root = getAdaptersRoot();
  const targetDir = path.join(root, params.scope, sourceDirName);
  const targetPath = path.join(targetDir, fileName);
  const nextAdapter: MedClawSiteAdapter = {
    ...adapter,
    id: normalizePromotedAdapterId(adapter.id, params.scope),
    scope: params.scope,
    owner: "MedClaw Promoted",
    priority: Math.max(adapter.priority ?? 10, params.scope === "global" ? 80 : 40),
    tags: Array.from(new Set([...(adapter.tags ?? []), "promoted"])),
  };

  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(targetPath, `${JSON.stringify(nextAdapter, null, 2)}\n`, "utf8");

  const sourceCoveragePath = coverageReportPath(params.adapterPath);
  const targetCoveragePath = coverageReportPath(targetPath);
  const coverageRaw = await fs.readFile(sourceCoveragePath, "utf8").catch(() => "");
  if (coverageRaw) {
    const parsed = JSON.parse(coverageRaw) as AdapterCoverageReport;
    const nextCoverage: AdapterCoverageReport = {
      ...parsed,
      adapterId: nextAdapter.id,
    };
    await fs.writeFile(targetCoveragePath, `${JSON.stringify(nextCoverage, null, 2)}\n`, "utf8");
  }

  return {
    adapterPath: targetPath,
    coveragePath: coverageRaw ? targetCoveragePath : undefined,
    adapterId: nextAdapter.id,
    scope: params.scope,
  };
}

export async function selectAdapterForRoute(params: {
  site: string;
  url: string;
  title?: string;
}): Promise<SelectedAdapter | null> {
  const adapters = await loadSiteAdapters(params.site);
  const url = new URL(params.url);
  for (const adapter of adapters) {
    for (const page of adapter.pages) {
      if (matchRoute(url, page.match, params.title)) {
        return { adapter, page };
      }
    }
  }
  return null;
}

function buildAutoDraftAdapter(params: {
  site: string;
  url: string;
  title?: string;
}): MedClawSiteAdapter {
  const url = new URL(params.url);
  const host = url.hostname;
  const hostSlug = slugifySegment(host);
  const pathPrefix = inferPathPrefix(url);

  if (params.site === "guideline") {
    return {
      schemaVersion: 1,
      id: `autogen.${hostSlug}.guideline-detail.v1`,
      site: "guideline",
      scope: "workspace",
      owner: "MedClaw Autogen",
      priority: 10,
      tags: ["autogen", "guideline", host],
      pages: [
        {
          pageType: "guideline-detail",
          match: {
            hosts: [host],
            pathPrefixes: [pathPrefix],
            ...(params.title ? { titleIncludes: [params.title.slice(0, 40)] } : {}),
          },
          ready: {
            waitForSelector: "h1, main h1, article h1",
            snapshotMode: "efficient",
          },
          extraction: {
            kind: "detail",
            fields: [
              {
                key: "Source",
                selector: "meta[property='og:site_name']",
                value: "text",
                attr: "content",
              },
              {
                key: "Date",
                selector: "main, article, body",
                value: "text",
                transforms: ["extractYear"],
              },
              {
                key: "Section",
                selector: "h1, main h1, article h1",
                value: "text",
                required: true,
                transforms: ["trim", "collapseWhitespace"],
              },
              {
                key: "Recommendation summary",
                selector: "main p, article p, [role='main'] p",
                value: "text",
                transforms: ["trim", "collapseWhitespace"],
              },
              {
                key: "Strength/grade",
                selector: "main, article, body",
                value: "text",
                transforms: ["trim", "collapseWhitespace"],
              },
            ],
            outputColumns: [
              "Source",
              "Date",
              "Section",
              "Recommendation summary",
              "Strength/grade",
            ],
          },
          notes: [
            "Autogenerated adapter draft.",
            "Review selectors and tighten them after first validation.",
          ],
        },
      ],
    };
  }

  if (params.site === "article") {
    return {
      schemaVersion: 1,
      id: `autogen.${hostSlug}.article-detail.v1`,
      site: "article",
      scope: "workspace",
      owner: "MedClaw Autogen",
      priority: 10,
      tags: ["autogen", "article", host],
      pages: [
        {
          pageType: "article-detail",
          match: {
            hosts: [host],
            pathPrefixes: [pathPrefix],
            ...(params.title ? { titleIncludes: [params.title.slice(0, 40)] } : {}),
          },
          ready: {
            waitForSelector: "h1, article h1, main h1",
            snapshotMode: "efficient",
          },
          extraction: {
            kind: "detail",
            fields: [
              {
                key: "Source",
                selector: "meta[property='og:site_name']",
                value: "text",
                attr: "content",
              },
              {
                key: "Date",
                selector: "time, main, article, body",
                value: "text",
                transforms: ["trim", "collapseWhitespace"],
              },
              {
                key: "Title",
                selector: "h1, article h1, main h1",
                value: "text",
                required: true,
                transforms: ["trim", "collapseWhitespace"],
              },
              {
                key: "Summary",
                selector: "section p, article p, main p",
                value: "text",
                transforms: ["trim", "collapseWhitespace"],
              },
              {
                key: "DOI",
                selector: "main, article, body",
                value: "text",
                transforms: ["extractDoi"],
              },
            ],
            outputColumns: ["Source", "Date", "Title", "Summary", "DOI"],
          },
          notes: [
            "Autogenerated adapter draft.",
            "Review abstract/summary selectors after first validation.",
          ],
        },
      ],
    };
  }

  return {
    schemaVersion: 1,
    id: `autogen.${hostSlug}.medicalsite-detail.v1`,
    site: "medicalsite",
    scope: "workspace",
    owner: "MedClaw Autogen",
    priority: 10,
    tags: ["autogen", "medicalsite", host],
    pages: [
      {
        pageType: "article-detail",
        match: {
          hosts: [host],
          pathPrefixes: [pathPrefix],
          ...(params.title ? { titleIncludes: [params.title.slice(0, 40)] } : {}),
        },
        ready: {
          waitForSelector: "h1, article h1, main h1",
          snapshotMode: "efficient",
        },
        extraction: {
          kind: "detail",
          fields: [
            {
              key: "Source",
              selector: "meta[property='og:site_name']",
              value: "text",
              attr: "content",
            },
            {
              key: "Date",
              selector: "time, .time, .source, main, article, body",
              value: "text",
              transforms: ["trim", "collapseWhitespace"],
            },
            {
              key: "Title",
              selector: "h1, article h1, main h1",
              value: "text",
              required: true,
              transforms: ["trim", "collapseWhitespace"],
            },
            {
              key: "Summary",
              selector: "article p, main p, .content p",
              value: "text",
              transforms: ["trim", "collapseWhitespace"],
            },
            { key: "URL", selector: "meta[property='og:url']", value: "text", attr: "content" },
          ],
          outputColumns: ["Source", "Date", "Title", "Summary", "URL"],
        },
        notes: ["Autogenerated adapter draft.", "Review summary selectors after first validation."],
      },
    ],
  };
}

export async function ensureAutoDraftAdapterForRoute(params: {
  site: string;
  url: string;
  title?: string;
}): Promise<string | null> {
  if (!["guideline", "article", "medicalsite"].includes(params.site)) {
    return null;
  }
  const url = new URL(params.url);
  const hostSlug = slugifySegment(url.hostname);
  const pageKind = params.site === "guideline" ? "guideline-detail" : "article-detail";
  const root = getAdaptersRoot();
  const dir = path.join(root, "workspace", "autogen", hostSlug);
  const filePath = path.join(dir, `${pageKind}.adapter.json`);
  try {
    await fs.access(filePath);
    return filePath;
  } catch {
    // continue
  }
  const draft = buildAutoDraftAdapter(params);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(draft, null, 2)}\n`, "utf8");
  return filePath;
}

export function scoreAdapterCoverage(params: {
  rows: Array<Record<string, unknown>>;
  page: MedClawPageAdapter;
}) {
  const columns = params.page.extraction.outputColumns;
  const rows = params.rows;
  const fieldCoverage: AdapterFieldCoverage[] = columns.map((field) => {
    const nonEmpty = rows.filter((row) => {
      const value = row[field];
      return typeof value === "string" ? value.trim().length > 0 : value != null;
    }).length;
    const total = rows.length;
    const ratio = total > 0 ? nonEmpty / total : 0;
    return { field, nonEmpty, total, ratio };
  });
  const score =
    fieldCoverage.length > 0
      ? fieldCoverage.reduce((sum, item) => sum + item.ratio, 0) / fieldCoverage.length
      : 0;
  return {
    score,
    fields: fieldCoverage,
    trusted: score >= AUTOGEN_TRUST_THRESHOLD,
  };
}

export async function writeCoverageReport(params: {
  adapterPath: string;
  adapterId: string;
  rows: Array<Record<string, unknown>>;
  page: MedClawPageAdapter;
}) {
  const scored = scoreAdapterCoverage({
    rows: params.rows,
    page: params.page,
  });
  const report: AdapterCoverageReport = {
    schemaVersion: 1,
    adapterId: params.adapterId,
    score: scored.score,
    trusted: scored.trusted,
    rowsChecked: params.rows.length,
    generatedAt: new Date().toISOString(),
    fields: scored.fields,
  };
  const reportPath = coverageReportPath(params.adapterPath);
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return report;
}

export function buildAdapterEvaluateScript(page: MedClawPageAdapter) {
  const extraction = JSON.stringify(page.extraction);
  return `() => {
    const extraction = ${extraction};
    const transformValue = (input, transforms) => {
      let value = input == null ? '' : String(input);
      for (const transform of transforms || []) {
        switch (transform) {
          case 'trim':
            value = value.trim();
            break;
          case 'collapseWhitespace':
            value = value.replace(/\\s+/g, ' ').trim();
            break;
          case 'lowercase':
            value = value.toLowerCase();
            break;
          case 'uppercase':
            value = value.toUpperCase();
            break;
          case 'extractYear': {
            const match = value.match(/(19|20)\\d{2}/);
            value = match ? match[0] : '';
            break;
          }
          case 'extractPmid': {
            const match = value.match(/\\/(\\d+)\\/?$/);
            value = match ? match[1] : '';
            break;
          }
          case 'extractNctId': {
            const match = value.match(/(NCT\\d{8})/i);
            value = match ? match[1].toUpperCase() : '';
            break;
          }
          case 'extractClinicalTrialStatus': {
            const match = value.match(/\\b(Not yet recruiting|Recruiting|Active, not recruiting|Completed|Suspended|Terminated|Withdrawn|Enrolling by invitation|Unknown status)\\b/i);
            value = match ? match[0] : '';
            break;
          }
          case 'extractClinicalTrialPhase': {
            const match = value.match(/\\b(Early Phase 1|Phase [0-4][A-Za-z\\s\\/-]*)\\b/i);
            value = match ? match[0] : '';
            break;
          }
          case 'extractDoi': {
            const match = value.match(/10\\.\\d{4,9}\\/[A-Za-z0-9.()_\\-;:/]+/);
            value = match ? match[0] : '';
            break;
          }
        }
      }
      return value;
    };
    const pickNode = (root, selector) => {
      if (!selector || selector === '$row') {
        return root;
      }
      return root.querySelector(selector);
    };
    const readNodeValue = (node, valueType, attr) => {
      if (!node) {
        return '';
      }
      if (attr) {
        return node.getAttribute(attr) || '';
      }
      switch (valueType) {
        case 'innerHTML':
          return node.innerHTML || '';
        case 'href':
          return node.href || node.getAttribute('href') || '';
        case 'src':
          return node.src || node.getAttribute('src') || '';
        case 'text':
        default:
          return node.textContent || '';
      }
    };
    const normalizeRow = (root, fields) => {
      const row = {};
      for (const field of fields || []) {
        const node = pickNode(root, field.selector);
        const raw = readNodeValue(node, field.value, field.attr);
        const cooked = transformValue(raw, field.transforms);
        if (field.required && !cooked) {
          return null;
        }
        row[field.key] = cooked;
      }
      return row;
    };
    if (extraction.kind === 'detail') {
      const row = normalizeRow(document, extraction.fields || []);
      return row ? [row] : [];
    }
    const rowCfg = extraction.row;
    if (!rowCfg) {
      return [];
    }
    const roots = Array.from(document.querySelectorAll(rowCfg.rowSelector));
    const seen = new Set();
    const rows = [];
    for (const root of roots) {
      const row = normalizeRow(root, rowCfg.fields || []);
      if (!row) {
        continue;
      }
      if (rowCfg.dedupeBy) {
        const key = String(row[rowCfg.dedupeBy] || '').trim();
        if (!key || seen.has(key)) {
          continue;
        }
        seen.add(key);
      }
      rows.push(row);
    }
    return rows;
  }`;
}
