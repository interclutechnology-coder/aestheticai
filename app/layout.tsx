import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Nav } from "@/components/Nav";
import { StoreInitializer } from "@/components/StoreInitializer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MyStyle.ai — Find your perfect outfit in seconds",
  description:
    "AI-powered outfit recommendations from real inventory. Set your style, budget & vibe — we build the outfit.",
  keywords: ["outfit", "fashion", "AI", "styling", "outfit generator"],
  openGraph: {
    title: "MyStyle.ai",
    description: "AI-powered outfit recommendations",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-mystyle-cream">
        <StoreInitializer />
        <Nav />
        <main className="min-h-[calc(100vh-56px)]">{children}</main>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#1C0D0A",
              color: "#FBF7F4",
              border: "1px solid #791401",
              borderRadius: "12px",
              fontSize: "13px",
            },
          }}
          richColors
        />
      </body>
    </html>
  );
}
