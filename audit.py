#!/usr/bin/env python3
"""Repository auditor: extracts skill/config metadata from YAML files and
doc content from Markdown files, and emits SKILLS_OVERVIEW.md."""
from __future__ import annotations

import argparse
import logging
from pathlib import Path
from typing import Any

import yaml

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
log = logging.getLogger("repo-auditor")

EXCLUDED_DIRS = {
    ".git", ".hg", ".svn", "node_modules", "__pycache__", ".venv", "venv",
    "dist", "build", ".next", ".turbo", ".cache", "coverage",
}
OUTPUT_FILENAME = "SKILLS_OVERVIEW.md"


def iter_target_files(root: Path):
    for path in root.rglob("*"):
        if path.is_dir():
            continue
        if any(part in EXCLUDED_DIRS for part in path.parts):
            continue
        if path.name == OUTPUT_FILENAME:
            continue
        if path.suffix in (".yml", ".yaml", ".md"):
            yield path


def read_text_safely(path: Path) -> str | None:
    try:
        return path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError) as exc:
        log.warning("Skipping %s (%s)", path, exc)
        return None


def render_io_table(rows: Any, heading: str) -> list[str]:
    """Render an inputs/outputs block as a Markdown table.

    Accepts a list of {name, type, required, description} dicts, or a dict
    keyed by field name with the same shape as values. Anything else is
    logged as an unmapped schema shape rather than guessed at.
    """
    if not rows:
        return []
    normalized: list[dict[str, Any]] = []
    if isinstance(rows, dict):
        for name, spec in rows.items():
            spec = spec if isinstance(spec, dict) else {}
            normalized.append({"name": name, **spec})
    elif isinstance(rows, list):
        normalized = [r for r in rows if isinstance(r, dict)]
    else:
        return [f"> Unmapped `{heading.lower()}` schema — raw type `{type(rows).__name__}`, left unparsed.\n"]

    lines = [f"### {heading}\n", "| Name | Type | Required | Description |", "| :--- | :--- | :--- | :--- |"]
    for row in normalized:
        name = row.get("name", "—")
        rtype = row.get("type", "—")
        required = "**Yes**" if row.get("required") else "No"
        desc = row.get("description", "—")
        lines.append(f"| `{name}` | `{rtype}` | {required} | {desc} |")
    lines.append("")
    return lines


def render_yaml_doc(rel_path: str, data: dict[str, Any]) -> list[str]:
    lines = [f"## `{rel_path}`\n"]
    for key in ("id", "name", "description"):
        if key in data:
            lines.append(f"- **{key.capitalize()}**: {data[key]}")
    lines.append("")

    lines += render_io_table(data.get("inputs"), "Inputs")
    lines += render_io_table(data.get("outputs"), "Outputs")

    if "tools" in data:
        tools = data["tools"]
        tool_list = tools if isinstance(tools, list) else [tools]
        lines.append("**Tools:** " + ", ".join(f"`{t}`" for t in tool_list) + "\n")

    if isinstance(data.get("prompt"), str):
        lines += ["**Prompt:**\n", "```text", data["prompt"].strip(), "```\n"]

    known_keys = {"id", "name", "description", "inputs", "outputs", "tools", "prompt"}
    for key, value in data.items():
        if key not in known_keys:
            lines.append(f"> Unmapped field `{key}` — raw type `{type(value).__name__}`, logged without interpretation.")
    lines.append("")
    return lines


def render_md_doc(rel_path: str, content: str) -> list[str]:
    first_line = next((l.strip() for l in content.splitlines() if l.strip()), "(empty)")
    return [
        f"## `{rel_path}`\n",
        "- **Type**: Documentation guidelines",
        f"- **Preview**: {first_line[:120]}",
        "",
    ]


def build_matrix(entries: list[tuple[str, str, str]]) -> list[str]:
    lines = ["## Global Architecture Matrix\n", "| File Path | Extension | Scope |", "| :--- | :--- | :--- |"]
    for rel_path, suffix, scope in entries:
        lines.append(f"| `{rel_path}` | `{suffix}` | {scope} |")
    lines.append("")
    return lines


def extract_and_run(root_dir: str | Path, output_dir: str | Path | None = None) -> Path:
    root = Path(root_dir).resolve()
    out_path = (Path(output_dir).resolve() if output_dir else root) / OUTPUT_FILENAME

    matrix_entries: list[tuple[str, str, str]] = []
    body: list[str] = []

    for path in sorted(iter_target_files(root)):
        rel = path.relative_to(root)
        rel_posix = rel.as_posix()
        content = read_text_safely(path)
        if content is None:
            continue

        if path.suffix in (".yml", ".yaml"):
            try:
                data = yaml.safe_load(content) or {}
            except yaml.YAMLError as exc:
                log.warning("Malformed YAML in %s: %s", rel_posix, exc)
                matrix_entries.append((rel_posix, path.suffix, "Malformed configuration — skipped"))
                continue
            if not isinstance(data, dict):
                matrix_entries.append((rel_posix, path.suffix, "Non-mapping YAML root — skipped"))
                continue
            matrix_entries.append((rel_posix, path.suffix, "Structured configuration schema"))
            body += render_yaml_doc(rel_posix, data)
        else:
            matrix_entries.append((rel_posix, path.suffix, "Documentation guidelines"))
            body += render_md_doc(rel_posix, content)

    lines = ["# SKILLS_OVERVIEW\n"] + build_matrix(matrix_entries) + body
    out_path.write_text("\n".join(lines), encoding="utf-8")
    log.info("Generated %s with %d entries.", out_path, len(matrix_entries))
    return out_path


def main() -> None:
    parser = argparse.ArgumentParser(description="Audit a repo and generate SKILLS_OVERVIEW.md")
    parser.add_argument("root", nargs="?", default=".", help="Repository root to scan")
    parser.add_argument("-o", "--output-dir", default=None, help="Directory for SKILLS_OVERVIEW.md (default: root)")
    args = parser.parse_args()
    extract_and_run(args.root, args.output_dir)


if __name__ == "__main__":
    main()
