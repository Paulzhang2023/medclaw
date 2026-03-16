#!/usr/bin/env node

function readFlag(args, name) {
  const index = args.indexOf(name);
  if (index === -1) {
    return "";
  }
  return args[index + 1] ?? "";
}

function hasFlag(args, name) {
  return args.includes(name);
}

function parseCommonOptions(args) {
  return {
    json: hasFlag(args, "--json"),
    markdown: hasFlag(args, "--markdown"),
  };
}

function formatWorkflowMarkdown(workflow) {
  const lines = [
    `# ${workflow.title}`,
    "",
    `- Site: ${workflow.site}`,
    `- Goal: ${workflow.goal}`,
    `- Start URL: ${workflow.startUrl}`,
    `- Snapshot mode: ${workflow.snapshotMode}`,
    "",
    "## Extraction fields",
    ...workflow.extractFields.map((field) => `- ${field}`),
    "",
    "## Suggested output columns",
    `| ${workflow.outputColumns.join(" | ")} |`,
    `| ${workflow.outputColumns.map(() => "---").join(" | ")} |`,
  ];

  if (workflow.notes?.length) {
    lines.push("", "## Notes", ...workflow.notes.map((note) => `- ${note}`));
  }

  return `${lines.join("\n")}\n`;
}

export function printWorkflow(workflow, options = {}) {
  if (options.json) {
    process.stdout.write(`${JSON.stringify(workflow, null, 2)}\n`);
    return;
  }
  process.stdout.write(formatWorkflowMarkdown(workflow));
}

export function buildPubMedWorkflow(params) {
  const query = params.query.trim();
  if (!query) {
    throw new Error(
      'Usage: node pubmed-workflow.mjs --query "..." [--years 2020:2025] [--type ...] [--journal ...] [--sort relevance|pub-date] [--json]',
    );
  }

  const terms = [query];
  if (params.journal) {
    terms.push(`${params.journal}[Journal]`);
  }
  if (params.type) {
    terms.push(`${params.type}[Publication Type]`);
  }

  const url = new URL("https://pubmed.ncbi.nlm.nih.gov/");
  url.searchParams.set("term", terms.join(" AND "));
  url.searchParams.set("sort", params.sort || "relevance");
  if (params.years) {
    const [min, max] = params.years.split(":").map((part) => part.trim());
    if (min) {
      url.searchParams.set("filter", `years.${min}-${max || min}`);
    }
  }

  return {
    site: "pubmed",
    title: "PubMed Workflow",
    goal: "Retrieve and triage biomedical literature with compact structured extraction.",
    query,
    startUrl: url.toString(),
    snapshotMode: "efficient",
    extractFields: [
      "title",
      "PMID",
      "journal",
      "year",
      "authors",
      "abstract snippet",
      "publication type",
    ],
    outputColumns: ["PMID", "Year", "Title", "Journal", "Why it matters"],
    notes: [
      "Prefer results list extraction before opening detail pages.",
      "Open abstract pages only for top candidates to control token use.",
    ],
  };
}

export function buildClinicalTrialsWorkflow(params) {
  if (!params.condition && !params.term) {
    throw new Error(
      'Usage: node clinicaltrials-workflow.mjs --condition "..." [--term ...] [--status ...] [--phase ...] [--country ...] [--json]',
    );
  }

  const url = new URL("https://clinicaltrials.gov/search");
  if (params.condition) {
    url.searchParams.set("cond", params.condition);
  }
  if (params.term) {
    url.searchParams.set("term", params.term);
  }
  const filters = [];
  if (params.status) {
    filters.push(`overallStatus:${params.status}`);
  }
  if (params.phase) {
    filters.push(`phase:${params.phase}`);
  }
  if (filters.length) {
    url.searchParams.set("aggFilters", filters.join(","));
  }
  if (params.country) {
    url.searchParams.set("country", params.country);
  }

  return {
    site: "clinicaltrials",
    title: "ClinicalTrials.gov Workflow",
    goal: "Retrieve registry entries and extract only operationally relevant trial metadata.",
    startUrl: url.toString(),
    snapshotMode: "efficient",
    extractFields: [
      "NCT ID",
      "official title",
      "recruitment status",
      "phase",
      "conditions",
      "interventions",
      "sponsor",
      "locations",
      "primary completion date",
    ],
    outputColumns: ["NCT ID", "Status", "Phase", "Sponsor", "Why relevant"],
    notes: [
      "Registry status should remain explicit in the final answer.",
      "Do not infer efficacy from trial registration alone.",
    ],
  };
}

export function buildGuidelineWorkflow(params) {
  const organization = params.organization?.trim() || "Unknown organization";
  const topic = params.topic?.trim() || "Unknown topic";
  const question = params.question?.trim() || "Guideline review question not specified";

  return {
    site: "guideline",
    title: "Guideline Review Workflow",
    goal: "Review guideline pages with source attribution and recommendation strength preserved.",
    startUrl: params.url?.trim() || "Navigate directly to the target guideline page",
    snapshotMode: "efficient",
    organization,
    topic,
    question,
    extractFields: [
      "organization",
      "guideline title",
      "publication/update date",
      "section title",
      "recommendation summary",
      "recommendation strength",
      "evidence grade",
    ],
    outputColumns: ["Source", "Date", "Section", "Recommendation summary", "Strength/grade"],
    notes: [
      "Keep the exact source name and publication date.",
      "If strength or grade is absent, mark it explicitly rather than inferring.",
    ],
  };
}

export function parseScriptOptions(args) {
  return parseCommonOptions(args);
}

export function readWorkflowFlag(args, name) {
  return readFlag(args, name).trim();
}
