import { Footer } from "@/components/footer";
import Navbar from "@/components/navbar";
import Providers from "@/components/providers";
import "@rainbow-me/rainbowkit/styles.css";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "../fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Bountychain",
  description: "Create bounties and earn rewards in a decentralized ecosystem",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <div className="flex-1 flex flex-col">{children}</div>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
