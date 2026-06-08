/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@langchain/langgraph', 'simple-git'],
  },
  images: {
    domains: [],
  },
};

module.exports = nextConfig;
