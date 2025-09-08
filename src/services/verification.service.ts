// src/services/verification.service.ts
import { FEATURES, API_BASE_URL, ApiResponse, buildApiUrl } from './api.config';
import { storageService } from './storage.service';
import { sanitizeStrict } from '@/utils/security/sanitization';

export interface VerificationSubmitData {
  code: string;
  codePhoto: File | string;
  idFront?: File | string;
  idBack?: File | string;
  passport?: File | string;
}

export interface VerificationStatus {
  status: 'unverified' | 'pending' | 'verified' | 'rejected';
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  attempts?: number;
}

export interface PendingVerification {
  _id: string;
  userId: {
    username: string;
    email: string;
    role: string;
  };
  status: string;
  documents: {
    codePhoto?: { url: string; uploadedAt: string };
    idFront?: { url: string; uploadedAt: string };
    idBack?: { url: string; uploadedAt: string };
    passport?: { url: string; uploadedAt: string };
  };
  verificationCode: string;
  submittedAt: string;
}

export interface VerificationStats {
  total: number;
  today: number;
  thisWeek: number;
  averageProcessingTime: number;
}

class VerificationService {
  /**
   * Get auth token from sessionStorage (where AuthContext stores it)
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = sessionStorage.getItem('auth_tokens');
      if (stored) {
        const tokens = JSON.parse(stored);
        return tokens?.token || null;
      }
    } catch (error) {
      console.error('Failed to get auth token:', error);
    }
    
    return null;
  }

  /**
   * Make authenticated API call
   */
  private async apiCall<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const token = this.getAuthToken();
    
    const headers: any = {
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || { message: 'Request failed' }
        };
      }

      return { success: true, data: data.data || data };
    } catch (error) {
      console.error('API call error:', error);
      return {
        success: false,
        error: { message: 'Network error' }
      };
    }
  }

  /**
   * Submit verification request
   */
  async submitVerification(data: VerificationSubmitData): Promise<ApiResponse<any>> {
    try {
      console.log('[VerificationService] Submitting verification...');
      
      if (FEATURES.USE_API_USERS) {
        const formData = new FormData();
        formData.append('code', sanitizeStrict(data.code));
        
        // Handle files - either File objects or base64 strings
        if (data.codePhoto) {
          if (data.codePhoto instanceof File) {
            formData.append('codePhoto', data.codePhoto);
          } else {
            // Convert base64 to file
            const file = this.base64ToFile(data.codePhoto, 'codePhoto.jpg');
            formData.append('codePhoto', file);
          }
        }
        
        if (data.idFront) {
          if (data.idFront instanceof File) {
            formData.append('idFront', data.idFront);
          } else {
            const file = this.base64ToFile(data.idFront, 'idFront.jpg');
            formData.append('idFront', file);
          }
        }
        
        if (data.idBack) {
          if (data.idBack instanceof File) {
            formData.append('idBack', data.idBack);
          } else {
            const file = this.base64ToFile(data.idBack, 'idBack.jpg');
            formData.append('idBack', file);
          }
        }
        
        if (data.passport) {
          if (data.passport instanceof File) {
            formData.append('passport', data.passport);
          } else {
            const file = this.base64ToFile(data.passport, 'passport.jpg');
            formData.append('passport', file);
          }
        }

        const token = this.getAuthToken();
        console.log('[VerificationService] Auth token present:', !!token);
        
        if (!token) {
          console.error('[VerificationService] No auth token found');
          return {
            success: false,
            error: { message: 'Not authenticated. Please log in again.' }
          };
        }

        // FIX: Use buildApiUrl to construct the URL properly
        const url = buildApiUrl('/verification/submit');
        console.log('[VerificationService] Submitting to:', url);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        console.log('[VerificationService] Response status:', response.status);
        const result = await response.json();
        console.log('[VerificationService] Response data:', result);
        
        if (!response.ok) {
          console.error('[VerificationService] Submit error:', result);
          return {
            success: false,
            error: result.error || { message: 'Failed to submit verification' }
          };
        }

        return { success: true, data: result.data };
      }

      // LocalStorage fallback
      const username = sessionStorage.getItem('username') || localStorage.getItem('username');
      if (!username) {
        return {
          success: false,
          error: { message: 'User not authenticated' }
        };
      }

      // Store verification request locally
      const requests = await storageService.getItem<Record<string, any>>(
        'panty_verification_requests',
        {}
      );

      requests[username] = {
        code: sanitizeStrict(data.code),
        codePhoto: data.codePhoto,
        idFront: data.idFront,
        idBack: data.idBack,
        passport: data.passport,
        submittedAt: new Date().toISOString(),
        status: 'pending'
      };

      await storageService.setItem('panty_verification_requests', requests);

      // Update user status
      const users = await storageService.getItem<Record<string, any>>(
        'all_users_v2',
        {}
      );

      if (users[username]) {
        users[username].verificationStatus = 'pending';
        users[username].verificationRequestedAt = new Date().toISOString();
        users[username].verificationDocs = {
          code: data.code,
          codePhoto: data.codePhoto,
          idFront: data.idFront,
          idBack: data.idBack,
          passport: data.passport
        };
        await storageService.setItem('all_users_v2', users);
      }

      return { success: true, data: { status: 'pending' } };
    } catch (error) {
      console.error('[VerificationService] Submit verification error:', error);
      return {
        success: false,
        error: { message: error instanceof Error ? error.message : 'Failed to submit verification' }
      };
    }
  }

  /**
   * Get verification status
   */
  async getVerificationStatus(): Promise<ApiResponse<VerificationStatus>> {
    try {
      if (FEATURES.USE_API_USERS) {
        const token = this.getAuthToken();
        if (!token) {
          return {
            success: false,
            error: { message: 'Not authenticated' }
          };
        }

        // FIX: Use buildApiUrl to construct the URL properly
        const response = await fetch(buildApiUrl('/verification/status'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        
        if (!response.ok) {
          return {
            success: false,
            error: data.error || { message: 'Failed to get verification status' }
          };
        }

        return { success: true, data: data.data };
      }

      // LocalStorage fallback
      const username = sessionStorage.getItem('username') || localStorage.getItem('username');
      if (!username) {
        return {
          success: false,
          error: { message: 'User not authenticated' }
        };
      }

      const users = await storageService.getItem<Record<string, any>>(
        'all_users_v2',
        {}
      );

      const user = users[username];
      if (!user) {
        return {
          success: true,
          data: { status: 'unverified' }
        };
      }

      return {
        success: true,
        data: {
          status: user.verificationStatus || 'unverified',
          submittedAt: user.verificationRequestedAt,
          rejectionReason: user.verificationRejectionReason
        }
      };
    } catch (error) {
      console.error('Get verification status error:', error);
      return {
        success: false,
        error: { message: 'Failed to get verification status' }
      };
    }
  }

  /**
   * Get pending verifications (admin only)
   */
  async getPendingVerifications(params?: {
    page?: number;
    limit?: number;
    sort?: 'newest' | 'oldest';
  }): Promise<ApiResponse<{ data: PendingVerification[]; meta: any }>> {
    try {
      if (FEATURES.USE_API_USERS) {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.sort) queryParams.append('sort', params.sort);

        const token = this.getAuthToken();
        if (!token) {
          return {
            success: false,
            error: { message: 'Not authenticated' }
          };
        }

        // FIX: Use buildApiUrl to construct the URL properly
        const response = await fetch(
          buildApiUrl('/verification/pending') + '?' + queryParams.toString(),
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        const result = await response.json();
        console.log('[VerificationService] Get pending response:', result);

        if (!response.ok) {
          return {
            success: false,
            error: result.error || { message: 'Failed to get pending verifications' }
          };
        }

        // Ensure consistent response structure
        if (result.success && result.data) {
          return { 
            success: true, 
            data: {
              data: Array.isArray(result.data) ? result.data : [],
              meta: result.meta || {
                page: params?.page || 1,
                pageSize: params?.limit || 20,
                total: Array.isArray(result.data) ? result.data.length : 0,
                totalPages: 1
              }
            }
          };
        }

        // Handle direct array response
        if (Array.isArray(result)) {
          return {
            success: true,
            data: {
              data: result,
              meta: {
                page: params?.page || 1,
                pageSize: params?.limit || 20,
                total: result.length,
                totalPages: 1
              }
            }
          };
        }

        return {
          success: true,
          data: { data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }
        };
      }

      // LocalStorage fallback
      const requests = await storageService.getItem<Record<string, any>>(
        'panty_verification_requests',
        {}
      );

      const pending = Object.entries(requests)
        .filter(([_, req]) => req.status === 'pending')
        .map(([username, req]) => ({
          _id: `local_${username}`,
          userId: { username, email: '', role: 'seller' },
          status: 'pending',
          documents: {
            codePhoto: req.codePhoto ? { url: req.codePhoto, uploadedAt: req.submittedAt } : undefined,
            idFront: req.idFront ? { url: req.idFront, uploadedAt: req.submittedAt } : undefined,
            idBack: req.idBack ? { url: req.idBack, uploadedAt: req.submittedAt } : undefined,
            passport: req.passport ? { url: req.passport, uploadedAt: req.submittedAt } : undefined
          },
          verificationCode: req.code,
          submittedAt: req.submittedAt
        }));

      // Sort
      if (params?.sort === 'newest') {
        pending.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      } else {
        pending.sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
      }

      // Paginate
      const page = params?.page || 1;
      const limit = params?.limit || 20;
      const start = (page - 1) * limit;
      const paginatedData = pending.slice(start, start + limit);

      return {
        success: true,
        data: {
          data: paginatedData,
          meta: {
            page,
            pageSize: limit,
            total: pending.length,
            totalPages: Math.ceil(pending.length / limit)
          }
        }
      };
    } catch (error) {
      console.error('Get pending verifications error:', error);
      return {
        success: false,
        error: { message: 'Failed to get pending verifications' }
      };
    }
  }

  /**
   * Review verification (admin only)
   */
  async reviewVerification(
    verificationId: string,
    action: 'approve' | 'reject',
    rejectionReason?: string
  ): Promise<ApiResponse<any>> {
    try {
      if (FEATURES.USE_API_USERS) {
        // FIX: Use buildApiUrl to construct the URL properly
        return await this.apiCall<any>(
          buildApiUrl('/verification/:id/review', { id: verificationId }),
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action,
              rejectionReason: rejectionReason ? sanitizeStrict(rejectionReason) : undefined
            })
          }
        );
      }

      // LocalStorage fallback
      if (verificationId.startsWith('local_')) {
        const username = verificationId.replace('local_', '');
        
        // Update verification request
        const requests = await storageService.getItem<Record<string, any>>(
          'panty_verification_requests',
          {}
        );

        if (requests[username]) {
          requests[username].status = action === 'approve' ? 'approved' : 'rejected';
          requests[username].reviewedAt = new Date().toISOString();
          if (action === 'reject' && rejectionReason) {
            requests[username].rejectionReason = sanitizeStrict(rejectionReason);
          }
          await storageService.setItem('panty_verification_requests', requests);
        }

        // Update user
        const users = await storageService.getItem<Record<string, any>>(
          'all_users_v2',
          {}
        );

        if (users[username]) {
          if (action === 'approve') {
            users[username].isVerified = true;
            users[username].verificationStatus = 'verified';
          } else {
            users[username].verificationStatus = 'rejected';
            users[username].verificationRejectionReason = rejectionReason;
          }
          await storageService.setItem('all_users_v2', users);
        }

        // Add to resolved verifications
        const resolved = await storageService.getItem<any[]>(
          'panty_resolved_verifications',
          []
        );

        resolved.push({
          id: verificationId,
          username,
          requestDate: requests[username]?.submittedAt || new Date().toISOString(),
          resolvedDate: new Date().toISOString(),
          resolvedBy: sessionStorage.getItem('username') || localStorage.getItem('username') || 'admin',
          status: action === 'approve' ? 'approved' : 'rejected',
          rejectionReason
        });

        await storageService.setItem('panty_resolved_verifications', resolved);

        return { success: true, data: { status: action } };
      }

      return {
        success: false,
        error: { message: 'Invalid verification ID' }
      };
    } catch (error) {
      console.error('Review verification error:', error);
      return {
        success: false,
        error: { message: 'Failed to review verification' }
      };
    }
  }

  /**
   * Get verification statistics (admin only)
   */
  async getVerificationStats(): Promise<ApiResponse<VerificationStats>> {
    try {
      if (FEATURES.USE_API_USERS) {
        // FIX: Use buildApiUrl to construct the URL properly
        return await this.apiCall<VerificationStats>(buildApiUrl('/verification/stats'));
      }

      // LocalStorage fallback
      const requests = await storageService.getItem<Record<string, any>>(
        'panty_verification_requests',
        {}
      );

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const pending = Object.values(requests).filter(req => req.status === 'pending');
      
      const todayCount = pending.filter(req => 
        new Date(req.submittedAt) >= today
      ).length;

      const weekCount = pending.filter(req => 
        new Date(req.submittedAt) >= weekAgo
      ).length;

      // Calculate average processing time from resolved
      const resolved = await storageService.getItem<any[]>(
        'panty_resolved_verifications',
        []
      );

      let avgTime = 0;
      if (resolved.length > 0) {
        const times = resolved
          .filter(r => r.requestDate && r.resolvedDate)
          .map(r => {
            const start = new Date(r.requestDate).getTime();
            const end = new Date(r.resolvedDate).getTime();
            return (end - start) / (1000 * 60 * 60); // hours
          });
        
        if (times.length > 0) {
          avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        }
      }

      return {
        success: true,
        data: {
          total: pending.length,
          today: todayCount,
          thisWeek: weekCount,
          averageProcessingTime: avgTime
        }
      };
    } catch (error) {
      console.error('Get verification stats error:', error);
      return {
        success: false,
        error: { message: 'Failed to get verification statistics' }
      };
    }
  }

  /**
   * Helper: Convert base64 to File
   */
  private base64ToFile(base64: string, filename: string): File {
    try {
      // Handle data URLs and raw base64
      let mime = 'image/jpeg';
      let data = base64;
      
      if (base64.includes(',')) {
        const arr = base64.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        if (mimeMatch) {
          mime = mimeMatch[1];
        }
        data = arr[1];
      }
      
      const bstr = atob(data);
      const n = bstr.length;
      const u8arr = new Uint8Array(n);
      
      for (let i = 0; i < n; i++) {
        u8arr[i] = bstr.charCodeAt(i);
      }
      
      return new File([u8arr], filename, { type: mime });
    } catch (error) {
      console.error('[VerificationService] Error converting base64 to file:', error);
      throw new Error('Failed to process image data');
    }
  }
}

export const verificationService = new VerificationService();