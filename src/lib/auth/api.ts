"use client";

import { getIdToken } from "./cognito";

const BASE = process.env.NEXT_PUBLIC_API_URL!;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Authenticated call to the progress API. Sends the Cognito ID token as the raw
// Authorization header (the JWT authorizer wants no `Bearer` prefix, and `/me`
// reads `email` which only the ID token carries). For the unauthenticated
// compile endpoints use the same-origin `/api/*` fetch instead.
export async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getIdToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
      ...(token ? { Authorization: token } : {}),
    },
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.error?.message ?? body.message ?? message;
    } catch {
      /* non-JSON body (e.g. API Gateway 401) */
    }
    throw new ApiError(message, res.status);
  }
  return res.json() as Promise<T>;
}
