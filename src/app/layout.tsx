import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Header from '../components/Header';
import AgeVerificationModal from '../components/AgeVerificationModal';
import { ListingsProvider } from '../context/ListingContext';
import { WalletProvider } from '../context/WalletContext';
import { MessageProvider } from '../context/MessageContext';
import { ReviewProvider } from '../context/ReviewContext';

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
        {/* IMPORTANT: WalletProvider must come before ListingProvider */}
        <WalletProvider>
          <MessageProvider>
            <ReviewProvider>
              <ListingsProvider>
                <Header />
                <AgeVerificationModal />
                {children}
              </ListingsProvider>
            </ReviewProvider>
          </MessageProvider>
        </WalletProvider>
      </body>
    </html>
  );
}