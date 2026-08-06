/**
 * Create the two review accounts SegPay need to assess the site.
 *
 * Run from the backend directory so the models and .env resolve:
 *   cd /var/www/pantypost/pantypost-backend && node create-segpay-accounts.js
 *
 * Goes through the Mongoose model rather than inserting directly, so
 * the pre-save hook hashes the passwords. A raw insert would produce
 * accounts nobody could log into.
 *
 * Safe to run more than once — existing accounts are updated rather
 * than duplicated.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const ACCOUNTS = [
  {
    username: 'segpaybuyer',
    password: 'segpaybuyer',
    email: 'segpaybuyer@pantypost.com',
    role: 'buyer',
  },
  {
    username: 'segpayseller',
    password: 'segpayseller',
    email: 'segpayseller@pantypost.com',
    role: 'seller',
  },
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected\n');

  for (const spec of ACCOUNTS) {
    let user = await User.findOne({ username: spec.username });

    if (user) {
      console.log(`${spec.username}: exists, updating`);
      // Reassign the password so the pre-save hook re-hashes it, in
      // case it was previously set to something else.
      user.password = spec.password;
    } else {
      console.log(`${spec.username}: creating`);
      user = new User({
        username: spec.username,
        email: spec.email,
        password: spec.password,
        role: spec.role,
      });
    }

    user.role = spec.role;
    user.emailVerified = true;

    // Age assurance. Marked with a distinct method so these accounts
    // can be found and cleared later — they did not pass the real
    // Didit check.
    user.ageVerification = {
      ...(user.ageVerification || {}),
      status: 'approved',
      method: 'segpay_review_account',
      verifiedAt: new Date(),
    };

    // Sellers must be identity-verified to list or upload.
    if (spec.role === 'seller') {
      user.isVerified = true;
      user.verificationStatus = 'verified';
      user.bio = 'Review account for payment processor assessment.';
    }

    await user.save();

    console.log(
      `  role=${user.role}  ageVerified=${user.ageVerification.status}` +
      (spec.role === 'seller' ? `  idVerified=${user.isVerified}` : '')
    );
  }

  console.log('\nDone. Credentials:');
  for (const a of ACCOUNTS) {
    console.log(`  ${a.username} / ${a.password}   (${a.role})`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});