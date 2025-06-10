// src/utils/messageUtils.ts
export const isSingleEmoji = (content: string) => {
  const emojiRegex = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})(\u200d(\p{Emoji_Presentation}|\p{Extended_Pictographic}))*$/u;
  return emojiRegex.test(content);
};

export const getInitial = (username: string) => {
  return username.charAt(0).toUpperCase();
};

export const formatTimeAgo = (date: string) => {
  const now = new Date();
  const messageDate = new Date(date);
  const diffMs = now.getTime() - messageDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays > 0) {
    return diffDays === 1 ? '1d ago' : `${diffDays}d ago`;
  }
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours > 0) {
    return diffHours === 1 ? '1h ago' : `${diffHours}h ago`;
  }
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes > 0) {
    return diffMinutes === 1 ? '1m ago' : `${diffMinutes}m ago`;
  }
  
  return 'Just now';
};