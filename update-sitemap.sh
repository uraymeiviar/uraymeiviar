#!/usr/bin/env bash
# ==============================================================================
# Auto-scanner for Uray Meiviar Portfolio
# Recursively scans the "data" directory for any folder containing "project.json",
# generates "data/sitemap.json", and syncs "llms.txt" and "sitemap.xml".
# Runs on Linux, macOS, WSL, and Windows (via Git Bash).
# ==============================================================================

set -e

# Change to repository root
cd "$(dirname "$0")"

echo "Scanning data/ for mapped project folders..."

if command -v python3 >/dev/null 2>&1; then
  PYTHON_CMD=python3
elif command -v python >/dev/null 2>&1; then
  PYTHON_CMD=python
else
  PYTHON_CMD=""
fi

if [ -n "$PYTHON_CMD" ]; then
  $PYTHON_CMD -c '
import os, json, datetime

data_dir = "data"
mapped_folders = []

for root, dirs, files in os.walk(data_dir):
    if "project.json" in files:
        rel = os.path.relpath(root, ".").replace("\\", "/")
        mapped_folders.append(rel)

import re

def sort_key(f):
    pj_path = os.path.join(f, "project.json")
    end_year = 0
    start_year = 0
    try:
        with open(pj_path, encoding="utf-8") as pf:
            pj = json.load(pf)
            t = pj.get("timeline") or pj.get("timespan") or pj.get("period") or ""
            if "present" in t.lower():
                end_year = 9999
            nums = [int(x) for x in re.findall(r'\b(19\d\d|20\d\d)\b', t)]
            if nums:
                if end_year != 9999:
                    end_year = max(nums)
                start_year = min(nums)
    except:
        pass
    return (-end_year, -start_year, f)

mapped_folders.sort(key=sort_key)

# 1. Update data/sitemap.json and data/projects.json
with open("data/sitemap.json", "w", encoding="utf-8") as f:
    json.dump(mapped_folders, f, indent=2)

with open("data/projects.json", "w", encoding="utf-8") as f:
    json.dump(mapped_folders, f, indent=2)

print(f"Updated data/sitemap.json with {len(mapped_folders)} mapped folders.")

# 2. Update sitemap.xml
today = datetime.date.today().isoformat()
xml_lines = [
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
    "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">",
    "  <url>",
    "    <loc>https://uray.dev/</loc>",
    f"    <lastmod>{today}</lastmod>",
    "    <changefreq>monthly</changefreq>",
    "    <priority>1.0</priority>",
    "  </url>",
    "  <url>",
    "    <loc>https://uray.dev/llms.txt</loc>",
    f"    <lastmod>{today}</lastmod>",
    "    <priority>0.8</priority>",
    "  </url>",
    "  <url>",
    "    <loc>https://uray.dev/data/profile/DESC.md</loc>",
    f"    <lastmod>{today}</lastmod>",
    "    <priority>0.9</priority>",
    "  </url>",
    "  <url>",
    "    <loc>https://uray.dev/story.html</loc>",
    f"    <lastmod>{today}</lastmod>",
    "    <priority>0.9</priority>",
    "  </url>"
]

for folder in mapped_folders:
    desc_path = f"{folder}/DESC.md"
    if os.path.isfile(desc_path):
        xml_lines.extend([
            "  <url>",
            f"    <loc>https://uray.dev/{desc_path}</loc>",
            f"    <lastmod>{today}</lastmod>",
            "    <priority>0.8</priority>",
            "  </url>"
        ])

xml_lines.append("</urlset>\n")
with open("sitemap.xml", "w", encoding="utf-8") as f:
    f.write("\n".join(xml_lines))
print("Updated sitemap.xml")

# 3. Update llms.txt
llms = [
    "# Uray Meiviar — Engineering Profile & Technical Architecture Index",
    "",
    "> Senior Simulation & Systems Software Engineer with 20+ years of experience in real-time military and civilian flight simulators, commercial transport aircraft avionics (FMS), real-time operating systems (RTOS), and distributed simulation protocols (IEEE 1278 DIS).",
    "",
    "## Comprehensive Biography & Dossier",
    "- [Uray Meiviar: Comprehensive Technical Biography](/data/profile/DESC.md): Full narrative chronicle from 1980s 8-bit computers and ITB mathematics to military defense simulators, the STMR Ethernet revolution, and SOYUT C4 strategic command.",
    "- [Engineering Chronicles & Technical Memoir Reader](/story.html): In-browser reader with table of contents and formatted architecture specifications.",
    "",
    "## Detailed Project Specifications & Architecture Documents",
    ""
]

for folder in mapped_folders:
    pj_path = f"{folder}/project.json"
    title = folder
    summary = ""
    if os.path.isfile(pj_path):
        try:
            with open(pj_path, encoding="utf-8") as pf:
                pj = json.load(pf)
                title = pj.get("title", folder)
                summary = pj.get("summary", "")
        except:
            pass
    desc_rel = f"{folder}/DESC.md"
    llms.append(f"- [{title}](/{desc_rel}): {summary}")

llms.extend([
    "",
    "## Contact & Professional Links",
    "- Website: https://uray.dev",
    "- Email: me@uray.dev",
    "- LinkedIn: https://id.linkedin.com/in/meiviar",
    "- GitHub: https://github.com/uraymeiviar"
])

with open("llms.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(llms) + "\n")
print("Updated llms.txt")
'
else
  # Pure Bash fallback if python is not installed
  FOLDERS=$(find data -type f -name "project.json" | sed 's|/project.json$||' | sort)
  JSON_ARRAY="[\n"
  FIRST=1
  for F in $FOLDERS; do
    if [ $FIRST -eq 1 ]; then
      JSON_ARRAY="${JSON_ARRAY}  \"$F\""
      FIRST=0
    else
      JSON_ARRAY="${JSON_ARRAY},\n  \"$F\""
    fi
  done
  JSON_ARRAY="${JSON_ARRAY}\n]\n"
  printf "$JSON_ARRAY" > data/sitemap.json
  printf "$JSON_ARRAY" > data/projects.json
  echo "Updated data/sitemap.json (bash fallback mode)."
fi

echo "All manifests successfully synchronized!"
