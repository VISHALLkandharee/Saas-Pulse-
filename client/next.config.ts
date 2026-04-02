import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api_server/:path*',
        destination: `${process.env.NEXT_PUBLIC_RAILWAY_URL || 'https://saas-pulse-production.up.railway.app'}/api/:path*`, 
      },
    ];
  },
};

export default nextConfig;
