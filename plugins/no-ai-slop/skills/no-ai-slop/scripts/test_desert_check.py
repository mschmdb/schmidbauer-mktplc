import subprocess
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from desert_check import Limits, check  # noqa: E402

SCRIPT = Path(__file__).parent / "desert_check.py"


class FigureTest(unittest.TestCase):
    def test_clean_text_passes(self):
        text = "Build time dropped.\n\n## Numbers\n\n| Step | s |\n|---|---|\n| Build | 41 |\n"
        self.assertEqual(check(text)["failures"], [])

    def test_more_than_two_figures_in_a_paragraph_fails(self):
        text = "Short opening.\n\nThe build took 41 s, tests 12 s and deploy 3 s.\n"
        failures = check(text)["failures"]
        self.assertEqual(len(failures), 1)
        self.assertIn("3 figures", failures[0])

    def test_two_figures_pass(self):
        text = "Short opening.\n\nLoad time dropped from 4.1 s to 0.9 s.\n"
        self.assertEqual(check(text)["failures"], [])

    def test_percent_and_thousands_count_once_each(self):
        text = "Opening.\n\nRevenue rose 12% to 1,250,000 and churn fell to 3.5%.\n"
        self.assertIn("3 figures", check(text)["failures"][0])

    def test_figures_in_tables_and_lists_do_not_count(self):
        text = "Opening.\n\n- 1 2 3 4\n1. 5 6 7 8\n\n| 5 | 6 | 7 |\n|---|---|---|\n"
        self.assertEqual(check(text)["failures"], [])

    def test_iso_date_counts_as_one_figure(self):
        text = "Opening.\n\nReleased 2026-11-05 as build 3.\n"
        self.assertEqual(check(text)["failures"], [])

    def test_digits_inside_names_do_not_count(self):
        text = "Opening.\n\nTicket ABC-564, space DEV2026, heading h1 and the x2 flag.\n"
        self.assertEqual(check(text)["failures"], [])

    def test_inline_code_is_ignored(self):
        text = "Opening.\n\nRun `sleep 5 && retry 3 10` before the release.\n"
        self.assertEqual(check(text)["failures"], [])

    def test_figure_limit_is_configurable(self):
        text = "Opening.\n\nThe build took 41 s, tests 12 s and deploy 3 s.\n"
        self.assertEqual(check(text, Limits(max_figures=3))["failures"], [])


class OpeningTest(unittest.TestCase):
    def test_long_opening_fails(self):
        text = " ".join(["word"] * 26) + ".\n"
        self.assertTrue(any("Opening" in f for f in check(text)["failures"]))

    def test_opening_at_limit_passes(self):
        text = " ".join(["word"] * 25) + ".\n"
        self.assertEqual(check(text)["failures"], [])

    def test_opening_with_table_passes(self):
        text = "| a | b |\n|---|---|\n\n" + " ".join(["word"] * 60) + "\n"
        self.assertFalse(any("Opening" in f for f in check(text)["failures"]))

    def test_heading_does_not_count_as_opening(self):
        text = "# Title\n\nShort answer.\n"
        self.assertEqual(check(text)["failures"], [])


class SectionTest(unittest.TestCase):
    def test_section_over_limit_without_structure_fails(self):
        text = "Opening.\n\n## Long\n\n" + " ".join(["word"] * 121) + "\n"
        self.assertTrue(any("Long" in f and "121 words" in f for f in check(text)["failures"]))

    def test_section_at_limit_passes(self):
        text = "Opening.\n\n## Long\n\n" + " ".join(["word"] * 120) + "\n"
        self.assertEqual(check(text)["failures"], [])

    def test_words_add_up_across_paragraphs(self):
        para = " ".join(["word"] * 65)
        text = f"Opening.\n\n## Long\n\n{para}\n\n{para}\n"
        self.assertTrue(any("130 words" in f for f in check(text)["failures"]))

    def test_section_with_a_list_is_exempt(self):
        text = "Opening.\n\n## Long\n\n" + " ".join(["word"] * 200) + "\n\n- item\n"
        self.assertEqual(check(text)["failures"], [])

    def test_section_limit_is_configurable(self):
        text = "Opening.\n\n## Long\n\n" + " ".join(["word"] * 121) + "\n"
        self.assertEqual(check(text, Limits(max_section_words=200))["failures"], [])


class SkipTest(unittest.TestCase):
    def test_code_blocks_are_ignored(self):
        text = "Opening.\n\n```\n1 2 3 4 5\n" + "word " * 300 + "\n```\n"
        self.assertEqual(check(text)["failures"], [])

    def test_front_matter_is_skipped(self):
        text = "---\nname: x\ndescription: " + " ".join(["word"] * 60) + " 1 2 3\n---\n\nShort opening.\n"
        self.assertEqual(check(text)["failures"], [])

    def test_blockquote_counts_as_prose(self):
        text = "Opening.\n\n> Build 41 s, tests 12 s, deploy 3 s.\n"
        self.assertTrue(any("3 figures" in f for f in check(text)["failures"]))

    def test_table_and_list_inside_blockquote_count_as_structure(self):
        text = "Opening.\n\n> | a | 1 | 2 | 3 |\n> |---|---|---|---|\n>\n> - 4 5 6\n"
        self.assertEqual(check(text)["failures"], [])

    def test_empty_text_has_no_failures(self):
        self.assertEqual(check("")["failures"], [])


class CliTest(unittest.TestCase):
    def run_cli(self, text, *args):
        return subprocess.run(
            [sys.executable, "-I", str(SCRIPT), *args],
            input=text, capture_output=True, text=True, check=False,
        )

    def test_exit_code_1_on_failure(self):
        result = self.run_cli("Opening.\n\nBuild 41 s, tests 12 s, deploy 3 s.\n")
        self.assertEqual(result.returncode, 1)
        self.assertIn("FAIL", result.stdout)

    def test_exit_code_0_when_clean(self):
        self.assertEqual(self.run_cli("Short answer.\n").returncode, 0)

    def test_flags_override_limits(self):
        result = self.run_cli("Opening.\n\nBuild 41 s, tests 12 s, deploy 3 s.\n", "--max-figures", "3")
        self.assertEqual(result.returncode, 0)


if __name__ == "__main__":
    unittest.main()
