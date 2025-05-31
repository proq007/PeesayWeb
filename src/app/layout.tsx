import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import { Metadata } from "next";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/auth-provider";

export const metadata: Metadata = {
  title: "Peesay Web App",
  description: "A modern finance management web application.",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
       <AuthProvider>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
   
        {children}
      
        <Toaster richColors />
      </body>
      </AuthProvider>
    </html>
  );
}
