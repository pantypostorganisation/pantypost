// src/components/admin/reports/BanModal.tsx
'use client';

import { Ban, AlertCircle } from 'lucide-react';
import { BanModalProps } from './types';
import { SecureInput, SecureTextarea } from '@/components/ui/SecureInput';
import { SecureForm } from '@/components/ui/SecureForm';
import { sanitizeNumber } from '@/utils/security/sanitization';
import { useState, useEffect } from 'react';
import { usersService } from '@/services/users.service';

export default function BanModal({
  isOpen,
  banForm,
  setBanForm,
  isProcessing,
  onClose,
  onConfirm
}: BanModalProps) {
  const [touched, setTouched] = useState({
    username: false,
    hours: false,
    customReason: false,
    details: false,
    notes: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [targetUserRole, setTargetUserRole] = useState<'buyer' | 'seller' | 'admin' | null>(null);
  const [isCheckingUser, setIsCheckingUser] = useState(false);

  // Check user role when username changes
  useEffect(() => {
    const checkUserRole = async () => {
      if (!banForm.username.trim()) {
        setTargetUserRole(null);
        return;
      }
      
      setIsCheckingUser(true);
      try {
        const result = await usersService.getUser(banForm.username);
        if (result.success && result.data) {
          setTargetUserRole(result.data.role);
          
          // If user is admin, set error immediately
          if (result.data.role === 'admin') {
            setErrors(prev => ({
              ...prev,
              username: 'Admin accounts cannot be banned'
            }));
          } else {
            // Clear username error if not admin
            setErrors(prev => {
              const { username, ...rest } = prev;
              return rest;
            });
          }
        } else {
          setTargetUserRole(null);
        }
      } catch (error) {
        console.error('Failed to check user role:', error);
        setTargetUserRole(null);
      } finally {
        setIsCheckingUser(false);
      }
    };
    
    const debounceTimer = setTimeout(checkUserRole, 500);
    return () => clearTimeout(debounceTimer);
  }, [banForm.username]);

  if (!isOpen) return null;

  // Handle secure form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const validationErrors: Record<string, string> = {};
    
    // Validate username
    if (!banForm.username.trim()) {
      validationErrors.username = 'Username is required';
    }
    
    // Check if trying to ban an admin
    if (targetUserRole === 'admin') {
      validationErrors.username = 'Admin accounts cannot be banned';
    }
    
    // Validate hours for temporary ban
    if (banForm.banType === 'temporary') {
      const hours = parseInt(banForm.hours);
      if (isNaN(hours) || hours < 1 || hours > 8760) { // Max 1 year
        validationErrors.hours = 'Please enter valid hours (1-8760)';
      }
    }
    
    // Validate custom reason if "other" is selected
    if (banForm.reason === 'other' && !banForm.customReason.trim()) {
      validationErrors.customReason = 'Please specify a custom reason';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setTouched({
        username: true,
        hours: true,
        customReason: true,
        details: true,
        notes: true
      });
      return;
    }
    
    await onConfirm();
  };

  // Handle secure hours change
  const handleHoursChange = (value: string) => {
    if (value === '') {
      setBanForm(prev => ({ ...prev, hours: '' }));
    } else {
      const sanitized = sanitizeNumber(value, 1, 8760); // 1 hour to 1 year
      setBanForm(prev => ({ ...prev, hours: sanitized.toString() }));
    }
  };

  // Reset form when closing
  const handleClose = () => {
    setTouched({
      username: false,
      hours: false,
      customReason: false,
      details: false,
      notes: false
    });
    setErrors({});
    setTargetUserRole(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <Ban className="mr-2 text-red-400" />
          Manual Ban Decision
        </h3>
        
        <SecureForm
          onSubmit={handleSubmit}
          rateLimitKey="admin_ban_user"
          rateLimitConfig={{ maxAttempts: 10, windowMs: 60 * 1000 }}
        >
          <div className="space-y-4">
            {/* Username */}
            <div>
              <SecureInput
                label="Username"
                type="text"
                value={banForm.username}
                onChange={(value) => setBanForm(prev => ({ ...prev, username: value }))}
                onBlur={() => setTouched(prev => ({ ...prev, username: true }))}
                className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                placeholder="Enter username to ban"
                error={errors.username}
                touched={touched.username}
                maxLength={50}
                required
              />
              {isCheckingUser && (
                <p className="text-xs text-gray-400 mt-1">Checking user...</p>
              )}
              {targetUserRole && !errors.username && (
                <p className="text-xs text-gray-400 mt-1">
                  User role: <span className={targetUserRole === 'admin' ? 'text-red-400 font-bold' : 'text-gray-300'}>
                    {targetUserRole}
                  </span>
                </p>
              )}
            </div>

            {/* Ban Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Ban Type</label>
              <select
                value={banForm.banType}
                onChange={(e) => setBanForm(prev => ({ ...prev, banType: e.target.value as 'temporary' | 'permanent' }))}
                className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                disabled={targetUserRole === 'admin'}
              >
                <option value="temporary">Temporary</option>
                <option value="permanent">Permanent</option>
              </select>
            </div>

            {/* Duration (for temporary bans) */}
            {banForm.banType === 'temporary' && (
              <div>
                <SecureInput
                  label="Duration (hours)"
                  type="number"
                  value={banForm.hours}
                  onChange={handleHoursChange}
                  onBlur={() => setTouched(prev => ({ ...prev, hours: true }))}
                  className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                  min="1"
                  max="8760"
                  placeholder="24"
                  error={errors.hours}
                  touched={touched.hours}
                  helpText="Maximum: 8760 hours (1 year)"
                  sanitize={false}
                  disabled={targetUserRole === 'admin'}
                />
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Reason</label>
              <select
                value={banForm.reason}
                onChange={(e) => setBanForm(prev => ({ ...prev, reason: e.target.value as any }))}
                className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                disabled={targetUserRole === 'admin'}
              >
                <option value="harassment">Harassment</option>
                <option value="scam">Scam/Fraud</option>
                <option value="spam">Spam</option>
                <option value="inappropriate_content">Inappropriate Content</option>
                <option value="underage">Underage</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Custom Reason */}
            {banForm.reason === 'other' && (
              <div>
                <SecureInput
                  label="Custom Reason"
                  type="text"
                  value={banForm.customReason}
                  onChange={(value) => setBanForm(prev => ({ ...prev, customReason: value }))}
                  onBlur={() => setTouched(prev => ({ ...prev, customReason: true }))}
                  className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                  placeholder="Specify reason..."
                  error={errors.customReason}
                  touched={touched.customReason}
                  maxLength={200}
                  required={banForm.reason === 'other'}
                  disabled={targetUserRole === 'admin'}
                />
              </div>
            )}

            {/* Additional Details */}
            <div>
              <SecureInput
                label="Additional Details"
                type="text"
                value={banForm.notes.split('\n')[0] || ''}
                onChange={(value) => setBanForm(prev => ({ ...prev, notes: value + '\n' + (prev.notes.split('\n')[1] || '') }))}
                onBlur={() => setTouched(prev => ({ ...prev, details: true }))}
                className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                placeholder="Additional details..."
                touched={touched.details}
                maxLength={300}
                disabled={targetUserRole === 'admin'}
              />
            </div>
            
            {/* Admin Notes */}
            <div>
              <SecureTextarea
                label="Admin Notes"
                value={banForm.notes.split('\n').slice(1).join('\n')}
                onChange={(value) => setBanForm(prev => ({ ...prev, notes: (prev.notes.split('\n')[0] || '') + '\n' + value }))}
                onBlur={() => setTouched(prev => ({ ...prev, notes: true }))}
                className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                rows={3}
                placeholder="Internal notes about this ban..."
                touched={touched.notes}
                maxLength={1000}
                characterCount={true}
                disabled={targetUserRole === 'admin'}
              />
            </div>

            {/* Admin warning */}
            {targetUserRole === 'admin' && (
              <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
                <div className="flex items-center text-red-400">
                  <AlertCircle size={16} className="mr-2" />
                  <span className="font-medium">Admin Account Protection</span>
                </div>
                <p className="text-sm text-red-300 mt-1">
                  This is an admin account and cannot be banned for security reasons.
                </p>
              </div>
            )}
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
              disabled={isProcessing || targetUserRole === 'admin'}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Applying...
                </>
              ) : (
                <>
                  <Ban size={16} className="mr-2" />
                  Apply Ban
                </>
              )}
            </button>
          </div>
        </SecureForm>
      </div>
    </div>
  );
}
