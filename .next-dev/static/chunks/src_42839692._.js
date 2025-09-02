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
"[project]/src/components/browse/BrowseHeader.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": ()=>BrowseHeader
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/sparkles.js [app-client] (ecmascript) <export default as Sparkles>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Package$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/package.js [app-client] (ecmascript) <export default as Package>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shopping$2d$bag$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShoppingBag$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shopping-bag.js [app-client] (ecmascript) <export default as ShoppingBag>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$crown$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Crown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/crown.js [app-client] (ecmascript) <export default as Crown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$gavel$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Gavel$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/gavel.js [app-client] (ecmascript) <export default as Gavel>");
'use client';
;
;
function BrowseHeader(param) {
    let { user, filteredListingsCount, filter, categoryCounts, onFilterChange } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            (user === null || user === void 0 ? void 0 : user.role) === 'seller' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-blue-700/20 border border-blue-700 text-blue-400 p-4 rounded-lg mb-6 max-w-3xl mx-auto",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-sm flex items-center gap-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__["Sparkles"], {
                            className: "w-4 h-4"
                        }, void 0, false, {
                            fileName: "[project]/src/components/browse/BrowseHeader.tsx",
                            lineNumber: 18,
                            columnNumber: 13
                        }, this),
                        "You are viewing this page as a seller. You can browse listings but cannot make purchases."
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/browse/BrowseHeader.tsx",
                    lineNumber: 17,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/browse/BrowseHeader.tsx",
                lineNumber: 16,
                columnNumber: 9
            }, this),
            (user === null || user === void 0 ? void 0 : user.role) === 'admin' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-purple-900/20 border border-purple-700 text-purple-300 p-4 rounded-lg mb-6 max-w-3xl mx-auto",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-sm flex items-center gap-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$crown$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Crown$3e$__["Crown"], {
                            className: "w-4 h-4"
                        }, void 0, false, {
                            fileName: "[project]/src/components/browse/BrowseHeader.tsx",
                            lineNumber: 27,
                            columnNumber: 13
                        }, this),
                        "Admins can browse for moderation and analytics, but cannot purchase or bid."
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/browse/BrowseHeader.tsx",
                    lineNumber: 26,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/browse/BrowseHeader.tsx",
                lineNumber: 25,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-4 max-w-[1700px] mx-auto px-6",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col leading-tight",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                    className: "text-2xl font-bold text-white mb-1",
                                    children: [
                                        "Browse ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-[#ff950e]",
                                            children: "Listings"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/browse/BrowseHeader.tsx",
                                            lineNumber: 37,
                                            columnNumber: 22
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/browse/BrowseHeader.tsx",
                                    lineNumber: 36,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-gray-400 text-sm",
                                    children: [
                                        "Discover ",
                                        filteredListingsCount,
                                        " amazing ",
                                        filter === 'all' ? 'total' : filter,
                                        " listings from verified sellers"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/browse/BrowseHeader.tsx",
                                    lineNumber: 39,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/browse/BrowseHeader.tsx",
                            lineNumber: 35,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-3",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-wrap gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>onFilterChange('all'),
                                        className: "group flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 shadow-lg text-xs font-medium ".concat(filter === 'all' ? 'bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-white border border-white/20 hover:from-[#ff6b00] hover:to-[#ff950e] hover:shadow-2xl hover:shadow-[#ff950e]/30 transform hover:scale-105' : 'bg-gradient-to-r from-[#1a1a1a] to-[#222] hover:from-[#222] hover:to-[#333] text-[#ff950e] border border-[#333] hover:border-[#ff950e]/50 hover:shadow-[#ff950e]/20'),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Package$3e$__["Package"], {
                                                className: "w-3.5 h-3.5 group-hover:scale-110 transition-transform"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/browse/BrowseHeader.tsx",
                                                lineNumber: 55,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: "All"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/browse/BrowseHeader.tsx",
                                                lineNumber: 56,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "bg-black/20 px-1.5 py-0.5 rounded-full text-xs font-bold",
                                                children: categoryCounts.all
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/browse/BrowseHeader.tsx",
                                                lineNumber: 57,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/browse/BrowseHeader.tsx",
                                        lineNumber: 47,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>onFilterChange('standard'),
                                        className: "group flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 shadow-lg text-xs font-medium ".concat(filter === 'standard' ? 'bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-white border border-white/20 hover:from-[#ff6b00] hover:to-[#ff950e] hover:shadow-2xl hover:shadow-[#ff950e]/30 transform hover:scale-105' : 'bg-gradient-to-r from-[#1a1a1a] to-[#222] hover:from-[#222] hover:to-[#333] text-[#ff950e] border border-[#333] hover:border-[#ff950e]/50 hover:shadow-[#ff950e]/20'),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shopping$2d$bag$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShoppingBag$3e$__["ShoppingBag"], {
                                                className: "w-3.5 h-3.5 group-hover:scale-110 transition-transform"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/browse/BrowseHeader.tsx",
                                                lineNumber: 70,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: "Standard"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/browse/BrowseHeader.tsx",
                                                lineNumber: 71,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "bg-black/20 px-1.5 py-0.5 rounded-full text-xs font-bold",
                                                children: categoryCounts.standard
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/browse/BrowseHeader.tsx",
                                                lineNumber: 72,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/browse/BrowseHeader.tsx",
                                        lineNumber: 62,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>onFilterChange('premium'),
                                        className: "group flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 shadow-lg text-xs font-medium ".concat(filter === 'premium' ? 'bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-white border border-white/20 hover:from-[#ff6b00] hover:to-[#ff950e] hover:shadow-2xl hover:shadow-[#ff950e]/30 transform hover:scale-105' : 'bg-gradient-to-r from-[#1a1a1a] to-[#222] hover:from-[#222] hover:to-[#333] text-[#ff950e] border border-[#333] hover:border-[#ff950e]/50 hover:shadow-[#ff950e]/20'),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$crown$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Crown$3e$__["Crown"], {
                                                className: "w-3.5 h-3.5 group-hover:scale-110 transition-transform"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/browse/BrowseHeader.tsx",
                                                lineNumber: 85,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: "Premium"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/browse/BrowseHeader.tsx",
                                                lineNumber: 86,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "bg-black/20 px-1.5 py-0.5 rounded-full text-xs font-bold",
                                                children: categoryCounts.premium
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/browse/BrowseHeader.tsx",
                                                lineNumber: 87,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/browse/BrowseHeader.tsx",
                                        lineNumber: 77,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>onFilterChange('auction'),
                                        className: "group flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 shadow-lg text-xs font-medium ".concat(filter === 'auction' ? 'bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white border border-white/20 hover:from-[#7c3aed] hover:to-[#8b5cf6] hover:shadow-2xl hover:shadow-[#8b5cf6]/30 transform hover:scale-105' : 'bg-gradient-to-r from-[#1a1a1a] to-[#222] hover:from-[#222] hover:to-[#333] text-[#8b5cf6] border border-[#333] hover:border-[#8b5cf6]/50 hover:shadow-[#8b5cf6]/20'),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$gavel$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Gavel$3e$__["Gavel"], {
                                                className: "w-3.5 h-3.5 group-hover:scale-110 transition-transform"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/browse/BrowseHeader.tsx",
                                                lineNumber: 100,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: "Auctions"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/browse/BrowseHeader.tsx",
                                                lineNumber: 101,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "bg-black/20 px-1.5 py-0.5 rounded-full text-xs font-bold",
                                                children: categoryCounts.auction
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/browse/BrowseHeader.tsx",
                                                lineNumber: 102,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/browse/BrowseHeader.tsx",
                                        lineNumber: 92,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/browse/BrowseHeader.tsx",
                                lineNumber: 46,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/browse/BrowseHeader.tsx",
                            lineNumber: 45,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/browse/BrowseHeader.tsx",
                    lineNumber: 34,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/browse/BrowseHeader.tsx",
                lineNumber: 33,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
_c = BrowseHeader;
var _c;
__turbopack_context__.k.register(_c, "BrowseHeader");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/browse/BrowseFilters.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/components/browse/BrowseFilters.tsx
__turbopack_context__.s({
    "default": ()=>BrowseFilters
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/search.js [app-client] (ecmascript) <export default as Search>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$dollar$2d$sign$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__DollarSign$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/dollar-sign.js [app-client] (ecmascript) <export default as DollarSign>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$tag$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Tag$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/tag.js [app-client] (ecmascript) <export default as Tag>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/SecureInput.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$listings$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/listings.service.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
function BrowseFilters(param) {
    let { searchTerm, onSearchTermChange, minPrice, onMinPriceChange, maxPrice, onMaxPriceChange, sortBy, onSortByChange, selectedHourRange, onHourRangeChange, hourRangeOptions, onClearFilters, hasActiveFilters } = param;
    _s();
    const [suggestions, setSuggestions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [showSuggestions, setShowSuggestions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(-1);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const searchInputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const suggestionsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Fetch suggestions when search term changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BrowseFilters.useEffect": ()=>{
            const fetchSuggestions = {
                "BrowseFilters.useEffect.fetchSuggestions": async ()=>{
                    if (searchTerm.length < 2) {
                        setSuggestions([]);
                        return;
                    }
                    setIsLoadingSuggestions(true);
                    try {
                        // Get popular tags that match the search term
                        const tagsResponse = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$listings$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["listingsService"].getPopularTags(30);
                        if (tagsResponse.success && tagsResponse.data) {
                            const matchingTags = tagsResponse.data.filter({
                                "BrowseFilters.useEffect.fetchSuggestions.matchingTags": (tag)=>tag.tag.toLowerCase().includes(searchTerm.toLowerCase())
                            }["BrowseFilters.useEffect.fetchSuggestions.matchingTags"]).slice(0, 5).map({
                                "BrowseFilters.useEffect.fetchSuggestions.matchingTags": (tag)=>({
                                        type: 'tag',
                                        value: tag.tag,
                                        count: tag.count
                                    })
                            }["BrowseFilters.useEffect.fetchSuggestions.matchingTags"]);
                            setSuggestions(matchingTags);
                        }
                    } catch (error) {
                        console.error('Error fetching suggestions:', error);
                    } finally{
                        setIsLoadingSuggestions(false);
                    }
                }
            }["BrowseFilters.useEffect.fetchSuggestions"];
            const debounceTimer = setTimeout(fetchSuggestions, 300);
            return ({
                "BrowseFilters.useEffect": ()=>clearTimeout(debounceTimer)
            })["BrowseFilters.useEffect"];
        }
    }["BrowseFilters.useEffect"], [
        searchTerm
    ]);
    // Handle click outside to close suggestions
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BrowseFilters.useEffect": ()=>{
            const handleClickOutside = {
                "BrowseFilters.useEffect.handleClickOutside": (event)=>{
                    if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) && searchInputRef.current && !searchInputRef.current.contains(event.target)) {
                        setShowSuggestions(false);
                    }
                }
            }["BrowseFilters.useEffect.handleClickOutside"];
            document.addEventListener('mousedown', handleClickOutside);
            return ({
                "BrowseFilters.useEffect": ()=>document.removeEventListener('mousedown', handleClickOutside)
            })["BrowseFilters.useEffect"];
        }
    }["BrowseFilters.useEffect"], []);
    // Handle keyboard navigation
    const handleKeyDown = (e)=>{
        if (!showSuggestions || suggestions.length === 0) return;
        switch(e.key){
            case 'ArrowDown':
                e.preventDefault();
                setSelectedSuggestionIndex((prev)=>prev < suggestions.length - 1 ? prev + 1 : 0);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedSuggestionIndex((prev)=>prev > 0 ? prev - 1 : suggestions.length - 1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedSuggestionIndex >= 0) {
                    handleSuggestionClick(suggestions[selectedSuggestionIndex]);
                }
                break;
            case 'Escape':
                setShowSuggestions(false);
                setSelectedSuggestionIndex(-1);
                break;
        }
    };
    const handleSuggestionClick = (suggestion)=>{
        onSearchTermChange(suggestion.value);
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
    };
    // Handle secure price changes
    const handleMinPriceChange = (value)=>{
        if (value === '') {
            onMinPriceChange('');
        } else {
            const sanitized = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeCurrency"])(value);
            onMinPriceChange(sanitized.toString());
        }
    };
    const handleMaxPriceChange = (value)=>{
        if (value === '') {
            onMaxPriceChange('');
        } else {
            const sanitized = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeCurrency"])(value);
            onMaxPriceChange(sanitized.toString());
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "max-w-[1700px] mx-auto px-6 mb-6",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex flex-wrap gap-3 items-center bg-gradient-to-r from-[#1a1a1a]/80 to-[#222]/80 backdrop-blur-sm p-3 rounded-lg border border-gray-800 shadow-lg",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative flex-1 min-w-[200px]",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                            className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 z-10"
                        }, void 0, false, {
                            fileName: "[project]/src/components/browse/BrowseFilters.tsx",
                            lineNumber: 150,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "relative",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureInput"], {
                                    ref: searchInputRef,
                                    value: searchTerm,
                                    onChange: (value)=>{
                                        onSearchTermChange(value);
                                        setShowSuggestions(true);
                                    },
                                    onFocus: ()=>setShowSuggestions(true),
                                    onKeyDown: handleKeyDown,
                                    placeholder: "Search by title, description, tags, or seller...",
                                    className: "w-full pl-10 pr-3 py-2 rounded-lg bg-black/50 border border-gray-700 text-sm text-white placeholder-gray-400 focus:ring-1 focus:ring-[#ff950e] focus:border-[#ff950e] transition-all",
                                    maxLength: 100,
                                    "aria-label": "Search listings"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/browse/BrowseFilters.tsx",
                                    lineNumber: 152,
                                    columnNumber: 13
                                }, this),
                                showSuggestions && suggestions.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    ref: suggestionsRef,
                                    className: "absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "max-h-60 overflow-y-auto",
                                            children: suggestions.map((suggestion, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>handleSuggestionClick(suggestion),
                                                    onMouseEnter: ()=>setSelectedSuggestionIndex(index),
                                                    className: "\n                        w-full px-4 py-2 text-left flex items-center gap-2 transition-colors\n                        ".concat(index === selectedSuggestionIndex ? 'bg-[#ff950e]/20 text-[#ff950e]' : 'text-gray-300 hover:bg-gray-800', "\n                      "),
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$tag$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Tag$3e$__["Tag"], {
                                                            className: "w-3 h-3 opacity-60"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/browse/BrowseFilters.tsx",
                                                            lineNumber: 187,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "flex-1 text-sm",
                                                            children: suggestion.value
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/browse/BrowseFilters.tsx",
                                                            lineNumber: 188,
                                                            columnNumber: 23
                                                        }, this),
                                                        suggestion.count && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-xs text-gray-500",
                                                            children: [
                                                                suggestion.count,
                                                                " ",
                                                                suggestion.count === 1 ? 'item' : 'items'
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/components/browse/BrowseFilters.tsx",
                                                            lineNumber: 190,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, "".concat(suggestion.type, "-").concat(suggestion.value), true, {
                                                    fileName: "[project]/src/components/browse/BrowseFilters.tsx",
                                                    lineNumber: 175,
                                                    columnNumber: 21
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/browse/BrowseFilters.tsx",
                                            lineNumber: 173,
                                            columnNumber: 17
                                        }, this),
                                        isLoadingSuggestions && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "px-4 py-2 text-xs text-gray-500 border-t border-gray-700",
                                            children: "Loading suggestions..."
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/browse/BrowseFilters.tsx",
                                            lineNumber: 198,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/browse/BrowseFilters.tsx",
                                    lineNumber: 169,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/browse/BrowseFilters.tsx",
                            lineNumber: 151,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/browse/BrowseFilters.tsx",
                    lineNumber: 149,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex gap-2 items-center",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-1 text-gray-400",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$dollar$2d$sign$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__DollarSign$3e$__["DollarSign"], {
                                    size: 14
                                }, void 0, false, {
                                    fileName: "[project]/src/components/browse/BrowseFilters.tsx",
                                    lineNumber: 209,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-xs font-medium",
                                    children: "Price"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/browse/BrowseFilters.tsx",
                                    lineNumber: 210,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/browse/BrowseFilters.tsx",
                            lineNumber: 208,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureInput"], {
                            value: minPrice,
                            onChange: handleMinPriceChange,
                            placeholder: "Min",
                            type: "number",
                            className: "px-2 py-2 rounded-lg bg-black/50 border border-gray-700 text-xs text-white placeholder-gray-400 w-16 focus:ring-1 focus:ring-[#ff950e] focus:border-[#ff950e] transition-all",
                            min: "0",
                            max: "9999",
                            step: "0.01",
                            inputMode: "decimal",
                            pattern: "[0-9]*\\.?[0-9]*",
                            sanitize: false,
                            "aria-label": "Minimum price"
                        }, void 0, false, {
                            fileName: "[project]/src/components/browse/BrowseFilters.tsx",
                            lineNumber: 212,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-gray-500 text-xs",
                            children: "—"
                        }, void 0, false, {
                            fileName: "[project]/src/components/browse/BrowseFilters.tsx",
                            lineNumber: 226,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureInput"], {
                            value: maxPrice,
                            onChange: handleMaxPriceChange,
                            placeholder: "Max",
                            type: "number",
                            className: "px-2 py-2 rounded-lg bg-black/50 border border-gray-700 text-xs text-white placeholder-gray-400 w-16 focus:ring-1 focus:ring-[#ff950e] focus:border-[#ff950e] transition-all",
                            min: "0",
                            max: "9999",
                            step: "0.01",
                            inputMode: "decimal",
                            pattern: "[0-9]*\\.?[0-9]*",
                            sanitize: false,
                            "aria-label": "Maximum price"
                        }, void 0, false, {
                            fileName: "[project]/src/components/browse/BrowseFilters.tsx",
                            lineNumber: 227,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/browse/BrowseFilters.tsx",
                    lineNumber: 207,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                    value: sortBy,
                    onChange: (e)=>onSortByChange(e.target.value),
                    className: "px-3 py-2 rounded-lg bg-black/50 border border-gray-700 text-xs text-white cursor-pointer focus:ring-1 focus:ring-[#ff950e] focus:border-[#ff950e] transition-all",
                    "aria-label": "Sort by",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                            value: "newest",
                            children: "🕒 Newest First"
                        }, void 0, false, {
                            fileName: "[project]/src/components/browse/BrowseFilters.tsx",
                            lineNumber: 249,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                            value: "priceAsc",
                            children: "💰 Price: Low → High"
                        }, void 0, false, {
                            fileName: "[project]/src/components/browse/BrowseFilters.tsx",
                            lineNumber: 250,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                            value: "priceDesc",
                            children: "💎 Price: High → Low"
                        }, void 0, false, {
                            fileName: "[project]/src/components/browse/BrowseFilters.tsx",
                            lineNumber: 251,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                            value: "endingSoon",
                            children: "⏰ Ending Soon"
                        }, void 0, false, {
                            fileName: "[project]/src/components/browse/BrowseFilters.tsx",
                            lineNumber: 252,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/browse/BrowseFilters.tsx",
                    lineNumber: 243,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                    value: selectedHourRange.label,
                    onChange: (e)=>{
                        const selectedOption = hourRangeOptions.find((opt)=>opt.label === e.target.value);
                        if (selectedOption) onHourRangeChange(selectedOption);
                    },
                    className: "px-3 py-2 rounded-lg bg-black/50 border border-gray-700 text-xs text-white cursor-pointer focus:ring-1 focus:ring-[#ff950e] focus:border-[#ff950e] transition-all",
                    "aria-label": "Delivery time filter",
                    children: hourRangeOptions.map((option)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                            value: option.label,
                            children: option.label === 'Any Hours' ? '⏱️ Any Hours' : "⏱️ ".concat(option.label)
                        }, option.label, false, {
                            fileName: "[project]/src/components/browse/BrowseFilters.tsx",
                            lineNumber: 265,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/src/components/browse/BrowseFilters.tsx",
                    lineNumber: 255,
                    columnNumber: 9
                }, this),
                hasActiveFilters && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: onClearFilters,
                    className: "px-3 py-2 rounded-lg bg-red-600/20 border border-red-700 text-red-400 hover:bg-red-600/30 text-xs transition-all flex items-center gap-1 font-medium",
                    "aria-label": "Clear filters",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                            size: 12
                        }, void 0, false, {
                            fileName: "[project]/src/components/browse/BrowseFilters.tsx",
                            lineNumber: 277,
                            columnNumber: 13
                        }, this),
                        "Clear"
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/browse/BrowseFilters.tsx",
                    lineNumber: 272,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/browse/BrowseFilters.tsx",
            lineNumber: 148,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/browse/BrowseFilters.tsx",
        lineNumber: 147,
        columnNumber: 5
    }, this);
}
_s(BrowseFilters, "PQKvU0MaC7oytcg1BVuBgezo05I=");
_c = BrowseFilters;
var _c;
__turbopack_context__.k.register(_c, "BrowseFilters");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/utils/browseUtils.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/utils/browseUtils.ts
__turbopack_context__.s({
    "HOUR_RANGE_OPTIONS": ()=>HOUR_RANGE_OPTIONS,
    "PAGE_SIZE": ()=>PAGE_SIZE,
    "formatTimeRemaining": ()=>formatTimeRemaining,
    "getDisplayPrice": ()=>getDisplayPrice,
    "isAuctionListing": ()=>isAuctionListing,
    "isListingActive": ()=>isListingActive,
    "safeParseDate": ()=>safeParseDate
});
const HOUR_RANGE_OPTIONS = [
    {
        label: 'Any Hours',
        min: 0,
        max: Infinity
    },
    {
        label: '12+ Hours',
        min: 12,
        max: Infinity
    },
    {
        label: '24+ Hours',
        min: 24,
        max: Infinity
    },
    {
        label: '48+ Hours',
        min: 48,
        max: Infinity
    }
];
const PAGE_SIZE = 40;
const isAuctionListing = (listing)=>{
    return !!listing.auction;
};
const safeParseDate = (dateString)=>{
    if (!dateString) return null;
    try {
        const date = new Date(dateString);
        // Check if date is valid
        if (isNaN(date.getTime())) {
            console.warn('Invalid date string:', dateString);
            return null;
        }
        return date;
    } catch (error) {
        console.error('Date parsing error:', error, 'for string:', dateString);
        return null;
    }
};
const isListingActive = (listing)=>{
    if (listing.auction) {
        const isActive = listing.auction.status === 'active';
        const endTime = safeParseDate(listing.auction.endTime);
        const endTimeNotPassed = endTime ? endTime > new Date() : false;
        return isActive && endTimeNotPassed;
    }
    return true; // Non-auction listings are always active
};
const getDisplayPrice = (listing)=>{
    try {
        if (isAuctionListing(listing)) {
            const hasActiveBids = listing.auction.bids && listing.auction.bids.length > 0;
            const highestBid = listing.auction.highestBid;
            // Check for null/undefined explicitly, not falsy (allows 0)
            if (hasActiveBids && highestBid !== null && highestBid !== undefined) {
                return {
                    price: highestBid.toFixed(2),
                    label: 'Current Bid'
                };
            } else {
                return {
                    price: listing.auction.startingPrice.toFixed(2),
                    label: 'Starting Bid'
                };
            }
        } else {
            var _listing_markedUpPrice;
            var _listing_markedUpPrice_toFixed;
            return {
                price: (_listing_markedUpPrice_toFixed = (_listing_markedUpPrice = listing.markedUpPrice) === null || _listing_markedUpPrice === void 0 ? void 0 : _listing_markedUpPrice.toFixed(2)) !== null && _listing_markedUpPrice_toFixed !== void 0 ? _listing_markedUpPrice_toFixed : listing.price.toFixed(2),
                label: 'Buy Now'
            };
        }
    } catch (error) {
        console.error('Error getting display price:', error);
        return {
            price: '0.00',
            label: 'Price Error'
        };
    }
};
const formatTimeRemaining = (endTimeStr, timeCache)=>{
    try {
        const now = new Date();
        const nowTime = now.getTime();
        // Check cache first
        const cached = timeCache.current[endTimeStr];
        if (cached && cached.expires > nowTime) {
            return cached.formatted;
        }
        const endTime = safeParseDate(endTimeStr);
        if (!endTime) {
            return 'Invalid time';
        }
        if (endTime <= now) {
            // Cache ended auctions for longer to prevent repeated calculations
            timeCache.current[endTimeStr] = {
                formatted: 'Ended',
                expires: nowTime + 300000 // Cache for 5 minutes
            };
            return 'Ended';
        }
        const diffMs = endTime.getTime() - nowTime;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffMs % (1000 * 60 * 60 * 24) / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffMs % (1000 * 60 * 60) / (1000 * 60));
        let formatted;
        let cacheTime;
        if (diffDays > 0) {
            formatted = "".concat(diffDays, "d ").concat(diffHours, "h");
            cacheTime = 300000; // Cache for 5 minutes
        } else if (diffHours > 0) {
            formatted = "".concat(diffHours, "h ").concat(diffMinutes, "m");
            cacheTime = 60000; // Cache for 1 minute
        } else if (diffMinutes > 0) {
            formatted = "".concat(diffMinutes, "m");
            cacheTime = 30000; // Cache for 30 seconds
        } else {
            formatted = 'Soon';
            cacheTime = 10000; // Cache for 10 seconds
        }
        // Update cache
        timeCache.current[endTimeStr] = {
            formatted,
            expires: nowTime + cacheTime
        };
        return formatted;
    } catch (error) {
        console.error('Error formatting time remaining:', error, 'for string:', endTimeStr);
        return 'Time error';
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/browse/ListingCard.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/components/browse/ListingCard.tsx
__turbopack_context__.s({
    "default": ()=>ListingCard
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$crown$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Crown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/crown.js [app-client] (ecmascript) <export default as Crown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/clock.js [app-client] (ecmascript) <export default as Clock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$lock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Lock$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/lock.js [app-client] (ecmascript) <export default as Lock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-check-big.js [app-client] (ecmascript) <export default as CheckCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$gavel$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Gavel$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/gavel.js [app-client] (ecmascript) <export default as Gavel>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUp$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-up.js [app-client] (ecmascript) <export default as ArrowUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/eye.js [app-client] (ecmascript) <export default as Eye>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Package$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/package.js [app-client] (ecmascript) <export default as Package>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$heart$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Heart$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/heart.js [app-client] (ecmascript) <export default as Heart>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$browseUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/browseUtils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$FavoritesContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/FavoritesContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$ToastContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/ToastContext.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
function ListingCard(param) {
    let { listing, isHovered, onMouseEnter, onMouseLeave, onClick, onQuickView, user, isSubscribed, displayPrice, forceUpdateTimer, formatTimeRemaining } = param;
    var _listing_auction_bids, _listing_sellerProfile;
    _s();
    // FIXED: Use the server's isLocked field directly
    const isLockedPremium = listing.isLocked === true;
    const hasAuction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$browseUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isAuctionListing"])(listing);
    // Favorites functionality
    const { isFavorited, toggleFavorite } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$FavoritesContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useFavorites"])();
    const { error: showErrorToast, success: showSuccessToast } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$ToastContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useToast"])();
    // Generate consistent seller ID
    const sellerId = "seller_".concat(listing.seller);
    const isFav = (user === null || user === void 0 ? void 0 : user.role) === 'buyer' ? isFavorited(sellerId) : false;
    const handleFavoriteClick = async (e)=>{
        var _listing_sellerProfile;
        e.stopPropagation();
        e.preventDefault();
        if ((user === null || user === void 0 ? void 0 : user.role) !== 'buyer') {
            showErrorToast('Only buyers can add favorites');
            return;
        }
        const success = await toggleFavorite({
            id: sellerId,
            username: listing.seller,
            profilePicture: ((_listing_sellerProfile = listing.sellerProfile) === null || _listing_sellerProfile === void 0 ? void 0 : _listing_sellerProfile.pic) || undefined,
            tier: undefined,
            isVerified: listing.isSellerVerified || false
        });
        if (success) {
            showSuccessToast(isFav ? 'Removed from favorites' : 'Added to favorites');
        }
    };
    var _listing_sellerSalesCount;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative flex flex-col bg-gradient-to-br from-[#1a1a1a] to-[#111] border ".concat(hasAuction ? 'border-purple-800' : 'border-gray-800', " rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden ").concat(hasAuction ? 'hover:border-purple-600' : 'hover:border-[#ff950e]', " cursor-pointer group hover:transform hover:scale-[1.02]"),
        onMouseEnter: onMouseEnter,
        onMouseLeave: onMouseLeave,
        onClick: onClick,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute top-4 right-4 z-10 flex items-center gap-2",
                children: [
                    (user === null || user === void 0 ? void 0 : user.role) === 'buyer' && !isLockedPremium && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: handleFavoriteClick,
                        className: "p-2 bg-black/70 backdrop-blur-sm rounded-lg hover:bg-black/90 transition-all group/fav",
                        "aria-label": isFav ? 'Remove from favorites' : 'Add to favorites',
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$heart$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Heart$3e$__["Heart"], {
                            size: 16,
                            className: "transition-all group-hover/fav:scale-110 ".concat(isFav ? 'fill-[#ff950e] text-[#ff950e]' : 'text-white hover:text-[#ff950e]')
                        }, void 0, false, {
                            fileName: "[project]/src/components/browse/ListingCard.tsx",
                            lineNumber: 80,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/browse/ListingCard.tsx",
                        lineNumber: 75,
                        columnNumber: 11
                    }, this),
                    hasAuction && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "bg-gradient-to-r from-purple-600 to-purple-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold flex items-center shadow-lg",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$gavel$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Gavel$3e$__["Gavel"], {
                                className: "w-3.5 h-3.5 mr-1.5"
                            }, void 0, false, {
                                fileName: "[project]/src/components/browse/ListingCard.tsx",
                                lineNumber: 92,
                                columnNumber: 13
                            }, this),
                            " AUCTION"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/browse/ListingCard.tsx",
                        lineNumber: 91,
                        columnNumber: 11
                    }, this),
                    !hasAuction && listing.isPremium && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-black text-xs px-3 py-1.5 rounded-lg font-bold flex items-center shadow-lg",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$crown$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Crown$3e$__["Crown"], {
                                className: "w-3.5 h-3.5 mr-1.5"
                            }, void 0, false, {
                                fileName: "[project]/src/components/browse/ListingCard.tsx",
                                lineNumber: 98,
                                columnNumber: 13
                            }, this),
                            " PREMIUM"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/browse/ListingCard.tsx",
                        lineNumber: 97,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/browse/ListingCard.tsx",
                lineNumber: 72,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative aspect-square overflow-hidden bg-black",
                children: [
                    listing.imageUrls && listing.imageUrls.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                        src: listing.imageUrls[0],
                        alt: listing.title,
                        className: "w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ".concat(isLockedPremium ? 'blur-md' : ''),
                        onError: (e)=>{
                            var _listing_imageUrls;
                            const target = e.currentTarget;
                            target.src = '/placeholder-panty.png';
                            target.onerror = null;
                            console.warn('Image failed to load:', (_listing_imageUrls = listing.imageUrls) === null || _listing_imageUrls === void 0 ? void 0 : _listing_imageUrls[0]);
                        }
                    }, void 0, false, {
                        fileName: "[project]/src/components/browse/ListingCard.tsx",
                        lineNumber: 106,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-full h-full flex items-center justify-center bg-gray-900",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-center text-gray-400",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Package$3e$__["Package"], {
                                    className: "w-16 h-16 mx-auto mb-3 opacity-50"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/browse/ListingCard.tsx",
                                    lineNumber: 122,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm",
                                    children: "No Image Available"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/browse/ListingCard.tsx",
                                    lineNumber: 123,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/browse/ListingCard.tsx",
                            lineNumber: 121,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/browse/ListingCard.tsx",
                        lineNumber: 120,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none"
                    }, void 0, false, {
                        fileName: "[project]/src/components/browse/ListingCard.tsx",
                        lineNumber: 129,
                        columnNumber: 9
                    }, this),
                    isLockedPremium && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute inset-0 bg-black/70 flex flex-col items-center justify-center backdrop-blur-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$lock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Lock$3e$__["Lock"], {
                                className: "w-12 h-12 text-[#ff950e] mb-4"
                            }, void 0, false, {
                                fileName: "[project]/src/components/browse/ListingCard.tsx",
                                lineNumber: 133,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm font-bold text-white text-center px-4",
                                children: "Subscribe to view premium content"
                            }, void 0, false, {
                                fileName: "[project]/src/components/browse/ListingCard.tsx",
                                lineNumber: 134,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/browse/ListingCard.tsx",
                        lineNumber: 132,
                        columnNumber: 11
                    }, this),
                    hasAuction && listing.auction && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute bottom-4 left-4 z-10",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "bg-black/90 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg font-bold flex items-center shadow-lg border border-purple-500/30",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {
                                    className: "w-4 h-4 mr-2 text-purple-400"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/browse/ListingCard.tsx",
                                    lineNumber: 144,
                                    columnNumber: 15
                                }, this),
                                formatTimeRemaining(listing.auction.endTime)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/browse/ListingCard.tsx",
                            lineNumber: 143,
                            columnNumber: 13
                        }, this)
                    }, "timer-".concat(listing.id, "-").concat(forceUpdateTimer), false, {
                        fileName: "[project]/src/components/browse/ListingCard.tsx",
                        lineNumber: 142,
                        columnNumber: 11
                    }, this),
                    isHovered && !isLockedPremium && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute bottom-4 right-4 z-10",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-black text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2 shadow-xl hover:from-[#e88800] hover:to-[#ff950e] transition-all transform hover:scale-105",
                            onClick: onQuickView,
                            "aria-label": "Quick view",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__["Eye"], {
                                    className: "w-4 h-4"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/browse/ListingCard.tsx",
                                    lineNumber: 158,
                                    columnNumber: 15
                                }, this),
                                " Quick View"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/browse/ListingCard.tsx",
                            lineNumber: 153,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/browse/ListingCard.tsx",
                        lineNumber: 152,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/browse/ListingCard.tsx",
                lineNumber: 104,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "p-5 flex flex-col flex-grow",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-[#ff950e] transition-colors",
                                children: listing.title
                            }, void 0, false, {
                                fileName: "[project]/src/components/browse/ListingCard.tsx",
                                lineNumber: 167,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-gray-400 mb-3 line-clamp-2 leading-relaxed",
                                children: listing.description
                            }, void 0, false, {
                                fileName: "[project]/src/components/browse/ListingCard.tsx",
                                lineNumber: 170,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/browse/ListingCard.tsx",
                        lineNumber: 166,
                        columnNumber: 9
                    }, this),
                    listing.tags && listing.tags.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-wrap gap-2 mb-4",
                        children: [
                            listing.tags.slice(0, 3).map((tag, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "bg-black/50 text-[#ff950e] text-xs px-3 py-1 rounded-full font-medium border border-[#ff950e]/20",
                                    children: [
                                        "#",
                                        tag
                                    ]
                                }, i, true, {
                                    fileName: "[project]/src/components/browse/ListingCard.tsx",
                                    lineNumber: 179,
                                    columnNumber: 15
                                }, this)),
                            listing.tags.length > 3 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-gray-500 text-xs px-2 py-1",
                                children: [
                                    "+",
                                    listing.tags.length - 3,
                                    " more"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/browse/ListingCard.tsx",
                                lineNumber: 184,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/browse/ListingCard.tsx",
                        lineNumber: 177,
                        columnNumber: 11
                    }, this),
                    hasAuction && listing.auction && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-gradient-to-r from-purple-900/30 to-purple-800/20 rounded-xl p-4 mb-4 border border-purple-700/30 backdrop-blur-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-between items-center text-sm mb-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-purple-300 font-medium",
                                        children: displayPrice.label
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/browse/ListingCard.tsx",
                                        lineNumber: 195,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "font-bold text-white flex items-center text-lg",
                                        children: [
                                            listing.auction.bids && listing.auction.bids.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUp$3e$__["ArrowUp"], {
                                                className: "w-4 h-4 text-green-400 mr-1"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/browse/ListingCard.tsx",
                                                lineNumber: 198,
                                                columnNumber: 19
                                            }, this),
                                            "$",
                                            displayPrice.price
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/browse/ListingCard.tsx",
                                        lineNumber: 196,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/browse/ListingCard.tsx",
                                lineNumber: 194,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-between items-center text-xs",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-gray-400 flex items-center gap-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$gavel$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Gavel$3e$__["Gavel"], {
                                                className: "w-3 h-3"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/browse/ListingCard.tsx",
                                                lineNumber: 205,
                                                columnNumber: 17
                                            }, this),
                                            ((_listing_auction_bids = listing.auction.bids) === null || _listing_auction_bids === void 0 ? void 0 : _listing_auction_bids.length) || 0,
                                            " bids"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/browse/ListingCard.tsx",
                                        lineNumber: 204,
                                        columnNumber: 15
                                    }, this),
                                    listing.auction.reservePrice && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "font-medium ".concat(!listing.auction.highestBid || listing.auction.highestBid < listing.auction.reservePrice ? 'text-yellow-400' : 'text-green-400'),
                                        children: !listing.auction.highestBid || listing.auction.highestBid < listing.auction.reservePrice ? '⚠️ Reserve not met' : '✅ Reserve met'
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/browse/ListingCard.tsx",
                                        lineNumber: 209,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/browse/ListingCard.tsx",
                                lineNumber: 203,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/browse/ListingCard.tsx",
                        lineNumber: 193,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex justify-between items-end mt-auto",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                href: "/sellers/".concat(listing.seller),
                                className: "flex items-center gap-3 text-base text-gray-400 hover:text-[#ff950e] transition-colors group/seller",
                                onClick: (e)=>e.stopPropagation(),
                                children: [
                                    ((_listing_sellerProfile = listing.sellerProfile) === null || _listing_sellerProfile === void 0 ? void 0 : _listing_sellerProfile.pic) ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                        src: listing.sellerProfile.pic,
                                        alt: listing.seller,
                                        className: "w-12 h-12 rounded-full object-cover border-2 border-gray-700 group-hover/seller:border-[#ff950e] transition-colors",
                                        onError: (e)=>{
                                            const target = e.currentTarget;
                                            target.src = '/default-avatar.png';
                                            target.onerror = null;
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/browse/ListingCard.tsx",
                                        lineNumber: 234,
                                        columnNumber: 15
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "w-12 h-12 rounded-full bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center text-lg font-bold text-[#ff950e] border-2 border-gray-700 group-hover/seller:border-[#ff950e] transition-colors",
                                        children: listing.seller.charAt(0).toUpperCase()
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/browse/ListingCard.tsx",
                                        lineNumber: 245,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex flex-col",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-bold text-base flex items-center gap-2",
                                                children: [
                                                    listing.seller,
                                                    listing.isSellerVerified && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                        src: "/verification_badge.png",
                                                        alt: "Verified",
                                                        className: "w-5 h-5"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/browse/ListingCard.tsx",
                                                        lineNumber: 253,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/browse/ListingCard.tsx",
                                                lineNumber: 250,
                                                columnNumber: 15
                                            }, this),
                                            ((_listing_sellerSalesCount = listing.sellerSalesCount) !== null && _listing_sellerSalesCount !== void 0 ? _listing_sellerSalesCount : 0) > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs text-gray-500 flex items-center gap-1",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__["CheckCircle"], {
                                                        className: "w-3 h-3"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/browse/ListingCard.tsx",
                                                        lineNumber: 262,
                                                        columnNumber: 19
                                                    }, this),
                                                    listing.sellerSalesCount,
                                                    " completed sales"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/browse/ListingCard.tsx",
                                                lineNumber: 261,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/browse/ListingCard.tsx",
                                        lineNumber: 249,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/browse/ListingCard.tsx",
                                lineNumber: 228,
                                columnNumber: 11
                            }, this),
                            !hasAuction && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-right",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "font-bold text-[#ff950e] text-2xl",
                                        children: [
                                            "$",
                                            displayPrice.price
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/browse/ListingCard.tsx",
                                        lineNumber: 271,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs text-gray-500 font-medium",
                                        children: displayPrice.label
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/browse/ListingCard.tsx",
                                        lineNumber: 274,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/browse/ListingCard.tsx",
                                lineNumber: 270,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/browse/ListingCard.tsx",
                        lineNumber: 227,
                        columnNumber: 9
                    }, this),
                    (user === null || user === void 0 ? void 0 : user.role) === 'buyer' && isLockedPremium && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        href: "/sellers/".concat(listing.seller),
                        className: "mt-4 w-full bg-gradient-to-r from-gray-700 to-gray-600 text-white px-4 py-3 rounded-xl hover:from-gray-600 hover:to-gray-500 font-bold transition-all text-sm text-center flex items-center justify-center gap-2 shadow-lg",
                        onClick: (e)=>e.stopPropagation(),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$lock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Lock$3e$__["Lock"], {
                                className: "w-4 h-4"
                            }, void 0, false, {
                                fileName: "[project]/src/components/browse/ListingCard.tsx",
                                lineNumber: 288,
                                columnNumber: 13
                            }, this),
                            " Subscribe to Unlock"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/browse/ListingCard.tsx",
                        lineNumber: 283,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/browse/ListingCard.tsx",
                lineNumber: 165,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/browse/ListingCard.tsx",
        lineNumber: 61,
        columnNumber: 5
    }, this);
}
_s(ListingCard, "bsUYM77YzTs0aNi07WQNRnZ8xNM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$FavoritesContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useFavorites"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$ToastContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useToast"]
    ];
});
_c = ListingCard;
var _c;
__turbopack_context__.k.register(_c, "ListingCard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/browse/ListingGrid.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": ()=>ListingGrid
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/triangle-alert.js [app-client] (ecmascript) <export default as AlertTriangle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$browse$2f$ListingCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/browse/ListingCard.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/SecureMessageDisplay.tsx [app-client] (ecmascript)");
'use client';
;
;
;
;
function ListingGrid(param) {
    let { listings, hoveredListing, onListingHover, onListingLeave, onListingClick, onQuickView, user, isSubscribed, getDisplayPrice, forceUpdateTimer, formatTimeRemaining, listingErrors, onListingError } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6",
        children: listings.map((listing)=>{
            // Individual listing error handling
            if (listingErrors[listing.id]) {
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-red-900/20 border border-red-700 rounded-xl p-4 text-center",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"], {
                            className: "w-8 h-8 text-red-400 mx-auto mb-2"
                        }, void 0, false, {
                            fileName: "[project]/src/components/browse/ListingGrid.tsx",
                            lineNumber: 30,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-red-400 text-sm",
                            children: "Error loading listing"
                        }, void 0, false, {
                            fileName: "[project]/src/components/browse/ListingGrid.tsx",
                            lineNumber: 31,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureMessageDisplay"], {
                            content: listingErrors[listing.id],
                            allowBasicFormatting: false,
                            className: "text-gray-500 text-xs mt-1",
                            maxLength: 100
                        }, void 0, false, {
                            fileName: "[project]/src/components/browse/ListingGrid.tsx",
                            lineNumber: 32,
                            columnNumber: 15
                        }, this)
                    ]
                }, listing.id, true, {
                    fileName: "[project]/src/components/browse/ListingGrid.tsx",
                    lineNumber: 29,
                    columnNumber: 13
                }, this);
            }
            try {
                const isLockedPremium = listing.isPremium && (!(user === null || user === void 0 ? void 0 : user.username) || !isSubscribed(user === null || user === void 0 ? void 0 : user.username, listing.seller));
                const displayPrice = getDisplayPrice(listing);
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$browse$2f$ListingCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    listing: listing,
                    isHovered: hoveredListing === listing.id,
                    onMouseEnter: ()=>onListingHover(listing.id),
                    onMouseLeave: onListingLeave,
                    onClick: ()=>onListingClick(listing.id, Boolean(isLockedPremium)),
                    onQuickView: (e)=>onQuickView(e, listing.id),
                    user: user,
                    isSubscribed: isSubscribed((user === null || user === void 0 ? void 0 : user.username) || '', listing.seller),
                    displayPrice: displayPrice,
                    forceUpdateTimer: forceUpdateTimer,
                    formatTimeRemaining: formatTimeRemaining
                }, listing.id, false, {
                    fileName: "[project]/src/components/browse/ListingGrid.tsx",
                    lineNumber: 48,
                    columnNumber: 13
                }, this);
            } catch (error) {
                onListingError(error, listing.id);
                return null;
            }
        })
    }, void 0, false, {
        fileName: "[project]/src/components/browse/ListingGrid.tsx",
        lineNumber: 24,
        columnNumber: 5
    }, this);
}
_c = ListingGrid;
var _c;
__turbopack_context__.k.register(_c, "ListingGrid");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/browse/PaginationControls.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": ()=>PaginationControls
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
'use client';
;
function PaginationControls(param) {
    let { currentPage, totalPages, filteredListingsCount, pageSize, onPreviousPage, onNextPage, onPageClick } = param;
    const renderPageIndicators = ()=>{
        if (totalPages <= 1) return null;
        const indicators = [];
        if (currentPage > 0) {
            indicators.push(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "px-2 py-1 text-sm text-gray-400 cursor-pointer hover:text-[#ff950e]",
                onClick: ()=>onPageClick(0),
                children: "1"
            }, 0, false, {
                fileName: "[project]/src/components/browse/PaginationControls.tsx",
                lineNumber: 21,
                columnNumber: 9
            }, this));
        }
        if (currentPage > 2) {
            indicators.push(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "px-2 py-1 text-sm text-gray-500",
                children: "..."
            }, "start-ellipsis", false, {
                fileName: "[project]/src/components/browse/PaginationControls.tsx",
                lineNumber: 33,
                columnNumber: 9
            }, this));
        }
        let startPage = Math.max(1, currentPage - 1);
        let endPage = Math.min(totalPages - 2, currentPage + 1);
        if (endPage - startPage < 2 && totalPages > 3) {
            if (startPage === 1) {
                endPage = Math.min(totalPages - 2, 3);
            } else if (endPage === totalPages - 2) {
                startPage = Math.max(1, totalPages - 4);
            }
        }
        for(let i = startPage; i <= endPage; i++){
            if (i === currentPage) {
                indicators.push(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "px-2 py-1 text-sm font-bold text-[#ff950e] border-b-2 border-[#ff950e]",
                    children: i + 1
                }, i, false, {
                    fileName: "[project]/src/components/browse/PaginationControls.tsx",
                    lineNumber: 51,
                    columnNumber: 11
                }, this));
            } else {
                indicators.push(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "px-2 py-1 text-sm text-gray-400 cursor-pointer hover:text-[#ff950e]",
                    onClick: ()=>onPageClick(i),
                    children: i + 1
                }, i, false, {
                    fileName: "[project]/src/components/browse/PaginationControls.tsx",
                    lineNumber: 57,
                    columnNumber: 11
                }, this));
            }
        }
        if (endPage < totalPages - 2) {
            indicators.push(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "px-2 py-1 text-sm text-gray-500",
                children: "..."
            }, "end-ellipsis", false, {
                fileName: "[project]/src/components/browse/PaginationControls.tsx",
                lineNumber: 70,
                columnNumber: 9
            }, this));
        }
        if (currentPage < totalPages - 1) {
            indicators.push(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "px-2 py-1 text-sm text-gray-400 cursor-pointer hover:text-[#ff950e]",
                onClick: ()=>onPageClick(totalPages - 1),
                children: totalPages
            }, totalPages - 1, false, {
                fileName: "[project]/src/components/browse/PaginationControls.tsx",
                lineNumber: 76,
                columnNumber: 9
            }, this));
        }
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex justify-center items-center gap-1 mt-4",
            "aria-label": "Pagination",
            children: indicators
        }, void 0, false, {
            fileName: "[project]/src/components/browse/PaginationControls.tsx",
            lineNumber: 87,
            columnNumber: 7
        }, this);
    };
    if (filteredListingsCount <= pageSize && currentPage === 0) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col items-center mt-16 gap-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex gap-4",
                children: [
                    currentPage > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "px-8 py-3 rounded-xl bg-gradient-to-r from-[#1a1a1a] to-[#222] text-white font-bold hover:from-[#222] hover:to-[#333] transition-all border border-gray-800 shadow-lg hover:shadow-xl",
                        onClick: onPreviousPage,
                        "aria-label": "Previous page",
                        children: "← Previous"
                    }, void 0, false, {
                        fileName: "[project]/src/components/browse/PaginationControls.tsx",
                        lineNumber: 99,
                        columnNumber: 11
                    }, this),
                    filteredListingsCount > pageSize * (currentPage + 1) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "px-8 py-3 rounded-xl bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-black font-bold hover:from-[#e88800] hover:to-[#ff950e] transition-all shadow-lg hover:shadow-xl transform hover:scale-105",
                        onClick: onNextPage,
                        "aria-label": "Next page",
                        children: "Next →"
                    }, void 0, false, {
                        fileName: "[project]/src/components/browse/PaginationControls.tsx",
                        lineNumber: 108,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/browse/PaginationControls.tsx",
                lineNumber: 97,
                columnNumber: 7
            }, this),
            renderPageIndicators()
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/browse/PaginationControls.tsx",
        lineNumber: 96,
        columnNumber: 5
    }, this);
}
_c = PaginationControls;
var _c;
__turbopack_context__.k.register(_c, "PaginationControls");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/browse/EmptyState.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": ()=>EmptyState
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shopping$2d$bag$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShoppingBag$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shopping-bag.js [app-client] (ecmascript) <export default as ShoppingBag>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/SecureMessageDisplay.tsx [app-client] (ecmascript)");
'use client';
;
;
;
function EmptyState(param) {
    let { searchTerm, onResetFilters } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "text-center py-24 bg-gradient-to-br from-[#1a1a1a] to-[#111] rounded-2xl border border-gray-800 shadow-2xl",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shopping$2d$bag$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShoppingBag$3e$__["ShoppingBag"], {
                        className: "w-20 h-20 text-gray-600 mx-auto mb-4"
                    }, void 0, false, {
                        fileName: "[project]/src/components/browse/EmptyState.tsx",
                        lineNumber: 11,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-24 h-1 bg-gradient-to-r from-[#ff950e] to-[#ff6b00] mx-auto rounded-full mb-6"
                    }, void 0, false, {
                        fileName: "[project]/src/components/browse/EmptyState.tsx",
                        lineNumber: 12,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/browse/EmptyState.tsx",
                lineNumber: 10,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                className: "text-white font-bold text-2xl mb-3",
                children: "No listings found"
            }, void 0, false, {
                fileName: "[project]/src/components/browse/EmptyState.tsx",
                lineNumber: 14,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-gray-400 mb-8 max-w-md mx-auto",
                children: searchTerm ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        "We couldn't find any listings matching \"",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureMessageDisplay"], {
                            content: searchTerm,
                            allowBasicFormatting: false,
                            className: "inline font-semibold text-[#ff950e]"
                        }, void 0, false, {
                            fileName: "[project]/src/components/browse/EmptyState.tsx",
                            lineNumber: 18,
                            columnNumber: 53
                        }, this),
                        '". Try adjusting your filters or check back later for new items.'
                    ]
                }, void 0, true) : "We couldn't find any listings matching your criteria. Try adjusting your filters or check back later for new items."
            }, void 0, false, {
                fileName: "[project]/src/components/browse/EmptyState.tsx",
                lineNumber: 15,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: onResetFilters,
                className: "px-8 py-3 bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-black rounded-xl font-bold hover:from-[#e88800] hover:to-[#ff950e] transition-all shadow-lg hover:shadow-xl transform hover:scale-105",
                "aria-label": "Reset all filters",
                children: "Reset All Filters"
            }, void 0, false, {
                fileName: "[project]/src/components/browse/EmptyState.tsx",
                lineNumber: 28,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/browse/EmptyState.tsx",
        lineNumber: 9,
        columnNumber: 5
    }, this);
}
_c = EmptyState;
var _c;
__turbopack_context__.k.register(_c, "EmptyState");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/browse/PopularTags.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/components/browse/PopularTags.tsx
__turbopack_context__.s({
    "default": ()=>PopularTags
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$tag$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Tag$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/tag.js [app-client] (ecmascript) <export default as Tag>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trending-up.js [app-client] (ecmascript) <export default as TrendingUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader.js [app-client] (ecmascript) <export default as Loader>");
'use client';
;
;
function PopularTags(param) {
    let { tags, onTagClick, isLoading, error } = param;
    if (isLoading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "max-w-[1700px] mx-auto px-6 mb-6",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-gradient-to-r from-[#1a1a1a]/80 to-[#222]/80 backdrop-blur-sm p-4 rounded-lg border border-gray-800 shadow-lg",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center justify-center gap-2 text-gray-400",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader$3e$__["Loader"], {
                            className: "w-4 h-4 animate-spin"
                        }, void 0, false, {
                            fileName: "[project]/src/components/browse/PopularTags.tsx",
                            lineNumber: 24,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-sm",
                            children: "Loading popular tags..."
                        }, void 0, false, {
                            fileName: "[project]/src/components/browse/PopularTags.tsx",
                            lineNumber: 25,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/browse/PopularTags.tsx",
                    lineNumber: 23,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/browse/PopularTags.tsx",
                lineNumber: 22,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/browse/PopularTags.tsx",
            lineNumber: 21,
            columnNumber: 7
        }, this);
    }
    if (error || tags.length === 0) {
        return null;
    }
    // Sort tags by count and take top tags
    const sortedTags = [
        ...tags
    ].sort((a, b)=>b.count - a.count);
    // Calculate relative sizes based on count
    const maxCount = Math.max(...tags.map((t)=>t.count));
    const minCount = Math.min(...tags.map((t)=>t.count));
    const range = maxCount - minCount || 1;
    const getTagSize = (count)=>{
        const normalized = (count - minCount) / range;
        if (normalized > 0.8) return 'text-sm font-bold';
        if (normalized > 0.5) return 'text-xs font-semibold';
        return 'text-xs font-medium';
    };
    const getTagColor = (count)=>{
        const normalized = (count - minCount) / range;
        if (normalized > 0.8) return 'bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-black border-[#ff950e]';
        if (normalized > 0.5) return 'bg-[#ff950e]/20 text-[#ff950e] border-[#ff950e]/50';
        return 'bg-black/50 text-gray-300 border-gray-600';
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "max-w-[1700px] mx-auto px-6 mb-6",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-gradient-to-r from-[#1a1a1a]/80 to-[#222]/80 backdrop-blur-sm p-4 rounded-lg border border-gray-800 shadow-lg",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-start gap-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-2 text-gray-400 min-w-fit pt-1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"], {
                                    className: "w-4 h-4"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/browse/PopularTags.tsx",
                                    lineNumber: 63,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-xs font-semibold uppercase tracking-wider",
                                    children: "Trending"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/browse/PopularTags.tsx",
                                    lineNumber: 64,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/browse/PopularTags.tsx",
                            lineNumber: 62,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-wrap gap-2 flex-1",
                            children: sortedTags.map((tag)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>onTagClick(tag.tag),
                                    className: "\n                  px-3 py-1.5 rounded-full border transition-all duration-300\n                  hover:scale-105 hover:shadow-lg cursor-pointer\n                  ".concat(getTagColor(tag.count), " ").concat(getTagSize(tag.count), "\n                  flex items-center gap-1.5 group\n                "),
                                    title: "".concat(tag.count, " listings"),
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$tag$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Tag$3e$__["Tag"], {
                                            className: "w-3 h-3 opacity-70 group-hover:opacity-100"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/browse/PopularTags.tsx",
                                            lineNumber: 80,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: tag.tag
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/browse/PopularTags.tsx",
                                            lineNumber: 81,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "opacity-60 text-[10px] font-normal",
                                            children: [
                                                "(",
                                                tag.count,
                                                ")"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/browse/PopularTags.tsx",
                                            lineNumber: 82,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, tag.tag, true, {
                                    fileName: "[project]/src/components/browse/PopularTags.tsx",
                                    lineNumber: 69,
                                    columnNumber: 15
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/src/components/browse/PopularTags.tsx",
                            lineNumber: 67,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/browse/PopularTags.tsx",
                    lineNumber: 61,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-3 pt-3 border-t border-gray-700/50",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-[10px] text-gray-500 italic",
                        children: "Click a tag to filter listings • Tags are updated in real-time based on active listings"
                    }, void 0, false, {
                        fileName: "[project]/src/components/browse/PopularTags.tsx",
                        lineNumber: 92,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/browse/PopularTags.tsx",
                    lineNumber: 91,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/browse/PopularTags.tsx",
            lineNumber: 60,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/browse/PopularTags.tsx",
        lineNumber: 59,
        columnNumber: 5
    }, this);
}
_c = PopularTags;
var _c;
__turbopack_context__.k.register(_c, "PopularTags");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/hooks/useBrowseListings.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/hooks/useBrowseListings.ts
__turbopack_context__.s({
    "useBrowseListings": ()=>useBrowseListings
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/AuthContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$ListingContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/ListingContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/index.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/storage.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$browseUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/browseUtils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/rate-limiter.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/validation/schemas.ts [app-client] (ecmascript)");
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
// Helper functions to normalize listings for utility functions
const normalizeListing = (listing)=>({
        ...listing,
        markedUpPrice: listing.markedUpPrice || Math.round(listing.price * 1.1 * 100) / 100,
        imageUrls: listing.imageUrls || []
    });
const isAuctionListing = (listing)=>{
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$browseUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isAuctionListing"])(normalizeListing(listing));
};
const isListingActive = (listing)=>{
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$browseUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isListingActive"])(normalizeListing(listing));
};
const getDisplayPrice = (listing)=>{
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$browseUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDisplayPrice"])(normalizeListing(listing));
};
const useBrowseListings = ()=>{
    _s();
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const { checkLimit: checkSearchLimit } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRateLimit"])('SEARCH');
    // Get data from ListingContext
    const { listings: contextListings, users: contextUsers, subscriptions: contextSubscriptions, orderHistory: contextOrderHistory, isLoading: contextLoading, error: contextError, refreshListings } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$ListingContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useListings"])();
    // State for filters and UI
    const [filter, setFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('all');
    const [selectedHourRange, setSelectedHourRange] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$browseUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HOUR_RANGE_OPTIONS"][0]);
    const [searchTerm, setSearchTerm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [minPrice, setMinPrice] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [maxPrice, setMaxPrice] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [sortBy, setSortBy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('newest');
    const [page, setPage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [forceUpdateTimer, setForceUpdateTimer] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [hoveredListing, setHoveredListing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [sellerProfiles, setSellerProfiles] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [listingErrors, setListingErrors] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [debouncedSearchTerm, setDebouncedSearchTerm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(searchTerm);
    const [rateLimitError, setRateLimitError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Refs
    const timeCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])({});
    const timerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const mountedRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(true);
    const lastClickTime = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(0);
    const lastQuickViewTime = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(0);
    const MAX_CACHED_PROFILES = 100;
    // Sanitized search term setter
    const handleSearchTermChange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useBrowseListings.useCallback[handleSearchTermChange]": (value)=>{
            const sanitized = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeSearchQuery"])(value);
            setSearchTerm(sanitized);
        }
    }["useBrowseListings.useCallback[handleSearchTermChange]"], []);
    // Validated price setters
    const handleMinPriceChange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useBrowseListings.useCallback[handleMinPriceChange]": (value)=>{
            if (value === '') {
                setMinPrice('');
                return;
            }
            const validation = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["searchSchemas"].priceRange.safeParse({
                min: parseFloat(value)
            });
            if (validation.success) {
                setMinPrice(value);
            }
        }
    }["useBrowseListings.useCallback[handleMinPriceChange]"], []);
    const handleMaxPriceChange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useBrowseListings.useCallback[handleMaxPriceChange]": (value)=>{
            if (value === '') {
                setMaxPrice('');
                return;
            }
            const validation = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["searchSchemas"].priceRange.safeParse({
                max: parseFloat(value)
            });
            if (validation.success) {
                setMaxPrice(value);
            }
        }
    }["useBrowseListings.useCallback[handleMaxPriceChange]"], []);
    // Apply filters to context listings
    const filteredListings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useBrowseListings.useMemo[filteredListings]": ()=>{
            console.log('=== Filtering listings ===');
            console.log('Context listings count:', contextListings.length);
            console.log('Current filters:', {
                filter,
                searchTerm: debouncedSearchTerm,
                minPrice,
                maxPrice,
                sortBy,
                selectedHourRange
            });
            let filtered = [
                ...contextListings
            ];
            // Filter out ended auctions
            filtered = filtered.filter({
                "useBrowseListings.useMemo[filteredListings]": (listing)=>{
                    if (!listing.auction) return true;
                    const now = new Date();
                    const endTime = new Date(listing.auction.endTime);
                    return endTime > now;
                }
            }["useBrowseListings.useMemo[filteredListings]"]);
            console.log('After active filter:', filtered.length);
            // Apply category filter
            if (filter !== 'all') {
                filtered = filtered.filter({
                    "useBrowseListings.useMemo[filteredListings]": (listing)=>{
                        if (filter === 'premium') return listing.isPremium && !listing.auction;
                        if (filter === 'standard') return !listing.isPremium && !listing.auction;
                        if (filter === 'auction') return !!listing.auction;
                        return true;
                    }
                }["useBrowseListings.useMemo[filteredListings]"]);
            }
            console.log('After category filter:', filtered.length);
            // Apply search filter
            if (debouncedSearchTerm) {
                const query = debouncedSearchTerm.toLowerCase();
                filtered = filtered.filter({
                    "useBrowseListings.useMemo[filteredListings]": (listing)=>{
                        var _listing_tags;
                        return listing.title.toLowerCase().includes(query) || listing.description.toLowerCase().includes(query) || ((_listing_tags = listing.tags) === null || _listing_tags === void 0 ? void 0 : _listing_tags.some({
                            "useBrowseListings.useMemo[filteredListings]": (tag)=>tag.toLowerCase().includes(query)
                        }["useBrowseListings.useMemo[filteredListings]"])) || listing.seller.toLowerCase().includes(query);
                    }
                }["useBrowseListings.useMemo[filteredListings]"]);
            }
            console.log('After search filter:', filtered.length);
            // Apply price filters
            if (minPrice) {
                const min = parseFloat(minPrice);
                if (!isNaN(min)) {
                    filtered = filtered.filter({
                        "useBrowseListings.useMemo[filteredListings]": (listing)=>{
                            var _listing_auction;
                            const price = ((_listing_auction = listing.auction) === null || _listing_auction === void 0 ? void 0 : _listing_auction.highestBid) || listing.price;
                            return price >= min;
                        }
                    }["useBrowseListings.useMemo[filteredListings]"]);
                }
            }
            if (maxPrice) {
                const max = parseFloat(maxPrice);
                if (!isNaN(max)) {
                    filtered = filtered.filter({
                        "useBrowseListings.useMemo[filteredListings]": (listing)=>{
                            var _listing_auction;
                            const price = ((_listing_auction = listing.auction) === null || _listing_auction === void 0 ? void 0 : _listing_auction.highestBid) || listing.price;
                            return price <= max;
                        }
                    }["useBrowseListings.useMemo[filteredListings]"]);
                }
            }
            console.log('After price filter:', filtered.length);
            // Apply hour range filter
            filtered = filtered.filter({
                "useBrowseListings.useMemo[filteredListings]": (listing)=>{
                    var _listing_hoursWorn;
                    const hoursWorn = (_listing_hoursWorn = listing.hoursWorn) !== null && _listing_hoursWorn !== void 0 ? _listing_hoursWorn : 0;
                    return hoursWorn >= selectedHourRange.min && hoursWorn <= selectedHourRange.max;
                }
            }["useBrowseListings.useMemo[filteredListings]"]);
            console.log('After hour range filter:', filtered.length);
            // Apply sorting
            filtered.sort({
                "useBrowseListings.useMemo[filteredListings]": (a, b)=>{
                    switch(sortBy){
                        case 'newest':
                            return new Date(b.date).getTime() - new Date(a.date).getTime();
                        case 'priceAsc':
                            var _a_auction, _b_auction;
                            const aPrice = ((_a_auction = a.auction) === null || _a_auction === void 0 ? void 0 : _a_auction.highestBid) || a.price;
                            const bPrice = ((_b_auction = b.auction) === null || _b_auction === void 0 ? void 0 : _b_auction.highestBid) || b.price;
                            return aPrice - bPrice;
                        case 'priceDesc':
                            var _a_auction1, _b_auction1;
                            const aPriceDesc = ((_a_auction1 = a.auction) === null || _a_auction1 === void 0 ? void 0 : _a_auction1.highestBid) || a.price;
                            const bPriceDesc = ((_b_auction1 = b.auction) === null || _b_auction1 === void 0 ? void 0 : _b_auction1.highestBid) || b.price;
                            return bPriceDesc - aPriceDesc;
                        case 'endingSoon':
                            if (a.auction && b.auction) {
                                return new Date(a.auction.endTime).getTime() - new Date(b.auction.endTime).getTime();
                            }
                            return a.auction ? -1 : b.auction ? 1 : 0;
                        default:
                            return 0;
                    }
                }
            }["useBrowseListings.useMemo[filteredListings]"]);
            console.log('Final filtered count:', filtered.length);
            return filtered;
        }
    }["useBrowseListings.useMemo[filteredListings]"], [
        contextListings,
        filter,
        debouncedSearchTerm,
        minPrice,
        maxPrice,
        selectedHourRange,
        sortBy
    ]);
    // Load seller profiles
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useBrowseListings.useEffect": ()=>{
            const loadSellerProfiles = {
                "useBrowseListings.useEffect.loadSellerProfiles": async ()=>{
                    if ("object" !== 'undefined' && !contextLoading && contextListings.length > 0) {
                        const currentSellers = new Set(contextListings.map({
                            "useBrowseListings.useEffect.loadSellerProfiles": (listing)=>listing.seller
                        }["useBrowseListings.useEffect.loadSellerProfiles"]));
                        const profiles = {};
                        const sellersArray = Array.from(currentSellers).slice(0, MAX_CACHED_PROFILES);
                        // Load all user profiles at once
                        const userProfiles = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('user_profiles', {});
                        sellersArray.forEach({
                            "useBrowseListings.useEffect.loadSellerProfiles": (seller)=>{
                                const profileData = userProfiles[seller];
                                if (profileData) {
                                    profiles[(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(seller)] = {
                                        bio: profileData.bio ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(profileData.bio) : null,
                                        pic: profileData.profilePic || null
                                    };
                                }
                            }
                        }["useBrowseListings.useEffect.loadSellerProfiles"]);
                        setSellerProfiles(profiles);
                    }
                }
            }["useBrowseListings.useEffect.loadSellerProfiles"];
            loadSellerProfiles();
        }
    }["useBrowseListings.useEffect"], [
        contextListings,
        contextLoading
    ]);
    // Debounced search
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useBrowseListings.useEffect": ()=>{
            const timer = setTimeout({
                "useBrowseListings.useEffect.timer": ()=>{
                    setDebouncedSearchTerm(searchTerm);
                }
            }["useBrowseListings.useEffect.timer"], 300);
            return ({
                "useBrowseListings.useEffect": ()=>clearTimeout(timer)
            })["useBrowseListings.useEffect"];
        }
    }["useBrowseListings.useEffect"], [
        searchTerm
    ]);
    // Reset page on filter changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useBrowseListings.useEffect": ()=>{
            setPage(0);
        }
    }["useBrowseListings.useEffect"], [
        filter,
        selectedHourRange,
        debouncedSearchTerm,
        minPrice,
        maxPrice,
        sortBy
    ]);
    // Timer management for auctions
    const auctionTimers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useBrowseListings.useMemo[auctionTimers]": ()=>{
            try {
                const now = new Date();
                const activeAuctions = filteredListings.filter({
                    "useBrowseListings.useMemo[auctionTimers].activeAuctions": (listing)=>{
                        var _listing_auction;
                        if (!isAuctionListing(listing) || !isListingActive(listing)) return false;
                        const endTime = ((_listing_auction = listing.auction) === null || _listing_auction === void 0 ? void 0 : _listing_auction.endTime) ? new Date(listing.auction.endTime) : null;
                        return endTime && endTime > now;
                    }
                }["useBrowseListings.useMemo[auctionTimers].activeAuctions"]);
                return activeAuctions.map({
                    "useBrowseListings.useMemo[auctionTimers]": (listing)=>{
                        if (!listing.auction) return null;
                        const endTime = new Date(listing.auction.endTime);
                        const timeLeft = endTime.getTime() - now.getTime();
                        let updateInterval;
                        if (timeLeft < 60000) {
                            updateInterval = 5000;
                        } else if (timeLeft < 300000) {
                            updateInterval = 15000;
                        } else if (timeLeft < 3600000) {
                            updateInterval = 60000;
                        } else {
                            updateInterval = 300000;
                        }
                        return {
                            id: listing.id,
                            endTime: listing.auction.endTime,
                            updateInterval
                        };
                    }
                }["useBrowseListings.useMemo[auctionTimers]"]).filter({
                    "useBrowseListings.useMemo[auctionTimers]": (timer)=>timer !== null
                }["useBrowseListings.useMemo[auctionTimers]"]);
            } catch (error) {
                console.error('Error calculating auction timers:', error);
                return [];
            }
        }
    }["useBrowseListings.useMemo[auctionTimers]"], [
        filteredListings
    ]);
    // Timer effect
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useBrowseListings.useEffect": ()=>{
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            if (auctionTimers.length === 0 || !mountedRef.current) {
                return;
            }
            try {
                const minInterval = Math.max(Math.min(...auctionTimers.map({
                    "useBrowseListings.useEffect.minInterval": (t)=>{
                        var _t_updateInterval;
                        return (_t_updateInterval = t === null || t === void 0 ? void 0 : t.updateInterval) !== null && _t_updateInterval !== void 0 ? _t_updateInterval : Infinity;
                    }
                }["useBrowseListings.useEffect.minInterval"])), 5000);
                timerRef.current = setInterval({
                    "useBrowseListings.useEffect": ()=>{
                        if (!mountedRef.current) {
                            if (timerRef.current) {
                                clearInterval(timerRef.current);
                                timerRef.current = null;
                            }
                            return;
                        }
                        setForceUpdateTimer({
                            "useBrowseListings.useEffect": (prev)=>prev + 1
                        }["useBrowseListings.useEffect"]);
                    }
                }["useBrowseListings.useEffect"], minInterval);
            } catch (error) {
                console.error('Error setting up auction timer:', error);
            }
            return ({
                "useBrowseListings.useEffect": ()=>{
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                        timerRef.current = null;
                    }
                }
            })["useBrowseListings.useEffect"];
        }
    }["useBrowseListings.useEffect"], [
        auctionTimers.length
    ]);
    // Cleanup on unmount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useBrowseListings.useEffect": ()=>{
            mountedRef.current = true;
            return ({
                "useBrowseListings.useEffect": ()=>{
                    mountedRef.current = false;
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                        timerRef.current = null;
                    }
                }
            })["useBrowseListings.useEffect"];
        }
    }["useBrowseListings.useEffect"], []);
    // Memoized calculations
    const categoryCounts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useBrowseListings.useMemo[categoryCounts]": ()=>{
            try {
                const activeListings = contextListings.filter(isListingActive);
                return {
                    all: activeListings.length,
                    standard: activeListings.filter({
                        "useBrowseListings.useMemo[categoryCounts]": (l)=>!l.isPremium && !l.auction
                    }["useBrowseListings.useMemo[categoryCounts]"]).length,
                    premium: activeListings.filter({
                        "useBrowseListings.useMemo[categoryCounts]": (l)=>l.isPremium && !l.auction
                    }["useBrowseListings.useMemo[categoryCounts]"]).length,
                    auction: activeListings.filter({
                        "useBrowseListings.useMemo[categoryCounts]": (l)=>l.auction
                    }["useBrowseListings.useMemo[categoryCounts]"]).length
                };
            } catch (error) {
                console.error('Error calculating category counts:', error);
                return {
                    all: 0,
                    standard: 0,
                    premium: 0,
                    auction: 0
                };
            }
        }
    }["useBrowseListings.useMemo[categoryCounts]"], [
        contextListings
    ]);
    const getSellerSalesCount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useBrowseListings.useCallback[getSellerSalesCount]": (seller)=>{
            try {
                return contextOrderHistory.filter({
                    "useBrowseListings.useCallback[getSellerSalesCount]": (order)=>order.seller === seller
                }["useBrowseListings.useCallback[getSellerSalesCount]"]).length;
            } catch (error) {
                console.error('Error getting seller sales count:', error);
                return 0;
            }
        }
    }["useBrowseListings.useCallback[getSellerSalesCount]"], [
        contextOrderHistory
    ]);
    // Create paginated listings with profile data
    const paginatedListings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useBrowseListings.useMemo[paginatedListings]": ()=>{
            try {
                // First, create listings with profile data
                const listingsWithProfiles = filteredListings.map({
                    "useBrowseListings.useMemo[paginatedListings].listingsWithProfiles": (listing)=>{
                        const sellerUser = contextUsers === null || contextUsers === void 0 ? void 0 : contextUsers[listing.seller];
                        const isSellerVerified = (sellerUser === null || sellerUser === void 0 ? void 0 : sellerUser.verified) || (sellerUser === null || sellerUser === void 0 ? void 0 : sellerUser.verificationStatus) === 'verified';
                        const sellerSalesCount = getSellerSalesCount(listing.seller);
                        const sellerProfile = sellerProfiles[listing.seller];
                        return {
                            ...listing,
                            sellerProfile,
                            sellerSalesCount,
                            isSellerVerified
                        };
                    }
                }["useBrowseListings.useMemo[paginatedListings].listingsWithProfiles"]);
                // Then paginate
                const start = page * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$browseUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PAGE_SIZE"];
                const end = start + __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$browseUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PAGE_SIZE"];
                console.log("Paginating: page ".concat(page, ", showing items ").concat(start, "-").concat(end, " of ").concat(listingsWithProfiles.length));
                return listingsWithProfiles.slice(start, end);
            } catch (error) {
                console.error('Error creating paginated listings:', error);
                return [];
            }
        }
    }["useBrowseListings.useMemo[paginatedListings]"], [
        filteredListings,
        contextUsers,
        getSellerSalesCount,
        sellerProfiles,
        page
    ]);
    const totalPages = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useBrowseListings.useMemo[totalPages]": ()=>{
            try {
                return Math.ceil(filteredListings.length / __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$browseUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PAGE_SIZE"]);
            } catch (error) {
                console.error('Error calculating total pages:', error);
                return 1;
            }
        }
    }["useBrowseListings.useMemo[totalPages]"], [
        filteredListings
    ]);
    // Utility functions
    const isSubscribed = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useBrowseListings.useCallback[isSubscribed]": (buyerUsername, sellerUsername)=>{
            if (!buyerUsername || !sellerUsername) return false;
            const buyerSubs = contextSubscriptions[buyerUsername] || [];
            return buyerSubs.includes(sellerUsername);
        }
    }["useBrowseListings.useCallback[isSubscribed]"], [
        contextSubscriptions
    ]);
    // Handlers
    const handleMouseEnter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useBrowseListings.useCallback[handleMouseEnter]": (listingId)=>{
            setHoveredListing(listingId);
        }
    }["useBrowseListings.useCallback[handleMouseEnter]"], []);
    const handleMouseLeave = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useBrowseListings.useCallback[handleMouseLeave]": ()=>{
            setHoveredListing(null);
        }
    }["useBrowseListings.useCallback[handleMouseLeave]"], []);
    const handleListingClick = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useBrowseListings.useCallback[handleListingClick]": (listingId, isLocked)=>{
            try {
                if (isLocked) return;
                const now = Date.now();
                if (now - lastClickTime.current < 300) return;
                lastClickTime.current = now;
                router.push("/browse/".concat(listingId));
            } catch (error) {
                console.error('Error navigating to listing:', error);
            }
        }
    }["useBrowseListings.useCallback[handleListingClick]"], [
        router
    ]);
    const handleQuickView = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useBrowseListings.useCallback[handleQuickView]": (e, listingId)=>{
            try {
                e.stopPropagation();
                e.preventDefault();
                const now = Date.now();
                if (now - lastQuickViewTime.current < 300) return;
                lastQuickViewTime.current = now;
                router.push("/browse/".concat(listingId));
            } catch (error) {
                console.error('Error quick viewing listing:', error);
            }
        }
    }["useBrowseListings.useCallback[handleQuickView]"], [
        router
    ]);
    const handleListingError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useBrowseListings.useCallback[handleListingError]": (error, listingId)=>{
            console.error('Listing error:', error, 'for listing:', listingId);
            const sanitizedError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(error.message);
            setListingErrors({
                "useBrowseListings.useCallback[handleListingError]": (prev)=>({
                        ...prev,
                        [listingId]: sanitizedError
                    })
            }["useBrowseListings.useCallback[handleListingError]"]);
        }
    }["useBrowseListings.useCallback[handleListingError]"], []);
    const handlePreviousPage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useBrowseListings.useCallback[handlePreviousPage]": ()=>{
            if (page > 0) {
                setPage({
                    "useBrowseListings.useCallback[handlePreviousPage]": (prev)=>prev - 1
                }["useBrowseListings.useCallback[handlePreviousPage]"]);
            }
        }
    }["useBrowseListings.useCallback[handlePreviousPage]"], [
        page
    ]);
    const handleNextPage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useBrowseListings.useCallback[handleNextPage]": ()=>{
            if (page < totalPages - 1) {
                setPage({
                    "useBrowseListings.useCallback[handleNextPage]": (prev)=>prev + 1
                }["useBrowseListings.useCallback[handleNextPage]"]);
            }
        }
    }["useBrowseListings.useCallback[handleNextPage]"], [
        page,
        totalPages
    ]);
    const handlePageClick = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useBrowseListings.useCallback[handlePageClick]": (targetPage)=>{
            if (targetPage >= 0 && targetPage < totalPages) {
                setPage(targetPage);
            }
        }
    }["useBrowseListings.useCallback[handlePageClick]"], [
        totalPages
    ]);
    const formatTimeRemaining = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useBrowseListings.useCallback[formatTimeRemaining]": (endTime)=>{
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$browseUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatTimeRemaining"])(endTime, timeCache);
        }
    }["useBrowseListings.useCallback[formatTimeRemaining]"], []);
    const resetFilters = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useBrowseListings.useCallback[resetFilters]": ()=>{
            setFilter('all');
            setSearchTerm('');
            setMinPrice('');
            setMaxPrice('');
            setSelectedHourRange(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$browseUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HOUR_RANGE_OPTIONS"][0]);
            setSortBy('newest');
            setRateLimitError(null);
        }
    }["useBrowseListings.useCallback[resetFilters]"], []);
    const handleRateLimit = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useBrowseListings.useCallback[handleRateLimit]": ()=>{
            const rateLimitResult = checkSearchLimit();
            if (!rateLimitResult.allowed) {
                setRateLimitError("Too many searches. Please wait ".concat(rateLimitResult.waitTime, " seconds."));
                return false;
            }
            setRateLimitError(null);
            return true;
        }
    }["useBrowseListings.useCallback[handleRateLimit]"], [
        checkSearchLimit
    ]);
    // Trigger refresh when component mounts
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useBrowseListings.useEffect": ()=>{
            refreshListings();
        }
    }["useBrowseListings.useEffect"], []);
    return {
        // Auth & State
        user,
        filter,
        setFilter,
        selectedHourRange,
        setSelectedHourRange,
        searchTerm,
        setSearchTerm: handleSearchTermChange,
        minPrice,
        setMinPrice: handleMinPriceChange,
        maxPrice,
        setMaxPrice: handleMaxPriceChange,
        sortBy,
        setSortBy,
        page,
        hoveredListing,
        listingErrors,
        forceUpdateTimer,
        rateLimitError,
        // Data
        filteredListings: paginatedListings,
        paginatedListings,
        categoryCounts,
        totalPages,
        // Loading state
        isLoading: contextLoading,
        error: contextError,
        // Handlers
        handleMouseEnter,
        handleMouseLeave,
        handleListingClick,
        handleQuickView,
        handleListingError,
        handlePreviousPage,
        handleNextPage,
        handlePageClick,
        resetFilters,
        refreshListings,
        // Utils
        isSubscribed,
        getDisplayPrice,
        formatTimeRemaining,
        // Constants
        HOUR_RANGE_OPTIONS: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$browseUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HOUR_RANGE_OPTIONS"],
        PAGE_SIZE: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$browseUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PAGE_SIZE"]
    };
};
_s(useBrowseListings, "sQ5hSQio2qU+JqviFPsgXDV11F4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRateLimit"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$ListingContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useListings"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/hooks/useAnalytics.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/hooks/useAnalytics.ts
__turbopack_context__.s({
    "useAnalytics": ()=>useAnalytics
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
;
function useAnalytics() {
    _s();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const trackEvent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAnalytics.useCallback[trackEvent]": (event)=>{
            // Google Analytics 4
            if ("object" !== 'undefined' && window.gtag) {
                window.gtag('event', event.action, {
                    event_category: event.category,
                    event_label: event.label,
                    value: event.value,
                    ...event.customData
                });
            }
            // Custom analytics endpoint
            if (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
                fetch(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        ...event,
                        timestamp: new Date().toISOString(),
                        page: pathname,
                        userAgent: navigator.userAgent
                    })
                }).catch({
                    "useAnalytics.useCallback[trackEvent]": ()=>{
                    // Fail silently
                    }
                }["useAnalytics.useCallback[trackEvent]"]);
            }
        }
    }["useAnalytics.useCallback[trackEvent]"], [
        pathname
    ]);
    const trackPageView = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAnalytics.useCallback[trackPageView]": (url)=>{
            if ("object" !== 'undefined' && window.gtag) {
                window.gtag('config', __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
                    page_path: url
                });
            }
        }
    }["useAnalytics.useCallback[trackPageView]"], []);
    const trackPurchase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAnalytics.useCallback[trackPurchase]": (data)=>{
            trackEvent({
                action: 'purchase',
                category: 'ecommerce',
                value: data.value,
                customData: {
                    transaction_id: data.transactionId,
                    currency: data.currency,
                    items: data.items
                }
            });
        }
    }["useAnalytics.useCallback[trackPurchase]"], [
        trackEvent
    ]);
    const trackSearch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAnalytics.useCallback[trackSearch]": (searchTerm, resultsCount)=>{
            trackEvent({
                action: 'search',
                category: 'engagement',
                label: searchTerm,
                value: resultsCount
            });
        }
    }["useAnalytics.useCallback[trackSearch]"], [
        trackEvent
    ]);
    const trackSocialShare = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAnalytics.useCallback[trackSocialShare]": (platform, contentId)=>{
            trackEvent({
                action: 'share',
                category: 'social',
                label: platform,
                customData: {
                    content_id: contentId
                }
            });
        }
    }["useAnalytics.useCallback[trackSocialShare]"], [
        trackEvent
    ]);
    return {
        trackEvent,
        trackPageView,
        trackPurchase,
        trackSearch,
        trackSocialShare
    };
}
_s(useAnalytics, "Ww6Qanx37NQUxH5aa5dzvQkw3EY=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/app/browse/page.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/app/browse/page.tsx
__turbopack_context__.s({
    "default": ()=>BrowsePage
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$RequireAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/RequireAuth.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$BanCheck$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/BanCheck.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$browse$2f$BrowseHeader$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/browse/BrowseHeader.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$browse$2f$BrowseFilters$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/browse/BrowseFilters.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$browse$2f$ListingGrid$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/browse/ListingGrid.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$browse$2f$PaginationControls$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/browse/PaginationControls.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$browse$2f$EmptyState$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/browse/EmptyState.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$browse$2f$PopularTags$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/browse/PopularTags.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useBrowseListings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useBrowseListings.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useAnalytics$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useAnalytics.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$listings$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/listings.service.ts [app-client] (ecmascript)");
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
;
;
function BrowsePage() {
    _s();
    const { trackEvent, trackSearch } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useAnalytics$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAnalytics"])();
    const searchTimeoutRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const filterTimeoutRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const isMountedRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(true);
    const previousFiltersRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])('');
    // Popular tags state
    const [popularTags, setPopularTags] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [tagsLoading, setTagsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [tagsError, setTagsError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const { user, filter, setFilter, selectedHourRange, setSelectedHourRange, searchTerm, setSearchTerm, minPrice, setMinPrice, maxPrice, setMaxPrice, sortBy, setSortBy, page, hoveredListing, listingErrors, forceUpdateTimer, filteredListings, paginatedListings, categoryCounts, totalPages, handleMouseEnter, handleMouseLeave, handleListingClick, handleQuickView, handleListingError, handlePreviousPage, handleNextPage, handlePageClick, resetFilters, isSubscribed, getDisplayPrice, formatTimeRemaining, HOUR_RANGE_OPTIONS, PAGE_SIZE, isLoading, refreshListings } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useBrowseListings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowseListings"])();
    const hasActiveFilters = !!(searchTerm || minPrice || maxPrice || selectedHourRange.label !== 'Any Hours' || sortBy !== 'newest');
    // Track component mount status
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BrowsePage.useEffect": ()=>{
            isMountedRef.current = true;
            return ({
                "BrowsePage.useEffect": ()=>{
                    isMountedRef.current = false;
                    // Clean up any pending timeouts
                    if (searchTimeoutRef.current) {
                        clearTimeout(searchTimeoutRef.current);
                        searchTimeoutRef.current = null;
                    }
                    if (filterTimeoutRef.current) {
                        clearTimeout(filterTimeoutRef.current);
                        filterTimeoutRef.current = null;
                    }
                }
            })["BrowsePage.useEffect"];
        }
    }["BrowsePage.useEffect"], []);
    // Listen for subscription changes and refresh listings
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BrowsePage.useEffect": ()=>{
            const handleSubscriptionChange = {
                "BrowsePage.useEffect.handleSubscriptionChange": (event)=>{
                    console.log('[BrowsePage] Subscription changed:', event.detail);
                    // Only refresh if the current user is the one who subscribed/unsubscribed
                    if (user && event.detail.buyer === user.username) {
                        // Small delay to ensure backend has processed the change
                        setTimeout({
                            "BrowsePage.useEffect.handleSubscriptionChange": ()=>{
                                refreshListings();
                            }
                        }["BrowsePage.useEffect.handleSubscriptionChange"], 500);
                    }
                }
            }["BrowsePage.useEffect.handleSubscriptionChange"];
            window.addEventListener('subscription:changed', handleSubscriptionChange);
            return ({
                "BrowsePage.useEffect": ()=>{
                    window.removeEventListener('subscription:changed', handleSubscriptionChange);
                }
            })["BrowsePage.useEffect"];
        }
    }["BrowsePage.useEffect"], [
        user,
        refreshListings
    ]);
    // Fetch popular tags
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BrowsePage.useEffect": ()=>{
            const fetchPopularTags = {
                "BrowsePage.useEffect.fetchPopularTags": async ()=>{
                    if (!isMountedRef.current) return;
                    setTagsLoading(true);
                    setTagsError(null);
                    try {
                        const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$listings$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["listingsService"].getPopularTags(15);
                        if (isMountedRef.current && response.success && response.data) {
                            setPopularTags(response.data);
                        } else if (isMountedRef.current && !response.success) {
                            setTagsError('Failed to load popular tags');
                        }
                    } catch (error) {
                        console.error('Error fetching popular tags:', error);
                        if (isMountedRef.current) {
                            setTagsError('Failed to load popular tags');
                        }
                    } finally{
                        if (isMountedRef.current) {
                            setTagsLoading(false);
                        }
                    }
                }
            }["BrowsePage.useEffect.fetchPopularTags"];
            fetchPopularTags();
        }
    }["BrowsePage.useEffect"], []); // Only fetch once on mount
    // Track page view
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BrowsePage.useEffect": ()=>{
            if (isMountedRef.current) {
                try {
                    trackEvent({
                        action: 'page_view',
                        category: 'navigation',
                        label: 'browse_page'
                    });
                } catch (error) {
                    console.error('Failed to track page view:', error);
                }
            }
        }
    }["BrowsePage.useEffect"], [
        trackEvent
    ]);
    // Track search with debouncing
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BrowsePage.useEffect": ()=>{
            if (searchTerm && isMountedRef.current) {
                if (searchTimeoutRef.current) {
                    clearTimeout(searchTimeoutRef.current);
                    searchTimeoutRef.current = null;
                }
                searchTimeoutRef.current = setTimeout({
                    "BrowsePage.useEffect": ()=>{
                        if (isMountedRef.current) {
                            try {
                                trackSearch(searchTerm, filteredListings.length);
                            } catch (error) {
                                console.error('Failed to track search:', error);
                            }
                        }
                    }
                }["BrowsePage.useEffect"], 1000);
            }
            return ({
                "BrowsePage.useEffect": ()=>{
                    if (searchTimeoutRef.current) {
                        clearTimeout(searchTimeoutRef.current);
                        searchTimeoutRef.current = null;
                    }
                }
            })["BrowsePage.useEffect"];
        }
    }["BrowsePage.useEffect"], [
        searchTerm,
        filteredListings.length,
        trackSearch
    ]);
    // Track filter changes with debouncing
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BrowsePage.useEffect": ()=>{
            const currentFilterSignature = JSON.stringify({
                filter,
                searchTerm,
                minPrice,
                maxPrice,
                selectedHourRange: selectedHourRange.label,
                sortBy
            });
            if (hasActiveFilters && currentFilterSignature !== previousFiltersRef.current && isMountedRef.current) {
                previousFiltersRef.current = currentFilterSignature;
                if (filterTimeoutRef.current) {
                    clearTimeout(filterTimeoutRef.current);
                    filterTimeoutRef.current = null;
                }
                filterTimeoutRef.current = setTimeout({
                    "BrowsePage.useEffect": ()=>{
                        if (isMountedRef.current) {
                            try {
                                trackEvent({
                                    action: 'apply_filters',
                                    category: 'browse',
                                    label: filter,
                                    value: filteredListings.length,
                                    customData: {
                                        has_search: !!searchTerm,
                                        has_price_filter: !!(minPrice || maxPrice),
                                        price_min: minPrice || 0,
                                        price_max: maxPrice || 0,
                                        hour_range: selectedHourRange.label,
                                        sort_by: sortBy
                                    }
                                });
                            } catch (error) {
                                console.error('Failed to track filter change:', error);
                            }
                        }
                    }
                }["BrowsePage.useEffect"], 1500);
            }
            return ({
                "BrowsePage.useEffect": ()=>{
                    if (filterTimeoutRef.current) {
                        clearTimeout(filterTimeoutRef.current);
                        filterTimeoutRef.current = null;
                    }
                }
            })["BrowsePage.useEffect"];
        }
    }["BrowsePage.useEffect"], [
        filter,
        searchTerm,
        minPrice,
        maxPrice,
        selectedHourRange,
        sortBy,
        filteredListings.length,
        hasActiveFilters,
        trackEvent
    ]);
    // Handler for tag clicks with analytics
    const handleTagClick = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "BrowsePage.useCallback[handleTagClick]": (tag)=>{
            if (!isMountedRef.current) return;
            // Track the tag click
            try {
                trackEvent({
                    action: 'select_tag',
                    category: 'browse',
                    label: tag,
                    customData: {
                        source: 'popular_tags'
                    }
                });
            } catch (error) {
                console.error('Failed to track tag click:', error);
            }
            // Add tag to search term if not already present
            if (!searchTerm.includes(tag)) {
                setSearchTerm(searchTerm ? "".concat(searchTerm, " ").concat(tag) : tag);
            }
        }
    }["BrowsePage.useCallback[handleTagClick]"], [
        searchTerm,
        setSearchTerm,
        trackEvent
    ]);
    // Enhanced click handler with analytics
    const handleListingClickWithAnalytics = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "BrowsePage.useCallback[handleListingClickWithAnalytics]": (listingId)=>{
            if (!isMountedRef.current) return;
            const listing = filteredListings.find({
                "BrowsePage.useCallback[handleListingClickWithAnalytics].listing": (l)=>l.id === listingId
            }["BrowsePage.useCallback[handleListingClickWithAnalytics].listing"]);
            if (listing) {
                // Robust auction detection (matches detail page logic)
                const isActualAuction = !!(listing.auction && (listing.auction.isAuction || listing.auction.startingPrice !== undefined));
                const price = typeof listing.price === 'number' ? listing.price : parseFloat(String(listing.price)) || 0;
                try {
                    var _isSellerVerified, _ref;
                    trackEvent({
                        action: 'select_item',
                        category: 'browse',
                        label: listingId,
                        value: price,
                        customData: {
                            item_name: listing.title || 'Unknown',
                            item_category: listing.isPremium ? 'premium' : isActualAuction ? 'auction' : 'standard',
                            seller_name: listing.seller || 'Unknown',
                            seller_verified: (_ref = (_isSellerVerified = listing.isSellerVerified) !== null && _isSellerVerified !== void 0 ? _isSellerVerified : listing.isVerified) !== null && _ref !== void 0 ? _ref : false,
                            position: Math.max(1, paginatedListings.findIndex({
                                "BrowsePage.useCallback[handleListingClickWithAnalytics]": (l)=>l.id === listingId
                            }["BrowsePage.useCallback[handleListingClickWithAnalytics]"]) + 1)
                        }
                    });
                } catch (error) {
                    console.error('Failed to track listing click:', error);
                }
            }
            // Pass false for isLocked parameter since we're allowing the click
            handleListingClick(listingId, false);
        }
    }["BrowsePage.useCallback[handleListingClickWithAnalytics]"], [
        filteredListings,
        paginatedListings,
        trackEvent,
        handleListingClick
    ]);
    // Track page navigation
    const handlePageChangeWithAnalytics = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "BrowsePage.useCallback[handlePageChangeWithAnalytics]": (newPage, direction)=>{
            if (!isMountedRef.current) return;
            try {
                trackEvent({
                    action: 'navigate_page',
                    category: 'browse',
                    label: direction,
                    value: newPage,
                    customData: {
                        from_page: page,
                        to_page: newPage
                    }
                });
            } catch (error) {
                console.error('Failed to track page navigation:', error);
            }
            if (direction === 'previous') {
                handlePreviousPage();
            } else if (direction === 'next') {
                handleNextPage();
            } else {
                handlePageClick(newPage);
            }
        }
    }["BrowsePage.useCallback[handlePageChangeWithAnalytics]"], [
        page,
        trackEvent,
        handlePreviousPage,
        handleNextPage,
        handlePageClick
    ]);
    // Track filter reset
    const resetFiltersWithAnalytics = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "BrowsePage.useCallback[resetFiltersWithAnalytics]": ()=>{
            if (!isMountedRef.current) return;
            try {
                trackEvent({
                    action: 'reset_filters',
                    category: 'browse',
                    label: 'all_filters'
                });
            } catch (error) {
                console.error('Failed to track filter reset:', error);
            }
            previousFiltersRef.current = '';
            resetFilters();
        }
    }["BrowsePage.useCallback[resetFiltersWithAnalytics]"], [
        trackEvent,
        resetFilters
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$BanCheck$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$RequireAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
            role: (user === null || user === void 0 ? void 0 : user.role) || 'buyer',
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "min-h-screen bg-black text-white pb-16 pt-8",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$browse$2f$BrowseHeader$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        user: user,
                        filteredListingsCount: filteredListings.length,
                        filter: filter,
                        categoryCounts: categoryCounts,
                        onFilterChange: setFilter
                    }, void 0, false, {
                        fileName: "[project]/src/app/browse/page.tsx",
                        lineNumber: 343,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$browse$2f$BrowseFilters$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        searchTerm: searchTerm,
                        onSearchTermChange: setSearchTerm,
                        minPrice: minPrice,
                        onMinPriceChange: setMinPrice,
                        maxPrice: maxPrice,
                        onMaxPriceChange: setMaxPrice,
                        sortBy: sortBy,
                        onSortByChange: setSortBy,
                        selectedHourRange: selectedHourRange,
                        onHourRangeChange: setSelectedHourRange,
                        hourRangeOptions: HOUR_RANGE_OPTIONS,
                        onClearFilters: resetFiltersWithAnalytics,
                        hasActiveFilters: hasActiveFilters
                    }, void 0, false, {
                        fileName: "[project]/src/app/browse/page.tsx",
                        lineNumber: 351,
                        columnNumber: 11
                    }, this),
                    !hasActiveFilters && popularTags.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$browse$2f$PopularTags$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        tags: popularTags,
                        onTagClick: handleTagClick,
                        isLoading: tagsLoading,
                        error: tagsError
                    }, void 0, false, {
                        fileName: "[project]/src/app/browse/page.tsx",
                        lineNumber: 369,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "max-w-[1700px] mx-auto px-6",
                        children: paginatedListings.length === 0 && !isLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$browse$2f$EmptyState$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            searchTerm: searchTerm,
                            onResetFilters: resetFiltersWithAnalytics
                        }, void 0, false, {
                            fileName: "[project]/src/app/browse/page.tsx",
                            lineNumber: 379,
                            columnNumber: 15
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$browse$2f$ListingGrid$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    listings: paginatedListings,
                                    hoveredListing: hoveredListing,
                                    onListingHover: handleMouseEnter,
                                    onListingLeave: handleMouseLeave,
                                    onListingClick: handleListingClickWithAnalytics,
                                    onQuickView: handleQuickView,
                                    user: user,
                                    isSubscribed: isSubscribed,
                                    getDisplayPrice: getDisplayPrice,
                                    forceUpdateTimer: forceUpdateTimer,
                                    formatTimeRemaining: formatTimeRemaining,
                                    listingErrors: listingErrors,
                                    onListingError: handleListingError
                                }, void 0, false, {
                                    fileName: "[project]/src/app/browse/page.tsx",
                                    lineNumber: 385,
                                    columnNumber: 17
                                }, this),
                                totalPages > 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$browse$2f$PaginationControls$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    currentPage: page,
                                    totalPages: totalPages,
                                    filteredListingsCount: filteredListings.length,
                                    pageSize: PAGE_SIZE,
                                    onPreviousPage: ()=>handlePageChangeWithAnalytics(page - 1, 'previous'),
                                    onNextPage: ()=>handlePageChangeWithAnalytics(page + 1, 'next'),
                                    onPageClick: (newPage)=>handlePageChangeWithAnalytics(newPage, 'direct')
                                }, void 0, false, {
                                    fileName: "[project]/src/app/browse/page.tsx",
                                    lineNumber: 402,
                                    columnNumber: 19
                                }, this)
                            ]
                        }, void 0, true)
                    }, void 0, false, {
                        fileName: "[project]/src/app/browse/page.tsx",
                        lineNumber: 377,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/browse/page.tsx",
                lineNumber: 342,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/browse/page.tsx",
            lineNumber: 341,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/browse/page.tsx",
        lineNumber: 340,
        columnNumber: 5
    }, this);
}
_s(BrowsePage, "UAKCFNHY+n0+RUphdhEYJfg4cJ8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useAnalytics$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAnalytics"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useBrowseListings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBrowseListings"]
    ];
});
_c = BrowsePage;
var _c;
__turbopack_context__.k.register(_c, "BrowsePage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=src_42839692._.js.map