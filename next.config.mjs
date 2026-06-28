import { readFileSync } from "node:fs";

// Lessons used to live at "/lesson/<id>"; they now live under their course at
// "/courses/<course>/lesson/<id>". Permanently redirect the old path to the
// default course so existing bookmarks and indexed URLs keep working. The
// default course is the first in curriculum order (built before next starts via
// the predev/prebuild step); fall back to "gamecube-c" if the file isn't there.
function defaultCourseId() {
  try {
    const courses = JSON.parse(
      readFileSync(new URL("./src/curriculum/generated/courses.json", import.meta.url), "utf8"),
    );
    return courses[0]?.id ?? "gamecube-c";
  } catch {
    return "gamecube-c";
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/lesson/:id",
        destination: `/courses/${defaultCourseId()}/lesson/:id`,
        permanent: true,
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // objdiff-wasm is an ESM WebAssembly Component: it loads its .wasm via
    // `new URL(..., import.meta.url)` and does a top-level await on init.
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
      asyncWebAssembly: true,
    };
    // The wasm chunk uses top-level await; tell webpack the browser target
    // supports async functions so it emits it correctly (avoids the TLA warning).
    if (!isServer) {
      config.output.environment = {
        ...config.output.environment,
        asyncFunction: true,
      };
    }
    return config;
  },
};

export default nextConfig;
