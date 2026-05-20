import type { Metadata, Viewport } from "next";
import { Work_Sans } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { AuthSessionProvider } from "@/components/providers/SessionProvider";

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SENA EvalTIC - Evaluación en Línea",
  description:
    "Plataforma de evaluación en línea del Servicio Nacional de Aprendizaje SENA - CEET",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // El nonce generado por el middleware se propaga a Next.js para que lo use
  // en sus scripts de hidratación, eliminando la necesidad de unsafe-inline
  const nonce = (await headers()).get("x-nonce") ?? "";

  return (
    <html lang="es">
      <head>
        {/* Nonce vacío — Next.js lo usa internamente para sus scripts RSC */}
        {nonce && <script nonce={nonce} />}
      </head>
      <body
        className={`${workSans.variable} antialiased min-h-screen flex flex-col font-sans`}
      >
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
