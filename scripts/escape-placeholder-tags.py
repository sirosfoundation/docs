#!/usr/bin/env python3
"""Wrap bare <placeholder> tokens (e.g. <SCOPE>, <issuer>) in backticks.

Generated config docs use angle-bracket placeholder notation in prose that
was never meant to be HTML. Markdown renderers that sanitize unknown raw
HTML (e.g. GitHub) hide the bug; Docusaurus does not, and the browser's
HTML parser treats a bare "<SCOPE>" as an unclosed tag, silently mis-nesting
the rest of the page. Backtick-wrapping (skipping anything already inside a
code span or fenced block) makes it inert HTML input either way.
"""
import re
import sys

PLACEHOLDER = re.compile(r"<[A-Za-z][A-Za-z0-9_ ./-]*>")


def escape_line(line):
    parts = line.split("`")
    for i in range(0, len(parts), 2):  # even indices are outside code spans
        parts[i] = PLACEHOLDER.sub(lambda m: "`" + m.group(0) + "`", parts[i])
    return "`".join(parts)


def main():
    text = sys.stdin.read()
    in_fence = False
    out_lines = []
    for line in text.split("\n"):
        if line.strip().startswith("```"):
            in_fence = not in_fence
            out_lines.append(line)
            continue
        out_lines.append(line if in_fence else escape_line(line))
    sys.stdout.write("\n".join(out_lines))


if __name__ == "__main__":
    main()
