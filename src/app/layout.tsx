import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Header from '../components/Header';
import { ListingProvider } from '../context/ListingContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PantyPost',
  description: 'Marketplace for used underwear',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ListingProvider>
          <Header />
          {children}
        </ListingProvider>
      </body>
    </html>
  );
}
