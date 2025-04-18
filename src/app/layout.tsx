import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Header from '../components/Header';
import AgeVerificationModal from '../components/AgeVerificationModal';
import { ListingProvider } from '../context/ListingContext';
import { WalletProvider } from '../context/WalletContext';
import { MessageProvider } from '../context/MessageContext';
import { ReviewProvider } from '../context/ReviewContext'; // ✅ Import new ReviewProvider

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
              <ReviewProvider> {/* ✅ Wrap with review context */}
                <Header />
                <AgeVerificationModal />
                {children}
              </ReviewProvider>
            </ListingProvider>
          </WalletProvider>
        </MessageProvider>
      </body>
    </html>
  );
}
