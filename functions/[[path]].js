import authWorker from "../auth-worker/src/index.js";

const AUTH_ROUTE = /^\/(?:health|auth(?:\/|$)|api(?:\/|$))/;

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Keep authentication and API requests on the Pages origin so Safari treats
  // the HttpOnly session cookie as first-party rather than a third-party cookie.
  if (AUTH_ROUTE.test(url.pathname)) {
    return authWorker.fetch(request, { ...env, APP_ORIGIN: url.origin });
  }

  // Pass static assets through to the Pages asset pipeline.
  const response = await context.next();
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
