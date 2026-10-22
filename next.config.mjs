/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/models',
        destination: '/api/v1/models',
      },
      {
        source: '/api/models',
        destination: '/api/v1/models',
      },
      {
        source: '/v1/models',
        destination: '/api/v1/models',
      },
      {
        source: '/v1/chat/completions',
        destination: '/api/v1/chat/completions',
      },
      {
        source: '/chat/completions',
        destination: '/api/v1/chat/completions',
      },
    ];
  },
};

export default nextConfig;
