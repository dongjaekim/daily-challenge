import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import { Header } from "@/components/layout/Header";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
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
      <html lang="ko">
        <body className={inter.className}>
          <Toaster />
          <Header />
          <main className="container mx-auto px-4 md:px-6 py-6 max-w-6xl">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
