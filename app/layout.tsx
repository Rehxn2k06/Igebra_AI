import type { Metadata } from "next";
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
