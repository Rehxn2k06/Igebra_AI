import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Igebra AI — Your Intelligent Study Assistant",
  description:
    "Multimodal AI tutor with RAG-powered knowledge retrieval. Ask questions about math, science, programming, and more. Upload your notes for personalized answers.",
  keywords: ["AI tutor", "study assistant", "RAG chatbot", "multimodal AI", "Ed-Tech", "Igebra"],
  openGraph: {
    title: "Igebra AI — Your Intelligent Study Assistant",
    description: "Multimodal AI tutor with RAG-powered knowledge retrieval",
    type: "website",
  },
};

// viewport-fit=cover is required for env(safe-area-inset-bottom) to work on iOS Safari.
// Without it, the bottom input bar gets clipped under the phone gesture bar.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0e1a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

