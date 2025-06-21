// src/components/myListings/ListingForm.tsx
'use client';

import { ListingFormProps } from '@/types/myListings';
import { Sparkles, Gavel, LockIcon, ImageIcon, Upload, X, MoveVertical, Edit, AlertCircle, Crown } from 'lucide-react';
import Link from 'next/link';

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
    <>
      <h2 className="text-2xl font-bold mb-6 text-white">
        {isEditing ? 'Edit Listing' : 'Create New Listing'}
      </h2>
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
          <input
            type="text"
            placeholder="e.g. 'Black Lace Panties Worn 24 Hours'"
            value={formState.title}
            onChange={(e) => onFormChange({ title: e.target.value })}
            className="w-full p-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
          <textarea
            placeholder="Describe your item in detail to attract buyers"
            value={formState.description}
            onChange={(e) => onFormChange({ description: e.target.value })}
            className="w-full p-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff950e] h-28"
          />
        </div>
        
        {/* Listing Type Selection */}
        <div className="bg-[#121212] p-4 rounded-lg border border-gray-700">
          <h3 className="text-lg font-medium mb-3 text-white">Listing Type</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <label className={`flex items-center gap-3 py-3 px-4 rounded-lg cursor-pointer border-2 transition flex-1 ${!formState.isAuction ? 'border-[#ff950e] bg-[#ff950e] bg-opacity-10' : 'border-gray-700 bg-black'}`}>
              <input
                type="radio"
                checked={!formState.isAuction}
                onChange={() => onFormChange({ isAuction: false })}
                className="sr-only"
              />
              <Sparkles className={`w-5 h-5 ${!formState.isAuction ? 'text-[#ff950e]' : 'text-gray-500'}`} />
              <div>
                <span className="font-medium">Standard Listing</span>
                <p className="text-xs text-gray-400 mt-1">Fixed price, first come first served</p>
              </div>
            </label>
            
            <div className="relative flex-1">
              <label 
                className={`flex items-center gap-3 py-3 px-4 rounded-lg cursor-pointer border-2 transition ${
                  formState.isAuction 
                    ? 'border-purple-600 bg-purple-600 bg-opacity-10' 
                    : 'border-gray-700 bg-black'
                } ${
                  !isVerified 
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:border-purple-500'
                }`}
              >
                <input
                  type="radio"
                  checked={formState.isAuction}
                  onChange={() => {
                    if (isVerified) {
                      onFormChange({ isAuction: true });
                    }
                  }}
                  disabled={!isVerified}
                  className="sr-only"
                />
                <Gavel className={`w-5 h-5 ${formState.isAuction ? 'text-purple-500' : 'text-gray-500'}`} />
                <div>
                  <span className="font-medium">Auction</span>
                  <p className="text-xs text-gray-400 mt-1">Let buyers bid, highest wins</p>
                </div>
              </label>
              
              {/* Lock overlay for unverified sellers */}
              {!isVerified && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 rounded-lg px-3 py-2">
                  <LockIcon className="w-6 h-6 text-yellow-500 mb-1" />
                  <span className="text-xs text-yellow-400 font-medium text-center">Verify your account to unlock auctions</span>
                  <Link 
                    href="/sellers/verify" 
                    className="mt-1 text-xs text-white bg-yellow-600 hover:bg-yellow-500 px-3 py-1 rounded-full font-medium transition"
                  >
                    Get Verified
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Show different price fields based on listing type */}
        {formState.isAuction ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Starting Bid ($)</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 9.99"
                value={formState.startingPrice}
                onChange={(e) => onFormChange({ startingPrice: e.target.value })}
                className="w-full p-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-600"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum price to start bidding</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Reserve Price ($) <span className="text-gray-500 text-xs">(Optional)</span></label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 19.99"
                value={formState.reservePrice}
                onChange={(e) => onFormChange({ reservePrice: e.target.value })}
                className="w-full p-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-600"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum winning bid price (hidden from buyers)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Auction Duration</label>
              <select
                value={formState.auctionDuration}
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
                value={formState.price}
                onChange={(e) => onFormChange({ price: e.target.value })}
                className="w-full p-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                min="0"
              />
            </div>
            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Add Images</label>
              <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-700 rounded-lg bg-black hover:border-[#ff950e] transition cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onFileSelect}
                  className="hidden"
                />
                <ImageIcon className="w-5 h-5 text-[#ff950e]" />
                <span className="text-gray-300">Select images from your computer</span>
              </label>
            </div>
          </div>
        )}
        
        {/* Image upload section for auction type */}
        {formState.isAuction && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Add Images</label>
            <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-700 rounded-lg bg-black hover:border-purple-600 transition cursor-pointer">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onFileSelect}
                className="hidden"
              />
              <ImageIcon className="w-5 h-5 text-purple-500" />
              <span className="text-gray-300">Select images from your computer</span>
            </label>
          </div>
        )}
        
        {/* Selected Files Preview */}
        {selectedFiles.length > 0 && (
          <div className="mt-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-300">{selectedFiles.length} file(s) selected</span>
              <button
                type="button"
                onClick={onUploadFiles}
                disabled={isUploading}
                className={`text-black px-4 py-2 rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${formState.isAuction ? 'bg-purple-500 hover:bg-purple-600' : 'bg-[#ff950e] hover:bg-[#e0850d]'}`}
              >
                {isUploading ? (
                  <>Uploading...</>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Add to Listing
                  </>
                )}
              </button>
            </div>

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Uploading images...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      formState.isAuction ? 'bg-purple-500' : 'bg-[#ff950e]'
                    }`}
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative border border-gray-700 rounded-lg overflow-hidden group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Selected ${index + 1}`}
                    className="w-full h-24 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveFile(index)}
                    className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 py-1 px-2">
                    <p className="text-xs text-white truncate">{file.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Image Preview and Reordering */}
        {formState.imageUrls.length > 0 && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Images (Drag to reorder)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {formState.imageUrls.map((url, index) => (
                <div
                  key={index}
                  draggable
                  onDragStart={() => onImageReorder(index, index)}
                  onDragEnter={() => onImageReorder(index, index)}
                  onDragEnd={() => onImageReorder(index, index)}
                  onDragOver={(e) => e.preventDefault()}
                  className={`relative border rounded-lg overflow-hidden cursor-grab active:cursor-grabbing group ${index === 0 ? 'border-2 border-[#ff950e] shadow-md' : 'border-gray-700'}`}
                >
                  <img
                    src={url}
                    alt={`Listing Image ${index + 1}`}
                    className={`w-full object-cover ${index === 0 ? 'h-32 sm:h-40' : 'h-24 sm:h-32'}`}
                  />
                  {index === 0 && (
                    <span className="absolute top-2 left-2 bg-[#ff950e] text-black text-xs px-2 py-0.5 rounded-full font-bold">
                      Main
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveImage(url)}
                    className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                    aria-label="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black bg-opacity-20">
                    <MoveVertical className="w-6 h-6 text-white" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Tags (comma separated)</label>
          <input
            type="text"
            placeholder="e.g. thong, black, lace, cotton, gym"
            value={formState.tags}
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
            value={formState.hoursWorn}
            onChange={(e) => onFormChange({ hoursWorn: e.target.value === '' ? '' : Number(e.target.value) })}
            className="w-full p-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
            min="0"
          />
        </div>
        
        {/* Only show premium option for standard listings */}
        {!formState.isAuction && (
          <div className="mt-4">
            <label className={`flex items-center gap-3 py-4 px-5 border-2 rounded-lg cursor-pointer transition ${formState.isPremium ? 'border-[#ff950e] bg-[#ff950e] bg-opacity-10' : 'border-gray-700 bg-black'}`}>
              <input
                type="checkbox"
                checked={formState.isPremium}
                onChange={() => onFormChange({ isPremium: !formState.isPremium })}
                className="h-5 w-5 text-[#ff950e] focus:ring-[#ff950e] rounded border-gray-600 bg-black checked:bg-[#ff950e]"
              />
              <Crown className={`w-6 h-6 ${formState.isPremium ? 'text-[#ff950e]' : 'text-gray-500'}`} />
              <div>
                <span className={`font-semibold text-lg ${formState.isPremium ? 'text-white' : 'text-gray-300'}`}>Make Premium Listing</span>
                <p className={`text-sm mt-0.5 ${formState.isPremium ? 'text-gray-200' : 'text-gray-400'}`}>Only available to your subscribers</p>
              </div>
            </label>
          </div>
        )}
        
        {/* Auction information notice */}
        {formState.isAuction && (
          <div className="bg-purple-900 bg-opacity-30 border border-purple-700 rounded-lg p-4 mt-4">
            <div className="flex gap-3">
              <AlertCircle className="w-6 h-6 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-purple-300 mb-1">Auction Information</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Auctions run for {formState.auctionDuration === '0.017' ? '1 minute' : `${formState.auctionDuration} day${parseInt(formState.auctionDuration) !== 1 ? 's' : ''}`} from the time you create the listing</li>
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
              formState.isAuction ? 'bg-purple-500 hover:bg-purple-600' : 'bg-[#ff950e] hover:bg-[#e0850d]'
            }`}
          >
            {isEditing ? (
              <>
                <Edit className="w-5 h-5" />
                Save Changes
              </>
            ) : formState.isAuction ? (
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
    </>
  );
}
