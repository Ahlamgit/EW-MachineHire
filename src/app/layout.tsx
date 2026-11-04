import type { Metadata } from "next";
import "./globals.css";
import { BRAND } from "@/lib/constants/brand";

export const metadata: Metadata = {
  title: {
    default: BRAND.name,
    template: `%s · ${BRAND.name}`,
  },
  description:
    "Heavy Equipment Hiring Management System for EW Machine Hire.",
  applicationName: BRAND.name,
  metadataBase: new URL(BRAND.productionUrl),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
