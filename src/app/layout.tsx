import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Header from '../components/Header';
import { ListingProvider } from '../context/ListingContext';
import { WalletProvider } from '../context/WalletContext';
import { MessageProvider } from '../context/MessageContext';

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
        <MessageProvider>
          <WalletProvider>
            <ListingProvider>
              <Header />
              {children}
            </ListingProvider>
          </WalletProvider>
        </MessageProvider>
      </body>
    </html>
  );
}
