const projectRoot = new URL('.', import.meta.url).pathname

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // Force turbopack to use this workspace so dependencies resolve correctly
    root: projectRoot,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
