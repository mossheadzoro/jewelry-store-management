/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ignore build errors as we manually run tsc --noEmit and check for correctness
    ignoreBuildErrors: true,
  }
}

module.exports = nextConfig
