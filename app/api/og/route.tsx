import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site-config";

export const contentType = "image/png";

export const size = {
  width: 1200,
  height: 630,
};

function readParam(
  value: string | null,
  fallback: string,
  maxLength: number,
) {
  if (!value) {
    return fallback;
  }

  return value.trim().slice(0, maxLength) || fallback;
}

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eyebrow = readParam(searchParams.get("eyebrow"), siteConfig.name, 60);
  const title = readParam(searchParams.get("title"), siteConfig.name, 90);
  const detail = readParam(
    searchParams.get("detail"),
    siteConfig.description,
    180,
  );

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          background: "#f4efe5",
          color: "#11110f",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(to right, rgba(17, 17, 15, 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(17, 17, 15, 0.06) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            opacity: 0.75,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 24,
            border: "1px solid rgba(17, 17, 15, 0.16)",
            borderRadius: 28,
            background:
              "linear-gradient(180deg, rgba(255, 255, 255, 0.72) 0%, rgba(255, 255, 255, 0) 100%), #fbf7ef",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 48,
            border: "1px solid rgba(17, 17, 15, 0.08)",
            borderRadius: 20,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at top left, rgba(0, 91, 65, 0.14) 0%, rgba(0, 91, 65, 0) 38%)",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            width: "100%",
            padding: "72px",
            justifyContent: "space-between",
            gap: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              width: "100%",
              maxWidth: "780px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: "72px",
                  height: "72px",
                  borderRadius: "16px",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid rgba(17, 17, 15, 0.28)",
                  background: "#fffcf6",
                  color: "#005b41",
                  fontSize: "21px",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                }}
              >
                {siteConfig.shortName}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    fontSize: "18px",
                    letterSpacing: "0.32em",
                    textTransform: "uppercase",
                    color: "#005b41",
                  }}
                >
                  {eyebrow}
                </div>
                <div
                  style={{
                    fontSize: "26px",
                    fontWeight: 600,
                  }}
                >
                  {siteConfig.name}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "28px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                  gap: "18px",
                  fontSize: "18px",
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: "#5d564b",
                }}
              >
                <span>Project Route</span>
                <span
                  style={{
                    flex: 1,
                    height: "1px",
                    background: "rgba(17, 17, 15, 0.34)",
                  }}
                />
                <span>Preview</span>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                <div
                  style={{
                    fontSize: "64px",
                    lineHeight: 1.02,
                    fontWeight: 700,
                    letterSpacing: 0,
                  }}
                >
                  {title}
                </div>
                <div
                  style={{
                    maxWidth: "680px",
                    fontSize: "26px",
                    lineHeight: 1.45,
                    color: "#40392f",
                  }}
                >
                  {detail}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              width: "240px",
              padding: "28px",
              borderRadius: "24px",
              border: "1px solid rgba(17, 17, 15, 0.18)",
              background:
                "linear-gradient(180deg, rgba(255, 255, 255, 0.78) 0%, rgba(255, 255, 255, 0.2) 100%), #fffcf6",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div
                style={{
                  fontSize: "16px",
                  letterSpacing: "0.26em",
                  textTransform: "uppercase",
                  color: "#005b41",
                }}
              >
                Core Scope
              </div>
              <div
                style={{
                  fontSize: "24px",
                  lineHeight: 1.4,
                }}
              >
                Architectural design, building, and land development.
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                paddingTop: "24px",
                borderTop: "1px solid rgba(17, 17, 15, 0.16)",
                fontSize: "15px",
                lineHeight: 1.5,
                color: "#5d564b",
              }}
            >
              <div>Measured composition.</div>
              <div>Clear finish direction.</div>
              <div>Structured path into inquiry.</div>
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
