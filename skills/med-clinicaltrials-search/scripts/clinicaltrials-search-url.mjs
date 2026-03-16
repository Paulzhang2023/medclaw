#!/usr/bin/env node

const args = process.argv.slice(2);

function readFlag(name) {
  const index = args.indexOf(name);
  if (index === -1) {
    return "";
  }
  return args[index + 1] ?? "";
}

const condition = readFlag("--condition").trim();
const term = readFlag("--term").trim();
const status = readFlag("--status").trim();
const phase = readFlag("--phase").trim();
const country = readFlag("--country").trim();

if (!condition && !term) {
  process.stderr.write(
    'Usage: node clinicaltrials-search-url.mjs --condition "..." [--term ...] [--status ...] [--phase ...] [--country ...]\n',
  );
  process.exit(1);
}

const url = new URL("https://clinicaltrials.gov/search");
if (condition) {
  url.searchParams.set("cond", condition);
}
if (term) {
  url.searchParams.set("term", term);
}
if (status) {
  url.searchParams.set("aggFilters", `overallStatus:${status}`);
}
if (phase) {
  const current = url.searchParams.get("aggFilters");
  url.searchParams.set("aggFilters", [current, `phase:${phase}`].filter(Boolean).join(","));
}
if (country) {
  url.searchParams.set("country", country);
}

process.stdout.write(`${url.toString()}\n`);
