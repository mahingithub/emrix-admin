import type { Metadata, Viewport } from "next";
import { Dela_Gothic_One, Hind_Siliguri, Inter, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const dela = Dela_Gothic_One({
  variable: "--font-dela",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Japanese + Bangla glyphs (customer names and addresses) are loaded on demand via unicode-range.
const notoJp = Noto_Sans_JP({
  variable: "--font-noto-jp",
  weight: ["500", "700", "900"],
  preload: false,
  display: "swap",
});

const hind = Hind_Siliguri({
  variable: "--font-hind",
  weight: ["400", "500", "600", "700"],
  subsets: ["bengali"],
  preload: false,
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · EMRIX Admin" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#111116",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${dela.variable} ${inter.variable} ${notoJp.variable} ${hind.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <div className="min-h-screen bg-[#f3f1ec]">{children}</div>
      </body>
    </html>
  );
}
