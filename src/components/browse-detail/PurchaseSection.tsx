// src/components/browse-detail/PurchaseSection.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Heart, Crown, ShoppingBag, AlertCircle, ShieldAlert, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useListings } from '@/context/ListingContext';
import { useWallet } from '@/context/WalletContext';
import { useToast } from '@/context/ToastContext';
import { Listing } from '@/context/ListingContext';
import { listingsService, type DropInfo } from '@/services/listings.service';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

interface PurchaseSectionProps {
  listing: Listing;
  user: any;
  handlePurchase: () => void; // kept for compatibility
  /* Opens the page-level checkout. This component used to charge the
     buyer itself, which meant the sticky bar and this button took two
     different routes to the same purchase -- and only one of them could
     ever be given an address. Both now open the same modal. */
  onRequestCheckout?: () => void;
  isProcessing: boolean;
  isFavorited: boolean;
  toggleFavorite: () => void;
  onSubscribeClick: () => void;
}

/* Can this seller post to where the buyer is?
 *
 * Unknown buyer country returns true. A buyer who has not entered a
 * delivery address yet has no country to compare, and guessing wrong
 * would block a sale that was fine -- better to let them through and
 * have the seller decline than to refuse someone standing in range.
 *
 * Comparison is case-insensitive and trimmed, because these strings
 * arrive from three places (seller profile, buyer address, a dropdown)
 * and they do not agree on capitalisation. */
function sellerShipsTo(
  shipping: { scope?: string; countries?: string[]; home?: string } | undefined,
  buyerCountry: string | undefined
): boolean {
  if (!shipping || !buyerCountry) return true;

  const target = String(buyerCountry).trim().toLowerCase();
  if (!target) return true;

  if (shipping.scope === 'worldwide' || !shipping.scope) return true;

  if (shipping.scope === 'domestic') {
    const home = String(shipping.home || '').trim().toLowerCase();
    return home ? home === target : true;
  }

  return (shipping.countries || []).some(
    (entry) => String(entry).trim().toLowerCase() === target
  );
}

/* Shared notice block. Previously four near-identical inline blocks
   with different colour classes; this keeps the states visually
   consistent and makes adding another trivial. */
function Notice({
  tone,
  icon: Icon,
  title,
  children,
}: {
  tone: 'info' | 'warning' | 'danger' | 'success';
  icon: React.ElementType;
  title: string;
  children?: React.ReactNode;
}) {
  const tones = {
    info: 'border-line bg-surface-overlay text-ink-muted',
    warning: 'border-primary-line bg-primary-soft text-ink-muted',
    danger: 'border-danger/40 bg-danger-soft text-ink-muted',
    success: 'border-success/40 bg-success-soft text-ink-muted',
  } as const;

  const iconTones = {
    info: 'text-ink-faint',
    warning: 'text-primary',
    danger: 'text-danger',
    success: 'text-success',
  } as const;

  return (
    <div className={`rounded-md border p-3.5 ${tones[tone]}`}>
      <div className="flex items-start gap-2.5">
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconTones[tone]}`} />
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium text-ink">{title}</p>
          {children && <div className="text-xs leading-relaxed">{children}</div>}
        </div>
      </div>
    </div>
  );
}

export default function PurchaseSection({
  listing,
  user,
  handlePurchase, // eslint-disable-line @typescript-eslint/no-unused-vars
  onRequestCheckout,
  isProcessing,
  isFavorited,
  toggleFavorite,
  onSubscribeClick,
}: PurchaseSectionProps) {

  /* Where the buyer is, from the address they have already given us.
     Nothing is asked for here -- if we do not know, the sale proceeds
     as normal rather than interrupting them for a field they came to
     avoid. */
  const buyerCountry: string =
    user?.deliveryAddress?.country || user?.country || '';

  const sellerShipping = (listing as any)?.sellerShipping;
  const shipsHere = sellerShipsTo(sellerShipping, buyerCountry);

  const router = useRouter();
  const { listings } = useListings();
  const { getBuyerBalance, purchaseListing, reloadData, orderHistory } = useWallet();
  const { showToast } = useToast();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseCompleted, setPurchaseCompleted] = useState(false);

  const isSeller = user?.username === listing.seller;
  const isAdmin = user?.role === 'admin';
  const isPremiumLocked = listing.isLocked === true;
  const isListingStillActive = listings.some((l) => l.id === listing.id);

  useEffect(() => {
    if (user?.username && orderHistory) {
      const userPurchasedThis = orderHistory.some(
        (order) =>
          order.buyer === user.username &&
          (order.listingId === listing.id || order.title === listing.title)
      );
      if (userPurchasedThis) {
        setPurchaseCompleted(true);
      }
    }
  }, [user?.username, orderHistory, listing.id, listing.title]);

  // Compared in cents to avoid floating-point issues.
  const buyerBalanceInCents = user ? Math.round(getBuyerBalance(user.username) * 100) : 0;
  const purchasePriceInCents = Math.round((listing.markedUpPrice || listing.price) * 100);
  const canAfford = buyerBalanceInCents >= purchasePriceInCents;
  const balanceNeeded = Math.max(0, (purchasePriceInCents - buyerBalanceInCents) / 100);

  // ---- Drop state ----
  const dropInfo = (listing as { drop?: DropInfo }).drop;
  const isDropListing = Boolean(dropInfo?.isDrop);
  const dropOpensAt =
    dropInfo?.scheduledFor && new Date(dropInfo.scheduledFor).getTime() > Date.now()
      ? new Date(dropInfo.scheduledFor)
      : null;
  const dropSoldOut = isDropListing && ((dropInfo?.unitsRemaining ?? 0) <= 0 || !isListingStillActive);
  const nextUnitNumber = dropInfo ? dropInfo.unitsSold + 1 : 0;

  const shouldShowInsufficientBalance =
    !canAfford &&
    balanceNeeded > 0.01 &&
    !isSeller &&
    !purchaseCompleted &&
    !isPurchasing &&
    !isProcessing &&
    isListingStillActive &&
    !isPremiumLocked;

  const handleRealPurchase = async () => {
    if (!user || isPurchasing || isProcessing || purchaseCompleted || !isListingStillActive) return;

    if (isAdmin) {
      showToast({
        type: 'error',
        title: 'Admins cannot purchase items. Please use the Crown Admin portal.',
      });
      return;
    }

    if (isSeller) {
      showToast({ type: 'error', title: 'You cannot purchase your own listing' });
      return;
    }

    if (isPremiumLocked) {
      showToast({
        type: 'error',
        title: 'Premium content locked',
        message: 'You must be subscribed to this seller to purchase premium content',
      });
      return;
    }

    /* Everything above is a reason NOT to reach checkout at all (admin,
       own listing, premium lock). Past that point the purchase itself is
       the page's job: it collects the delivery address and confirms the
       total before anything is charged. */
    if (onRequestCheckout) {
      onRequestCheckout();
      return;
    }

    if (!canAfford) {
      showToast({ type: 'error', title: 'Insufficient balance. Please add funds to your wallet.' });
      router.push('/wallet/buyer');
      return;
    }

    if (isDropListing) {
      if (dropOpensAt) {
        showToast({ type: 'error', title: `This drop opens ${dropOpensAt.toLocaleString()}.` });
        return;
      }
      if (dropSoldOut) {
        showToast({ type: 'error', title: 'This drop is sold out.' });
        return;
      }

      setIsPurchasing(true);
      try {
        // Server-authoritative claim: price, unit number and inventory
        // are all decided on the other side. Never the legacy path —
        // it would flip the whole run to sold in one click.
        const response = await listingsService.purchaseDropUnit(listing.id);

        if (response.success && response.data) {
          const { unitNumber, totalUnits } = response.data.drop;
          setPurchaseCompleted(true);
          showToast({
            type: 'success',
            title: `Unit #${unitNumber} of ${totalUnits} is yours!`,
          });

          await reloadData();
          await new Promise((r) => setTimeout(r, 500));
          router.push('/buyers/my-orders');
        } else {
          setIsPurchasing(false);
          const message = response.error?.message;
          showToast({
            type: 'error',
            title:
              message === 'Sold out'
                ? 'Sold out — the last unit went moments ago.'
                : message || 'Purchase failed. Please try again.',
          });
        }
      } catch (dropError: any) {
        setIsPurchasing(false);
        showToast({ type: 'error', title: dropError?.message || 'Purchase failed. Please try again.' });
      }
      return;
    }

    setIsPurchasing(true);

    try {
      await purchaseListing(
        {
          id: listing.id,
          title: listing.title,
          description: listing.description,
          price: listing.price,
          markedUpPrice: purchasePriceInCents / 100,
          imageUrls: listing.imageUrls,
          seller: listing.seller,
          tags: listing.tags || [],
          isPremium: listing.isPremium,
        } as any,
        user.username
      );

      setPurchaseCompleted(true);
      showToast({ type: 'success', title: 'Purchase successful! Your order has been created.' });

      await reloadData();
      await new Promise((r) => setTimeout(r, 500));

      router.push('/buyers/my-orders');
    } catch (error: any) {
      setIsPurchasing(false);
      setPurchaseCompleted(false);

      let errorMessage = 'Purchase failed. Please try again.';

      if (error.message?.includes('subscribe') || error.requiresSubscription) {
        errorMessage = 'You must be subscribed to this seller to purchase premium content.';
        setTimeout(() => router.push(`/sellers/${listing.seller}`), 2000);
      } else if (error.message?.includes('Missing required fields')) {
        errorMessage = 'Order creation failed due to missing information. Please try again.';
      } else if (error.message?.includes('Insufficient balance')) {
        errorMessage = 'Insufficient balance. Please add funds to your wallet.';
        setTimeout(() => router.push('/wallet/buyer'), 1500);
      } else if (error.message?.includes('Rate limit exceeded')) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else {
        errorMessage = error.message || errorMessage;
      }

      showToast({ type: 'error', title: errorMessage });
    }
  };

  // Auctions handle their own controls in AuctionSection.
  if (listing.auction && listing.auction.status === 'active') return null;

  if (!isListingStillActive && !purchaseCompleted) {
    return (
      <div className="rounded-lg border border-line bg-surface-raised p-5">
        <Notice
          tone="info"
          icon={ShoppingBag}
          title={(listing as { drop?: DropInfo }).drop?.isDrop ? 'This drop is sold out' : 'This item has been sold'}
        />
      </div>
    );
  }

  const buttonBase =
    'flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-semibold transition-colors';

  return (
    <div className="space-y-4 rounded-lg border border-line bg-surface-raised p-5">
      {/* Price and favourite */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-faint">Price</p>
          <p className="mt-1 text-3xl font-semibold leading-none text-ink">
            ${(purchasePriceInCents / 100).toFixed(2)}
          </p>
        </div>

        {user?.role === 'buyer' && isListingStillActive && (
          <button
            onClick={toggleFavorite}
            className="grid h-10 w-10 place-items-center rounded-md border border-line bg-surface-overlay transition-colors hover:border-line-strong"
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              className={`h-4 w-4 ${isFavorited ? 'fill-primary text-primary' : 'text-ink-muted'}`}
            />
          </button>
        )}
      </div>

      {/* States */}
      {user && isAdmin && (
        <Notice tone="info" icon={ShieldAlert} title="Admin account">
          Admin accounts cannot make purchases. Please use the Crown Admin tools.
        </Notice>
      )}

      {isPremiumLocked && (
        <Notice tone="warning" icon={Crown} title="Premium content locked">
          Subscribe to{' '}
          <SecureMessageDisplay
            content={listing.seller}
            allowBasicFormatting={false}
            className="inline font-medium text-ink"
          />{' '}
          to unlock and purchase.
        </Notice>
      )}

      {user && !isAdmin && shouldShowInsufficientBalance && (
        <Notice tone="danger" icon={AlertCircle} title="Insufficient balance">
          You need ${balanceNeeded.toFixed(2)} more to purchase this item.{' '}
          <button
            onClick={() => router.push('/wallet/buyer')}
            className="font-medium text-primary hover:underline"
          >
            Add funds
          </button>
        </Notice>
      )}

      {purchaseCompleted && (
        <Notice tone="success" icon={Check} title="Purchase complete">
          You own this item.
        </Notice>
      )}

      {/* Where this seller posts to.
          Shown before the button, not after it, so a buyer learns it
          while deciding rather than when they try to pay. Only when it
          is a limit worth knowing -- "ships worldwide" on every
          listing is noise. */}
      {sellerShipping && sellerShipping.scope && sellerShipping.scope !== 'worldwide' && (
        <p className="mb-3 text-xs leading-relaxed text-ink-muted">
          {sellerShipping.scope === 'domestic'
            ? `Usually ships within ${sellerShipping.home || 'their own country'} only.`
            : `Usually ships to ${(sellerShipping.countries || []).slice(0, 4).join(', ')}${
                (sellerShipping.countries || []).length > 4
                  ? ` and ${(sellerShipping.countries || []).length - 4} more`
                  : ''
              }.`}
          {!shipsHere && ' Ask them about posting to you.'}
        </p>
      )}

      {/* Action */}
      {!user ? (
        <button
          onClick={() => router.push('/login')}
          className={`${buttonBase} bg-primary text-black hover:bg-primary-hover`}
        >
          <ShoppingBag className="h-4 w-4" />
          Log in to purchase
        </button>
      ) : isSeller ? (
        <button
          disabled
          className={`${buttonBase} cursor-not-allowed bg-surface-overlay text-ink-faint`}
        >
          Your listing
        </button>
      ) : isAdmin ? (
        <button
          disabled
          className={`${buttonBase} cursor-not-allowed bg-surface-overlay text-ink-faint`}
        >
          Admin accounts cannot purchase
        </button>
      ) : isPremiumLocked ? (
        <button
          onClick={onSubscribeClick}
          className={`${buttonBase} bg-primary text-black hover:bg-primary-hover`}
        >
          <Crown className="h-4 w-4" />
          Subscribe to unlock
        </button>
      ) : !shipsHere ? (
        /* Not a blocked sale, an enquiry.
         *
         * A seller in Poland will post to Texas if someone covers the
         * postage -- refusing outright loses the sale for both of
         * them. This routes the buyer to the seller instead, where a
         * custom request can be priced for that specific trip. Poland
         * to Germany and Poland to Texas are not the same number, so a
         * blanket surcharge would be wrong anyway. */
        <button
          onClick={() =>
            router.push(
              `/buyers/messages?thread=${encodeURIComponent(listing.seller)}` +
                `&prefill=${encodeURIComponent(
                  `Hi! I'd like to buy "${listing.title}" but I'm in ${buyerCountry}. ` +
                    `Would you be willing to post here if I cover the extra postage?`
                )}`
            )
          }
          className={`${buttonBase} border border-primary bg-primary-soft text-primary hover:bg-primary/10`}
        >
          <ShoppingBag className="h-4 w-4" />
          Ask about shipping to {buyerCountry}
        </button>
      ) : purchaseCompleted || !isListingStillActive ? (
        <button
          disabled
          className={`${buttonBase} cursor-not-allowed border border-success/40 bg-success-soft text-success`}
        >
          <Check className="h-4 w-4" />
          {purchaseCompleted ? 'You own this item' : 'Item sold'}
        </button>
      ) : (
        <button
          onClick={handleRealPurchase}
          disabled={isPurchasing || isProcessing || !canAfford || Boolean(dropOpensAt)}
          className={`${buttonBase} ${
            canAfford && !isPurchasing && !isProcessing && !dropOpensAt
              ? 'bg-primary text-black hover:bg-primary-hover active:bg-primary-press'
              : 'cursor-not-allowed bg-surface-overlay text-ink-faint'
          }`}
          aria-label={isDropListing ? 'Claim your unit' : 'Purchase now'}
        >
          {isPurchasing || isProcessing ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Processing
            </>
          ) : dropOpensAt ? (
            <>Opens {dropOpensAt.toLocaleString()}</>
          ) : isDropListing ? (
            <>
              <ShoppingBag className="h-4 w-4" />
              Claim unit #{nextUnitNumber} — ${(purchasePriceInCents / 100).toFixed(2)}
            </>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" />
              Buy now
            </>
          )}
        </button>
      )}

      {user?.role === 'buyer' &&
        !purchaseCompleted &&
        isListingStillActive &&
        !isPremiumLocked && (
          <p className="text-center text-xs text-ink-faint">
            Wallet balance ${(buyerBalanceInCents / 100).toFixed(2)}
          </p>
        )}
    </div>
  );
}
