export async function onRequest(context) {
  const { request, next } = context;
  const accept = request.headers.get("accept") || "";

  // Content negotiation for AI agents requesting Markdown
  if (accept.includes("text/markdown")) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Homepage negotiation -> serve llms.txt
    if (pathname === "/" || pathname === "/index.html") {
      const assetUrl = new URL("/llms.txt", request.url);
      const assetRes = await context.env.ASSETS.fetch(assetUrl);
      const text = await assetRes.text();
      return new Response(text, {
        status: 200,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Vary": "Accept",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // Memoir / story negotiation -> serve DESC.txt
    if (pathname === "/story" || pathname === "/story.html" || pathname === "/memoir") {
      const assetUrl = new URL("/data/profile/DESC.txt", request.url);
      const assetRes = await context.env.ASSETS.fetch(assetUrl);
      const text = await assetRes.text();
      return new Response(text, {
        status: 200,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Vary": "Accept",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
  }

  // Pass through all standard requests to static assets
  return next();
}
