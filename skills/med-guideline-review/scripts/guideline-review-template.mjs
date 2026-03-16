#!/usr/bin/env node

const args = process.argv.slice(2);

function readFlag(name) {
  const index = args.indexOf(name);
  if (index === -1) {
    return "";
  }
  return args[index + 1] ?? "";
}

const organization = readFlag("--organization").trim() || "Unknown organization";
const topic = readFlag("--topic").trim() || "Unknown topic";
const question = readFlag("--question").trim() || "Guideline review question not specified";
const url = readFlag("--url").trim() || "";

const output = `# Guideline Review Worksheet

## Source

- Organization: ${organization}
- Topic: ${topic}
${url ? `- URL: ${url}` : "- URL: "}

## Review question

${question}

## Fields to extract

- Guideline title
- Version or update date
- Recommendation section
- Recommendation summary
- Recommendation strength
- Evidence grade
- Notes on scope limits

## Comparison notes

- Agreement with other guideline sources:
- Important disagreement:
- Missing strength/grade information:
`;

process.stdout.write(output);
