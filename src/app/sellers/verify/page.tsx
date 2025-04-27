'use client';

import { useState, useEffect } from 'react';
import { useListings, VerificationDocs } from '@/context/ListingContext';
import { useRouter } from 'next/navigation';

export default function SellerVerifyPage() {
  const { user, requestVerification, users } = useListings();
  const router = useRouter();

  const [code, setCode] = useState('');
  const [codePhoto, setCodePhoto] = useState<string | null>(null);
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);
  const [passport, setPassport] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Generate or load unique code for this seller
  useEffect(() => {
    if (!user) return;
    const existing = users[user.username]?.verificationDocs?.code;
    if (existing) {
      setCode(existing);
    } else {
      const newCode = `VERIF-${user.username}-${Math.floor(100000 + Math.random() * 900000)}`;
      setCode(newCode);
    }
  }, [user, users]);

  // Helper to convert file to base64
  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await toBase64(file);
      setter(base64);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codePhoto || (!idFront && !passport)) {
      alert('Please upload all required documents.');
      return;
    }
    setSubmitting(true);

    const docs: VerificationDocs = {
      code,
      codePhoto,
      idFront: idFront || undefined,
      idBack: idBack || undefined,
      passport: passport || undefined,
    };

    requestVerification(docs);
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => router.push('/sellers/profile'), 2000);
  };

  if (!user) {
    return (
      <main className="max-w-lg mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Seller Verification</h1>
        <p>You must be logged in as a seller to access this page.</p>
      </main>
    );
  }

  // If rejected, show rejection reason and allow re-upload
  if (user.verificationStatus === 'rejected') {
    return (
      <main className="max-w-lg mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Seller Verification</h1>
        <div className="mb-4">
          <p className="text-red-500 font-semibold mb-2">Rejected</p>
          {user.verificationRejectionReason && (
            <p className="text-sm text-gray-700 mb-4">
              <span className="font-semibold">Admin message:</span> {user.verificationRejectionReason}
            </p>
          )}
          <p className="mb-2">Please re-upload your documents and resubmit for verification.</p>
        </div>
        <VerificationForm
          code={code}
          codePhoto={codePhoto}
          setCodePhoto={setCodePhoto}
          idFront={idFront}
          setIdFront={setIdFront}
          idBack={idBack}
          setIdBack={setIdBack}
          passport={passport}
          setPassport={setPassport}
          submitting={submitting}
          submitted={submitted}
          handleFileChange={handleFileChange}
          handleSubmit={handleSubmit}
        />
      </main>
    );
  }

  if (user.verificationStatus === 'pending') {
    return (
      <main className="max-w-lg mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Seller Verification</h1>
        <p className="text-yellow-400 font-semibold">Your verification is pending review by admin.</p>
      </main>
    );
  }

  if (user.verificationStatus === 'verified') {
    return (
      <main className="max-w-lg mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Seller Verification</h1>
        <p className="text-green-500 font-semibold">You are a verified seller!</p>
      </main>
    );
  }

  // Default: unverified or first time
  return (
    <main className="max-w-lg mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Seller Verification</h1>
      <VerificationForm
        code={code}
        codePhoto={codePhoto}
        setCodePhoto={setCodePhoto}
        idFront={idFront}
        setIdFront={setIdFront}
        idBack={idBack}
        setIdBack={setIdBack}
        passport={passport}
        setPassport={setPassport}
        submitting={submitting}
        submitted={submitted}
        handleFileChange={handleFileChange}
        handleSubmit={handleSubmit}
      />
    </main>
  );
}

// --- Extracted VerificationForm for reuse ---
function VerificationForm({
  code,
  codePhoto,
  setCodePhoto,
  idFront,
  setIdFront,
  idBack,
  setIdBack,
  passport,
  setPassport,
  submitting,
  submitted,
  handleFileChange,
  handleSubmit,
}: {
  code: string;
  codePhoto: string | null;
  setCodePhoto: (v: string) => void;
  idFront: string | null;
  setIdFront: (v: string) => void;
  idBack: string | null;
  setIdBack: (v: string) => void;
  passport: string | null;
  setPassport: (v: string) => void;
  submitting: boolean;
  submitted: boolean;
  handleFileChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => void;
  handleSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <>
      <p className="mb-4">
        To become a <span className="text-primary font-bold">Verified Seller</span>, please follow the steps below:
      </p>
      <ol className="list-decimal list-inside mb-6 space-y-2">
        <li>
          <span className="font-semibold">Write this code on a piece of paper:</span>
          <span className="ml-2 px-2 py-1 bg-[#222] text-[#ff950e] rounded font-mono text-lg">{code}</span>
        </li>
        <li>
          <span className="font-semibold">Take a clear photo of yourself holding the code next to your face.</span>
        </li>
        <li>
          <span className="font-semibold">Upload a photo of the front of your driver’s license (or passport).</span>
        </li>
        <li>
          <span className="font-semibold">Upload a photo of the back of your license (if using license).</span>
        </li>
        <li>
          <span className="font-semibold">Or, upload a photo of your passport (if not using license).</span>
        </li>
      </ol>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold mb-1">Photo with code (required):</label>
          <input
            type="file"
            accept="image/*"
            required
            onChange={e => handleFileChange(e, setCodePhoto)}
          />
          {codePhoto && <img src={codePhoto} alt="Code Photo" className="mt-2 w-32 rounded shadow" />}
        </div>
        <div>
          <label className="block font-semibold mb-1">Front of license (or passport):</label>
          <input
            type="file"
            accept="image/*"
            onChange={e => handleFileChange(e, setIdFront)}
          />
          {idFront && <img src={idFront} alt="ID Front" className="mt-2 w-32 rounded shadow" />}
        </div>
        <div>
          <label className="block font-semibold mb-1">Back of license (optional):</label>
          <input
            type="file"
            accept="image/*"
            onChange={e => handleFileChange(e, setIdBack)}
          />
          {idBack && <img src={idBack} alt="ID Back" className="mt-2 w-32 rounded shadow" />}
        </div>
        <div>
          <label className="block font-semibold mb-1">Passport (optional):</label>
          <input
            type="file"
            accept="image/*"
            onChange={e => handleFileChange(e, setPassport)}
          />
          {passport && <img src={passport} alt="Passport" className="mt-2 w-32 rounded shadow" />}
        </div>
        <button
          type="submit"
          className="w-full bg-[#ff950e] text-black font-bold py-2 rounded mt-4 hover:bg-[#ffb347] transition"
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit for Verification'}
        </button>
        {submitted && (
          <p className="text-green-500 mt-2 text-center">Submitted! Redirecting...</p>
        )}
      </form>
    </>
  );
}
