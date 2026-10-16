import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/admin/movies',
        destination: '/admin/database',
        permanent: false,
      },
      {
        source: '/admin/movies/new',
        destination: '/admin/database',
        permanent: false,
      },
      {
        source: '/admin/movies/:id/edit',
        destination: '/admin/database?edit=:id',
        permanent: false,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
    ],
  },
};

export default nextConfig;
