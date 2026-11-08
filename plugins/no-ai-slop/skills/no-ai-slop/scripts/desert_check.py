"""Flag text deserts in a Markdown draft.

Usage: python3 desert_check.py [--max-figures N] [--max-opening-words N]
                               [--max-section-words N] [file.md]
Reads stdin when no file is given. Exit code 1 when a limit fails, 0 otherwise.

Only prose paragraphs count. Headings, lists, tables, images and code are
skipped, because they are the structure a text desert lacks. The limits are
heuristics, not rules: a failure means "look at this paragraph", and a
project can set its own limits with the flags.
"""

import argparse
import re
import sys
from dataclasses import dataclass

# An ISO date is one figure; digits glued to letters or a hyphen (DEV2026, ABC-564, h1) are names.
FIGURE = re.compile(r"(?<![\w-])(?:\d{4}-\d{2}-\d{2}|\d[\d.,]*)(?![\w-])")
FRONT_MATTER = re.compile(r"\A---\n.*?\n---\n", re.S)
HEADING = re.compile(r"^#{1,6}\s+(.*)")
LIST_ITEM = re.compile(r"^\s*([-*+]|\d+[.)])\s+")
INLINE_CODE = re.compile(r"`[^`]*`")
BLOCKQUOTE = re.compile(r"^\s*>\s?")


@dataclass(frozen=True)
class Limits:
    max_figures: int = 2
    max_opening_words: int = 25
    max_section_words: int = 120


def _blocks(text):
    """Split Markdown into (kind, content) blocks; kind is heading, structure or prose."""
    text = FRONT_MATTER.sub("", text)
    blocks, paragraph, in_code = [], [], False

    def flush():
        if paragraph:
            blocks.append(("prose", " ".join(paragraph)))
            paragraph.clear()

    for raw in text.splitlines():
        line = BLOCKQUOTE.sub("", raw)
        if line.strip().startswith(("```", "~~~")):
            flush()
            in_code = not in_code
            continue
        if in_code:
            continue
        heading = HEADING.match(line)
        if heading:
            flush()
            blocks.append(("heading", heading.group(1).strip()))
        elif not line.strip():
            flush()
        elif line.lstrip().startswith(("|", "![", "<img", "<table", "<figure")) or LIST_ITEM.match(line):
            flush()
            blocks.append(("structure", line))
        else:
            prose = INLINE_CODE.sub(" ", line).strip()
            if prose:
                paragraph.append(prose)
    flush()
    return blocks


def check(text, limits=Limits()):
    blocks = _blocks(text)
    failures = []

    first = next((b for b in blocks if b[0] != "heading"), None)
    if first and first[0] == "prose":
        words = len(first[1].split())
        if words > limits.max_opening_words:
            failures.append(
                f"Opening: {words} words before any answer or structure "
                f"(limit {limits.max_opening_words})"
            )

    sections = [{"title": "(before first heading)", "words": 0, "structure": False}]
    for kind, content in blocks:
        if kind == "heading":
            sections.append({"title": content, "words": 0, "structure": False})
        elif kind == "structure":
            sections[-1]["structure"] = True
        else:
            sections[-1]["words"] += len(content.split())
            figures = len(FIGURE.findall(content))
            if figures > limits.max_figures:
                failures.append(
                    f"Paragraph in '{sections[-1]['title']}': {figures} figures "
                    f"(limit {limits.max_figures}): {content[:60]}..."
                )

    for section in sections:
        if not section["structure"] and section["words"] > limits.max_section_words:
            failures.append(
                f"Section '{section['title']}': {section['words']} words without a table, "
                f"list or picture (limit {limits.max_section_words})"
            )

    return {"sections": sections, "failures": failures}


def main(argv=None):
    defaults = Limits()
    parser = argparse.ArgumentParser(description="Flag text deserts in a Markdown draft.")
    parser.add_argument("file", nargs="?", help="Markdown file; stdin when omitted")
    parser.add_argument("--max-figures", type=int, default=defaults.max_figures)
    parser.add_argument("--max-opening-words", type=int, default=defaults.max_opening_words)
    parser.add_argument("--max-section-words", type=int, default=defaults.max_section_words)
    args = parser.parse_args(argv)

    if args.file:
        with open(args.file, encoding="utf-8") as handle:
            text = handle.read()
    else:
        text = sys.stdin.read()

    limits = Limits(args.max_figures, args.max_opening_words, args.max_section_words)
    result = check(text, limits)
    for section in result["sections"]:
        if section["words"] or section["structure"]:
            marker = "structured" if section["structure"] else "prose only"
            print(f"{section['words']:5d} words  {marker:10s}  {section['title']}")
    for failure in result["failures"]:
        print(f"FAIL  {failure}")
    return 1 if result["failures"] else 0


if __name__ == "__main__":
    sys.exit(main())
