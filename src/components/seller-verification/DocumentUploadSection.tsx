// src/components/seller-verification/DocumentUploadSection.tsx
'use client';

import React from 'react';
import { Camera, Upload } from 'lucide-react';
import { DocumentUploadFieldProps } from './utils/types';

function DocumentUploadField({ 
  label, 
  value, 
  onFileChange, 
  inputRef, 
  required = false,
  helpText,
  iconComponent
}: DocumentUploadFieldProps) {
  const Icon = iconComponent || Upload;
  
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
          <img src={value} alt={`${label} preview`} className="max-h-full max-w-full object-contain" />
        ) : (
          <>
            {React.createElement(Icon, { className: "w-8 h-8 text-gray-500 mb-2" })}
            <span className="text-xs text-gray-500">Click to upload</span>
          </>
        )}
      </div>
      {helpText && <p className="text-xs text-gray-500 mt-1">{helpText}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
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
              <img src={codePhoto} alt="Code preview" className="max-h-full max-w-full object-contain" />
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
          </div>
          
          <input
            ref={codePhotoRef}
            type="file"
            accept="image/*"
            onChange={onCodePhotoChange}
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
