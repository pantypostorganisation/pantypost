'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react'; // Import useState for re-rendering
import { useWallet } from '@/context/WalletContext'; // Correct path to WalletContext
import { useListings } from '@/context/ListingContext'; // Correct path to ListingContext
import { useParams } from 'next/navigation'; // Use useParams for dynamic routes

export default function ListingDetailPage() {
  const { listings } = useListings(); // Get all listings
  const { id } = useParams(); // Get the dynamic route param (id) using useParams
  const listing = listings.find((item) => item.id === id); // Find the listing by ID
  const { buyerBalance, setBuyerBalance, purchaseListing } = useWallet(); // Access wallet balance and purchase function
  const router = useRouter();
  const [purchaseStatus, setPurchaseStatus] = useState<string>(''); // State for purchase status

  if (!listing) {
    return <p>Listing not found</p>; // Handle case where listing is not found
  }

  const handlePurchase = () => {
    console.log('Button clicked');
    console.log('Current buyer balance:', buyerBalance);
    console.log('Listing price:', listing.price);

    const isPurchased = purchaseListing(listing.price);
    console.log(isPurchased ? 'Purchase successful!' : 'Not enough funds');

    if (isPurchased) {
      setPurchaseStatus('Purchase successful!');
      setTimeout(() => {
        router.push('/purchase-success'); // Redirect to success page after purchase
      }, 1500); // Redirect after 1.5 seconds to show success message
    } else {
      setPurchaseStatus('Insufficient funds!');
    }
  };

  return (
    <main>
      <h1>{listing.title}</h1>
      <p>{listing.description}</p>
      <p>Price: ${listing.price}</p>
      <button onClick={handlePurchase}>Buy Now</button>

      {purchaseStatus && <p>{purchaseStatus}</p>} {/* Display purchase status */}
      <p>Current Balance: ${buyerBalance}</p> {/* Display current balance */}
    </main>
  );
}
