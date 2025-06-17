// src/components/myListings/ListingForm.tsx
'use client';

import { Sparkles, Edit, Gavel, AlertCircle, Crown } from 'lucide-react';
import { ListingFormProps } from '@/types/myListings';
import ListingTypeSelector from './ListingTypeSelector';
import ImageUploadSection from './ImageUploadSection';

export default function ListingForm({
  formState,
  isEditing,
  isVerified,
  selectedFiles,
  isUploading,
  onFormChange,
  onFileSelect,
  onRemoveFile,
  onUploadFiles,
  onRemoveImage,
  onImageReorder,
  onSave,
  onCancel
}: ListingFormProps) {
  const {
    title,
    description,
    price,
    imageUrls,
    isPremium,
    tags,
    hoursWorn,
    isAuction,
    startingPrice,
    reservePrice,
    auctionDuration
  } = formState;

  return (
    <div className="bg-[#1a1a1a] p-6 sm:p-8 rounded-xl shadow-lg border border-gray-800">
      <h2 className="text-2xl font-bold mb-6 text-white">
        {isEditing ? 'Edit Listing' : 'Create New Listing'}
      </h2>
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
          <input
            type="text"
            placeholder="e.g. 'Black Lace Panties Worn 24 Hours'"
            value={title}
            onChange={(e) => onFormChange({ title: e.target.value })}
            className="w-full p-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
          <textarea
            placeholder="Describe your item in detail to attract buyers"
            value={description}
            onChange={(e) => onFormChange({ description: e.target.value })}
            className="w-full p-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff950e] h-28"
          />
        </div>
        
        <ListingTypeSelector
          isAuction={isAuction}
          isVerified={isVerified}
          onChange={(value) => onFormChange({ isAuction: value })}
        />
        
        {isAuction ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Starting Bid ($)</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 9.99"
                value={startingPrice}
                onChange={(e) => onFormChange({ startingPrice: e.target.value })}
                className="w-full p-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-600"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum price to start bidding</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Reserve Price ($) <span className="text-gray-500 text-xs">(Optional)</span>
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 19.99"
                value={reservePrice}
                onChange={(e) => onFormChange({ reservePrice: e.target.value })}
                className="w-full p-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-600"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum winning bid price (hidden from buyers)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Auction Duration</label>
              <select
                value={auctionDuration}
                onChange={(e) => onFormChange({ auctionDuration: e.target.value })}
                className="w-full p-3 border border-gray-700 rounded-lg bg-black text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="0.017">1 Minute (Testing)</option>
                <option value="1">1 Day</option>
                <option value="3">3 Days</option>
                <option value="5">5 Days</option>
                <option value="7">7 Days</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">How long the auction will last</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Price ($)</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 29.99"
                value={price}
                onChange={(e) => onFormChange({ price: e.target.value })}
                className="w-full p-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                min="0"
              />
            </div>
          </div>
        )}
        
        <ImageUploadSection
          selectedFiles={selectedFiles}
          imageUrls={imageUrls}
          isUploading={isUploading}
          isAuction={isAuction}
          onFileSelect={onFileSelect}
          onRemoveFile={onRemoveFile}
          onUploadFiles={onUploadFiles}
          onRemoveImage={onRemoveImage}
          onImageReorder={onImageReorder}
        />
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Tags (comma separated)</label>
          <input
            type="text"
            placeholder="e.g. thong, black, lace, cotton, gym"
            value={tags}
            onChange={(e) => onFormChange({ tags: e.target.value })}
            className="w-full p-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
          />
          <p className="text-xs text-gray-500 mt-1">Help buyers find your items with relevant tags</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Hours Worn (optional)</label>
          <input
            type="number"
            placeholder="e.g. 24"
            value={hoursWorn}
            onChange={(e) => onFormChange({ hoursWorn: e.target.value === '' ? '' : Number(e.target.value) })}
            className="w-full p-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
            min="0"
          />
        </div>
        
        {!isAuction && (
          <div className="mt-4">
            <label className={`flex items-center gap-3 py-4 px-5 border-2 rounded-lg cursor-pointer transition ${
              isPremium ? 'border-[#ff950e] bg-[#ff950e] bg-opacity-10' : 'border-gray-700 bg-black'
            }`}>
              <input
                type="checkbox"
                checked={isPremium}
                onChange={() => onFormChange({ isPremium: !isPremium })}
                className="h-5 w-5 text-[#ff950e] focus:ring-[#ff950e] rounded border-gray-600 bg-black checked:bg-[#ff950e]"
              />
              <Crown className={`w-6 h-6 ${isPremium ? 'text-[#ff950e]' : 'text-gray-500'}`} />
              <div>
                <span className={`font-semibold text-lg ${isPremium ? 'text-white' : 'text-gray-300'}`}>
                  Make Premium Listing
                </span>
                <p className={`text-sm mt-0.5 ${isPremium ? 'text-gray-200' : 'text-gray-400'}`}>
                  Only available to your subscribers
                </p>
              </div>
            </label>
          </div>
        )}
        
        {isAuction && (
          <div className="bg-purple-900 bg-opacity-30 border border-purple-700 rounded-lg p-4 mt-4">
            <div className="flex gap-3">
              <AlertCircle className="w-6 h-6 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-purple-300 mb-1">Auction Information</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Auctions run for {auctionDuration === '0.017' ? '1 minute' : `${auctionDuration} day${parseInt(auctionDuration) !== 1 ? 's' : ''}`} from the time you create the listing</li>
                  <li>• Bidders must have sufficient funds in their wallet to place a bid</li>
                  <li>• If the reserve price is met, the highest bidder automatically purchases the item when the auction ends</li>
                  <li>• You can cancel an auction at any time before it ends</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <button
            onClick={onSave}
            className={`w-full sm:flex-1 text-black px-6 py-3 rounded-lg font-bold text-lg transition flex items-center justify-center gap-2 ${
              isAuction ? 'bg-purple-500 hover:bg-purple-600' : 'bg-[#ff950e] hover:bg-[#e0850d]'
            }`}
          >
            {isEditing ? (
              <>
                <Edit className="w-5 h-5" />
                Save Changes
              </>
            ) : isAuction ? (
              <>
                <Gavel className="w-5 h-5" />
                Create Auction
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Create Listing
              </>
            )}
          </button>
          <button
            onClick={onCancel}
            className="w-full sm:flex-1 bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 font-medium text-lg transition flex items-center justify-center gap-2"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}