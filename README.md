# Universal Repo Auditor & Documentation Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![Netlify Status](https://img.shields.io/badge/Netlify-Live_Demo-00C7B7?logo=netlify&logoColor=white)](https://skill-auditor-agent.netlify.app)
[![Tests](https://img.shields.io/badge/tests-19%20passed%20%7C%20100%25-brightgreen.svg)](tests/)
[![ESLint](https://img.shields.io/badge/ESLint-0%20errors-blueviolet.svg)](web/)
[![Next.js](https://img.shields.io/badge/Next.js-16%20Turbopack-black.svg?logo=next.js)](web/)

> 🌐 **Live Interactive Showcase & Web Playground**: **[https://skill-auditor-agent.netlify.app](https://skill-auditor-agent.netlify.app)**

A powerful repository documentation and audit tool for AI agent skills, configurations, and technical documentation. Point it at any local folder or remote Git/GitHub repository, and it automatically indexes, explains, and transforms every skill/config YAML file and Markdown document into a unified, publication-ready `SKILLS_OVERVIEW.md` and standalone `.md` specifications.

Includes:
- **Remote Git Auto-Cloning**: Pass a remote repo URL and it automatically clones into `./<repo_name>` when no directory is specified.
- **YAML to Markdown Converter**: Convert YAML/YML definitions into standalone `.md` specifications with one click or `-c` / `--convert-all`.
- **Repository Architecture Explainer**: Synthesizes an executive overview detailing repository mission, skill rosters, tool integrations, and execution flow.
- **Global Architecture Matrix**: Tabulates file paths, extensions, and operational scopes.
- **Automated Parameter Tables**: Clean tables for `inputs` and `outputs` with types and bolded required flags.
- **Syntax-Fenced Prompts & Tool Badges**: Formatted system prompts and comma-separated inline tool pills.
- **"Log, Don't Guess" Safety**: Unmapped schema keys are safely recorded with their raw Python types without hallucination.

---

## Interactive Web Showcase (Next.js + Netlify)

Explore and test the auditor live in your browser at **[skill-auditor-agent.netlify.app](https://skill-auditor-agent.netlify.app)**:
- **Remote Git Auto-Clone Playground**: Input any Git repository URL to simulate cloning to `./<repo_name>` and auditing with instant feedback.
- **Multi-Tab Preview Engine**:
  - `Visual Preview`: Formatted global matrix, inputs/outputs tables, and prompt blocks.
  - `Raw Overview`: Syntax-highlighted monolithic `SKILLS_OVERVIEW.md` index.
  - `Converted .md Spec`: Clean standalone Markdown specification generated from YAML.
  - `Architecture Explainer`: Executive summary of repository role, skill capabilities, tool integrations, and operational flow.
- **One-Click Downloads**: Download `SKILLS_OVERVIEW.md` or individual converted `${skill}.md` specs directly.
- **Dark / Light Mode**: Sleek developer aesthetic with theme toggle.
- **Detailed Architectural Specs**: Side-by-side comparison of deterministic Python execution vs autonomous LLM agent execution.

---

## Two Ways to Use

### 1. Standalone CLI Script (Deterministic)
The Python script `audit.py` runs locally without requiring an LLM or API keys. Fast, reproducible, and deterministic.

#### Quick Start:
```bash
# 1. Clone the repository
git clone https://github.com/Anish29801/skill-auditor-agent.git
cd skill-auditor-agent

# 2. Install dependencies
pip install -r requirements.txt
# or install as a package:
pip install .
```

#### Run the Auditor:
```bash
# Audit the current directory
python audit.py

# Audit a specific target repository / directory
python audit.py /path/to/target-repo

# Download / clone a remote GitHub repository into the current folder and audit it
python audit.py https://github.com/Anish29801/skill-auditor-agent

# Convert all YAML/YML files into standalone Markdown documents (.md)
python audit.py /path/to/target-repo --convert-all

# Output SKILLS_OVERVIEW.md and converted files to a custom destination directory
python audit.py /path/to/target-repo -o ./docs -c

# If installed via pip install . :
skill-auditor https://github.com/owner/repo -c
```

### 2. Autonomous Agent Skill (Claude Code, Antigravity, OpenCode)
The repository includes `universal-repo-auditor.md`, an agent skill definition with YAML frontmatter and a system prompt.

Load `universal-repo-auditor.md` into your agent runtime (Claude Code, Antigravity, OpenCode, etc.):
- The agent reasons over repository files, parses unstructured notes, and produces the same structured documentation shape.
- **Remote Ingestion**: When given a Git/GitHub URL, the agent downloads/clones the repository directly into the current workspace.
- **Repository Explanation**: Synthesizes an executive overview of the project's purpose, capabilities, integrations, and operational flow.
- **YAML to Markdown**: Automatically converts YAML/YML configurations into publication-grade Markdown files.
- Use **agent mode** when you want an LLM to interpret and summarize unmapped schemas or complex guidelines.
- Use **script mode** (`audit.py`) when you want instant, reproducible, zero-inference audits.

---

## Features & Behavior

1. **Remote Repository Ingestion & Cloning**:
   Pass a remote Git repository URL (e.g. `https://github.com/...`) and the engine automatically downloads/clones the repo into the current working directory if no folder is specified.
2. **Repository Architecture Explanation**:
   Synthesizes an executive overview containing the repository's mission, discovered agent skill inventory, integrated tools, and operational execution flow.
3. **YAML to Markdown Conversion (`-c` / `--convert-all`)**:
   Recursively converts each `.yaml` and `.yml` configuration into its own structured, standalone `.md` specification file.
4. **Intelligent Directory Scanning**:
   Recursively discovers `.yml`, `.yaml`, and `.md` files while automatically ignoring noisy build and cache folders (`.git`, `node_modules`, `.venv`, `venv`, `dist`, `build`, `.next`, `.turbo`, `__pycache__`, `.cache`, `coverage`, `out`, `.netlify`, `.pytest_cache`, `converted_md`).
5. **Schema Evaluation & Safety**:
   - Parses standard fields: `id`, `name`, `description`, `inputs`, `outputs`, `tools`, `prompt`.
   - Renders `inputs` / `outputs` into clean Markdown tables (`Name | Type | Required | Description`).
   - Fences large prompt strings in ` ```text ` blocks.
   - Non-fatal error handling: malformed YAML or non-UTF8 files are safely warned and skipped.
   - **Log, Don't Guess**: Any unexpected or unmapped top-level keys are logged with their raw Python types rather than guessed.
6. **Markdown Ingestion & Frontmatter Stripping**:
   Indexes Markdown documentation files and previews their real headers while gracefully skipping YAML frontmatter blocks (`--- ... ---`).
7. **Unified Architecture Matrix**:
   Emits a top-level architecture matrix followed by in-depth per-file breakdowns.

---

## Expected YAML Schema

Skills and configuration files typically adhere to the following schema:

```yaml
id: text-summarizer
name: Text Summarizer
description: Condenses long documents into concise bullet points.
inputs:
  - name: document
    type: string
    required: true
    description: Text or article to summarize.
  - name: max_points
    type: integer
    required: false
    description: Maximum bullet points to generate.
outputs:
  - name: summary
    type: string
    required: true
    description: Markdown-formatted summary bullets.
tools:
  - text_processor
prompt: |
  You are an expert technical editor. Summarize the provided document into clear bullet points.
```

`inputs` and `outputs` also support key-value dict mappings:
```yaml
inputs:
  query:
    type: string
    required: true
    description: Search term
```

---

## Repository Structure

```
skill-auditor-agent/
├── audit.py                    # Standalone CLI execution script
├── universal-repo-auditor.md   # Agent skill definition (YAML frontmatter + Prompt)
├── pyproject.toml              # Package configuration and CLI entrypoint
├── requirements.txt            # Python dependencies (pyyaml)
├── netlify.toml                # Netlify deployment configuration
├── LICENSE                     # MIT License
├── README.md                   # Documentation and usage guide
├── web/                        # Next.js interactive frontend showcase
│   ├── src/app/                # App router and UI components
│   ├── public/                 # Static assets
│   └── package.json            # Web dependencies
├── examples/                   # Sample skills and configs for testing
│   └── sample_skills/
│       ├── summarizer.yaml
│       └── README.md
└── tests/                      # Automated unit test suite
    └── test_auditor.py
```

---

## Testing & Quality Gates

The codebase enforces a 100% test pass rate across both the Python runtime and the Next.js frontend.

### 1. Python Automated Test Suite (19/19 Passing)
Run the unit test suite covering remote repo detection, cloning resolution, YAML-to-MD conversion, repository explainer generation, frontmatter stripping, table rendering, and unmapped key safety:

```bash
python -m unittest discover -s tests -v
```

Expected Output:
```text
test_build_matrix (test_auditor.TestAuditor) ... ok
test_convert_yaml_files_to_md_and_extract_convert_all (test_auditor.TestAuditor) ... ok
test_convert_yaml_to_md (test_auditor.TestAuditor) ... ok
test_end_to_end_extract_and_run (test_auditor.TestAuditor) ... ok
test_generate_repo_explanation (test_auditor.TestAuditor) ... ok
test_is_remote_repo_url (test_auditor.TestAuditor) ... ok
test_iter_target_files_exclusion (test_auditor.TestAuditor) ... ok
test_read_text_safely (test_auditor.TestAuditor) ... ok
test_render_io_table_dict (test_auditor.TestAuditor) ... ok
test_render_io_table_empty (test_auditor.TestAuditor) ... ok
test_render_io_table_invalid (test_auditor.TestAuditor) ... ok
test_render_io_table_list (test_auditor.TestAuditor) ... ok
test_render_md_doc (test_auditor.TestAuditor) ... ok
test_render_md_doc_empty (test_auditor.TestAuditor) ... ok
test_render_md_doc_with_frontmatter (test_auditor.TestAuditor) ... ok
test_render_yaml_doc (test_auditor.TestAuditor) ... ok
test_render_yaml_doc_prompt_variations (test_auditor.TestAuditor) ... ok
test_render_yaml_doc_tools_variations (test_auditor.TestAuditor) ... ok
test_resolve_target_dir_local (test_auditor.TestAuditor) ... ok

----------------------------------------------------------------------
Ran 19 tests in 0.031s

OK
```

### 2. Frontend Linting & Build Verification
Verify the web application compiles without warnings or errors:

```bash
cd web
npm run lint    # ESLint 9 (0 errors, 0 warnings)
npm run build   # Next.js 16 Turbopack static compilation
```

---

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Anish29801/skill-auditor-agent/issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: add some amazing feature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for details.
