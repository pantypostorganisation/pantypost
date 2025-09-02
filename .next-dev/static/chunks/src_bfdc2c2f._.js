(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/src/components/RequireAuth.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/components/RequireAuth.tsx
__turbopack_context__.s({
    "default": ()=>RequireAuth
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/AuthContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-client] (ecmascript) <export * as z>");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
const VALID_ROLES = [
    'buyer',
    'seller',
    'admin'
];
const RoleSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum(VALID_ROLES);
_c = RoleSchema;
function RequireAuth(param) {
    let { role, children } = param;
    _s();
    const { user, isAuthReady } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const [authorized, setAuthorized] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [hasChecked, setHasChecked] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "RequireAuth.useEffect": ()=>{
            if (!isAuthReady || hasChecked) return;
            // Runtime validation of `role` prop (dev-only noise)
            const parsed = RoleSchema.safeParse(role);
            if (!parsed.success) {
                if ("TURBOPACK compile-time truthy", 1) {
                    console.warn('[RequireAuth] Invalid role prop supplied:', role);
                }
                router.push('/login');
                setHasChecked(true);
                return;
            }
            const userRole = user === null || user === void 0 ? void 0 : user.role;
            // NEW: strict role matching — no admin override for buyer/seller routes
            let hasAccess = false;
            if (parsed.data === 'admin') {
                hasAccess = userRole === 'admin';
            } else {
                hasAccess = userRole === parsed.data; // admin can’t view buyer/seller pages
            }
            if (!user || !hasAccess) {
                router.push('/login');
            } else {
                setAuthorized(true);
            }
            setHasChecked(true);
        }
    }["RequireAuth.useEffect"], [
        isAuthReady,
        user,
        role,
        router,
        hasChecked
    ]);
    if (!isAuthReady || !hasChecked) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-black flex items-center justify-center",
            role: "status",
            "aria-label": "Checking access",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center space-x-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-4 h-4 bg-[#ff950e] rounded-full animate-pulse"
                    }, void 0, false, {
                        fileName: "[project]/src/components/RequireAuth.tsx",
                        lineNumber: 63,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-4 h-4 bg-[#ff950e] rounded-full animate-pulse",
                        style: {
                            animationDelay: '0.2s'
                        }
                    }, void 0, false, {
                        fileName: "[project]/src/components/RequireAuth.tsx",
                        lineNumber: 64,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-4 h-4 bg-[#ff950e] rounded-full animate-pulse",
                        style: {
                            animationDelay: '0.4s'
                        }
                    }, void 0, false, {
                        fileName: "[project]/src/components/RequireAuth.tsx",
                        lineNumber: 65,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/RequireAuth.tsx",
                lineNumber: 62,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/RequireAuth.tsx",
            lineNumber: 61,
            columnNumber: 7
        }, this);
    }
    if (!authorized) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: children
    }, void 0, false);
}
_s(RequireAuth, "NocZJcgyzYrF6sDLfMVNgxYIM1I=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c1 = RequireAuth;
var _c, _c1;
__turbopack_context__.k.register(_c, "RoleSchema");
__turbopack_context__.k.register(_c1, "RequireAuth");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/hooks/useAdminMessages.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "useAdminMessages": ()=>useAdminMessages
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/AuthContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$ListingContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/ListingContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$MessageContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/MessageContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/index.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/storage.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/rate-limiter.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
;
;
;
;
;
;
const useAdminMessages = ()=>{
    _s();
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const { users } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$ListingContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useListings"])();
    const { messages, sendMessage, markMessagesAsRead, blockUser, unblockUser, reportUser, isBlocked, hasReported, getThreadsForUser, getAllThreadsInfo } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$MessageContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMessages"])();
    const [selectedUser, setSelectedUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [content, setContent] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [activeThread, setActiveThread] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [searchQuery, setSearchQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [selectedImage, setSelectedImage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [filterBy, setFilterBy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('all');
    const [viewsData, setViewsData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [messageUpdate, setMessageUpdate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [showUserDirectory, setShowUserDirectory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [directorySearchQuery, setDirectorySearchQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [rateLimitError, setRateLimitError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const readThreadsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(new Set());
    const rateLimiter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getRateLimiter"])();
    const isAdmin = !!user && user.role === 'admin';
    const username = (user === null || user === void 0 ? void 0 : user.username) || '';
    // Load views data with error handling
    const loadViews = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAdminMessages.useCallback[loadViews]": async ()=>{
            try {
                if ("TURBOPACK compile-time truthy", 1) {
                    const data = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('listing_views', {});
                    setViewsData(data);
                }
            } catch (error) {
                console.error('Failed to load views data:', error);
                setViewsData({});
            }
        }
    }["useAdminMessages.useCallback[loadViews]"], []);
    // Load views and handle localStorage events
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useAdminMessages.useEffect": ()=>{
            loadViews();
            const handleStorageChange = {
                "useAdminMessages.useEffect.handleStorageChange": ()=>loadViews()
            }["useAdminMessages.useEffect.handleStorageChange"];
            window.addEventListener('storage', handleStorageChange);
            window.addEventListener('focus', handleStorageChange);
            return ({
                "useAdminMessages.useEffect": ()=>{
                    window.removeEventListener('storage', handleStorageChange);
                    window.removeEventListener('focus', handleStorageChange);
                }
            })["useAdminMessages.useEffect"];
        }
    }["useAdminMessages.useEffect"], [
        loadViews
    ]);
    // Load previously read threads
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useAdminMessages.useEffect": ()=>{
            const loadReadThreads = {
                "useAdminMessages.useEffect.loadReadThreads": async ()=>{
                    try {
                        if (user) {
                            const readThreadsKey = "panty_read_threads_".concat(user.username);
                            const readThreads = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem(readThreadsKey, []);
                            if (Array.isArray(readThreads)) {
                                readThreadsRef.current = new Set(readThreads);
                                setMessageUpdate({
                                    "useAdminMessages.useEffect.loadReadThreads": (prev)=>prev + 1
                                }["useAdminMessages.useEffect.loadReadThreads"]);
                            }
                        }
                    } catch (error) {
                        console.error('Failed to load read threads:', error);
                    }
                }
            }["useAdminMessages.useEffect.loadReadThreads"];
            loadReadThreads();
        }
    }["useAdminMessages.useEffect"], [
        user
    ]);
    // UPDATED: Use new helper functions from MessageContext
    const { threads, unreadCounts, lastMessages, userProfiles, activeMessages, totalUnreadCount } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useAdminMessages.useMemo": ()=>{
            if (!user) return {
                threads: {},
                unreadCounts: {},
                lastMessages: {},
                userProfiles: {},
                activeMessages: [],
                totalUnreadCount: 0
            };
            // Use the new helper functions (no role filter for admin - sees all)
            const threads = getThreadsForUser(user.username);
            const threadInfos = getAllThreadsInfo(user.username);
            const unreadCounts = {};
            const lastMessages = {};
            const userProfiles = {};
            let totalUnreadCount = 0;
            Object.entries(threadInfos).forEach({
                "useAdminMessages.useMemo": (param)=>{
                    let [userKey, info] = param;
                    unreadCounts[userKey] = info.unreadCount;
                    lastMessages[userKey] = info.lastMessage;
                    // Get user profile picture and verification status
                    try {
                        const userInfo = users === null || users === void 0 ? void 0 : users[userKey];
                        const isVerified = (userInfo === null || userInfo === void 0 ? void 0 : userInfo.verified) || (userInfo === null || userInfo === void 0 ? void 0 : userInfo.verificationStatus) === 'verified';
                        const role = (userInfo === null || userInfo === void 0 ? void 0 : userInfo.role) || 'unknown';
                        userProfiles[userKey] = {
                            pic: null,
                            verified: isVerified,
                            role: role
                        };
                    } catch (error) {
                        console.error("Error processing user profile for ".concat(userKey, ":"), error);
                        userProfiles[userKey] = {
                            pic: null,
                            verified: false,
                            role: 'unknown'
                        };
                    }
                    // Only add to total if not in readThreadsRef
                    if (!readThreadsRef.current.has(userKey) && info.unreadCount > 0) {
                        totalUnreadCount += 1;
                    }
                }
            }["useAdminMessages.useMemo"]);
            // Get active messages
            let activeMessages = [];
            if (activeThread) {
                activeMessages = threads[activeThread] || [];
            }
            return {
                threads,
                unreadCounts,
                lastMessages,
                userProfiles,
                activeMessages,
                totalUnreadCount
            };
        }
    }["useAdminMessages.useMemo"], [
        user,
        messages,
        activeThread,
        users,
        messageUpdate,
        getThreadsForUser,
        getAllThreadsInfo
    ]);
    // Get all users for directory (exclude the current admin and any admin accounts)
    const allUsers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useAdminMessages.useMemo[allUsers]": ()=>{
            const allUsersList = Object.entries(users || {}).filter({
                "useAdminMessages.useMemo[allUsers].allUsersList": (param)=>{
                    let [uname, userInfo] = param;
                    return uname !== (user === null || user === void 0 ? void 0 : user.username) && // Exclude current admin user
                    (userInfo === null || userInfo === void 0 ? void 0 : userInfo.role) !== 'admin' // Exclude any admin accounts
                    ;
                }
            }["useAdminMessages.useMemo[allUsers].allUsersList"]).map({
                "useAdminMessages.useMemo[allUsers].allUsersList": (param)=>{
                    let [uname, userInfo] = param;
                    const isVerified = (userInfo === null || userInfo === void 0 ? void 0 : userInfo.verified) || (userInfo === null || userInfo === void 0 ? void 0 : userInfo.verificationStatus) === 'verified';
                    return {
                        username: uname,
                        role: (userInfo === null || userInfo === void 0 ? void 0 : userInfo.role) || 'unknown',
                        verified: isVerified,
                        pic: null // Profile pics should be loaded through proper channels
                    };
                }
            }["useAdminMessages.useMemo[allUsers].allUsersList"]);
            return allUsersList;
        }
    }["useAdminMessages.useMemo[allUsers]"], [
        users,
        user
    ]);
    // Mark messages as read when thread is selected
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useAdminMessages.useEffect": ()=>{
            const markThreadAsRead = {
                "useAdminMessages.useEffect.markThreadAsRead": async ()=>{
                    if (activeThread && user) {
                        var _threads_activeThread;
                        const hasUnreadMessages = (_threads_activeThread = threads[activeThread]) === null || _threads_activeThread === void 0 ? void 0 : _threads_activeThread.some({
                            "useAdminMessages.useEffect.markThreadAsRead": (msg)=>!msg.read && msg.sender === activeThread && msg.receiver === user.username
                        }["useAdminMessages.useEffect.markThreadAsRead"]);
                        if (hasUnreadMessages) {
                            markMessagesAsRead(user.username, activeThread);
                            if (!readThreadsRef.current.has(activeThread)) {
                                readThreadsRef.current.add(activeThread);
                                if ("TURBOPACK compile-time truthy", 1) {
                                    const readThreadsKey = "panty_read_threads_".concat(user.username);
                                    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem(readThreadsKey, Array.from(readThreadsRef.current));
                                    const event = new CustomEvent('readThreadsUpdated', {
                                        detail: {
                                            threads: Array.from(readThreadsRef.current),
                                            username: user.username
                                        }
                                    });
                                    window.dispatchEvent(event);
                                }
                                setMessageUpdate({
                                    "useAdminMessages.useEffect.markThreadAsRead": (prev)=>prev + 1
                                }["useAdminMessages.useEffect.markThreadAsRead"]);
                            }
                        }
                        if ("TURBOPACK compile-time truthy", 1) {
                            const event = new CustomEvent('threadSelected', {
                                detail: {
                                    thread: activeThread,
                                    username: user.username
                                }
                            });
                            window.dispatchEvent(event);
                        }
                    }
                }
            }["useAdminMessages.useEffect.markThreadAsRead"];
            markThreadAsRead();
        }
    }["useAdminMessages.useEffect"], [
        activeThread,
        user,
        threads,
        markMessagesAsRead
    ]);
    // Save read threads to localStorage
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useAdminMessages.useEffect": ()=>{
            const saveReadThreads = {
                "useAdminMessages.useEffect.saveReadThreads": async ()=>{
                    if (user && readThreadsRef.current.size > 0 && "object" !== 'undefined') {
                        const readThreadsKey = "panty_read_threads_".concat(user.username);
                        const threadsArray = Array.from(readThreadsRef.current);
                        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem(readThreadsKey, threadsArray);
                        const event = new CustomEvent('readThreadsUpdated', {
                            detail: {
                                threads: threadsArray,
                                username: user.username
                            }
                        });
                        window.dispatchEvent(event);
                    }
                }
            }["useAdminMessages.useEffect.saveReadThreads"];
            saveReadThreads();
        }
    }["useAdminMessages.useEffect"], [
        messageUpdate,
        user
    ]);
    const handleSend = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAdminMessages.useCallback[handleSend]": ()=>{
            if (!activeThread || !content.trim() && !selectedImage) {
                alert('Please enter a message.');
                return;
            }
            // Clear rate limit error
            setRateLimitError(null);
            // Check rate limit
            const rateLimitResult = rateLimiter.check('MESSAGE_SEND', __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RATE_LIMITS"].MESSAGE_SEND);
            if (!rateLimitResult.allowed) {
                setRateLimitError("Too many messages sent. Please wait ".concat(rateLimitResult.waitTime, " seconds."));
                return;
            }
            // Sanitize message content
            const sanitizedContent = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(content.trim());
            // Validate image URL if provided
            if (selectedImage) {
                const sanitizedImageUrl = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].url(selectedImage);
                if (!sanitizedImageUrl) {
                    alert('Invalid image URL');
                    return;
                }
            }
            sendMessage(username, activeThread, sanitizedContent, {
                type: selectedImage ? 'image' : 'normal',
                meta: selectedImage ? {
                    imageUrl: selectedImage
                } : undefined
            });
            setContent('');
            setSelectedImage(null);
        }
    }["useAdminMessages.useCallback[handleSend]"], [
        activeThread,
        content,
        selectedImage,
        username,
        sendMessage,
        rateLimiter
    ]);
    const handleBlockToggle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAdminMessages.useCallback[handleBlockToggle]": ()=>{
            if (!activeThread) return;
            // Rate limit block/unblock actions
            const rateLimitResult = rateLimiter.check('REPORT_ACTION', __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RATE_LIMITS"].REPORT_ACTION);
            if (!rateLimitResult.allowed) {
                alert("Please wait ".concat(rateLimitResult.waitTime, " seconds before performing this action."));
                return;
            }
            if (isBlocked(username, activeThread)) {
                unblockUser(username, activeThread);
            } else {
                blockUser(username, activeThread);
            }
        }
    }["useAdminMessages.useCallback[handleBlockToggle]"], [
        activeThread,
        username,
        isBlocked,
        unblockUser,
        blockUser,
        rateLimiter
    ]);
    const handleReport = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAdminMessages.useCallback[handleReport]": ()=>{
            if (activeThread && !hasReported(username, activeThread)) {
                // Rate limit report actions
                const rateLimitResult = rateLimiter.check('REPORT_ACTION', __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RATE_LIMITS"].REPORT_ACTION);
                if (!rateLimitResult.allowed) {
                    alert("Please wait ".concat(rateLimitResult.waitTime, " seconds before reporting."));
                    return;
                }
                reportUser(username, activeThread);
            }
        }
    }["useAdminMessages.useCallback[handleReport]"], [
        activeThread,
        username,
        hasReported,
        reportUser,
        rateLimiter
    ]);
    const handleThreadSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAdminMessages.useCallback[handleThreadSelect]": (userId)=>{
            // Sanitize username
            const sanitizedUserId = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].username(userId);
            if (activeThread === sanitizedUserId) return;
            setActiveThread(sanitizedUserId);
            setShowUserDirectory(false);
        }
    }["useAdminMessages.useCallback[handleThreadSelect]"], [
        activeThread
    ]);
    const handleStartConversation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAdminMessages.useCallback[handleStartConversation]": (targetUsername)=>{
            // Sanitize username
            const sanitizedUsername = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].username(targetUsername);
            setActiveThread(sanitizedUsername);
            setShowUserDirectory(false);
        }
    }["useAdminMessages.useCallback[handleStartConversation]"], []);
    // Create enhanced search setters that sanitize input
    const setSearchQuerySafe = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAdminMessages.useCallback[setSearchQuerySafe]": (value)=>{
            if (typeof value === 'function') {
                setSearchQuery({
                    "useAdminMessages.useCallback[setSearchQuerySafe]": (prev)=>{
                        const newValue = value(prev);
                        return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].searchQuery(newValue);
                    }
                }["useAdminMessages.useCallback[setSearchQuerySafe]"]);
            } else {
                setSearchQuery(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].searchQuery(value));
            }
        }
    }["useAdminMessages.useCallback[setSearchQuerySafe]"], []);
    const setDirectorySearchQuerySafe = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAdminMessages.useCallback[setDirectorySearchQuerySafe]": (value)=>{
            if (typeof value === 'function') {
                setDirectorySearchQuery({
                    "useAdminMessages.useCallback[setDirectorySearchQuerySafe]": (prev)=>{
                        const newValue = value(prev);
                        return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].searchQuery(newValue);
                    }
                }["useAdminMessages.useCallback[setDirectorySearchQuerySafe]"]);
            } else {
                setDirectorySearchQuery(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].searchQuery(value));
            }
        }
    }["useAdminMessages.useCallback[setDirectorySearchQuerySafe]"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useAdminMessages.useEffect": ()=>{
            if (selectedUser && !activeThread) {
                const sanitizedUser = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].username(selectedUser);
                setActiveThread(sanitizedUser);
            }
        }
    }["useAdminMessages.useEffect"], [
        selectedUser,
        activeThread
    ]);
    const isUserBlocked = !!(activeThread && isBlocked(username, activeThread));
    const isUserReported = !!(activeThread && hasReported(username, activeThread));
    return {
        // Auth & Users
        user,
        isAdmin,
        username,
        allUsers,
        // Messages & Threads
        threads,
        unreadCounts,
        lastMessages,
        userProfiles,
        activeMessages,
        totalUnreadCount,
        // State
        selectedUser,
        setSelectedUser,
        content,
        setContent,
        activeThread,
        setActiveThread,
        searchQuery,
        setSearchQuery: setSearchQuerySafe,
        selectedImage,
        setSelectedImage,
        filterBy,
        setFilterBy,
        showUserDirectory,
        setShowUserDirectory,
        directorySearchQuery,
        setDirectorySearchQuery: setDirectorySearchQuerySafe,
        // Computed
        isUserBlocked,
        isUserReported,
        // Handlers
        handleSend,
        handleBlockToggle,
        handleReport,
        handleThreadSelect,
        handleStartConversation,
        // Other
        viewsData,
        messageUpdate,
        rateLimitError
    };
};
_s(useAdminMessages, "VJ1KKCZg/GncW/25wP0Q4H4AkTw=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$ListingContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useListings"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$MessageContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMessages"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/admin/messages/MessagesHeader.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": ()=>MessagesHeader
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/message-circle.js [app-client] (ecmascript) <export default as MessageCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$funnel$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Filter$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/funnel.js [app-client] (ecmascript) <export default as Filter>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/user.js [app-client] (ecmascript) <export default as User>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bell$2d$ring$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BellRing$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/bell-ring.js [app-client] (ecmascript) <export default as BellRing>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/users.js [app-client] (ecmascript) <export default as Users>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/search.js [app-client] (ecmascript) <export default as Search>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/SecureInput.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
'use client';
;
;
;
;
function MessagesHeader(param) {
    let { filterBy, setFilterBy, totalUnreadCount, showUserDirectory, setShowUserDirectory, searchQuery, setSearchQuery, directorySearchQuery, setDirectorySearchQuery } = param;
    const handleSearchChange = (value)=>{
        const sanitized = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeSearchQuery"])(value);
        if (showUserDirectory) setDirectorySearchQuery(sanitized);
        else setSearchQuery(sanitized);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-4 pt-4 pb-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-2xl font-bold text-[#ff950e] mb-2 flex items-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageCircle$3e$__["MessageCircle"], {
                                size: 24,
                                className: "mr-2 text-[#ff950e]"
                            }, void 0, false, {
                                fileName: "[project]/src/components/admin/messages/MessagesHeader.tsx",
                                lineNumber: 40,
                                columnNumber: 11
                            }, this),
                            "Admin Messages"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/admin/messages/MessagesHeader.tsx",
                        lineNumber: 39,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex space-x-2 mb-3",
                        role: "tablist",
                        "aria-label": "User role filter",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setFilterBy('all'),
                                className: "px-4 py-2 rounded-full text-sm font-medium transition flex items-center ".concat(filterBy === 'all' ? 'bg-[#ff950e] text-black' : 'bg-[#1a1a1a] text-white hover:bg-[#222]'),
                                role: "tab",
                                "aria-selected": filterBy === 'all',
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$funnel$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Filter$3e$__["Filter"], {
                                        size: 14,
                                        className: "mr-1"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/messages/MessagesHeader.tsx",
                                        lineNumber: 52,
                                        columnNumber: 13
                                    }, this),
                                    "All Users"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/admin/messages/MessagesHeader.tsx",
                                lineNumber: 44,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setFilterBy('buyers'),
                                className: "px-4 py-2 rounded-full text-sm font-medium transition flex items-center ".concat(filterBy === 'buyers' ? 'bg-[#ff950e] text-black' : 'bg-[#1a1a1a] text-white hover:bg-[#222]'),
                                role: "tab",
                                "aria-selected": filterBy === 'buyers',
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__["User"], {
                                        size: 14,
                                        className: "mr-1"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/messages/MessagesHeader.tsx",
                                        lineNumber: 63,
                                        columnNumber: 13
                                    }, this),
                                    "Buyers"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/admin/messages/MessagesHeader.tsx",
                                lineNumber: 55,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setFilterBy('sellers'),
                                className: "px-4 py-2 rounded-full text-sm font-medium transition flex items-center ".concat(filterBy === 'sellers' ? 'bg-[#ff950e] text-black' : 'bg-[#1a1a1a] text-white hover:bg-[#222]'),
                                role: "tab",
                                "aria-selected": filterBy === 'sellers',
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bell$2d$ring$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BellRing$3e$__["BellRing"], {
                                        size: 14,
                                        className: "mr-1"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/messages/MessagesHeader.tsx",
                                        lineNumber: 74,
                                        columnNumber: 13
                                    }, this),
                                    "Sellers",
                                    totalUnreadCount > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "ml-1 bg-[#ff950e] text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold border border-black",
                                        children: totalUnreadCount
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/messages/MessagesHeader.tsx",
                                        lineNumber: 77,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/admin/messages/MessagesHeader.tsx",
                                lineNumber: 66,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/admin/messages/MessagesHeader.tsx",
                        lineNumber: 43,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex space-x-1 mb-3 bg-[#222] p-1 rounded-lg",
                        role: "tablist",
                        "aria-label": "View toggle",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setShowUserDirectory(false),
                                className: "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ".concat(!showUserDirectory ? 'bg-[#ff950e] text-black shadow-lg' : 'text-gray-300 hover:text-white hover:bg-[#333]'),
                                role: "tab",
                                "aria-selected": !showUserDirectory,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageCircle$3e$__["MessageCircle"], {
                                        size: 16,
                                        className: "mr-2 inline"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/messages/MessagesHeader.tsx",
                                        lineNumber: 93,
                                        columnNumber: 13
                                    }, this),
                                    "Conversations"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/admin/messages/MessagesHeader.tsx",
                                lineNumber: 85,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setShowUserDirectory(true),
                                className: "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ".concat(showUserDirectory ? 'bg-[#ff950e] text-black shadow-lg' : 'text-gray-300 hover:text-white hover:bg-[#333]'),
                                role: "tab",
                                "aria-selected": showUserDirectory,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__["Users"], {
                                        size: 16,
                                        className: "mr-2 inline"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/messages/MessagesHeader.tsx",
                                        lineNumber: 104,
                                        columnNumber: 13
                                    }, this),
                                    "All Users"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/admin/messages/MessagesHeader.tsx",
                                lineNumber: 96,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/admin/messages/MessagesHeader.tsx",
                        lineNumber: 84,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/admin/messages/MessagesHeader.tsx",
                lineNumber: 38,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-4 pb-3",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureInput"], {
                            type: "text",
                            placeholder: showUserDirectory ? 'Search all users...' : 'Search conversations...',
                            value: showUserDirectory ? directorySearchQuery : searchQuery,
                            onChange: handleSearchChange,
                            className: "w-full py-2 px-4 pr-10 rounded-full bg-[#222] border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e] focus:border-transparent",
                            maxLength: 100,
                            sanitize: true,
                            sanitizer: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeSearchQuery"],
                            "aria-label": "Search"
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/messages/MessagesHeader.tsx",
                            lineNumber: 112,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "absolute right-3 top-3 text-gray-400 z-10",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                                size: 18
                            }, void 0, false, {
                                fileName: "[project]/src/components/admin/messages/MessagesHeader.tsx",
                                lineNumber: 124,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/messages/MessagesHeader.tsx",
                            lineNumber: 123,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/admin/messages/MessagesHeader.tsx",
                    lineNumber: 111,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/admin/messages/MessagesHeader.tsx",
                lineNumber: 110,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
_c = MessagesHeader;
var _c;
__turbopack_context__.k.register(_c, "MessagesHeader");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/admin/messages/ConversationsContent.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": ()=>ConversationsContent
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/message-circle.js [app-client] (ecmascript) <export default as MessageCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/clock.js [app-client] (ecmascript) <export default as Clock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/SecureMessageDisplay.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
function ConversationsContent(param) {
    let { threads, lastMessages, unreadCounts, userProfiles, activeThread, searchQuery, filterBy, onThreadSelect, onStartNewConversation } = param;
    _s();
    const getInitial = (username)=>username ? username.charAt(0).toUpperCase() : '?';
    const formatTimeAgo = (date)=>{
        const now = new Date().getTime();
        const then = new Date(date).getTime();
        const diffMs = Math.max(0, now - then);
        const d = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (d > 0) return d === 1 ? '1d ago' : "".concat(d, "d ago");
        const h = Math.floor(diffMs / (1000 * 60 * 60));
        if (h > 0) return h === 1 ? '1h ago' : "".concat(h, "h ago");
        const m = Math.floor(diffMs / (1000 * 60));
        if (m > 0) return m === 1 ? '1m ago' : "".concat(m, "m ago");
        return 'Just now';
    };
    const filteredAndSortedThreads = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ConversationsContent.useMemo[filteredAndSortedThreads]": ()=>{
            const sanitizedSearch = searchQuery ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeSearchQuery"])(searchQuery).toLowerCase() : '';
            const filtered = Object.keys(threads).filter({
                "ConversationsContent.useMemo[filteredAndSortedThreads].filtered": (userKey)=>{
                    var _userProfiles_userKey;
                    const matchesSearch = sanitizedSearch ? userKey.toLowerCase().includes(sanitizedSearch) : true;
                    if (!matchesSearch) return false;
                    const role = (_userProfiles_userKey = userProfiles[userKey]) === null || _userProfiles_userKey === void 0 ? void 0 : _userProfiles_userKey.role;
                    if (filterBy === 'buyers' && role !== 'buyer') return false;
                    if (filterBy === 'sellers' && role !== 'seller') return false;
                    return true;
                }
            }["ConversationsContent.useMemo[filteredAndSortedThreads].filtered"]);
            return filtered.sort({
                "ConversationsContent.useMemo[filteredAndSortedThreads]": (a, b)=>{
                    var _lastMessages_a, _lastMessages_b;
                    const dateA = new Date(((_lastMessages_a = lastMessages[a]) === null || _lastMessages_a === void 0 ? void 0 : _lastMessages_a.date) || 0).getTime();
                    const dateB = new Date(((_lastMessages_b = lastMessages[b]) === null || _lastMessages_b === void 0 ? void 0 : _lastMessages_b.date) || 0).getTime();
                    return dateB - dateA;
                }
            }["ConversationsContent.useMemo[filteredAndSortedThreads]"]);
        }
    }["ConversationsContent.useMemo[filteredAndSortedThreads]"], [
        threads,
        lastMessages,
        searchQuery,
        filterBy,
        userProfiles
    ]);
    if (filteredAndSortedThreads.length === 0) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "p-4 text-center text-gray-400",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageCircle$3e$__["MessageCircle"], {
                    size: 48,
                    className: "mx-auto text-gray-600 mb-2"
                }, void 0, false, {
                    fileName: "[project]/src/components/admin/messages/ConversationsContent.tsx",
                    lineNumber: 75,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-lg mb-2",
                    children: "No conversations found"
                }, void 0, false, {
                    fileName: "[project]/src/components/admin/messages/ConversationsContent.tsx",
                    lineNumber: 76,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-sm mb-4",
                    children: 'Switch to "All Users" to start new conversations'
                }, void 0, false, {
                    fileName: "[project]/src/components/admin/messages/ConversationsContent.tsx",
                    lineNumber: 77,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: onStartNewConversation,
                    className: "px-4 py-2 bg-[#ff950e] text-black font-medium rounded-lg hover:bg-[#e88800] transition-colors inline-flex items-center justify-center",
                    children: "Browse Users"
                }, void 0, false, {
                    fileName: "[project]/src/components/admin/messages/ConversationsContent.tsx",
                    lineNumber: 78,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/admin/messages/ConversationsContent.tsx",
            lineNumber: 74,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        role: "list",
        children: filteredAndSortedThreads.map((userKey)=>{
            const lastMessage = lastMessages[userKey];
            const isActive = activeThread === userKey;
            const userProfile = userProfiles[userKey];
            const unreadCount = unreadCounts[userKey] || 0;
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                onClick: ()=>onThreadSelect(userKey),
                className: "flex items-center p-3 cursor-pointer relative border-b border-gray-800 ".concat(isActive ? 'bg-[#2a2a2a]' : 'hover:bg-[#1a1a1a]', " transition-colors duration-150 ease-in-out"),
                role: "listitem",
                children: [
                    isActive && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute left-0 top-0 bottom-0 w-1 bg-[#ff950e]"
                    }, void 0, false, {
                        fileName: "[project]/src/components/admin/messages/ConversationsContent.tsx",
                        lineNumber: 105,
                        columnNumber: 26
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative mr-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "relative w-12 h-12 rounded-full bg-[#333] flex items-center justify-center text-white font-bold overflow-hidden shadow-md",
                                children: [
                                    (userProfile === null || userProfile === void 0 ? void 0 : userProfile.pic) ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                        src: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUrl"])(userProfile.pic),
                                        alt: "",
                                        className: "w-full h-full object-cover",
                                        onError: (e)=>{
                                            e.currentTarget.style.display = 'none';
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/messages/ConversationsContent.tsx",
                                        lineNumber: 110,
                                        columnNumber: 19
                                    }, this) : getInitial(userKey),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "absolute bottom-0 right-0 text-[8px] bg-black px-1 rounded text-[#ff950e] border border-[#ff950e]",
                                        children: (userProfile === null || userProfile === void 0 ? void 0 : userProfile.role) === 'buyer' ? 'B' : (userProfile === null || userProfile === void 0 ? void 0 : userProfile.role) === 'seller' ? 'S' : '?'
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/messages/ConversationsContent.tsx",
                                        lineNumber: 122,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/admin/messages/ConversationsContent.tsx",
                                lineNumber: 108,
                                columnNumber: 15
                            }, this),
                            unreadCount > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute -top-1 -right-1 w-6 h-6 bg-[#ff950e] text-black text-xs rounded-full flex items-center justify-center font-bold border-2 border-[#121212] shadow-lg",
                                children: Math.min(unreadCount, 99)
                            }, void 0, false, {
                                fileName: "[project]/src/components/admin/messages/ConversationsContent.tsx",
                                lineNumber: 128,
                                columnNumber: 17
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/admin/messages/ConversationsContent.tsx",
                        lineNumber: 107,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1 min-w-0",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-between",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "font-bold text-white truncate",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureMessageDisplay"], {
                                                content: userKey,
                                                allowBasicFormatting: false
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/admin/messages/ConversationsContent.tsx",
                                                lineNumber: 138,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/admin/messages/ConversationsContent.tsx",
                                            lineNumber: 137,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/messages/ConversationsContent.tsx",
                                        lineNumber: 136,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs text-gray-400 whitespace-nowrap ml-1 flex items-center",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {
                                                size: 12,
                                                className: "mr-1"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/admin/messages/ConversationsContent.tsx",
                                                lineNumber: 142,
                                                columnNumber: 19
                                            }, this),
                                            lastMessage ? formatTimeAgo(lastMessage.date) : ''
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/admin/messages/ConversationsContent.tsx",
                                        lineNumber: 141,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/admin/messages/ConversationsContent.tsx",
                                lineNumber: 135,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-sm text-gray-400 truncate",
                                children: lastMessage ? lastMessage.type === 'customRequest' ? '🛠️ Custom Request' : lastMessage.type === 'image' ? '📷 Image' : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureMessageDisplay"], {
                                        content: lastMessage.content,
                                        allowBasicFormatting: false,
                                        maxLength: 50
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/messages/ConversationsContent.tsx",
                                        lineNumber: 154,
                                        columnNumber: 23
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/admin/messages/ConversationsContent.tsx",
                                    lineNumber: 153,
                                    columnNumber: 21
                                }, this) : ''
                            }, void 0, false, {
                                fileName: "[project]/src/components/admin/messages/ConversationsContent.tsx",
                                lineNumber: 146,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/admin/messages/ConversationsContent.tsx",
                        lineNumber: 134,
                        columnNumber: 13
                    }, this)
                ]
            }, userKey, true, {
                fileName: "[project]/src/components/admin/messages/ConversationsContent.tsx",
                lineNumber: 97,
                columnNumber: 11
            }, this);
        })
    }, void 0, false, {
        fileName: "[project]/src/components/admin/messages/ConversationsContent.tsx",
        lineNumber: 89,
        columnNumber: 5
    }, this);
}
_s(ConversationsContent, "J3agX4MIPNlynWx9L1sGzKvROSc=");
_c = ConversationsContent;
var _c;
__turbopack_context__.k.register(_c, "ConversationsContent");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/admin/messages/UserDirectoryContent.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": ()=>UserDirectoryContent
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/users.js [app-client] (ecmascript) <export default as Users>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/user.js [app-client] (ecmascript) <export default as User>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bell$2d$ring$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BellRing$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/bell-ring.js [app-client] (ecmascript) <export default as BellRing>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$badge$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BadgeCheck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/badge-check.js [app-client] (ecmascript) <export default as BadgeCheck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-right.js [app-client] (ecmascript) <export default as ChevronRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/SecureMessageDisplay.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
function UserDirectoryContent(param) {
    let { allUsers, directorySearchQuery, filterBy, onStartConversation, onClearFilters } = param;
    _s();
    const getInitial = (username)=>username ? username.charAt(0).toUpperCase() : '?';
    const filteredDirectoryUsers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "UserDirectoryContent.useMemo[filteredDirectoryUsers]": ()=>{
            const sanitizedSearch = directorySearchQuery ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeSearchQuery"])(directorySearchQuery).toLowerCase() : '';
            return (allUsers || []).filter({
                "UserDirectoryContent.useMemo[filteredDirectoryUsers]": (userInfo)=>{
                    const matchesSearch = sanitizedSearch ? userInfo.username.toLowerCase().includes(sanitizedSearch) : true;
                    if (!matchesSearch) return false;
                    if (filterBy === 'buyers' && userInfo.role !== 'buyer') return false;
                    if (filterBy === 'sellers' && userInfo.role !== 'seller') return false;
                    return true;
                }
            }["UserDirectoryContent.useMemo[filteredDirectoryUsers]"]).sort({
                "UserDirectoryContent.useMemo[filteredDirectoryUsers]": (a, b)=>a.username.localeCompare(b.username)
            }["UserDirectoryContent.useMemo[filteredDirectoryUsers]"]);
        }
    }["UserDirectoryContent.useMemo[filteredDirectoryUsers]"], [
        allUsers,
        directorySearchQuery,
        filterBy
    ]);
    const UserListItem = (param)=>{
        let { userInfo } = param;
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            onClick: ()=>onStartConversation(userInfo.username),
            className: "flex items-center p-3 cursor-pointer hover:bg-[#222] transition-all duration-200 border-b border-gray-800 group",
            role: "button",
            "aria-label": "Start conversation with ".concat(userInfo.username),
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative mr-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-12 h-12 rounded-full bg-[#333] flex items-center justify-center text-white font-bold overflow-hidden shadow-md border-2 border-gray-700 group-hover:border-[#ff950e]/50 transition-colors",
                            children: userInfo.pic ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                src: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUrl"])(userInfo.pic),
                                alt: "",
                                className: "w-full h-full object-cover",
                                onError: (e)=>{
                                    e.currentTarget.style.display = 'none';
                                }
                            }, void 0, false, {
                                fileName: "[project]/src/components/admin/messages/UserDirectoryContent.tsx",
                                lineNumber: 58,
                                columnNumber: 13
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-lg",
                                children: getInitial(userInfo.username)
                            }, void 0, false, {
                                fileName: "[project]/src/components/admin/messages/UserDirectoryContent.tsx",
                                lineNumber: 67,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/messages/UserDirectoryContent.tsx",
                            lineNumber: 56,
                            columnNumber: 9
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "absolute -bottom-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-lg ".concat(userInfo.role === 'buyer' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'),
                            children: userInfo.role === 'buyer' ? 'B' : 'S'
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/messages/UserDirectoryContent.tsx",
                            lineNumber: 71,
                            columnNumber: 9
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/admin/messages/UserDirectoryContent.tsx",
                    lineNumber: 55,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-1 min-w-0",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-2 mb-1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                    className: "font-medium text-white truncate group-hover:text-[#ff950e] transition-colors",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureMessageDisplay"], {
                                        content: userInfo.username,
                                        allowBasicFormatting: false
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/messages/UserDirectoryContent.tsx",
                                        lineNumber: 83,
                                        columnNumber: 13
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/admin/messages/UserDirectoryContent.tsx",
                                    lineNumber: 82,
                                    columnNumber: 11
                                }, this),
                                userInfo.verified && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$badge$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BadgeCheck$3e$__["BadgeCheck"], {
                                    size: 14,
                                    className: "text-[#ff950e] flex-shrink-0"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/admin/messages/UserDirectoryContent.tsx",
                                    lineNumber: 85,
                                    columnNumber: 33
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/admin/messages/UserDirectoryContent.tsx",
                            lineNumber: 81,
                            columnNumber: 9
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-xs text-gray-400",
                            children: userInfo.role === 'buyer' ? 'Buyer Account' : 'Seller Account'
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/messages/UserDirectoryContent.tsx",
                            lineNumber: 87,
                            columnNumber: 9
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/admin/messages/UserDirectoryContent.tsx",
                    lineNumber: 80,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                    size: 16,
                    className: "text-gray-500 group-hover:text-[#ff950e] transition-colors flex-shrink-0"
                }, void 0, false, {
                    fileName: "[project]/src/components/admin/messages/UserDirectoryContent.tsx",
                    lineNumber: 90,
                    columnNumber: 7
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/admin/messages/UserDirectoryContent.tsx",
            lineNumber: 49,
            columnNumber: 5
        }, this);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-4 py-2 border-b border-gray-800 bg-[#1a1a1a]",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between items-center",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm text-gray-400",
                            children: [
                                filteredDirectoryUsers.length,
                                " user",
                                filteredDirectoryUsers.length !== 1 ? 's' : '',
                                " available"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/admin/messages/UserDirectoryContent.tsx",
                            lineNumber: 98,
                            columnNumber: 11
                        }, this),
                        (directorySearchQuery || filterBy !== 'all') && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onClearFilters,
                            className: "text-xs text-[#ff950e] hover:text-[#ffb04e] transition-colors",
                            children: "Clear filters"
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/messages/UserDirectoryContent.tsx",
                            lineNumber: 102,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/admin/messages/UserDirectoryContent.tsx",
                    lineNumber: 97,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/admin/messages/UserDirectoryContent.tsx",
                lineNumber: 96,
                columnNumber: 7
            }, this),
            filteredDirectoryUsers.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "p-6 text-center text-gray-400",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__["Users"], {
                        size: 48,
                        className: "mx-auto mb-3 text-gray-600"
                    }, void 0, false, {
                        fileName: "[project]/src/components/admin/messages/UserDirectoryContent.tsx",
                        lineNumber: 111,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-lg mb-1",
                        children: "No users found"
                    }, void 0, false, {
                        fileName: "[project]/src/components/admin/messages/UserDirectoryContent.tsx",
                        lineNumber: 112,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm",
                        children: "Try adjusting your search or filter"
                    }, void 0, false, {
                        fileName: "[project]/src/components/admin/messages/UserDirectoryContent.tsx",
                        lineNumber: 113,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/admin/messages/UserDirectoryContent.tsx",
                lineNumber: 110,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: filterBy === 'all' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        filteredDirectoryUsers.filter((u)=>u.role === 'buyer').length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "px-4 py-2 bg-[#1a1a1a] border-b border-gray-800",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "text-sm font-medium text-blue-400 flex items-center gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__["User"], {
                                                size: 14
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/admin/messages/UserDirectoryContent.tsx",
                                                lineNumber: 123,
                                                columnNumber: 23
                                            }, this),
                                            "Buyers (",
                                            filteredDirectoryUsers.filter((u)=>u.role === 'buyer').length,
                                            ")"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/admin/messages/UserDirectoryContent.tsx",
                                        lineNumber: 122,
                                        columnNumber: 21
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/admin/messages/UserDirectoryContent.tsx",
                                    lineNumber: 121,
                                    columnNumber: 19
                                }, this),
                                filteredDirectoryUsers.filter((u)=>u.role === 'buyer').sort((a, b)=>a.username.localeCompare(b.username)).map((userInfo)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(UserListItem, {
                                        userInfo: userInfo
                                    }, "buyer-".concat(userInfo.username), false, {
                                        fileName: "[project]/src/components/admin/messages/UserDirectoryContent.tsx",
                                        lineNumber: 131,
                                        columnNumber: 23
                                    }, this))
                            ]
                        }, void 0, true),
                        filteredDirectoryUsers.filter((u)=>u.role === 'seller').length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "px-4 py-2 bg-[#1a1a1a] border-b border-gray-800",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "text-sm font-medium text-green-400 flex items-center gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bell$2d$ring$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BellRing$3e$__["BellRing"], {
                                                size: 14
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/admin/messages/UserDirectoryContent.tsx",
                                                lineNumber: 140,
                                                columnNumber: 23
                                            }, this),
                                            "Sellers (",
                                            filteredDirectoryUsers.filter((u)=>u.role === 'seller').length,
                                            ")"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/admin/messages/UserDirectoryContent.tsx",
                                        lineNumber: 139,
                                        columnNumber: 21
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/admin/messages/UserDirectoryContent.tsx",
                                    lineNumber: 138,
                                    columnNumber: 19
                                }, this),
                                filteredDirectoryUsers.filter((u)=>u.role === 'seller').sort((a, b)=>a.username.localeCompare(b.username)).map((userInfo)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(UserListItem, {
                                        userInfo: userInfo
                                    }, "seller-".concat(userInfo.username), false, {
                                        fileName: "[project]/src/components/admin/messages/UserDirectoryContent.tsx",
                                        lineNumber: 148,
                                        columnNumber: 23
                                    }, this))
                            ]
                        }, void 0, true)
                    ]
                }, void 0, true) : filteredDirectoryUsers.sort((a, b)=>a.username.localeCompare(b.username)).map((userInfo)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(UserListItem, {
                        userInfo: userInfo
                    }, userInfo.username, false, {
                        fileName: "[project]/src/components/admin/messages/UserDirectoryContent.tsx",
                        lineNumber: 156,
                        columnNumber: 34
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/components/admin/messages/UserDirectoryContent.tsx",
                lineNumber: 116,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/admin/messages/UserDirectoryContent.tsx",
        lineNumber: 95,
        columnNumber: 5
    }, this);
}
_s(UserDirectoryContent, "QQA5zxAMumJRcf48ZR3WKuhAflg=");
_c = UserDirectoryContent;
var _c;
__turbopack_context__.k.register(_c, "UserDirectoryContent");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/messaging/ImagePreviewModal.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/components/messaging/ImagePreviewModal.tsx
__turbopack_context__.s({
    "default": ()=>__TURBOPACK__default__export__
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
const ImagePreviewModal = (param)=>{
    let { imageUrl, isOpen, onClose } = param;
    _s();
    // Close on Escape
    const handleKeyDown = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ImagePreviewModal.useCallback[handleKeyDown]": (e)=>{
            if (e.key === 'Escape') onClose();
        }
    }["ImagePreviewModal.useCallback[handleKeyDown]"], [
        onClose
    ]);
    // Prevent background scroll while open + add key listener
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ImagePreviewModal.useEffect": ()=>{
            if (!isOpen) return;
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
            return ({
                "ImagePreviewModal.useEffect": ()=>{
                    document.body.style.overflow = '';
                    window.removeEventListener('keydown', handleKeyDown);
                }
            })["ImagePreviewModal.useEffect"];
        }
    }["ImagePreviewModal.useEffect"], [
        isOpen,
        handleKeyDown
    ]);
    if (!isOpen) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 z-50 flex items-center justify-center bg-black/75",
        onClick: onClose,
        role: "dialog",
        "aria-modal": "true",
        "aria-label": "Image preview",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative max-w-[90vw] max-h-[90vh] outline-none",
            onClick: (e)=>e.stopPropagation(),
            tabIndex: -1,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: onClose,
                    className: "absolute -top-4 -right-4 bg-red-500 text-white rounded-full p-2 shadow-lg",
                    "aria-label": "Close preview",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                        size: 20
                    }, void 0, false, {
                        fileName: "[project]/src/components/messaging/ImagePreviewModal.tsx",
                        lineNumber: 57,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/src/components/messaging/ImagePreviewModal.tsx",
                    lineNumber: 52,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                imageUrl ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                    src: imageUrl,
                    alt: "Full size preview",
                    className: "max-w-full max-h-[90vh] object-contain rounded-lg",
                    draggable: false
                }, void 0, false, {
                    fileName: "[project]/src/components/messaging/ImagePreviewModal.tsx",
                    lineNumber: 61,
                    columnNumber: 11
                }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-full max-h-[90vh] p-8 bg-[#1a1a1a] text-gray-400 rounded-lg",
                    children: "Image unavailable"
                }, void 0, false, {
                    fileName: "[project]/src/components/messaging/ImagePreviewModal.tsx",
                    lineNumber: 68,
                    columnNumber: 11
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/messaging/ImagePreviewModal.tsx",
            lineNumber: 47,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/src/components/messaging/ImagePreviewModal.tsx",
        lineNumber: 40,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(ImagePreviewModal, "0JgXOssVubdPSer79HeWAJtecaU=");
_c = ImagePreviewModal;
const __TURBOPACK__default__export__ = ImagePreviewModal;
var _c;
__turbopack_context__.k.register(_c, "ImagePreviewModal");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/admin/messages/EmojiPicker.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": ()=>EmojiPicker
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/index.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/storage.service.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
// Flat emoji list (trimmed for brevity in this snippet)
const ALL_EMOJIS = [
    '😀',
    '😃',
    '😄',
    '😁',
    '😆',
    '😅',
    '😂',
    '🤣',
    '😊',
    '😇',
    '🙂',
    '🙃',
    '😉',
    '😌',
    '😍',
    '🥰',
    '😘',
    '😗',
    '😙',
    '😚',
    '😋',
    '😛',
    '😝',
    '😜',
    '😏',
    '😒',
    // ... keep your full list unchanged ...
    '🏴‍☠️'
];
function EmojiPicker(param) {
    let { onEmojiSelect, onClose } = param;
    _s();
    const [recentEmojis, setRecentEmojis] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const emojiPickerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Load recent
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "EmojiPicker.useEffect": ()=>{
            ({
                "EmojiPicker.useEffect": async ()=>{
                    try {
                        const stored = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_recent_emojis', []);
                        if (Array.isArray(stored)) {
                            setRecentEmojis(stored.slice(0, 30));
                        }
                    } catch (error) {
                        console.error('Failed to load recent emojis:', error);
                    }
                }
            })["EmojiPicker.useEffect"]();
        }
    }["EmojiPicker.useEffect"], []);
    // Save recent
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "EmojiPicker.useEffect": ()=>{
            if (recentEmojis.length === 0) return;
            ({
                "EmojiPicker.useEffect": async ()=>{
                    try {
                        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_recent_emojis', recentEmojis);
                    } catch (error) {
                        console.error('Failed to save recent emojis:', error);
                    }
                }
            })["EmojiPicker.useEffect"]();
        }
    }["EmojiPicker.useEffect"], [
        recentEmojis
    ]);
    // Close on outside click
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "EmojiPicker.useEffect": ()=>{
            const handleClickOutside = {
                "EmojiPicker.useEffect.handleClickOutside": (event)=>{
                    if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                        onClose();
                    }
                }
            }["EmojiPicker.useEffect.handleClickOutside"];
            document.addEventListener('mousedown', handleClickOutside);
            return ({
                "EmojiPicker.useEffect": ()=>document.removeEventListener('mousedown', handleClickOutside)
            })["EmojiPicker.useEffect"];
        }
    }["EmojiPicker.useEffect"], [
        onClose
    ]);
    const handleEmojiClick = (emoji)=>{
        onEmojiSelect(emoji);
        setRecentEmojis((prev)=>{
            const filtered = prev.filter((e)=>e !== emoji);
            return [
                emoji,
                ...filtered
            ].slice(0, 30);
        });
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: emojiPickerRef,
        className: "absolute left-0 right-0 mx-4 bottom-full mb-2 bg-black border border-gray-800 shadow-lg z-50 rounded-lg overflow-hidden",
        role: "dialog",
        "aria-label": "Emoji picker",
        children: [
            recentEmojis.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-3 pt-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-xs text-gray-400 mb-2",
                        children: "Recent"
                    }, void 0, false, {
                        fileName: "[project]/src/components/admin/messages/EmojiPicker.tsx",
                        lineNumber: 76,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-8 gap-1 mb-3",
                        children: recentEmojis.slice(0, 16).map((emoji, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>handleEmojiClick(emoji),
                                className: "flex items-center justify-center text-xl rounded-full w-10 h-10 bg-black hover:bg-[#222] transition-colors duration-150",
                                type: "button",
                                "aria-label": "Insert emoji ".concat(emoji),
                                children: emoji
                            }, "recent-".concat(emoji, "-").concat(index), false, {
                                fileName: "[project]/src/components/admin/messages/EmojiPicker.tsx",
                                lineNumber: 79,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/components/admin/messages/EmojiPicker.tsx",
                        lineNumber: 77,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/admin/messages/EmojiPicker.tsx",
                lineNumber: 75,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-3 pt-2 pb-3",
                children: [
                    recentEmojis.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-xs text-gray-400 mb-2",
                        children: "All Emojis"
                    }, void 0, false, {
                        fileName: "[project]/src/components/admin/messages/EmojiPicker.tsx",
                        lineNumber: 94,
                        columnNumber: 37
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-8 gap-1 p-0 overflow-auto",
                        style: {
                            maxHeight: 200
                        },
                        children: ALL_EMOJIS.map((emoji, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>handleEmojiClick(emoji),
                                className: "flex items-center justify-center text-xl rounded-full w-10 h-10 bg-black hover:bg-[#222] transition-colors duration-150",
                                type: "button",
                                "aria-label": "Insert emoji ".concat(emoji),
                                children: emoji
                            }, "emoji-".concat(emoji, "-").concat(index), false, {
                                fileName: "[project]/src/components/admin/messages/EmojiPicker.tsx",
                                lineNumber: 97,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/components/admin/messages/EmojiPicker.tsx",
                        lineNumber: 95,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/admin/messages/EmojiPicker.tsx",
                lineNumber: 93,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/admin/messages/EmojiPicker.tsx",
        lineNumber: 68,
        columnNumber: 5
    }, this);
}
_s(EmojiPicker, "65KtguantburatC2VLY5U7gerkI=");
_c = EmojiPicker;
var _c;
__turbopack_context__.k.register(_c, "EmojiPicker");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/admin/messages/ChatContent.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": ()=>ChatContent
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$arrow$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRightCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-arrow-right.js [app-client] (ecmascript) <export default as ArrowRightCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCheck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/check-check.js [app-client] (ecmascript) <export default as CheckCheck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$paperclip$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Paperclip$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/paperclip.js [app-client] (ecmascript) <export default as Paperclip>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$smile$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Smile$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/smile.js [app-client] (ecmascript) <export default as Smile>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Image$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/image.js [app-client] (ecmascript) <export default as Image>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldAlert$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shield-alert.js [app-client] (ecmascript) <export default as ShieldAlert>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/triangle-alert.js [app-client] (ecmascript) <export default as AlertTriangle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/clock.js [app-client] (ecmascript) <export default as Clock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$badge$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BadgeCheck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/badge-check.js [app-client] (ecmascript) <export default as BadgeCheck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/message-circle.js [app-client] (ecmascript) <export default as MessageCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$square$2d$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageSquarePlus$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/message-square-plus.js [app-client] (ecmascript) <export default as MessageSquarePlus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$messaging$2f$ImagePreviewModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/messaging/ImagePreviewModal.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2f$messages$2f$EmojiPicker$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/admin/messages/EmojiPicker.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/SecureInput.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/SecureMessageDisplay.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-client] (ecmascript) <locals>");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
;
;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
];
function ChatContent(param) {
    let { activeThread, activeMessages, userProfiles, content, setContent, selectedImage, setSelectedImage, isUserBlocked, isUserReported, onSend, onBlockToggle, onReport, onStartNewConversation, username } = param;
    var _userProfiles_activeThread, _userProfiles_activeThread1, _userProfiles_activeThread2, _userProfiles_activeThread3;
    _s();
    const [isImageLoading, setIsImageLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [imageError, setImageError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [previewImage, setPreviewImage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [showEmojiPicker, setShowEmojiPicker] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const fileInputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const messagesEndRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const inputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Scroll to bottom on new messages
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChatContent.useEffect": ()=>{
            var _messagesEndRef_current;
            (_messagesEndRef_current = messagesEndRef.current) === null || _messagesEndRef_current === void 0 ? void 0 : _messagesEndRef_current.scrollIntoView({
                behavior: 'smooth'
            });
        }
    }["ChatContent.useEffect"], [
        activeMessages
    ]);
    const getInitial = (name)=>name ? name.charAt(0).toUpperCase() : '?';
    const isSingleEmoji = (text)=>{
        // Robust single-emoji check
        try {
            const emojiRegex = RegExp("^(\\p{Emoji_Presentation}|\\p{Extended_Pictographic})(\\u200d(\\p{Emoji_Presentation}|\\p{Extended_Pictographic}))*$", "u");
            return !!text && emojiRegex.test(text.trim());
        } catch (e) {
            // Fallback if Unicode props unsupported
            return false;
        }
    };
    const handleImageSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ChatContent.useCallback[handleImageSelect]": (event)=>{
            var _event_target_files;
            const file = ((_event_target_files = event.target.files) === null || _event_target_files === void 0 ? void 0 : _event_target_files[0]) || null;
            setImageError(null);
            if (!file) return;
            const validation = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].validateFileUpload(file, {
                maxSize: MAX_IMAGE_SIZE,
                allowedTypes: ALLOWED_IMAGE_TYPES,
                allowedExtensions: [
                    'jpg',
                    'jpeg',
                    'png',
                    'gif',
                    'webp'
                ]
            });
            if (!validation.valid) {
                setImageError(validation.error || 'Invalid file');
                return;
            }
            setIsImageLoading(true);
            const reader = new FileReader();
            reader.onloadend = ({
                "ChatContent.useCallback[handleImageSelect]": ()=>{
                    setSelectedImage(reader.result);
                    setIsImageLoading(false);
                }
            })["ChatContent.useCallback[handleImageSelect]"];
            reader.onerror = ({
                "ChatContent.useCallback[handleImageSelect]": ()=>{
                    setImageError('Failed to read the image file. Please try again.');
                    setIsImageLoading(false);
                }
            })["ChatContent.useCallback[handleImageSelect]"];
            reader.readAsDataURL(file);
        }
    }["ChatContent.useCallback[handleImageSelect]"], [
        setSelectedImage
    ]);
    const triggerFileInput = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ChatContent.useCallback[triggerFileInput]": ()=>{
            var _fileInputRef_current;
            return (_fileInputRef_current = fileInputRef.current) === null || _fileInputRef_current === void 0 ? void 0 : _fileInputRef_current.click();
        }
    }["ChatContent.useCallback[triggerFileInput]"], []);
    const handleKeyDown = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ChatContent.useCallback[handleKeyDown]": (e)=>{
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSend();
            }
        }
    }["ChatContent.useCallback[handleKeyDown]"], [
        onSend
    ]);
    const handleEmojiSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ChatContent.useCallback[handleEmojiSelect]": (emoji)=>{
            var _inputRef_current;
            setContent({
                "ChatContent.useCallback[handleEmojiSelect]": (prev)=>"".concat(prev).concat(emoji)
            }["ChatContent.useCallback[handleEmojiSelect]"]);
            (_inputRef_current = inputRef.current) === null || _inputRef_current === void 0 ? void 0 : _inputRef_current.focus();
        }
    }["ChatContent.useCallback[handleEmojiSelect]"], [
        setContent
    ]);
    const sanitizedActiveThread = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ChatContent.useMemo[sanitizedActiveThread]": ()=>activeThread ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(activeThread) : null
    }["ChatContent.useMemo[sanitizedActiveThread]"], [
        activeThread
    ]);
    const sanitizedUsername = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ChatContent.useMemo[sanitizedUsername]": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(username)
    }["ChatContent.useMemo[sanitizedUsername]"], [
        username
    ]);
    if (!activeThread) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex-1 flex items-center justify-center text-gray-400",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center p-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex justify-center mb-4",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageCircle$3e$__["MessageCircle"], {
                            size: 64,
                            className: "text-gray-600"
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                            lineNumber: 156,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                        lineNumber: 155,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xl mb-2",
                        children: "Select a conversation to view messages"
                    }, void 0, false, {
                        fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                        lineNumber: 158,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm mb-4",
                        children: "Your messages will appear here"
                    }, void 0, false, {
                        fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                        lineNumber: 159,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: onStartNewConversation,
                        className: "px-4 py-2 bg-[#ff950e] text-black font-medium rounded-lg hover:bg-[#e88800] transition-colors flex items-center justify-center mx-auto",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$square$2d$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageSquarePlus$3e$__["MessageSquarePlus"], {
                                size: 16,
                                className: "mr-2"
                            }, void 0, false, {
                                fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                lineNumber: 164,
                                columnNumber: 13
                            }, this),
                            "Start New Conversation"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                        lineNumber: 160,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                lineNumber: 154,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
            lineNumber: 153,
            columnNumber: 7
        }, this);
    }
    const canSend = (!!content.trim() || !!selectedImage) && !isImageLoading;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-4 py-3 flex items-center justify-between border-b border-gray-800 bg-[#1a1a1a]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "relative w-10 h-10 rounded-full bg-[#333] flex items-center justify-center text-white font-bold mr-3 overflow-hidden shadow-md",
                                children: [
                                    ((_userProfiles_activeThread = userProfiles[activeThread]) === null || _userProfiles_activeThread === void 0 ? void 0 : _userProfiles_activeThread.pic) ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureImage"], {
                                        src: userProfiles[activeThread].pic,
                                        alt: sanitizedActiveThread || '',
                                        className: "w-full h-full object-cover"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                        lineNumber: 181,
                                        columnNumber: 15
                                    }, this) : getInitial(sanitizedActiveThread || ''),
                                    ((_userProfiles_activeThread1 = userProfiles[activeThread]) === null || _userProfiles_activeThread1 === void 0 ? void 0 : _userProfiles_activeThread1.verified) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "absolute bottom-0 right-0 bg-[#1a1a1a] p-0.5 rounded-full border border-[#ff950e] shadow-sm",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$badge$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BadgeCheck$3e$__["BadgeCheck"], {
                                            size: 12,
                                            className: "text-[#ff950e]"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                            lineNumber: 192,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                        lineNumber: 191,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                lineNumber: 179,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                className: "font-bold text-lg text-white",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureMessageDisplay"], {
                                                    content: sanitizedActiveThread || '',
                                                    allowBasicFormatting: false
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                                    lineNumber: 199,
                                                    columnNumber: 17
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                                lineNumber: 198,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs px-2 py-0.5 rounded bg-[#333] text-gray-300",
                                                children: ((_userProfiles_activeThread2 = userProfiles[activeThread]) === null || _userProfiles_activeThread2 === void 0 ? void 0 : _userProfiles_activeThread2.role) === 'buyer' ? 'Buyer' : ((_userProfiles_activeThread3 = userProfiles[activeThread]) === null || _userProfiles_activeThread3 === void 0 ? void 0 : _userProfiles_activeThread3.role) === 'seller' ? 'Seller' : 'User'
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                                lineNumber: 201,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                        lineNumber: 197,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs text-[#ff950e] flex items-center",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {
                                                size: 12,
                                                className: "mr-1 text-[#ff950e]"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                                lineNumber: 210,
                                                columnNumber: 15
                                            }, this),
                                            "Admin conversation"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                        lineNumber: 209,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                lineNumber: 196,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                        lineNumber: 178,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex space-x-2 text-white",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: onReport,
                                disabled: isUserReported,
                                className: "px-3 py-1 text-xs border rounded flex items-center ".concat(isUserReported ? 'text-gray-400 border-gray-500' : 'text-red-500 border-red-500 hover:bg-red-500/10', " transition-colors duration-150"),
                                "aria-disabled": isUserReported,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"], {
                                        size: 12,
                                        className: "mr-1"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                        lineNumber: 227,
                                        columnNumber: 13
                                    }, this),
                                    isUserReported ? 'Reported' : 'Report'
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                lineNumber: 217,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: onBlockToggle,
                                className: "px-3 py-1 text-xs border rounded flex items-center ".concat(isUserBlocked ? 'text-green-500 border-green-500 hover:bg-green-500/10' : 'text-red-500 border-red-500 hover:bg-red-500/10', " transition-colors duration-150"),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldAlert$3e$__["ShieldAlert"], {
                                        size: 12,
                                        className: "mr-1"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                        lineNumber: 238,
                                        columnNumber: 13
                                    }, this),
                                    isUserBlocked ? 'Unblock' : 'Block'
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                lineNumber: 230,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                        lineNumber: 216,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                lineNumber: 177,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 overflow-y-auto p-4 bg-[#121212]",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-3xl mx-auto space-y-4",
                    children: [
                        activeMessages.map((msg, index)=>{
                            var _msg_meta;
                            const isFromMe = msg.sender === username;
                            const time = new Date(msg.date).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                            const isSingleEmojiMsg = !!msg.content && isSingleEmoji(msg.content);
                            const sanitizedSender = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(msg.sender || '');
                            var _msg_meta_price;
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex ".concat(isFromMe ? 'justify-end' : 'justify-start'),
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "rounded-lg p-3 max-w-[75%] ".concat(isFromMe ? 'bg-[#ff950e] text-white shadow-lg' : 'bg-[#333] text-white shadow-md'),
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center text-xs mb-1",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: isFromMe ? 'text-white/75' : 'text-gray-300',
                                                    children: [
                                                        isFromMe ? 'You' : sanitizedSender,
                                                        " • ",
                                                        time
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                                    lineNumber: 262,
                                                    columnNumber: 21
                                                }, this),
                                                isFromMe && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "ml-2 text-[10px]",
                                                    children: msg.read ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "flex items-center ".concat(isFromMe ? 'text-white/75' : 'text-gray-400'),
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCheck$3e$__["CheckCheck"], {
                                                                size: 12,
                                                                className: "mr-1"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                                                lineNumber: 269,
                                                                columnNumber: 29
                                                            }, this),
                                                            " Read"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                                        lineNumber: 268,
                                                        columnNumber: 27
                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: isFromMe ? 'text-white/60' : 'text-gray-400',
                                                        children: "Sent"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                                        lineNumber: 272,
                                                        columnNumber: 27
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                                    lineNumber: 266,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                            lineNumber: 261,
                                            columnNumber: 19
                                        }, this),
                                        msg.type === 'image' && ((_msg_meta = msg.meta) === null || _msg_meta === void 0 ? void 0 : _msg_meta.imageUrl) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "mt-1 mb-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureImage"], {
                                                    src: msg.meta.imageUrl,
                                                    alt: "Shared image",
                                                    className: "max-w-full rounded cursor-pointer hover:opacity-90 transition-opacity shadow-sm",
                                                    onClick: (e)=>{
                                                        var _msg_meta;
                                                        e.stopPropagation();
                                                        setPreviewImage(((_msg_meta = msg.meta) === null || _msg_meta === void 0 ? void 0 : _msg_meta.imageUrl) || null);
                                                    }
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                                    lineNumber: 281,
                                                    columnNumber: 23
                                                }, this),
                                                msg.content && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "mt-2 ".concat(isSingleEmojiMsg ? 'text-3xl' : ''),
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureMessageDisplay"], {
                                                        content: msg.content,
                                                        allowBasicFormatting: false,
                                                        className: "text-white"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                                        lineNumber: 292,
                                                        columnNumber: 27
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                                    lineNumber: 291,
                                                    columnNumber: 25
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                            lineNumber: 280,
                                            columnNumber: 21
                                        }, this),
                                        msg.type !== 'image' && msg.type !== 'customRequest' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: isSingleEmojiMsg ? 'text-3xl' : '',
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureMessageDisplay"], {
                                                content: msg.content || '',
                                                allowBasicFormatting: false,
                                                className: "text-white"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                                lineNumber: 301,
                                                columnNumber: 23
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                            lineNumber: 300,
                                            columnNumber: 21
                                        }, this),
                                        msg.type === 'customRequest' && msg.meta && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "mt-2 text-sm text-orange-400 space-y-1 border-t border-white/20 pt-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "font-semibold flex items-center",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$paperclip$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Paperclip$3e$__["Paperclip"], {
                                                            size: 16,
                                                            className: "mr-1"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                                            lineNumber: 309,
                                                            columnNumber: 25
                                                        }, this),
                                                        "Custom Request"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                                    lineNumber: 308,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                                            children: "Title:"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                                            lineNumber: 313,
                                                            columnNumber: 25
                                                        }, this),
                                                        " ",
                                                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(msg.meta.title || '')
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                                    lineNumber: 312,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                                            children: "Price:"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                                            lineNumber: 316,
                                                            columnNumber: 25
                                                        }, this),
                                                        " $",
                                                        Number((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeCurrency"])((_msg_meta_price = msg.meta.price) !== null && _msg_meta_price !== void 0 ? _msg_meta_price : 0)).toFixed(2)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                                    lineNumber: 315,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                                            children: "Tags:"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                                            lineNumber: 320,
                                                            columnNumber: 25
                                                        }, this),
                                                        " ",
                                                        (msg.meta.tags || []).map((tag)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(tag)).join(', ')
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                                    lineNumber: 319,
                                                    columnNumber: 23
                                                }, this),
                                                msg.meta.message && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                                            children: "Message:"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                                            lineNumber: 324,
                                                            columnNumber: 27
                                                        }, this),
                                                        ' ',
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureMessageDisplay"], {
                                                            content: msg.meta.message,
                                                            allowBasicFormatting: false,
                                                            className: "inline text-orange-400"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                                            lineNumber: 325,
                                                            columnNumber: 27
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                                    lineNumber: 323,
                                                    columnNumber: 25
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                            lineNumber: 307,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                    lineNumber: 255,
                                    columnNumber: 17
                                }, this)
                            }, "".concat(msg.id || 'm', "-").concat(index), false, {
                                fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                lineNumber: 254,
                                columnNumber: 15
                            }, this);
                        }),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            ref: messagesEndRef
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                            lineNumber: 335,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                    lineNumber: 246,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                lineNumber: 245,
                columnNumber: 7
            }, this),
            !isUserBlocked && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative border-t border-gray-800 bg-[#1a1a1a]",
                children: [
                    showEmojiPicker && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2f$messages$2f$EmojiPicker$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        onEmojiSelect: handleEmojiSelect,
                        onClose: ()=>setShowEmojiPicker(false)
                    }, void 0, false, {
                        fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                        lineNumber: 342,
                        columnNumber: 31
                    }, this),
                    selectedImage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "px-4 pt-3 pb-2",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "relative inline-block",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureImage"], {
                                    src: selectedImage,
                                    alt: "Preview",
                                    className: "max-h-20 rounded shadow-md"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                    lineNumber: 348,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>{
                                        setSelectedImage(null);
                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                    },
                                    className: "absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs shadow-md transform transition-transform hover:scale-110",
                                    style: {
                                        width: 20,
                                        height: 20,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    },
                                    "aria-label": "Remove attached image",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                        size: 14
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                        lineNumber: 358,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                    lineNumber: 349,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                            lineNumber: 347,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                        lineNumber: 346,
                        columnNumber: 13
                    }, this),
                    isImageLoading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "px-4 pt-3 pb-0 text-sm text-gray-400",
                        role: "status",
                        "aria-live": "polite",
                        children: "Loading image..."
                    }, void 0, false, {
                        fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                        lineNumber: 366,
                        columnNumber: 13
                    }, this),
                    imageError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "px-4 pt-3 pb-0 text-sm text-red-400 flex items-center",
                        role: "alert",
                        "aria-live": "assertive",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"], {
                                size: 14,
                                className: "mr-1"
                            }, void 0, false, {
                                fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                lineNumber: 372,
                                columnNumber: 15
                            }, this),
                            imageError
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                        lineNumber: 371,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "px-4 py-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "relative mb-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureTextarea"], {
                                        ref: inputRef,
                                        value: content,
                                        onChange: setContent,
                                        onKeyDown: handleKeyDown,
                                        placeholder: selectedImage ? 'Add a caption...' : 'Type a message',
                                        className: "w-full p-3 pr-12 rounded-lg bg-[#222] border border-gray-700 text-white focus:outline-none focus:ring-1 focus:ring-[#ff950e] min-h-[40px] max-h-20 resize-none overflow-auto leading-tight",
                                        rows: 1,
                                        maxLength: 250,
                                        characterCount: false,
                                        sanitize: true
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                        lineNumber: 380,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: (e)=>{
                                            e.stopPropagation();
                                            setShowEmojiPicker((v)=>!v);
                                        },
                                        className: "absolute right-3 top-1/2 -translate-y-1/2 mt-[-4px] flex items-center justify-center h-8 w-8 rounded-full ".concat(showEmojiPicker ? 'bg-[#ff950e] text-black' : 'text-[#ff950e] hover:bg-[#333]', " transition-colors duration-150"),
                                        title: "Emoji",
                                        type: "button",
                                        "aria-pressed": showEmojiPicker,
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$smile$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Smile$3e$__["Smile"], {
                                            size: 20,
                                            className: "flex-shrink-0"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                            lineNumber: 406,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                        lineNumber: 394,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                lineNumber: 379,
                                columnNumber: 13
                            }, this),
                            content.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-xs text-gray-400 mb-2 text-right",
                                children: [
                                    content.length,
                                    "/250"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                lineNumber: 410,
                                columnNumber: 36
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-between items-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: (e)=>{
                                                    e.stopPropagation();
                                                    triggerFileInput();
                                                },
                                                disabled: isImageLoading,
                                                className: "w-[52px] h-[52px] flex items-center justify-center rounded-full shadow-md ".concat(isImageLoading ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-[#ff950e] text-black hover:bg-[#e88800]', " transition-colors duration-150"),
                                                title: "Attach Image",
                                                "aria-label": "Attach Image",
                                                type: "button",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Image$3e$__["Image"], {
                                                    size: 26
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                                    lineNumber: 428,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                                lineNumber: 415,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: (e)=>{
                                                    e.stopPropagation();
                                                    setShowEmojiPicker((v)=>!v);
                                                },
                                                className: "md:hidden w-[52px] h-[52px] flex items-center justify-center rounded-full shadow-md text-black text-2xl ".concat(showEmojiPicker ? 'bg-[#e88800]' : 'bg-[#ff950e] hover:bg-[#e88800]', " transition-colors duration-150"),
                                                title: "Emoji",
                                                "aria-label": "Emoji",
                                                type: "button",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$smile$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Smile$3e$__["Smile"], {
                                                    size: 26
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                                    lineNumber: 443,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                                lineNumber: 431,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "file",
                                                accept: ALLOWED_IMAGE_TYPES.join(','),
                                                ref: fileInputRef,
                                                style: {
                                                    display: 'none'
                                                },
                                                onChange: handleImageSelect
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                                lineNumber: 446,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                        lineNumber: 414,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: (e)=>{
                                            e.stopPropagation();
                                            onSend();
                                        },
                                        disabled: !canSend,
                                        className: "flex items-center justify-center px-5 py-2 rounded-full ".concat(canSend ? 'bg-[#ff950e] text-black hover:bg-[#e88800]' : 'bg-[#c17200] cursor-not-allowed text-gray-300', " transition-colors duration-150 shadow-md"),
                                        type: "button",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "mr-1",
                                                children: "Send"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                                lineNumber: 466,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$arrow$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRightCircle$3e$__["ArrowRightCircle"], {
                                                size: 16,
                                                className: "flex-shrink-0"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                                lineNumber: 467,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                        lineNumber: 455,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                                lineNumber: 413,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                        lineNumber: 378,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                lineNumber: 341,
                columnNumber: 9
            }, this),
            isUserBlocked && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "p-4 border-t border-gray-800 text-center text-sm text-red-400 bg-[#1a1a1a] flex items-center justify-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldAlert$3e$__["ShieldAlert"], {
                        size: 16,
                        className: "mr-2"
                    }, void 0, false, {
                        fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                        lineNumber: 476,
                        columnNumber: 11
                    }, this),
                    "You have blocked this user",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: (e)=>{
                            e.stopPropagation();
                            onBlockToggle();
                        },
                        className: "ml-2 underline text-gray-400 hover:text-white transition-colors duration-150",
                        children: "Unblock"
                    }, void 0, false, {
                        fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                        lineNumber: 478,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                lineNumber: 475,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$messaging$2f$ImagePreviewModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                imageUrl: previewImage || '',
                isOpen: !!previewImage,
                onClose: ()=>setPreviewImage(null)
            }, void 0, false, {
                fileName: "[project]/src/components/admin/messages/ChatContent.tsx",
                lineNumber: 490,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
_s(ChatContent, "BN/gao/e2MsKUzIShcEcMhy0+fA=");
_c = ChatContent;
var _c;
__turbopack_context__.k.register(_c, "ChatContent");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/app/admin/messages/page.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": ()=>AdminMessagesPage
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$RequireAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/RequireAuth.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useAdminMessages$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useAdminMessages.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2f$messages$2f$MessagesHeader$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/admin/messages/MessagesHeader.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2f$messages$2f$ConversationsContent$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/admin/messages/ConversationsContent.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2f$messages$2f$UserDirectoryContent$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/admin/messages/UserDirectoryContent.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2f$messages$2f$ChatContent$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/admin/messages/ChatContent.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/triangle-alert.js [app-client] (ecmascript) <export default as AlertTriangle>");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
;
function AdminMessagesPage() {
    _s();
    const { // Auth & Users
    // user, // unused
    isAdmin, username, // Collections
    allUsers, // Messages & Threads
    threads, unreadCounts, lastMessages, userProfiles, activeMessages, totalUnreadCount, // State
    content, setContent, activeThread, searchQuery, setSearchQuery, selectedImage, setSelectedImage, filterBy, setFilterBy, showUserDirectory, setShowUserDirectory, directorySearchQuery, setDirectorySearchQuery, // Computed
    isUserBlocked, isUserReported, // Handlers
    handleSend, handleBlockToggle, handleReport, handleThreadSelect, handleStartConversation } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useAdminMessages$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAdminMessages"])();
    // Render access denied if not admin
    if (!isAdmin) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$RequireAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
            role: "admin",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "h-screen flex items-center justify-center bg-black",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-[#121212] rounded-lg shadow-lg p-8 max-w-md",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center mb-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"], {
                                    size: 32,
                                    className: "text-[#ff950e] mr-3"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/admin/messages/page.tsx",
                                    lineNumber: 63,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                    className: "text-2xl font-bold text-[#ff950e]",
                                    children: "Access Denied"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/admin/messages/page.tsx",
                                    lineNumber: 64,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/admin/messages/page.tsx",
                            lineNumber: 62,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-gray-300",
                            children: "Only admin users can access this page."
                        }, void 0, false, {
                            fileName: "[project]/src/app/admin/messages/page.tsx",
                            lineNumber: 66,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-gray-400 text-sm mt-2",
                            children: "Please log in with an admin account."
                        }, void 0, false, {
                            fileName: "[project]/src/app/admin/messages/page.tsx",
                            lineNumber: 67,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/admin/messages/page.tsx",
                    lineNumber: 61,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/admin/messages/page.tsx",
                lineNumber: 60,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/admin/messages/page.tsx",
            lineNumber: 59,
            columnNumber: 7
        }, this);
    }
    // Defensive fallbacks to prevent undefined-prop crashes in child components
    const safeThreads = threads !== null && threads !== void 0 ? threads : [];
    const safeUnreadCounts = unreadCounts !== null && unreadCounts !== void 0 ? unreadCounts : {};
    const safeLastMessages = lastMessages !== null && lastMessages !== void 0 ? lastMessages : {};
    const safeUserProfiles = userProfiles !== null && userProfiles !== void 0 ? userProfiles : {};
    const safeActiveMessages = activeMessages !== null && activeMessages !== void 0 ? activeMessages : [];
    const safeUsername = username !== null && username !== void 0 ? username : '';
    const safeAllUsers = allUsers !== null && allUsers !== void 0 ? allUsers : [];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$RequireAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
        role: "admin",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "py-3 bg-black"
            }, void 0, false, {
                fileName: "[project]/src/app/admin/messages/page.tsx",
                lineNumber: 85,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "h-screen bg-black flex flex-col overflow-hidden",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1 flex flex-col md:flex-row max-w-6xl mx-auto w-full bg-[#121212] rounded-lg shadow-lg overflow-hidden",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-full md:w-1/3 border-r border-gray-800 flex flex-col bg-[#121212]",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2f$messages$2f$MessagesHeader$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        filterBy: filterBy,
                                        setFilterBy: setFilterBy,
                                        totalUnreadCount: totalUnreadCount !== null && totalUnreadCount !== void 0 ? totalUnreadCount : 0,
                                        showUserDirectory: showUserDirectory,
                                        setShowUserDirectory: setShowUserDirectory,
                                        searchQuery: searchQuery !== null && searchQuery !== void 0 ? searchQuery : '',
                                        setSearchQuery: setSearchQuery,
                                        directorySearchQuery: directorySearchQuery !== null && directorySearchQuery !== void 0 ? directorySearchQuery : '',
                                        setDirectorySearchQuery: setDirectorySearchQuery
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/admin/messages/page.tsx",
                                        lineNumber: 91,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex-1 overflow-y-auto bg-[#121212]",
                                        children: showUserDirectory ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2f$messages$2f$UserDirectoryContent$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            allUsers: safeAllUsers,
                                            directorySearchQuery: directorySearchQuery !== null && directorySearchQuery !== void 0 ? directorySearchQuery : '',
                                            filterBy: filterBy,
                                            onStartConversation: handleStartConversation,
                                            onClearFilters: ()=>{
                                                setDirectorySearchQuery('');
                                                setFilterBy('all');
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/admin/messages/page.tsx",
                                            lineNumber: 106,
                                            columnNumber: 17
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2f$messages$2f$ConversationsContent$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            threads: safeThreads,
                                            lastMessages: safeLastMessages,
                                            unreadCounts: safeUnreadCounts,
                                            userProfiles: safeUserProfiles,
                                            activeThread: activeThread,
                                            searchQuery: searchQuery !== null && searchQuery !== void 0 ? searchQuery : '',
                                            filterBy: filterBy,
                                            onThreadSelect: handleThreadSelect,
                                            onStartNewConversation: ()=>setShowUserDirectory(true)
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/admin/messages/page.tsx",
                                            lineNumber: 117,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/admin/messages/page.tsx",
                                        lineNumber: 104,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/admin/messages/page.tsx",
                                lineNumber: 90,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-full md:w-2/3 flex flex-col bg-[#121212]",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2f$messages$2f$ChatContent$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    activeThread: activeThread,
                                    activeMessages: safeActiveMessages,
                                    userProfiles: safeUserProfiles,
                                    content: content,
                                    setContent: setContent,
                                    selectedImage: selectedImage,
                                    setSelectedImage: setSelectedImage,
                                    isUserBlocked: isUserBlocked,
                                    isUserReported: isUserReported,
                                    onSend: handleSend,
                                    onBlockToggle: handleBlockToggle,
                                    onReport: handleReport,
                                    onStartNewConversation: ()=>setShowUserDirectory(true),
                                    username: safeUsername
                                }, void 0, false, {
                                    fileName: "[project]/src/app/admin/messages/page.tsx",
                                    lineNumber: 134,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/admin/messages/page.tsx",
                                lineNumber: 133,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/admin/messages/page.tsx",
                        lineNumber: 88,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "py-6 bg-black"
                    }, void 0, false, {
                        fileName: "[project]/src/app/admin/messages/page.tsx",
                        lineNumber: 154,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/admin/messages/page.tsx",
                lineNumber: 87,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/admin/messages/page.tsx",
        lineNumber: 84,
        columnNumber: 5
    }, this);
}
_s(AdminMessagesPage, "iOG+YXDeV5yKC6FcdCfJtEByFhw=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useAdminMessages$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAdminMessages"]
    ];
});
_c = AdminMessagesPage;
var _c;
__turbopack_context__.k.register(_c, "AdminMessagesPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=src_bfdc2c2f._.js.map