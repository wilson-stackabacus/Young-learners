import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Questline",
  description: "Adaptive learning, gamified.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
      </body>
    </html>
  );
}
