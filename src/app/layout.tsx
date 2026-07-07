import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import StudentGate from "@/components/StudentGate";
import NotificationsBridge from "@/components/NotificationsBridge";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "CAMA — Plateforme Académique JFN",
  description:
    "Plateforme LMS sécurisée et optimisée bas-débit pour la gestion complète du parcours académique de l'Institut JFN.",
  keywords: ["LMS", "JFN", "académique", "Cameroun", "cours", "examens"],
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#4F46E5",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="font-sans text-slate-900 bg-white antialiased">
        <AuthProvider>
          <StudentGate />
          <NotificationsBridge />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
