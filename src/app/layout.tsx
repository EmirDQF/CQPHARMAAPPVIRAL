import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WhatsAppFloatingButton } from "@/components/landing/WhatsAppFloatingButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://artikare.com";
const SITE_TITLE = "Artikare | Tu libertad de movimiento empieza en tus huesos";
const SITE_DESCRIPTION =
  "Evalúa tu salud ósea y articular en 2 minutos. Densitometría ósea, Semáforo Óseo digital y suplementación clínica CQ Pharma.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | Artikare",
  },
  description: SITE_DESCRIPTION,
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Artikare",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "es_PE",
    siteName: "Artikare",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f766e",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <WhatsAppFloatingButton />
      </body>
    </html>
  );
}
