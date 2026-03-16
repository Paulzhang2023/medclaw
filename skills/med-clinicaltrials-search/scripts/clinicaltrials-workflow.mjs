#!/usr/bin/env node

import {
  buildClinicalTrialsWorkflow,
  parseScriptOptions,
  printWorkflow,
  readWorkflowFlag,
} from "../../../scripts/medclaw/site-workflows.mjs";

const args = process.argv.slice(2);

try {
  const workflow = buildClinicalTrialsWorkflow({
    condition: readWorkflowFlag(args, "--condition"),
    term: readWorkflowFlag(args, "--term"),
    status: readWorkflowFlag(args, "--status"),
    phase: readWorkflowFlag(args, "--phase"),
    country: readWorkflowFlag(args, "--country"),
  });
  printWorkflow(workflow, parseScriptOptions(args));
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
