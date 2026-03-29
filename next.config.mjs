const adminUploadBodySizeLimit = "64mb";

function readSupabaseImagePattern() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;

  if (!supabaseUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(supabaseUrl);

    return {
      protocol: parsedUrl.protocol === "http:" ? "http" : "https",
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || undefined,
      pathname: "/storage/v1/object/public/**",
    };
  } catch {
    return null;
  }
}

const supabaseImagePattern = readSupabaseImagePattern();

const nextConfig = {
  typedRoutes: true,
  images: {
    remotePatterns: supabaseImagePattern ? [supabaseImagePattern] : [],
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
