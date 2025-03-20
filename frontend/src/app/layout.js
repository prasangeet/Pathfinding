import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Image from "next/image";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Pathfinding Visualizer",
  description: "Generated by create next app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <link rel="icon" type="image/png" href="/navigation.png" />
        <style>{geistSans.className}</style>
        <style>{geistMono.className}</style>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {/* <Image
          src="/navigation.png"
          alt="Navigation"
          width={100}
          height={100}
        />
        <Image
          src="/car-economy.png"
          alt="Car Economy"
          width={100}
          height={100}
        /> */}
      </body>
    </html>
  );
}
