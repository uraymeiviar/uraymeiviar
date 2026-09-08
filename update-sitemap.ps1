<#
.SYNOPSIS
Auto-scanner for Uray Meiviar Portfolio (PowerShell)
Recursively scans the "data" directory for any folder containing "project.json",
generates "data/sitemap.json", and syncs "llms.txt" and "sitemap.xml".
#>

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

Write-Host "Scanning data/ for mapped project folders..." -ForegroundColor Cyan

$dataDir = "data"
$projects = Get-ChildItem -Path $dataDir -Recurse -Filter "project.json" -File

$mappedFolders = @()
foreach ($p in $projects) {
    $dir = $p.DirectoryName.Replace($PSScriptRoot, "").TrimStart("\", "/").Replace("\", "/")
    $mappedFolders += $dir
}

function Get-ProjectEndYear($pj) {
    $timeStr = ""
    if ($pj.timeline) { $timeStr = $pj.timeline }
    elseif ($pj.timespan) { $timeStr = $pj.timespan }
    elseif ($pj.period) { $timeStr = $pj.period }
    
    if ($timeStr -match "present") { return 9999 }
    $matches = [regex]::Matches($timeStr, "\b(19\d\d|20\d\d)\b")
    if ($matches.Count -gt 0) {
        $years = @($matches | ForEach-Object { [int]$_.Value })
        return ($years | Measure-Object -Maximum).Maximum
    }
    return 0
}

function Get-ProjectStartYear($pj) {
    $timeStr = ""
    if ($pj.timeline) { $timeStr = $pj.timeline }
    elseif ($pj.timespan) { $timeStr = $pj.timespan }
    elseif ($pj.period) { $timeStr = $pj.period }
    
    $matches = [regex]::Matches($timeStr, "\b(19\d\d|20\d\d)\b")
    if ($matches.Count -gt 0) {
        $years = @($matches | ForEach-Object { [int]$_.Value })
        return ($years | Measure-Object -Minimum).Minimum
    }
    return 0
}

# Sort folders: most recent first (end year desc, start year desc, alphabetical)
$sortedFolders = $mappedFolders | Sort-Object `
    @{ Expression = {
        $pjPath = Join-Path $_ "project.json"
        if (Test-Path $pjPath) {
            $json = Get-Content $pjPath -Raw | ConvertFrom-Json
            return -(Get-ProjectEndYear $json)
        }
        return 0
    }}, `
    @{ Expression = {
        $pjPath = Join-Path $_ "project.json"
        if (Test-Path $pjPath) {
            $json = Get-Content $pjPath -Raw | ConvertFrom-Json
            return -(Get-ProjectStartYear $json)
        }
        return 0
    }}, `
    @{ Expression = { $_ } }

# 1. Update data/sitemap.json and data/projects.json
$jsonContent = $sortedFolders | ConvertTo-Json -Depth 2
Set-Content -Path "data\sitemap.json" -Value $jsonContent -Encoding UTF8
Set-Content -Path "data\projects.json" -Value $jsonContent -Encoding UTF8
Write-Host "Updated data/sitemap.json with $($sortedFolders.Count) mapped folders." -ForegroundColor Green

# 2. Update sitemap.xml
$today = (Get-Date).ToString("yyyy-MM-dd")
$xml = @"
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://uray.dev/</loc>
    <lastmod>$today</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://uray.dev/llms.txt</loc>
    <lastmod>$today</lastmod>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://uray.dev/data/profile/DESC.md</loc>
    <lastmod>$today</lastmod>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://uray.dev/story.html</loc>
    <lastmod>$today</lastmod>
    <priority>0.9</priority>
  </url>
"@

foreach ($f in $sortedFolders) {
    $descPath = "$f/DESC.md"
    if (Test-Path $descPath) {
        $xml += @"

  <url>
    <loc>https://uray.dev/$descPath</loc>
    <lastmod>$today</lastmod>
    <priority>0.8</priority>
  </url>
"@
    }
}
$xml += "`n</urlset>`n"
Set-Content -Path "sitemap.xml" -Value $xml -Encoding UTF8
Write-Host "Updated sitemap.xml" -ForegroundColor Green

# 3. Update llms.txt
$llms = @"
# Uray Meiviar — Engineering Profile & Technical Architecture Index

> Senior Simulation & Systems Software Engineer with 20+ years of experience in real-time military and civilian flight simulators, commercial transport aircraft avionics (FMS), real-time operating systems (RTOS), and distributed simulation protocols (IEEE 1278 DIS).

## Comprehensive Biography & Dossier
- [Uray Meiviar: Comprehensive Technical Biography](/data/profile/DESC.md): Full narrative chronicle from 1980s 8-bit computers and ITB mathematics to military defense simulators, the STMR Ethernet revolution, and SOYUT C4 strategic command.
- [Engineering Chronicles & Technical Memoir Reader](/story.html): In-browser reader with table of contents and formatted architecture specifications.

## Detailed Project Specifications & Architecture Documents

"@

foreach ($f in $sortedFolders) {
    $pjPath = Join-Path $f "project.json"
    $title = $f
    $summary = ""
    if (Test-Path $pjPath) {
        $pj = Get-Content $pjPath -Raw | ConvertFrom-Json
        if ($pj.title) { $title = $pj.title }
        if ($pj.summary) { $summary = $pj.summary }
    }
    $llms += "- [$title](/$f/DESC.md): $summary`n"
}

$llms += @"

## Contact & Professional Links
- Website: https://uray.dev
- Email: me@uray.dev
- LinkedIn: https://id.linkedin.com/in/meiviar
- GitHub: https://github.com/uraymeiviar
"@

Set-Content -Path "llms.txt" -Value $llms -Encoding UTF8
Write-Host "Updated llms.txt" -ForegroundColor Green
Write-Host "All manifests successfully synchronized!" -ForegroundColor Cyan
