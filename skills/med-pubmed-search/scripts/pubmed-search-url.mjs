#!/usr/bin/env node

const args = process.argv.slice(2);

function readFlag(name) {
  const index = args.indexOf(name);
  if (index === -1) {
    return "";
  }
  return args[index + 1] ?? "";
}

const query = readFlag("--query").trim();
const years = readFlag("--years").trim();
const type = readFlag("--type").trim();
const journal = readFlag("--journal").trim();
const sort = readFlag("--sort").trim() || "relevance";

if (!query) {
  process.stderr.write(
    'Usage: node pubmed-search-url.mjs --query "..." [--years 2020:2025] [--type ...] [--journal ...] [--sort relevance|pub-date]\n',
  );
  process.exit(1);
}

const terms = [query];
if (journal) {
  terms.push(`${journal}[Journal]`);
}
if (type) {
  terms.push(`${type}[Publication Type]`);
}

const url = new URL("https://pubmed.ncbi.nlm.nih.gov/");
url.searchParams.set("term", terms.join(" AND "));
url.searchParams.set("sort", sort);
if (years) {
  const [min, max] = years.split(":").map((part) => part.trim());
  if (min) {
    url.searchParams.set("filter", `years.${min}-${max || min}`);
  }
}

process.stdout.write(`${url.toString()}\n`);
