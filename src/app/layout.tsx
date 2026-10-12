import type { Metadata, Viewport } from "next";
import { Geist_Mono, Nunito } from "next/font/google";
import "./globals.css";
import { DeepLinkListener } from "@/components/DeepLinkListener";
import { WhatsAppFloatingButton } from "@/components/landing/WhatsAppFloatingButton";
import { LocalTrashPurge } from "@/components/LocalTrashPurge";
import { OutboxSync } from "@/components/OutboxSync";
import { PendingAssessmentUploader } from "@/components/PendingAssessmentUploader";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { SyncCoordinator } from "@/components/SyncCoordinator";

// Redondeada, gruesa y alegre. next/font la descarga en el build y la sirve desde el propio
// dominio: cero peticiones a Google en tiempo de ejecución (funciona offline en Capacitor).
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
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
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/icons/icon-192x192.png",
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
  themeColor: "#0f766e",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // En Android, Capacitor 8 (SystemBars) escribe --safe-area-inset-* en el style de
    // <html> antes de hidratar; suppressHydrationWarning solo cubre los atributos de <html>.
    <html
      lang="es-PE"
      className={`${nunito.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {children}
        <WhatsAppFloatingButton />
        <ServiceWorkerRegistration />
        <OutboxSync />
        <SyncCoordinator />
        <LocalTrashPurge />
        <PendingAssessmentUploader />
        <DeepLinkListener />
      </body>
    </html>
  );
}
