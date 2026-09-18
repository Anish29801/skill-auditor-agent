# Universal Repo Auditor & Documentation Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)](tests/)

A powerful repository documentation and audit tool for AI agent skills, configurations, and technical documentation. Point it at any directory or repository, and it automatically indexes and transforms every skill/config YAML file and Markdown document into a unified, publication-ready `SKILLS_OVERVIEW.md`.

Includes:
- A global architecture matrix (file path, file extension, and scope).
- Automated parameter tables for `inputs` and `outputs` with types and required indicators.
- Tool listings and syntax-fenced prompt inspection.
- "Log, don't guess" unmapped schema protection.

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

# Output SKILLS_OVERVIEW.md to a custom destination directory
python audit.py /path/to/target-repo -o ./docs

# If installed via pip install . :
skill-auditor /path/to/target-repo
```

### 2. Autonomous Agent Skill (Claude Code, Antigravity, OpenCode)
The repository includes `universal-repo-auditor.md`, an agent skill definition with YAML frontmatter and a system prompt.

Load `universal-repo-auditor.md` into your agent runtime (Claude Code, Antigravity, OpenCode, etc.):
- The agent reasons over repository files, parses unstructured notes, and produces the same structured documentation shape.
- Use **agent mode** when you want an LLM to interpret and summarize unmapped schemas or complex guidelines.
- Use **script mode** (`audit.py`) when you want instant, reproducible, zero-inference audits.

---

## Features & Behavior

1. **Intelligent Directory Scanning**:
   Recursively discovers `.yml`, `.yaml`, and `.md` files while automatically ignoring noisy build and cache folders (`.git`, `node_modules`, `.venv`, `venv`, `dist`, `build`, `.next`, `.turbo`, `__pycache__`, `.cache`, `coverage`).
2. **Schema Evaluation & Safety**:
   - Parses standard fields: `id`, `name`, `description`, `inputs`, `outputs`, `tools`, `prompt`.
   - Renders `inputs` / `outputs` into clean Markdown tables (`Name | Type | Required | Description`).
   - Fences large prompt strings in ` ```text ` blocks.
   - Non-fatal error handling: malformed YAML or non-UTF8 files are safely warned and skipped.
   - **Log, Don't Guess**: Any unexpected or unmapped top-level keys are logged with their raw Python types rather than guessed.
3. **Markdown Ingestion**:
   Indexes Markdown documentation files and previews their header/primary line.
4. **Unified Matrix**:
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
├── LICENSE                     # MIT License
├── README.md                   # Documentation and usage guide
├── examples/                   # Sample skills and configs for testing
│   └── sample_skills/
│       ├── summarizer.yaml
│       └── README.md
└── tests/                      # Automated unit test suite
    └── test_auditor.py
```

---

## Running Tests

Run the test suite using Python's built-in `unittest`:

```bash
python -m unittest discover -s tests -v
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
