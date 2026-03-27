import type { NextConfig } from "next";

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

const nextConfig: NextConfig = {
  typedRoutes: true,
  images: {
    remotePatterns: supabaseImagePattern
      ? [
          supabaseImagePattern as NonNullable<
            NonNullable<NextConfig["images"]>["remotePatterns"]
          >[number],
        ]
      : [],
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
