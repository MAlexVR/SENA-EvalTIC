import type { NextConfig } from "next";
import { readFileSync } from "fs";

const { version } = JSON.parse(readFileSync("./package.json", "utf8")) as {
  version: string;
};

const securityHeaders = [
  // Fuerza HTTPS durante 2 años, incluye subdominios
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Evita clickjacking — solo permite iframes del mismo origen
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Desactiva MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Protección legacy XSS en navegadores antiguos
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Limita info del Referer header
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Restringe acceso a APIs de hardware innecesarias
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  // CSP gestionado por src/middleware.ts con nonces por request (M4)
];

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  // Evita que Prisma Client sea empaquetado por el bundler de Next.js en Vercel.
  // Prisma 7 genera el cliente en src/generated/prisma; el bundler debe excluirlo.
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
