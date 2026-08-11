// src/components/browse-detail/CheckoutModal.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, Loader2, MapPin, Pencil, X } from 'lucide-react';

import AddressConfirmationModal from '@/components/AddressConfirmationModal';
import {
  deliveryAddressService,
  isCompleteAddress,
  type DeliveryAddress,
} from '@/services/deliveryAddress.service';

/* =====================================================================
 * CHECKOUT
 *
 * Replaces buy-now-then-ask-later. Money used to move first, with the
 * shipping address collected afterwards from a panel on every card in My
 * Orders -- which is how 48 orders ended up sitting on "awaiting
 * shipment" with nowhere to ship to.
 *
 * Three reasons the order matters:
 *   - the seller receives a complete order rather than a puzzle
 *   - the buyer sees the total, the item and the destination before
 *     agreeing to any of it
 *   - "the buyer reviewed and confirmed the full order before payment"
 *     is a far stronger position in a chargeback than "we charged them,
 *     then asked where to send it"
 *
 * The address is loaded from the buyer's saved one, so a returning buyer
 * confirms rather than retypes. Editing writes back to the account, so
 * the next purchase and any auction win are correct too.
 *
 * This is mounted at PAGE level on purpose. There are three ways to buy
 * on the listing page (this section's button, the sticky bar, and the
 * drop claim) and a modal owned by one of them would leave the other two
 * charging cards with no address.
 * ===================================================================== */

export interface CheckoutItem {
  title: string;
  imageUrl?: string | null;
  seller: string;
  /** Listed price, before the platform fee. */
  price: number;
  /** What the buyer is actually charged. */
  total: number;
  /** e.g. "Unit #12 of 200" for a drop. */
  note?: string | null;
}

interface CheckoutModalProps {
  open: boolean;
  item: CheckoutItem | null;
  balance: number;
  isProcessing: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: (address: DeliveryAddress) => void;
}

export default function CheckoutModal({
  open,
  item,
  balance,
  isProcessing,
  error,
  onCancel,
  onConfirm,
}: CheckoutModalProps) {
  const [address, setAddress] = useState<DeliveryAddress | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [editingAddress, setEditingAddress] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load the saved address when the modal opens, not on mount: the page
  // should not call the API for a checkout that never happens.
  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoadingAddress(true);
    setSaveError(null);

    deliveryAddressService
      .get()
      .then((saved) => {
        if (cancelled) return;
        setAddress(saved);
        // Nothing on file: go straight to the form rather than showing an
        // empty slot the buyer has to discover they must fill.
        setEditingAddress(!isCompleteAddress(saved));
      })
      .finally(() => {
        if (!cancelled) setLoadingAddress(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isProcessing) onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, isProcessing, onCancel]);

  const canAfford = item ? balance >= item.total : false;
  const ready = Boolean(item) && isCompleteAddress(address) && canAfford && !isProcessing;

  const addressLines = useMemo(() => {
    if (!isCompleteAddress(address) || !address) return [];
    return [
      address.fullName,
      address.addressLine1,
      address.addressLine2,
      [address.city, address.state, address.postalCode].filter(Boolean).join(', '),
      address.country,
    ].filter((line): line is string => Boolean(line && line.trim()));
  }, [address]);

  const handleAddressSaved = async (next: DeliveryAddress) => {
    setSaveError(null);
    const result = await deliveryAddressService.save(next);

    if (!result.success) {
      setSaveError(result.error || 'Could not save your address');
      return;
    }

    setAddress(next);
    setEditingAddress(false);
  };

  if (!open || !item) return null;

  // The address form takes over the whole dialog rather than nesting a
  // modal inside a modal.
  if (editingAddress) {
    return (
      <AddressConfirmationModal
        isOpen
        onClose={() => {
          if (isCompleteAddress(address)) {
            setEditingAddress(false);
          } else {
            onCancel();
          }
        }}
        onConfirm={handleAddressSaved}
        existingAddress={address}
        orderId="checkout"
      />
    );
  }

  return (
    <div
      role="presentation"
      onClick={() => {
        if (!isProcessing) onCancel();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Confirm your order"
        onClick={(event) => event.stopPropagation()}
        className="pop-in max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-line bg-surface-raised"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold text-white">Confirm your order</h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="rounded-sm p-1 text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink disabled:opacity-50"
            aria-label="Cancel"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* What you are buying */}
          <div className="flex gap-3">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt=""
                className="h-16 w-16 shrink-0 rounded-md border border-line object-cover"
              />
            ) : (
              <div className="h-16 w-16 shrink-0 rounded-md border border-line bg-surface-overlay" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{item.title}</p>
              <p className="mt-0.5 text-xs text-ink-faint">from {item.seller}</p>
              {item.note ? (
                <p className="mt-1 text-xs font-medium text-primary">{item.note}</p>
              ) : null}
            </div>
          </div>

          {/* Where it goes */}
          <div className="border-t border-line pt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                <MapPin className="h-3.5 w-3.5 text-ink-muted" aria-hidden="true" />
                Delivery address
              </span>
              {!loadingAddress && isCompleteAddress(address) ? (
                <button
                  type="button"
                  onClick={() => setEditingAddress(true)}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary-hover disabled:opacity-50"
                >
                  <Pencil className="h-3 w-3" aria-hidden="true" />
                  Change
                </button>
              ) : null}
            </div>

            {loadingAddress ? (
              <div className="h-12 animate-pulse rounded-md bg-surface-overlay" />
            ) : addressLines.length > 0 ? (
              <address className="not-italic text-xs leading-relaxed text-ink-muted">
                {addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            ) : (
              <button
                type="button"
                onClick={() => setEditingAddress(true)}
                className="w-full rounded-md border border-dashed border-line px-4 py-3 text-xs font-medium text-primary transition-colors hover:border-primary"
              >
                Add a delivery address
              </button>
            )}

            {saveError ? (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-danger">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {saveError}
              </p>
            ) : null}
          </div>

          {/* What you pay. The listed price and the charge differ, and a
              buyer finding that out on their statement is how chargebacks
              start -- so both are stated before they agree. */}
          <div className="space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-muted">Item</span>
              <span className="tabular-nums text-ink">${item.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Platform fee</span>
              <span className="tabular-nums text-ink">
                ${(item.total - item.price).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between border-t border-line pt-2">
              <span className="font-semibold text-white">Total</span>
              <span className="font-bold tabular-nums text-primary">
                ${item.total.toFixed(2)}
              </span>
            </div>
            <p className="text-right text-xs text-ink-faint">
              Wallet balance ${balance.toFixed(2)}
            </p>
          </div>

          {!canAfford ? (
            <p className="flex items-center gap-1.5 text-xs text-danger">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Not enough in your wallet. Add funds to complete this order.
            </p>
          ) : null}

          {error ? (
            <p className="flex items-center gap-1.5 text-xs text-danger">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => {
              if (address) onConfirm(address);
            }}
            disabled={!ready}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-bold text-black transition-colors hover:bg-primary-hover active:bg-primary-press disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Processing
              </>
            ) : (
              <>
                <Check className="h-4 w-4" aria-hidden="true" />
                Confirm and pay ${item.total.toFixed(2)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
