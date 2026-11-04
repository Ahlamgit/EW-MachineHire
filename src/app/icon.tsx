import { ImageResponse } from "next/og";

/** Simple tab icon — not a brand-logo substitute. */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#17191C",
          color: "#FFFFFF",
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: 0.5,
        }}
      >
        EW
      </div>
    ),
    size,
  );
}
