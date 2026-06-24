// Where compilation happens:
//   - COMPILE_API_URL set to a URL      -> proxy to that compile service
//   - COMPILE_API_URL unset or "local"  -> compile locally against ../sfa
//
// In production (e.g. Amplify), set COMPILE_API_URL to the deployed compile
// service's address. The proxy runs server-side only (API routes), so the
// service can be plain HTTP and lesson solutions never reach the browser.
export function compileApiUrl(): string | null {
  const env = process.env.COMPILE_API_URL?.trim();
  if (!env || env === "local") return null;
  return env.replace(/\/+$/, "");
}

/** POST JSON to the compile service with a timeout; returns parsed JSON or throws. */
export async function postJson(
  url: string,
  body: unknown,
  timeoutMs = 30000,
): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
      cache: "no-store",
    });
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}
