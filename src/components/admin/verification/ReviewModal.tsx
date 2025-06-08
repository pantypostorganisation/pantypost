// src/components/admin/verification/ReviewModal.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
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
        onReject(user.username, rejectReason);
    };

    const handleClose = () => {
        setShowRejectInput(false);
        setRejectReason('');
        onClose();
    };

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
                <div
                    ref={modalRef}
                    className="bg-[#0e0e0e] rounded-none sm:rounded-xl shadow-2xl border border-[#2a2a2a] w-full sm:max-w-5xl h-full sm:h-auto sm:max-h-[90vh] mx-auto flex flex-col overflow-hidden"
                >
                    {/* Modal Header */}
                    <div className="bg-[#080808] border-b border-[#1a1a1a] p-3 sm:p-4 flex items-center sticky top-0 z-10">
                        <button
                            onClick={handleClose}
                            className="p-2 rounded-full hover:bg-[#1a1a1a] text-gray-400 mr-2 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h2 className="text-lg font-bold text-white flex items-center">
                                <span className="mr-1.5">Review:</span>
                                <span className="text-[#ff950e]">{user.username}</span>
                            </h2>
                            <p className="text-xs text-gray-400">
                                Requested {getTimeAgo(user.verificationRequestedAt)}
                            </p>
                        </div>
                    </div>

                    {/* Scrollable Content Area */}
                    <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
                        {/* Verification Code */}
                        <div className="mb-6">
                            <h3 className="text-sm uppercase text-gray-400 font-medium mb-2 tracking-wider">
                                Verification Code
                            </h3>
                            <div className="inline-block px-4 py-1.5 bg-[#ff950e] bg-opacity-10 text-[#ff950e] font-mono text-lg border border-[#ff950e] border-opacity-20 rounded-full">
                                {user.verificationDocs?.code || 'No code provided'}
                            </div>
                        </div>

                        {/* Document grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <DocumentCard
                                title="Photo with Code"
                                imageSrc={user.verificationDocs?.codePhoto}
                                onViewFull={() => openFullImage('Photo with Verification Code', user.verificationDocs?.codePhoto || '')}
                            />

                            <DocumentCard
                                title="ID Front"
                                imageSrc={user.verificationDocs?.idFront}
                                onViewFull={() => openFullImage('ID Front', user.verificationDocs?.idFront || '')}
                            />

                            <DocumentCard
                                title="ID Back"
                                imageSrc={user.verificationDocs?.idBack}
                                onViewFull={() => openFullImage('ID Back', user.verificationDocs?.idBack || '')}
                            />

                            <DocumentCard
                                title="Passport"
                                imageSrc={user.verificationDocs?.passport}
                                onViewFull={() => openFullImage('Passport', user.verificationDocs?.passport || '')}
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
                            onRejectReasonChange={setRejectReason}
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