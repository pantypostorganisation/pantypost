// pantypost-backend/routes/message.routes.js
const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth.middleware');
const webSocketService = require('../config/websocket');
const { v4: uuidv4 } = require('uuid');

/* New-account messaging limits. Tunable from the environment so these
   can be loosened or tightened without a deploy. */
const NEW_ACCOUNT_WINDOW_HOURS = Number(process.env.NEW_ACCOUNT_WINDOW_HOURS || 24);
const NEW_ACCOUNT_THREAD_LIMIT = Number(process.env.NEW_ACCOUNT_THREAD_LIMIT || 2);

/* How many conversations this user has STARTED -- threads whose
   earliest message is theirs. Replies to someone else's opening
   message are not counted, which is what keeps the limit off anyone
   who is simply answering their inbox.

   Bounded by `since` (the signup time) as well as by username. The
   account is younger than the window whenever this runs, so every
   message it could possibly have is inside that bound -- the date
   clause changes no result and keeps the scan off the full message
   collection. */
async function countThreadsStarted(username, since) {
  const match = { $or: [{ sender: username }, { receiver: username }] };
  if (since) match.createdAt = { $gte: since };

  const rows = await Message.aggregate([
    { $match: match },
    { $sort: { createdAt: 1 } },
    { $group: { _id: '$threadId', firstSender: { $first: '$sender' } } },
    { $match: { firstSender: username } },
    { $count: 'started' },
  ]);

  return rows.length ? rows[0].started : 0;
}

// Get user status endpoint
router.get('/user-status/:username', authMiddleware, async (req, res) => {
  try {
    const { username } = req.params;
    
    // Get user from database
    const user = await User.findOne({ username }).select('isOnline lastActive');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        username,
        isOnline: user.isOnline || false,
        lastActive: user.lastActive
      }
    });
  } catch (error) {
    console.error('Get user status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all threads for a user - ENHANCED WITH PROFILE DATA
router.get('/threads', authMiddleware, async (req, res) => {
  try {
    // SECURITY (IDOR): only admins may read another user's threads
    const requested = req.query.username;
    if (requested && requested !== req.user.username && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You can only view your own message threads'
      });
    }
    const username = requested || req.user.username;
    console.log('[THREADS] Getting threads for user:', username);
    
    // Get all messages where user is sender or receiver
    const messages = await Message.find({
      $or: [
        { sender: username },
        { receiver: username }
      ]
    }).sort({ createdAt: 1 });
    
    console.log('[THREADS] Found messages:', messages.length);
    
    // Group messages by thread
    const threadsMap = {};
    const participantSet = new Set();
    
    messages.forEach(msg => {
      const threadId = msg.threadId;
      
      if (!threadsMap[threadId]) {
        const participants = threadId.split('-');
        threadsMap[threadId] = {
          id: threadId,
          participants: participants,
          messages: [],
          lastMessage: null,
          unreadCount: 0,
          updatedAt: msg.createdAt
        };
        
        // Track all participants to fetch their profiles
        participants.forEach(p => {
          if (p !== username) participantSet.add(p);
        });
      }
      
      // Add message to thread
      threadsMap[threadId].messages.push({
        id: msg._id.toString(),
        sender: msg.sender,
        receiver: msg.receiver,
        content: msg.content,
        date: msg.createdAt,
        isRead: msg.isRead,
        read: msg.isRead,
        type: msg.type,
        meta: msg.meta,
        threadId: msg.threadId
      });
      
      // Update last message
      threadsMap[threadId].lastMessage = {
        id: msg._id.toString(),
        sender: msg.sender,
        receiver: msg.receiver,
        content: msg.content,
        date: msg.createdAt,
        isRead: msg.isRead,
        read: msg.isRead,
        type: msg.type,
        meta: msg.meta,
        threadId: msg.threadId
      };
      
      // Update timestamp
      threadsMap[threadId].updatedAt = msg.createdAt;
      
      // Count unread messages
      if (msg.receiver === username && !msg.isRead) {
        threadsMap[threadId].unreadCount++;
      }
    });
    
    // FETCH PROFILES FOR ALL PARTICIPANTS - FIXED
    const participantProfiles = {};
    if (participantSet.size > 0) {
      console.log('[THREADS] Fetching profiles for participants:', Array.from(participantSet));
      
      const users = await User.find(
        { username: { $in: Array.from(participantSet) } },
        'username profilePic isVerified verificationStatus bio tier subscriberCount'
      );
      
      console.log('[THREADS] Found users:', users.length);
      
      users.forEach(user => {
        // Build the full URL for profilePic if it exists
        let fullProfilePicUrl = user.profilePic;
        
        if (user.profilePic) {
          // If it's already a full URL, keep it
          if (user.profilePic.startsWith('http://') || user.profilePic.startsWith('https://')) {
            fullProfilePicUrl = user.profilePic;
          }
          // If it starts with /uploads/, prepend the base URL
          else if (user.profilePic.startsWith('/uploads/')) {
            // Use the environment variable if available, otherwise use production URL
            const baseUrl = process.env.API_BASE_URL || 'https://api.pantypost.com';
            fullProfilePicUrl = `${baseUrl}${user.profilePic}`;
          }
          // If it's a relative path without leading slash
          else if (!user.profilePic.startsWith('/')) {
            const baseUrl = process.env.API_BASE_URL || 'https://api.pantypost.com';
            fullProfilePicUrl = `${baseUrl}/uploads/${user.profilePic}`;
          }
        }
        
        console.log(`[THREADS] User ${user.username} - Original pic: ${user.profilePic}, Full URL: ${fullProfilePicUrl}`);
        
        participantProfiles[user.username] = {
          username: user.username,
          profilePic: fullProfilePicUrl,
          isVerified: user.isVerified || user.verificationStatus === 'verified' || false,
          bio: user.bio || '',
          tier: user.tier || 'Tease',
          subscriberCount: user.subscriberCount || 0
        };
      });
      
      console.log('[THREADS] Final profiles object:', JSON.stringify(participantProfiles, null, 2));
    }
    
    // Convert to array and sort by last message date
    const threads = Object.values(threadsMap).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    
    console.log('[THREADS] Returning threads:', threads.length, 'with profiles for:', Object.keys(participantProfiles));
    
    // Return with profiles at the root level
    res.json({
      success: true,
      data: threads,
      profiles: participantProfiles
    });
  } catch (error) {
    console.error('Get threads error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get messages for a specific thread - ENHANCED WITH PROFILES
router.get('/threads/:threadId', authMiddleware, async (req, res) => {
  try {
    const { threadId } = req.params;
    const username = req.user.username;
    
    // Verify user is part of this thread
    const [user1, user2] = threadId.split('-');
    if (username !== user1 && username !== user2) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this thread'
      });
    }
    
    const messages = await Message.find({ threadId })
      .sort({ createdAt: 1 })
      .limit(100);
    
    // Format messages properly
    const formattedMessages = messages.map(msg => ({
      id: msg._id.toString(),
      sender: msg.sender,
      receiver: msg.receiver,
      content: msg.content,
      date: msg.createdAt,
      isRead: msg.isRead,
      read: msg.isRead,
      type: msg.type,
      meta: msg.meta,
      threadId: msg.threadId
    }));
    
    // Get profiles for the other participant - FIXED
    const otherUsername = user1 === username ? user2 : user1;
    const otherUser = await User.findOne(
      { username: otherUsername },
      'username profilePic isVerified verificationStatus bio tier subscriberCount'
    );
    
    const profiles = {};
    if (otherUser) {
      // Build the full URL for profilePic if it exists
      let fullProfilePicUrl = otherUser.profilePic;
      
      if (otherUser.profilePic) {
        if (otherUser.profilePic.startsWith('http://') || otherUser.profilePic.startsWith('https://')) {
          fullProfilePicUrl = otherUser.profilePic;
        } else if (otherUser.profilePic.startsWith('/uploads/')) {
          const baseUrl = process.env.API_BASE_URL || 'https://api.pantypost.com';
          fullProfilePicUrl = `${baseUrl}${otherUser.profilePic}`;
        } else if (!otherUser.profilePic.startsWith('/')) {
          const baseUrl = process.env.API_BASE_URL || 'https://api.pantypost.com';
          fullProfilePicUrl = `${baseUrl}/uploads/${otherUser.profilePic}`;
        }
      }
      
      profiles[otherUser.username] = {
        username: otherUser.username,
        profilePic: fullProfilePicUrl,
        isVerified: otherUser.isVerified || otherUser.verificationStatus === 'verified' || false,
        bio: otherUser.bio || '',
        tier: otherUser.tier || 'Tease',
        subscriberCount: otherUser.subscriberCount || 0
      };
    }
    
    res.json({
      success: true,
      data: formattedMessages,
      profiles
    });
  } catch (error) {
    console.error('Get thread messages error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send a message
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { receiver, content, type = 'normal', meta } = req.body;
    const sender = req.user.username;
    
    // Validate input
    const hasImage = type === 'image' || (meta && meta.imageUrl);

    if (!receiver || (!content && !hasImage)) {
      return res.status(400).json({
        success: false,
        error: 'Receiver and content are required'
      });
    }
    
    /* Muted senders.
       Checked before anything is written, and the reason is returned
       so the person knows what happened and when it lifts -- a silent
       failure would read as the site being broken and generate a
       support message instead of a behaviour change. */
    try {
      const senderUser = await User.findOne({ username: sender })
        .select('messagingRestrictedUntil messagingRestrictionReason')
        .lean();

      const until = senderUser?.messagingRestrictedUntil
        ? new Date(senderUser.messagingRestrictedUntil)
        : null;

      if (until && until.getTime() > Date.now()) {
        const permanent = until.getFullYear() > 2100;
        return res.status(403).json({
          success: false,
          error: permanent
            ? 'Your messaging has been restricted. Contact support if you think this is a mistake.'
            : `Your messaging is restricted until ${until.toLocaleString()}.`,
          meta: {
            messagingRestricted: true,
            until: until.toISOString(),
            reason: senderUser.messagingRestrictionReason || ''
          }
        });
      }
    } catch (restrictionError) {
      /* Never block a message because the check itself failed -- a
         database hiccup should not silence the platform. */
      console.error('[Messages] Restriction check failed:', restrictionError.message);
    }

    /* Payment details do not send.
     *
     * Unlike a Telegram mention -- which a seller might reasonably
     * decline in writing -- there is no innocent version of posting a
     * wallet address or a cashtag here. Both sides have a wallet on
     * the platform; an off-platform payment exists to avoid the thing
     * protecting them.
     *
     * It protects the SELLER more than us. A buyer who takes the
     * conversation off-site has her address and her goods, and nothing
     * holding him to the payment. The platform was the only guarantee
     * and she just gave it up.
     *
     * Blocked attempts are still reported, so a pattern of them is
     * visible rather than silently absorbed. */
    if (content) {
      try {
        const { detectPaymentSolicitation } = require('../utils/offPlatformDetection');
        const payment = detectPaymentSolicitation(content);

        if (payment.block) {
          try {
            const Report = require('../models/Report');
            await Report.create({
              reportedUser: sender,
              reportedBy: 'system',
              reportType: 'scam',
              severity: 'high',
              category: 'off_platform',
              description:
                `Blocked: attempted off-platform payment (${payment.reasons.join(', ')}).\n\n` +
                `[${new Date().toISOString()}] to ${receiver}: ${String(content).slice(0, 300)}`,
              status: 'pending',
              metadata: { autoFlag: 'payment_blocked', reasons: payment.reasons }
            });

            if (global.webSocketService) {
              global.webSocketService.emitApprovalQueueChanged?.();
            }
          } catch (reportError) {
            console.error('[Moderation] Payment block report failed:', reportError.message);
          }

          console.log(
            `[Moderation] BLOCKED payment message: ${sender} -> ${receiver} (${payment.reasons.join(', ')})`
          );

          /* Says why. A message that silently fails to send reads as a
             broken site and gets tried again; one that explains itself
             changes what the person does next. */
          return res.status(403).json({
            success: false,
            error:
              'That message was not sent. Payment details cannot be shared here — ' +
              'pay and get paid through your PantyPost wallet so both sides are protected. ' +
              'Off-platform payments have no buyer or seller protection.',
            meta: { blocked: 'off_platform_payment' }
          });
        }
      } catch (paymentError) {
        /* A failing check must not silence the platform. If this throws
           the message sends -- the flagging below still catches it. */
        console.error('[Moderation] Payment check failed:', paymentError.message);
      }
    }

    // Generate threadId
    const threadId = Message.getThreadId(sender, receiver);

    /* New accounts: verified, and two conversations in the first day.
     *
     * Every scam account traced so far has had the same shape -- sign
     * up, open a dozen threads inside the hour, push every one of them
     * to Telegram. Two rules break that shape:
     *
     *   1. You must be age-verified to START a conversation. Didit runs
     *      the blocked-jurisdiction check against the document, so an
     *      unverified account has never been through it at all.
     *   2. A verified account still gets NEW_ACCOUNT_THREAD_LIMIT new
     *      conversations in its first NEW_ACCOUNT_WINDOW_HOURS hours --
     *      enough for a real buyer, not enough to work a seller list,
     *      and long enough for a human to look at the account first.
     *
     * REPLIES ARE ALWAYS FREE. Both rules apply only to opening a
     * thread that does not exist yet, so nobody is ever stopped from
     * answering someone who messaged them: a brand-new seller with
     * eight enquiries can answer all eight. That distinction is the
     * difference between a scam filter and an outage. */
    const senderRole = String(req.user.role || '');

    if (senderRole !== 'admin' && senderRole !== 'moderator') {
      try {
        const threadExists = await Message.exists({ threadId });

        if (!threadExists) {
          const senderUser = await User.findOne({ username: sender })
            .select('isVerified verificationStatus createdAt')
            .lean();

          /* Same verified test the rest of this file uses, and both
             fields are set together on a Didit approval. */
          const verified = !!(
            senderUser?.isVerified ||
            senderUser?.verificationStatus === 'verified'
          );

          if (!verified) {
            console.log(`[Messages] Blocked unverified new conversation: ${sender} -> ${receiver}`);

            return res.status(403).json({
              success: false,
              error:
                'Verify your age before starting a new conversation. ' +
                'It takes about a minute, and it is what keeps scammers off the platform. ' +
                'You can still reply to anyone who has messaged you.',
              meta: { blocked: 'verification_required' }
            });
          }

          const createdAt = senderUser?.createdAt ? new Date(senderUser.createdAt) : null;

          if (!createdAt) {
            /* No signup timestamp means the age of the account cannot be
               known, so the window cannot be applied. Logged rather than
               guessed -- a wrong guess here either blocks established
               users or lets new ones through unchecked. */
            console.warn(
              `[Messages] ${sender} has no createdAt — new-account conversation limit not applied`
            );
          } else {
            const windowMs = NEW_ACCOUNT_WINDOW_HOURS * 60 * 60 * 1000;
            const accountAgeMs = Date.now() - createdAt.getTime();

            if (accountAgeMs < windowMs) {
              const started = await countThreadsStarted(sender, createdAt);

              if (started >= NEW_ACCOUNT_THREAD_LIMIT) {
                const msLeft = windowMs - accountAgeMs;
                const hoursLeft = Math.max(1, Math.ceil(msLeft / (60 * 60 * 1000)));

                console.log(
                  `[Messages] New-account limit hit: ${sender} -> ${receiver} ` +
                  `(${started} started, ${hoursLeft}h left in window)`
                );

                return res.status(403).json({
                  success: false,
                  error:
                    `New accounts can start ${NEW_ACCOUNT_THREAD_LIMIT} conversations in their ` +
                    `first ${NEW_ACCOUNT_WINDOW_HOURS} hours. You can start more in about ` +
                    `${hoursLeft} hour${hoursLeft === 1 ? '' : 's'}, and you can keep replying ` +
                    `to your existing conversations now.`,
                  meta: {
                    blocked: 'new_account_limit',
                    limit: NEW_ACCOUNT_THREAD_LIMIT,
                    started,
                    hoursRemaining: hoursLeft
                  }
                });
              }
            }
          }
        }
      } catch (gateError) {
        /* Fails open, like every other check in this handler. A broken
           limit must not take messaging down for the whole platform. */
        console.error('[Messages] New-account gate failed:', gateError.message);
      }
    }


    // Create new message with a UUID
    const messageId = uuidv4();
    const message = new Message({
      _id: messageId,
      sender,
      receiver,
      content,
      type,
      meta,
      threadId,
      isRead: false
    });
    
    await message.save();

    /* Off-platform solicitation.
     *
     * Raised as a report rather than blocked. A seller saying "I don't
     * use Telegram, let's keep it here" is doing exactly the right
     * thing and a blocker would stop her; meanwhile anyone determined
     * gets through with tg or a line break. So the message sends, and
     * a human sees it in context with the evidence attached.
     *
     * Never throws. A moderation flag failing must not stop a message
     * that has already been written and saved. */
    if (content) {
      try {
        const { detectOffPlatform } = require('../utils/offPlatformDetection');
        const detection = detectOffPlatform(content);

        if (detection.flagged) {
          const Report = require('../models/Report');

          /* One open report per sender, topped up rather than
             duplicated -- a buyer who posts their number in five
             threads is one problem, not five, and five near-identical
             reports is how a queue stops being read. */
          const existing = await Report.findOne({
            reportedUser: sender,
            reportType: 'spam',
            status: 'pending',
            'metadata.autoFlag': 'off_platform'
          });

          if (existing) {
            existing.severity = detection.severity === 'high' ? 'high' : existing.severity;
            existing.description =
              `${existing.description}\n\n[${new Date().toISOString()}] to ${receiver}: ${String(content).slice(0, 300)}`
                .slice(0, 4000);
            await existing.save();
          } else {
            await Report.create({
              reportedUser: sender,
              reportedBy: 'system',
              reportType: 'spam',
              severity: detection.severity,
              category: 'off_platform',
              description:
                `Automatic flag: possible attempt to move off platform (${detection.reasons.join(', ')}).\n\n` +
                `[${new Date().toISOString()}] to ${receiver}: ${String(content).slice(0, 300)}`,
              status: 'pending',
              metadata: {
                autoFlag: 'off_platform',
                reasons: detection.reasons,
                threadId
              }
            });
          }

          console.log(
            `[Moderation] Off-platform flag: ${sender} -> ${receiver} (${detection.reasons.join(', ')}, ${detection.severity})`
          );

          if (global.webSocketService) {
            global.webSocketService.broadcast('report:created', { at: new Date().toISOString() });
          }
        }
      } catch (flagError) {
        console.error('[Moderation] Off-platform check failed:', flagError.message);
      }
    }
    
    // Update sender's last active time
    await User.findOneAndUpdate(
      { username: sender },
      { lastActive: new Date(), isOnline: true }
    );
    
    console.log('WEBSOCKET: Emitting new message event for message:', {
      id: message._id.toString(),
      sender: message.sender,
      receiver: message.receiver,
      threadId: message.threadId
    });
    
    // WEBSOCKET: Emit new message event with all required fields
    const messageData = {
      id: message._id.toString(),
      sender: message.sender,
      receiver: message.receiver,
      content: message.content,
      type: message.type,
      date: message.createdAt,
      createdAt: message.createdAt,
      threadId: message.threadId,
      meta: message.meta,
      isRead: false,
      read: false
    };
    
    // Emit to both sender and receiver
    webSocketService.emitNewMessage(messageData);
    
    // Check if receiver is viewing the thread and auto-mark as read
    if (webSocketService.isUserViewingThread(receiver, threadId)) {
      console.log('WEBSOCKET: Receiver is viewing thread, auto-marking as read');
      
      // Update the message in database
      message.isRead = true;
      await message.save();
      
      // Update the messageData
      messageData.isRead = true;
      messageData.read = true;
      
      // Emit read event
      setTimeout(() => {
        webSocketService.emitMessageRead([messageData.id], threadId, receiver);
      }, 100);
    }
    
    console.log('WEBSOCKET: Message emission completed');
    
    // Return the complete message object
    res.json({
      success: true,
      data: messageData
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Mark messages as read
router.post('/mark-read', authMiddleware, async (req, res) => {
  try {
    let { messageIds, username, otherParty } = req.body;
    const currentUser = req.user.username;
    
    console.log('Mark read request:', { messageIds, username, otherParty, currentUser });
    
    // If username and otherParty are provided, get message IDs
    if (!messageIds && username && otherParty) {
      // Get messages between the two users
      const threadId = Message.getThreadId(username, otherParty);
      const messages = await Message.find({
        threadId,
        receiver: currentUser,
        isRead: false
      });
      
      messageIds = messages.map(msg => msg._id.toString());
      console.log('Found message IDs from thread:', messageIds);
    }
    
    // Validate messageIds
    if (!messageIds) {
      messageIds = [];
    }
    
    if (!Array.isArray(messageIds)) {
      // If it's a single ID, convert to array
      if (typeof messageIds === 'string') {
        messageIds = [messageIds];
      } else {
        return res.status(400).json({
          success: false,
          error: 'messageIds must be an array'
        });
      }
    }
    
    if (messageIds.length === 0) {
      console.log('No messages to mark as read');
      return res.json({
        success: true,
        data: { updated: 0 }
      });
    }
    
    // Get the thread ID from the first message to emit the right event
    let threadId = null;
    let messageSender = null;
    
    if (messageIds.length > 0) {
      const firstMessage = await Message.findOne({
        $or: [
          { _id: messageIds[0] },
          { _id: { $in: messageIds } }
        ]
      }).catch(() => null);
      
      if (firstMessage) {
        threadId = firstMessage.threadId;
        messageSender = firstMessage.sender;
      }
    }
    
    // Update only messages where current user is receiver
    const result = await Message.updateMany(
      {
        $or: messageIds.map(id => ({ _id: id })),
        receiver: currentUser,
        isRead: false
      },
      {
        isRead: true
      }
    );
    
    console.log('Mark read result:', result);
    
    // Emit message read event to BOTH users if we have a threadId
    if (threadId && result.modifiedCount > 0) {
      console.log('WEBSOCKET: Emitting message:read event to both users');
      
      const readEventData = {
        messageIds,
        threadId,
        readBy: currentUser,
        readAt: new Date().toISOString()
      };
      
      // Emit to the current user (reader)
      webSocketService.emitMessageRead(messageIds, threadId, currentUser);
      
      // Also emit to the sender so they get the read receipt update
      if (messageSender && messageSender !== currentUser) {
        console.log('WEBSOCKET: Also emitting to sender:', messageSender);
        webSocketService.emitToUser(messageSender, 'message:read', readEventData);
      }
    }
    
    res.json({
      success: true,
      data: {
        updated: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get unread count
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const username = req.user.username;
    const count = await Message.getUnreadCount(username);
    
    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get blocked users for current user
router.get('/blocked-users', authMiddleware, async (req, res) => {
  try {
    const username = req.user.username;
    
    // Get blocked users from User model
    const user = await User.findOne({ username }).select('blockedUsers');
    
    const blockedData = {};
    if (user && user.blockedUsers) {
      blockedData[username] = user.blockedUsers;
    } else {
      blockedData[username] = [];
    }
    
    res.json({
      success: true,
      data: blockedData
    });
  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Block a user
router.post('/block', authMiddleware, async (req, res) => {
  try {
    const { blocked } = req.body;
    const blocker = req.user.username;
    
    if (!blocked) {
      return res.status(400).json({
        success: false,
        error: 'Blocked username is required'
      });
    }
    
    // Add to User's blockedUsers array
    await User.findOneAndUpdate(
      { username: blocker },
      { $addToSet: { blockedUsers: blocked } }
    );
    
    res.json({
      success: true,
      data: {
        blocker,
        blocked
      }
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Unblock a user
router.post('/unblock', authMiddleware, async (req, res) => {
  try {
    const { blocked } = req.body;
    const blocker = req.user.username;
    
    if (!blocked) {
      return res.status(400).json({
        success: false,
        error: 'Blocked username is required'
      });
    }
    
    // Remove from User's blockedUsers array
    await User.findOneAndUpdate(
      { username: blocker },
      { $pull: { blockedUsers: blocked } }
    );
    
    res.json({
      success: true,
      data: {
        blocker,
        blocked
      }
    });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Report a user
router.post('/report', authMiddleware, async (req, res) => {
  try {
    const { reportee, reason, messages, category } = req.body;
    const reporter = req.user.username;
    
    if (!reportee) {
      return res.status(400).json({
        success: false,
        error: 'Reportee username is required'
      });
    }
    
    // Create report in Report model
    const Report = require('../models/Report');
    const report = new Report({
      reporter,
      reportedUser: reportee,
      reason: reason || '',
      category: category || 'other',
      messages: messages || [],
      status: 'pending',
      processed: false
    });
    
    await report.save();
    
    res.json({
      success: true,
      data: {
        reporter,
        reportee,
        reportId: report._id
      }
    });
  } catch (error) {
    console.error('Report user error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get message notifications for current user
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    // SECURITY (IDOR): only admins may read another user's notifications
    const requested = req.query.username;
    if (requested && requested !== req.user.username && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You can only view your own notifications'
      });
    }
    const username = requested || req.user.username;

    // Get unread message counts grouped by sender
    const unreadMessages = await Message.aggregate([
      {
        $match: {
          receiver: username,
          isRead: false
        }
      },
      {
        $group: {
          _id: '$sender',
          count: { $sum: 1 },
          lastMessage: { $last: '$content' },
          lastDate: { $last: '$createdAt' }
        }
      },
      {
        $project: {
          buyer: '$_id',
          messageCount: '$count',
          lastMessage: '$lastMessage',
          timestamp: '$lastDate',
          _id: 0
        }
      }
    ]);
    
    res.json({
      success: true,
      data: unreadMessages
    });
  } catch (error) {
    console.error('Get message notifications error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Clear message notifications
router.post('/notifications/clear', authMiddleware, async (req, res) => {
  try {
    const { seller, buyer } = req.body;
    
    if (!seller || !buyer) {
      return res.status(400).json({
        success: false,
        error: 'Seller and buyer are required'
      });
    }
    
    // Mark messages as read
    const threadId = Message.getThreadId(seller, buyer);
    await Message.updateMany(
      {
        threadId,
        receiver: seller,
        sender: buyer,
        isRead: false
      },
      {
        isRead: true
      }
    );
    
    res.json({
      success: true
    });
  } catch (error) {
    console.error('Clear notifications error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get unread reports count (for admins)
router.get('/reports/unread-count', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    // Count unread reports from Report model
    const Report = require('../models/Report');
    const count = await Report.countDocuments({ 
      status: 'pending',
      processed: false 
    });
    
    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Get unread reports error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;



