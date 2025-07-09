import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import { UserProvider } from "../context/UserContext";
import LayoutWrapper from "./components/LayoutWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Learning Platform",
  description: "Practice questions platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <UserProvider>
          <LayoutWrapper>
            <Navbar />
            {children}
          </LayoutWrapper>
        </UserProvider>
      </body>
    </html>
  );
}