// src/components/browse-detail/CheckoutModal.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2, X } from 'lucide-react';

import { SecureInput } from '@/components/ui/SecureInput';
import {
  deliveryAddressService,
  isCompleteAddress,
} from '@/services/deliveryAddress.service';
import type { DeliveryAddress } from '@/types/order';

/* =====================================================================
 * CHECKOUT -- one step, one dialog.
 *
 * FIX: this used to hand off. When the buyer had no saved address,
 * `editingAddress` flipped true and the component RETURNED
 * <AddressConfirmationModal> instead of itself -- so checkout appeared
 * for a moment while the saved address loaded, then vanished and was
 * replaced by the old address dialog. From the buyer's side the order
 * summary simply disappeared.
 *
 * There is no handoff now. The address fields live inside this dialog,
 * beside the order summary, and the buyer sees what they are buying and
 * where it is going at the same time. Nothing is charged until they
 * press Confirm purchase.
 *
 * Wide (max-w-3xl) and two columns on desktop so the summary and the
 * address sit side by side rather than making a long scroll.
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

const EMPTY_ADDRESS: DeliveryAddress = {
  fullName: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
};

export default function CheckoutModal({
  open,
  item,
  balance,
  isProcessing,
  error,
  onCancel,
  onConfirm,
}: CheckoutModalProps) {
  const [address, setAddress] = useState<DeliveryAddress>(EMPTY_ADDRESS);
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Load the saved address when the modal opens, not on mount: no point
  // calling the API for a checkout that never happens.
  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoadingAddress(true);
    setSaveError(null);

    deliveryAddressService
      .get()
      .then((saved) => {
        if (cancelled) return;
        setAddress(saved ? { ...EMPTY_ADDRESS, ...saved } : EMPTY_ADDRESS);
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

  const setField = (field: keyof DeliveryAddress) => (value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
    setSaveError(null);
  };

  const canAfford = item ? balance >= item.total : false;
  const addressComplete = isCompleteAddress(address);
  const ready = Boolean(item) && addressComplete && canAfford && !isProcessing && !saving;

  const fee = useMemo(() => (item ? Math.max(0, item.total - item.price) : 0), [item]);

  const handleConfirm = async () => {
    if (!item || !addressComplete) return;

    setSaving(true);
    setSaveError(null);

    /* Save the address to the buyer's account BEFORE charging. It is what
       makes the next purchase prefill and lets auction wins ship, and if
       it fails we would rather stop here than take money for an order we
       cannot post. */
    const result = await deliveryAddressService.save(address);
    setSaving(false);

    if (!result.success) {
      setSaveError(result.error || 'Could not save your address. Nothing has been charged.');
      return;
    }

    onConfirm(address);
  };

  if (!open || !item) return null;

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
        aria-label="Confirm your purchase"
        onClick={(event) => event.stopPropagation()}
        className="pop-in max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-line bg-surface-raised"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold text-white">Confirm your purchase</h2>
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

        <div className="grid gap-6 p-5 md:grid-cols-2">
          {/* ---- What you are buying ---- */}
          <div>
            <div className="flex gap-3">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt=""
                  className="h-24 w-24 shrink-0 rounded-md border border-line object-cover"
                />
              ) : (
                <div className="h-24 w-24 shrink-0 rounded-md border border-line bg-surface-overlay" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug text-white">{item.title}</p>
                <p className="mt-1 text-xs text-ink-faint">from {item.seller}</p>
                {item.note ? (
                  <p className="mt-1 text-xs font-medium text-primary">{item.note}</p>
                ) : null}
              </div>
            </div>

            {/* Item price and the charge are different numbers. A buyer
                meeting that difference on their statement instead of here
                is how chargebacks start. */}
            <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-muted">Item</span>
                <span className="tabular-nums text-ink">${item.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Platform fee</span>
                <span className="tabular-nums text-ink">${fee.toFixed(2)}</span>
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
          </div>

          {/* ---- Where it goes ---- */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-ink">Delivery address</h3>

            {loadingAddress ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-9 animate-pulse rounded-md bg-surface-overlay" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <SecureInput
                  label="Full name"
                  value={address.fullName}
                  onChange={setField('fullName')}
                  placeholder="Jane Smith"
                  type="text"
                  maxLength={100}
                />
                <SecureInput
                  label="Address line 1"
                  value={address.addressLine1}
                  onChange={setField('addressLine1')}
                  placeholder="123 Main Street"
                  type="text"
                  maxLength={200}
                />
                <SecureInput
                  label="Address line 2"
                  value={address.addressLine2 || ''}
                  onChange={setField('addressLine2')}
                  placeholder="Apartment, suite (optional)"
                  type="text"
                  maxLength={200}
                />
                <div className="grid grid-cols-2 gap-3">
                  <SecureInput
                    label="City"
                    value={address.city}
                    onChange={setField('city')}
                    placeholder="Sydney"
                    type="text"
                    maxLength={100}
                  />
                  <SecureInput
                    label="State"
                    value={address.state}
                    onChange={setField('state')}
                    placeholder="NSW"
                    type="text"
                    maxLength={100}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <SecureInput
                    label="Postcode"
                    value={address.postalCode}
                    onChange={setField('postalCode')}
                    placeholder="2000"
                    type="text"
                    maxLength={20}
                  />
                  <SecureInput
                    label="Country"
                    value={address.country}
                    onChange={setField('country')}
                    placeholder="Australia"
                    type="text"
                    maxLength={56}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ---- Confirm ---- */}
        <div className="space-y-3 border-t border-line px-5 py-4">
          {!canAfford ? (
            <p className="flex items-center gap-1.5 text-xs text-danger">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Not enough in your wallet. Add funds to complete this order.
            </p>
          ) : null}

          {saveError ? (
            <p className="flex items-center gap-1.5 text-xs text-danger">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {saveError}
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
            onClick={handleConfirm}
            disabled={!ready}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-bold text-black transition-colors hover:bg-primary-hover active:bg-primary-press disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing || saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Processing
              </>
            ) : (
              `Confirm purchase - $${item.total.toFixed(2)}`
            )}
          </button>

          {!addressComplete && !loadingAddress ? (
            <p className="text-center text-xs text-ink-faint">
              Fill in your delivery address to continue.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
