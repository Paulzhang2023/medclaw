#!/usr/bin/env python3
"""Profile, clean, chart, and optionally run local SAS programs."""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import pandas as pd


def read_table(path: Path) -> pd.DataFrame:
    suffix = path.suffix.lower()
    if suffix == ".csv":
        return pd.read_csv(path)
    if suffix == ".tsv":
        return pd.read_csv(path, sep="\t")
    if suffix in {".xlsx", ".xls"}:
        return pd.read_excel(path)
    if suffix == ".json":
        return pd.read_json(path)
    raise ValueError(f"Unsupported input format: {path.suffix}")


def write_table(df: pd.DataFrame, path: Path) -> None:
    suffix = path.suffix.lower()
    if suffix == ".csv":
        df.to_csv(path, index=False)
        return
    if suffix == ".tsv":
        df.to_csv(path, sep="\t", index=False)
        return
    if suffix in {".xlsx", ".xls"}:
        df.to_excel(path, index=False)
        return
    if suffix == ".json":
        df.to_json(path, orient="records", indent=2)
        return
    raise ValueError(f"Unsupported output format: {path.suffix}")


def markdown_table(df: pd.DataFrame) -> str:
    if df.empty:
        return "(no rows)"
    return df.to_markdown(index=True)


def build_report(df: pd.DataFrame, source: Path) -> str:
    lines = [
        f"# Data Profile: {source.name}",
        "",
        "## Shape",
        "",
        f"- Rows: {len(df)}",
        f"- Columns: {len(df.columns)}",
        "",
        "## Columns",
        "",
        markdown_table(
            pd.DataFrame(
                {
                    "column": df.columns,
                    "dtype": [str(dtype) for dtype in df.dtypes],
                    "missing": [int(df[col].isna().sum()) for col in df.columns],
                    "non_null": [int(df[col].notna().sum()) for col in df.columns],
                }
            )
        ),
        "",
        "## Preview",
        "",
        markdown_table(df.head(10)),
    ]

    numeric_df = df.select_dtypes(include="number")
    if not numeric_df.empty:
        lines.extend(
            [
                "",
                "## Numeric Summary",
                "",
                markdown_table(numeric_df.describe().transpose()),
            ]
        )

    categorical = [col for col in df.columns if col not in numeric_df.columns]
    if categorical:
        top_rows = []
        for col in categorical[:10]:
            series = df[col].dropna().astype(str)
            if series.empty:
                top_value = ""
                top_count = 0
            else:
                counts = series.value_counts().head(1)
                top_value = counts.index[0]
                top_count = int(counts.iloc[0])
            top_rows.append(
                {
                    "column": col,
                    "unique": int(df[col].nunique(dropna=True)),
                    "top_value": top_value,
                    "top_count": top_count,
                }
            )
        lines.extend(
            [
                "",
                "## Categorical Summary",
                "",
                markdown_table(pd.DataFrame(top_rows)),
            ]
        )

    return "\n".join(lines) + "\n"


def clean_frame(df: pd.DataFrame) -> pd.DataFrame:
    cleaned = df.drop_duplicates().copy()
    cleaned = cleaned.ffill().bfill()
    return cleaned


def create_chart(df: pd.DataFrame, column: str, output: Path, kind: str) -> None:
    try:
        if "MPLCONFIGDIR" not in os.environ:
            os.environ["MPLCONFIGDIR"] = tempfile.mkdtemp(prefix="mplconfig-")
        import matplotlib.pyplot as plt
    except ModuleNotFoundError as exc:
        raise RuntimeError("matplotlib is required for chart generation") from exc

    if column not in df.columns:
        raise ValueError(f"Column not found: {column}")

    series = df[column].dropna()
    if series.empty:
        raise ValueError(f"Column has no non-null values: {column}")

    plt.figure(figsize=(10, 6))
    if kind == "hist":
        series.plot(kind="hist", bins=20, title=f"{column} distribution")
    else:
        numeric = pd.to_numeric(series, errors="coerce").dropna()
        if numeric.empty:
            raise ValueError(f"Column is not numeric enough for {kind}: {column}")
        if kind == "line":
            numeric.reset_index(drop=True).plot(kind="line", title=column)
        elif kind == "bar":
            numeric.head(20).plot(kind="bar", title=column)
        else:
            raise ValueError(f"Unsupported chart kind: {kind}")
    plt.tight_layout()
    output.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output, dpi=144)
    plt.close()


def run_sas(program: Path, outdir: Path, sas_executable: str | None, extra_args: list[str]) -> subprocess.CompletedProcess[str]:
    executable = sas_executable or shutil.which("sas")
    if not executable:
        raise RuntimeError("No SAS executable found. Install SAS or pass --sas-executable.")

    outdir.mkdir(parents=True, exist_ok=True)
    log_path = outdir / f"{program.stem}.log"
    listing_path = outdir / f"{program.stem}.lst"

    cmd = [
        executable,
        "-sysin",
        str(program),
        "-log",
        str(log_path),
        "-print",
        str(listing_path),
        *extra_args,
    ]
    return subprocess.run(cmd, text=True, capture_output=True, check=False)


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)

    analyze = subparsers.add_parser("analyze", help="Generate a Markdown profile report")
    analyze.add_argument("--file", required=True, type=Path)
    analyze.add_argument("--output", required=True, type=Path)

    clean = subparsers.add_parser("clean", help="Clean a table and write it back out")
    clean.add_argument("--file", required=True, type=Path)
    clean.add_argument("--output", required=True, type=Path)

    chart = subparsers.add_parser("chart", help="Generate a quick chart for one column")
    chart.add_argument("--file", required=True, type=Path)
    chart.add_argument("--column", required=True)
    chart.add_argument("--output", required=True, type=Path)
    chart.add_argument("--kind", default="line", choices=["line", "bar", "hist"])

    sas = subparsers.add_parser("run-sas", help="Run a local SAS program if SAS is installed")
    sas.add_argument("--program", required=True, type=Path)
    sas.add_argument("--outdir", required=True, type=Path)
    sas.add_argument("--sas-executable")
    sas.add_argument("--sas-arg", action="append", default=[])

    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)

    try:
        if args.command == "analyze":
            df = read_table(args.file)
            report = build_report(df, args.file)
            args.output.parent.mkdir(parents=True, exist_ok=True)
            args.output.write_text(report, encoding="utf-8")
            print(args.output)
            return 0

        if args.command == "clean":
            df = read_table(args.file)
            cleaned = clean_frame(df)
            args.output.parent.mkdir(parents=True, exist_ok=True)
            write_table(cleaned, args.output)
            print(args.output)
            return 0

        if args.command == "chart":
            df = read_table(args.file)
            create_chart(df, args.column, args.output, args.kind)
            print(args.output)
            return 0

        if args.command == "run-sas":
            result = run_sas(args.program, args.outdir, args.sas_executable, args.sas_arg)
            payload = {
                "returncode": result.returncode,
                "stdout": result.stdout.strip(),
                "stderr": result.stderr.strip(),
                "outdir": str(args.outdir),
            }
            print(json.dumps(payload, indent=2))
            return result.returncode

        raise ValueError(f"Unknown command: {args.command}")
    except Exception as exc:  # pragma: no cover - CLI guard
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
