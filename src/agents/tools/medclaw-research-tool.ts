import { Type } from "@sinclair/typebox";
import { browserAct } from "../../browser/client-actions.js";
import {
  browserOpenTab,
  browserSnapshot,
  browserStart,
  browserStatus,
} from "../../browser/client.js";
import {
  buildAdapterEvaluateScript,
  ensureAutoDraftAdapterForRoute,
  selectAdapterForRoute,
  writeCoverageReport,
} from "../../medclaw/adapter-runtime.js";
import {
  buildArticleWorkflow,
  buildClinicalTrialsWorkflow,
  buildGuidelineWorkflow,
  buildMedicalSiteWorkflow,
  buildPubMedWorkflow,
  type MedClawWorkflow,
} from "../../medclaw/site-workflows.js";
import { wrapExternalContent } from "../../security/external-content.js";
import type { AnyAgentTool } from "./common.js";
import { readNumberParam, readStringParam, ToolInputError } from "./common.js";

const MEDCLAW_RESEARCH_SITES = [
  "pubmed",
  "clinicaltrials",
  "guideline",
  "article",
  "medicalsite",
] as const;

const MedClawResearchSchema = Type.Object({
  site: Type.Union(MEDCLAW_RESEARCH_SITES.map((site) => Type.Literal(site))),
  profile: Type.Optional(Type.String()),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 10 })),
  query: Type.Optional(Type.String()),
  years: Type.Optional(Type.String()),
  publicationType: Type.Optional(Type.String()),
  journal: Type.Optional(Type.String()),
  sort: Type.Optional(Type.String()),
  condition: Type.Optional(Type.String()),
  term: Type.Optional(Type.String()),
  status: Type.Optional(Type.String()),
  phase: Type.Optional(Type.String()),
  country: Type.Optional(Type.String()),
  url: Type.Optional(Type.String()),
  organization: Type.Optional(Type.String()),
  topic: Type.Optional(Type.String()),
  question: Type.Optional(Type.String()),
});

type MedClawRow = Record<string, string>;

function sanitizeCell(value: unknown) {
  if (value == null) {
    return "";
  }
  const text =
    typeof value === "string" || typeof value === "number" || typeof value === "boolean"
      ? String(value)
      : JSON.stringify(value);
  return text.replace(/\s+/g, " ").trim().replace(/\|/g, "\\|");
}

function formatTable(columns: string[], rows: MedClawRow[]) {
  const header = `| ${columns.join(" | ")} |`;
  const separator = `| ${columns.map(() => "---").join(" | ")} |`;
  const body = rows.map(
    (row) => `| ${columns.map((column) => sanitizeCell(row[column])).join(" | ")} |`,
  );
  return [header, separator, ...body].join("\n");
}

function formatWorkflowResult(params: {
  workflow: MedClawWorkflow;
  targetId?: string;
  rows: MedClawRow[];
  title?: string;
  sourceUrl?: string;
  adapterId?: string;
}) {
  const lines = [
    `# ${params.workflow.title}`,
    "",
    `- Goal: ${params.workflow.goal}`,
    `- Start URL: ${params.workflow.startUrl}`,
    `- Snapshot mode: ${params.workflow.snapshotMode}`,
    ...(params.title ? [`- Page title: ${params.title}`] : []),
    ...(params.sourceUrl ? [`- Final URL: ${params.sourceUrl}`] : []),
    ...(params.targetId ? [`- Target ID: ${params.targetId}`] : []),
    ...(params.adapterId ? [`- Adapter: ${params.adapterId}`] : []),
    "",
    "## Structured results",
    params.rows.length > 0
      ? formatTable(params.workflow.outputColumns, params.rows)
      : "_No rows extracted from the current page._",
    "",
    "## Notes",
    ...params.workflow.notes.map((note) => `- ${note}`),
  ];
  return `${lines.join("\n")}\n`;
}

async function ensureBrowserReady(profile?: string) {
  const status = await browserStatus(undefined, { profile }).catch(() => null);
  if (!status?.running) {
    await browserStart(undefined, { profile });
  }
}

async function openWorkflowTab(workflow: MedClawWorkflow, profile?: string) {
  await ensureBrowserReady(profile);
  const tab = await browserOpenTab(undefined, workflow.startUrl, { profile });
  await browserAct(
    undefined,
    {
      kind: "wait",
      targetId: tab.targetId,
      loadState: "domcontentloaded",
      timeoutMs: 20_000,
    },
    { profile },
  );
  return tab;
}

async function waitForAdapterReady(
  targetId: string,
  page: { ready?: { waitForSelector?: string } } | undefined,
  profile?: string,
) {
  const selector = page?.ready?.waitForSelector?.trim();
  if (!selector) {
    return;
  }
  await browserAct(
    undefined,
    {
      kind: "wait",
      targetId,
      selector,
      timeoutMs: 20_000,
    },
    { profile },
  );
}

async function readAiSnapshotTitle(targetId: string, profile?: string) {
  const snapshot = await browserSnapshot(undefined, {
    format: "ai",
    targetId,
    mode: "efficient",
    maxChars: 1_200,
    profile,
  });
  if (snapshot.format !== "ai") {
    return undefined;
  }
  const firstLine = snapshot.snapshot
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);
  return firstLine;
}

async function evaluateRows(targetId: string, fn: string, profile?: string) {
  const result = await browserAct(
    undefined,
    {
      kind: "evaluate",
      targetId,
      fn,
      timeoutMs: 20_000,
    },
    { profile },
  );
  const payload = (result?.result ?? []) as unknown;
  return Array.isArray(payload) ? (payload as MedClawRow[]) : [];
}

function normalizeRows(rows: MedClawRow[], columns: string[]) {
  return rows.map((row) =>
    Object.fromEntries(columns.map((column) => [column, sanitizeCell(row[column])])),
  );
}

const PUBMED_EVAL = `() => {
  const roots = Array.from(document.querySelectorAll('article.full-docsum, div.docsum-content'))
    .map((node) => node.closest('article.full-docsum') || node)
    .filter(Boolean);
  const seen = new Set();
  return roots.map((root) => {
    const titleEl = root.querySelector('a.docsum-title, a[href*="pubmed.ncbi.nlm.nih.gov/"]');
    const href = titleEl?.href || '';
    const pmid = (href.match(/\\/(\\d+)\\/?$/) || [])[1] || '';
    if (!pmid || seen.has(pmid)) {
      return null;
    }
    seen.add(pmid);
    const citation = (root.querySelector('.docsum-journal-citation')?.textContent || '').replace(/\\s+/g, ' ').trim();
    const journal = citation.split('.').slice(0, 1).join('.').trim();
    const year = (citation.match(/(19|20)\\d{2}/) || [])[0] || '';
    const snippet = (root.querySelector('.full-view-snippet, .docsum-snippet')?.textContent || '').replace(/\\s+/g, ' ').trim();
    return {
      PMID: pmid,
      Year: year,
      Title: (titleEl?.textContent || '').replace(/\\s+/g, ' ').trim(),
      Journal: journal,
      'Why it matters': snippet,
    };
  }).filter(Boolean);
}`;

const CLINICALTRIALS_EVAL = `() => {
  const links = Array.from(document.querySelectorAll('a[href*="/study/NCT"]'));
  const seen = new Set();
  return links.map((link) => {
    const href = link.href || '';
    const nct = (href.match(/(NCT\\d{8})/i) || [])[1] || '';
    if (!nct || seen.has(nct)) {
      return null;
    }
    seen.add(nct);
    const card = link.closest('article, section, li, div') || link.parentElement || document.body;
    const text = (card.textContent || '').replace(/\\s+/g, ' ').trim();
    const status = (text.match(/\\b(Not yet recruiting|Recruiting|Active, not recruiting|Completed|Suspended|Terminated|Withdrawn|Enrolling by invitation|Unknown status)\\b/i) || [])[0] || '';
    const phase = (text.match(/\\b(Early Phase 1|Phase [0-4][A-Za-z\\s\\/-]*)\\b/i) || [])[0] || '';
    return {
      'NCT ID': nct.toUpperCase(),
      Status: status,
      Phase: phase,
      Title: (link.textContent || '').replace(/\\s+/g, ' ').trim(),
      'Why relevant': text.slice(0, 220),
    };
  }).filter(Boolean);
}`;

const GUIDELINE_EVAL = `() => {
  const root = document.querySelector('main, article, [role="main"]') || document.body;
  const sections = [];
  const headings = Array.from(root.querySelectorAll('h1, h2, h3')).slice(0, 12);
  for (const heading of headings) {
    const bits = [];
    let cursor = heading.nextElementSibling;
    while (cursor && !/^H[1-3]$/.test(cursor.tagName) && bits.length < 3) {
      const text = (cursor.textContent || '').replace(/\\s+/g, ' ').trim();
      if (text) {
        bits.push(text);
      }
      cursor = cursor.nextElementSibling;
    }
    const summary = bits.join(' ').slice(0, 260);
    if (!summary) {
      continue;
    }
    sections.push({
      Source: document.title || location.hostname,
      Date: '',
      Section: (heading.textContent || '').replace(/\\s+/g, ' ').trim(),
      'Recommendation summary': summary,
      'Strength/grade': '',
    });
  }
  return sections;
}`;

export function createMedClawResearchTool(): AnyAgentTool {
  return {
    label: "MedClaw Research",
    name: "medclaw_research",
    description:
      "Run compact medical-site workflows for PubMed, ClinicalTrials.gov, or guideline pages by opening the browser, extracting structured fields, and returning a fixed table.",
    parameters: MedClawResearchSchema,
    execute: async (input) => {
      const params = input as unknown as Record<string, unknown>;
      const site = readStringParam(params, "site", { required: true }) as
        | "pubmed"
        | "clinicaltrials"
        | "guideline"
        | "article"
        | "medicalsite";
      const profile = readStringParam(params, "profile");
      const limit = Math.min(10, Math.max(1, readNumberParam(params, "limit") ?? 5));

      let workflow: MedClawWorkflow;
      let extractor = PUBMED_EVAL;
      if (site === "pubmed") {
        workflow = buildPubMedWorkflow({
          query: readStringParam(params, "query", { required: true }),
          years: readStringParam(params, "years"),
          type: readStringParam(params, "publicationType"),
          journal: readStringParam(params, "journal"),
          sort: readStringParam(params, "sort"),
        });
      } else if (site === "clinicaltrials") {
        workflow = buildClinicalTrialsWorkflow({
          condition: readStringParam(params, "condition"),
          term: readStringParam(params, "term"),
          status: readStringParam(params, "status"),
          phase: readStringParam(params, "phase"),
          country: readStringParam(params, "country"),
        });
        extractor = CLINICALTRIALS_EVAL;
      } else if (site === "guideline") {
        workflow = buildGuidelineWorkflow({
          url: readStringParam(params, "url", { required: true }),
          organization: readStringParam(params, "organization"),
          topic: readStringParam(params, "topic"),
          question: readStringParam(params, "question"),
        });
        extractor = GUIDELINE_EVAL;
      } else if (site === "article") {
        workflow = buildArticleWorkflow({
          url: readStringParam(params, "url", { required: true }),
          topic: readStringParam(params, "topic"),
          question: readStringParam(params, "question"),
        });
      } else if (site === "medicalsite") {
        workflow = buildMedicalSiteWorkflow({
          url: readStringParam(params, "url", { required: true }),
          topic: readStringParam(params, "topic"),
          question: readStringParam(params, "question"),
        });
      } else {
        const _exhaustive: never = site;
        throw new ToolInputError("unsupported MedClaw site");
      }

      const tab = await openWorkflowTab(workflow, profile);
      const title = await readAiSnapshotTitle(tab.targetId, profile);
      const selectedAdapter = await selectAdapterForRoute({
        site,
        url: tab.url,
        title,
      });
      const autogenPath =
        selectedAdapter == null
          ? await ensureAutoDraftAdapterForRoute({
              site,
              url: tab.url,
              title,
            })
          : null;
      const resolvedAdapter =
        selectedAdapter ??
        (autogenPath
          ? await selectAdapterForRoute({
              site,
              url: tab.url,
              title,
            })
          : null);
      await waitForAdapterReady(tab.targetId, resolvedAdapter?.page, profile);
      const adapterExtractor = resolvedAdapter
        ? buildAdapterEvaluateScript(resolvedAdapter.page)
        : "";
      let rawRows = await evaluateRows(tab.targetId, adapterExtractor || extractor, profile);
      let autogenCoverage:
        | {
            score: number;
            trusted: boolean;
            fields: Array<{ field: string; nonEmpty: number; total: number; ratio: number }>;
          }
        | undefined;
      if (autogenPath && resolvedAdapter) {
        const report = await writeCoverageReport({
          adapterPath: autogenPath,
          adapterId: resolvedAdapter.adapter.id,
          rows: rawRows,
          page: resolvedAdapter.page,
        });
        autogenCoverage = report;
        if (!report.trusted && extractor) {
          rawRows = await evaluateRows(tab.targetId, extractor, profile);
        }
      }
      const trustedAdapter = autogenCoverage && !autogenCoverage.trusted ? null : resolvedAdapter;
      const outputColumns = trustedAdapter?.page.extraction.outputColumns ?? workflow.outputColumns;
      const rows = normalizeRows(rawRows.slice(0, limit), outputColumns);
      const effectiveWorkflow: MedClawWorkflow = trustedAdapter
        ? {
            ...workflow,
            outputColumns,
            notes: [
              ...workflow.notes,
              ...(trustedAdapter.page.notes ?? []),
              ...(autogenPath ? [`Autogenerated adapter draft: ${autogenPath}`] : []),
              ...(autogenCoverage
                ? [
                    `Autogen coverage score: ${autogenCoverage.score.toFixed(2)}`,
                    autogenCoverage.trusted
                      ? "Autogen adapter trusted for reuse."
                      : "Autogen adapter not trusted yet; fallback extraction used.",
                  ]
                : []),
            ],
          }
        : {
            ...workflow,
            notes: [
              ...workflow.notes,
              ...(autogenPath ? [`Autogenerated adapter draft: ${autogenPath}`] : []),
              ...(autogenCoverage
                ? [
                    `Autogen coverage score: ${autogenCoverage.score.toFixed(2)}`,
                    "Autogen adapter not trusted yet; fallback extraction used.",
                  ]
                : []),
            ],
          };
      const wrappedText = wrapExternalContent(
        formatWorkflowResult({
          workflow: effectiveWorkflow,
          targetId: tab.targetId,
          rows,
          title,
          sourceUrl: tab.url,
          adapterId: trustedAdapter?.adapter.id,
        }),
        {
          source: "browser",
          includeWarning: true,
        },
      );
      return {
        content: [{ type: "text", text: wrappedText }],
        details: {
          ok: true,
          site,
          workflow: effectiveWorkflow,
          adapterId: trustedAdapter?.adapter.id,
          autogeneratedAdapterPath: autogenPath ?? undefined,
          autogeneratedAdapterCoverage: autogenCoverage,
          targetId: tab.targetId,
          url: tab.url,
          rowCount: rows.length,
          rows,
          externalContent: {
            untrusted: true,
            source: "browser",
            kind: "medclaw-research",
            wrapped: true,
          },
        },
      };
    },
  };
}
