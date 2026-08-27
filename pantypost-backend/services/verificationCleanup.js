// pantypost-backend/services/verificationCleanup.js
//
// Makes the privacy policy's deletion promise TRUE: raw identity
// document images are deleted VERIFICATION_DOC_RETENTION_DAYS after a
// verification is decided (approved or rejected). The verification
// RECORD -- status, reviewer, timestamps -- is kept as evidence; only
// the stored ID images are removed. Set the env var to 0 to disable
// (e.g. if the payment processor requires longer document retention;
// confirm their KYC evidence rules before changing the window).

const path = require('path');
const fs = require('fs').promises;
const Verification = require('../models/Verification');

const RETENTION_DAYS = parseInt(process.env.VERIFICATION_DOC_RETENTION_DAYS || '30', 10);
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'verification');
const DAY_MS = 24 * 60 * 60 * 1000;

async function deleteDocumentFile(url) {
  if (!url || typeof url !== 'string') return false;
  // Filenames only -- never trust stored paths further than basename.
  const base = path.basename(url);
  if (!base) return false;
  const filePath = path.join(UPLOAD_DIR, base);
  try {
    await fs.unlink(filePath);
    return true;
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('[VerificationCleanup] Failed to delete', base, err.message);
    }
    return false;
  }
}

async function runCleanup() {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * DAY_MS);
  const due = await Verification.find({
    status: { $in: ['approved', 'rejected'] },
    reviewedAt: { $lt: cutoff },
    documentsPurgedAt: { $exists: false }
  }).limit(200);

  let purgedRecords = 0;
  let deletedFiles = 0;
  for (const verification of due) {
    const docs = verification.toObject().documents || {};
    for (const key of Object.keys(docs)) {
      const doc = docs[key];
      if (doc && (await deleteDocumentFile(doc.url))) deletedFiles += 1;
    }
    verification.documentsPurgedAt = new Date();
    await verification.save();
    purgedRecords += 1;
  }
  if (purgedRecords > 0) {
    console.log('[VerificationCleanup] Purged ' + deletedFiles + ' document file(s) across ' + purgedRecords + ' decided verification(s) older than ' + RETENTION_DAYS + ' days.');
  }
}

function startVerificationCleanup() {
  if (!RETENTION_DAYS || RETENTION_DAYS <= 0) {
    console.log('[VerificationCleanup] Disabled (VERIFICATION_DOC_RETENTION_DAYS <= 0).');
    return;
  }
  // First run 60s after boot (DB is connected by then), then daily.
  setTimeout(() => runCleanup().catch((e) => console.error('[VerificationCleanup] Run failed:', e)), 60 * 1000);
  setInterval(() => runCleanup().catch((e) => console.error('[VerificationCleanup] Run failed:', e)), DAY_MS);
  console.log('[VerificationCleanup] Scheduled: raw ID images deleted ' + RETENTION_DAYS + ' days after verification decision.');
}

module.exports = { startVerificationCleanup, runCleanup };
