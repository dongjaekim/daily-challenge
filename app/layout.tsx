import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import { Header } from "@/components/layout/Header";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Providers from "./providers";
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "챌린지 달성 관리",
  description: "챌린지를 설정하고 달성 여부를 관리하는 서비스",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="ko" className="h-full">
        <body className={`${inter.className} flex h-full flex-col`}>
          <Toaster />
          <Header />
          <main className="flex-grow">
            <Providers>{children}</Providers>
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
