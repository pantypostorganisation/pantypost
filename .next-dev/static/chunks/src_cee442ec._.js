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
"[project]/src/utils/myListingsUtils.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/utils/myListingsUtils.ts
__turbopack_context__.s({
    "INITIAL_FORM_STATE": ()=>INITIAL_FORM_STATE,
    "calculateAuctionEndTime": ()=>calculateAuctionEndTime,
    "formatPrice": ()=>formatPrice,
    "formatTimeRemaining": ()=>formatTimeRemaining,
    "getListingTypeColor": ()=>getListingTypeColor,
    "getListingTypeLabel": ()=>getListingTypeLabel,
    "getTimeRemaining": ()=>getTimeRemaining,
    "parseTags": ()=>parseTags,
    "timeSinceListed": ()=>timeSinceListed,
    "validateListingForm": ()=>validateListingForm
});
const INITIAL_FORM_STATE = {
    title: '',
    description: '',
    price: '',
    imageUrls: [],
    isPremium: false,
    tags: '',
    hoursWorn: '',
    isAuction: false,
    startingPrice: '',
    reservePrice: '',
    auctionDuration: '3'
};
const calculateAuctionEndTime = (duration)=>{
    const days = parseFloat(duration); // Use parseFloat instead of parseInt
    const endTime = new Date();
    // Convert days to milliseconds and add to current time
    const millisecondsToAdd = days * 24 * 60 * 60 * 1000;
    endTime.setTime(endTime.getTime() + millisecondsToAdd);
    return endTime.toISOString();
};
const formatPrice = (price)=>{
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(price);
};
const getTimeRemaining = (endTime)=>{
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) {
        return {
            days: 0,
            hours: 0,
            minutes: 0,
            ended: true
        };
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff % (1000 * 60 * 60 * 24) / (1000 * 60 * 60));
    const minutes = Math.floor(diff % (1000 * 60 * 60) / (1000 * 60));
    return {
        days,
        hours,
        minutes,
        ended: false
    };
};
const validateListingForm = (formState, isVerified)=>{
    const { title, description, imageUrls, isAuction, startingPrice, price } = formState;
    if (!title || !description || imageUrls.length === 0) {
        return {
            isValid: false,
            error: 'Please fill in all required fields and add at least one image.'
        };
    }
    if (isAuction) {
        if (!isVerified) {
            return {
                isValid: false,
                error: 'You must be a verified seller to create auction listings.'
            };
        }
        const startingBid = parseFloat(startingPrice);
        if (isNaN(startingBid) || startingBid <= 0) {
            return {
                isValid: false,
                error: 'Please enter a valid starting bid for the auction.'
            };
        }
    } else {
        const numericPrice = parseFloat(price);
        if (isNaN(numericPrice) || numericPrice <= 0) {
            return {
                isValid: false,
                error: 'Please enter a valid price.'
            };
        }
    }
    return {
        isValid: true
    };
};
const parseTags = (tagsString)=>{
    return tagsString.split(',').map((tag)=>tag.trim()).filter((tag)=>tag.length > 0);
};
const getListingTypeLabel = (listing)=>{
    if (listing.auction) return 'Auction';
    if (listing.isPremium) return 'Premium';
    return 'Standard';
};
const getListingTypeColor = (listing)=>{
    if (listing.auction) return 'text-purple-500 border-purple-500';
    if (listing.isPremium) return 'text-yellow-500 border-yellow-500';
    return 'text-green-500 border-green-500';
};
const timeSinceListed = (createdAt)=>{
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (minutes < 60) {
        return "".concat(minutes, " minute").concat(minutes !== 1 ? 's' : '', " ago");
    } else if (hours < 24) {
        return "".concat(hours, " hour").concat(hours !== 1 ? 's' : '', " ago");
    } else {
        return "".concat(days, " day").concat(days !== 1 ? 's' : '', " ago");
    }
};
const formatTimeRemaining = (endTime)=>{
    const { days, hours, minutes, ended } = getTimeRemaining(endTime);
    if (ended) {
        return 'Ended';
    }
    if (days > 0) {
        return "".concat(days, "d ").concat(hours, "h");
    } else if (hours > 0) {
        return "".concat(hours, "h ").concat(minutes, "m");
    } else {
        return "".concat(minutes, "m");
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/myListings/ListingCard.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": ()=>ListingCard
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/eye.js [app-client] (ecmascript) <export default as Eye>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2d$pen$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Edit$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/square-pen.js [app-client] (ecmascript) <export default as Edit>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trash-2.js [app-client] (ecmascript) <export default as Trash2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$gavel$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Gavel$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/gavel.js [app-client] (ecmascript) <export default as Gavel>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$crown$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Crown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/crown.js [app-client] (ecmascript) <export default as Crown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/clock.js [app-client] (ecmascript) <export default as Clock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/calendar.js [app-client] (ecmascript) <export default as Calendar>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$myListingsUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/myListingsUtils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/SecureMessageDisplay.tsx [app-client] (ecmascript)");
'use client';
;
;
;
;
function ListingCard(param) {
    let { listing, analytics, onEdit, onDelete, onCancelAuction } = param;
    var _listing_imageUrls, _listing_auction_bids, _listing_auction_bids1, _listing_auction;
    const isAuctionListing = !!listing.auction;
    var _listing_imageUrls_;
    const cover = (_listing_imageUrls_ = (_listing_imageUrls = listing.imageUrls) === null || _listing_imageUrls === void 0 ? void 0 : _listing_imageUrls[0]) !== null && _listing_imageUrls_ !== void 0 ? _listing_imageUrls_ : '';
    const currentBid = (()=>{
        if (!isAuctionListing || !listing.auction) return null;
        const bid = typeof listing.auction.highestBid === 'number' && listing.auction.highestBid > 0 ? listing.auction.highestBid : listing.auction.startingPrice;
        return "$".concat(Number(bid).toFixed(2));
    })();
    var _listing_auction_bids_length;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "border rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition relative flex flex-col h-full ".concat(isAuctionListing ? 'border-purple-700 bg-black' : listing.isPremium ? 'border-[#ff950e] bg-black' : 'border-gray-700 bg-black'),
        children: [
            isAuctionListing && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute top-4 right-4 z-10",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "bg-purple-600 text-white text-xs px-3 py-1.5 rounded-full font-bold flex items-center shadow",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$gavel$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Gavel$3e$__["Gavel"], {
                            className: "w-4 h-4 mr-1"
                        }, void 0, false, {
                            fileName: "[project]/src/components/myListings/ListingCard.tsx",
                            lineNumber: 37,
                            columnNumber: 13
                        }, this),
                        " Auction"
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/myListings/ListingCard.tsx",
                    lineNumber: 36,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/myListings/ListingCard.tsx",
                lineNumber: 35,
                columnNumber: 9
            }, this),
            !isAuctionListing && listing.isPremium && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute top-4 right-4 z-10",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "bg-[#ff950e] text-black text-xs px-3 py-1.5 rounded-full font-bold flex items-center shadow",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$crown$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Crown$3e$__["Crown"], {
                            className: "w-4 h-4 mr-1"
                        }, void 0, false, {
                            fileName: "[project]/src/components/myListings/ListingCard.tsx",
                            lineNumber: 45,
                            columnNumber: 13
                        }, this),
                        " Premium"
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/myListings/ListingCard.tsx",
                    lineNumber: 44,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/myListings/ListingCard.tsx",
                lineNumber: 43,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative w-full h-48 sm:h-56 overflow-hidden",
                children: cover ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureImage"], {
                    src: cover,
                    alt: listing.title,
                    className: "w-full h-full object-cover"
                }, void 0, false, {
                    fileName: "[project]/src/components/myListings/ListingCard.tsx",
                    lineNumber: 52,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-full h-full bg-gray-800"
                }, void 0, false, {
                    fileName: "[project]/src/components/myListings/ListingCard.tsx",
                    lineNumber: 54,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/myListings/ListingCard.tsx",
                lineNumber: 50,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "p-5 flex flex-col flex-grow",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "text-xl font-bold text-white mb-2",
                        children: listing.title
                    }, void 0, false, {
                        fileName: "[project]/src/components/myListings/ListingCard.tsx",
                        lineNumber: 59,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-gray-400 text-sm mb-3 line-clamp-2 flex-grow",
                        children: listing.description
                    }, void 0, false, {
                        fileName: "[project]/src/components/myListings/ListingCard.tsx",
                        lineNumber: 60,
                        columnNumber: 9
                    }, this),
                    listing.tags && listing.tags.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-wrap gap-2 mt-auto mb-3",
                        children: listing.tags.map((tag, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "bg-gray-700 text-gray-300 text-xs px-2.5 py-1 rounded-full",
                                children: tag
                            }, idx, false, {
                                fileName: "[project]/src/components/myListings/ListingCard.tsx",
                                lineNumber: 65,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/components/myListings/ListingCard.tsx",
                        lineNumber: 63,
                        columnNumber: 11
                    }, this),
                    isAuctionListing && listing.auction && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-purple-900/20 rounded-lg p-3 mb-3 border border-purple-800",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-between items-center mb-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-sm text-purple-300 flex items-center gap-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$gavel$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Gavel$3e$__["Gavel"], {
                                                className: "w-3 h-3"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/myListings/ListingCard.tsx",
                                                lineNumber: 76,
                                                columnNumber: 17
                                            }, this),
                                            " Current Bid:"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/myListings/ListingCard.tsx",
                                        lineNumber: 75,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "font-bold text-white",
                                        children: currentBid
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/myListings/ListingCard.tsx",
                                        lineNumber: 78,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/myListings/ListingCard.tsx",
                                lineNumber: 74,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-between items-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-sm text-purple-300 flex items-center gap-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__["Calendar"], {
                                                className: "w-3 h-3"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/myListings/ListingCard.tsx",
                                                lineNumber: 82,
                                                columnNumber: 17
                                            }, this),
                                            " Ends:"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/myListings/ListingCard.tsx",
                                        lineNumber: 81,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-sm text-white",
                                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$myListingsUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatTimeRemaining"])(listing.auction.endTime)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/myListings/ListingCard.tsx",
                                        lineNumber: 84,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/myListings/ListingCard.tsx",
                                lineNumber: 80,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-xs text-gray-400 mt-1",
                                children: [
                                    (_listing_auction_bids_length = (_listing_auction_bids = listing.auction.bids) === null || _listing_auction_bids === void 0 ? void 0 : _listing_auction_bids.length) !== null && _listing_auction_bids_length !== void 0 ? _listing_auction_bids_length : 0,
                                    " ",
                                    ((_listing_auction_bids1 = listing.auction.bids) === null || _listing_auction_bids1 === void 0 ? void 0 : _listing_auction_bids1.length) === 1 ? 'bid' : 'bids',
                                    " placed"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/myListings/ListingCard.tsx",
                                lineNumber: 86,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/myListings/ListingCard.tsx",
                        lineNumber: 73,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between text-sm text-gray-400 bg-gray-800 rounded-lg p-3 mt-auto",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "flex items-center gap-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__["Eye"], {
                                        className: "w-4 h-4 text-[#ff950e]"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/myListings/ListingCard.tsx",
                                        lineNumber: 94,
                                        columnNumber: 13
                                    }, this),
                                    " ",
                                    analytics.views,
                                    " views"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/myListings/ListingCard.tsx",
                                lineNumber: 93,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "flex items-center gap-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {
                                        className: "w-4 h-4 text-gray-500"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/myListings/ListingCard.tsx",
                                        lineNumber: 97,
                                        columnNumber: 13
                                    }, this),
                                    " ",
                                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$myListingsUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["timeSinceListed"])(listing.date)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/myListings/ListingCard.tsx",
                                lineNumber: 96,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/myListings/ListingCard.tsx",
                        lineNumber: 92,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex justify-between items-center mt-4 pt-4 border-t border-gray-700",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "font-bold text-xl ".concat(isAuctionListing ? 'text-purple-400' : 'text-[#ff950e]'),
                                children: isAuctionListing && listing.auction ? "$".concat(Number(listing.auction.startingPrice).toFixed(2), " start") : "$".concat(Number(listing.price).toFixed(2))
                            }, void 0, false, {
                                fileName: "[project]/src/components/myListings/ListingCard.tsx",
                                lineNumber: 102,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex gap-2",
                                children: [
                                    isAuctionListing && ((_listing_auction = listing.auction) === null || _listing_auction === void 0 ? void 0 : _listing_auction.status) === 'active' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>onCancelAuction(listing.id),
                                        className: "text-red-400 p-2 rounded-full hover:bg-gray-800 transition",
                                        "aria-label": "Cancel auction",
                                        title: "Cancel auction",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                            className: "w-5 h-5"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/myListings/ListingCard.tsx",
                                            lineNumber: 115,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/myListings/ListingCard.tsx",
                                        lineNumber: 109,
                                        columnNumber: 15
                                    }, this),
                                    (!isAuctionListing || listing.auction && listing.auction.status !== 'active') && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>onEdit(listing),
                                        className: "text-blue-400 p-2 rounded-full hover:bg-gray-800 transition",
                                        "aria-label": "Edit listing",
                                        title: "Edit listing",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2d$pen$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Edit$3e$__["Edit"], {
                                            className: "w-5 h-5"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/myListings/ListingCard.tsx",
                                            lineNumber: 125,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/myListings/ListingCard.tsx",
                                        lineNumber: 119,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>{
                                            if (confirm('Are you sure you want to delete this listing?')) onDelete(listing.id);
                                        },
                                        className: "text-red-500 p-2 rounded-full hover:bg-gray-800 transition",
                                        "aria-label": "Delete listing",
                                        title: "Delete listing",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {
                                            className: "w-5 h-5"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/myListings/ListingCard.tsx",
                                            lineNumber: 136,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/myListings/ListingCard.tsx",
                                        lineNumber: 128,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/myListings/ListingCard.tsx",
                                lineNumber: 107,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/myListings/ListingCard.tsx",
                        lineNumber: 101,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/myListings/ListingCard.tsx",
                lineNumber: 58,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/myListings/ListingCard.tsx",
        lineNumber: 29,
        columnNumber: 5
    }, this);
}
_c = ListingCard;
var _c;
__turbopack_context__.k.register(_c, "ListingCard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/ui/SecureForm.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "SecureFieldWrapper": ()=>SecureFieldWrapper,
    "SecureForm": ()=>SecureForm,
    "SecureSubmitButton": ()=>SecureSubmitButton
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-alert.js [app-client] (ecmascript) <export default as AlertCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldCheck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shield-check.js [app-client] (ecmascript) <export default as ShieldCheck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.js [app-client] (ecmascript) <export default as Loader2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/rate-limiter.ts [app-client] (ecmascript)");
;
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
const SecureForm = (param)=>{
    let { children, onSubmit, className = '', rateLimitKey, rateLimitConfig, showSecurityBadge = false, csrfProtection = true, isRateLimited = false, rateLimitWaitTime = 0 } = param;
    _s();
    const [isSubmitting, setIsSubmitting] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [rateLimitError, setRateLimitError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [csrfToken, setCsrfToken] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    // Initialize CSRF token
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SecureForm.useEffect": ()=>{
            if (csrfProtection && "object" !== 'undefined') {
                const tokenManager = new CSRFTokenManager();
                const token = tokenManager.generateToken();
                setCsrfToken(token);
            }
        }
    }["SecureForm.useEffect"], [
        csrfProtection
    ]);
    // Update rate limit error when props change
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SecureForm.useEffect": ()=>{
            if (isRateLimited && rateLimitWaitTime > 0) {
                setRateLimitError("Too many attempts. Please wait ".concat(rateLimitWaitTime, " seconds before trying again."));
            } else {
                setRateLimitError(null);
            }
        }
    }["SecureForm.useEffect"], [
        isRateLimited,
        rateLimitWaitTime
    ]);
    const handleSubmit = async (e)=>{
        e.preventDefault();
        // Don't submit if externally rate limited
        if (isRateLimited) {
            return;
        }
        // Clear previous errors
        setRateLimitError(null);
        // Check rate limit if configured and not already checked externally
        if (rateLimitKey && rateLimitConfig && !isRateLimited) {
            const limiter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getRateLimiter"])();
            const result = limiter.check(rateLimitKey, rateLimitConfig);
            if (!result.allowed) {
                setRateLimitError((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getRateLimitMessage"])(result));
                return;
            }
        }
        setIsSubmitting(true);
        try {
            await onSubmit(e);
        } catch (error) {
            console.error('Form submission error:', error);
            // If it's a rate limit error, reset the attempt
            if (rateLimitKey && error instanceof Error && error.message.includes('Rate limit')) {
                const limiter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getRateLimiter"])();
                limiter.reset(rateLimitKey);
            }
            throw error;
        } finally{
            setIsSubmitting(false);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
        onSubmit: handleSubmit,
        className: className,
        noValidate: true,
        children: [
            csrfProtection && csrfToken && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                type: "hidden",
                name: "_csrf",
                value: csrfToken
            }, void 0, false, {
                fileName: "[project]/src/components/ui/SecureForm.tsx",
                lineNumber: 101,
                columnNumber: 39
            }, ("TURBOPACK compile-time value", void 0)),
            showSecurityBadge && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-4 flex items-center gap-2 text-xs text-gray-500",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldCheck$3e$__["ShieldCheck"], {
                        className: "w-4 h-4"
                    }, void 0, false, {
                        fileName: "[project]/src/components/ui/SecureForm.tsx",
                        lineNumber: 106,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "Secure form with protection against attacks"
                    }, void 0, false, {
                        fileName: "[project]/src/components/ui/SecureForm.tsx",
                        lineNumber: 107,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ui/SecureForm.tsx",
                lineNumber: 105,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            rateLimitError && !isRateLimited && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-2 text-sm text-red-400",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                            className: "w-4 h-4 flex-shrink-0"
                        }, void 0, false, {
                            fileName: "[project]/src/components/ui/SecureForm.tsx",
                            lineNumber: 115,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: rateLimitError
                        }, void 0, false, {
                            fileName: "[project]/src/components/ui/SecureForm.tsx",
                            lineNumber: 116,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/ui/SecureForm.tsx",
                    lineNumber: 114,
                    columnNumber: 11
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/ui/SecureForm.tsx",
                lineNumber: 113,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            children
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ui/SecureForm.tsx",
        lineNumber: 99,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(SecureForm, "hxuY79RJyLN4e4Bw8I657QoD7tg=");
_c = SecureForm;
const SecureFieldWrapper = (param)=>{
    let { children, error, touched, className = '' } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: className,
        children: [
            children,
            touched && error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-1 flex items-center gap-1 text-xs text-red-400",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                        className: "w-3 h-3 flex-shrink-0"
                    }, void 0, false, {
                        fileName: "[project]/src/components/ui/SecureForm.tsx",
                        lineNumber: 147,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: error
                    }, void 0, false, {
                        fileName: "[project]/src/components/ui/SecureForm.tsx",
                        lineNumber: 148,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ui/SecureForm.tsx",
                lineNumber: 146,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ui/SecureForm.tsx",
        lineNumber: 143,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
};
_c1 = SecureFieldWrapper;
const SecureSubmitButton = (param)=>{
    let { children, isLoading = false, isDisabled = false, disabled = false, className = '', loadingText = 'Processing...', type = 'submit' } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        type: type,
        disabled: isLoading || isDisabled || disabled,
        className: "relative ".concat(className, " ").concat(isLoading || isDisabled || disabled ? 'opacity-50 cursor-not-allowed' : ''),
        children: isLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "flex items-center justify-center gap-2",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                    className: "w-4 h-4 animate-spin"
                }, void 0, false, {
                    fileName: "[project]/src/components/ui/SecureForm.tsx",
                    lineNumber: 185,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                loadingText
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/ui/SecureForm.tsx",
            lineNumber: 184,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0)) : children
    }, void 0, false, {
        fileName: "[project]/src/components/ui/SecureForm.tsx",
        lineNumber: 176,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
};
_c2 = SecureSubmitButton;
/**
 * CSRF Token Manager for form protection
 */ class CSRFTokenManager {
    generateToken() {
        const token = this.createSecureToken();
        const expiry = Date.now() + this.tokenExpiry;
        if ("TURBOPACK compile-time truthy", 1) {
            sessionStorage.setItem(this.tokenKey, JSON.stringify({
                token,
                expiry
            }));
        }
        return token;
    }
    validateToken(token) {
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        try {
            const stored = sessionStorage.getItem(this.tokenKey);
            if (!stored) return false;
            const { token: storedToken, expiry } = JSON.parse(stored);
            if (Date.now() > expiry) {
                sessionStorage.removeItem(this.tokenKey);
                return false;
            }
            return token === storedToken;
        } catch (e) {
            return false;
        }
    }
    createSecureToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, (byte)=>byte.toString(16).padStart(2, '0')).join('');
    }
    constructor(){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "tokenKey", 'csrf_token');
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "tokenExpiry", 60 * 60 * 1000); // 1 hour
    }
}
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "SecureForm");
__turbopack_context__.k.register(_c1, "SecureFieldWrapper");
__turbopack_context__.k.register(_c2, "SecureSubmitButton");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/myListings/ListingForm.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": ()=>ListingForm
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/sparkles.js [app-client] (ecmascript) <export default as Sparkles>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$gavel$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Gavel$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/gavel.js [app-client] (ecmascript) <export default as Gavel>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$lock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Lock$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/lock.js [app-client] (ecmascript) <export default as Lock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$image$2d$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ImagePlus$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/image-plus.js [app-client] (ecmascript) <export default as ImagePlus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Upload$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/upload.js [app-client] (ecmascript) <export default as Upload>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$move$2d$vertical$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MoveVertical$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/move-vertical.js [app-client] (ecmascript) <export default as MoveVertical>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2d$pen$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Edit$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/square-pen.js [app-client] (ecmascript) <export default as Edit>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-alert.js [app-client] (ecmascript) <export default as AlertCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$crown$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Crown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/crown.js [app-client] (ecmascript) <export default as Crown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-check-big.js [app-client] (ecmascript) <export default as CheckCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/SecureInput.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureForm$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/SecureForm.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/SecureMessageDisplay.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/validation/schemas.ts [app-client] (ecmascript)");
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
;
;
// Character requirements from schemas
const VALIDATION_REQUIREMENTS = {
    title: {
        min: 5,
        max: 100
    },
    description: {
        min: 20,
        max: 2000
    },
    price: {
        min: 0.01,
        max: 10000
    },
    tags: {
        max: 200
    },
    hoursWorn: {
        min: 0,
        max: 999
    }
};
function ListingForm(param) {
    let { formState, isEditing, isVerified, selectedFiles, isUploading, uploadProgress = 0, onFormChange, onFileSelect, onRemoveFile, onUploadFiles, onRemoveImage, onImageReorder, onSave, onCancel } = param;
    var _formState_hoursWorn;
    _s();
    const [errors, setErrors] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [touched, setTouched] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [isSubmitting, setIsSubmitting] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Real-time validation
    const validation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ListingForm.useMemo[validation]": ()=>{
            const titleLength = formState.title.length;
            const descriptionLength = formState.description.length;
            const tagsLength = formState.tags.length;
            const totalImages = formState.imageUrls.length + selectedFiles.length;
            return {
                title: {
                    count: titleLength,
                    isValid: titleLength >= VALIDATION_REQUIREMENTS.title.min && titleLength <= VALIDATION_REQUIREMENTS.title.max,
                    message: titleLength < VALIDATION_REQUIREMENTS.title.min ? "Title needs at least ".concat(VALIDATION_REQUIREMENTS.title.min, " characters") : titleLength > VALIDATION_REQUIREMENTS.title.max ? "Title exceeds ".concat(VALIDATION_REQUIREMENTS.title.max, " characters") : 'Perfect title length!'
                },
                description: {
                    count: descriptionLength,
                    isValid: descriptionLength >= VALIDATION_REQUIREMENTS.description.min && descriptionLength <= VALIDATION_REQUIREMENTS.description.max,
                    message: descriptionLength < VALIDATION_REQUIREMENTS.description.min ? "Description needs at least ".concat(VALIDATION_REQUIREMENTS.description.min, " characters") : descriptionLength > VALIDATION_REQUIREMENTS.description.max ? "Description exceeds ".concat(VALIDATION_REQUIREMENTS.description.max, " characters") : 'Great description length!'
                },
                price: {
                    isValid: formState.isAuction ? true : parseFloat(formState.price) >= VALIDATION_REQUIREMENTS.price.min && parseFloat(formState.price) <= VALIDATION_REQUIREMENTS.price.max,
                    message: !formState.isAuction && (isNaN(parseFloat(formState.price)) || parseFloat(formState.price) < VALIDATION_REQUIREMENTS.price.min) ? "Price must be at least $".concat(VALIDATION_REQUIREMENTS.price.min) : !formState.isAuction && parseFloat(formState.price) > VALIDATION_REQUIREMENTS.price.max ? "Price cannot exceed $".concat(VALIDATION_REQUIREMENTS.price.max.toLocaleString()) : 'Valid price'
                },
                startingPrice: {
                    isValid: !formState.isAuction || parseFloat(formState.startingPrice) >= VALIDATION_REQUIREMENTS.price.min && parseFloat(formState.startingPrice) <= VALIDATION_REQUIREMENTS.price.max,
                    message: formState.isAuction && (isNaN(parseFloat(formState.startingPrice)) || parseFloat(formState.startingPrice) < VALIDATION_REQUIREMENTS.price.min) ? "Starting bid must be at least $".concat(VALIDATION_REQUIREMENTS.price.min) : formState.isAuction && parseFloat(formState.startingPrice) > VALIDATION_REQUIREMENTS.price.max ? "Starting bid cannot exceed $".concat(VALIDATION_REQUIREMENTS.price.max.toLocaleString()) : 'Valid starting bid'
                },
                reservePrice: {
                    isValid: !formState.isAuction || !formState.reservePrice || parseFloat(formState.reservePrice) >= parseFloat(formState.startingPrice),
                    message: formState.isAuction && formState.reservePrice && parseFloat(formState.reservePrice) < parseFloat(formState.startingPrice) ? 'Reserve price must be at least the starting bid' : 'Valid reserve price'
                },
                images: {
                    isValid: totalImages > 0,
                    message: totalImages === 0 ? 'At least one image is required' : "".concat(totalImages, " image").concat(totalImages === 1 ? '' : 's', " selected")
                },
                tags: {
                    count: tagsLength,
                    isValid: tagsLength <= VALIDATION_REQUIREMENTS.tags.max,
                    message: tagsLength > VALIDATION_REQUIREMENTS.tags.max ? "Tags exceed ".concat(VALIDATION_REQUIREMENTS.tags.max, " characters") : 'Valid tags'
                }
            };
        }
    }["ListingForm.useMemo[validation]"], [
        formState,
        selectedFiles.length
    ]);
    // Check if form is valid overall
    const isFormValid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ListingForm.useMemo[isFormValid]": ()=>{
            return validation.title.isValid && validation.description.isValid && validation.price.isValid && validation.startingPrice.isValid && validation.reservePrice.isValid && validation.images.isValid && validation.tags.isValid;
        }
    }["ListingForm.useMemo[isFormValid]"], [
        validation
    ]);
    // Handle file selection with validation
    const handleSecureFileSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ListingForm.useCallback[handleSecureFileSelect]": (e)=>{
            const files = Array.from(e.target.files || []);
            const validFiles = [];
            let fileErrors = [];
            files.forEach({
                "ListingForm.useCallback[handleSecureFileSelect]": (file)=>{
                    const validation = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].validateFileUpload(file, {
                        maxSize: 5 * 1024 * 1024,
                        allowedTypes: [
                            'image/jpeg',
                            'image/jpg',
                            'image/png',
                            'image/webp'
                        ],
                        allowedExtensions: [
                            'jpg',
                            'jpeg',
                            'png',
                            'webp'
                        ]
                    });
                    if (validation.valid) {
                        validFiles.push(file);
                    } else {
                        fileErrors.push(validation.error || 'Invalid file');
                    }
                }
            }["ListingForm.useCallback[handleSecureFileSelect]"]);
            if (validFiles.length > 0) {
                onFileSelect({
                    target: {
                        files: validFiles
                    }
                });
            }
            if (fileErrors.length > 0) {
                setErrors({
                    "ListingForm.useCallback[handleSecureFileSelect]": (prev)=>({
                            ...prev,
                            files: fileErrors.join(', ')
                        })
                }["ListingForm.useCallback[handleSecureFileSelect]"]);
            } else {
                setErrors({
                    "ListingForm.useCallback[handleSecureFileSelect]": (prev)=>{
                        const { files, ...rest } = prev;
                        return rest;
                    }
                }["ListingForm.useCallback[handleSecureFileSelect]"]);
            }
        }
    }["ListingForm.useCallback[handleSecureFileSelect]"], [
        onFileSelect
    ]);
    // Comprehensive form validation before submission
    const validateForm = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ListingForm.useCallback[validateForm]": ()=>{
            const newErrors = {};
            // Title validation
            if (!validation.title.isValid) {
                newErrors.title = validation.title.message;
            }
            // Description validation
            if (!validation.description.isValid) {
                newErrors.description = validation.description.message;
            }
            // Price validation
            if (formState.isAuction) {
                if (!validation.startingPrice.isValid) {
                    newErrors.startingPrice = validation.startingPrice.message;
                }
                if (!validation.reservePrice.isValid) {
                    newErrors.reservePrice = validation.reservePrice.message;
                }
            } else {
                if (!validation.price.isValid) {
                    newErrors.price = validation.price.message;
                }
            }
            // Images validation
            if (!validation.images.isValid) {
                newErrors.images = validation.images.message;
            }
            // Tags validation
            if (!validation.tags.isValid) {
                newErrors.tags = validation.tags.message;
            }
            return {
                isValid: Object.keys(newErrors).length === 0,
                errors: newErrors
            };
        }
    }["ListingForm.useCallback[validateForm]"], [
        validation,
        formState.isAuction
    ]);
    // Handle secure form submission
    const handleSecureSave = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ListingForm.useCallback[handleSecureSave]": async (e)=>{
            e.preventDefault();
            if (isSubmitting) return;
            setIsSubmitting(true);
            setErrors({});
            try {
                // Validate form
                const formValidation = validateForm();
                if (!formValidation.isValid) {
                    setErrors(formValidation.errors);
                    // Mark all invalid fields as touched
                    const touchedFields = Object.keys(formValidation.errors).reduce({
                        "ListingForm.useCallback[handleSecureSave].touchedFields": (acc, key)=>({
                                ...acc,
                                [key]: true
                            })
                    }["ListingForm.useCallback[handleSecureSave].touchedFields"], {});
                    setTouched({
                        "ListingForm.useCallback[handleSecureSave]": (prev)=>({
                                ...prev,
                                ...touchedFields
                            })
                    }["ListingForm.useCallback[handleSecureSave]"]);
                    return;
                }
                // Additional schema validation for extra safety
                if (!formState.isAuction) {
                    const listingData = {
                        title: formState.title,
                        description: formState.description,
                        price: parseFloat(formState.price),
                        images: [
                            ...formState.imageUrls
                        ],
                        category: 'panties',
                        condition: 'worn_once',
                        size: 'm',
                        tags: formState.tags.split(',').map({
                            "ListingForm.useCallback[handleSecureSave]": (tag)=>tag.trim()
                        }["ListingForm.useCallback[handleSecureSave]"]).filter({
                            "ListingForm.useCallback[handleSecureSave]": (tag)=>tag
                        }["ListingForm.useCallback[handleSecureSave]"]),
                        wearDuration: formState.hoursWorn ? parseInt(formState.hoursWorn.toString()) : undefined,
                        listingType: 'regular'
                    };
                    const schemaValidation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateSchema"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["listingSchemas"].createListingSchema, listingData);
                    if (!schemaValidation.success && schemaValidation.errors) {
                        console.error('Schema validation failed:', schemaValidation.errors);
                        setErrors(schemaValidation.errors);
                        return;
                    }
                }
                // If all validations pass, submit the form
                await onSave();
            } catch (error) {
                console.error('Form submission error:', error);
                setErrors({
                    submit: 'An error occurred while saving. Please try again.'
                });
            } finally{
                setIsSubmitting(false);
            }
        }
    }["ListingForm.useCallback[handleSecureSave]"], [
        formState,
        isSubmitting,
        validateForm,
        onSave
    ]);
    // Handle field blur
    const handleFieldBlur = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ListingForm.useCallback[handleFieldBlur]": (fieldName)=>{
            setTouched({
                "ListingForm.useCallback[handleFieldBlur]": (prev)=>({
                        ...prev,
                        [fieldName]: true
                    })
            }["ListingForm.useCallback[handleFieldBlur]"]);
        }
    }["ListingForm.useCallback[handleFieldBlur]"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureForm$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureForm"], {
        onSubmit: handleSecureSave,
        rateLimitKey: "listing_create",
        rateLimitConfig: {
            maxAttempts: 10,
            windowMs: 60 * 60 * 1000
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "text-2xl font-bold mb-6 text-white",
                children: isEditing ? 'Edit Listing' : 'Create New Listing'
            }, void 0, false, {
                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                lineNumber: 287,
                columnNumber: 7
            }, this),
            !isFormValid && Object.keys(touched).length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-6 p-4 bg-red-900 bg-opacity-30 border border-red-700 rounded-lg",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2 mb-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                                className: "w-5 h-5 text-red-400"
                            }, void 0, false, {
                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                lineNumber: 295,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "font-semibold text-red-300",
                                children: "Please fix the following issues:"
                            }, void 0, false, {
                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                lineNumber: 296,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                        lineNumber: 294,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                        className: "text-sm text-red-200 space-y-1",
                        children: [
                            !validation.title.isValid && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: [
                                    "• ",
                                    validation.title.message
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                lineNumber: 299,
                                columnNumber: 43
                            }, this),
                            !validation.description.isValid && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: [
                                    "• ",
                                    validation.description.message
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                lineNumber: 300,
                                columnNumber: 49
                            }, this),
                            !validation.price.isValid && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: [
                                    "• ",
                                    validation.price.message
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                lineNumber: 301,
                                columnNumber: 43
                            }, this),
                            !validation.startingPrice.isValid && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: [
                                    "• ",
                                    validation.startingPrice.message
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                lineNumber: 302,
                                columnNumber: 51
                            }, this),
                            !validation.reservePrice.isValid && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: [
                                    "• ",
                                    validation.reservePrice.message
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                lineNumber: 303,
                                columnNumber: 50
                            }, this),
                            !validation.images.isValid && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: [
                                    "• ",
                                    validation.images.message
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                lineNumber: 304,
                                columnNumber: 44
                            }, this),
                            !validation.tags.isValid && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: [
                                    "• ",
                                    validation.tags.message
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                lineNumber: 305,
                                columnNumber: 42
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                        lineNumber: 298,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                lineNumber: 293,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-5",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "block text-sm font-medium text-gray-300 mb-1",
                                children: [
                                    "Title *",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center justify-between mt-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs ".concat(validation.title.isValid ? 'text-green-400' : 'text-red-400'),
                                                children: validation.title.message
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                lineNumber: 315,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs ".concat(validation.title.count < VALIDATION_REQUIREMENTS.title.min ? 'text-red-400' : validation.title.count > VALIDATION_REQUIREMENTS.title.max ? 'text-red-400' : 'text-green-400'),
                                                children: [
                                                    validation.title.count,
                                                    "/",
                                                    VALIDATION_REQUIREMENTS.title.max
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                lineNumber: 320,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                        lineNumber: 314,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                lineNumber: 312,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "relative",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureInput"], {
                                        type: "text",
                                        placeholder: "e.g. 'Black Lace Panties Worn 24 Hours'",
                                        value: formState.title,
                                        onChange: (value)=>onFormChange({
                                                title: value
                                            }),
                                        onBlur: ()=>handleFieldBlur('title'),
                                        maxLength: VALIDATION_REQUIREMENTS.title.max,
                                        className: "w-full p-3 border rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition ".concat(validation.title.isValid ? 'border-green-600 focus:ring-green-500' : 'border-red-600 focus:ring-red-500')
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                        lineNumber: 330,
                                        columnNumber: 13
                                    }, this),
                                    validation.title.isValid && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__["CheckCircle"], {
                                        className: "absolute right-3 top-3 w-5 h-5 text-green-400"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                        lineNumber: 342,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                lineNumber: 329,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                        lineNumber: 311,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "block text-sm font-medium text-gray-300 mb-1",
                                children: [
                                    "Description *",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center justify-between mt-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs ".concat(validation.description.isValid ? 'text-green-400' : 'text-red-400'),
                                                children: validation.description.message
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                lineNumber: 351,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs ".concat(validation.description.count < VALIDATION_REQUIREMENTS.description.min ? 'text-red-400' : validation.description.count > VALIDATION_REQUIREMENTS.description.max ? 'text-red-400' : 'text-green-400'),
                                                children: [
                                                    validation.description.count,
                                                    "/",
                                                    VALIDATION_REQUIREMENTS.description.max
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                lineNumber: 356,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                        lineNumber: 350,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                lineNumber: 348,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "relative",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureTextarea"], {
                                        placeholder: "Describe your item in detail to attract buyers. Include material, color, how long worn, special features, etc.",
                                        value: formState.description,
                                        onChange: (value)=>onFormChange({
                                                description: value
                                            }),
                                        onBlur: ()=>handleFieldBlur('description'),
                                        maxLength: VALIDATION_REQUIREMENTS.description.max,
                                        className: "w-full p-3 border rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 h-32 transition ".concat(validation.description.isValid ? 'border-green-600 focus:ring-green-500' : 'border-red-600 focus:ring-red-500')
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                        lineNumber: 366,
                                        columnNumber: 13
                                    }, this),
                                    validation.description.isValid && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__["CheckCircle"], {
                                        className: "absolute right-3 top-3 w-5 h-5 text-green-400"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                        lineNumber: 377,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                lineNumber: 365,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                        lineNumber: 347,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-[#121212] p-4 rounded-lg border border-gray-700",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-lg font-medium mb-3 text-white",
                                children: "Listing Type"
                            }, void 0, false, {
                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                lineNumber: 384,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-col sm:flex-row gap-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "flex items-center gap-3 py-3 px-4 rounded-lg cursor-pointer border-2 transition flex-1 ".concat(!formState.isAuction ? 'border-[#ff950e] bg-[#ff950e] bg-opacity-10' : 'border-gray-700 bg-black'),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "radio",
                                                checked: !formState.isAuction,
                                                onChange: ()=>onFormChange({
                                                        isAuction: false
                                                    }),
                                                className: "sr-only"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                lineNumber: 387,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__["Sparkles"], {
                                                className: "w-5 h-5 ".concat(!formState.isAuction ? 'text-[#ff950e]' : 'text-gray-500')
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                lineNumber: 393,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "font-medium",
                                                        children: "Standard Listing"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                        lineNumber: 395,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-xs text-gray-400 mt-1",
                                                        children: "Fixed price, first come first served"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                        lineNumber: 396,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                lineNumber: 394,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                        lineNumber: 386,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "relative flex-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "flex items-center gap-3 py-3 px-4 rounded-lg cursor-pointer border-2 transition ".concat(formState.isAuction ? 'border-purple-600 bg-purple-600 bg-opacity-10' : 'border-gray-700 bg-black', " ").concat(!isVerified ? 'opacity-50 cursor-not-allowed' : 'hover:border-purple-500'),
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "radio",
                                                        checked: formState.isAuction,
                                                        onChange: ()=>{
                                                            if (isVerified) {
                                                                onFormChange({
                                                                    isAuction: true
                                                                });
                                                            }
                                                        },
                                                        disabled: !isVerified,
                                                        className: "sr-only"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                        lineNumber: 412,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$gavel$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Gavel$3e$__["Gavel"], {
                                                        className: "w-5 h-5 ".concat(formState.isAuction ? 'text-purple-500' : 'text-gray-500')
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                        lineNumber: 423,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "font-medium",
                                                                children: "Auction"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                                lineNumber: 425,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "text-xs text-gray-400 mt-1",
                                                                children: "Let buyers bid, highest wins"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                                lineNumber: 426,
                                                                columnNumber: 19
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                        lineNumber: 424,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                lineNumber: 401,
                                                columnNumber: 15
                                            }, this),
                                            !isVerified && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 rounded-lg px-3 py-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$lock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Lock$3e$__["Lock"], {
                                                        className: "w-6 h-6 text-yellow-500 mb-1"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                        lineNumber: 433,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-xs text-yellow-400 font-medium text-center",
                                                        children: "Verify your account to unlock auctions"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                        lineNumber: 434,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                        href: "/sellers/verify",
                                                        className: "mt-1 text-xs text-white bg-yellow-600 hover:bg-yellow-500 px-3 py-1 rounded-full font-medium transition",
                                                        children: "Get Verified"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                        lineNumber: 435,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                lineNumber: 432,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                        lineNumber: 400,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                lineNumber: 385,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                        lineNumber: 383,
                        columnNumber: 9
                    }, this),
                    formState.isAuction ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-1 md:grid-cols-2 gap-5",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "block text-sm font-medium text-gray-300 mb-1",
                                        children: [
                                            "Starting Bid ($) *",
                                            !validation.startingPrice.isValid && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs text-red-400 ml-2",
                                                children: validation.startingPrice.message
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                lineNumber: 454,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                        lineNumber: 451,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "relative",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureInput"], {
                                                type: "number",
                                                step: "0.01",
                                                placeholder: "e.g. 9.99",
                                                value: formState.startingPrice,
                                                onChange: (value)=>{
                                                    const sanitized = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeCurrency"])(value);
                                                    onFormChange({
                                                        startingPrice: sanitized.toString()
                                                    });
                                                },
                                                onBlur: ()=>handleFieldBlur('startingPrice'),
                                                min: "0.01",
                                                max: "9999.99",
                                                className: "w-full p-3 border rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition ".concat(validation.startingPrice.isValid ? 'border-green-600 focus:ring-green-500' : 'border-red-600 focus:ring-red-500')
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                lineNumber: 458,
                                                columnNumber: 17
                                            }, this),
                                            validation.startingPrice.isValid && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__["CheckCircle"], {
                                                className: "absolute right-3 top-3 w-5 h-5 text-green-400"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                lineNumber: 475,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                        lineNumber: 457,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs text-gray-500 mt-1",
                                        children: "Minimum price to start bidding"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                        lineNumber: 478,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                lineNumber: 450,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "block text-sm font-medium text-gray-300 mb-1",
                                        children: [
                                            "Reserve Price ($)",
                                            !validation.reservePrice.isValid && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs text-red-400 ml-2",
                                                children: validation.reservePrice.message
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                lineNumber: 484,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                        lineNumber: 481,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "relative",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureInput"], {
                                                type: "number",
                                                step: "0.01",
                                                placeholder: "e.g. 19.99",
                                                value: formState.reservePrice,
                                                onChange: (value)=>{
                                                    const sanitized = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeCurrency"])(value);
                                                    onFormChange({
                                                        reservePrice: sanitized.toString()
                                                    });
                                                },
                                                onBlur: ()=>handleFieldBlur('reservePrice'),
                                                min: "0",
                                                max: "9999.99",
                                                className: "w-full p-3 border rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition ".concat(validation.reservePrice.isValid ? 'border-gray-700 focus:ring-purple-600' : 'border-red-600 focus:ring-red-500')
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                lineNumber: 488,
                                                columnNumber: 17
                                            }, this),
                                            validation.reservePrice.isValid && formState.reservePrice && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__["CheckCircle"], {
                                                className: "absolute right-3 top-3 w-5 h-5 text-green-400"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                lineNumber: 505,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                        lineNumber: 487,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs text-gray-500 mt-1",
                                        children: "Minimum winning bid price (hidden from buyers)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                        lineNumber: 508,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                lineNumber: 480,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "block text-sm font-medium text-gray-300 mb-1",
                                        children: "Auction Duration"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                        lineNumber: 511,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        value: formState.auctionDuration,
                                        onChange: (e)=>onFormChange({
                                                auctionDuration: e.target.value
                                            }),
                                        className: "w-full p-3 border border-gray-700 rounded-lg bg-black text-white focus:outline-none focus:ring-2 focus:ring-purple-600",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "0.000694",
                                                children: "1 Minute (Testing)"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                lineNumber: 517,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "1",
                                                children: "1 Day"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                lineNumber: 518,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "3",
                                                children: "3 Days"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                lineNumber: 519,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "5",
                                                children: "5 Days"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                lineNumber: 520,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "7",
                                                children: "7 Days"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                lineNumber: 521,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                        lineNumber: 512,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs text-gray-500 mt-1",
                                        children: "How long the auction will last"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                        lineNumber: 523,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                lineNumber: 510,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                        lineNumber: 449,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-1 md:grid-cols-2 gap-5",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "block text-sm font-medium text-gray-300 mb-1",
                                        children: [
                                            "Price ($) *",
                                            !validation.price.isValid && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs text-red-400 ml-2",
                                                children: validation.price.message
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                lineNumber: 532,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                        lineNumber: 529,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "relative",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureInput"], {
                                                type: "number",
                                                step: "0.01",
                                                placeholder: "e.g. 29.99",
                                                value: formState.price,
                                                onChange: (value)=>{
                                                    const sanitized = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeCurrency"])(value);
                                                    onFormChange({
                                                        price: sanitized.toString()
                                                    });
                                                },
                                                onBlur: ()=>handleFieldBlur('price'),
                                                min: "0.01",
                                                max: "9999.99",
                                                className: "w-full p-3 border rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition ".concat(validation.price.isValid ? 'border-green-600 focus:ring-green-500' : 'border-red-600 focus:ring-red-500')
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                lineNumber: 536,
                                                columnNumber: 17
                                            }, this),
                                            validation.price.isValid && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__["CheckCircle"], {
                                                className: "absolute right-3 top-3 w-5 h-5 text-green-400"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                lineNumber: 553,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                        lineNumber: 535,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                lineNumber: 528,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "block text-sm font-medium text-gray-300 mb-1",
                                        children: [
                                            "Add Images *",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs ml-2 ".concat(validation.images.isValid ? 'text-green-400' : 'text-red-400'),
                                                children: validation.images.message
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                lineNumber: 561,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                        lineNumber: 559,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg bg-black hover:border-[#ff950e] transition cursor-pointer ".concat(validation.images.isValid ? 'border-green-600' : 'border-gray-700'),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "file",
                                                accept: "image/*",
                                                multiple: true,
                                                onChange: handleSecureFileSelect,
                                                className: "hidden"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                lineNumber: 570,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$image$2d$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ImagePlus$3e$__["ImagePlus"], {
                                                className: "w-5 h-5 ".concat(validation.images.isValid ? 'text-green-400' : 'text-[#ff950e]')
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                lineNumber: 577,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-gray-300",
                                                children: "Select images from your computer"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                lineNumber: 578,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                        lineNumber: 567,
                                        columnNumber: 15
                                    }, this),
                                    errors.files && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-1 text-xs text-red-400 flex items-center gap-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                                                className: "w-3 h-3"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                lineNumber: 582,
                                                columnNumber: 19
                                            }, this),
                                            errors.files
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                        lineNumber: 581,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                lineNumber: 558,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                        lineNumber: 527,
                        columnNumber: 11
                    }, this),
                    formState.isAuction && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "block text-sm font-medium text-gray-300 mb-1",
                                children: [
                                    "Add Images *",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs ml-2 ".concat(validation.images.isValid ? 'text-green-400' : 'text-red-400'),
                                        children: validation.images.message
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                        lineNumber: 595,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                lineNumber: 593,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg bg-black hover:border-purple-600 transition cursor-pointer ".concat(validation.images.isValid ? 'border-green-600' : 'border-gray-700'),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "file",
                                        accept: "image/*",
                                        multiple: true,
                                        onChange: handleSecureFileSelect,
                                        className: "hidden"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                        lineNumber: 604,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$image$2d$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ImagePlus$3e$__["ImagePlus"], {
                                        className: "w-5 h-5 ".concat(validation.images.isValid ? 'text-green-400' : 'text-purple-500')
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                        lineNumber: 611,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-gray-300",
                                        children: "Select images from your computer"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                        lineNumber: 612,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                lineNumber: 601,
                                columnNumber: 13
                            }, this),
                            errors.files && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-1 text-xs text-red-400 flex items-center gap-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                                        className: "w-3 h-3"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                        lineNumber: 616,
                                        columnNumber: 17
                                    }, this),
                                    errors.files
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                lineNumber: 615,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                        lineNumber: 592,
                        columnNumber: 11
                    }, this),
                    selectedFiles.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-between items-center mb-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-sm text-gray-300",
                                        children: [
                                            selectedFiles.length,
                                            " file(s) selected"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                        lineNumber: 627,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: onUploadFiles,
                                        disabled: isUploading,
                                        className: "text-black px-4 py-2 rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ".concat(formState.isAuction ? 'bg-purple-500 hover:bg-purple-600' : 'bg-[#ff950e] hover:bg-[#e0850d]'),
                                        children: isUploading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                            children: "Uploading..."
                                        }, void 0, false) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Upload$3e$__["Upload"], {
                                                    className: "w-4 h-4"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                    lineNumber: 638,
                                                    columnNumber: 21
                                                }, this),
                                                "Add to Listing"
                                            ]
                                        }, void 0, true)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                        lineNumber: 628,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                lineNumber: 626,
                                columnNumber: 13
                            }, this),
                            isUploading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex justify-between text-xs text-gray-400 mb-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: "Uploading images..."
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                lineNumber: 649,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: [
                                                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeNumber"])(uploadProgress, 0, 100),
                                                    "%"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                lineNumber: 650,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                        lineNumber: 648,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-full bg-gray-800 rounded-full h-2 overflow-hidden",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "h-full transition-all duration-300 ".concat(formState.isAuction ? 'bg-purple-500' : 'bg-[#ff950e]'),
                                            style: {
                                                width: "".concat((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeNumber"])(uploadProgress, 0, 100), "%")
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                            lineNumber: 653,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                        lineNumber: 652,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                lineNumber: 647,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4",
                                children: selectedFiles.map((file, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "relative border border-gray-700 rounded-lg overflow-hidden group",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureImage"], {
                                                src: URL.createObjectURL(file),
                                                alt: "Selected ".concat(index + 1),
                                                className: "w-full h-24 object-cover"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                lineNumber: 666,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>onRemoveFile(index),
                                                className: "absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                                    className: "w-4 h-4"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                    lineNumber: 676,
                                                    columnNumber: 21
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                lineNumber: 671,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 py-1 px-2",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-xs text-white truncate",
                                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(file.name)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                    lineNumber: 679,
                                                    columnNumber: 21
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                lineNumber: 678,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, index, true, {
                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                        lineNumber: 665,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                lineNumber: 663,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                        lineNumber: 625,
                        columnNumber: 11
                    }, this),
                    formState.imageUrls.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "block text-sm font-medium text-gray-300 mb-2",
                                children: "Images (Drag to reorder)"
                            }, void 0, false, {
                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                lineNumber: 690,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4",
                                children: formState.imageUrls.map((url, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        draggable: true,
                                        onDragStart: ()=>onImageReorder(index, index),
                                        onDragEnter: ()=>onImageReorder(index, index),
                                        onDragEnd: ()=>onImageReorder(index, index),
                                        onDragOver: (e)=>e.preventDefault(),
                                        className: "relative border rounded-lg overflow-hidden cursor-grab active:cursor-grabbing group ".concat(index === 0 ? 'border-2 border-[#ff950e] shadow-md' : 'border-gray-700'),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureImage"], {
                                                src: url,
                                                alt: "Listing Image ".concat(index + 1),
                                                className: "w-full object-cover ".concat(index === 0 ? 'h-32 sm:h-40' : 'h-24 sm:h-32')
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                lineNumber: 702,
                                                columnNumber: 19
                                            }, this),
                                            index === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "absolute top-2 left-2 bg-[#ff950e] text-black text-xs px-2 py-0.5 rounded-full font-bold",
                                                children: "Main"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                lineNumber: 708,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>onRemoveImage(url),
                                                className: "absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition",
                                                "aria-label": "Remove image",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                                    className: "w-4 h-4"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                    lineNumber: 718,
                                                    columnNumber: 21
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                lineNumber: 712,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black bg-opacity-20",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$move$2d$vertical$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MoveVertical$3e$__["MoveVertical"], {
                                                    className: "w-6 h-6 text-white"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                    lineNumber: 721,
                                                    columnNumber: 21
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                lineNumber: 720,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, index, true, {
                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                        lineNumber: 693,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                lineNumber: 691,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                        lineNumber: 689,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "block text-sm font-medium text-gray-300 mb-1",
                                children: [
                                    "Tags (comma separated)",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs ml-2 ".concat(validation.tags.isValid ? 'text-green-400' : 'text-red-400'),
                                        children: [
                                            validation.tags.count,
                                            "/",
                                            VALIDATION_REQUIREMENTS.tags.max
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                        lineNumber: 732,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                lineNumber: 730,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureInput"], {
                                type: "text",
                                placeholder: "e.g. thong, black, lace, cotton, gym",
                                value: formState.tags,
                                onChange: (value)=>onFormChange({
                                        tags: value
                                    }),
                                onBlur: ()=>handleFieldBlur('tags'),
                                maxLength: VALIDATION_REQUIREMENTS.tags.max,
                                className: "w-full p-3 border rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition ".concat(validation.tags.isValid ? 'border-gray-700 focus:ring-[#ff950e]' : 'border-red-600 focus:ring-red-500')
                            }, void 0, false, {
                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                lineNumber: 738,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-gray-500 mt-1",
                                children: "Help buyers find your items with relevant tags"
                            }, void 0, false, {
                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                lineNumber: 749,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                        lineNumber: 729,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureInput"], {
                            label: "Hours Worn (optional)",
                            type: "number",
                            placeholder: "e.g. 24",
                            value: ((_formState_hoursWorn = formState.hoursWorn) === null || _formState_hoursWorn === void 0 ? void 0 : _formState_hoursWorn.toString()) || '',
                            onChange: (value)=>{
                                const num = value === '' ? '' : (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeNumber"])(value, 0, 999);
                                onFormChange({
                                    hoursWorn: num
                                });
                            },
                            min: "0",
                            max: "999"
                        }, void 0, false, {
                            fileName: "[project]/src/components/myListings/ListingForm.tsx",
                            lineNumber: 753,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                        lineNumber: 752,
                        columnNumber: 9
                    }, this),
                    !formState.isAuction && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-4",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            className: "flex items-center gap-3 py-4 px-5 border-2 rounded-lg cursor-pointer transition ".concat(formState.isPremium ? 'border-[#ff950e] bg-[#ff950e] bg-opacity-10' : 'border-gray-700 bg-black'),
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "checkbox",
                                    checked: formState.isPremium,
                                    onChange: ()=>onFormChange({
                                            isPremium: !formState.isPremium
                                        }),
                                    className: "h-5 w-5 text-[#ff950e] focus:ring-[#ff950e] rounded border-gray-600 bg-black checked:bg-[#ff950e]"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                    lineNumber: 771,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$crown$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Crown$3e$__["Crown"], {
                                    className: "w-6 h-6 ".concat(formState.isPremium ? 'text-[#ff950e]' : 'text-gray-500')
                                }, void 0, false, {
                                    fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                    lineNumber: 777,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "font-semibold text-lg ".concat(formState.isPremium ? 'text-white' : 'text-gray-300'),
                                            children: "Make Premium Listing"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                            lineNumber: 779,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-sm mt-0.5 ".concat(formState.isPremium ? 'text-gray-200' : 'text-gray-400'),
                                            children: "Only available to your subscribers"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                            lineNumber: 780,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                    lineNumber: 778,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/myListings/ListingForm.tsx",
                            lineNumber: 770,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                        lineNumber: 769,
                        columnNumber: 11
                    }, this),
                    formState.isAuction && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-purple-900 bg-opacity-30 border border-purple-700 rounded-lg p-4 mt-4",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex gap-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                                    className: "w-6 h-6 text-purple-400 flex-shrink-0 mt-0.5"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                    lineNumber: 790,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                            className: "font-medium text-purple-300 mb-1",
                                            children: "Auction Information"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                            lineNumber: 792,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                            className: "text-sm text-gray-300 space-y-1",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                    children: [
                                                        "• Auctions run for ",
                                                        formState.auctionDuration === '0.000694' ? '1 minute' : "".concat(formState.auctionDuration, " day").concat(parseInt(formState.auctionDuration) !== 1 ? 's' : ''),
                                                        " from the time you create the listing"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                    lineNumber: 794,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                    children: "• Bidders must have sufficient funds in their wallet to place a bid"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                    lineNumber: 797,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                    children: "• If the reserve price is met, the highest bidder automatically purchases the item when the auction ends"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                    lineNumber: 798,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                    children: "• You can cancel an auction at any time before it ends"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                                    lineNumber: 799,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                            lineNumber: 793,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                    lineNumber: 791,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/myListings/ListingForm.tsx",
                            lineNumber: 789,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                        lineNumber: 788,
                        columnNumber: 11
                    }, this),
                    errors.submit && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-red-400 text-sm flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                                className: "w-4 h-4"
                            }, void 0, false, {
                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                lineNumber: 809,
                                columnNumber: 13
                            }, this),
                            errors.submit
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                        lineNumber: 808,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col sm:flex-row gap-4 mt-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "submit",
                                disabled: !isFormValid || isSubmitting,
                                className: "w-full sm:flex-1 text-black px-6 py-3 rounded-lg font-bold text-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ".concat(formState.isAuction ? 'bg-purple-500 hover:bg-purple-600' : 'bg-[#ff950e] hover:bg-[#e0850d]'),
                                children: isSubmitting ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                            lineNumber: 824,
                                            columnNumber: 17
                                        }, this),
                                        "Saving..."
                                    ]
                                }, void 0, true) : isEditing ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2d$pen$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Edit$3e$__["Edit"], {
                                            className: "w-5 h-5"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                            lineNumber: 829,
                                            columnNumber: 17
                                        }, this),
                                        "Save Changes"
                                    ]
                                }, void 0, true) : formState.isAuction ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$gavel$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Gavel$3e$__["Gavel"], {
                                            className: "w-5 h-5"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                            lineNumber: 834,
                                            columnNumber: 17
                                        }, this),
                                        "Create Auction"
                                    ]
                                }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__["Sparkles"], {
                                            className: "w-5 h-5"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                            lineNumber: 839,
                                            columnNumber: 17
                                        }, this),
                                        "Create Listing"
                                    ]
                                }, void 0, true)
                            }, void 0, false, {
                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                lineNumber: 815,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: onCancel,
                                disabled: isSubmitting,
                                className: "w-full sm:flex-1 bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 font-medium text-lg transition flex items-center justify-center gap-2 disabled:opacity-50",
                                children: "Cancel"
                            }, void 0, false, {
                                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                                lineNumber: 844,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/myListings/ListingForm.tsx",
                        lineNumber: 814,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/myListings/ListingForm.tsx",
                lineNumber: 310,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/myListings/ListingForm.tsx",
        lineNumber: 282,
        columnNumber: 5
    }, this);
}
_s(ListingForm, "dm6DdeWoDF7crUWEmb+j+gnzjK4=");
_c = ListingForm;
var _c;
__turbopack_context__.k.register(_c, "ListingForm");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/myListings/RecentSales.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/components/myListings/RecentSales.tsx
__turbopack_context__.s({
    "default": ()=>RecentSales
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
'use client';
;
;
function RecentSales(param) {
    let { orders } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-[#1a1a1a] p-6 sm:p-8 rounded-xl shadow-lg border border-gray-800",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "text-2xl font-bold mb-6 text-white",
                children: "Recent Sales"
            }, void 0, false, {
                fileName: "[project]/src/components/myListings/RecentSales.tsx",
                lineNumber: 10,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-5",
                children: orders.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-center py-8 bg-black rounded-lg border border-dashed border-gray-700 text-gray-400 italic",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: "No sales yet. Keep promoting your listings!"
                    }, void 0, false, {
                        fileName: "[project]/src/components/myListings/RecentSales.tsx",
                        lineNumber: 14,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/myListings/RecentSales.tsx",
                    lineNumber: 13,
                    columnNumber: 11
                }, this) : orders.map((order, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "border border-gray-700 p-4 rounded-lg text-sm bg-black hover:border-[#ff950e] transition",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-4",
                            children: [
                                order.imageUrl && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                    src: order.imageUrl,
                                    alt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(order.title),
                                    className: "w-16 h-16 object-cover rounded-md border border-gray-600"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/myListings/RecentSales.tsx",
                                    lineNumber: 24,
                                    columnNumber: 19
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex-1",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: "font-semibold text-white text-base",
                                            children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(order.title)
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/myListings/RecentSales.tsx",
                                            lineNumber: 31,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-[#ff950e] font-bold text-lg mt-1",
                                            children: [
                                                "$",
                                                order.markedUpPrice.toFixed(2)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/myListings/RecentSales.tsx",
                                            lineNumber: 32,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-xs text-gray-500 mt-1",
                                            children: [
                                                "Sold on ",
                                                new Date(order.date).toLocaleDateString()
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/myListings/RecentSales.tsx",
                                            lineNumber: 35,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/myListings/RecentSales.tsx",
                                    lineNumber: 30,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/myListings/RecentSales.tsx",
                            lineNumber: 22,
                            columnNumber: 15
                        }, this)
                    }, "order-".concat(order.id, "-").concat(index), false, {
                        fileName: "[project]/src/components/myListings/RecentSales.tsx",
                        lineNumber: 18,
                        columnNumber: 13
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/components/myListings/RecentSales.tsx",
                lineNumber: 11,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/myListings/RecentSales.tsx",
        lineNumber: 9,
        columnNumber: 5
    }, this);
}
_c = RecentSales;
var _c;
__turbopack_context__.k.register(_c, "RecentSales");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/utils/cloudinary.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/utils/cloudinary.ts
// Cloudinary configuration
__turbopack_context__.s({
    "base64ToFile": ()=>base64ToFile,
    "batchDeleteFromCloudinary": ()=>batchDeleteFromCloudinary,
    "checkCloudinaryConfig": ()=>checkCloudinaryConfig,
    "deleteFromCloudinary": ()=>deleteFromCloudinary,
    "deleteImageByUrl": ()=>deleteImageByUrl,
    "extractPublicId": ()=>extractPublicId,
    "formatFileSize": ()=>formatFileSize,
    "generateBlurredUrl": ()=>generateBlurredUrl,
    "generateOptimizedUrl": ()=>generateOptimizedUrl,
    "generateThumbnailUrl": ()=>generateThumbnailUrl,
    "isCloudinaryUrl": ()=>isCloudinaryUrl,
    "isValidImageFile": ()=>isValidImageFile,
    "uploadMultipleToCloudinary": ()=>uploadMultipleToCloudinary,
    "uploadToCloudinary": ()=>uploadToCloudinary
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
const CLOUD_NAME = ("TURBOPACK compile-time value", "your_cloud_name") || '';
const UPLOAD_PRESET = ("TURBOPACK compile-time value", "your_upload_preset") || '';
// Check if Cloudinary is properly configured
const isCloudinaryConfigured = ()=>{
    return CLOUD_NAME && UPLOAD_PRESET && CLOUD_NAME !== 'your_cloud_name' && UPLOAD_PRESET !== 'your_upload_preset';
};
// Mock image URLs for development
const MOCK_IMAGE_URLS = [
    'https://picsum.photos/400/600?random=1',
    'https://picsum.photos/400/600?random=2',
    'https://picsum.photos/400/600?random=3',
    'https://picsum.photos/400/600?random=4',
    'https://picsum.photos/400/600?random=5',
    'https://picsum.photos/400/600?random=6',
    'https://picsum.photos/400/600?random=7',
    'https://picsum.photos/400/600?random=8',
    'https://picsum.photos/400/600?random=9',
    'https://picsum.photos/400/600?random=10'
];
/**
 * Convert File to base64 data URL
 */ const fileToDataURL = (file)=>{
    return new Promise((resolve, reject)=>{
        const reader = new FileReader();
        reader.onload = (e)=>{
            var _e_target;
            if ((_e_target = e.target) === null || _e_target === void 0 ? void 0 : _e_target.result) {
                resolve(e.target.result);
            } else {
                reject(new Error('Failed to read file'));
            }
        };
        reader.onerror = ()=>reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
};
/**
 * Generate a mock upload result for development using actual uploaded file
 */ const generateMockUploadResult = async (file, index)=>{
    const randomId = "mock_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
    // Convert the actual file to a data URL
    const dataUrl = await fileToDataURL(file);
    return {
        url: dataUrl,
        publicId: randomId,
        format: file.type.split('/')[1] || 'jpeg',
        width: 400,
        height: 600,
        bytes: file.size,
        createdAt: new Date().toISOString()
    };
};
const uploadToCloudinary = async (file)=>{
    // Validate file before upload
    if (!isValidImageFile(file)) {
        throw new Error("Invalid file: ".concat(file.name, ". Must be JPEG, PNG, WebP, or GIF under 10MB."));
    }
    // Check if we should use mock data
    if (!isCloudinaryConfigured()) {
        console.warn('Cloudinary not configured. Using local image data for development.');
        // Simulate upload delay
        await new Promise((resolve)=>setTimeout(resolve, 500 + Math.random() * 1000));
        return await generateMockUploadResult(file, 0);
    }
    //TURBOPACK unreachable
    ;
    const formData = undefined;
};
const uploadMultipleToCloudinary = async (files, onProgress)=>{
    // Validate all files first
    const invalidFiles = files.filter((file)=>!isValidImageFile(file));
    if (invalidFiles.length > 0) {
        const invalidFileNames = invalidFiles.map((f)=>f.name).join(', ');
        throw new Error("Invalid files detected: ".concat(invalidFileNames, ". ") + "All files must be JPEG, PNG, WebP, or GIF under 10MB each.");
    }
    // Check if we should use mock data
    if (!isCloudinaryConfigured()) {
        console.warn('Cloudinary not configured. Using local image data for development.');
        const results = [];
        for(let i = 0; i < files.length; i++){
            // Simulate upload delay
            await new Promise((resolve)=>setTimeout(resolve, 300 + Math.random() * 700));
            results.push(await generateMockUploadResult(files[i], i));
            if (onProgress) {
                const progress = (i + 1) / files.length * 100;
                onProgress(progress);
            }
        }
        return results;
    }
    //TURBOPACK unreachable
    ;
    const results = undefined;
    const totalFiles = undefined;
    let i;
};
const deleteFromCloudinary = async (publicId)=>{
    // If using mock data, just return success
    if (!isCloudinaryConfigured() || publicId.startsWith('mock_')) {
        console.log('Mock mode: Simulating image deletion for', publicId);
        return {
            result: 'ok',
            publicId: publicId
        };
    }
    //TURBOPACK unreachable
    ;
};
const batchDeleteFromCloudinary = async (publicIds)=>{
    const results = {
        successful: [],
        failed: []
    };
    // Process deletions in parallel with error handling for each
    const deletePromises = publicIds.map(async (publicId)=>{
        try {
            const result = await deleteFromCloudinary(publicId);
            if (result.result === 'ok') {
                results.successful.push(publicId);
            } else {
                results.failed.push({
                    publicId,
                    error: result.result === 'not found' ? 'Image not found' : 'Delete failed'
                });
            }
        } catch (error) {
            results.failed.push({
                publicId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    await Promise.allSettled(deletePromises);
    return results;
};
const deleteImageByUrl = async (url)=>{
    // Handle data URLs (local images)
    if (url.includes('data:image')) {
        return {
            result: 'ok',
            publicId: 'local_image'
        };
    }
    // Handle mock URLs
    if (url.includes('picsum.photos')) {
        var _url_match;
        const mockId = ((_url_match = url.match(/id=(mock_[a-zA-Z0-9_]+)/)) === null || _url_match === void 0 ? void 0 : _url_match[1]) || 'mock_unknown';
        return deleteFromCloudinary(mockId);
    }
    const publicId = extractPublicId(url);
    if (!publicId) {
        throw new Error('Invalid Cloudinary URL: Unable to extract public ID');
    }
    return deleteFromCloudinary(publicId);
};
const generateThumbnailUrl = function(url) {
    let width = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 300, height = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 300;
    // Handle mock URLs (data URLs)
    if (url.includes('data:image')) {
        return url; // Data URLs can't be resized via URL manipulation
    }
    // Handle picsum photos
    if (url.includes('picsum.photos')) {
        return url.replace(/\/\d+\/\d+/, "/".concat(width, "/").concat(height));
    }
    return url.replace('/upload/', "/upload/w_".concat(width, ",h_").concat(height, ",c_fill,q_auto/"));
};
const generateOptimizedUrl = function(url) {
    let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    // Handle mock URLs (data URLs and picsum)
    if (url.includes('data:image')) {
        return url; // Data URLs can't be transformed via URL manipulation
    }
    if (url.includes('picsum.photos')) {
        const { width = 400, height = 600, blur } = options;
        let mockUrl = url.replace(/\/\d+\/\d+/, "/".concat(width, "/").concat(height));
        if (blur) {
            mockUrl += "".concat(mockUrl.includes('?') ? '&' : '?', "blur=").concat(Math.min(10, blur / 100));
        }
        return mockUrl;
    }
    const { width, height, quality = 'auto', format = 'auto', blur } = options;
    let transformations = [
        "q_".concat(quality),
        "f_".concat(format)
    ];
    if (width) transformations.push("w_".concat(width));
    if (height) transformations.push("h_".concat(height));
    if (blur) transformations.push("e_blur:".concat(blur));
    const transformString = transformations.join(',');
    return url.replace('/upload/', "/upload/".concat(transformString, "/"));
};
const generateBlurredUrl = function(url) {
    let blurLevel = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1000;
    return generateOptimizedUrl(url, {
        blur: blurLevel,
        quality: 70
    });
};
const isValidImageFile = (file)=>{
    const acceptedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif'
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (!acceptedTypes.includes(file.type)) {
        console.warn("Invalid file type: ".concat(file.type, " for file: ").concat(file.name));
        return false;
    }
    if (file.size > maxSize) {
        console.warn("File too large: ".concat(file.size, " bytes for file: ").concat(file.name));
        return false;
    }
    return true;
};
const formatFileSize = (bytes)=>{
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = [
        'Bytes',
        'KB',
        'MB',
        'GB'
    ];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
const base64ToFile = (base64, filename)=>{
    var _arr__match;
    // Handle data URL format
    const arr = base64.split(',');
    const mime = ((_arr__match = arr[0].match(/:(.*?);/)) === null || _arr__match === void 0 ? void 0 : _arr__match[1]) || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([
        u8arr
    ], filename, {
        type: mime
    });
};
const extractPublicId = (url)=>{
    try {
        const regex = /\/v\d+\/(.+)\.[a-zA-Z]+$/;
        const match = url.match(regex);
        return match ? match[1] : null;
    } catch (e) {
        return null;
    }
};
const isCloudinaryUrl = (url)=>{
    return url.includes('cloudinary.com') && url.includes(CLOUD_NAME);
};
const checkCloudinaryConfig = ()=>{
    if (!isCloudinaryConfigured()) {
        return {
            configured: false,
            message: 'Cloudinary is not configured. Using mock images for development. To enable real image uploads, please update your .env.local file with valid Cloudinary credentials.'
        };
    }
    //TURBOPACK unreachable
    ;
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/hooks/useMyListings.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/hooks/useMyListings.ts
__turbopack_context__.s({
    "useMyListings": ()=>useMyListings
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/AuthContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$ListingContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/ListingContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WalletContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/WalletContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/index.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$listings$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/listings.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$myListingsUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/myListingsUtils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$cloudinary$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/cloudinary.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-browser/v4.js [app-client] (ecmascript) <export default as v4>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/validation/schemas.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-client] (ecmascript) <export * as z>");
var _s = __turbopack_context__.k.signature();
;
;
;
;
;
;
;
;
;
;
;
;
// Validation schema for listing form
const listingFormSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    title: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["listingSchemas"].title,
    description: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["listingSchemas"].description,
    price: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format'),
    isPremium: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
    tags: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    hoursWorn: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].union([
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number()
    ]),
    isAuction: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
    startingPrice: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    reservePrice: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    auctionDuration: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
});
// Sanitize listing form data
function sanitizeFormState(formState) {
    return {
        ...formState,
        title: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(formState.title),
        description: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(formState.description),
        tags: formState.tags.split(',').map((tag)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(tag.trim())).join(', '),
        price: formState.price,
        startingPrice: formState.startingPrice,
        reservePrice: formState.reservePrice,
        auctionDuration: formState.auctionDuration
    };
}
const useMyListings = ()=>{
    _s();
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const { listings = [], addListing, addAuctionListing, removeListing, updateListing, cancelAuction, saveDraft: saveListingDraft, getDrafts: getListingDrafts, deleteDraft: deleteListingDraft, refreshListings, isLoading: listingsLoading, error: listingsError } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$ListingContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useListings"])();
    // Use useContext to get wallet context - it might be undefined
    const walletContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WalletContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletContext"]);
    const orderHistory = (walletContext === null || walletContext === void 0 ? void 0 : walletContext.orderHistory) || [];
    // Form state
    const [formState, setFormState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$myListingsUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["INITIAL_FORM_STATE"]);
    const [showForm, setShowForm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [selectedFiles, setSelectedFiles] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isUploading, setIsUploading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [uploadProgress, setUploadProgress] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    // Editing state
    const [editingState, setEditingState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        listingId: null,
        isEditing: false
    });
    // Analytics state
    const [viewsData, setViewsData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [viewsLoading, setViewsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    // Draft state
    const [drafts, setDrafts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isDraftLoading, setIsDraftLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [currentDraftId, setCurrentDraftId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Error state
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [validationErrors, setValidationErrors] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    // Drag refs
    const dragItem = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const dragOverItem = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Track which listings we've loaded views for
    const loadedViewsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(new Set());
    const isVerified = (user === null || user === void 0 ? void 0 : user.isVerified) || (user === null || user === void 0 ? void 0 : user.verificationStatus) === 'verified';
    var _listings_filter;
    const myListings = (_listings_filter = listings === null || listings === void 0 ? void 0 : listings.filter((listing)=>listing.seller === (user === null || user === void 0 ? void 0 : user.username))) !== null && _listings_filter !== void 0 ? _listings_filter : [];
    // Calculate stats with validation
    const auctionCount = myListings.filter((listing)=>!!listing.auction).length;
    const premiumCount = myListings.filter((listing)=>listing.isPremium).length;
    const standardCount = Math.max(0, myListings.length - (premiumCount + auctionCount));
    // Check listing limits
    const maxListings = isVerified ? 25 : 2;
    const atLimit = myListings.length >= maxListings;
    // Get seller orders with sanitization
    const sellerOrders = orderHistory.filter((order)=>order.seller === (user === null || user === void 0 ? void 0 : user.username)).sort((a, b)=>new Date(b.date).getTime() - new Date(a.date).getTime()).map((order)=>({
            ...order,
            title: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(order.title || ''),
            buyer: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(order.buyer || '')
        }));
    // Load views data for all listings
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useMyListings.useEffect": ()=>{
            myListings.forEach({
                "useMyListings.useEffect": (listing)=>{
                    // Skip if already loaded
                    if (loadedViewsRef.current.has(listing.id)) {
                        return;
                    }
                    // Mark as loading/loaded
                    loadedViewsRef.current.add(listing.id);
                    // Load view count with proper typing
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$listings$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["listingsService"].getListingViews(listing.id).then({
                        "useMyListings.useEffect": (result)=>{
                            if (result.success && result.data !== undefined) {
                                const views = Math.max(0, parseInt(result.data.toString()) || 0);
                                setViewsData({
                                    "useMyListings.useEffect": (prev)=>({
                                            ...prev,
                                            [listing.id]: views
                                        })
                                }["useMyListings.useEffect"]);
                            }
                        }
                    }["useMyListings.useEffect"]).catch({
                        "useMyListings.useEffect": (error)=>{
                            console.error("Error loading views for listing ".concat(listing.id, ":"), error);
                            // Remove from loaded set so it can be retried
                            loadedViewsRef.current.delete(listing.id);
                        }
                    }["useMyListings.useEffect"]);
                }
            }["useMyListings.useEffect"]);
        }
    }["useMyListings.useEffect"], [
        myListings
    ]);
    // Load drafts with sanitization
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useMyListings.useEffect": ()=>{
            const loadDrafts = {
                "useMyListings.useEffect.loadDrafts": async ()=>{
                    if (!user || user.role !== 'seller') return;
                    setIsDraftLoading(true);
                    try {
                        const userDrafts = await getListingDrafts();
                        // Sanitize draft data
                        const sanitizedDrafts = userDrafts.map({
                            "useMyListings.useEffect.loadDrafts.sanitizedDrafts": (draft)=>({
                                    ...draft,
                                    name: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(draft.name || 'Untitled Draft'),
                                    formState: sanitizeFormState(draft.formState)
                                })
                        }["useMyListings.useEffect.loadDrafts.sanitizedDrafts"]);
                        setDrafts(sanitizedDrafts);
                    } catch (error) {
                        console.error('Error loading drafts:', error);
                        setError('Failed to load drafts');
                    } finally{
                        setIsDraftLoading(false);
                    }
                }
            }["useMyListings.useEffect.loadDrafts"];
            loadDrafts();
        }
    }["useMyListings.useEffect"], [
        user,
        getListingDrafts
    ]);
    // Clear error after 5 seconds
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useMyListings.useEffect": ()=>{
            if (error) {
                const timer = setTimeout({
                    "useMyListings.useEffect.timer": ()=>setError(null)
                }["useMyListings.useEffect.timer"], 5000);
                return ({
                    "useMyListings.useEffect": ()=>clearTimeout(timer)
                })["useMyListings.useEffect"];
            }
            // Return undefined when there's no error
            return undefined;
        }
    }["useMyListings.useEffect"], [
        error
    ]);
    // Update form state with sanitization
    const updateFormState = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useMyListings.useCallback[updateFormState]": (updates)=>{
            setFormState({
                "useMyListings.useCallback[updateFormState]": (prev)=>{
                    const updated = {
                        ...prev,
                        ...updates
                    };
                    // Clear validation errors when fields change
                    setValidationErrors({});
                    return updated;
                }
            }["useMyListings.useCallback[updateFormState]"]);
        }
    }["useMyListings.useCallback[updateFormState]"], []);
    // Reset form
    const resetForm = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useMyListings.useCallback[resetForm]": ()=>{
            setFormState(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$myListingsUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["INITIAL_FORM_STATE"]);
            setSelectedFiles([]);
            setEditingState({
                listingId: null,
                isEditing: false
            });
            setShowForm(false);
            setUploadProgress(0);
            setCurrentDraftId(null);
            setError(null);
            setValidationErrors({});
        }
    }["useMyListings.useCallback[resetForm]"], []);
    // Handle file selection with validation
    const handleFileSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useMyListings.useCallback[handleFileSelect]": (e)=>{
            const files = e.target.files;
            if (!files || files.length === 0) return;
            const newFiles = Array.from(files);
            const validFiles = [];
            const errors = [];
            newFiles.forEach({
                "useMyListings.useCallback[handleFileSelect]": (file)=>{
                    const validation = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].validateFileUpload(file, {
                        maxSize: 5 * 1024 * 1024,
                        allowedTypes: [
                            'image/jpeg',
                            'image/jpg',
                            'image/png',
                            'image/webp'
                        ],
                        allowedExtensions: [
                            'jpg',
                            'jpeg',
                            'png',
                            'webp'
                        ]
                    });
                    if (validation.valid) {
                        validFiles.push(file);
                    } else {
                        errors.push("".concat(file.name, ": ").concat(validation.error));
                    }
                }
            }["useMyListings.useCallback[handleFileSelect]"]);
            if (errors.length > 0) {
                setError(errors.join(', '));
            }
            setSelectedFiles({
                "useMyListings.useCallback[handleFileSelect]": (prev)=>[
                        ...prev,
                        ...validFiles
                    ]
            }["useMyListings.useCallback[handleFileSelect]"]);
            e.target.value = '';
        }
    }["useMyListings.useCallback[handleFileSelect]"], []);
    // Remove selected file
    const removeSelectedFile = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useMyListings.useCallback[removeSelectedFile]": (index)=>{
            setSelectedFiles({
                "useMyListings.useCallback[removeSelectedFile]": (prev)=>prev.filter({
                        "useMyListings.useCallback[removeSelectedFile]": (_, i)=>i !== index
                    }["useMyListings.useCallback[removeSelectedFile]"])
            }["useMyListings.useCallback[removeSelectedFile]"]);
        }
    }["useMyListings.useCallback[removeSelectedFile]"], []);
    // Upload files using Cloudinary
    const handleUploadFiles = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useMyListings.useCallback[handleUploadFiles]": async ()=>{
            if (selectedFiles.length === 0) return;
            // Check Cloudinary configuration
            const cloudinaryCheck = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$cloudinary$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["checkCloudinaryConfig"])();
            if (!cloudinaryCheck.configured) {
                console.warn(cloudinaryCheck.message);
                // Show a user-friendly message
                if (!error) {
                    setError('Using local image storage for development. Images will work but are stored in browser memory.');
                    // Clear the error after 3 seconds
                    setTimeout({
                        "useMyListings.useCallback[handleUploadFiles]": ()=>setError(null)
                    }["useMyListings.useCallback[handleUploadFiles]"], 3000);
                }
            }
            setIsUploading(true);
            setUploadProgress(0);
            try {
                // Validate all files before upload
                for (const file of selectedFiles){
                    const validation = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].validateFileUpload(file);
                    if (!validation.valid) {
                        throw new Error(validation.error);
                    }
                }
                // Upload to Cloudinary with progress tracking
                const uploadResults = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$cloudinary$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uploadMultipleToCloudinary"])(selectedFiles, {
                    "useMyListings.useCallback[handleUploadFiles]": (progress)=>{
                        setUploadProgress(Math.round(progress));
                    }
                }["useMyListings.useCallback[handleUploadFiles]"]);
                // Extract and validate URLs
                const newImageUrls = uploadResults.map({
                    "useMyListings.useCallback[handleUploadFiles].newImageUrls": (result)=>{
                        // Validate URL
                        try {
                            new URL(result.url);
                            return result.url;
                        } catch (e) {
                            throw new Error('Invalid image URL received from upload');
                        }
                    }
                }["useMyListings.useCallback[handleUploadFiles].newImageUrls"]);
                // Update form state with new URLs
                updateFormState({
                    imageUrls: [
                        ...formState.imageUrls,
                        ...newImageUrls
                    ]
                });
                setSelectedFiles([]);
                setUploadProgress(0);
                console.log('Images uploaded successfully');
            } catch (error) {
                console.error("Error uploading images:", error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                setError((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])("Failed to upload images: ".concat(errorMessage)));
            } finally{
                setIsUploading(false);
                setUploadProgress(0);
            }
        }
    }["useMyListings.useCallback[handleUploadFiles]"], [
        selectedFiles,
        formState.imageUrls,
        updateFormState,
        error
    ]);
    // Remove image URL
    const handleRemoveImageUrl = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useMyListings.useCallback[handleRemoveImageUrl]": (urlToRemove)=>{
            updateFormState({
                imageUrls: formState.imageUrls.filter({
                    "useMyListings.useCallback[handleRemoveImageUrl]": (url)=>url !== urlToRemove
                }["useMyListings.useCallback[handleRemoveImageUrl]"])
            });
        }
    }["useMyListings.useCallback[handleRemoveImageUrl]"], [
        formState.imageUrls,
        updateFormState
    ]);
    // Handle image reorder
    const handleImageReorder = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useMyListings.useCallback[handleImageReorder]": (dragIndex, dropIndex)=>{
            if (dragIndex < 0 || dropIndex < 0 || dragIndex >= formState.imageUrls.length || dropIndex >= formState.imageUrls.length) {
                return;
            }
            const _imageUrls = [
                ...formState.imageUrls
            ];
            const draggedItemContent = _imageUrls[dragIndex];
            _imageUrls.splice(dragIndex, 1);
            _imageUrls.splice(dropIndex, 0, draggedItemContent);
            updateFormState({
                imageUrls: _imageUrls
            });
        }
    }["useMyListings.useCallback[handleImageReorder]"], [
        formState.imageUrls,
        updateFormState
    ]);
    // Save as draft with validation
    const handleSaveDraft = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useMyListings.useCallback[handleSaveDraft]": async ()=>{
            if (!user || user.role !== 'seller') return;
            setError(null);
            try {
                var _drafts_find;
                // Sanitize form state before saving
                const sanitizedFormState = sanitizeFormState(formState);
                const draft = {
                    id: currentDraftId || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
                    seller: user.username,
                    formState: sanitizedFormState,
                    createdAt: currentDraftId ? ((_drafts_find = drafts.find({
                        "useMyListings.useCallback[handleSaveDraft]": (d)=>d.id === currentDraftId
                    }["useMyListings.useCallback[handleSaveDraft]"])) === null || _drafts_find === void 0 ? void 0 : _drafts_find.createdAt) || new Date().toISOString() : new Date().toISOString(),
                    lastModified: new Date().toISOString(),
                    name: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(formState.title || 'Untitled Draft')
                };
                const success = await saveListingDraft(draft);
                if (success) {
                    // Update local drafts
                    setDrafts({
                        "useMyListings.useCallback[handleSaveDraft]": (prev)=>{
                            const existing = prev.findIndex({
                                "useMyListings.useCallback[handleSaveDraft].existing": (d)=>d.id === draft.id
                            }["useMyListings.useCallback[handleSaveDraft].existing"]);
                            if (existing >= 0) {
                                const updated = [
                                    ...prev
                                ];
                                updated[existing] = draft;
                                return updated;
                            } else {
                                return [
                                    ...prev,
                                    draft
                                ];
                            }
                        }
                    }["useMyListings.useCallback[handleSaveDraft]"]);
                    setCurrentDraftId(draft.id);
                    alert('Draft saved successfully!');
                } else {
                    throw new Error('Failed to save draft');
                }
            } catch (error) {
                console.error('Error saving draft:', error);
                setError('Failed to save draft. Please try again.');
            }
        }
    }["useMyListings.useCallback[handleSaveDraft]"], [
        user,
        formState,
        currentDraftId,
        drafts,
        saveListingDraft
    ]);
    // Load draft
    const handleLoadDraft = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useMyListings.useCallback[handleLoadDraft]": (draft)=>{
            // Sanitize draft data before loading
            const sanitizedFormState = sanitizeFormState(draft.formState);
            setFormState(sanitizedFormState);
            setCurrentDraftId(draft.id);
            setShowForm(true);
            setEditingState({
                listingId: null,
                isEditing: false
            });
            setValidationErrors({});
        }
    }["useMyListings.useCallback[handleLoadDraft]"], []);
    // Delete draft
    const handleDeleteDraft = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useMyListings.useCallback[handleDeleteDraft]": async (draftId)=>{
            if (confirm('Are you sure you want to delete this draft?')) {
                try {
                    const success = await deleteListingDraft(draftId);
                    if (success) {
                        setDrafts({
                            "useMyListings.useCallback[handleDeleteDraft]": (prev)=>prev.filter({
                                    "useMyListings.useCallback[handleDeleteDraft]": (d)=>d.id !== draftId
                                }["useMyListings.useCallback[handleDeleteDraft]"])
                        }["useMyListings.useCallback[handleDeleteDraft]"]);
                        if (currentDraftId === draftId) {
                            setCurrentDraftId(null);
                        }
                    }
                } catch (error) {
                    console.error('Error deleting draft:', error);
                    setError('Failed to delete draft');
                }
            }
        }
    }["useMyListings.useCallback[handleDeleteDraft]"], [
        currentDraftId,
        deleteListingDraft
    ]);
    // Validate form data
    const validateFormData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useMyListings.useCallback[validateFormData]": ()=>{
            const errors = {};
            // Validate basic fields
            try {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["listingSchemas"].title.parse(formState.title);
            } catch (e) {
                errors.title = 'Title must be 5-100 characters';
            }
            try {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["listingSchemas"].description.parse(formState.description);
            } catch (e) {
                errors.description = 'Description must be 20-2000 characters';
            }
            if (formState.imageUrls.length === 0) {
                errors.images = 'At least one image is required';
            }
            // Validate price fields
            if (formState.isAuction) {
                const startingBid = parseFloat(formState.startingPrice);
                if (isNaN(startingBid) || startingBid < 0.01 || startingBid > 10000) {
                    errors.startingPrice = 'Starting bid must be between $0.01 and $10,000';
                }
                if (formState.reservePrice.trim() !== '') {
                    const reserveBid = parseFloat(formState.reservePrice);
                    if (isNaN(reserveBid) || reserveBid < startingBid) {
                        errors.reservePrice = 'Reserve price must be equal to or greater than starting bid';
                    }
                }
            } else {
                const price = parseFloat(formState.price);
                if (isNaN(price) || price < 0.01 || price > 10000) {
                    errors.price = 'Price must be between $0.01 and $10,000';
                }
            }
            // Validate hours worn
            if (formState.hoursWorn !== '') {
                const hours = parseInt(formState.hoursWorn.toString());
                if (isNaN(hours) || hours < 0 || hours > 168) {
                    errors.hoursWorn = 'Hours worn must be between 0 and 168';
                }
            }
            setValidationErrors(errors);
            return Object.keys(errors).length === 0;
        }
    }["useMyListings.useCallback[validateFormData]"], [
        formState
    ]);
    // Save listing with validation and sanitization
    const handleSaveListing = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useMyListings.useCallback[handleSaveListing]": async ()=>{
            if (!validateFormData()) {
                setError('Please fix the validation errors');
                return;
            }
            const { title, description, imageUrls, isAuction, startingPrice, reservePrice, auctionDuration, price, tags, hoursWorn, isPremium } = formState;
            setError(null);
            try {
                // Sanitize all inputs
                const sanitizedTitle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(title);
                const sanitizedDescription = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(description);
                const tagsList = tags.split(',').map({
                    "useMyListings.useCallback[handleSaveListing].tagsList": (tag)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(tag.trim())
                }["useMyListings.useCallback[handleSaveListing].tagsList"]).filter({
                    "useMyListings.useCallback[handleSaveListing].tagsList": (tag)=>tag
                }["useMyListings.useCallback[handleSaveListing].tagsList"]);
                if (isAuction) {
                    if (!isVerified) {
                        setError('You must be a verified seller to create auction listings.');
                        return;
                    }
                    const startingBid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeNumber"])(startingPrice, 0.01, 10000);
                    let reserveBid = undefined;
                    if (reservePrice.trim() !== '') {
                        reserveBid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeNumber"])(reservePrice, startingBid, 10000);
                    }
                    const listingData = {
                        title: sanitizedTitle,
                        description: sanitizedDescription,
                        price: startingBid,
                        imageUrls,
                        seller: (user === null || user === void 0 ? void 0 : user.username) || 'unknown',
                        isPremium,
                        tags: tagsList,
                        hoursWorn: hoursWorn === '' ? undefined : (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeNumber"])(hoursWorn.toString(), 0, 168)
                    };
                    const auctionSettings = {
                        startingPrice: startingBid,
                        reservePrice: reserveBid,
                        endTime: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$myListingsUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["calculateAuctionEndTime"])(auctionDuration)
                    };
                    await addAuctionListing(listingData, auctionSettings);
                    // Delete draft if it was loaded
                    if (currentDraftId) {
                        await deleteListingDraft(currentDraftId);
                        setDrafts({
                            "useMyListings.useCallback[handleSaveListing]": (prev)=>prev.filter({
                                    "useMyListings.useCallback[handleSaveListing]": (d)=>d.id !== currentDraftId
                                }["useMyListings.useCallback[handleSaveListing]"])
                        }["useMyListings.useCallback[handleSaveListing]"]);
                    }
                    resetForm();
                } else {
                    const numericPrice = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeNumber"])(price, 0.01, 10000);
                    const listingData = {
                        title: sanitizedTitle,
                        description: sanitizedDescription,
                        price: numericPrice,
                        imageUrls,
                        seller: (user === null || user === void 0 ? void 0 : user.username) || 'unknown',
                        isPremium,
                        tags: tagsList,
                        hoursWorn: hoursWorn === '' ? undefined : (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeNumber"])(hoursWorn.toString(), 0, 168)
                    };
                    if (editingState.isEditing && editingState.listingId) {
                        if (updateListing) {
                            await updateListing(editingState.listingId, listingData);
                        } else {
                            console.error("updateListing function not available in context");
                        }
                    } else {
                        await addListing(listingData);
                    }
                    // Delete draft if it was loaded
                    if (currentDraftId) {
                        await deleteListingDraft(currentDraftId);
                        setDrafts({
                            "useMyListings.useCallback[handleSaveListing]": (prev)=>prev.filter({
                                    "useMyListings.useCallback[handleSaveListing]": (d)=>d.id !== currentDraftId
                                }["useMyListings.useCallback[handleSaveListing]"])
                        }["useMyListings.useCallback[handleSaveListing]"]);
                    }
                    resetForm();
                }
            } catch (error) {
                console.error('Error saving listing:', error);
                setError('Failed to save listing. Please try again.');
            }
        }
    }["useMyListings.useCallback[handleSaveListing]"], [
        formState,
        editingState,
        user,
        isVerified,
        addListing,
        addAuctionListing,
        updateListing,
        currentDraftId,
        deleteListingDraft,
        resetForm,
        validateFormData
    ]);
    // Handle edit click with sanitization
    const handleEditClick = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useMyListings.useCallback[handleEditClick]": (listing)=>{
            var _listing_auction, _listing_auction_reservePrice, _listing_auction1;
            setEditingState({
                listingId: listing.id,
                isEditing: true
            });
            var _listing_isPremium;
            setFormState({
                title: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(listing.title),
                description: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(listing.description),
                price: listing.price.toString(),
                imageUrls: listing.imageUrls || [],
                isPremium: (_listing_isPremium = listing.isPremium) !== null && _listing_isPremium !== void 0 ? _listing_isPremium : false,
                tags: listing.tags ? listing.tags.map({
                    "useMyListings.useCallback[handleEditClick]": (tag)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(tag)
                }["useMyListings.useCallback[handleEditClick]"]).join(', ') : '',
                hoursWorn: listing.hoursWorn !== undefined && listing.hoursWorn !== null ? listing.hoursWorn : '',
                isAuction: !!listing.auction,
                startingPrice: ((_listing_auction = listing.auction) === null || _listing_auction === void 0 ? void 0 : _listing_auction.startingPrice.toString()) || '',
                reservePrice: ((_listing_auction1 = listing.auction) === null || _listing_auction1 === void 0 ? void 0 : (_listing_auction_reservePrice = _listing_auction1.reservePrice) === null || _listing_auction_reservePrice === void 0 ? void 0 : _listing_auction_reservePrice.toString()) || '',
                auctionDuration: listing.auction ? '1' : '1'
            });
            setSelectedFiles([]);
            setShowForm(true);
            setCurrentDraftId(null);
            setValidationErrors({});
            // Handle auction data if present
            if (listing.auction) {
                // Calculate remaining days for auction
                const endTime = new Date(listing.auction.endTime);
                const now = new Date();
                const daysRemaining = Math.ceil((endTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                updateFormState({
                    auctionDuration: Math.max(1, Math.min(7, daysRemaining)).toString()
                });
            }
        }
    }["useMyListings.useCallback[handleEditClick]"], [
        updateFormState
    ]);
    // Handle cancel auction
    const handleCancelAuction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useMyListings.useCallback[handleCancelAuction]": async (listingId)=>{
            if (confirm('Are you sure you want to cancel this auction? This action cannot be undone.')) {
                try {
                    const success = await cancelAuction(listingId);
                    if (!success) {
                        setError('Failed to cancel auction');
                    }
                } catch (error) {
                    console.error('Error cancelling auction:', error);
                    setError('Failed to cancel auction');
                }
            }
        }
    }["useMyListings.useCallback[handleCancelAuction]"], [
        cancelAuction
    ]);
    // Handle delete listing
    const handleRemoveListing = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useMyListings.useCallback[handleRemoveListing]": async (listingId)=>{
            if (confirm('Are you sure you want to remove this listing?')) {
                try {
                    await removeListing(listingId);
                } catch (error) {
                    console.error('Error removing listing:', error);
                    setError('Failed to remove listing');
                }
            }
        }
    }["useMyListings.useCallback[handleRemoveListing]"], [
        removeListing
    ]);
    // Get listing analytics
    const getListingAnalytics = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useMyListings.useCallback[getListingAnalytics]": (listing)=>{
            const views = Math.max(0, viewsData[listing.id] || 0);
            return {
                views
            };
        }
    }["useMyListings.useCallback[getListingAnalytics]"], [
        viewsData
    ]);
    // Drag handlers for direct use
    const handleDragStart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useMyListings.useCallback[handleDragStart]": (index)=>{
            if (index >= 0 && index < formState.imageUrls.length) {
                dragItem.current = index;
            }
        }
    }["useMyListings.useCallback[handleDragStart]"], [
        formState.imageUrls.length
    ]);
    const handleDragEnter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useMyListings.useCallback[handleDragEnter]": (index)=>{
            if (index >= 0 && index < formState.imageUrls.length) {
                dragOverItem.current = index;
            }
        }
    }["useMyListings.useCallback[handleDragEnter]"], [
        formState.imageUrls.length
    ]);
    const handleDrop = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useMyListings.useCallback[handleDrop]": ()=>{
            if (dragItem.current === null || dragOverItem.current === null) return;
            if (dragItem.current < 0 || dragOverItem.current < 0 || dragItem.current >= formState.imageUrls.length || dragOverItem.current >= formState.imageUrls.length) {
                return;
            }
            const _imageUrls = [
                ...formState.imageUrls
            ];
            const draggedItemContent = _imageUrls[dragItem.current];
            _imageUrls.splice(dragItem.current, 1);
            _imageUrls.splice(dragOverItem.current, 0, draggedItemContent);
            dragItem.current = null;
            dragOverItem.current = null;
            updateFormState({
                imageUrls: _imageUrls
            });
        }
    }["useMyListings.useCallback[handleDrop]"], [
        formState.imageUrls,
        updateFormState
    ]);
    return {
        // State
        user,
        formState,
        showForm,
        selectedFiles,
        isUploading,
        uploadProgress,
        editingState,
        isVerified,
        myListings,
        atLimit,
        maxListings,
        auctionCount,
        premiumCount,
        standardCount,
        sellerOrders,
        drafts,
        isDraftLoading,
        currentDraftId,
        error,
        validationErrors,
        isLoading: listingsLoading,
        // Actions
        setShowForm,
        updateFormState,
        resetForm,
        handleFileSelect,
        removeSelectedFile,
        handleUploadFiles,
        handleRemoveImageUrl,
        handleImageReorder,
        handleSaveListing,
        handleEditClick,
        handleCancelAuction,
        removeListing: handleRemoveListing,
        getListingAnalytics,
        handleSaveDraft,
        handleLoadDraft,
        handleDeleteDraft,
        refreshListings,
        // Drag handlers for direct use
        handleDragStart,
        handleDragEnter,
        handleDrop
    };
};
_s(useMyListings, "6T1mU8PmTur6l11545RzztXJ1ak=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$ListingContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useListings"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/app/sellers/my-listings/page.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/app/sellers/my-listings/page.tsx
__turbopack_context__.s({
    "default": ()=>MyListingsPage
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$crown$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Crown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/crown.js [app-client] (ecmascript) <export default as Crown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/sparkles.js [app-client] (ecmascript) <export default as Sparkles>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$gavel$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Gavel$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/gavel.js [app-client] (ecmascript) <export default as Gavel>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$no$2d$axes$2d$column$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chart-no-axes-column.js [app-client] (ecmascript) <export default as BarChart2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$lock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Lock$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/lock.js [app-client] (ecmascript) <export default as Lock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldCheck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shield-check.js [app-client] (ecmascript) <export default as ShieldCheck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$BanCheck$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/BanCheck.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$RequireAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/RequireAuth.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$myListings$2f$ListingCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/myListings/ListingCard.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$myListings$2f$ListingForm$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/myListings/ListingForm.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$myListings$2f$RecentSales$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/myListings/RecentSales.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useMyListings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useMyListings.ts [app-client] (ecmascript)");
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
const AUCTION_TIPS = [
    'Set a competitive starting price to attract initial bids.',
    "Use a reserve price to ensure you don't sell below your minimum acceptable price.",
    'Add high-quality photos and detailed descriptions to encourage higher bids.',
    'Auctions create excitement and can result in higher final prices than fixed listings.'
];
const PREMIUM_TIPS = [
    'Premium listings are only visible to your subscribers, increasing exclusivity.',
    'Set your monthly subscription price in your profile settings to unlock premium features.',
    'Use high-quality, appealing images for your listings to attract more views and buyers.',
    'Premium listings can often command higher prices due to their exclusive nature.'
];
// Separate the main content into its own component
function MyListingsContent() {
    _s();
    const { // State
    user, showForm, formState, selectedFiles, isUploading, uploadProgress, editingState, isVerified, myListings, atLimit, maxListings, auctionCount, premiumCount, standardCount, sellerOrders, // Actions
    setShowForm, updateFormState, resetForm, handleFileSelect, removeSelectedFile, handleUploadFiles, handleRemoveImageUrl, handleImageReorder, handleSaveListing, handleEditClick, handleCancelAuction, removeListing, getListingAnalytics } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useMyListings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMyListings"])();
    if (!user) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-black flex items-center justify-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-white",
                children: "Loading..."
            }, void 0, false, {
                fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                lineNumber: 66,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/sellers/my-listings/page.tsx",
            lineNumber: 65,
            columnNumber: 7
        }, this);
    }
    var _myListings_length;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        className: "min-h-screen bg-black text-white py-10 px-4 sm:px-6 lg:px-8",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "max-w-7xl mx-auto",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mb-8",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            className: "text-3xl sm:text-4xl font-bold text-white",
                            children: "My Listings"
                        }, void 0, false, {
                            fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                            lineNumber: 76,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-16 h-1 bg-[#ff950e] mt-2 rounded-full"
                        }, void 0, false, {
                            fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                            lineNumber: 77,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                    lineNumber: 75,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "lg:col-span-2 space-y-8",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-1 sm:grid-cols-3 gap-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bg-[#1a1a1a] p-6 rounded-xl shadow-lg border border-gray-800",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex justify-between items-center",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                                className: "text-lg font-semibold text-gray-300",
                                                                children: "Standard Listings"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                                lineNumber: 88,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-4xl font-bold text-white",
                                                                children: standardCount !== null && standardCount !== void 0 ? standardCount : 0
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                                lineNumber: 89,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                        lineNumber: 87,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__["Sparkles"], {
                                                        className: "w-10 h-10 text-gray-600"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                        lineNumber: 91,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                lineNumber: 86,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                            lineNumber: 85,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bg-[#1a1a1a] p-6 rounded-xl shadow-lg border border-[#ff950e]",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex justify-between items-center",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                                className: "text-lg font-semibold text-gray-300",
                                                                children: "Premium Listings"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                                lineNumber: 97,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-4xl font-bold text-[#ff950e]",
                                                                children: premiumCount !== null && premiumCount !== void 0 ? premiumCount : 0
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                                lineNumber: 98,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                        lineNumber: 96,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$crown$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Crown$3e$__["Crown"], {
                                                        className: "w-10 h-10 text-[#ff950e]"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                        lineNumber: 100,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                lineNumber: 95,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                            lineNumber: 94,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bg-[#1a1a1a] p-6 rounded-xl shadow-lg border border-purple-700",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex justify-between items-center",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                                className: "text-lg font-semibold text-gray-300",
                                                                children: "Auction Listings"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                                lineNumber: 106,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-4xl font-bold text-purple-500",
                                                                children: auctionCount !== null && auctionCount !== void 0 ? auctionCount : 0
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                                lineNumber: 107,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                        lineNumber: 105,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$gavel$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Gavel$3e$__["Gavel"], {
                                                        className: "w-10 h-10 text-purple-500"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                        lineNumber: 109,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                lineNumber: 104,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                            lineNumber: 103,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                    lineNumber: 84,
                                    columnNumber: 13
                                }, this),
                                atLimit && !editingState.isEditing && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bg-yellow-900 border border-yellow-700 text-yellow-200 rounded-lg p-4 my-4 text-center font-semibold",
                                    children: isVerified ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                        children: [
                                            "You have reached the maximum of ",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-[#ff950e] font-bold",
                                                children: "25"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                lineNumber: 118,
                                                columnNumber: 53
                                            }, this),
                                            " listings for verified sellers."
                                        ]
                                    }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                        children: [
                                            "Unverified sellers can only have ",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-[#ff950e] font-bold",
                                                children: "2"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                lineNumber: 121,
                                                columnNumber: 54
                                            }, this),
                                            " active listings.",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                                fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                lineNumber: 121,
                                                columnNumber: 122
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "block mt-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                        href: "/sellers/verify",
                                                        className: "text-[#ff950e] font-bold underline hover:text-white transition",
                                                        children: "Verify your account"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                        lineNumber: 123,
                                                        columnNumber: 23
                                                    }, this),
                                                    ' ',
                                                    "to add up to 25 listings!"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                lineNumber: 122,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                    lineNumber: 116,
                                    columnNumber: 15
                                }, this),
                                !showForm && !editingState.isEditing && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex justify-center",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>setShowForm(true),
                                        className: "px-8 py-3 rounded-full bg-[#ff950e] text-black font-bold text-lg shadow-lg hover:bg-[#e0850d] transition flex items-center gap-2",
                                        disabled: atLimit,
                                        style: atLimit ? {
                                            opacity: 0.5,
                                            cursor: 'not-allowed'
                                        } : {},
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__["Sparkles"], {
                                                className: "w-5 h-5"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                lineNumber: 145,
                                                columnNumber: 19
                                            }, this),
                                            "Create New Listing"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                        lineNumber: 139,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                    lineNumber: 138,
                                    columnNumber: 15
                                }, this),
                                (showForm || editingState.isEditing) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bg-[#1a1a1a] p-6 sm:p-8 rounded-xl shadow-lg border border-gray-800",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$myListings$2f$ListingForm$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        formState: formState,
                                        isEditing: editingState.isEditing,
                                        isVerified: isVerified,
                                        selectedFiles: selectedFiles,
                                        isUploading: isUploading,
                                        uploadProgress: uploadProgress,
                                        onFormChange: updateFormState,
                                        onFileSelect: handleFileSelect,
                                        onRemoveFile: removeSelectedFile,
                                        onUploadFiles: handleUploadFiles,
                                        onRemoveImage: handleRemoveImageUrl,
                                        onImageReorder: handleImageReorder,
                                        onSave: handleSaveListing,
                                        onCancel: resetForm
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                        lineNumber: 153,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                    lineNumber: 152,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bg-[#1a1a1a] p-6 sm:p-8 rounded-xl shadow-lg border border-gray-800",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "text-2xl font-bold mb-6 text-white flex items-center gap-3",
                                            children: [
                                                "Your Active Listings",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$no$2d$axes$2d$column$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart2$3e$__["BarChart2"], {
                                                    className: "w-6 h-6 text-[#ff950e]"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                    lineNumber: 176,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                            lineNumber: 174,
                                            columnNumber: 15
                                        }, this),
                                        ((_myListings_length = myListings === null || myListings === void 0 ? void 0 : myListings.length) !== null && _myListings_length !== void 0 ? _myListings_length : 0) === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-center py-10 bg-black rounded-lg border border-dashed border-gray-700 text-gray-400",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-lg mb-2",
                                                    children: "You haven't created any listings yet."
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                    lineNumber: 180,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-sm",
                                                    children: "Use the button above to add your first listing."
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                    lineNumber: 181,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                            lineNumber: 179,
                                            columnNumber: 17
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "grid grid-cols-1 md:grid-cols-2 gap-6",
                                            children: myListings.map((listing)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$myListings$2f$ListingCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                    listing: listing,
                                                    analytics: getListingAnalytics(listing),
                                                    onEdit: handleEditClick,
                                                    onDelete: removeListing,
                                                    onCancelAuction: handleCancelAuction
                                                }, listing.id, false, {
                                                    fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                    lineNumber: 186,
                                                    columnNumber: 21
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                            lineNumber: 184,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                    lineNumber: 173,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                            lineNumber: 82,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-8",
                            children: [
                                !isVerified && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bg-[#1a1a1a] p-6 sm:p-8 rounded-xl shadow-lg border border-yellow-700",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "text-2xl font-bold mb-5 text-white flex items-center gap-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldCheck$3e$__["ShieldCheck"], {
                                                    className: "text-yellow-500 w-6 h-6"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                    lineNumber: 206,
                                                    columnNumber: 19
                                                }, this),
                                                "Get Verified"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                            lineNumber: 205,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "mb-5",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-gray-300 mb-3",
                                                    children: "Verified sellers get these exclusive benefits:"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                    lineNumber: 210,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                                    className: "space-y-2 text-gray-300 text-sm",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                            className: "flex items-start gap-2",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-yellow-500 font-bold text-lg leading-none",
                                                                    children: "•"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                                    lineNumber: 213,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    children: [
                                                                        "Post up to ",
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "text-yellow-500 font-bold",
                                                                            children: "25 listings"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                                            lineNumber: 214,
                                                                            columnNumber: 40
                                                                        }, this),
                                                                        " (vs only 2 for unverified)"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                                    lineNumber: 214,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                            lineNumber: 212,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                            className: "flex items-start gap-2",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-yellow-500 font-bold text-lg leading-none",
                                                                    children: "•"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                                    lineNumber: 217,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    children: [
                                                                        "Create ",
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "text-purple-400 font-bold",
                                                                            children: "auction listings"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                                            lineNumber: 218,
                                                                            columnNumber: 36
                                                                        }, this),
                                                                        " for higher bids"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                                    lineNumber: 218,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                            lineNumber: 216,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                            className: "flex items-start gap-2",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-yellow-500 font-bold text-lg leading-none",
                                                                    children: "•"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                                    lineNumber: 221,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "flex items-center",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            children: "Display a verification badge "
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                                            lineNumber: 223,
                                                                            columnNumber: 25
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                                            src: "/verification_badge.png",
                                                                            alt: "Verification Badge",
                                                                            className: "w-4 h-4 mx-1"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                                            lineNumber: 224,
                                                                            columnNumber: 25
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            children: " on your profile and listings"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                                            lineNumber: 225,
                                                                            columnNumber: 25
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                                    lineNumber: 222,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                            lineNumber: 220,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                            className: "flex items-start gap-2",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-yellow-500 font-bold text-lg leading-none",
                                                                    children: "•"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                                    lineNumber: 229,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    children: "Earn buyers' trust for more sales and higher prices"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                                    lineNumber: 230,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                            lineNumber: 228,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                    lineNumber: 211,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                            lineNumber: 209,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            href: "/sellers/verify",
                                            className: "w-full bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-500 font-bold text-lg transition flex items-center justify-center gap-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldCheck$3e$__["ShieldCheck"], {
                                                    className: "w-5 h-5"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                    lineNumber: 238,
                                                    columnNumber: 19
                                                }, this),
                                                "Verify My Account"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                            lineNumber: 234,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                    lineNumber: 204,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bg-[#1a1a1a] p-6 sm:p-8 rounded-xl shadow-lg border border-purple-700",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "text-2xl font-bold mb-5 text-white flex items-center gap-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$gavel$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Gavel$3e$__["Gavel"], {
                                                    className: "text-purple-500 w-6 h-6"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                    lineNumber: 247,
                                                    columnNumber: 17
                                                }, this),
                                                "Auction Tips"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                            lineNumber: 246,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                            className: "space-y-4 text-gray-300 text-sm",
                                            children: AUCTION_TIPS.map((tip, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                    className: "flex items-start gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-purple-500 font-bold text-lg leading-none",
                                                            children: "•"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                            lineNumber: 253,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            children: tip
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                            lineNumber: 254,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, index, true, {
                                                    fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                    lineNumber: 252,
                                                    columnNumber: 19
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                            lineNumber: 250,
                                            columnNumber: 15
                                        }, this),
                                        !isVerified && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "mt-5 pt-4 border-t border-gray-700",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$lock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Lock$3e$__["Lock"], {
                                                        className: "text-yellow-500 w-5 h-5"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                        lineNumber: 261,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-yellow-400 text-sm",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                                href: "/sellers/verify",
                                                                className: "underline hover:text-yellow-300",
                                                                children: "Get verified"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                                lineNumber: 263,
                                                                columnNumber: 23
                                                            }, this),
                                                            ' ',
                                                            "to unlock auction listings!"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                        lineNumber: 262,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                lineNumber: 260,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                            lineNumber: 259,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                    lineNumber: 245,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bg-[#1a1a1a] p-6 sm:p-8 rounded-xl shadow-lg border border-[#ff950e]",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "text-2xl font-bold mb-5 text-white flex items-center gap-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$crown$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Crown$3e$__["Crown"], {
                                                    className: "text-[#ff950e] w-6 h-6"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                    lineNumber: 276,
                                                    columnNumber: 17
                                                }, this),
                                                "Premium Seller Tips"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                            lineNumber: 275,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                            className: "space-y-4 text-gray-300 text-sm",
                                            children: PREMIUM_TIPS.map((tip, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                    className: "flex items-start gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-[#ff950e] font-bold text-lg leading-none",
                                                            children: "•"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                            lineNumber: 282,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            children: tip
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                            lineNumber: 283,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, index, true, {
                                                    fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                                    lineNumber: 281,
                                                    columnNumber: 19
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                            lineNumber: 279,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                    lineNumber: 274,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$myListings$2f$RecentSales$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    orders: sellerOrders || []
                                }, void 0, false, {
                                    fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                                    lineNumber: 290,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                            lineNumber: 201,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                    lineNumber: 80,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/app/sellers/my-listings/page.tsx",
            lineNumber: 73,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/sellers/my-listings/page.tsx",
        lineNumber: 72,
        columnNumber: 5
    }, this);
}
_s(MyListingsContent, "q7oDFycZbEDGzOJjKQ7kwpnP1EI=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useMyListings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMyListings"]
    ];
});
_c = MyListingsContent;
function MyListingsPage() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$BanCheck$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$RequireAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
            role: "seller",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MyListingsContent, {}, void 0, false, {
                fileName: "[project]/src/app/sellers/my-listings/page.tsx",
                lineNumber: 303,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/sellers/my-listings/page.tsx",
            lineNumber: 302,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/sellers/my-listings/page.tsx",
        lineNumber: 301,
        columnNumber: 5
    }, this);
}
_c1 = MyListingsPage;
var _c, _c1;
__turbopack_context__.k.register(_c, "MyListingsContent");
__turbopack_context__.k.register(_c1, "MyListingsPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=src_cee442ec._.js.map