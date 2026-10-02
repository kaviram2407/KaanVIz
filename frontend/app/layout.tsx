import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/shell/header";
import { Nav } from "@/components/shell/nav";
import { Footer } from "@/components/shell/footer";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "KaanViz — Data Analytics & Visualization Workspace",
  description:
    "AI-powered, AI-optional data analytics and visualization workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--kaan-cream)] text-foreground antialiased">
        <ThemeProvider>
          <Header />

          <div className="flex min-h-[calc(100vh-65px)] flex-1">
            <Nav />

            <div className="flex min-w-0 flex-1 flex-col">
              <main className="flex-1 p-6">{children}</main>
              <Footer />
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}