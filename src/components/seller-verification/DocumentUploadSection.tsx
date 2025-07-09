// src/components/seller-verification/DocumentUploadSection.tsx
'use client';

import React, { useState } from 'react';
import { Camera, Upload, AlertCircle } from 'lucide-react';
import { DocumentUploadFieldProps } from './utils/types';
import { SecureImage } from '@/components/ui/SecureMessageDisplay';
import { securityService } from '@/services/security.service';

function DocumentUploadField({ 
  label, 
  value, 
  onFileChange, 
  inputRef, 
  required = false,
  helpText,
  iconComponent
}: DocumentUploadFieldProps & { onError?: (error: string) => void }) {
  const Icon = iconComponent || Upload;
  const [error, setError] = useState<string>('');
  
  // Handle secure file selection
  const handleSecureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    
    if (!file) return;
    
    // Validate file
    const validation = securityService.validateFileUpload(file, {
      maxSize: 10 * 1024 * 1024, // 10MB for documents
      allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      allowedExtensions: ['jpg', 'jpeg', 'png', 'webp']
    });
    
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      // Clear the input
      if (e.target) e.target.value = '';
      return;
    }
    
    // If valid, proceed with the original handler
    onFileChange(e);
  };
  
  return (
    <div>
      <label className="text-sm text-gray-400 block mb-2">
        {label}{required && ':'}
      </label>
      <div
        onClick={() => inputRef.current?.click()}
        className="relative border-2 border-dashed border-gray-700 hover:border-[#ff950e] rounded-lg p-4 cursor-pointer flex flex-col items-center justify-center transition h-40"
      >
        {value ? (
          <SecureImage 
            src={value} 
            alt={`${label} preview`} 
            className="max-h-full max-w-full object-contain" 
          />
        ) : (
          <>
            {React.createElement(Icon, { className: "w-8 h-8 text-gray-500 mb-2" })}
            <span className="text-xs text-gray-500">Click to upload</span>
          </>
        )}
      </div>
      {helpText && <p className="text-xs text-gray-500 mt-1">{helpText}</p>}
      {error && (
        <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleSecureFileChange}
        className="hidden"
      />
    </div>
  );
}

interface DocumentUploadSectionProps {
  codePhoto: string | null;
  idFront: string | null;
  idBack: string | null;
  passport: string | null;
  onCodePhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onIdFrontChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onIdBackChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPassportChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  codePhotoRef: React.RefObject<HTMLInputElement | null>;
  idFrontRef: React.RefObject<HTMLInputElement | null>;
  idBackRef: React.RefObject<HTMLInputElement | null>;
  passportRef: React.RefObject<HTMLInputElement | null>;
}

export default function DocumentUploadSection({
  codePhoto,
  idFront,
  idBack,
  passport,
  onCodePhotoChange,
  onIdFrontChange,
  onIdBackChange,
  onPassportChange,
  codePhotoRef,
  idFrontRef,
  idBackRef,
  passportRef
}: DocumentUploadSectionProps) {
  const [codePhotoError, setCodePhotoError] = useState<string>('');

  // Handle secure code photo upload
  const handleSecureCodePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCodePhotoError('');
    const file = e.target.files?.[0];
    
    if (!file) return;
    
    // Validate file
    const validation = securityService.validateFileUpload(file, {
      maxSize: 10 * 1024 * 1024, // 10MB for documents
      allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      allowedExtensions: ['jpg', 'jpeg', 'png', 'webp']
    });
    
    if (!validation.valid) {
      setCodePhotoError(validation.error || 'Invalid file');
      // Clear the input
      if (e.target) e.target.value = '';
      return;
    }
    
    // If valid, proceed with the original handler
    onCodePhotoChange(e);
  };

  return (
    <div className="space-y-4">
      {/* Photo with code */}
      <div>
        <label className="text-sm text-gray-400 block mb-2">
          Photo with verification code (required):
        </label>
        <div className="flex items-center gap-3">
          <div
            onClick={() => codePhotoRef.current?.click()}
            className="relative border-2 border-dashed border-gray-700 hover:border-[#ff950e] rounded-lg p-4 cursor-pointer flex flex-col items-center justify-center transition"
            style={{ height: "120px", width: "120px" }}
          >
            {codePhoto ? (
              <SecureImage 
                src={codePhoto} 
                alt="Code preview" 
                className="max-h-full max-w-full object-contain" 
              />
            ) : (
              <>
                <Camera className="w-8 h-8 text-gray-500 mb-2" />
                <span className="text-xs text-gray-500">Click to upload</span>
              </>
            )}
          </div>
          
          <div className="flex-1">
            <p className="text-sm text-gray-300 mb-2">
              Take a clear photo holding the code above next to your face
            </p>
            <p className="text-xs text-gray-500">
              Make sure your face and the code are clearly visible
            </p>
            {codePhotoError && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {codePhotoError}
              </p>
            )}
          </div>
          
          <input
            ref={codePhotoRef}
            type="file"
            accept="image/*"
            onChange={handleSecureCodePhotoChange}
            className="hidden"
          />
        </div>
      </div>
      
      {/* ID Documents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <DocumentUploadField
          label="ID Front (driver's license/ID card)"
          value={idFront}
          onFileChange={onIdFrontChange}
          inputRef={idFrontRef}
        />
        
        <DocumentUploadField
          label="ID Back (if using driver's license)"
          value={idBack}
          onFileChange={onIdBackChange}
          inputRef={idBackRef}
        />
        
        <div className="sm:col-span-2">
          <DocumentUploadField
            label="Passport (instead of driver's license)"
            value={passport}
            onFileChange={onPassportChange}
            inputRef={passportRef}
          />
        </div>
      </div>
    </div>
  );
}
