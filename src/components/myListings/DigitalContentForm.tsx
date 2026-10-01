// src/components/myListings/DigitalContentForm.tsx
'use client';

/* Uploading a piece of paid digital content.
 *
 * Two things here differ from the physical listing form and both are
 * deliberate.
 *
 * The price is what the buyer pays. Physical listings mark up at
 * checkout, so a seller setting $10 sees buyers charged more; this
 * does not. The earnings line says so plainly, because a seller who
 * discovers the split after their first sale trusts the next number
 * less.
 *
 * And the blur is applied server-side at upload, not as a CSS filter
 * here. A filter would leave the real image in the page for anyone who
 * opens DevTools. What the seller picks on this slider decides which
 * blurred file gets generated -- which is why it cannot be changed
 * later without re-uploading.
 */

import { useCallback, useRef, useState } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, Info } from 'lucide-react';

const PLATFORM_FEE_RATE = 0.05;

type BlurLevel = 'light' | 'medium' | 'heavy';

const BLUR_OPTIONS: { value: BlurLevel; label: string; note: string }[] = [
  { value: 'light', label: 'Light', note: 'Shape and pose visible' },
  { value: 'medium', label: 'Medium', note: 'Recommended' },
  { value: 'heavy', label: 'Heavy', note: 'Almost nothing visible' },
];

interface DigitalContentFormProps {
  onSubmit: (data: {
    file: File;
    title: string;
    description: string;
    price: number;
    blurLevel: BlurLevel;
  }) => Promise<boolean>;
  onCancel: () => void;
  isVerified: boolean;
}

export default function DigitalContentForm({
  onSubmit,
  onCancel,
  isVerified,
}: DigitalContentFormProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [blurLevel, setBlurLevel] = useState<BlurLevel>('medium');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numericPrice = Number(price);
  const validPrice = Number.isFinite(numericPrice) && numericPrice >= 1 && numericPrice <= 500;
  const earnings = validPrice
    ? Math.round(numericPrice * (1 - PLATFORM_FEE_RATE) * 100) / 100
    : 0;

  const handleFile = useCallback((selected: File | null) => {
    setError(null);
    if (!selected) return;

    if (!selected.type.startsWith('image/')) {
      setError('Images only for now. Video is coming.');
      return;
    }
    if (selected.size > 15 * 1024 * 1024) {
      setError('That file is over 15MB. Try a smaller one.');
      return;
    }

    setFile(selected);
    /* A local preview of the UNBLURRED file, so the seller can see
       what they picked. It never leaves the browser -- what buyers
       see is generated on the server. */
    setLocalPreview(URL.createObjectURL(selected));
  }, []);

  const clearFile = useCallback(() => {
    if (localPreview) URL.revokeObjectURL(localPreview);
    setFile(null);
    setLocalPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [localPreview]);

  const submit = useCallback(async () => {
    setError(null);

    if (!file) return setError('Choose an image first.');
    if (!title.trim()) return setError('Give it a title.');
    if (!validPrice) return setError('Price must be between $1 and $500.');

    setSaving(true);
    try {
      const ok = await onSubmit({
        file,
        title: title.trim(),
        description: description.trim(),
        price: numericPrice,
        blurLevel,
      });
      if (!ok) setError('That did not save. Your details are still here — try again.');
    } finally {
      setSaving(false);
    }
  }, [file, title, description, numericPrice, validPrice, blurLevel, onSubmit]);

  if (!isVerified) {
    return (
      <div className="rounded-lg border border-yellow-600/40 bg-yellow-600/10 p-4 text-sm text-yellow-400">
        Verify your identity before posting paid content.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">New digital content</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Buyers see a blurred preview and pay once to unlock the full image.
        </p>
      </div>

      {/* The file */}
      {!file ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed border-line py-10 text-center transition-colors hover:border-primary"
        >
          <Upload className="h-6 w-6 text-ink-faint" aria-hidden="true" />
          <span className="text-sm font-medium text-white">Choose an image</span>
          <span className="text-xs text-ink-faint">JPG, PNG or WebP, up to 15MB</span>
        </button>
      ) : (
        <div className="relative overflow-hidden rounded-lg border border-line">
          {localPreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={localPreview} alt="" className="max-h-72 w-full object-contain bg-black" />
          )}
          <button
            type="button"
            onClick={clearFile}
            aria-label="Remove image"
            className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white transition-colors hover:bg-black"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="flex items-center gap-1.5 border-t border-line bg-surface px-3 py-2 text-xs text-ink-faint">
            <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Only you see this unblurred. Buyers see the preview below until they pay.
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(event) => handleFile(event.target.files?.[0] || null)}
        className="hidden"
      />

      {/* Title and description */}
      <div>
        <label htmlFor="dc-title" className="mb-1 block text-sm font-medium text-gray-200">
          Title
        </label>
        <input
          id="dc-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={120}
          placeholder="What is it?"
          className="w-full rounded-md border border-line bg-black px-3 py-2.5 text-sm text-white placeholder-ink-faint focus:border-primary focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="dc-desc" className="mb-1 block text-sm font-medium text-gray-200">
          Description <span className="text-ink-faint">(optional)</span>
        </label>
        <textarea
          id="dc-desc"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="Tell buyers what they are unlocking."
          className="w-full resize-none rounded-md border border-line bg-black px-3 py-2.5 text-sm text-white placeholder-ink-faint focus:border-primary focus:outline-none"
        />
      </div>

      {/* Blur */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-200">Preview blur</label>
        <p className="mb-2.5 text-xs text-ink-muted">
          How much buyers see before paying. Set at upload and baked into the preview, so
          changing it later means uploading again.
        </p>
        <div className="grid grid-cols-3 gap-2">
          {BLUR_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setBlurLevel(option.value)}
              aria-pressed={blurLevel === option.value}
              className={`rounded-md border px-3 py-2.5 text-left transition-colors ${
                blurLevel === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-line hover:border-white/20'
              }`}
            >
              <span className="block text-sm font-medium text-white">{option.label}</span>
              <span className="mt-0.5 block text-[11px] leading-tight text-ink-faint">
                {option.note}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <label htmlFor="dc-price" className="mb-1 block text-sm font-medium text-gray-200">
          Price
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-muted">
            $
          </span>
          <input
            id="dc-price"
            type="number"
            min={1}
            max={500}
            step="0.01"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="10.00"
            className="w-full rounded-md border border-line bg-black py-2.5 pl-7 pr-3 text-sm text-white placeholder-ink-faint focus:border-primary focus:outline-none"
          />
        </div>

        {/* Said upfront, not discovered after the first sale. */}
        <div className="mt-2 flex items-start gap-2 rounded-md border border-line bg-surface px-3 py-2.5">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
          <p className="text-xs leading-relaxed text-ink-muted">
            {validPrice ? (
              <>
                Buyers pay <span className="font-medium text-white">${numericPrice.toFixed(2)}</span>{' '}
                and you keep <span className="font-medium text-primary">${earnings.toFixed(2)}</span>.
                Our fee on digital content is 5%, half what we take on physical items.
              </>
            ) : (
              <>Our fee on digital content is 5%, half what we take on physical items.</>
            )}
          </p>
        </div>
      </div>

      {error && (
        <p className="rounded-md border border-red-700 bg-red-900/30 px-3 py-2.5 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => void submit()}
          disabled={saving}
          className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-semibold text-black transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {saving ? 'Uploading...' : 'Submit for review'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-md border border-line px-5 py-3 text-sm font-medium text-ink-muted transition-colors hover:border-white/20 hover:text-white disabled:opacity-50"
        >
          Cancel
        </button>
      </div>

      <p className="text-xs text-ink-faint">
        Reviewed before it goes live, the same as every listing.
      </p>
    </div>
  );
}
