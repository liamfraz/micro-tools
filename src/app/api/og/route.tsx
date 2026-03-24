import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get("title") ?? "Developer Tool";
  const description =
    searchParams.get("description") ?? "Free online developer tool";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f172a",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {/* Subtle gradient overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(56, 189, 248, 0.08) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Top border accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #3b82f6, #06b6d4, #3b82f6)",
            display: "flex",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "20px",
            padding: "0 80px",
          }}
        >
          {/* Site name */}
          <div
            style={{
              fontSize: "24px",
              fontWeight: 600,
              color: "#3b82f6",
              letterSpacing: "2px",
              textTransform: "uppercase" as const,
              display: "flex",
            }}
          >
            DevTools Hub
          </div>

          {/* Tool name */}
          <div
            style={{
              fontSize: "56px",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-1.5px",
              lineHeight: 1.15,
              textAlign: "center",
              maxWidth: "900px",
            }}
          >
            {title}
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: "24px",
              fontWeight: 400,
              color: "#94a3b8",
              textAlign: "center",
              maxWidth: "800px",
              lineHeight: 1.4,
              display: "flex",
            }}
          >
            {description}
          </div>
        </div>

        {/* Bottom domain */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            fontSize: "20px",
            color: "#475569",
            letterSpacing: "1px",
            display: "flex",
          }}
        >
          devtools.page
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
