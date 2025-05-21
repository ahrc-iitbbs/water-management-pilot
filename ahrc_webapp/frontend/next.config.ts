import type { NextConfig } from 'next';

// const nextConfig: NextConfig = {
//   /* config options here */
//   devIndicators: false
// };
// module.exports = {
//   output: 'standalone',

// }

// export default nextConfig;


const nextConfig = {
  devIndicators: false,
  // experimental: {
  //   serverActions: true,
  // },
  // Make environment variables available to the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000',
  },
  // Add output configuration for standalone build
  // output: 'standalone',
}

module.exports = nextConfig