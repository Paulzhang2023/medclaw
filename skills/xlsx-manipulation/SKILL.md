---
name: "xlsx-manipulation"
description: "Use when tasks focus on creating, editing, formatting, or validating local Excel `.xlsx` workbooks with `openpyxl`, including formulas, charts, styles, and sheet structure changes."
---

# XLSX Manipulation

## When to use

- Create a new `.xlsx` workbook with formulas, styling, validation, or charts.
- Modify an existing workbook while preserving sheet structure and formatting.
- Apply targeted Excel changes such as widths, merges, conditional formatting, number formats, or named ranges.
- Build polished workbooks where layout and native Excel behavior matter more than raw data analysis.

## Workflow

1. Confirm whether the task is create, edit, or inspect.
2. Prefer `openpyxl` for `.xlsx` workbooks so formulas, styles, charts, and validations remain native to Excel.
3. Read the workbook structure first: sheet names, key ranges, formulas, merged cells, and existing formatting.
4. Make narrow edits rather than rebuilding whole sheets unless the user asks for a redesign.
5. Save to a stable output path and keep the original file untouched unless the user asked for an in-place update.
6. If a task is mainly analysis across tabular data, consider using `$spreadsheet` alongside this skill.

## Core practices

- Use `load_workbook()` for existing files and `Workbook()` for new ones.
- Preserve formulas instead of replacing them with hardcoded values.
- Use explicit number formats for currency, percentages, and dates.
- Match surrounding styles when inserting new rows or cells into an existing workbook.
- Use `openpyxl.chart` for native Excel charts when charts need to remain editable in Excel.
- Use conditional formatting and data validation sparingly and intentionally.

## Common patterns

- Open workbook: `wb = load_workbook(path)`
- Active sheet: `ws = wb.active`
- Target by cell: `ws["B2"] = 42`
- Target by coordinates: `ws.cell(row=2, column=2, value=42)`
- Append rows: `ws.append([...])`
- Save workbook: `wb.save(output_path)`

## Libraries

- Primary: `openpyxl`
- Optional for supporting analysis before writing back: `pandas`

## Notes

- `openpyxl` preserves formulas but does not calculate them.
- Prefer editing `.xlsx` files only. For `.csv` / `.tsv` analysis or broader statistics workflows, use `$spreadsheet` or `$ai-data-analysis`.
