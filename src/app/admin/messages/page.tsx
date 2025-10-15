// src/app/admin/messages/page.tsx
'use client';

import RequireAuth from '@/components/RequireAuth';
import { useAdminMessages } from '@/hooks/useAdminMessages';
import MessagesHeader from '@/components/admin/messages/MessagesHeader';
import ConversationsContent from '@/components/admin/messages/ConversationsContent';
import UserDirectoryContent from '@/components/admin/messages/UserDirectoryContent';
import ChatContent from '@/components/admin/messages/ChatContent';
import { AlertTriangle } from 'lucide-react';

export default function AdminMessagesPage() {
  const {
    // Auth & Users
    // user, // unused
    isAdmin,
    username,

    // Collections
    allUsers,

    // Messages & Threads
    threads,
    unreadCounts,
    lastMessages,
    userProfiles,
    activeMessages,
    totalUnreadCount,

    // State
    content,
    setContent,
    activeThread,
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

    // Computed
    isUserBlocked,
    isUserReported,

    // Handlers
    handleSend,
    handleBlockToggle,
    handleReport,
    handleThreadSelect,
    handleStartConversation
  } = useAdminMessages();

  // Render access denied if not admin
  if (!isAdmin) {
    return (
      <RequireAuth role="admin">
        <div className="h-screen flex items-center justify-center bg-black">
          <div className="bg-[#121212] rounded-lg shadow-lg p-8 max-w-md">
            <div className="flex items-center mb-4">
              <AlertTriangle size={32} className="text-[#ff950e] mr-3" />
              <h1 className="text-2xl font-bold text-[#ff950e]">Access Denied</h1>
            </div>
            <p className="text-gray-300">Only admin users can access this page.</p>
            <p className="text-gray-400 text-sm mt-2">Please log in with an admin account.</p>
          </div>
        </div>
      </RequireAuth>
    );
  }

  // Defensive fallbacks to prevent undefined-prop crashes in child components
  const safeThreads = threads ?? [];
  const safeUnreadCounts = unreadCounts ?? {};
  const safeLastMessages = lastMessages ?? {};
  const safeUserProfiles = userProfiles ?? {};
  const safeActiveMessages = activeMessages ?? [];
  const safeUsername = username ?? '';
  const safeAllUsers = allUsers ?? [];

  return (
    <RequireAuth role="admin">
      <div className="py-3 bg-black"></div>

      <div className="h-screen bg-black flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col md:flex-row max-w-6xl mx-auto w-full bg-[#121212] rounded-lg shadow-lg overflow-hidden">
          {/* Left column - Message threads and User Directory */}
          <div className="w-full md:w-1/3 border-r border-gray-800 flex flex-col bg-[#121212]">
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

            {/* Content Area - Either Conversations or User Directory */}
            <div className="flex-1 overflow-y-auto bg-[#121212]">
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

          {/* Right column - Active conversation */}
          <div className="w-full md:w-2/3 flex flex-col bg-[#121212]">
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
              username={safeUsername}
            />
          </div>
        </div>

        {/* Bottom Padding */}
        <div className="py-6 bg-black"></div>
      </div>
    </RequireAuth>
  );
}
