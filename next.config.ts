/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export',  // Remove or comment out this line
  // distDir: 'out',    // Remove or comment out this line
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
