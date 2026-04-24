export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSupabaseConfig() {
  const supabaseUrl =
    process.env.SUPABASE_URL?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const accessToken =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ??
    process.env.SUPABASE_ANON_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  return {
    supabaseUrl,
    accessToken,
  };
}

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    return true;
  }

  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { supabaseUrl, accessToken } = getSupabaseConfig();

  if (!supabaseUrl || !accessToken) {
    return Response.json(
      {
        ok: false,
        error: "Supabase keepalive is not configured.",
      },
      { status: 500 },
    );
  }

  const keepaliveUrl = new URL("/rest/v1/pricing_settings", supabaseUrl);
  keepaliveUrl.searchParams.set("select", "id");
  keepaliveUrl.searchParams.set("id", "eq.1");
  keepaliveUrl.searchParams.set("limit", "1");

  try {
    const response = await fetch(keepaliveUrl, {
      method: "GET",
      headers: {
        apikey: accessToken,
        authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    const body = await response.text();

    return Response.json(
      {
        ok: response.ok,
        status: response.status,
        body,
      },
      { status: response.ok ? 200 : 503 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return Response.json(
      {
        ok: false,
        error: message,
      },
      { status: 503 },
    );
  }
}
