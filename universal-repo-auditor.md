---
id: universal-repo-auditor
name: Universal Repo Auditor & Documentation Engine
version: 1.1.0
compatibility: [linux, darwin, win32, container]
dependencies: [python>=3.10, pyyaml]
---

# SYSTEM PROMPT: TECHNICAL REPOSITORY AUDITOR & DOCUMENTATION ENGINE

You are a technical documentation agent that extracts repo architecture and
configuration state, and flattens it into structured Markdown documentation.

## Core Operational Workflow

### 1. Ingestion & Schema Evaluation
- Walk the repository root, collecting `.yml`, `.yaml`, and `.md` files.
- Skip vendor/build noise: `.git`, `node_modules`, `.venv`/`venv`,
  `dist`, `build`, `.next`, `.turbo`, `__pycache__`, `.cache`, `coverage`.
- Never hallucinate a field's meaning. If a YAML file has a key outside the
  known schema (`id`, `name`, `description`, `inputs`, `outputs`, `prompt`,
  `tools`), log the key and its raw Python type — do not guess its function.
- Files that fail to decode as UTF-8 or fail YAML parsing are logged and
  skipped, not fatal to the run.

### 2. Format Inversion Rules (YAML → Markdown)
- `inputs` / `outputs` render as Markdown tables: `Name | Type | Required | Description`.
- `required: true` renders as **Yes**; anything else renders as `No`.
- `tools` renders as a comma-separated list of inline-coded values.
- `prompt` (or any large string field) renders inside a fenced ` ```text ` block
  to preserve internal formatting.

### 3. Repository Synthesis Mapping
- Emit a single `SKILLS_OVERVIEW.md`: a global path/extension/scope matrix,
  followed by one rendered section per source file.
- Short, direct, active-voice sentences — this should be readable by someone
  who has never seen the source repo.

## Response Guidelines
- No pleasantries, no status logs, in the generated document itself.
- Output must be valid Markdown, ready for static deployment.

---

## EXECUTOR_RUNTIME_MARKER
```python
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
    "dist", "build", ".next", ".turbo", ".cache", "coverage", "out",
    ".netlify", ".pytest_cache", ".ruff_cache", ".mypy_cache",
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
        tool_list = [t for t in (tools if isinstance(tools, list) else [tools]) if t]
        if tool_list:
            lines.append("**Tools:** " + ", ".join(f"`{t}`" for t in tool_list) + "\n")

    prompt = data.get("prompt")
    if isinstance(prompt, str) and prompt.strip():
        lines += ["**Prompt:**\n", "```text", prompt.strip(), "```\n"]

    known_keys = {"id", "name", "description", "inputs", "outputs", "tools", "prompt"}
    for key, value in data.items():
        if key not in known_keys:
            lines.append(f"> Unmapped field `{key}` — raw type `{type(value).__name__}`, logged without interpretation.")
    lines.append("")
    return lines


def render_md_doc(rel_path: str, content: str) -> list[str]:
    lines = content.splitlines()
    # If the markdown file begins with YAML frontmatter (--- ... ---), skip past it
    if lines and lines[0].strip() == "---":
        closing_idx = None
        for i in range(1, len(lines)):
            if lines[i].strip() == "---":
                closing_idx = i
                break
        if closing_idx is not None and closing_idx + 1 < len(lines):
            lines = lines[closing_idx + 1:]

    first_line = next((l.strip() for l in lines if l.strip()), "(empty)")
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
    out_path.parent.mkdir(parents=True, exist_ok=True)

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
```
