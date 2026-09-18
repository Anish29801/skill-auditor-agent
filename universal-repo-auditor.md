---
id: universal-repo-auditor
name: Universal Repo Auditor & Documentation Engine
version: 1.2.0
compatibility: [linux, darwin, win32, container]
dependencies: [python>=3.10, pyyaml]
---

# SYSTEM PROMPT: TECHNICAL REPOSITORY AUDITOR & DOCUMENTATION ENGINE

You are a technical documentation agent that extracts repo architecture,
configuration state, and operational skills, and converts them into structured
Markdown documentation with an architectural explanation.

## Core Operational Workflow

### 1. Ingestion & Remote Repository Acquisition
- If invoked with a remote Git or GitHub URL and no directory or folder is given,
  download/clone the repository into the current folder (`./<repo_name>`).
- Walk the repository root, collecting `.yml`, `.yaml`, and `.md` files.
- Skip vendor/build noise: `.git`, `node_modules`, `.venv`/`venv`,
  `dist`, `build`, `.next`, `.turbo`, `__pycache__`, `.cache`, `coverage`,
  `out`, `.netlify`, `.pytest_cache`, `.ruff_cache`, `.mypy_cache`, `converted_md`.
- Never hallucinate a field's meaning. If a YAML file has a key outside the
  known schema (`id`, `name`, `description`, `inputs`, `outputs`, `prompt`,
  `tools`), log the key and its raw Python type — do not guess its function.
- Files that fail to decode as UTF-8 or fail YAML parsing are logged and
  skipped, not fatal to the run.

### 2. Format Inversion Rules (YAML → Markdown)
- Each `.yaml` / `.yml` file is converted into clean Markdown documentation:
  - Identity fields: `id`, `name`, `description` as clear metadata headers.
  - `inputs` / `outputs` render as Markdown tables: `Name | Type | Required | Description`.
  - `required: true` renders as **Yes**; anything else renders as `No`.
  - `tools` renders as a comma-separated list of inline-coded values.
  - `prompt` (or any large string field) renders inside a syntax-fenced ` ```text ` block
    to preserve internal formatting.
- Can emit individual converted `.md` files corresponding to each YAML configuration.

### 3. Repository Explanation & Synthesis Mapping
- Generate a comprehensive **Repository Overview & Architecture Explanation**:
  - Purpose, architectural role, and domain mission.
  - Inventory of detected agent skills and capabilities.
  - Tool dependencies and ecosystem integrations.
  - End-to-end operational execution flow.
- Emit a unified `SKILLS_OVERVIEW.md` containing:
  1. Repository Overview & Architectural Explanation
  2. Global Architecture Matrix (Path, Extension, Scope)
  3. Per-component rendered documentation breakdown.

## Response Guidelines
- No pleasantries, no status logs, in the generated document itself.
- Output must be valid Markdown, ready for static deployment.

---

## EXECUTOR_RUNTIME_MARKER
```python
#!/usr/bin/env python3
"""Repository auditor: extracts skill/config metadata from YAML files,
explains repository architecture, converts YAML to Markdown, and emits SKILLS_OVERVIEW.md."""
from __future__ import annotations

import argparse
import logging
from pathlib import Path
import re
import subprocess
from typing import Any

import yaml

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
log = logging.getLogger("repo-auditor")

EXCLUDED_DIRS = {
    ".git", ".hg", ".svn", "node_modules", "__pycache__", ".venv", "venv",
    "dist", "build", ".next", ".turbo", ".cache", "coverage", "out",
    ".netlify", ".pytest_cache", ".ruff_cache", ".mypy_cache", "converted_md",
}
OUTPUT_FILENAME = "SKILLS_OVERVIEW.md"


def is_remote_repo_url(target: str) -> bool:
    """Check if the provided target string is a Git/GitHub URL."""
    target = target.strip()
    return (
        target.startswith(("http://", "https://", "git@", "ssh://"))
        or target.endswith(".git")
        or bool(re.match(r"^github\.com/[\w\-]+/[\w\-]+", target))
    )


def resolve_target_dir(target_arg: str | Path | None, destination: Path | None = None) -> Path:
    """Resolve target path. If target is a remote git/github URL, clone it into current dir."""
    if not target_arg or str(target_arg).strip() in (".", ""):
        return Path.cwd()

    target_str = str(target_arg).strip()
    if is_remote_repo_url(target_str):
        if not target_str.startswith(("http://", "https://", "git@", "ssh://")):
            clone_url = f"https://{target_str}"
        else:
            clone_url = target_str

        repo_name = clone_url.rstrip("/").split("/")[-1]
        if repo_name.endswith(".git"):
            repo_name = repo_name[:-4]

        dest_dir = destination or (Path.cwd() / repo_name)
        if dest_dir.exists() and any(dest_dir.iterdir()):
            log.info("Target directory %s already exists. Reusing existing folder.", dest_dir)
            return dest_dir

        dest_dir.parent.mkdir(parents=True, exist_ok=True)
        log.info("Downloading/cloning repository from %s into %s ...", clone_url, dest_dir)
        try:
            subprocess.run(["git", "clone", "--depth", "1", clone_url, str(dest_dir)], check=True)
        except (subprocess.SubprocessError, OSError) as err:
            log.error("Failed to clone %s: %s", clone_url, err)
            raise
        return dest_dir

    return Path(target_arg).resolve()


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


def generate_repo_explanation(
    root: Path,
    entries: list[tuple[str, str, str]],
    yaml_docs: list[tuple[str, dict[str, Any]]],
    md_docs: list[tuple[str, str]],
) -> list[str]:
    """Generate a high-level architectural overview and explanation of the repository."""
    repo_name = root.name if root.name else "Repository"
    num_configs = len(yaml_docs)
    num_docs = len(md_docs)
    total_files = len(entries)

    all_tools: set[str] = set()
    skill_names: list[str] = []
    for rel_path, data in yaml_docs:
        name = data.get("name") or data.get("id") or Path(rel_path).stem
        skill_names.append(str(name))
        tools = data.get("tools")
        if tools:
            if isinstance(tools, list):
                all_tools.update(str(t) for t in tools if t)
            else:
                all_tools.add(str(tools))

    lines = [
        "## Repository Overview & Architecture Explanation\n",
        f"**Repository**: `{repo_name}`  ",
        f"**Path**: `{root.as_posix()}`  ",
        f"**Audited Components**: {total_files} items ({num_configs} YAML configurations, {num_docs} Markdown documents).\n",
        "### Architectural Role & Mission",
        f"This repository hosts agent capability manifests, operational skills, and documentation specifications. "
        f"It establishes standardized interface contracts (typed inputs, validated outputs, and syntax-fenced prompts) "
        f"to enable reproducible autonomous execution across agent ecosystems.\n",
    ]

    if skill_names:
        lines.append("### Key Skills & Capabilities")
        for s in skill_names[:15]:
            lines.append(f"- **{s}**")
        if len(skill_names) > 15:
            lines.append(f"- _...and {len(skill_names) - 15} more skills_")
        lines.append("")

    if all_tools:
        lines.append("### Tool Dependencies & Integrations")
        tool_pills = ", ".join(f"`{t}`" for t in sorted(all_tools))
        lines.append(f"The skills in this repository invoke the following integrated tools: {tool_pills}.\n")

    lines.append("### Operational Execution Flow")
    lines.append(
        "1. **Discovery**: Scans directories for YAML configurations and Markdown guidance while filtering build caches.\n"
        "2. **Schema Inversion**: Extracts structured identity parameters and input/output contracts into markdown tables.\n"
        "3. **Synthesis**: Emits comprehensive overview documentation and converted markdown specifications.\n"
    )

    return lines


def convert_yaml_to_md(yaml_path: Path, output_dir: Path | None = None, root: Path | None = None) -> Path:
    """Convert a single YAML/YML skill/config file into a standalone .md file."""
    content = read_text_safely(yaml_path)
    if content is None:
        raise ValueError(f"Could not read {yaml_path}")

    try:
        data = yaml.safe_load(content) or {}
    except yaml.YAMLError as exc:
        raise ValueError(f"Malformed YAML in {yaml_path}: {exc}") from exc

    if not isinstance(data, dict):
        raise ValueError(f"Non-mapping YAML in {yaml_path}")

    rel_name = yaml_path.name
    rel_path_str = yaml_path.relative_to(root).as_posix() if root else rel_name
    title = data.get("name") or data.get("id") or yaml_path.stem

    lines = [
        f"# {title}\n",
        f"> Converted from `{rel_path_str}` by Universal Repo Auditor.\n",
    ]
    lines += render_yaml_doc(rel_path_str, data)

    md_filename = f"{yaml_path.stem}.md"
    if output_dir:
        out_file = output_dir / md_filename
    else:
        out_file = yaml_path.with_suffix(".md")

    out_file.parent.mkdir(parents=True, exist_ok=True)
    out_file.write_text("\n".join(lines), encoding="utf-8")
    return out_file


def convert_yaml_files_to_md(root: Path, output_dir: Path | None = None) -> list[Path]:
    """Recursively convert all YAML/YML files found under root into Markdown documents."""
    generated: list[Path] = []
    for path in sorted(iter_target_files(root)):
        if path.suffix in (".yml", ".yaml"):
            try:
                target_out_dir = None
                if output_dir:
                    rel_parent = path.relative_to(root).parent
                    target_out_dir = output_dir / rel_parent
                md_path = convert_yaml_to_md(path, output_dir=target_out_dir, root=root)
                generated.append(md_path)
                log.info("Converted %s -> %s", path.name, md_path)
            except ValueError as exc:
                log.warning("Skipping conversion of %s: %s", path, exc)
    return generated


def extract_and_run(
    root_dir: str | Path = ".",
    output_dir: str | Path | None = None,
    destination: str | Path | None = None,
    convert_all: bool = False,
) -> Path:
    dest_path = Path(destination).resolve() if destination else None
    root = resolve_target_dir(root_dir, destination=dest_path)
    out_path = (Path(output_dir).resolve() if output_dir else root) / OUTPUT_FILENAME
    out_path.parent.mkdir(parents=True, exist_ok=True)

    matrix_entries: list[tuple[str, str, str]] = []
    body: list[str] = []
    yaml_docs: list[tuple[str, dict[str, Any]]] = []
    md_docs: list[tuple[str, str]] = []

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
            yaml_docs.append((rel_posix, data))
            body += render_yaml_doc(rel_posix, data)
        else:
            matrix_entries.append((rel_posix, path.suffix, "Documentation guidelines"))
            md_docs.append((rel_posix, content))
            body += render_md_doc(rel_posix, content)

    explanation = generate_repo_explanation(root, matrix_entries, yaml_docs, md_docs)
    lines = ["# SKILLS_OVERVIEW\n"] + explanation + build_matrix(matrix_entries) + body
    out_path.write_text("\n".join(lines), encoding="utf-8")
    log.info("Generated %s with %d entries.", out_path, len(matrix_entries))

    if convert_all:
        converted_dir = (Path(output_dir).resolve() if output_dir else root) / "converted_md"
        converted = convert_yaml_files_to_md(root, output_dir=converted_dir)
        log.info("Converted %d YAML files to Markdown in %s", len(converted), converted_dir)

    return out_path


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Audit a repo, convert YAML to Markdown, explain architecture, and generate SKILLS_OVERVIEW.md"
    )
    parser.add_argument("root", nargs="?", default=".", help="Repository root or remote Git/GitHub URL to scan")
    parser.add_argument("destination", nargs="?", default=None, help="Destination directory if cloning a remote repository")
    parser.add_argument("-o", "--output-dir", default=None, help="Directory for SKILLS_OVERVIEW.md (default: root)")
    parser.add_argument("-c", "--convert-all", action="store_true", help="Convert all YAML/YML files to individual .md files")
    args = parser.parse_args()
    extract_and_run(args.root, output_dir=args.output_dir, destination=args.destination, convert_all=args.convert_all)


if __name__ == "__main__":
    main()
```

