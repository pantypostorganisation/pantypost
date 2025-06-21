// src/components/myListings/ListingForm.tsx
'use client';

import { ListingFormProps } from '@/types/myListings';
import ImageUploadSection from './ImageUploadSection';
import ListingTypeSelector from './ListingTypeSelector';

export default function ListingForm({
  formState,
  isEditing,
  isVerified,
  selectedFiles,
  isUploading,
  uploadProgress = 0,
  onFormChange,
  onFileSelect,
  onRemoveFile,
  onUploadFiles,
  onRemoveImage,
  onImageReorder,
  onSave,
  onCancel
}: ListingFormProps) {
  return (
    <div className="mb-8 p-4 sm:p-6 bg-gray-900 rounded-lg border border-gray-800">
      <h2 className="text-2xl font-bold mb-6 text-white">
        {isEditing ? 'Edit Listing' : 'Create New Listing'}
      </h2>

      <div className="space-y-6">
        {/* Listing Type Selector */}
        {!isEditing && (
          <ListingTypeSelector
            isAuction={formState.isAuction}
            isVerified={isVerified}
            onChange={(isAuction: boolean) => onFormChange({ isAuction })}
          />
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formState.title}
            onChange={(e) => onFormChange({ title: e.target.value })}
            className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff950e]"
            placeholder="Enter listing title"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formState.description}
            onChange={(e) => onFormChange({ description: e.target.value })}
            rows={4}
            className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff950e] resize-none"
            placeholder="Describe your listing in detail"
          />
        </div>

        {/* Price Section */}
        {formState.isAuction ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Starting Bid <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formState.startingPrice}
                onChange={(e) => onFormChange({ startingPrice: e.target.value })}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                placeholder="0.00"
                min="0.01"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Reserve Price
              </label>
              <input
                type="number"
                value={formState.reservePrice}
                onChange={(e) => onFormChange({ reservePrice: e.target.value })}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                placeholder="Optional"
                min="0.01"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Duration (Days) <span className="text-red-500">*</span>
              </label>
              <select
                value={formState.auctionDuration}
                onChange={(e) => onFormChange({ auctionDuration: e.target.value })}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="1">1 Day</option>
                <option value="3">3 Days</option>
                <option value="5">5 Days</option>
                <option value="7">7 Days</option>
              </select>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Price <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formState.price}
              onChange={(e) => onFormChange({ price: e.target.value })}
              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff950e]"
              placeholder="0.00"
              min="0.01"
              step="0.01"
            />
          </div>
        )}

        {/* Additional Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Tags
            </label>
            <input
              type="text"
              value={formState.tags}
              onChange={(e) => onFormChange({ tags: e.target.value })}
              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff950e]"
              placeholder="e.g., cotton, pink, daily wear"
            />
            <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Hours Worn
            </label>
            <input
              type="number"
              value={formState.hoursWorn}
              onChange={(e) => onFormChange({ hoursWorn: e.target.value === '' ? '' : Number(e.target.value) })}
              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff950e]"
              placeholder="Optional"
              min="0"
            />
          </div>
        </div>

        {/* Premium Toggle */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isPremium"
            checked={formState.isPremium}
            onChange={(e) => onFormChange({ isPremium: e.target.checked })}
            className="rounded border-gray-700 bg-black text-[#ff950e] focus:ring-[#ff950e]"
          />
          <label htmlFor="isPremium" className="text-gray-300">
            Mark as Premium Listing (Images will be blurred for non-purchasers)
          </label>
        </div>

        {/* Image Upload Section */}
        <ImageUploadSection
          selectedFiles={selectedFiles}
          imageUrls={formState.imageUrls}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          isAuction={formState.isAuction}
          onFileSelect={onFileSelect}
          onRemoveFile={onRemoveFile}
          onUploadFiles={onUploadFiles}
          onRemoveImage={onRemoveImage}
          onImageReorder={onImageReorder}
        />

        {/* Form Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onSave}
            className={`px-6 py-2 rounded-lg font-medium ${
              formState.isAuction
                ? 'bg-purple-500 hover:bg-purple-600'
                : 'bg-[#ff950e] hover:bg-[#e0850d]'
            } text-black transition`}
          >
            {isEditing ? 'Update Listing' : 'Create Listing'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 rounded-lg font-medium bg-gray-800 hover:bg-gray-700 text-white transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
