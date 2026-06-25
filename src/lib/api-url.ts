// The unified backend: AWS Cognito-authed progress API plus the MWCC
// compile/grading service, both behind one custom domain. Defaults to the
// public production API so a fresh clone runs with no configuration; override
// with NEXT_PUBLIC_API_URL to point at a local or staging API.
export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL?.trim() || "https://api.decomp-academy.dev"
).replace(/\/+$/, "");
