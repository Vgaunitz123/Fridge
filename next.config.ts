import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    const coep = [
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
    ]
    return [
      { source: '/community/create', headers: coep },
      { source: '/inspiration',      headers: coep },
    ]
  },
};

export default nextConfig;
