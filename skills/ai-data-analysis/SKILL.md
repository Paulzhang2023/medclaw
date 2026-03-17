---
name: "ai-data-analysis"
description: "Use when tasks involve local CSV, TSV, Excel, or JSON data profiling, cleaning, summary statistics, chart generation, Markdown reporting, or optionally running local SAS programs from Codex."
---

# AI Data Analysis

## When to use

- Profile a local dataset and generate a Markdown summary report.
- Clean tabular data and export normalized CSV, TSV, JSON, or XLSX files.
- Produce quick charts from numeric columns.
- Work from local `.csv`, `.tsv`, `.xlsx`, `.xls`, or JSON data files.
- Run a local `.sas` program if the machine has a `sas` executable available.

## Workflow

1. Identify the source file type and the desired output.
2. Prefer the bundled script at `scripts/data_analysis.py` for repeatable profiling, cleaning, charting, and SAS execution.
3. For profiling, save a Markdown report so the results are easy to review in-chat or on disk.
4. For cleaning, write to a new output path unless the user explicitly asked to overwrite.
5. If the user requests SAS and a local `sas` binary exists, run the `.sas` program through the script and capture its log and listing output.
6. If `sas` is not installed, say so clearly and fall back to Python/pandas analysis when possible.

## Script entrypoints

- Profile data:
  `python3 scripts/data_analysis.py analyze --file data.xlsx --output report.md`
- Clean data:
  `python3 scripts/data_analysis.py clean --file data.csv --output cleaned.xlsx`
- Create a chart:
  `python3 scripts/data_analysis.py chart --file data.csv --column revenue --output revenue.png`
- Run SAS:
  `python3 scripts/data_analysis.py run-sas --program analysis.sas --outdir sas-output`

## File support

- Inputs: `.csv`, `.tsv`, `.xlsx`, `.xls`, `.json`
- Cleaned outputs: `.csv`, `.tsv`, `.xlsx`, `.json`
- Reports: Markdown
- Charts: `.png`

## Dependencies

- Required: `pandas`, `openpyxl`
- Optional: `matplotlib`
- Optional for SAS execution: local `sas` CLI available on `PATH` or passed via `--sas-executable`

## SAS notes

- The script assumes a command-line SAS installation that accepts flags such as `-sysin`, `-log`, and `-print`.
- SAS launch conventions differ by environment. If the local installation uses different flags or wrappers, inspect `sas -help` and adapt the command.
- This skill does not install SAS; it only orchestrates a local installation if one already exists.
