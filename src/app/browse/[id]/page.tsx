'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useWallet } from '@/context/WalletContext'; // Correct path to WalletContext
import { useListings } from '@/context/ListingContext'; // Correct path to ListingContext
import { useParams } from 'next/navigation'; // Use useParams for dynamic routes

export default function ListingDetailPage() {
  const { listings } = useListings();
  const { id } = useParams(); // Get the dynamic route param (id) using useParams
  const listing = listings.find((item) => item.id === id); // Find the listing by ID
  const { buyerBalance, purchaseListing } = useWallet(); // Access wallet balance and purchase function
  const router = useRouter();
  const [purchaseStatus, setPurchaseStatus] = useState<string>(''); // State for purchase status

  if (!listing) {
    return <p>Listing not found</p>;
  }

  const handlePurchase = () => {
    console.log('Button clicked');
    console.log('Current buyer balance:', buyerBalance);
    console.log('Listing price:', listing.price);

    // Create an order object with necessary information
    const order = {
      id: listing.id,
      title: listing.title,
      description: listing.description,
      price: listing.price,
      imageUrl: listing.imageUrl, // Add imageUrl to the order
      date: new Date().toISOString(), // Set current date as the order date
    };

    const isPurchased = purchaseListing(order); // Pass the order to the purchaseListing function
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
      <img
        src={listing.imageUrl}
        alt={listing.title}
        className="w-full h-48 object-cover rounded mb-4" // You can style it accordingly
      />
      <button onClick={handlePurchase}>Buy Now</button>

      {purchaseStatus && <p>{purchaseStatus}</p>} {/* Display purchase status */}
      <p>Current Balance: ${buyerBalance}</p> {/* Display current balance */}
    </main>
  );
}
