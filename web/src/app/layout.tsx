// file: src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { t } from "@/lib/strings.fa";

const vazir = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazir",
  display: "swap",
});

export const metadata: Metadata = {
  // Pages set their own title ("تیکت‌ها · تیکتینگ") so browser tabs and history can tell them apart.
  title: { default: t.appName, template: `%s · ${t.appName}` },
  description: t.appDescription,
};

// The phone browser bar takes the page background (--background in globals.css). It follows the system theme.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f5f5" },
    { media: "(prefers-color-scheme: dark)", color: "#050606" },
  ],
};

// Runs before the first paint so the page never flashes the wrong theme.
// The saved choice wins; without one the operating system setting decides.
const themeScript = `(function(){try{var s=localStorage.getItem("theme");var d=s?s==="dark":matchMedia("(prefers-color-scheme: dark)").matches;var r=document.documentElement;r.classList.toggle("dark",d);r.setAttribute("data-theme",d?"dark":"light");}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={vazir.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
