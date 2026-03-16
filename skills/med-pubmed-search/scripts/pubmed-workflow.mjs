#!/usr/bin/env node

import {
  buildPubMedWorkflow,
  parseScriptOptions,
  printWorkflow,
  readWorkflowFlag,
} from "../../../scripts/medclaw/site-workflows.mjs";

const args = process.argv.slice(2);

try {
  const workflow = buildPubMedWorkflow({
    query: readWorkflowFlag(args, "--query"),
    years: readWorkflowFlag(args, "--years"),
    type: readWorkflowFlag(args, "--type"),
    journal: readWorkflowFlag(args, "--journal"),
    sort: readWorkflowFlag(args, "--sort"),
  });
  printWorkflow(workflow, parseScriptOptions(args));
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
