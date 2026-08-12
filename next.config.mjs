const adminUploadBodySizeLimit = "4.4mb";

const nextConfig = {
  typedRoutes: true,
  // Local review tooling and docs use the loopback IP instead of localhost.
  allowedDevOrigins: ["127.0.0.1"],
  logging: {
    // Server Action arguments can contain saved-plan contact details.
    serverFunctions: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/v0/b/**",
      },
    ],
  },
  experimental: {
    // Admin project saves submit photos through a Server Action on a proxied route.
    serverActions: {
      bodySizeLimit: adminUploadBodySizeLimit,
    },
    proxyClientMaxBodySize: adminUploadBodySizeLimit,
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
