import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GrandQuestAuto",
  description: "A GTA-themed Techno Treasure Hunt.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
