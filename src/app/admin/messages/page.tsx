// src/app/admin/messages/page.tsx
'use client';

import { useEffect } from 'react';
import RequireAuth from '@/components/RequireAuth';
import { useAdminMessages } from '@/hooks/useAdminMessages';
import MessagesHeader from '@/components/admin/messages/MessagesHeader';
import ConversationsContent from '@/components/admin/messages/ConversationsContent';
import UserDirectoryContent from '@/components/admin/messages/UserDirectoryContent';
import ChatContent from '@/components/admin/messages/ChatContent';
import { AlertTriangle } from 'lucide-react';

export default function AdminMessagesPage() {
  const {
    isAdmin,
    username,
    allUsers,
    threads,
    unreadCounts,
    lastMessages,
    userProfiles,
    activeMessages,
    totalUnreadCount,
    content,
    setContent,
    activeThread,
    setActiveThread,
    searchQuery,
    setSearchQuery,
    selectedImage,
    setSelectedImage,
    filterBy,
    setFilterBy,
    showUserDirectory,
    setShowUserDirectory,
    directorySearchQuery,
    setDirectorySearchQuery,
    isUserBlocked,
    isUserReported,
    handleSend,
    handleBlockToggle,
    handleReport,
    handleThreadSelect,
    handleStartConversation
  } = useAdminMessages();

  /* ClientLayout hides the site header on mobile while a thread is
     open, and the buyer and seller pages tell it so. Admin never did,
     which is why its height maths was wrong: the layout below assumed
     a 64px header that had already been removed. */
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('threadStateChange', { detail: { hasActiveThread: !!activeThread } })
    );
  }, [activeThread]);

  if (!isAdmin) {
    return (
      <RequireAuth role="admin">
        <div className="flex h-full items-center justify-center bg-black">
          <div className="max-w-md rounded-lg bg-[#121212] p-8 shadow-lg">
            <div className="mb-4 flex items-center">
              <AlertTriangle size={32} className="mr-3 text-[#ff950e]" />
              <h1 className="text-2xl font-bold text-[#ff950e]">Access Denied</h1>
            </div>
            <p className="text-gray-300">Only admin users can access this page.</p>
            <p className="mt-2 text-sm text-gray-400">Please log in with an admin account.</p>
          </div>
        </div>
      </RequireAuth>
    );
  }

  // Defensive fallbacks to prevent undefined-prop crashes in children.
  const safeThreads = threads ?? [];
  const safeUnreadCounts = unreadCounts ?? {};
  const safeLastMessages = lastMessages ?? {};
  const safeUserProfiles = userProfiles ?? {};
  const safeActiveMessages = activeMessages ?? [];
  const safeUsername = username ?? '';
  const safeAllUsers = allUsers ?? [];

  return (
    <RequireAuth role="admin">
      {/* h-full rather than min-h-[100dvh] minus a guessed header height.
          The old calc(100dvh-64px) subtracted a header that ClientLayout
          removes on mobile, so the page ran taller than the viewport and
          the whole document scrolled. Let the layout supply the height. */}
      <main className="h-full min-h-0 w-full overflow-hidden bg-black">
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden bg-[#121212] shadow-lg md:flex-row md:rounded-lg">
          {/* Threads and user directory.
              On mobile only one pane shows at a time, the same as the
              buyer and seller pages: the list until a thread is picked,
              then the conversation. Both were rendered at once before,
              stacked and full width, which is what made the page feel
              stuck with no way back. */}
          <div
            className={`w-full flex-1 flex-col border-gray-800 bg-[#121212] min-h-0 md:flex md:w-1/3 md:flex-none md:border-r ${
              activeThread ? 'hidden' : 'flex'
            }`}
          >
            <MessagesHeader
              filterBy={filterBy}
              setFilterBy={setFilterBy}
              totalUnreadCount={totalUnreadCount ?? 0}
              showUserDirectory={showUserDirectory}
              setShowUserDirectory={setShowUserDirectory}
              searchQuery={searchQuery ?? ''}
              setSearchQuery={setSearchQuery}
              directorySearchQuery={directorySearchQuery ?? ''}
              setDirectorySearchQuery={setDirectorySearchQuery}
            />

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#121212]">
              {showUserDirectory ? (
                <UserDirectoryContent
                  allUsers={safeAllUsers}
                  directorySearchQuery={directorySearchQuery ?? ''}
                  filterBy={filterBy}
                  onStartConversation={handleStartConversation}
                  onClearFilters={() => {
                    setDirectorySearchQuery('');
                    setFilterBy('all');
                  }}
                />
              ) : (
                <ConversationsContent
                  threads={safeThreads}
                  lastMessages={safeLastMessages}
                  unreadCounts={safeUnreadCounts}
                  userProfiles={safeUserProfiles}
                  activeThread={activeThread}
                  searchQuery={searchQuery ?? ''}
                  filterBy={filterBy}
                  onThreadSelect={handleThreadSelect}
                  onStartNewConversation={() => setShowUserDirectory(true)}
                />
              )}
            </div>
          </div>

          {/* Active conversation. Hidden on mobile until a thread is
              open, so the empty state does not occupy the screen. */}
          <div
            className={`w-full flex-1 flex-col bg-[#121212] min-h-0 md:flex md:w-2/3 ${
              activeThread ? 'flex' : 'hidden'
            }`}
          >
            <ChatContent
              activeThread={activeThread}
              activeMessages={safeActiveMessages}
              userProfiles={safeUserProfiles}
              content={content}
              setContent={setContent}
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage}
              isUserBlocked={isUserBlocked}
              isUserReported={isUserReported}
              onSend={handleSend}
              onBlockToggle={handleBlockToggle}
              onReport={handleReport}
              onStartNewConversation={() => setShowUserDirectory(true)}
              onBack={() => setActiveThread(null)}
              username={safeUsername}
            />
          </div>
        </div>
      </main>
    </RequireAuth>
  );
}
