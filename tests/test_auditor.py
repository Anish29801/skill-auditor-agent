import os
import sys
import tempfile
import unittest
from pathlib import Path

# Add repo root to sys.path so tests can execute standalone from any working directory
REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from audit import (
    EXCLUDED_DIRS,
    OUTPUT_FILENAME,
    build_matrix,
    convert_yaml_files_to_md,
    convert_yaml_to_md,
    extract_and_run,
    generate_repo_explanation,
    is_remote_repo_url,
    iter_target_files,
    read_text_safely,
    render_io_table,
    render_md_doc,
    render_yaml_doc,
    resolve_target_dir,
)


class TestAuditor(unittest.TestCase):
    def test_render_io_table_list(self):
        inputs = [
            {"name": "query", "type": "string", "required": True, "description": "Search term"},
            {"name": "limit", "type": "int", "required": False, "description": "Max results"},
        ]
        lines = render_io_table(inputs, "Inputs")
        self.assertTrue(any("`query`" in line for line in lines))
        self.assertTrue(any("**Yes**" in line for line in lines))
        self.assertTrue(any("`limit`" in line for line in lines))
        self.assertTrue(any("No" in line for line in lines))

    def test_render_io_table_dict(self):
        inputs = {
            "query": {"type": "string", "required": True, "description": "Search term"}
        }
        lines = render_io_table(inputs, "Inputs")
        self.assertTrue(any("`query`" in line for line in lines))
        self.assertTrue(any("**Yes**" in line for line in lines))

    def test_render_io_table_invalid(self):
        lines = render_io_table("invalid_schema", "Inputs")
        self.assertTrue(any("Unmapped `inputs` schema" in line for line in lines))

    def test_render_io_table_empty(self):
        self.assertEqual(render_io_table(None, "Inputs"), [])
        self.assertEqual(render_io_table([], "Outputs"), [])

    def test_render_yaml_doc(self):
        data = {
            "id": "my-skill",
            "name": "My Skill",
            "description": "Does something useful",
            "tools": ["bash", "read_file"],
            "prompt": "You are a helpful assistant.",
            "custom_metadata": {"foo": "bar"},
        }
        lines = render_yaml_doc("skills/my-skill.yaml", data)
        rendered = "\n".join(lines)
        self.assertIn("## `skills/my-skill.yaml`", rendered)
        self.assertIn("- **Id**: my-skill", rendered)
        self.assertIn("- **Name**: My Skill", rendered)
        self.assertIn("`bash`, `read_file`", rendered)
        self.assertIn("```text\nYou are a helpful assistant.\n```", rendered)
        self.assertIn("Unmapped field `custom_metadata`", rendered)

    def test_render_yaml_doc_tools_variations(self):
        # Tool as single string
        data_str = {"id": "str-tool", "tools": "bash"}
        rendered = "\n".join(render_yaml_doc("s.yaml", data_str))
        self.assertIn("**Tools:** `bash`", rendered)

        # Tool as empty list
        data_empty = {"id": "empty-tool", "tools": []}
        rendered_empty = "\n".join(render_yaml_doc("s.yaml", data_empty))
        self.assertNotIn("**Tools:**", rendered_empty)

    def test_render_yaml_doc_prompt_variations(self):
        # Empty / whitespace prompt should not render text block
        data_empty = {"id": "no-prompt", "prompt": "   \n  "}
        rendered = "\n".join(render_yaml_doc("s.yaml", data_empty))
        self.assertNotIn("```text", rendered)

    def test_render_md_doc(self):
        lines = render_md_doc("docs/guide.md", "# Guide Title\nSome details.")
        rendered = "\n".join(lines)
        self.assertIn("## `docs/guide.md`", rendered)
        self.assertIn("- **Preview**: # Guide Title", rendered)

    def test_render_md_doc_with_frontmatter(self):
        content = """---
id: sample-agent
name: Sample Agent
---

# Real Header Content
Description of the agent.
"""
        lines = render_md_doc("skills/sample.md", content)
        rendered = "\n".join(lines)
        self.assertIn("## `skills/sample.md`", rendered)
        self.assertIn("- **Preview**: # Real Header Content", rendered)
        self.assertNotIn("- **Preview**: ---", rendered)

    def test_render_md_doc_empty(self):
        lines = render_md_doc("empty.md", "")
        rendered = "\n".join(lines)
        self.assertIn("- **Preview**: (empty)", rendered)

    def test_build_matrix(self):
        entries = [("skills/test.yaml", ".yaml", "Structured configuration schema")]
        lines = build_matrix(entries)
        rendered = "\n".join(lines)
        self.assertIn("## Global Architecture Matrix", rendered)
        self.assertIn("| `skills/test.yaml` | `.yaml` | Structured configuration schema |", rendered)

    def test_iter_target_files_exclusion(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            tmproot = Path(tmpdir)
            (tmproot / "valid.yaml").write_text("id: ok", encoding="utf-8")
            (tmproot / "valid.md").write_text("# Doc", encoding="utf-8")
            (tmproot / OUTPUT_FILENAME).write_text("# Old", encoding="utf-8")
            (tmproot / "ignored.txt").write_text("text", encoding="utf-8")

            # Create excluded dirs
            for ex in [".git", "node_modules", "out", ".netlify", ".next", "__pycache__"]:
                d = tmproot / ex
                d.mkdir(parents=True, exist_ok=True)
                (d / "hidden.yaml").write_text("id: hidden", encoding="utf-8")

            found = [p.name for p in iter_target_files(tmproot)]
            self.assertIn("valid.yaml", found)
            self.assertIn("valid.md", found)
            self.assertNotIn("hidden.yaml", found)
            self.assertNotIn("ignored.txt", found)
            self.assertNotIn(OUTPUT_FILENAME, found)

    def test_read_text_safely(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            p = Path(tmpdir) / "test.txt"
            p.write_text("hello world", encoding="utf-8")
            self.assertEqual(read_text_safely(p), "hello world")

            # Non-existent file
            non_existent = Path(tmpdir) / "does_not_exist.txt"
            self.assertIsNone(read_text_safely(non_existent))

    def test_end_to_end_extract_and_run(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            tmproot = Path(tmpdir)
            skill_file = tmproot / "test_skill.yaml"
            skill_file.write_text(
                "id: test-skill\nname: Test\ndescription: Test description\ninputs:\n  - name: x\n    type: str\n    required: true\n",
                encoding="utf-8",
            )
            doc_file = tmproot / "test_doc.md"
            doc_file.write_text("# Test Document\nOverview of the test.", encoding="utf-8")

            # Malformed YAML
            bad_yaml = tmproot / "bad.yaml"
            bad_yaml.write_text(": : invalid yaml {", encoding="utf-8")

            # Non-mapping YAML
            list_yaml = tmproot / "list.yaml"
            list_yaml.write_text("- item 1\n- item 2\n", encoding="utf-8")

            # Run with nested non-existent output directory
            nested_out = tmproot / "nested" / "docs"
            out_path = extract_and_run(tmproot, nested_out)

            self.assertTrue(out_path.exists())
            self.assertEqual(out_path.parent, nested_out)

            content = out_path.read_text(encoding="utf-8")
            self.assertIn("# SKILLS_OVERVIEW", content)
            self.assertIn("Repository Overview & Architecture Explanation", content)
            self.assertIn("Global Architecture Matrix", content)
            self.assertIn("`test_skill.yaml`", content)
            self.assertIn("`test_doc.md`", content)
            self.assertIn("Malformed configuration — skipped", content)
            self.assertIn("Non-mapping YAML root — skipped", content)
            self.assertIn("- **Id**: test-skill", content)

    def test_is_remote_repo_url(self):
        self.assertTrue(is_remote_repo_url("https://github.com/Anish29801/skill-auditor-agent"))
        self.assertTrue(is_remote_repo_url("https://github.com/owner/repo.git"))
        self.assertTrue(is_remote_repo_url("git@github.com:owner/repo.git"))
        self.assertTrue(is_remote_repo_url("github.com/owner/repo"))
        self.assertFalse(is_remote_repo_url("./local/folder"))
        self.assertFalse(is_remote_repo_url("skills/summarizer.yaml"))
        self.assertFalse(is_remote_repo_url("."))

    def test_resolve_target_dir_local(self):
        self.assertEqual(resolve_target_dir("."), Path.cwd())
        self.assertEqual(resolve_target_dir(""), Path.cwd())
        with tempfile.TemporaryDirectory() as tmpdir:
            self.assertEqual(resolve_target_dir(tmpdir), Path(tmpdir).resolve())
            custom_dest = Path(tmpdir) / "custom_dest"
            custom_dest.mkdir()
            (custom_dest / "sample.txt").write_text("hello", encoding="utf-8")
            self.assertEqual(
                resolve_target_dir("https://github.com/owner/repo.git", destination=custom_dest),
                custom_dest,
            )

    def test_generate_repo_explanation(self):
        entries = [("skills/my-skill.yaml", ".yaml", "Structured configuration schema")]
        yaml_docs = [("skills/my-skill.yaml", {"id": "my-skill", "name": "My Skill", "tools": ["bash", "fetch"]})]
        md_docs = [("README.md", "# Readme")]
        lines = generate_repo_explanation(Path("/test/repo"), entries, yaml_docs, md_docs)
        text = "\n".join(lines)
        self.assertIn("## Repository Overview & Architecture Explanation", text)
        self.assertIn("My Skill", text)
        self.assertIn("`bash`", text)
        self.assertIn("`fetch`", text)
        self.assertIn("Operational Execution Flow", text)

    def test_convert_yaml_to_md(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            tmproot = Path(tmpdir)
            yaml_file = tmproot / "summarizer.yaml"
            yaml_file.write_text(
                "id: text-summarizer\nname: Summarizer\ndescription: Sum\ninputs:\n  - name: doc\n    type: str\n    required: true\n",
                encoding="utf-8",
            )
            out_md = convert_yaml_to_md(yaml_file)
            self.assertTrue(out_md.exists())
            self.assertEqual(out_md.name, "summarizer.md")
            content = out_md.read_text(encoding="utf-8")
            self.assertIn("# Summarizer", content)
            self.assertIn("Converted from", content)
            self.assertIn("`doc`", content)
            self.assertIn("**Yes**", content)

    def test_convert_yaml_files_to_md_and_extract_convert_all(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            tmproot = Path(tmpdir)
            skill1 = tmproot / "skill1.yaml"
            skill1.write_text("id: s1\nname: Skill 1\n", encoding="utf-8")
            skill2 = tmproot / "skill2.yml"
            skill2.write_text("id: s2\nname: Skill 2\n", encoding="utf-8")

            # Bulk convert
            converted = convert_yaml_files_to_md(tmproot, output_dir=tmproot / "converted")
            self.assertEqual(len(converted), 2)
            self.assertTrue((tmproot / "converted" / "skill1.md").exists())
            self.assertTrue((tmproot / "converted" / "skill2.md").exists())

            # Test extract_and_run with convert_all=True
            out_file = extract_and_run(tmproot, convert_all=True)
            self.assertTrue(out_file.exists())
            self.assertTrue((tmproot / "converted_md" / "skill1.md").exists())
            self.assertTrue((tmproot / "converted_md" / "skill2.md").exists())


if __name__ == "__main__":
    unittest.main()
