// pantypost-backend/scripts/clear-dead-placeholder-avatars.js
//
// One-off cleanup. `User.profilePic` used to default to
// `https://via.placeholder.com/150`, and that service is retired — it no
// longer resolves, so every account that never uploaded a picture holds a
// URL that renders as a broken image. That is what buyers looked like in
// chat.
//
// The default is now null and the client treats any via.placeholder.com
// URL as absent, so this script is belt-and-braces: it clears the stored
// value so the data matches the new behaviour.
//
// Run once on the VPS, from the backend directory:
//
//     node scripts/clear-dead-placeholder-avatars.js           # dry run
//     node scripts/clear-dead-placeholder-avatars.js --apply   # write
//
// Safe to run more than once.

require('dotenv').config();
const mongoose = require('mongoose');

// Reuse the app's own connector rather than re-reading MONGODB_URI here.
// config/database.js falls back to a local database when the variable is
// unset, so duplicating the logic risks this script either refusing to run
// where the app happily connects, or — worse — cleaning a different
// database than the one the site is using.
const connectDB = require('../config/database');

const DEAD_HOST = 'via.placeholder.com';
const APPLY = process.argv.includes('--apply');

async function main() {
  await connectDB();
  console.log(`Database: ${mongoose.connection.name}\n`);

  const User = require('../models/User');
  const Listing = require('../models/Listing');

  const userFilter = { profilePic: { $regex: DEAD_HOST } };
  const affectedUsers = await User.countDocuments(userFilter);

  // Listings got the same treatment: listing.routes.js fell back to
  // `https://via.placeholder.com/300` when a listing had no images.
  const listingFilter = { imageUrls: { $elemMatch: { $regex: DEAD_HOST } } };
  const affectedListings = await Listing.countDocuments(listingFilter);

  console.log(`Users with a dead profilePic : ${affectedUsers}`);
  console.log(`Listings with a dead image   : ${affectedListings}\n`);

  if (!APPLY) {
    const sample = await User.find(userFilter).select('username profilePic').limit(10).lean();
    if (sample.length) {
      console.log('Sample of affected users:');
      sample.forEach((u) => console.log(`  ${u.username} -> ${u.profilePic}`));
      console.log('');
    }
    console.log('Dry run. Re-run with --apply to write the changes.');
    await mongoose.disconnect();
    return;
  }

  // Clear the picture. Also clear the mirrored copies under `settings`,
  // which several read paths fall back to.
  const userResult = await User.updateMany(userFilter, {
    $set: {
      profilePic: null,
      'settings.profilePic': null,
      'settings.profilePicture': null
    }
  });
  console.log(`Users updated    : ${userResult.modifiedCount}`);

  // Strip just the dead entries, leaving any real images in place.
  const listings = await Listing.find(listingFilter).select('_id imageUrls').lean();
  let listingsUpdated = 0;
  for (const listing of listings) {
    const kept = (listing.imageUrls || []).filter((url) => !String(url).includes(DEAD_HOST));
    await Listing.updateOne({ _id: listing._id }, { $set: { imageUrls: kept } });
    listingsUpdated += 1;
  }
  console.log(`Listings updated : ${listingsUpdated}`);

  await mongoose.disconnect();
  console.log('\nDone.');
}

main().catch(async (error) => {
  console.error('Cleanup failed:', error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
