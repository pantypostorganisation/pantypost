// src/utils/messageHelpers.ts

/**
 * Check if a string contains only a single emoji
 */
export const isSingleEmoji = (content: string): boolean => {
  const emojiRegex = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})(\u200d(\p{Emoji_Presentation}|\p{Extended_Pictographic}))*$/u;
  return emojiRegex.test(content);
};

/**
 * Create a consistent conversation key from two usernames
 */
export const getConversationKey = (userA: string, userB: string): string => {
  return [userA, userB].sort().join('-');
};

/**
 * Format a timestamp for message display
 */
export const formatMessageTime = (date: string): string => {
  const messageDate = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - messageDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    // Today - show time only
    return messageDate.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else if (diffDays === 1) {
    // Yesterday
    return 'Yesterday';
  } else if (diffDays < 7) {
    // This week - show day name
    return messageDate.toLocaleDateString([], { 
      weekday: 'short' 
    });
  } else {
    // Older - show date
    return messageDate.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric' 
    });
  }
};

/**
 * Get initials from a username
 */
export const getUserInitials = (username: string): string => {
  if (!username) return '?';
  
  const words = username.split(/[\s_-]+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  
  return username.substring(0, 2).toUpperCase();
};

/**
 * Truncate message content for preview
 */
export const truncateMessage = (content: string, maxLength: number = 50): string => {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength).trim() + '...';
};