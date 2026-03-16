export type MedClawSite = "pubmed" | "clinicaltrials" | "guideline";
export type MedClawExtendedSite = MedClawSite | "article" | "medicalsite";

export type MedClawWorkflow = {
  site: MedClawExtendedSite;
  title: string;
  goal: string;
  startUrl: string;
  snapshotMode: "efficient";
  extractFields: string[];
  outputColumns: string[];
  notes: string[];
};

export function buildPubMedWorkflow(params: {
  query: string;
  years?: string;
  type?: string;
  journal?: string;
  sort?: string;
}): MedClawWorkflow {
  const query = params.query.trim();
  if (!query) {
    throw new Error("query required for PubMed workflow");
  }
  const terms = [query];
  if (params.journal?.trim()) {
    terms.push(`${params.journal.trim()}[Journal]`);
  }
  if (params.type?.trim()) {
    terms.push(`${params.type.trim()}[Publication Type]`);
  }
  const url = new URL("https://pubmed.ncbi.nlm.nih.gov/");
  url.searchParams.set("term", terms.join(" AND "));
  url.searchParams.set("sort", params.sort?.trim() || "relevance");
  if (params.years?.trim()) {
    const [min, max] = params.years.split(":").map((part) => part.trim());
    if (min) {
      url.searchParams.set("filter", `years.${min}-${max || min}`);
    }
  }
  return {
    site: "pubmed",
    title: "PubMed Workflow",
    goal: "Retrieve and triage biomedical literature with compact structured extraction.",
    startUrl: url.toString(),
    snapshotMode: "efficient",
    extractFields: [
      "PMID",
      "year",
      "title",
      "journal",
      "authors",
      "abstract snippet",
      "publication type",
    ],
    outputColumns: ["PMID", "Year", "Title", "Journal", "Why it matters"],
    notes: [
      "Prefer extracting result cards before opening detail pages.",
      "Only open a small number of abstracts to limit token use.",
    ],
  };
}

export function buildArticleWorkflow(params: {
  url: string;
  topic?: string;
  question?: string;
}): MedClawWorkflow {
  const startUrl = params.url.trim();
  if (!startUrl) {
    throw new Error("url required for article workflow");
  }
  return {
    site: "article",
    title: "Journal Article Workflow",
    goal: "Review journal article pages with compact metadata and abstract extraction.",
    startUrl,
    snapshotMode: "efficient",
    extractFields: ["source", "date", "title", "summary", "doi"],
    outputColumns: ["Source", "Date", "Title", "Summary", "DOI"],
    notes: [
      params.topic?.trim()
        ? `Topic hint: ${params.topic.trim()}`
        : "Target the article metadata and abstract first.",
      params.question?.trim()
        ? `Question focus: ${params.question.trim()}`
        : "Prefer abstract or summary text before full-body browsing.",
    ],
  };
}

export function buildMedicalSiteWorkflow(params: {
  url: string;
  topic?: string;
  question?: string;
}): MedClawWorkflow {
  const startUrl = params.url.trim();
  if (!startUrl) {
    throw new Error("url required for medical site workflow");
  }
  return {
    site: "medicalsite",
    title: "Medical Site Workflow",
    goal: "Review medical portal pages with compact title, date, and summary extraction.",
    startUrl,
    snapshotMode: "efficient",
    extractFields: ["source", "date", "title", "summary", "url"],
    outputColumns: ["Source", "Date", "Title", "Summary", "URL"],
    notes: [
      params.topic?.trim()
        ? `Topic hint: ${params.topic.trim()}`
        : "Capture the core article or guideline summary.",
      params.question?.trim()
        ? `Question focus: ${params.question.trim()}`
        : "Prefer structured summaries over long page transcripts.",
    ],
  };
}

export function buildClinicalTrialsWorkflow(params: {
  condition?: string;
  term?: string;
  status?: string;
  phase?: string;
  country?: string;
}): MedClawWorkflow {
  if (!params.condition?.trim() && !params.term?.trim()) {
    throw new Error("condition or term required for ClinicalTrials workflow");
  }
  const url = new URL("https://clinicaltrials.gov/search");
  if (params.condition?.trim()) {
    url.searchParams.set("cond", params.condition.trim());
  }
  if (params.term?.trim()) {
    url.searchParams.set("term", params.term.trim());
  }
  const filters: string[] = [];
  if (params.status?.trim()) {
    filters.push(`overallStatus:${params.status.trim()}`);
  }
  if (params.phase?.trim()) {
    filters.push(`phase:${params.phase.trim()}`);
  }
  if (filters.length) {
    url.searchParams.set("aggFilters", filters.join(","));
  }
  if (params.country?.trim()) {
    url.searchParams.set("country", params.country.trim());
  }
  return {
    site: "clinicaltrials",
    title: "ClinicalTrials.gov Workflow",
    goal: "Retrieve trial registry entries with compact operational metadata extraction.",
    startUrl: url.toString(),
    snapshotMode: "efficient",
    extractFields: [
      "NCT ID",
      "title",
      "recruitment status",
      "phase",
      "conditions",
      "interventions",
      "sponsor",
      "locations",
      "primary completion date",
    ],
    outputColumns: ["NCT ID", "Status", "Phase", "Title", "Why relevant"],
    notes: [
      "Registry status should remain explicit in the final answer.",
      "Do not infer efficacy from registration records alone.",
    ],
  };
}

export function buildGuidelineWorkflow(params: {
  url: string;
  organization?: string;
  topic?: string;
  question?: string;
}): MedClawWorkflow {
  const startUrl = params.url.trim();
  if (!startUrl) {
    throw new Error("url required for guideline workflow");
  }
  return {
    site: "guideline",
    title: "Guideline Review Workflow",
    goal: "Review guideline pages while preserving source attribution and recommendation strength.",
    startUrl,
    snapshotMode: "efficient",
    extractFields: [
      "organization",
      "guideline title",
      "publication date",
      "section title",
      "recommendation summary",
      "strength/grade",
    ],
    outputColumns: ["Source", "Date", "Section", "Recommendation summary", "Strength/grade"],
    notes: [
      params.organization?.trim()
        ? `Organization hint: ${params.organization.trim()}`
        : "Organization should be captured from page metadata or title.",
      params.topic?.trim() ? `Topic hint: ${params.topic.trim()}` : "Topic should remain explicit.",
      params.question?.trim()
        ? `Question focus: ${params.question.trim()}`
        : "Prefer recommendation statements over general commentary.",
    ],
  };
}
