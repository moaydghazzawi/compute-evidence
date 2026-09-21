#!/usr/bin/env python3
"""Save public source text for the optional Jev audit; never changes research data.

HTML uses Python's standard library. PDF extraction requires pypdf.
Run with --refresh to replace saved snapshots. Failed fetches remain visible.
"""
import argparse
import concurrent.futures
import datetime
import hashlib
import io
import json
import re
import urllib.error
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def source_coverage(text):
    if re.search(r"(?i)(this post is for paid subscribers|subscribe to (read|continue)|continue reading with a subscription)", text):
        return "selected excerpts"
    return "full captured text"


class SourceText(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
        self.hidden = 0
        self.in_cell = False

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "noscript"):
            self.hidden += 1
        if not self.hidden and tag in ("p", "div", "section", "tr", "li", "br", "h1", "h2", "h3", "h4"):
            self.parts.append(" " if self.in_cell else "\n")
        if not self.hidden and tag in ("td", "th"):
            self.parts.append(" | ")
            self.in_cell = True

    def handle_endtag(self, tag):
        if tag in ("script", "style", "noscript"):
            self.hidden = max(0, self.hidden - 1)
        if tag in ("td", "th"):
            self.in_cell = False
        if not self.hidden and tag in ("p", "div", "section", "tr", "li"):
            self.parts.append(" " if self.in_cell else "\n")

    def handle_data(self, data):
        if not self.hidden:
            self.parts.append(re.sub(r"\s+", " ", data))

    def text(self):
        return "\n".join(line for line in (
            re.sub(r"\s+", " ", line).strip() for line in "".join(self.parts).splitlines()
        ) if line) + "\n"


def capture(source, output, previous, refresh):
    source_id = source["id"]
    saved = previous.get(source_id, {})
    if not refresh and saved.get("status") == "ok" and saved.get("sourceUrl") == source["url"]:
        path = output / saved["textFile"]
        if path.is_file() and hashlib.sha256(path.read_bytes()).hexdigest() == saved.get("sha256"):
            return source_id, saved

    url = source["url"]
    # Prefer full paper text to an abstract. The resolved URL is always recorded.
    if url.startswith("https://arxiv.org/abs/"):
        url = url.replace("/abs/", "/html/")
    record = {
        "sourceUrl": source["url"],
        "retrievedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "retrievedUrl": url,
    }
    try:
        request = urllib.request.Request(url, headers={"User-Agent": "ResearchEvidenceAudit/1.0"})
        with urllib.request.urlopen(request, timeout=25) as response:
            raw = response.read(12_000_001)
            if len(raw) > 12_000_000:
                raise ValueError("Source exceeds the 12 MB download limit")
            record["retrievedUrl"] = response.url
            charset = response.headers.get_content_charset() or "utf-8"
            content_type = response.headers.get("Content-Type", "")
        if raw.startswith(b"%PDF"):
            from pypdf import PdfReader
            pages = PdfReader(io.BytesIO(raw)).pages
            text = "\n\n".join(f"[Page {i + 1}]\n{page.extract_text() or ''}" for i, page in enumerate(pages)) + "\n"
            record["extraction"] = "pypdf; page labels retained"
        elif "html" in content_type:
            parser = SourceText()
            parser.feed(raw.decode(charset, errors="replace"))
            text = parser.text()
            record["extraction"] = "HTML text; rows and cell separators retained"
        elif "text/" in content_type:
            text = raw.decode(charset, errors="replace")
            record["extraction"] = "plain text"
        else:
            raise ValueError("Unsupported source content type")
        if len(text.strip()) < 250:
            raise ValueError("Source text is too short; inspect the page manually")
        if re.search(r"(?i)(checking your browser|just a moment|enable javascript and cookies|access denied|request rate threshold exceeded)", text[:1800]):
            raise ValueError("Publisher returned a browser check or access-denied page")
        record["coverage"] = source_coverage(text)
        if record["coverage"] == "selected excerpts":
            record["coverageNote"] = "Only the publicly visible preview was captured; the complete article was not accessed."
        if source["sourceType"] == "Company repository" and url.startswith("https://huggingface.co/"):
            repo = url.removeprefix("https://huggingface.co/").strip("/")
            listing_url = f"https://huggingface.co/api/models/{repo}/tree/main"
            with urllib.request.urlopen(listing_url, timeout=25) as response:
                if 'rel="next"' in response.headers.get("Link", ""):
                    raise ValueError("Repository listing is paginated; inspect the complete file tree manually")
                files = json.load(response)
            shards = [item for item in files if item["path"].endswith(".safetensors")]
            text += f"\nSupplement: public file listing from {listing_url}\n"
            text += "\n".join(f"{item['path']}: {item['size']} bytes" for item in shards) + "\n"
            text += f"Calculated from the listed files: {len(shards)} weight shards, {sum(item['size'] for item in shards)} bytes.\n"
            record["supplementalUrls"] = [listing_url]
        text_file = f"{source_id}.txt"
        encoded = text.encode("utf-8")
        (output / text_file).write_bytes(encoded)
        record.update(status="ok", textFile=text_file, sha256=hashlib.sha256(encoded).hexdigest(), characters=len(text))
    except (OSError, ValueError, ImportError, urllib.error.URLError) as error:
        record.update(status="unavailable", error=str(error))
    return source_id, record


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--refresh", action="store_true")
    parser.add_argument("--only", help="Capture one source ID")
    parser.add_argument("--output", type=Path, default=ROOT / "private/jev-audit/sources")
    args = parser.parse_args()
    output = args.output.resolve()
    if not output.is_relative_to(ROOT / "private"):
        parser.error("Source snapshots must stay inside this repository's ignored private/ directory")
    output.mkdir(parents=True, exist_ok=True)
    manifest = output / "manifest.json"
    previous = json.loads(manifest.read_text()).get("sources", {}) if manifest.exists() else {}
    data = json.loads((ROOT / "data/research.json").read_text())
    used = {item["sourceId"] for item in data["evidence"]}
    sources = [source for source in data["sources"] if source["id"] in used]
    if args.only:
        sources = [source for source in sources if source["id"] == args.only]
        if not sources:
            parser.error("Unknown evidence source ID")
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        records = dict(pool.map(lambda source: capture(source, output, previous, args.refresh), sources))
    manifest.write_text(json.dumps({"version": 1, "sources": {**previous, **records}}, ensure_ascii=False, indent=2) + "\n")
    for source_id, record in records.items():
        print(f"{source_id}: {record['status']} ({record.get('characters', record.get('error'))})")
    print(f"Snapshots: {manifest}")


if __name__ == "__main__":
    main()
