import type { Metadata } from "next";
import { Cormorant_Garamond, Source_Sans_3 } from "next/font/google";
import { PRODUCT_NAME, PRODUCT_TITLE } from "@/lib/brand";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-source",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: PRODUCT_TITLE,
  description: `${PRODUCT_NAME} review demo. Sample data only. Not a government record, title search, or appraisal.`,
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${cormorant.variable} ${sourceSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-cream text-ink">{children}</body>
    </html>
  );
}
