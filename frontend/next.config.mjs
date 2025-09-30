import createMDX from '@next/mdx';

const withMDX = createMDX({
  extension: /\.mdx?$/,
});


/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  async rewrites() {
    // When the request host is rpc.dopelgangachain.xyz, route everything to the RPC proxy
    return [
      {
        source: '/:path*',
        has: [
          { type: 'host', value: 'rpc.dopelgangachain.xyz' },
        ],
        destination: '/api/rpc',
      },
    ];
  },
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.fallback = config.resolve.fallback || {};
    try {
      // Use require.resolve in a CJS-compatible way
      config.resolve.fallback['encoding'] = require.resolve('encoding');
    } catch (e) {
      // fallback if require is not available
      config.resolve.fallback['encoding'] = false;
    }
    return config;
  },
};

export default withMDX(nextConfig);
