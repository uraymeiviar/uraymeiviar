#!/usr/bin/env node
/**
 * Static Site Generator (SSG) for Uray Meiviar Portfolio
 * 
 * - Discovers and parses all project.json files in data/
 * - Sorts projects chronologically (most recent first)
 * - Pre-renders #cat-bar, #tag-bar, #filter-summary-badge, and #project-grid in index.html
 * - Injects pre-baked JSON data so client-side hydration needs 0 network requests
 * - Updates data/sitemap.json, data/projects.json, sitemap.xml, and llms.txt
 * - Zero external npm dependencies (uses native Node.js fs and path)
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const INDEX_HTML_PATH = path.join(ROOT_DIR, 'index.html');
const STORY_HTML_PATH = path.join(ROOT_DIR, 'story.html');
const PROFILE_DESC_PATH = path.join(ROOT_DIR, 'data/profile/DESC.md');

// Markdown, KaTeX & Highlight.js engines (bundled locally in js/)
const marked = require(path.join(ROOT_DIR, 'js/marked.min.js'));
const katex = require(path.join(ROOT_DIR, 'js/katex/katex.min.js'));
const hljs = require(path.join(ROOT_DIR, 'js/highlight.min.js'));

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function resolveRelativePath(baseDir, relativePath) {
  if (!relativePath || relativePath.startsWith('http://') || relativePath.startsWith('https://') || relativePath.startsWith('/') || relativePath.startsWith('data:')) {
    return relativePath;
  }
  const combined = baseDir + relativePath;
  const parts = combined.split('/');
  const stack = [];
  for (const part of parts) {
    if (part === '' || part === '.') continue;
    if (part === '..') {
      if (stack.length > 0) stack.pop();
    } else {
      stack.push(part);
    }
  }
  return stack.join('/');
}

function renderStoryMarkdown(markdown, filePath) {
  const lastSlash = filePath.lastIndexOf('/');
  const docDir = lastSlash !== -1 ? filePath.substring(0, lastSlash + 1) : '';

  const mathBlocks = [];
  const mathInlines = [];

  // 1. Protect code blocks from math parsing
  const codeBlocks = [];
  let text = markdown.replace(/```[\s\S]*?```|`[^`\n]+`/g, (match) => {
    codeBlocks.push(match);
    return `%%%CODE_BLOCK_${codeBlocks.length - 1}%%%`;
  });

  // 2. Protect display math: $$ ... $$
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (match, tex) => {
    mathBlocks.push(tex.trim());
    return `\n\n%%%MATH_BLOCK_${mathBlocks.length - 1}%%%\n\n`;
  });

  // 3. Protect inline math: $ ... $
  text = text.replace(/(^|[^\$])\$([^\$\n]+?)\$(?!\$)/g, (match, prefix, tex) => {
    mathInlines.push(tex.trim());
    return `${prefix}%%%MATH_INLINE_${mathInlines.length - 1}%%%`;
  });

  // 4. Restore code blocks
  text = text.replace(/%%%CODE_BLOCK_(\d+)%%%/g, (match, idx) => codeBlocks[idx]);

  // 5. Preprocess image links: auto-encode unencoded spaces
  text = text.replace(/!\[([^\]]*)\]\((<[^>]+>|[^)\r\n]+)\)/g, (match, alt, rawUrl) => {
    let url = rawUrl.trim();
    if (url.startsWith('<') && url.endsWith('>')) {
      url = url.slice(1, -1).trim();
    }
    url = url.replace(/ /g, '%20');
    return `![${alt}](${url})`;
  });

  // 6. Custom marked renderer
  const renderer = new marked.Renderer();
  renderer.image = function({ href, title, text: alt }) {
    let cleanHref = href || '';
    try {
      cleanHref = decodeURI(cleanHref);
    } catch (e) {}

    const resolvedPath = resolveRelativePath(docDir, cleanHref);
    const finalSrc = encodeURI(resolvedPath);
    const altText = alt || '';
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
    const caption = altText ? `<figcaption>${escapeHtml(altText)}</figcaption>` : '';

    const isVideo = /\.(mp4|webm|ogg|mov|3gp|m4v)(\?.*)?$/i.test(cleanHref);
    if (isVideo) {
      const isWebm = /\.webm(\?.*)?$/i.test(cleanHref);
      const mimeType = isWebm ? 'video/webm' : 'video/mp4';
      return `<figure class="doc-figure doc-video-figure">
        <video controls playsinline preload="auto" class="doc-video" src="${finalSrc}" data-resolved="true"${titleAttr}>
          <source src="${finalSrc}" type="${mimeType}">
          Your browser does not support HTML5 video playback.
        </video>
        <div class="video-actions">
          <a href="${finalSrc}" target="_blank" class="video-direct-link" title="Open video directly in new tab or external player">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            Open video directly / Fullscreen
          </a>
        </div>
        ${caption}
      </figure>`;
    }

    return `<figure class="doc-figure">
      <img src="${finalSrc}" alt="${escapeHtml(altText)}"${titleAttr} loading="eager" class="zoomable-img" onclick="openLightbox('${finalSrc}', '${escapeHtml(altText)}')">
      ${caption}
    </figure>`;
  };

  const tocEntries = [];
  let firstH1 = '';

  renderer.heading = function({ tokens, depth, text: headingText }) {
    const cleanText = headingText.replace(/<[^>]+>/g, '').trim();
    if (depth === 1 && !firstH1) {
      firstH1 = cleanText;
    }
    const slug = slugify(cleanText);
    if (depth === 2 || depth === 3) {
      tocEntries.push({ depth, text: cleanText, id: slug });
    }
    return `<h${depth} id="${slug}">${marked.parseInline(headingText)}</h${depth}>\n`;
  };

  renderer.code = function({ text: code, lang }) {
    let highlighted = '';
    if (lang && hljs.getLanguage(lang)) {
      try {
        highlighted = hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
      } catch (err) {}
    }
    if (!highlighted) {
      try {
        highlighted = hljs.highlightAuto(code).value;
      } catch (err) {
        highlighted = escapeHtml(code);
      }
    }
    const langClass = lang ? ` class="language-${escapeHtml(lang)} hljs"` : ' class="hljs"';
    return `<pre><code${langClass}>${highlighted}</code></pre>\n`;
  };

  marked.use({ renderer, gfm: true, breaks: false });
  let html = marked.parse(text);

  // 7. Render display math with KaTeX
  html = html.replace(/<p>\s*%%%MATH_BLOCK_(\d+)%%%\s*<\/p>|%%%MATH_BLOCK_(\d+)%%%/g, (match, id1, id2) => {
    const id = id1 !== undefined ? id1 : id2;
    const tex = mathBlocks[id];
    try {
      return katex.renderToString(tex, { displayMode: true, throwOnError: false });
    } catch (e) {
      return `<div class="katex-fallback-block">$$${escapeHtml(tex)}$$</div>`;
    }
  });

  // 8. Render inline math with KaTeX
  html = html.replace(/%%%MATH_INLINE_(\d+)%%%/g, (match, id) => {
    const tex = mathInlines[id];
    try {
      return katex.renderToString(tex, { displayMode: false, throwOnError: false });
    } catch (e) {
      return `<span class="katex-fallback-inline">$${escapeHtml(tex)}$</span>`;
    }
  });

  return { html, tocEntries, firstH1 };
}

function findProjectFiles(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findProjectFiles(fullPath));
    } else if (entry.isFile() && entry.name === 'project.json') {
      results.push(fullPath);
    }
  }
  return results;
}

function parseTimelineYears(timelineStr) {
  if (!timelineStr) return { startYear: 0, endYear: 0 };
  const str = String(timelineStr).toLowerCase();
  const isPresent = str.includes('present');
  const matches = str.match(/\b(19\d\d|20\d\d)\b/g);
  let endYear = 0;
  let startYear = 0;
  if (isPresent) {
    endYear = 9999;
  }
  if (matches && matches.length > 0) {
    const nums = matches.map(Number);
    if (!isPresent) {
      endYear = Math.max(...nums);
    }
    startYear = Math.min(...nums);
  }
  return { startYear, endYear };
}

function build() {
  console.log('🚀 Starting Static Site Generation (SSG)...');

  // 1. Discover all project.json files
  const projectFiles = findProjectFiles(DATA_DIR);
  console.log(`Found ${projectFiles.length} project.json files.`);

  const projects = [];

  for (const file of projectFiles) {
    const folderPath = path.dirname(file);
    const relFolder = path.relative(ROOT_DIR, folderPath).replace(/\\/g, '/');

    try {
      const content = fs.readFileSync(file, 'utf8');
      const proj = JSON.parse(content);
      proj._folder = relFolder;

      // Resolve relative images to project folder
      if (proj.images && Array.isArray(proj.images)) {
        proj.images = proj.images.map(img => {
          if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('data/')) {
            return img;
          }
          return `${relFolder}/${img}`.replace(/\/+/g, '/');
        });
      } else {
        proj.images = [];
      }

      // Calculate timeline years for sorting
      const timeStr = proj.timeline || proj.timespan || proj.period || '';
      const { startYear, endYear } = parseTimelineYears(timeStr);
      proj._startYear = startYear;
      proj._endYear = endYear;

      projects.push(proj);
    } catch (err) {
      console.warn(`⚠️ Warning: Failed to parse ${file}:`, err.message);
    }
  }

  // 2. Sort projects (most recent first)
  projects.sort((a, b) => {
    if (b._endYear !== a._endYear) return b._endYear - a._endYear;
    if (b._startYear !== a._startYear) return b._startYear - a._startYear;
    return (a.title || '').localeCompare(b.title || '');
  });

  const mappedFolders = projects.map(p => p._folder);

  // 3. Aggregate categories & tags
  const catCounts = {};
  const tagCounts = {};

  projects.forEach(p => {
    const cat = p.category || 'Other';
    catCounts[cat] = (catCounts[cat] || 0) + 1;

    (p.tags || []).forEach(t => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });

  const sortedCats = Object.keys(catCounts).sort((a, b) => catCounts[b] - catCounts[a]);
  const sortedTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]);

  // 4. Generate HTML for Category Bar
  let catBarHtml = `\n            <button class="filter-btn cat-filter-btn active" data-cat="all">All Domains <span style="opacity:0.6; font-size:0.75rem;">(${projects.length})</span></button>\n`;
  for (const cat of sortedCats) {
    catBarHtml += `            <button class="filter-btn cat-filter-btn" data-cat="${escapeHtml(cat)}">${escapeHtml(cat)} <span style="opacity:0.6; font-size:0.75rem;">(${catCounts[cat]})</span></button>\n`;
  }
  catBarHtml += '          ';

  // 5. Generate HTML for Tag Bar
  let tagBarHtml = `\n            <button class="tag-btn active" data-tag="all">All Tags</button>\n`;
  for (const tag of sortedTags) {
    tagBarHtml += `            <button class="tag-btn" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)} <span style="opacity:0.6; font-size:0.65rem;">(${tagCounts[tag]})</span></button>\n`;
  }
  tagBarHtml += '          ';

  // 6. Generate HTML for Summary Badge
  const summaryBadgeHtml = `All Domains (${projects.length})`;

  // 7. Generate HTML for Project Grid
  let projectGridHtml = '\n';
  projects.forEach((p, idx) => {
    const hasImages = p.images && p.images.length > 0;
    const firstImage = hasImages ? p.images[0] : null;
    const imageCount = hasImages ? p.images.length : 0;

    let thumbHtml = '';
    if (hasImages && imageCount > 1) {
      const slidesHtml = p.images.map((img, i) => `
          <div class="project-thumb-slide">
            <img src="${escapeHtml(img)}" alt="${escapeHtml(p.title)} - ${i + 1}" loading="lazy">
          </div>`).join('') + `
          <div class="project-thumb-slide">
            <img src="${escapeHtml(p.images[0])}" alt="${escapeHtml(p.title)} - 1" loading="lazy">
          </div>`;

      thumbHtml = `
        <div class="project-thumb">
          <div class="project-thumb-track">${slidesHtml}
          </div>
          <span class="project-photo-count">📷 1 / ${imageCount}</span>
        </div>`;
    } else if (hasImages) {
      thumbHtml = `
        <div class="project-thumb">
          <img src="${escapeHtml(firstImage)}" alt="${escapeHtml(p.title)}" loading="lazy">
        </div>`;
    } else {
      thumbHtml = `
        <div class="project-thumb">
          <div class="project-thumb-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
            <span>${p.featured ? '★ FLAGSHIP SYSTEMS' : 'PROJECT SHOWCASE'}</span>
          </div>
        </div>`;
    }

    const tagsHtml = (p.tags || []).slice(0, 5).map(t => 
      `<span class="card-tag">${escapeHtml(t)}</span>`
    ).join('');

    const categoryAttr = escapeHtml(p.category || 'Other');
    const tagsAttr = escapeHtml((p.tags || []).join(','));

    const timeDisplay = p.timeline || p.timespan || p.period || '';

    projectGridHtml += `        <article class="project-card ${p.featured ? 'featured' : ''}" data-index="${idx}" data-cat="${categoryAttr}" data-tags="${tagsAttr}">
          ${thumbHtml.trim()}
          <div class="project-body">
            <h3 class="project-title">${escapeHtml(p.title)}</h3>
            <div class="project-role-line">${escapeHtml(p.role || '')} ${timeDisplay ? `· ${escapeHtml(timeDisplay)}` : ''}</div>
            <p class="project-summary">${escapeHtml(p.summary || '')}</p>
            <div class="project-tags">${tagsHtml}</div>
          </div>
          <div class="project-footer">
            <span>${escapeHtml(p.category || 'Engineering')}</span>
          </div>
        </article>\n`;
  });
  projectGridHtml += '      ';

  // 8. Injected JSON data script (without internal sorting flags)
  const cleanProjectsData = projects.map(p => {
    const clean = { ...p };
    delete clean._startYear;
    delete clean._endYear;
    return clean;
  });
  const jsonDataScript = `<script id="projects-data" type="application/json">${JSON.stringify(cleanProjectsData)}</script>`;

  // 9. Update index.html using robust SSG comment markers
  let indexHtml = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

  // Safety check: ensure SSG markers exist so we never corrupt or overwrite manual content
  if (!indexHtml.includes('<!-- SSG_PROJECT_CARDS_START -->') || !indexHtml.includes('<!-- SSG_PROJECT_CARDS_END -->')) {
    console.warn('⚠️ Safety Notice: SSG comment markers not found in index.html. Skipping index.html update to preserve manual edits.');
    return;
  }

  // Replace Summary Badge
  const summaryMarkerRegex = /<!-- SSG_SUMMARY_START -->[\s\S]*?<!-- SSG_SUMMARY_END -->/;
  if (summaryMarkerRegex.test(indexHtml)) {
    indexHtml = indexHtml.replace(summaryMarkerRegex, `<!-- SSG_SUMMARY_START -->${summaryBadgeHtml}<!-- SSG_SUMMARY_END -->`);
  }

  // Replace Category Bar
  const catMarkerRegex = /<!-- SSG_CAT_BAR_START -->[\s\S]*?<!-- SSG_CAT_BAR_END -->/;
  if (catMarkerRegex.test(indexHtml)) {
    indexHtml = indexHtml.replace(catMarkerRegex, `<!-- SSG_CAT_BAR_START -->${catBarHtml}<!-- SSG_CAT_BAR_END -->`);
  } else {
    const catBarRegex = /(<div id="cat-bar" class="cat-bar">)(.*?)(<\/div>)/s;
    if (catBarRegex.test(indexHtml)) {
      indexHtml = indexHtml.replace(catBarRegex, `$1<!-- SSG_CAT_BAR_START -->${catBarHtml}<!-- SSG_CAT_BAR_END -->$3`);
    }
  }

  // Replace Tag Bar
  const tagMarkerRegex = /<!-- SSG_TAG_BAR_START -->[\s\S]*?<!-- SSG_TAG_BAR_END -->/;
  if (tagMarkerRegex.test(indexHtml)) {
    indexHtml = indexHtml.replace(tagMarkerRegex, `<!-- SSG_TAG_BAR_START -->${tagBarHtml}<!-- SSG_TAG_BAR_END -->`);
  } else {
    const tagBarRegex = /(<div id="tag-bar" class="tag-bar">)(.*?)(<\/div>)/s;
    if (tagBarRegex.test(indexHtml)) {
      indexHtml = indexHtml.replace(tagBarRegex, `$1<!-- SSG_TAG_BAR_START -->${tagBarHtml}<!-- SSG_TAG_BAR_END -->$3`);
    }
  }

  // Replace Project Grid Cards
  const gridMarkerRegex = /<!-- SSG_PROJECT_CARDS_START -->[\s\S]*?<!-- SSG_PROJECT_CARDS_END -->/;
  if (gridMarkerRegex.test(indexHtml)) {
    indexHtml = indexHtml.replace(gridMarkerRegex, `<!-- SSG_PROJECT_CARDS_START -->${projectGridHtml}<!-- SSG_PROJECT_CARDS_END -->`);
  }

  // Inject or replace #projects-data script
  const dataMarkerRegex = /<!-- SSG_DATA_START -->[\s\S]*?<!-- SSG_DATA_END -->/;
  if (dataMarkerRegex.test(indexHtml)) {
    indexHtml = indexHtml.replace(dataMarkerRegex, `<!-- SSG_DATA_START -->\n  ${jsonDataScript}\n  <!-- SSG_DATA_END -->`);
  } else {
    const dataRegex = /<script id="projects-data" type="application\/json">.*?<\/script>/s;
    if (dataRegex.test(indexHtml)) {
      indexHtml = indexHtml.replace(dataRegex, jsonDataScript);
    } else {
      indexHtml = indexHtml.replace('  <script src="js/app.js"></script>', `  ${jsonDataScript}\n  <script src="js/app.js"></script>`);
    }
  }

  fs.writeFileSync(INDEX_HTML_PATH, indexHtml, 'utf8');
  console.log(`✅ Pre-rendered index.html with ${projects.length} project cards, categories, and tags.`);

  // 10. SSG story.html (Pre-render biography / engineering memoir)
  if (fs.existsSync(STORY_HTML_PATH) && fs.existsSync(PROFILE_DESC_PATH)) {
    let storyHtml = fs.readFileSync(STORY_HTML_PATH, 'utf8');

    if (storyHtml.includes('<!-- SSG_STORY_CONTENT_START -->') && storyHtml.includes('<!-- SSG_STORY_CONTENT_END -->')) {
      const profileMd = fs.readFileSync(PROFILE_DESC_PATH, 'utf8');
      const rendered = renderStoryMarkdown(profileMd, 'data/profile/DESC.md');

      // Generate Table of Contents HTML
      let tocHtml = '\n';
      for (const entry of rendered.tocEntries) {
        const isSub = entry.depth === 3;
        const padStyle = isSub ? ' style="padding-left: 1.25rem;"' : '';
        tocHtml += `        <li${padStyle}><a href="#${entry.id}">${escapeHtml(entry.text)}</a></li>\n`;
      }
      tocHtml += '      ';

      // Generate Document Selector Options
      let selectorHtml = '\n        <option value="data/profile/DESC.md" selected>📖 Full Biography & Engineering Memoir</option>\n';
      for (const folder of mappedFolders) {
        const cleanName = folder.replace(/^data\//, '').replace('T&E/', 'T&E: ');
        selectorHtml += `        <option value="${folder}/DESC.md">📄 ${escapeHtml(cleanName)}</option>\n`;
      }
      selectorHtml += '      ';

      // Replace selector options
      storyHtml = storyHtml.replace(
        /<!-- SSG_STORY_SELECTOR_START -->[\s\S]*?<!-- SSG_STORY_SELECTOR_END -->/,
        `<!-- SSG_STORY_SELECTOR_START -->${selectorHtml}<!-- SSG_STORY_SELECTOR_END -->`
      );

      // Replace TOC
      storyHtml = storyHtml.replace(
        /<!-- SSG_STORY_TOC_START -->[\s\S]*?<!-- SSG_STORY_TOC_END -->/,
        `<!-- SSG_STORY_TOC_START -->${tocHtml}<!-- SSG_STORY_TOC_END -->`
      );
      // Unhide TOC box if TOC has entries
      if (rendered.tocEntries.length >= 2) {
        storyHtml = storyHtml.replace(/<nav id="toc-box" class="toc-box"\s*(?:style="display:\s*none;?")?>/, '<nav id="toc-box" class="toc-box">');
      }

      // Replace document content
      const storyContentHtml = `\n${rendered.html}    `;
      storyHtml = storyHtml.replace(
        /<!-- SSG_STORY_CONTENT_START -->[\s\S]*?<!-- SSG_STORY_CONTENT_END -->/,
        `<!-- SSG_STORY_CONTENT_START -->${storyContentHtml}<!-- SSG_STORY_CONTENT_END -->`
      );

      // Ensure data-current-file is set
      storyHtml = storyHtml.replace(
        /<article id="doc-content"(\s+data-current-file="[^"]*")?>/,
        '<article id="doc-content" data-current-file="data/profile/DESC.md">'
      );

      // Update <title>
      if (rendered.firstH1) {
        storyHtml = storyHtml.replace(/<title>.*?<\/title>/, `<title>${escapeHtml(rendered.firstH1)} | Uray Meiviar</title>`);
      }

      // Update #raw-link
      storyHtml = storyHtml.replace(/(<a id="raw-link" href=")[^"]*(")/, '$1data/profile/DESC.md$2');

      fs.writeFileSync(STORY_HTML_PATH, storyHtml, 'utf8');
      console.log(`✅ Pre-rendered story.html with ${rendered.tocEntries.length} TOC entries and ${Math.round(storyContentHtml.length / 1024)} KB of documentation.`);
    } else {
      console.warn('⚠️ Safety Notice: SSG comment markers not found in story.html. Skipping story.html update.');
    }
  }

  // 11. Update data/sitemap.json & data/projects.json
  const sitemapJsonPath = path.join(DATA_DIR, 'sitemap.json');
  const projectsJsonPath = path.join(DATA_DIR, 'projects.json');
  fs.writeFileSync(sitemapJsonPath, JSON.stringify(mappedFolders, null, 2), 'utf8');
  fs.writeFileSync(projectsJsonPath, JSON.stringify(mappedFolders, null, 2), 'utf8');
  console.log('✅ Synchronized data/sitemap.json and data/projects.json.');

  // 11. Update sitemap.xml
  const today = new Date().toISOString().split('T')[0];
  const sitemapXmlLines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    '  <url>',
    '    <loc>https://uray.dev/</loc>',
    `    <lastmod>${today}</lastmod>`,
    '    <changefreq>monthly</changefreq>',
    '    <priority>1.0</priority>',
    '  </url>',
    '  <url>',
    '    <loc>https://uray.dev/llms.txt</loc>',
    `    <lastmod>${today}</lastmod>`,
    '    <priority>0.8</priority>',
    '  </url>',
    '  <url>',
    '    <loc>https://uray.dev/data/profile/DESC.md</loc>',
    `    <lastmod>${today}</lastmod>`,
    '    <priority>0.9</priority>',
    '  </url>',
    '  <url>',
    '    <loc>https://uray.dev/story.html</loc>',
    `    <lastmod>${today}</lastmod>`,
    '    <priority>0.9</priority>',
    '  </url>'
  ];

  for (const folder of mappedFolders) {
    const descPath = path.join(ROOT_DIR, folder, 'DESC.md');
    if (fs.existsSync(descPath)) {
      sitemapXmlLines.push(
        '  <url>',
        `    <loc>https://uray.dev/${folder}/DESC.md</loc>`,
        `    <lastmod>${today}</lastmod>`,
        '    <priority>0.8</priority>',
        '  </url>'
      );
    }
  }
  sitemapXmlLines.push('</urlset>\n');
  fs.writeFileSync(path.join(ROOT_DIR, 'sitemap.xml'), sitemapXmlLines.join('\n'), 'utf8');
  console.log('✅ Synchronized sitemap.xml.');

  // 12. Update llms.txt
  const llmsLines = [
    '# Uray Meiviar — Engineering Profile & Technical Architecture Index',
    '',
    '> Senior Simulation & Systems Software Engineer with 20+ years of experience in real-time military and civilian flight simulators, commercial transport aircraft avionics (FMS), real-time operating systems (RTOS), and distributed simulation protocols (IEEE 1278 DIS).',
    '',
    '## Comprehensive Biography & Dossier',
    '- [Uray Meiviar: Comprehensive Technical Biography](/data/profile/DESC.md): Full narrative chronicle from 1980s 8-bit computers and ITB mathematics to military defense simulators, the STMR Ethernet revolution, and SOYUT C4 strategic command.',
    '- [Engineering Chronicles & Technical Memoir Reader](/story.html): In-browser reader with table of contents and formatted architecture specifications.',
    '',
    '## Detailed Project Specifications & Architecture Documents',
    ''
  ];

  for (const p of projects) {
    const descRel = `${p._folder}/DESC.md`;
    llmsLines.push(`- [${p.title}](/${descRel}): ${p.summary || ''}`);
  }

  llmsLines.push(
    '',
    '## Contact & Professional Links',
    '- Website: https://uray.dev',
    '- Email: me@uray.dev',
    '- LinkedIn: https://id.linkedin.com/in/meiviar',
    '- GitHub: https://github.com/uraymeiviar'
  );

  fs.writeFileSync(path.join(ROOT_DIR, 'llms.txt'), llmsLines.join('\n') + '\n', 'utf8');
  console.log('✅ Synchronized llms.txt.');

  console.log('🎉 Static Site Generation completed successfully!');
}

build();
