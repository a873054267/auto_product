import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Forgeboard | Ship from intent",
  description: "Turn product intent into a published GitHub project.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
