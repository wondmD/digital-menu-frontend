const projectRoot = new URL('.', import.meta.url).pathname

function buildRemotePatterns() {
  const patterns = [
    {
      protocol: "https",
      hostname: "api.qrserver.com",
      pathname: "/**",
    },
    {
      protocol: "https",
      hostname: "images.unsplash.com",
      pathname: "/**",
    },
  ]

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "https://menu-viste-1.onrender.com/api/v1"
  try {
    const apiUrl = new URL(apiBase)
    patterns.push({
      protocol: apiUrl.protocol.replace(":", ""),
      hostname: apiUrl.hostname,
      port: apiUrl.port,
      pathname: "/**",
    })
  } catch {
    // Ignore malformed env values and keep the QR host pattern.
  }

  // Allow Cloudflare R2 public buckets used for media hosting (e.g. pub-*.r2.dev)
  patterns.push({
    protocol: "https",
    hostname: "*.r2.dev",
    pathname: "/**",
  })

  return patterns
}

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
    remotePatterns: buildRemotePatterns(),
  },
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "https://menu-viste-1.onrender.com/api/v1"
    return [
      {
        source: "/api-proxy/:path*",
        destination: `${apiBase}/:path*`,
      },
    ]
  },
}

export default nextConfig
