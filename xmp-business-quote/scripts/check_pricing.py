#!/usr/bin/env python3
"""Fetch and validate the live XMP CNY/USD pricing pages.

The calculator intentionally keeps a reviewed local price snapshot. This checker
must run first: it proves that both official pages are reachable and still contain
the snapshot's key price markers, then records the live-page check time and hashes.
If a marker changes, stop quoting and update the snapshot and tests.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from datetime import datetime
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo


SOURCES = {
    "usd": {
        "url": "https://help-xmp.mobvista.com/docs/xmp_price_usd",
        "title_hint": "美元",
        "markers": ["5500", "9500", "12500", "14500", "2800", "1400", "120", "1650"],
    },
    "cny": {
        "url": "https://help-xmp.mobvista.com/docs/xmp_price_cny",
        "title_hint": "XMP",
        "markers": ["39000", "69000", "89000", "100000", "20000", "10000", "1000", "12000"],
    },
}


class TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []

    def handle_data(self, data: str) -> None:
        self.parts.append(data)

    @property
    def text(self) -> str:
        return " ".join(self.parts)


def fetch(url: str, timeout: int) -> tuple[str, str]:
    request = Request(url, headers={"User-Agent": "xmp-business-quote-pricing-check/1.0"})
    with urlopen(request, timeout=timeout) as response:
        raw = response.read()
        charset = response.headers.get_content_charset() or "utf-8"
    return raw.decode(charset, errors="replace"), hashlib.sha256(raw).hexdigest()


def check_source(currency: str, timeout: int) -> dict[str, Any]:
    source = SOURCES[currency]
    html, content_sha256 = fetch(source["url"], timeout)
    parser = TextExtractor()
    parser.feed(html)
    normalized = re.sub(r"[\s,，]", "", parser.text)
    title_match = re.search(r"<title[^>]*>(.*?)</title>", html, flags=re.I | re.S)
    title = re.sub(r"\s+", " ", title_match.group(1)).strip() if title_match else ""
    modified_dates = sorted(set(re.findall(r"20\d\d-\d\d-\d\d", html)))
    missing_markers = [marker for marker in source["markers"] if marker not in normalized]
    return {
        "currency": currency,
        "url": source["url"],
        "title": title,
        "modified_dates_found": modified_dates,
        "content_sha256": content_sha256,
        "required_price_markers": source["markers"],
        "missing_price_markers": missing_markers,
        "status": "verified" if title and not missing_markers else "mismatch",
    }


def run(timeout: int) -> dict[str, Any]:
    checked_at = datetime.now(ZoneInfo("Asia/Shanghai")).isoformat(timespec="seconds")
    sources: list[dict[str, Any]] = []
    errors: list[str] = []
    for currency in ("usd", "cny"):
        try:
            sources.append(check_source(currency, timeout))
        except Exception as error:  # network/TLS/HTML failures must block formal quoting
            source = SOURCES[currency]
            errors.append(f"{currency.upper()} {source['url']}: {error}")
            sources.append({
                "currency": currency,
                "url": source["url"],
                "status": "unreachable",
                "error": str(error),
            })
    status = "verified" if not errors and all(item.get("status") == "verified" for item in sources) else "blocked"
    return {
        "status": status,
        "checked_at": checked_at,
        "timezone": "Asia/Shanghai",
        "sources": sources,
        "errors": errors,
        "instruction": "若 status 不是 verified，先更新本地价格快照和测试，不得输出正式报价。",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify live XMP CNY/USD pricing pages")
    parser.add_argument("--output", help="Write the verification JSON to this path")
    parser.add_argument("--timeout", type=int, default=20)
    parser.add_argument("--strict", action="store_true", help="Exit non-zero unless both pages verify")
    args = parser.parse_args()
    result = run(args.timeout)
    payload = json.dumps(result, ensure_ascii=False, indent=2)
    if args.output:
        Path(args.output).write_text(payload + "\n", encoding="utf-8")
    print(payload)
    return 0 if result["status"] == "verified" or not args.strict else 1


if __name__ == "__main__":
    raise SystemExit(main())
