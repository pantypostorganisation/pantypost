// src/services/ban.service.ts
import { apiCall, API_BASE_URL, FEATURES, buildApiUrl } from './api.config';
import { storageService } from './storage.service';

export interface BanData {
  username: string;
  reason: string;
  customReason?: string;
  duration?: number | 'permanent'; // Fixed: Allow 'permanent' as well as number
  isPermanent?: boolean;
  notes?: string;
  relatedReportIds?: string[]; // Changed to array to match usage
  bannedBy?: string;
}

export interface BanResponse {
  success: boolean;
  data?: any;
  error?: any;
}

class BanService {
  // Create a ban
  async createBan(data: BanData): Promise<BanResponse> {
    console.log('[BanService] Creating ban:', data);
    
    // Only use API if feature is enabled
    if (!FEATURES.USE_API_BANS) {
      console.log('[BanService] API bans disabled, returning success for localStorage-only operation');
      return { success: true };
    }
    
    try {
      const response = await apiCall(`${API_BASE_URL}/api/admin/bans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          isPermanent: data.duration === 'permanent'
        })
      });

      console.log('[BanService] Ban response:', response);
      return response;
    } catch (error) {
      console.error('[BanService] Error creating ban:', error);
      // Don't throw - let the context handle localStorage fallback
      return { success: false, error };
    }
  }

  // Get all bans (admin only)
  async getBans(params?: {
    active?: boolean;
    username?: string;
    page?: number;
    limit?: number;
  }): Promise<BanResponse> {
    if (!FEATURES.USE_API_BANS) {
      // Return data from localStorage
      const bans = await storageService.getItem('panty_user_bans', []);
      return { success: true, data: { bans } };
    }

    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    try {
      return await apiCall(`/admin/bans${queryParams.toString() ? `?${queryParams.toString()}` : ''}`, {
        method: 'GET'
      });
    } catch (error) {
      console.error('[BanService] Error fetching bans:', error);
      return { success: false, error };
    }
  }

  // Lift/unban
  async unbanUser(username: string, reason?: string): Promise<BanResponse> {
    if (!FEATURES.USE_API_BANS) {
      return { success: true };
    }

    try {
      return await apiCall(buildApiUrl('/admin/bans/:username/unban', { username }), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });
    } catch (error) {
      console.error('[BanService] Error unbanning user:', error);
      return { success: false, error };
    }
  }

  // Get ban stats
  async getBanStats(): Promise<BanResponse> {
    if (!FEATURES.USE_API_BANS) {
      const bans = await storageService.getItem<any[]>('panty_user_bans', []);
      const activeBans = bans.filter(b => b.active);
      return {
        success: true,
        data: {
          totalActiveBans: activeBans.length,
          permanentBans: activeBans.filter(b => b.isPermanent || b.banType === 'permanent').length,
          temporaryBans: activeBans.filter(b => !b.isPermanent && b.banType !== 'permanent').length,
          pendingAppeals: activeBans.filter(b => b.appealStatus === 'pending').length,
          bansLast24h: bans.filter(b => {
            const banDate = new Date(b.createdAt || b.startTime);
            return (Date.now() - banDate.getTime()) < 24 * 60 * 60 * 1000;
          }).length
        }
      };
    }

    try {
      return await apiCall('/admin/bans/stats', {
        method: 'GET'
      });
    } catch (error) {
      console.error('[BanService] Error fetching ban stats:', error);
      return { success: false, error };
    }
  }

  // Submit appeal
  async submitAppeal(banId: string, appealText: string, evidence?: string[]): Promise<BanResponse> {
    if (!FEATURES.USE_API_BANS) {
      return { success: true };
    }

    try {
      return await apiCall(buildApiUrl('/admin/bans/:id/appeal', { id: banId }), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ appealText, evidence })
      });
    } catch (error) {
      console.error('[BanService] Error submitting appeal:', error);
      return { success: false, error };
    }
  }

  // Review appeal (admin)
  async reviewAppeal(banId: string, decision: 'approve' | 'reject' | 'escalate', notes: string): Promise<BanResponse> {
    if (!FEATURES.USE_API_BANS) {
      return { success: true };
    }

    try {
      return await apiCall(buildApiUrl('/admin/bans/:id/appeal/review', { id: banId }), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ decision, notes })
      });
    } catch (error) {
      console.error('[BanService] Error reviewing appeal:', error);
      return { success: false, error };
    }
  }
}

export const banService = new BanService();