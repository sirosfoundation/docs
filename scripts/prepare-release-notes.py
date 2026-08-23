#!/usr/bin/env python3
"""Adapt a repo's RELEASE_NOTES.md for publishing on the docs site.

Two transformations, both about the difference between the source file and the
published page:

1. Strip HTML comments. The source file is fenced with
   `<!-- release-notes:<tag>:start -->` markers, and carries a header comment
   explaining them — that's machinery for the generator and for whoever edits
   the file in its own repo. On the published page it's noise describing
   something the reader can't see or act on.

2. Retitle the H1. Every repo's file says "# Release Notes", which is fine in
   context but ambiguous once several components' notes sit side by side in one
   sidebar. Becomes "# <Component> Release Notes".

Usage: prepare-release-notes.py "<Component Label>" < RELEASE_NOTES.md
"""

import re
import sys

HTML_COMMENT = re.compile(r"<!--.*?-->", re.DOTALL)


def main() -> None:
    label = sys.argv[1] if len(sys.argv) > 1 else ""
    text = sys.stdin.read()

    text = HTML_COMMENT.sub("", text)

    if label:
        # Horizontal whitespace only: \s would match the newlines after the
        # heading and swallow the blank line separating it from the first
        # release section.
        text = re.sub(
            r"^#[ \t]+Release Notes[ \t]*$",
            f"# {label} Release Notes",
            text,
            count=1,
            flags=re.MULTILINE,
        )

    # Comment removal leaves blank-line runs behind; collapse them so the page
    # doesn't open with a gap where the header comment used to be.
    text = re.sub(r"\n{3,}", "\n\n", text)

    sys.stdout.write(text.strip() + "\n")


if __name__ == "__main__":
    main()
