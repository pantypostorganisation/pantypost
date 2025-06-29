// Fix for src/utils/storage.ts - getStorageInfo function (around line 45-60)

/**
 * Get async storage usage information via DSAL
 * @returns Promise with storage info
 */
export const getStorageInfo = async (): Promise<{ 
  used: number; 
  quota: number; 
  percentage: number;
  bytes: number;
  percent: number;
}> => {
  try {
    const info = await storageService.getStorageInfo();
    
    // Provide default values for undefined properties
    const estimatedSize = info.estimatedSize || 0;
    const totalItems = info.totalItems || 0;
    const quota = info.quota || MAX_STORAGE_BYTES;
    const percentage = info.percentage || 0;
    const used = info.used || estimatedSize;
    
    return {
      used,
      quota,
      percentage,
      bytes: estimatedSize,
      percent: percentage / 100,
      totalItems,
      estimatedSize,
      isAvailable: info.isAvailable
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    // Return fallback values with all required properties
    return {
      used: 0,
      quota: MAX_STORAGE_BYTES,
      percentage: 0,
      bytes: 0,
      percent: 0
    };
  }
};
