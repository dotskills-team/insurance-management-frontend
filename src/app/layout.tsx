import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/providers/ThemeProvider";
import { UserProvider } from "@/context/UserContext";
import { Toaster } from "sonner";

import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import ReduxProvider from "@/providers/ReduxProvider";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Insurance Management",
  description: "Medical System",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} bg-background`}
    >
      <body className={`${fontSans.variable} font-sans antialiased`} >
        <UserProvider>
          <ReduxProvider>

            <Toaster richColors position="top-right" />
            <ThemeProvider>
              <TooltipProvider>{children}</TooltipProvider>
            </ThemeProvider>
          </ReduxProvider>
        </UserProvider>
      </body>
    </html>
  );
}
