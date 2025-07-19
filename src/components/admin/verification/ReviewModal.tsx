// src/components/admin/verification/ReviewModal.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { sanitizeStrict } from '@/utils/security/sanitization';
import DocumentCard from './DocumentCard';
import ActionButtons from './ActionButtons';
import type { ReviewModalProps, ImageViewData } from '@/types/verification';
import ImageViewer from './ImageViewer';

export default function ReviewModal({
    user,
    onClose,
    onApprove,
    onReject,
    getTimeAgo
}: ReviewModalProps) {
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [currentImageView, setCurrentImageView] = useState<ImageViewData | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!user) {
            setShowRejectInput(false);
            setRejectReason('');
        }
    }, [user]);

    if (!user) return null;

    const openFullImage = (type: string, url: string) => {
        setCurrentImageView({ type, url });
    };

    const handleApprove = () => {
        onApprove(user.username);
    };

    const handleReject = () => {
        // Sanitize reject reason before sending
        const sanitizedReason = sanitizeStrict(rejectReason);
        onReject(user.username, sanitizedReason);
    };

    const handleClose = () => {
        setShowRejectInput(false);
        setRejectReason('');
        onClose();
    };

    const handleRejectReasonChange = (value: string) => {
        // Sanitize reject reason input
        const sanitizedValue = sanitizeStrict(value);
        setRejectReason(sanitizedValue);
    };

    return (
        <>
            {/* Review Modal Overlay */}
            <div className="fixed inset-0 bg-black bg-opacity-60 z-40" onClick={handleClose} />

            {/* Review Modal Content */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                <div 
                    ref={modalRef}
                    className="bg-[#121212] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-[#222] flex flex-col"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#1a1a1a] to-[#222] p-4 sm:p-6 rounded-t-2xl sticky top-0 z-10">
                        <button
                            onClick={handleClose}
                            className="absolute left-4 top-4 text-gray-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white">
                                Review: {user.username}
                            </h2>
                            <p className="text-sm text-gray-400 mt-1">
                                Requested {getTimeAgo(user.verificationRequestedAt)}
                            </p>
                        </div>
                    </div>

                    {/* Documents Section */}
                    <div className="p-4 sm:p-6 flex-grow">
                        {/* Verification code */}
                        <div className="mb-6">
                            <h3 className="text-sm uppercase text-gray-400 font-medium mb-2 tracking-wider">
                                Verification Code
                            </h3>
                            <div className="inline-block px-4 py-2 bg-[#ff950e] text-black font-mono text-lg border border-[#ff950e] rounded-lg font-bold">
                                {user.verificationDocs?.code || 'No code provided'}
                            </div>
                        </div>

                        {/* Document grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <DocumentCard
                                title="Photo with Code"
                                imageSrc={user.verificationDocs?.codePhoto}
                                onViewFull={() => user.verificationDocs?.codePhoto && openFullImage('Photo with Verification Code', user.verificationDocs.codePhoto)}
                            />

                            <DocumentCard
                                title="ID Front"
                                imageSrc={user.verificationDocs?.idFront}
                                onViewFull={() => user.verificationDocs?.idFront && openFullImage('ID Front', user.verificationDocs.idFront)}
                            />

                            <DocumentCard
                                title="ID Back"
                                imageSrc={user.verificationDocs?.idBack}
                                onViewFull={() => user.verificationDocs?.idBack && openFullImage('ID Back', user.verificationDocs.idBack)}
                            />

                            <DocumentCard
                                title="Passport"
                                imageSrc={user.verificationDocs?.passport}
                                onViewFull={() => user.verificationDocs?.passport && openFullImage('Passport', user.verificationDocs.passport)}
                            />
                        </div>
                    </div>

                    {/* Fixed Action Buttons at Bottom */}
                    <div className="bg-[#080808] border-t border-[#1a1a1a] p-3 sm:p-4 mt-auto sticky bottom-0">
                        <ActionButtons
                            showRejectInput={showRejectInput}
                            rejectReason={rejectReason}
                            onApprove={handleApprove}
                            onReject={handleReject}
                            onRejectInputShow={() => setShowRejectInput(true)}
                            onRejectInputCancel={() => {
                                setShowRejectInput(false);
                                setRejectReason('');
                            }}
                            onRejectReasonChange={handleRejectReasonChange}
                        />
                    </div>
                </div>
            </div>

            {/* Full Image Viewer */}
            {currentImageView && (
                <ImageViewer
                    imageData={currentImageView}
                    isLoading={false}
                    onClose={() => setCurrentImageView(null)}
                    onLoad={() => { }}
                />
            )}
        </>
    );
}
