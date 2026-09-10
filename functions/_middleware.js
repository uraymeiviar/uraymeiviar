export async function onRequest(context) {
  const { request, next } = context;
  const accept = (request.headers.get("accept") || "").toLowerCase();
  const ua = (request.headers.get("user-agent") || "").toLowerCase();

  const isMarkdownReq = accept.includes("text/markdown");
  const isAiAgent = /google-agent|googleother|googlebot|gptbot|chatgpt-user|chatgpt|claudebot|claude-web|claude|perplexitybot|perplexity|anthropic-ai|bytespider|applebot-extended|cohere-ai|diffbot/.test(ua);

  const url = new URL(request.url);
  const pathname = url.pathname;

  // 1. Explicit Markdown content negotiation
  if (isMarkdownReq) {
    if (pathname === "/" || pathname === "/index.html") {
      const assetUrl = new URL("/llms.txt", request.url);
      const assetRes = await context.env.ASSETS.fetch(assetUrl);
      const text = await assetRes.text();
      return new Response(text, {
        status: 200,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Vary": "Accept, User-Agent",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    if (pathname === "/story" || pathname === "/story.html" || pathname === "/memoir") {
      const assetUrl = new URL("/data/profile/DESC.txt", request.url);
      const assetRes = await context.env.ASSETS.fetch(assetUrl);
      const text = await assetRes.text();
      return new Response(text, {
        status: 200,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Vary": "Accept, User-Agent",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
  }

  // 2. AI agent crawlers (Gemini, Googlebot, ChatGPT, Claude) requesting HTML
  if (isAiAgent) {
    // Serve the lightweight, high-density 25 KB semantic HTML version
    if (pathname === "/" || pathname === "/index.html") {
      const assetUrl = new URL("/ai-index.html", request.url);
      const assetRes = await context.env.ASSETS.fetch(assetUrl);
      const text = await assetRes.text();
      return new Response(text, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Vary": "Accept, User-Agent",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // For story/memoir: serve clean semantic HTML wrapper without heavy UI scripts
    if (pathname === "/story" || pathname === "/story.html" || pathname === "/memoir") {
      const assetUrl = new URL("/data/profile/DESC.txt", request.url);
      const assetRes = await context.env.ASSETS.fetch(assetUrl);
      const text = await assetRes.text();
      const safeText = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const cleanStoryHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Engineering Memoir | Uray Meiviar</title>
  <meta name="description" content="Technical memoir and 20+ year engineering chronicles of Uray Meiviar.">
  <link rel="alternate" type="text/plain" href="/data/profile/DESC.txt" title="Plain Text Memoir">
</head>
<body style="font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 1.5rem; line-height: 1.6;">
  <h1>Engineering Memoir — Uray Meiviar</h1>
  <p><a href="/">← Return to Portfolio</a> | <a href="/data/profile/DESC.txt">View Raw Text</a></p>
  <hr>
  <pre style="white-space: pre-wrap; font-family: system-ui, sans-serif;">${safeText}</pre>
</body>
</html>`;
      return new Response(cleanStoryHtml, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Vary": "Accept, User-Agent",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
  }

  // 3. Normal human browsers -> serve standard full visual SSG website
  return next();
}

