'use client';

import { useEffect, useState } from 'react';
import { useListings, VerificationStatus, VerificationDocs, User } from '@/context/ListingContext';
import RequireAuth from '@/components/RequireAuth';

export default function AdminVerificationRequestsPage() {
  const { users, setVerificationStatus } = useListings();
  const [pending, setPending] = useState<User[]>([]);
  const [selected, setSelected] = useState<User | null>(null);

  useEffect(() => {
    // Get all users with verificationStatus === 'pending'
    const pendingUsers = Object.values(users).filter(
      (u) => u.verificationStatus === 'pending'
    );
    setPending(pendingUsers);
    setSelected(null);
  }, [users]);

  const handleApprove = (username: string) => {
    setVerificationStatus(username, 'verified');
    setSelected(null);
  };

  const handleReject = (username: string, reason: string) => {
    setVerificationStatus(username, 'rejected', reason);
    setSelected(null);
  };

  return (
    <RequireAuth role="admin">
      <main className="max-w-3xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Seller Verification Requests</h1>
        {pending.length === 0 ? (
          <p className="text-gray-500">No pending verification requests.</p>
        ) : (
          <ul className="space-y-6">
            {pending.map((user) => (
              <li key={user.username} className="bg-white border rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-lg">{user.username}</span>
                    <span className="ml-2 text-xs text-gray-500">
                      Requested: {user.verificationRequestedAt ? new Date(user.verificationRequestedAt).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <button
                    className="text-primary underline"
                    onClick={() => setSelected(user)}
                  >
                    Review
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Modal for reviewing a request */}
        {selected && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-black text-2xl"
                onClick={() => setSelected(null)}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-2xl font-bold mb-4">Review: {selected.username}</h2>
              <div className="mb-4">
                <div className="mb-2">
                  <span className="font-semibold">Unique Code:</span>
                  <span className="ml-2 px-2 py-1 bg-[#222] text-[#ff950e] rounded font-mono text-lg">
                    {selected.verificationDocs?.code}
                  </span>
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Photo with code:</span>
                  {selected.verificationDocs?.codePhoto ? (
                    <img
                      src={selected.verificationDocs.codePhoto}
                      alt="Code Photo"
                      className="mt-2 w-40 rounded shadow border"
                    />
                  ) : (
                    <span className="ml-2 text-gray-500">Not provided</span>
                  )}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Front of license:</span>
                  {selected.verificationDocs?.idFront ? (
                    <img
                      src={selected.verificationDocs.idFront}
                      alt="ID Front"
                      className="mt-2 w-40 rounded shadow border"
                    />
                  ) : (
                    <span className="ml-2 text-gray-500">Not provided</span>
                  )}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Back of license:</span>
                  {selected.verificationDocs?.idBack ? (
                    <img
                      src={selected.verificationDocs.idBack}
                      alt="ID Back"
                      className="mt-2 w-40 rounded shadow border"
                    />
                  ) : (
                    <span className="ml-2 text-gray-500">Not provided</span>
                  )}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Passport:</span>
                  {selected.verificationDocs?.passport ? (
                    <img
                      src={selected.verificationDocs.passport}
                      alt="Passport"
                      className="mt-2 w-40 rounded shadow border"
                    />
                  ) : (
                    <span className="ml-2 text-gray-500">Not provided</span>
                  )}
                </div>
              </div>
              <div className="flex gap-4 mt-6 items-start">
                <button
                  className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded"
                  onClick={() => handleApprove(selected.username)}
                >
                  Approve
                </button>
                <RejectButton username={selected.username} onReject={handleReject} />
              </div>
            </div>
          </div>
        )}
      </main>
    </RequireAuth>
  );
}

// Improved reject button with reason input and better UX
function RejectButton({
  username,
  onReject,
}: {
  username: string;
  onReject: (username: string, reason: string) => void;
}) {
  const [showInput, setShowInput] = useState(false);
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (reason.trim()) {
      onReject(username, reason.trim());
      setShowInput(false);
      setReason('');
    }
  };

  return (
    <div>
      {!showInput ? (
        <button
          className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded"
          onClick={() => setShowInput(true)}
        >
          Reject
        </button>
      ) : (
        <div className="flex flex-col gap-2 mt-2">
          <input
            type="text"
            className="border rounded px-2 py-1"
            placeholder="Reason for rejection"
            value={reason}
            onChange={e => setReason(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded"
              onClick={handleConfirm}
              disabled={!reason.trim()}
            >
              Confirm Reject
            </button>
            <button
              className="bg-gray-300 hover:bg-gray-400 text-black font-bold px-4 py-2 rounded"
              onClick={() => {
                setShowInput(false);
                setReason('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
