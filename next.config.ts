import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // El LCP de la landing es el h1 (texto) y lo frenaba la hoja CSS bloqueante
    // en 4G lento; incrustada (~7 KB gzip) el primer paint no espera otro viaje.
    inlineCss: true,
  },
  async headers() {
    return [
      {
        // El service worker nunca se sirve desde caché HTTP: cada despliegue
        // con una política nueva (CACHE_NAME) debe llegar a los clientes.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
