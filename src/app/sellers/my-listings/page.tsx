// src/app/sellers/my-listings/page.tsx
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Gavel, Lock, PlusCircle, ShieldCheck } from 'lucide-react';

import BanCheck from '@/components/BanCheck';
import RequireAuth from '@/components/RequireAuth';
import ListingCard from '@/components/myListings/ListingCard';
import ListingForm from '@/components/myListings/ListingForm';
import DigitalContentForm from '@/components/myListings/DigitalContentForm';
import { apiCall, API_BASE_URL, buildApiUrl } from '@/services/api.config';
import { useMyListings } from '@/hooks/useMyListings';

/* =====================================================================
 * SELLER: MY LISTINGS
 *
 * What this replaced:
 *
 *  - A hero panel with a gradient border, an inset shadow, a bespoke
 *    rounded-[28px] radius, a "SELLER WORKSPACE" pill in 0.2em tracking,
 *    and two sentences of marketing copy telling the seller to "stay
 *    premium" and keep their shop "irresistible" -- on a page they only
 *    reach after logging in, to do work.
 *
 *  - SIX stat boxes showing THREE numbers. The hero had Active Listings
 *    / Available Slots / Auctions Running; directly beneath, a second row
 *    repeated Standard / Premium / Auctions, each with its own icon tile
 *    and a line of advice ("Drive urgency and higher bids with
 *    time-limited auction drops").
 *
 *  - Five colour families: orange, emerald, purple, yellow and rose, in
 *    a product whose palette is black plus one orange.
 *
 *  - A "Get Verified" panel the size of a landing page section, listing
 *    four benefits, next to a separate auction-tips panel that repeated
 *    two of them.
 *
 * A seller opening this page wants to see their listings, edit one, or
 * add another. That is the page now: heading, one line of figures, the
 * grid. Verification is a single line, because it matters and it is
 * short -- not a panel competing with the work.
 * ===================================================================== */

function MyListingsContent() {
  const {
    user,
    showForm,
    formState,
    selectedFiles,
    isUploading,
    uploadProgress,
    editingState,
    isVerified,
    myListings,
    atLimit,
    maxListings,
    auctionCount,
    premiumCount,
    standardCount,
    error,
    validationErrors,

    setShowForm,
    updateFormState,
    resetForm,
    handleFileSelect,
    removeSelectedFile,
    handleUploadFiles,
    handleRemoveImageUrl,
    handleImageReorder,
    handleSaveListing,
    handleEditClick,
    handleCancelAuction,
    removeListing,
    getListingAnalytics,
  } = useMyListings();

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-sm text-ink-muted">Loading...</p>
      </main>
    );
  }

  const totalListings = myListings?.length ?? 0;
  const hasListings = totalListings > 0;
  const remainingSlots = Math.max((maxListings ?? 0) - totalListings, 0);
  const formOpen = showForm || editingState.isEditing;

  /* Physical vs digital.
     Defaults to physical because that is what the platform is for and
     what most sellers came to do -- digital is the addition, not the
     headline. Editing an existing listing forces physical, since a
     digital item is a different shape entirely and cannot be edited
     through this form. */
  const [createTab, setCreateTab] = useState<'physical' | 'digital'>('physical');

  const [digitalItems, setDigitalItems] = useState<any[]>([]);
  const [digitalLoading, setDigitalLoading] = useState(false);

  const loadDigital = useCallback(async () => {
    setDigitalLoading(true);
    try {
      const response = await apiCall<any>('/digital-content/mine/all');
      if (response.success) setDigitalItems(response.data || []);
    } catch {
      // A failed load leaves the previous list rather than an error
      // page; the physical listings below are the point of this page.
    } finally {
      setDigitalLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDigital();
  }, [loadDigital]);

  /* Uploaded as multipart rather than JSON, because the file has to
     travel with the fields. apiCall assumes JSON, so this goes direct
     and reads the token the same way apiCall does. */
  const submitDigital = useCallback(
    async (data: {
      file: File;
      title: string;
      description: string;
      price: number;
      blurLevel: string;
    }): Promise<boolean> => {
      try {
        const body = new FormData();
        body.append('image', data.file);
        body.append('title', data.title);
        body.append('description', data.description);
        body.append('price', String(data.price));
        body.append('blurLevel', data.blurLevel);

        let token = '';
        try {
          const stored = localStorage.getItem('auth_tokens');
          if (stored) token = JSON.parse(stored)?.token || '';
        } catch {
          // No token means the request 401s and the form says so.
        }

        const response = await fetch(buildApiUrl('/digital-content'), {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body,
        });

        const result = await response.json();
        if (!result.success) return false;

        await loadDigital();
        setCreateTab('physical');
        resetForm();
        return true;
      } catch {
        return false;
      }
    },
    [loadDigital, resetForm]
  );

  const deleteDigital = useCallback(
    async (id: string) => {
      try {
        await apiCall(`/digital-content/${id}`, { method: 'DELETE' });
        await loadDigital();
      } catch {
        // Nothing removed; the item stays on screen, which is honest.
      }
    },
    [loadDigital]
  );

  return (
    <main className="min-h-screen bg-surface text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {/* Heading + the primary action */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">My listings</h1>
            <p className="mt-1 text-sm text-ink-muted">
              {totalListings} of {maxListings ?? 0} used
            </p>
          </div>

          {!formOpen && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              disabled={atLimit}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-primary-hover active:bg-primary-press disabled:cursor-not-allowed disabled:opacity-50"
              style={{ color: '#000' }}
            >
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
              <span className="text-black">New listing</span>
            </button>
          )}
        </div>

        {/* One line of figures. Was six boxes for three numbers, in three
            colours, each with an icon tile and a line of advice. */}
        <div className="mb-6 grid grid-cols-2 gap-4 border-y border-line py-5 sm:grid-cols-4">
          <div>
            <p className="text-lg font-bold tabular-nums text-white sm:text-xl">{standardCount ?? 0}</p>
            <p className="text-xs text-ink-faint">Standard</p>
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums text-white sm:text-xl">{premiumCount ?? 0}</p>
            <p className="text-xs text-ink-faint">Premium</p>
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums text-white sm:text-xl">{auctionCount ?? 0}</p>
            <p className="text-xs text-ink-faint">Auctions</p>
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums text-white sm:text-xl">{remainingSlots}</p>
            <p className="text-xs text-ink-faint">Slots left</p>
          </div>
        </div>

        {/* Verification: one line, not a landing page section. It stays
            visible because it genuinely gates auctions and the listing
            limit -- but a seller does not need four bullet points and a
            shield icon every time they visit. */}
        {!isVerified && (
          <div className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-line bg-surface-raised px-4 py-3 text-sm">
            <Lock className="h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
            <span className="text-ink-muted">
              Unverified accounts can post {maxListings ?? 2} listings and cannot run auctions.
            </span>
            <Link
              href="/sellers/verify"
              className="font-semibold text-primary transition-colors hover:text-primary-hover"
            >
              Get verified
            </Link>
          </div>
        )}

        {atLimit && !editingState.isEditing && (
          <div className="mb-6 rounded-md border border-warning bg-warning-soft px-4 py-3 text-sm text-warning">
            You have used all {maxListings ?? 0} of your listing slots.
            {!isVerified ? (
              <>
                {' '}
                <Link href="/sellers/verify" className="font-semibold underline underline-offset-4">
                  Verify your account
                </Link>{' '}
                to raise the limit.
              </>
            ) : null}
          </div>
        )}

        {/* Create / edit form */}
        {formOpen && (
          <div className="mb-8 rounded-lg border border-line bg-surface-raised p-5">
            {/* Only when creating. Editing is always an existing
                physical listing, and offering a Digital tab there
                would suggest you could convert one into the other. */}
            {!editingState.isEditing && (
              <div className="mb-5 flex gap-1 rounded-md border border-line p-1">
                {([
                  { value: 'physical' as const, label: 'Physical item' },
                  { value: 'digital' as const, label: 'Digital content' },
                ]).map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setCreateTab(tab.value)}
                    aria-pressed={createTab === tab.value}
                    className={`flex-1 rounded-sm px-3 py-2 text-sm font-medium transition-colors ${
                      createTab === tab.value
                        ? 'bg-primary text-black'
                        : 'text-ink-muted hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {createTab === 'digital' && !editingState.isEditing ? (
              <DigitalContentForm
                onSubmit={submitDigital}
                onCancel={resetForm}
                isVerified={isVerified}
              />
            ) : (
            <ListingForm
              formState={formState}
              isEditing={editingState.isEditing}
              isVerified={isVerified}
              selectedFiles={selectedFiles}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              onFormChange={updateFormState}
              onFileSelect={handleFileSelect}
              onRemoveFile={removeSelectedFile}
              onUploadFiles={handleUploadFiles}
              onRemoveImage={handleRemoveImageUrl}
              onImageReorder={handleImageReorder}
              onSave={handleSaveListing}
              onCancel={resetForm}
              saveError={error}
              fieldErrors={validationErrors}
            />
            )}
          </div>
        )}

        {/* Digital content, its own grid.
            Separate from the listings below rather than mixed in: the
            two have different shapes -- no shipping, no auction, a
            blurred preview instead of photos -- and one card trying to
            render both would serve neither well. */}
        {digitalItems.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold text-white">
              Digital content
              {digitalLoading && <span className="ml-2 text-xs text-ink-faint">updating…</span>}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {digitalItems.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-lg border border-line bg-surface-raised"
                >
                  <div className="relative aspect-square bg-black">
                    {item.previewUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`${API_BASE_URL.replace('/api', '')}${item.previewUrl}`}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                    {item.approvalStatus !== 'approved' && (
                      <span
                        className={`absolute left-2 top-2 rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          item.approvalStatus === 'denied'
                            ? 'bg-red-600 text-white'
                            : 'bg-yellow-600 text-black'
                        }`}
                      >
                        {item.approvalStatus === 'denied' ? 'Not approved' : 'In review'}
                      </span>
                    )}
                  </div>

                  <div className="p-3.5">
                    <p className="truncate text-sm font-medium text-white">{item.title}</p>
                    <p className="mt-1 text-xs text-ink-muted">
                      ${Number(item.price).toFixed(2)} · {item.purchaseCount} unlock
                      {item.purchaseCount === 1 ? '' : 's'}
                      {item.totalEarned > 0 && ` · $${Number(item.totalEarned).toFixed(2)} earned`}
                    </p>
                    {item.approvalStatus === 'denied' && item.denialReason && (
                      <p className="mt-1.5 text-xs text-red-400">{item.denialReason}</p>
                    )}
                    <button
                      type="button"
                      onClick={() => void deleteDigital(item.id)}
                      className="mt-2.5 text-xs text-ink-faint transition-colors hover:text-red-400"
                    >
                      {item.purchaseCount > 0 ? 'Hide' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* The listings themselves -- the reason for the page */}
        {hasListings ? (
          <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                analytics={getListingAnalytics(listing)}
                onEdit={handleEditClick}
                onDelete={removeListing}
                onCancelAuction={handleCancelAuction}
              />
            ))}
          </div>
        ) : (
          !formOpen && (
            <div className="rounded-lg border border-line bg-surface-raised px-6 py-12 text-center">
              <Gavel className="mx-auto mb-3 h-6 w-6 text-ink-faint" aria-hidden="true" />
              <p className="mb-4 text-sm text-ink-muted">You haven&rsquo;t created a listing yet.</p>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                disabled={atLimit}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-primary-hover disabled:opacity-50"
                style={{ color: '#000' }}
              >
                <PlusCircle className="h-4 w-4" aria-hidden="true" />
                <span className="text-black">Create your first listing</span>
              </button>
            </div>
          )
        )}

        {/* Verified sellers get one quiet reminder that auctions exist,
            rather than a panel arguing for them. */}
        {isVerified && hasListings && (auctionCount ?? 0) === 0 && !formOpen && (
          <p className="mt-6 flex items-center gap-2 text-xs text-ink-faint">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            You can run auctions on any listing. Choose auction when creating one.
          </p>
        )}
      </div>
    </main>
  );
}

export default function MyListingsPage() {
  return (
    <BanCheck>
      <RequireAuth role="seller">
        <MyListingsContent />
      </RequireAuth>
    </BanCheck>
  );
}




