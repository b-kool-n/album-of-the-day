import type { NextConfig } from "next";

// Standard browser protections for every page and route.
// - frame-ancestors / X-Frame-Options: no other site can load aotd.world inside a frame.
// - nosniff: browsers treat files as the type we say they are.
// - Referrer-Policy: other sites see only "aotd.world", never the full address.
// - Permissions-Policy: the site never asks for the camera, microphone or location.
// - HSTS: browsers always use HTTPS.
// A full script-blocking CSP is left out on purpose: it would need care around Next's own
// scripts and the Apple and Google sign-in redirects.
const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
