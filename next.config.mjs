const adminUploadBodySizeLimit = "64mb";

const nextConfig = {
  typedRoutes: true,
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
