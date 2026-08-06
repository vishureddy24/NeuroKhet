import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [],
  images: {
    domains: [],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.gstatic.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; media-src 'self' blob: mediastream:; connect-src 'self' https://generativelanguage.googleapis.com https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com wss://*.firebaseio.com;",
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=*, microphone=*, geolocation=*',
          },
          // Allow unsecure requests for localhost development
          ...(process.env.NODE_ENV === 'development' ? [{
            key: 'Permissions-Policy',
            value: 'camera=*, microphone=*, geolocation=*',
          }] : [])
        ],
      },
    ];
  },
  // For development, allow insecure localhost
  ...(process.env.NODE_ENV === 'development' && {
    async rewrites() {
      return [];
    },
  }),
};

export default nextConfig;
