import type { Metadata, Viewport } from "next";
import { Baloo_2, Rubik } from "next/font/google";
import "./globals.css";

// Rounded display face for headings and figures, plain grotesque for copy.
const heading = Baloo_2({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});

const body = Rubik({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Toss Book — Live Cricket Toss Gaming Arena",
  description:
    "Toss Book — a live cricket toss & match betting book with admin-managed client accounts.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0e17",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
