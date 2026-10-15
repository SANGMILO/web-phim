import type { Metadata } from "next";
import { Montserrat, Be_Vietnam_Pro } from "next/font/google";
import { BRAND } from "@/config/brand";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WatchlistProvider } from "@/components/providers/WatchlistProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { DemoModeBanner } from "@/components/common/DemoModeBanner";
import { movieService } from "@/lib/movies/movie-service";

export const revalidate = 300;

const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-display",
  display: "swap",
});

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "http://localhost:3000"),
  ),
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s | ${BRAND.name}`,
  },
  description: BRAND.description,
  openGraph: {
    title: BRAND.name,
    description: BRAND.description,
    type: "website",
    locale: "vi_VN",
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const catalog = await movieService.getAll();
  const isDemo = catalog.some((movie) => movie.isDemo);
  return (
    <html lang="vi" className={`${montserrat.variable} ${beVietnamPro.variable}`}>
      <body>
        <AuthProvider>
          <WatchlistProvider>
            <Header />
            <main>{children}</main>
            <Footer />
            <DemoModeBanner isDemo={isDemo} />
          </WatchlistProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
