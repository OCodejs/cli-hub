import authWorker from "../auth-worker/src/index.js";

const AUTH_ROUTE = /^\/(?:health|auth(?:\/|$)|api(?:\/|$))/;

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Keep authentication and API requests on the Pages origin so Safari treats
  // the HttpOnly session cookie as first-party rather than a third-party cookie.
  if (AUTH_ROUTE.test(url.pathname)) {
    const origin = request.headers.get("Origin");
    const fetchSite = request.headers.get("Sec-Fetch-Site");
    const isOAuthCallback = url.pathname === "/auth/github/callback" && request.method === "GET";
    if (!isOAuthCallback && ((origin && origin !== url.origin) || fetchSite === "cross-site")) {
      return new Response(JSON.stringify({ error: "origin_not_allowed" }), {
        status: 403,
        headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
      });
    }
    const headers = new Headers(request.headers);
    if (isOAuthCallback || !origin) headers.set("Origin", url.origin);
    const sameOriginRequest = new Request(request, { headers });
    return authWorker.fetch(sameOriginRequest, { ...env, APP_ORIGIN: url.origin });
  }

  // Pass static assets through to the Pages asset pipeline.
  const response = await context.next();
  if ([204, 205, 304].includes(response.status)) return response;
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return response;

  const html = await response.text();
  const configured = html.replace(
    "</head>",
    '<script>window.OCODE_AUTH_API = location.origin;</script></head>'
  );
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.delete("etag");
  headers.set("cache-control", "no-store");
  return new Response(configured, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
