import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WebGuardian - Analysez et améliorez votre site web",
  description: "Ton site web ne convertit pas ? On te montre pourquoi. Et si tu veux, on le corrige pour toi. Sans blabla technique, sans bullshit.",
  icons: {
    icon: "/webguardian-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet" />
        <link rel="icon" href="/webguardian-logo.svg" type="image/svg+xml" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
