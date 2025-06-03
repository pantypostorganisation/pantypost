// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ListingProvider } from "@/context/ListingContext";
import { WalletProvider } from "@/context/WalletContext";
import { MessageProvider } from "@/context/MessageContext";
import { RequestProvider } from "@/context/RequestContext";
import { ReviewProvider } from "@/context/ReviewContext";
import { BanProvider } from "@/context/BanContext";
import ErrorBoundary from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "PantyPost - Premium Marketplace",
  description: "A secure marketplace for premium intimate apparel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ErrorBoundary>
          <AuthProvider>
            <ErrorBoundary>
              <BanProvider>
                <ErrorBoundary>
                  <WalletProvider>
                    <ErrorBoundary>
                      <ListingProvider>
                        <ErrorBoundary>
                          <MessageProvider>
                            <ErrorBoundary>
                              <RequestProvider>
                                <ErrorBoundary>
                                  <ReviewProvider>
                                    {children}
                                  </ReviewProvider>
                                </ErrorBoundary>
                              </RequestProvider>
                            </ErrorBoundary>
                          </MessageProvider>
                        </ErrorBoundary>
                      </ListingProvider>
                    </ErrorBoundary>
                  </WalletProvider>
                </ErrorBoundary>
              </BanProvider>
            </ErrorBoundary>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}