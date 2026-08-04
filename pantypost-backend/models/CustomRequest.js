// pantypost-backend/models/CustomRequest.js
//
// Custom requests previously had no server-side existence at all. The
// client kept them in RequestContext, which persisted to the key
// `panty_custom_requests` — and storage.service.ts lists that key under
// SESSION_ONLY, so it lived in sessionStorage.
//
// That meant a request existed only in the tab of the person who created
// it. The seller received the chat message (Message.type === 'customRequest'),
// but the request *object* carrying status and whose turn it is was never
// shared, so the seller's UI had nothing to render Accept/Decline against,
// and the buyer lost every request when they closed the tab.
//
// This model is the shared source of truth. Note especially `pendingWith`:
// turn-taking is now enforced on the server (see customRequest.routes.js),
// not inferred in the browser, so neither party can act out of turn no
// matter what the client sends.

const mongoose = require('mongoose');

const STATUSES = ['pending', 'accepted', 'rejected', 'edited', 'paid'];

const customRequestSchema = new mongoose.Schema(
  {
    // Client-supplied UUID. Matches Message.meta.id on the chat message
    // that announces the request, which is how the two are linked.
    // Message._id is a String for the same reason.
    _id: {
      type: String,
      required: true
    },

    buyer: {
      type: String,
      required: true,
      ref: 'User',
      index: true
    },
    seller: {
      type: String,
      required: true,
      ref: 'User',
      index: true
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000
    },
    price: {
      type: Number,
      required: true,
      min: 0.01,
      max: 10000
    },
    tags: {
      type: [String],
      default: []
    },

    status: {
      type: String,
      enum: STATUSES,
      default: 'pending',
      index: true
    },

    // Whose turn it is to act. Null once the request is settled
    // (accepted, rejected or paid). The route layer refuses any response
    // from a user who is not the current `pendingWith`.
    pendingWith: {
      type: String,
      default: null
    },

    // Who last submitted a counter-offer, and who last touched the record
    // at all. Kept separate because the UI distinguishes "you countered"
    // from "you accepted".
    lastEditedBy: {
      type: String,
      default: null
    },
    lastModifiedBy: {
      type: String,
      default: null
    },

    // Sorted-usernames key, identical to Message.getThreadId, so a thread
    // can be loaded by the same id in both collections.
    threadId: {
      type: String,
      required: true,
      index: true
    },

    // The chat message that introduced this request.
    originalMessageId: {
      type: String,
      default: null
    },

    response: {
      type: String,
      default: '',
      maxlength: 500
    },

    paid: {
      type: Boolean,
      default: false
    },

    // Set once the buyer pays and an Order is created.
    orderId: {
      type: String,
      default: null
    },

    date: {
      type: Date,
      default: Date.now
    }
  },
  {
    _id: false, // we supply our own
    timestamps: true
  }
);

// The common query is "every request in this conversation, newest first".
customRequestSchema.index({ threadId: 1, date: -1 });
// And "everything awaiting me", for badges and the requests filter.
customRequestSchema.index({ pendingWith: 1, status: 1 });

/** Sorted-usernames thread key. Must stay identical to Message.getThreadId. */
customRequestSchema.statics.getThreadId = function (user1, user2) {
  return [user1, user2].sort().join('-');
};

/** Every request a user is party to. Buyers and sellers both use this. */
customRequestSchema.statics.forUser = function (username) {
  return this.find({
    $or: [{ buyer: username }, { seller: username }]
  }).sort({ date: -1 });
};

/**
 * Whether `username` may currently respond.
 *
 * Settled requests accept no further responses, and only the party named
 * in `pendingWith` may act. This is what stops a buyer accepting their own
 * request — previously the only thing preventing that was a client-side
 * comparison the server never saw.
 */
customRequestSchema.methods.canRespond = function (username) {
  if (this.status === 'accepted' || this.status === 'rejected' || this.status === 'paid') {
    return false;
  }
  return this.pendingWith === username;
};

// Return `id` alongside `_id`, matching the Message model so the client
// can treat both the same way.
customRequestSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    return ret;
  }
});

const CustomRequest = mongoose.model('CustomRequest', customRequestSchema);

module.exports = CustomRequest;
module.exports.STATUSES = STATUSES;
