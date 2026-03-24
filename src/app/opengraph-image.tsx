import { ImageResponse } from "next/og";

export const alt = "DevTools Hub - Free Online Developer Tools";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
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
            gap: "24px",
          }}
        >
          <div
            style={{
              fontSize: "72px",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-2px",
              lineHeight: 1.1,
              textAlign: "center",
            }}
          >
            DevTools Hub
          </div>
          <div
            style={{
              fontSize: "32px",
              fontWeight: 400,
              color: "#94a3b8",
              letterSpacing: "0.5px",
              textAlign: "center",
            }}
          >
            Free Online Developer Tools
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
    { ...size }
  );
}
