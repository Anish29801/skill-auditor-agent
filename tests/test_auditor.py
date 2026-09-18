import tempfile
import unittest
from pathlib import Path

from audit import (
    extract_and_run,
    render_io_table,
    render_yaml_doc,
    render_md_doc,
    build_matrix,
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

    def test_render_md_doc(self):
        lines = render_md_doc("docs/guide.md", "# Guide Title\nSome details.")
        rendered = "\n".join(lines)
        self.assertIn("## `docs/guide.md`", rendered)
        self.assertIn("- **Preview**: # Guide Title", rendered)

    def test_build_matrix(self):
        entries = [("skills/test.yaml", ".yaml", "Structured configuration schema")]
        lines = build_matrix(entries)
        rendered = "\n".join(lines)
        self.assertIn("## Global Architecture Matrix", rendered)
        self.assertIn("| `skills/test.yaml` | `.yaml` | Structured configuration schema |", rendered)

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

            out_path = extract_and_run(tmproot)
            self.assertTrue(out_path.exists())
            content = out_path.read_text(encoding="utf-8")
            self.assertIn("# SKILLS_OVERVIEW", content)
            self.assertIn("Global Architecture Matrix", content)
            self.assertIn("`test_skill.yaml`", content)
            self.assertIn("`test_doc.md`", content)
            self.assertIn("- **Id**: test-skill", content)


if __name__ == "__main__":
    unittest.main()
