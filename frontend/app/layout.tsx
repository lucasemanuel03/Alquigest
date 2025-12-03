import type React from "react";
import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import ClientRootLayout from "./client-root-latout";
import { AuthProvider } from "@/contexts/AuthProvider";
import { Analytics } from "@vercel/analytics/next"

const nunito = Nunito({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "AlquiGest",
  description: "Sistema de gestión de alquileres para estudio jurídico",
  icons: {
    icon: "/alquigest-circulo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Script bloqueante que lee el tema antes de renderizar para evitar flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <AuthProvider>
          <ClientRootLayout>{children}</ClientRootLayout>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
