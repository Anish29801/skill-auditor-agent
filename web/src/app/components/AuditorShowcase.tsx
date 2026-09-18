"use client";

import React, { useState, useEffect } from "react";
import * as yaml from "js-yaml";
import {
  Terminal,
  FileCode,
  Sparkles,
  Copy,
  Check,
  Download,
  Play,
  Sun,
  Moon,
  ShieldCheck,
  Cpu,
  Bot,
  ExternalLink,
  BookOpen,
  AlertTriangle,
  Zap,
} from "lucide-react";

// Crisp inline GitHub SVG Icon
function GithubIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// Preset samples
const SAMPLES = {
  summarizer: {
    name: "Text Summarizer (YAML)",
    filename: "skills/summarizer.yaml",
    content: `id: text-summarizer
name: Text Summarizer
description: Condenses long documents and articles into key bullet points.
inputs:
  - name: document
    type: string
    required: true
    description: Input text or document to summarize.
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
  You are an expert technical editor. Summarize the provided document into clear, concise, actionable bullet points.
`,
  },
  researcher: {
    name: "Web Research Agent (YAML)",
    filename: "skills/web-researcher.yaml",
    content: `id: web-researcher
name: Web Research Agent
description: Autonomous deep-dive web search and multi-source citation synthesizer.
inputs:
  query:
    type: string
    required: true
    description: Research topic or search query.
  max_sources:
    type: integer
    required: false
    description: Number of external citations to gather.
outputs:
  report:
    type: string
    required: true
    description: Comprehensive synthesized Markdown report with source links.
tools:
  - web_search
  - read_url_content
prompt: |
  You are an autonomous research analyst. Execute targeted searches across authoritative domains, cross-reference claims, and synthesize findings.
custom_telemetry:
  track_citations: true
`,
  },
  docs: {
    name: "Skill Guidelines (Markdown)",
    filename: "docs/GUIDELINES.md",
    content: `# Agent Skill Authoring Guidelines

Every agent skill in this repository must declare its input parameters, expected outputs, and tool dependencies explicitly.

## Requirements
- Always specify \`required: true\` on mandatory parameters.
- Provide descriptive prompt templates with clear task constraints.
`,
  },
};

export default function AuditorShowcase() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeSampleKey, setActiveSampleKey] = useState<keyof typeof SAMPLES>("summarizer");
  const [inputCode, setInputCode] = useState(SAMPLES.summarizer.content);
  const [inputFilename, setInputFilename] = useState(SAMPLES.summarizer.filename);
  const [outputMarkdown, setOutputMarkdown] = useState("");
  const [outputJson, setOutputJson] = useState<any>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<"rendered" | "raw">("rendered");
  const [isAuditing, setIsAuditing] = useState(false);

  // Toggle Theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  }, [theme]);

  // Execute in-browser audit
  const runAudit = (content: string, filename: string) => {
    setIsAuditing(true);
    try {
      const isYaml = filename.endsWith(".yml") || filename.endsWith(".yaml");
      let matrixScope = "Documentation guidelines";
      const bodyLines: string[] = [];

      if (isYaml) {
        let parsed: any = {};
        try {
          parsed = yaml.load(content);
        } catch (e: any) {
          matrixScope = "Malformed configuration — skipped";
          const lines = [
            `# SKILLS_OVERVIEW`,
            ``,
            `## Global Architecture Matrix`,
            ``,
            `| File Path | Extension | Scope |`,
            `| :--- | :--- | :--- |`,
            `| \`${filename}\` | \`${filename.substring(filename.lastIndexOf("."))}\` | ${matrixScope} |`,
            ``,
            `> Warning: Malformed YAML in \`${filename}\`: ${e.message}`,
          ];
          setOutputMarkdown(lines.join("\n"));
          setOutputJson({ error: e.message });
          setIsAuditing(false);
          return;
        }

        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
          matrixScope = "Non-mapping YAML root — skipped";
          const lines = [
            `# SKILLS_OVERVIEW`,
            ``,
            `## Global Architecture Matrix`,
            ``,
            `| File Path | Extension | Scope |`,
            `| :--- | :--- | :--- |`,
            `| \`${filename}\` | \`.yaml\` | ${matrixScope} |`,
          ];
          setOutputMarkdown(lines.join("\n"));
          setOutputJson({ error: "Non-mapping root" });
          setIsAuditing(false);
          return;
        }

        matrixScope = "Structured configuration schema";
        setOutputJson(parsed);

        bodyLines.push(`## \`${filename}\`\n`);
        if (parsed.id) bodyLines.push(`- **Id**: ${parsed.id}`);
        if (parsed.name) bodyLines.push(`- **Name**: ${parsed.name}`);
        if (parsed.description) bodyLines.push(`- **Description**: ${parsed.description}`);
        bodyLines.push(``);

        // Inputs Table
        const renderTable = (rows: any, heading: string) => {
          if (!rows) return [];
          const lines: string[] = [];
          let normalized: any[] = [];

          if (Array.isArray(rows)) {
            normalized = rows.filter((r) => typeof r === "object" && r !== null);
          } else if (typeof rows === "object") {
            normalized = Object.entries(rows).map(([name, spec]: [string, any]) => ({
              name,
              ...(typeof spec === "object" ? spec : {}),
            }));
          } else {
            return [
              `> Unmapped \`${heading.toLowerCase()}\` schema — raw type \`${typeof rows}\`, left unparsed.\n`,
            ];
          }

          lines.push(`### ${heading}\n`);
          lines.push(`| Name | Type | Required | Description |`);
          lines.push(`| :--- | :--- | :--- | :--- |`);
          normalized.forEach((row) => {
            const name = row.name || "—";
            const type = row.type || "—";
            const req = row.required ? "**Yes**" : "No";
            const desc = row.description || "—";
            lines.push(`| \`${name}\` | \`${type}\` | ${req} | ${desc} |`);
          });
          lines.push(``);
          return lines;
        };

        if (parsed.inputs) bodyLines.push(...renderTable(parsed.inputs, "Inputs"));
        if (parsed.outputs) bodyLines.push(...renderTable(parsed.outputs, "Outputs"));

        if (parsed.tools) {
          const tools = Array.isArray(parsed.tools) ? parsed.tools : [parsed.tools];
          bodyLines.push(`**Tools:** ` + tools.map((t: string) => `\`${t}\``).join(", ") + `\n`);
        }

        if (typeof parsed.prompt === "string") {
          bodyLines.push(`**Prompt:**\n`);
          bodyLines.push(`\`\`\`text`);
          bodyLines.push(parsed.prompt.trim());
          bodyLines.push(`\`\`\`\n`);
        }

        const known = new Set(["id", "name", "description", "inputs", "outputs", "tools", "prompt"]);
        Object.keys(parsed).forEach((key) => {
          if (!known.has(key)) {
            bodyLines.push(
              `> Unmapped field \`${key}\` — raw type \`${typeof parsed[key]}\`, logged without interpretation.`
            );
          }
        });
      } else {
        // Markdown file
        setOutputJson({ type: "markdown", raw: content });
        const firstLine = content.split("\n").map((l) => l.trim()).find((l) => l.length > 0) || "(empty)";
        bodyLines.push(`## \`${filename}\`\n`);
        bodyLines.push(`- **Type**: Documentation guidelines`);
        bodyLines.push(`- **Preview**: ${firstLine.slice(0, 120)}\n`);
      }

      const fullOutput = [
        `# SKILLS_OVERVIEW`,
        ``,
        `## Global Architecture Matrix`,
        ``,
        `| File Path | Extension | Scope |`,
        `| :--- | :--- | :--- |`,
        `| \`${filename}\` | \`${filename.substring(filename.lastIndexOf("."))}\` | ${matrixScope} |`,
        ``,
        ...bodyLines,
      ].join("\n");

      setOutputMarkdown(fullOutput);
    } catch (err: any) {
      setOutputMarkdown(`Error running audit: ${err.message}`);
    } finally {
      setIsAuditing(false);
    }
  };

  useEffect(() => {
    runAudit(inputCode, inputFilename);
  }, [inputCode, inputFilename]);

  const handleSelectSample = (key: keyof typeof SAMPLES) => {
    setActiveSampleKey(key);
    setInputCode(SAMPLES[key].content);
    setInputFilename(SAMPLES[key].filename);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const downloadFile = (filename: string, content: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/markdown" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-[#06090e] text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      {/* BACKGROUND GLOW */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 left-1/3 w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-[150px]" />
      </div>

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-slate-800/80 bg-[#06090e]/80 dark:border-slate-800/80 light:bg-white/80 light:border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-bold text-lg">
              Ω
            </div>
            <div>
              <span className="font-semibold text-base sm:text-lg tracking-tight bg-gradient-to-r from-slate-100 via-cyan-200 to-blue-400 bg-clip-text text-transparent dark:from-slate-100 dark:via-cyan-200 dark:to-blue-400 light:from-slate-900 light:to-blue-700">
                Universal Repo Auditor
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                v1.1.0 • MIT
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300 light:text-slate-600">
            <a href="#playground" className="hover:text-cyan-400 transition-colors">
              Live Auditor
            </a>
            <a href="#dual-engine" className="hover:text-cyan-400 transition-colors">
              Dual Engine
            </a>
            <a href="#schema" className="hover:text-cyan-400 transition-colors">
              Schema Spec
            </a>
            <a href="#cli" className="hover:text-cyan-400 transition-colors">
              CLI Quickstart
            </a>
            <a href="#system-prompt" className="hover:text-cyan-400 transition-colors">
              Agent Prompt
            </a>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg border border-slate-700/60 bg-slate-800/40 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-all light:border-slate-300 light:bg-slate-100 light:text-slate-700"
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            {/* GitHub Repo Button */}
            <a
              href="https://github.com/Anish29801/skill-auditor-agent"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 hover:border-cyan-500/50 shadow-sm transition-all light:bg-slate-900 light:text-white light:hover:bg-slate-800"
            >
              <GithubIcon className="w-4 h-4 text-cyan-400" />
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Universal Repo Auditor &amp; Documentation Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
          Turn Sprawling Agent Repos Into{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
            One Unified Index
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-xl text-slate-400 light:text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Scans every YAML skill, configuration file, and Markdown document. Formats input/output parameter tables, bolded required flags, fenced prompts, and architecture matrices into a standardized <code className="text-cyan-300 font-mono text-sm bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/60">SKILLS_OVERVIEW.md</code>.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#playground"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 transition-all hover:scale-105"
          >
            <Play className="w-4 h-4 fill-current" />
            Try Live Playground
          </a>

          <a
            href="https://github.com/Anish29801/skill-auditor-agent"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold border border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-800 hover:border-slate-500 transition-all light:bg-white light:border-slate-300 light:text-slate-800 light:hover:bg-slate-100"
          >
            <GithubIcon className="w-5 h-5 text-cyan-400" />
            Star on GitHub
          </a>
        </div>

        {/* Badges / Highlights */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur light:bg-white light:border-slate-200">
            <div className="text-xs uppercase tracking-wider text-slate-500 font-mono">License</div>
            <div className="text-sm font-semibold text-slate-200 light:text-slate-800 flex items-center gap-1.5 mt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> MIT Open Source
            </div>
          </div>
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur light:bg-white light:border-slate-200">
            <div className="text-xs uppercase tracking-wider text-slate-500 font-mono">Execution</div>
            <div className="text-sm font-semibold text-slate-200 light:text-slate-800 flex items-center gap-1.5 mt-1">
              <Zap className="w-4 h-4 text-amber-400" /> Dual-Engine Mode
            </div>
          </div>
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur light:bg-white light:border-slate-200">
            <div className="text-xs uppercase tracking-wider text-slate-500 font-mono">Python Runtime</div>
            <div className="text-sm font-semibold text-slate-200 light:text-slate-800 flex items-center gap-1.5 mt-1">
              <Cpu className="w-4 h-4 text-sky-400" /> Python ≥ 3.10
            </div>
          </div>
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur light:bg-white light:border-slate-200">
            <div className="text-xs uppercase tracking-wider text-slate-500 font-mono">Safety Rule</div>
            <div className="text-sm font-semibold text-slate-200 light:text-slate-800 flex items-center gap-1.5 mt-1">
              <Bot className="w-4 h-4 text-cyan-400" /> Log, Don&apos;t Guess
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE PLAYGROUND SECTION */}
      <section id="playground" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 relative">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Interactive In-Browser Auditor
          </h2>
          <p className="mt-2 text-slate-400 light:text-slate-600 text-sm sm:text-base">
            Test the auditor right now. Select a sample below or paste your own YAML/Markdown to see the synthesized output in real-time.
          </p>

          {/* Sample Selector Buttons */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {(Object.keys(SAMPLES) as Array<keyof typeof SAMPLES>).map((key) => (
              <button
                key={key}
                onClick={() => handleSelectSample(key)}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  activeSampleKey === key
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                    : "bg-slate-800/60 text-slate-400 border border-slate-800 hover:bg-slate-800 light:bg-slate-200 light:text-slate-700"
                }`}
              >
                {SAMPLES[key].name}
              </button>
            ))}
          </div>
        </div>

        {/* Editor & Preview Split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* LEFT: INPUT */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-md overflow-hidden shadow-2xl light:bg-white light:border-slate-200">
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between light:bg-slate-100 light:border-slate-200">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <input
                  type="text"
                  value={inputFilename}
                  onChange={(e) => setInputFilename(e.target.value)}
                  className="bg-transparent text-xs font-mono font-medium text-slate-200 light:text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 rounded px-1"
                  title="Virtual file path"
                />
              </div>
              <span className="text-[11px] font-mono text-slate-500 uppercase">Input Editor</span>
            </div>

            <div className="p-3">
              <textarea
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                rows={18}
                className="w-full font-mono text-xs sm:text-sm bg-slate-950/40 text-slate-200 p-3 rounded-lg border border-slate-800/80 focus:border-cyan-500/50 focus:outline-none resize-none leading-relaxed light:bg-slate-50 light:text-slate-900 light:border-slate-200"
                placeholder="Paste YAML skill config or Markdown notes here..."
                spellCheck={false}
              />
            </div>

            <div className="px-4 py-2.5 bg-slate-950/40 border-t border-slate-800/60 text-xs text-slate-400 flex items-center justify-between light:bg-slate-50 light:border-slate-200">
              <span>{inputCode.split("\n").length} lines</span>
              <span className="text-cyan-400 flex items-center gap-1 font-mono">
                {isAuditing ? "Processing..." : "✓ Ready"}
              </span>
            </div>
          </div>

          {/* RIGHT: OUTPUT PREVIEW */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-md overflow-hidden shadow-2xl light:bg-white light:border-slate-200">
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between light:bg-slate-100 light:border-slate-200">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewTab("rendered")}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                    previewTab === "rendered"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Visual Preview
                </button>
                <button
                  onClick={() => setPreviewTab("raw")}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                    previewTab === "raw"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Raw Markdown
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(outputMarkdown, "output")}
                  className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-300 hover:text-cyan-300 text-xs flex items-center gap-1 light:bg-white light:border-slate-300 light:text-slate-700"
                  title="Copy generated markdown"
                >
                  {copiedSection === "output" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => downloadFile("SKILLS_OVERVIEW.md", outputMarkdown)}
                  className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-300 hover:text-cyan-300 text-xs flex items-center gap-1 light:bg-white light:border-slate-300 light:text-slate-700"
                  title="Download SKILLS_OVERVIEW.md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            <div className="p-4 h-[470px] overflow-y-auto">
              {previewTab === "raw" ? (
                <pre className="font-mono text-xs text-slate-300 light:text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {outputMarkdown}
                </pre>
              ) : (
                <div className="space-y-4 text-xs sm:text-sm text-slate-200 light:text-slate-800">
                  {/* Global Matrix Preview */}
                  <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/50 light:bg-slate-50 light:border-slate-200">
                    <div className="font-mono text-xs uppercase tracking-wider text-cyan-400 font-semibold mb-2">
                      Global Architecture Matrix
                    </div>
                    <table className="w-full text-left font-mono text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 light:border-slate-200 text-slate-400">
                          <th className="pb-1">File Path</th>
                          <th className="pb-1">Extension</th>
                          <th className="pb-1">Scope</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-1.5 text-cyan-300 font-semibold">{inputFilename}</td>
                          <td className="py-1.5 text-slate-400">{inputFilename.substring(inputFilename.lastIndexOf("."))}</td>
                          <td className="py-1.5 text-emerald-400">
                            {outputJson?.error
                              ? "Malformed configuration"
                              : outputJson?.type === "markdown"
                              ? "Documentation guidelines"
                              : "Structured configuration schema"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Rendered Skill Breakdown */}
                  {outputJson && outputJson.type !== "markdown" && !outputJson.error && (
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-lg border border-slate-800/80 bg-slate-950/40 light:bg-slate-50 light:border-slate-200">
                        <div className="text-base font-bold text-slate-100 light:text-slate-900 font-mono">
                          {outputJson.name || outputJson.id || "Unnamed Skill"}
                        </div>
                        {outputJson.description && (
                          <div className="mt-1 text-slate-400 light:text-slate-600 text-xs">
                            {outputJson.description}
                          </div>
                        )}
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-mono">
                          {outputJson.id && (
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              id: {outputJson.id}
                            </span>
                          )}
                          {outputJson.tools && (
                            <span className="px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/50">
                              tools: {Array.isArray(outputJson.tools) ? outputJson.tools.join(", ") : outputJson.tools}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Inputs Table */}
                      {outputJson.inputs && (
                        <div>
                          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                            Inputs Table
                          </div>
                          <div className="rounded border border-slate-800 bg-slate-950/40 overflow-hidden light:bg-white light:border-slate-200">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead className="bg-slate-900/80 border-b border-slate-800 light:bg-slate-100 light:border-slate-200 text-slate-400">
                                <tr>
                                  <th className="p-2">Name</th>
                                  <th className="p-2">Type</th>
                                  <th className="p-2">Required</th>
                                  <th className="p-2">Description</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(Array.isArray(outputJson.inputs)
                                  ? outputJson.inputs
                                  : Object.entries(outputJson.inputs).map(([k, v]: any) => ({ name: k, ...v }))
                                ).map((inp: any, idx: number) => (
                                  <tr key={idx} className="border-b border-slate-800/50 light:border-slate-100">
                                    <td className="p-2 font-mono text-cyan-300">{inp.name || "—"}</td>
                                    <td className="p-2 font-mono text-indigo-300">{inp.type || "—"}</td>
                                    <td className="p-2">
                                      {inp.required ? (
                                        <span className="px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 font-semibold text-[10px] border border-rose-800/40">
                                          YES
                                        </span>
                                      ) : (
                                        <span className="text-slate-500 text-[10px]">No</span>
                                      )}
                                    </td>
                                    <td className="p-2 text-slate-400">{inp.description || "—"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Prompt block */}
                      {outputJson.prompt && (
                        <div>
                          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                            Fenced System Prompt
                          </div>
                          <div className="p-3 rounded-lg border border-slate-800 bg-slate-950 text-xs font-mono text-slate-300 light:bg-slate-100 light:text-slate-800 light:border-slate-200 overflow-x-auto whitespace-pre-wrap">
                            {outputJson.prompt.trim()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Markdown Preview */}
                  {outputJson?.type === "markdown" && (
                    <div className="p-3.5 rounded-lg border border-slate-800/80 bg-slate-950/40 light:bg-slate-50 light:border-slate-200">
                      <div className="text-xs uppercase font-mono text-slate-500 mb-1">Documentation Preview</div>
                      <div className="font-mono text-xs text-slate-300 light:text-slate-800">
                        {outputJson.raw.split("\n")[0] || "(empty)"}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* DUAL ENGINE SECTION */}
      <section id="dual-engine" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-mono uppercase text-cyan-400 tracking-wider">Dual-Engine Architecture</div>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2 tracking-tight">
            Two Ways to Run: Deterministic &amp; Agentic
          </h2>
          <p className="mt-3 text-slate-400 light:text-slate-600 text-sm sm:text-base">
            Whether you need instant, zero-cost CI/CD pipeline verification or deep autonomous reasoning over ambiguous configs, Skill Auditor Agent ships both.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Mode 1: Deterministic Script */}
          <div className="p-6 sm:p-8 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur light:bg-white light:border-slate-200 flex flex-col justify-between hover:border-cyan-500/40 transition-all shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-6">
                <Terminal className="w-6 h-6" />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded text-xs font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/50 mb-3">
                audit.py • Standalone Python CLI
              </div>
              <h3 className="text-xl font-bold text-slate-100 light:text-slate-900">Deterministic Engine</h3>
              <p className="mt-3 text-sm text-slate-400 light:text-slate-600 leading-relaxed">
                Runs locally on Python ≥ 3.10 with only <code className="text-cyan-300 font-mono">pyyaml</code>. Zero inference cost, 0ms network latency, 100% reproducible results every time.
              </p>

              <ul className="mt-6 space-y-3 text-xs sm:text-sm text-slate-300 light:text-slate-700">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Recursively collects <code className="font-mono text-cyan-300">.yml</code>, <code className="font-mono text-cyan-300">.yaml</code>, and <code className="font-mono text-cyan-300">.md</code></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Excludes <code className="font-mono text-slate-400">node_modules</code>, <code className="font-mono text-slate-400">.git</code>, <code className="font-mono text-slate-400">.venv</code>, and build caches</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Emits structured parameter tables and architecture matrices</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Ideal for pre-commit hooks, CI gates, and automated documentation jobs</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 p-3 rounded-lg bg-slate-950/70 border border-slate-800 font-mono text-xs text-slate-300 light:bg-slate-100 light:text-slate-800">
              $ python audit.py /path/to/skills -o ./docs
            </div>
          </div>

          {/* Mode 2: Agent Skill */}
          <div className="p-6 sm:p-8 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur light:bg-white light:border-slate-200 flex flex-col justify-between hover:border-indigo-500/40 transition-all shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
                <Bot className="w-6 h-6" />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded text-xs font-mono bg-indigo-950 text-indigo-300 border border-indigo-800/50 mb-3">
                universal-repo-auditor.md • Agent Skill
              </div>
              <h3 className="text-xl font-bold text-slate-100 light:text-slate-900">Autonomous Agent Skill</h3>
              <p className="mt-3 text-sm text-slate-400 light:text-slate-600 leading-relaxed">
                Loaded directly into agent runtimes like Claude Code, Antigravity, or OpenCode. Translates ambiguous prompts, reasons over complex schema edge-cases, and synthesizes documentation intelligently.
              </p>

              <ul className="mt-6 space-y-3 text-xs sm:text-sm text-slate-300 light:text-slate-700">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Encodes rigorous operational guidelines into agent context</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Enforces &ldquo;Log, Don&apos;t Guess&rdquo; rule to stop hallucinated properties</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Embeds reference Python executor for multi-engine fallback</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Seamless pairing with Antigravity / Claude Code subagents</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 p-3 rounded-lg bg-slate-950/70 border border-slate-800 font-mono text-xs text-slate-300 light:bg-slate-100 light:text-slate-800">
              Load into Claude Code: /skill universal-repo-auditor.md
            </div>
          </div>
        </div>
      </section>

      {/* SCHEMA SPECIFICATION SECTION */}
      <section id="schema" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-mono uppercase text-cyan-400 tracking-wider">Specification</div>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2 tracking-tight">
            YAML Schema &amp; Extraction Rules
          </h2>
          <p className="mt-3 text-slate-400 light:text-slate-600 text-sm sm:text-base">
            The auditor expects a clean, standardized contract. Here is how every field is parsed and represented in the final Markdown deliverable.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 light:bg-white light:border-slate-200">
            <h4 className="font-mono text-cyan-300 font-semibold text-sm">id, name, description</h4>
            <p className="mt-2 text-xs text-slate-400 light:text-slate-600 leading-relaxed">
              Extracted as top-level identity fields. Rendered as clean bullet points beneath the file heading.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 light:bg-white light:border-slate-200">
            <h4 className="font-mono text-cyan-300 font-semibold text-sm">inputs &amp; outputs</h4>
            <p className="mt-2 text-xs text-slate-400 light:text-slate-600 leading-relaxed">
              Accepts a list of objects or a keyed dictionary. Emits Markdown tables with <code className="text-cyan-300">Name</code>, <code className="text-cyan-300">Type</code>, <code className="text-cyan-300">Required</code>, and <code className="text-cyan-300">Description</code> columns.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 light:bg-white light:border-slate-200">
            <h4 className="font-mono text-cyan-300 font-semibold text-sm">tools &amp; prompt</h4>
            <p className="mt-2 text-xs text-slate-400 light:text-slate-600 leading-relaxed">
              Tools are listed as comma-separated inline code pills. System prompts are encased in syntax-fenced <code className="text-cyan-300">```text</code> blocks to preserve formatting.
            </p>
          </div>
        </div>

        {/* LOG, DON'T GUESS ALERT */}
        <div className="mt-8 p-6 rounded-2xl border border-amber-500/30 bg-amber-950/10 backdrop-blur flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-amber-200 font-semibold text-sm sm:text-base">
              The &ldquo;Log, Don&apos;t Guess&rdquo; Safety Invariant
            </h4>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 light:text-slate-700 leading-relaxed">
              If a YAML file declares top-level keys outside the recognized schema (such as custom telemetry, orchestration hooks, or unknown vendor flags), the auditor <strong>never guesses</strong> or hallucinates their function. It logs the key and its raw Python type directly into the document so human reviewers can evaluate it safely.
            </p>
          </div>
        </div>
      </section>

      {/* CLI & INSTALLATION GUIDE */}
      <section id="cli" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-mono uppercase text-cyan-400 tracking-wider">Quickstart</div>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2 tracking-tight">
            Install &amp; Run in Seconds
          </h2>
          <p className="mt-3 text-slate-400 light:text-slate-600 text-sm sm:text-base">
            Clone from GitHub, install dependencies, and run against your codebase.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 font-mono text-xs sm:text-sm text-slate-200 light:bg-slate-100 light:border-slate-300 light:text-slate-900 flex items-center justify-between">
            <div className="overflow-x-auto">
              <span className="text-slate-500 select-none">$ </span>
              <span>git clone https://github.com/Anish29801/skill-auditor-agent.git</span>
            </div>
            <button
              onClick={() => copyToClipboard("git clone https://github.com/Anish29801/skill-auditor-agent.git", "cmd1")}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300"
              title="Copy"
            >
              {copiedSection === "cmd1" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 font-mono text-xs sm:text-sm text-slate-200 light:bg-slate-100 light:border-slate-300 light:text-slate-900 flex items-center justify-between">
            <div className="overflow-x-auto">
              <span className="text-slate-500 select-none">$ </span>
              <span>pip install -r requirements.txt</span>
            </div>
            <button
              onClick={() => copyToClipboard("pip install -r requirements.txt", "cmd2")}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300"
              title="Copy"
            >
              {copiedSection === "cmd2" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 font-mono text-xs sm:text-sm text-slate-200 light:bg-slate-100 light:border-slate-300 light:text-slate-900 flex items-center justify-between">
            <div className="overflow-x-auto">
              <span className="text-slate-500 select-none">$ </span>
              <span>python audit.py /path/to/target-repo -o ./docs</span>
            </div>
            <button
              onClick={() => copyToClipboard("python audit.py /path/to/target-repo -o ./docs", "cmd3")}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300"
              title="Copy"
            >
              {copiedSection === "cmd3" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </section>

      {/* SYSTEM PROMPT INSPECTOR */}
      <section id="system-prompt" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 relative">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="text-xs font-mono uppercase text-indigo-400 tracking-wider">Agent Integration</div>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2 tracking-tight">
            Universal Agent System Prompt
          </h2>
          <p className="mt-3 text-slate-400 light:text-slate-600 text-sm sm:text-base">
            Copy the raw system prompt directly into your agent instructions or tool registry.
          </p>
        </div>

        <div className="max-w-4xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur overflow-hidden light:bg-white light:border-slate-200 shadow-2xl">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between light:bg-slate-100 light:border-slate-200">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span className="font-mono text-xs text-slate-200 light:text-slate-800 font-semibold">
                universal-repo-auditor.md
              </span>
            </div>
            <button
              onClick={() =>
                copyToClipboard(
                  `You are a technical documentation agent that extracts repo architecture and configuration state, and flattens it into structured Markdown documentation.\n\n## Core Operational Workflow\n1. Ingestion & Schema Evaluation\n2. Format Inversion Rules (YAML -> Markdown)\n3. Repository Synthesis Mapping`,
                  "prompt"
                )
              }
              className="text-xs text-slate-400 hover:text-indigo-300 flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 light:bg-white light:border-slate-300 light:text-slate-700"
            >
              {copiedSection === "prompt" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied Prompt
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy Prompt
                </>
              )}
            </button>
          </div>

          <div className="p-6 font-mono text-xs sm:text-sm text-slate-300 light:text-slate-800 bg-slate-950/40 light:bg-slate-50 overflow-x-auto leading-relaxed max-h-96">
            <pre className="whitespace-pre-wrap">
{`# SYSTEM PROMPT: TECHNICAL REPOSITORY AUDITOR & DOCUMENTATION ENGINE

You are a technical documentation agent that extracts repo architecture and
configuration state, and flattens it into structured Markdown documentation.

## Core Operational Workflow

### 1. Ingestion & Schema Evaluation
- Walk the repository root, collecting .yml, .yaml, and .md files.
- Skip vendor/build noise: .git, node_modules, .venv/venv, dist, build, .next, .turbo, __pycache__, .cache, coverage.
- Never hallucinate a field's meaning. If a YAML file has a key outside the known schema (id, name, description, inputs, outputs, prompt, tools), log the key and its raw Python type — do not guess its function.
- Files that fail to decode as UTF-8 or fail YAML parsing are logged and skipped, not fatal to the run.

### 2. Format Inversion Rules (YAML → Markdown)
- inputs / outputs render as Markdown tables: Name | Type | Required | Description.
- required: true renders as **Yes**; anything else renders as No.
- tools renders as a comma-separated list of inline-coded values.
- prompt renders inside a fenced \`\`\`text block.

### 3. Repository Synthesis Mapping
- Emit a single SKILLS_OVERVIEW.md: global path/extension/scope matrix, followed by one rendered section per source file.`}
            </pre>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-12 px-4 sm:px-6 lg:px-8 z-10 relative light:bg-slate-100 light:border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white text-sm">
              Ω
            </div>
            <div>
              <div className="font-semibold text-sm text-slate-200 light:text-slate-800">
                Skill Auditor Agent
              </div>
              <div className="text-xs text-slate-500">
                Created by Anish • Open Source under MIT License
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-400 light:text-slate-600 font-medium">
            <a
              href="https://github.com/Anish29801/skill-auditor-agent"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition-colors flex items-center gap-1.5"
            >
              <GithubIcon className="w-4 h-4" /> GitHub Repo
            </a>
            <a
              href="https://github.com/Anish29801/skill-auditor-agent/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition-colors"
            >
              MIT License
            </a>
            <a
              href="https://github.com/Anish29801/skill-auditor-agent/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition-colors"
            >
              Report Issue
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
