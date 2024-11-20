'use client';

import { Inter, Poppins } from 'next/font/google';
import "./globals.css";
import Footer from './components/Footer';
import ClientOnly from './components/ClientOnly';
import { PdfProvider } from './contexts/PdfContext';
import { YoutubeProvider } from './contexts/YoutubeContext';

const inter = Inter({ subsets: ['latin'] });
const poppins = Poppins({ 
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${poppins.variable} min-h-screen bg-white`}>
        <PdfProvider>
          <YoutubeProvider>
            <ClientOnly>
              {children}
              <Footer />
            </ClientOnly>
          </YoutubeProvider>
        </PdfProvider>
      </body>
    </html>
  );
}
