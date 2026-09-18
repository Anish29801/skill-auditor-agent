import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Universal Repo Auditor & Documentation Engine",
  description:
    "Extract skill metadata from YAML configs and Markdown files to emit structured, publication-ready SKILLS_OVERVIEW.md documentation. MIT Licensed.",
  keywords: [
    "AI Agents",
    "Skill Auditor",
    "Claude Code",
    "Antigravity",
    "OpenCode",
    "Repo Auditor",
    "YAML Documentation",
    "Open Source",
  ],
  authors: [{ name: "Anish", url: "https://github.com/Anish29801" }],
  openGraph: {
    title: "Universal Repo Auditor & Documentation Engine",
    description:
      "Automated repository auditing for AI Agent skills, YAML configurations, and Markdown documentation. MIT Licensed.",
    url: "https://github.com/Anish29801/skill-auditor-agent",
    siteName: "Universal Repo Auditor",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#06090e] text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
