#!/usr/bin/env python3
"""Initialize the bundled XMP pricing snapshot from both official pages."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from check_pricing import run


def main() -> int:
    parser = argparse.ArgumentParser(description="Initialize the XMP pricing snapshot")
    parser.add_argument("--strict", action="store_true", help="Exit non-zero unless both pages verify")
    parser.add_argument("--timeout", type=int, default=20)
    parser.add_argument(
        "--output",
        default=str(Path(__file__).resolve().parent.parent / "references" / "pricing-check.json"),
        help="Snapshot output path",
    )
    args = parser.parse_args()
    result = run(args.timeout)
    output = Path(args.output)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if args.strict and result.get("status") != "verified":
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
