import type { Metadata } from "next";
import { Inter, Poppins } from 'next/font/google';
import "./globals.css";
import Footer from './components/Footer';
import ClientOnly from './components/ClientOnly';

const inter = Inter({ subsets: ['latin'] });
const poppins = Poppins({ 
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: "VoiceScribe AI | PDF to Podcast Converter",
  description: "Transform your PDFs into engaging podcast content with AI-powered conversion and natural voice synthesis",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${poppins.variable} min-h-screen bg-white`}>
        <ClientOnly>
          {children}
          <Footer />
        </ClientOnly>
      </body>
    </html>
  );
}
