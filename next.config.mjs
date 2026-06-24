/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Amplify WEB_COMPUTE exposes console env vars to the build but not to the
  // Next.js server runtime. Inline COMPILE_API_URL at build time (when it IS
  // available) so the server-side compile proxy can read it at runtime.
  env: {
    COMPILE_API_URL: process.env.COMPILE_API_URL,
  },
};

export default nextConfig;
