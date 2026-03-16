#!/usr/bin/env node

import {
  buildGuidelineWorkflow,
  parseScriptOptions,
  printWorkflow,
  readWorkflowFlag,
} from "../../../scripts/medclaw/site-workflows.mjs";

const args = process.argv.slice(2);

const workflow = buildGuidelineWorkflow({
  organization: readWorkflowFlag(args, "--organization"),
  topic: readWorkflowFlag(args, "--topic"),
  question: readWorkflowFlag(args, "--question"),
  url: readWorkflowFlag(args, "--url"),
});

printWorkflow(workflow, parseScriptOptions(args));
