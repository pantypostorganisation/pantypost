import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Header from '../components/Header';
import AgeVerificationModal from '../components/AgeVerificationModal';
import { ListingProvider } from '../context/ListingContext';
import { WalletProvider } from '../context/WalletContext';
import { MessageProvider } from '../context/MessageContext';
import { ReviewProvider } from '../context/ReviewContext';
import { RequestProvider } from '../context/RequestContext';

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
              <RequestProvider>
                <ListingProvider>
                  <Header />
                  <AgeVerificationModal />
                  {children}
                </ListingProvider>
              </RequestProvider>
            </ReviewProvider>
          </MessageProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
