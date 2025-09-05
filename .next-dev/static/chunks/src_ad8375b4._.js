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
"[project]/src/components/admin/verification/VerificationHeader.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/components/admin/verification/VerificationHeader.tsx
__turbopack_context__.s({
    "default": ()=>VerificationHeader
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shield.js [app-client] (ecmascript) <export default as Shield>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/refresh-cw.js [app-client] (ecmascript) <export default as RefreshCw>");
'use client';
;
;
function VerificationHeader(param) {
    let { onRefresh } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
        className: "sticky top-0 z-30 bg-black bg-opacity-90 backdrop-blur-sm border-b border-[#2a2a2a] shadow-md",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__["Shield"], {
                            className: "w-6 h-6 text-[#ff950e] mr-3"
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/verification/VerificationHeader.tsx",
                            lineNumber: 12,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            className: "text-xl font-bold text-white",
                            children: "Verification Center"
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/verification/VerificationHeader.tsx",
                            lineNumber: 13,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/admin/verification/VerificationHeader.tsx",
                    lineNumber: 11,
                    columnNumber: 9
                }, this),
                typeof onRefresh === 'function' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    type: "button",
                    onClick: ()=>{
                        onRefresh();
                    },
                    className: "px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white hover:bg-[#222] transition flex items-center gap-2",
                    "aria-label": "Refresh verification list",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"], {
                            size: 16
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/verification/VerificationHeader.tsx",
                            lineNumber: 22,
                            columnNumber: 13
                        }, this),
                        "Refresh"
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/admin/verification/VerificationHeader.tsx",
                    lineNumber: 16,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/admin/verification/VerificationHeader.tsx",
            lineNumber: 10,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/admin/verification/VerificationHeader.tsx",
        lineNumber: 9,
        columnNumber: 5
    }, this);
}
_c = VerificationHeader;
var _c;
__turbopack_context__.k.register(_c, "VerificationHeader");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/admin/verification/VerificationSearch.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/components/admin/verification/VerificationSearch.tsx
__turbopack_context__.s({
    "default": ()=>VerificationSearch
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/search.js [app-client] (ecmascript) <export default as Search>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__UserCheck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/user-check.js [app-client] (ecmascript) <export default as UserCheck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/SecureInput.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
function VerificationSearch(param) {
    let { searchTerm, onSearchChange, sortBy, onSortChange, pendingCount } = param;
    _s();
    const handleSearchChange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "VerificationSearch.useCallback[handleSearchChange]": (value)=>{
            onSearchChange((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeSearchQuery"])(value));
        }
    }["VerificationSearch.useCallback[handleSearchChange]"], [
        onSearchChange
    ]);
    const handleSortChange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "VerificationSearch.useCallback[handleSortChange]": (e)=>{
            const v = e.target.value;
            onSortChange(v);
        }
    }["VerificationSearch.useCallback[handleSortChange]"], [
        onSortChange
    ]);
    // prevent negative / NaN
    const safePending = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "VerificationSearch.useMemo[safePending]": ()=>{
            const n = Number(pendingCount);
            return Number.isFinite(n) && n >= 0 ? n : 0;
        }
    }["VerificationSearch.useMemo[safePending]"], [
        pendingCount
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "max-w-7xl mx-auto px-4 md:px-6 py-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-6",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative max-w-md",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                            className: "absolute left-3 top-3 text-gray-500 w-4 h-4 z-10",
                            "aria-hidden": "true"
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/verification/VerificationSearch.tsx",
                            lineNumber: 40,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureInput"], {
                            type: "text",
                            placeholder: "Search username...",
                            "aria-label": "Search username",
                            value: searchTerm,
                            onChange: handleSearchChange,
                            className: "w-full bg-[#121212] border border-[#2a2a2a] text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#ff950e] focus:border-[#ff950e] transition-all",
                            maxLength: 100,
                            sanitize: true,
                            sanitizer: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeSearchQuery"]
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/verification/VerificationSearch.tsx",
                            lineNumber: 41,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/admin/verification/VerificationSearch.tsx",
                    lineNumber: 39,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/admin/verification/VerificationSearch.tsx",
                lineNumber: 38,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-2xl font-bold text-[#ff950e] flex items-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__UserCheck$3e$__["UserCheck"], {
                                        className: "mr-2 h-6 w-6",
                                        "aria-hidden": "true"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/verification/VerificationSearch.tsx",
                                        lineNumber: 59,
                                        columnNumber: 13
                                    }, this),
                                    "Pending Verifications",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "ml-3 text-sm bg-[#1f1f1f] text-gray-300 rounded-full px-3 py-1 font-normal",
                                        "aria-label": "".concat(safePending, " ").concat(safePending === 1 ? 'request' : 'requests'),
                                        children: [
                                            safePending,
                                            " ",
                                            safePending === 1 ? 'request' : 'requests'
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/admin/verification/VerificationSearch.tsx",
                                        lineNumber: 61,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/admin/verification/VerificationSearch.tsx",
                                lineNumber: 58,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-gray-400 text-sm mt-1",
                                children: "Review and validate seller identity documents"
                            }, void 0, false, {
                                fileName: "[project]/src/components/admin/verification/VerificationSearch.tsx",
                                lineNumber: 68,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/admin/verification/VerificationSearch.tsx",
                        lineNumber: 57,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                htmlFor: "verification-sort",
                                className: "text-gray-400 text-sm",
                                children: "Sort by:"
                            }, void 0, false, {
                                fileName: "[project]/src/components/admin/verification/VerificationSearch.tsx",
                                lineNumber: 73,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                id: "verification-sort",
                                value: sortBy,
                                onChange: handleSortChange,
                                className: "bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#ff950e] cursor-pointer",
                                "aria-label": "Sort pending verifications",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "newest",
                                        children: "Newest first"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/verification/VerificationSearch.tsx",
                                        lineNumber: 83,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "oldest",
                                        children: "Oldest first"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/verification/VerificationSearch.tsx",
                                        lineNumber: 84,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "alphabetical",
                                        children: "Alphabetical"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/verification/VerificationSearch.tsx",
                                        lineNumber: 85,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/admin/verification/VerificationSearch.tsx",
                                lineNumber: 76,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/admin/verification/VerificationSearch.tsx",
                        lineNumber: 72,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/admin/verification/VerificationSearch.tsx",
                lineNumber: 56,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/admin/verification/VerificationSearch.tsx",
        lineNumber: 36,
        columnNumber: 5
    }, this);
}
_s(VerificationSearch, "SsbKYg3k6eksUI0OancLvFsZfho=");
_c = VerificationSearch;
var _c;
__turbopack_context__.k.register(_c, "VerificationSearch");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/admin/verification/VerificationStats.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/components/admin/verification/VerificationStats.tsx
__turbopack_context__.s({
    "default": ()=>VerificationStats
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileCheck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/file-check.js [app-client] (ecmascript) <export default as FileCheck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/clock.js [app-client] (ecmascript) <export default as Clock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/calendar.js [app-client] (ecmascript) <export default as Calendar>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$timer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Timer$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/timer.js [app-client] (ecmascript) <export default as Timer>");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function VerificationStats(param) {
    let { stats } = param;
    _s();
    const safeNumber = (value)=>{
        const num = Number(value);
        return Number.isFinite(num) && num >= 0 ? num : 0;
    };
    const totals = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "VerificationStats.useMemo[totals]": ()=>({
                total: safeNumber(stats === null || stats === void 0 ? void 0 : stats.total),
                today: safeNumber(stats === null || stats === void 0 ? void 0 : stats.today),
                thisWeek: safeNumber(stats === null || stats === void 0 ? void 0 : stats.thisWeek),
                avgHours: safeNumber(stats === null || stats === void 0 ? void 0 : stats.averageProcessingTime)
            })
    }["VerificationStats.useMemo[totals]"], [
        stats
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "max-w-7xl mx-auto px-4 md:px-6 mb-6",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "grid grid-cols-2 md:grid-cols-4 gap-4",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileCheck$3e$__["FileCheck"], {
                            className: "mx-auto mb-2 text-[#ff950e]",
                            size: 20,
                            "aria-hidden": "true"
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/verification/VerificationStats.tsx",
                            lineNumber: 25,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-2xl font-bold text-white",
                            children: totals.total
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/verification/VerificationStats.tsx",
                            lineNumber: 26,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-xs text-gray-400",
                            children: "Total Pending"
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/verification/VerificationStats.tsx",
                            lineNumber: 27,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/admin/verification/VerificationStats.tsx",
                    lineNumber: 24,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {
                            className: "mx-auto mb-2 text-blue-400",
                            size: 20,
                            "aria-hidden": "true"
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/verification/VerificationStats.tsx",
                            lineNumber: 30,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-2xl font-bold text-blue-400",
                            children: totals.today
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/verification/VerificationStats.tsx",
                            lineNumber: 31,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-xs text-gray-400",
                            children: "Today"
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/verification/VerificationStats.tsx",
                            lineNumber: 32,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/admin/verification/VerificationStats.tsx",
                    lineNumber: 29,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__["Calendar"], {
                            className: "mx-auto mb-2 text-purple-400",
                            size: 20,
                            "aria-hidden": "true"
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/verification/VerificationStats.tsx",
                            lineNumber: 35,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-2xl font-bold text-purple-400",
                            children: totals.thisWeek
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/verification/VerificationStats.tsx",
                            lineNumber: 36,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-xs text-gray-400",
                            children: "This Week"
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/verification/VerificationStats.tsx",
                            lineNumber: 37,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/admin/verification/VerificationStats.tsx",
                    lineNumber: 34,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$timer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Timer$3e$__["Timer"], {
                            className: "mx-auto mb-2 text-green-400",
                            size: 20,
                            "aria-hidden": "true"
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/verification/VerificationStats.tsx",
                            lineNumber: 40,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-2xl font-bold text-green-400",
                            children: [
                                totals.avgHours,
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-sm ml-1",
                                    children: "h"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/admin/verification/VerificationStats.tsx",
                                    lineNumber: 43,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/admin/verification/VerificationStats.tsx",
                            lineNumber: 41,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-xs text-gray-400",
                            children: "Avg Processing"
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/verification/VerificationStats.tsx",
                            lineNumber: 45,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/admin/verification/VerificationStats.tsx",
                    lineNumber: 39,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/admin/verification/VerificationStats.tsx",
            lineNumber: 23,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/admin/verification/VerificationStats.tsx",
        lineNumber: 22,
        columnNumber: 5
    }, this);
}
_s(VerificationStats, "QCaUf9yz2nX+jn+LjKC5kuVdl2Q=");
_c = VerificationStats;
var _c;
__turbopack_context__.k.register(_c, "VerificationStats");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/admin/verification/VerificationCard.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/components/admin/verification/VerificationCard.tsx
__turbopack_context__.s({
    "default": ()=>VerificationCard
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-right.js [app-client] (ecmascript) <export default as ChevronRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/clock.js [app-client] (ecmascript) <export default as Clock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shield.js [app-client] (ecmascript) <export default as Shield>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Upload$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/upload.js [app-client] (ecmascript) <export default as Upload>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/SecureMessageDisplay.tsx [app-client] (ecmascript)");
'use client';
;
;
;
function VerificationCard(param) {
    let { user, onSelect, getTimeAgo } = param;
    const hasAllDocs = !!user.verificationDocs && !!user.verificationDocs.codePhoto && (!!user.verificationDocs.idFront || !!user.verificationDocs.passport);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        onClick: onSelect,
        className: "bg-[#0e0e0e] border border-[#222] rounded-xl p-4 hover:border-[#ff950e] transition-all duration-200 cursor-pointer group",
        role: "button",
        "aria-label": "Open verification for ".concat(user.username),
        tabIndex: 0,
        onKeyDown: (e)=>{
            if (e.key === 'Enter' || e.key === ' ') onSelect();
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-between",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-12 h-12 bg-[#1a1a1a] rounded-full flex items-center justify-center border border-[#333] group-hover:border-[#ff950e] transition-colors",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__["Shield"], {
                                className: "w-6 h-6 text-[#ff950e]"
                            }, void 0, false, {
                                fileName: "[project]/src/components/admin/verification/VerificationCard.tsx",
                                lineNumber: 32,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/verification/VerificationCard.tsx",
                            lineNumber: 31,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "font-bold text-white text-lg group-hover:text-[#ff950e] transition-colors",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureMessageDisplay"], {
                                        content: user.username,
                                        allowBasicFormatting: false
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/verification/VerificationCard.tsx",
                                        lineNumber: 36,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/admin/verification/VerificationCard.tsx",
                                    lineNumber: 35,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-2 mt-1",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {
                                            className: "w-3 h-3 text-gray-500"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/admin/verification/VerificationCard.tsx",
                                            lineNumber: 39,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-xs text-gray-400",
                                            children: [
                                                "Requested ",
                                                getTimeAgo(user.verificationRequestedAt)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/admin/verification/VerificationCard.tsx",
                                            lineNumber: 40,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/admin/verification/VerificationCard.tsx",
                                    lineNumber: 38,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/admin/verification/VerificationCard.tsx",
                            lineNumber: 34,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/admin/verification/VerificationCard.tsx",
                    lineNumber: 30,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-3",
                    children: [
                        hasAllDocs ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-2 text-green-500",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Upload$3e$__["Upload"], {
                                    className: "w-4 h-4"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/admin/verification/VerificationCard.tsx",
                                    lineNumber: 50,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-xs font-medium",
                                    children: "Docs Complete"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/admin/verification/VerificationCard.tsx",
                                    lineNumber: 51,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/admin/verification/VerificationCard.tsx",
                            lineNumber: 49,
                            columnNumber: 13
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-2 text-yellow-500",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Upload$3e$__["Upload"], {
                                    className: "w-4 h-4"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/admin/verification/VerificationCard.tsx",
                                    lineNumber: 55,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-xs font-medium",
                                    children: "Docs Incomplete"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/admin/verification/VerificationCard.tsx",
                                    lineNumber: 56,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/admin/verification/VerificationCard.tsx",
                            lineNumber: 54,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                            className: "w-5 h-5 text-gray-400 group-hover:text-[#ff950e] transition-colors"
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/verification/VerificationCard.tsx",
                            lineNumber: 59,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/admin/verification/VerificationCard.tsx",
                    lineNumber: 47,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/admin/verification/VerificationCard.tsx",
            lineNumber: 29,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/admin/verification/VerificationCard.tsx",
        lineNumber: 19,
        columnNumber: 5
    }, this);
}
_c = VerificationCard;
var _c;
__turbopack_context__.k.register(_c, "VerificationCard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/admin/verification/VerificationList.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/components/admin/verification/VerificationList.tsx
__turbopack_context__.s({
    "default": ()=>VerificationList
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-alert.js [app-client] (ecmascript) <export default as AlertCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shield.js [app-client] (ecmascript) <export default as Shield>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2f$verification$2f$VerificationCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/admin/verification/VerificationCard.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/SecureMessageDisplay.tsx [app-client] (ecmascript)");
'use client';
;
;
;
;
function VerificationList(param) {
    let { users, searchTerm, onSelectUser } = param;
    const getTimeAgo = (timestamp)=>{
        if (!timestamp) return 'Unknown date';
        const requestDate = new Date(timestamp);
        const t = requestDate.getTime();
        if (!Number.isFinite(t)) return 'Unknown date';
        const now = Date.now();
        const diffInSeconds = Math.floor((now - t) / 1000);
        if (diffInSeconds < 60) return "".concat(diffInSeconds, " seconds ago");
        if (diffInSeconds < 3600) return "".concat(Math.floor(diffInSeconds / 60), " minutes ago");
        if (diffInSeconds < 86400) return "".concat(Math.floor(diffInSeconds / 3600), " hours ago");
        if (diffInSeconds < 604800) return "".concat(Math.floor(diffInSeconds / 86400), " days ago");
        return requestDate.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };
    if (!Array.isArray(users) || users.length === 0) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "max-w-7xl mx-auto px-4 md:px-6",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-[#0e0e0e] border border-[#222] rounded-xl p-8 text-center",
                children: searchTerm ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                            className: "w-12 h-12 text-gray-500 mx-auto mb-3"
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/verification/VerificationList.tsx",
                            lineNumber: 41,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-gray-400",
                            children: [
                                'No pending verification requests found for "',
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureMessageDisplay"], {
                                    content: searchTerm,
                                    allowBasicFormatting: false,
                                    className: "inline"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/admin/verification/VerificationList.tsx",
                                    lineNumber: 44,
                                    columnNumber: 17
                                }, this),
                                '"'
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/admin/verification/VerificationList.tsx",
                            lineNumber: 42,
                            columnNumber: 15
                        }, this)
                    ]
                }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__["Shield"], {
                            className: "w-12 h-12 text-gray-500 mx-auto mb-3"
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/verification/VerificationList.tsx",
                            lineNumber: 54,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-gray-400",
                            children: "No pending verification requests at the moment"
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/verification/VerificationList.tsx",
                            lineNumber: 55,
                            columnNumber: 15
                        }, this)
                    ]
                }, void 0, true)
            }, void 0, false, {
                fileName: "[project]/src/components/admin/verification/VerificationList.tsx",
                lineNumber: 38,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/admin/verification/VerificationList.tsx",
            lineNumber: 37,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "max-w-7xl mx-auto px-4 md:px-6",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-y-4",
            children: users.map((user)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2f$verification$2f$VerificationCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    user: user,
                    onSelect: ()=>onSelectUser(user),
                    getTimeAgo: getTimeAgo
                }, user.username, false, {
                    fileName: "[project]/src/components/admin/verification/VerificationList.tsx",
                    lineNumber: 69,
                    columnNumber: 11
                }, this))
        }, void 0, false, {
            fileName: "[project]/src/components/admin/verification/VerificationList.tsx",
            lineNumber: 67,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/admin/verification/VerificationList.tsx",
        lineNumber: 66,
        columnNumber: 5
    }, this);
}
_c = VerificationList;
var _c;
__turbopack_context__.k.register(_c, "VerificationList");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/admin/verification/DocumentCard.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/components/admin/verification/DocumentCard.tsx
__turbopack_context__.s({
    "default": ()=>DocumentCard
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$external$2d$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ExternalLink$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/external-link.js [app-client] (ecmascript) <export default as ExternalLink>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ImageIcon$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/image.js [app-client] (ecmascript) <export default as ImageIcon>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.js [app-client] (ecmascript) <export default as Loader2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
function DocumentCard(param) {
    let { title, imageSrc, onViewFull } = param;
    _s();
    const [imageError, setImageError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [imageLoading, setImageLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    // Don't sanitize URLs that are from our backend
    const getSafeImageUrl = (url)=>{
        if (!url) return '';
        // If it's a data URL, return as is
        if (url.startsWith('data:image/')) {
            return url;
        }
        // If it's an absolute URL from our backend, return as is
        if (url.startsWith('http://localhost:5000') || url.startsWith('https://localhost:5000') || url.includes('/uploads/verification/')) {
            return url;
        }
        // For any other URL, sanitize it
        // But since we're dealing with backend URLs, just return the URL
        return url;
    };
    const safeSrc = getSafeImageUrl(imageSrc);
    const hasImage = !!safeSrc && !imageError;
    const handleImageLoad = ()=>{
        setImageLoading(false);
        setImageError(false);
    };
    const handleImageError = ()=>{
        console.error('[DocumentCard] Failed to load image:', safeSrc);
        setImageLoading(false);
        setImageError(true);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                className: "text-sm uppercase text-gray-400 font-medium tracking-wider",
                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(title)
            }, void 0, false, {
                fileName: "[project]/src/components/admin/verification/DocumentCard.tsx",
                lineNumber: 55,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative bg-[#1a1a1a] rounded-lg border border-gray-700 overflow-hidden aspect-[4/3]",
                children: safeSrc && !imageError ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        imageLoading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "absolute inset-0 flex items-center justify-center bg-[#1a1a1a] z-10",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                className: "w-6 h-6 animate-spin text-gray-500"
                            }, void 0, false, {
                                fileName: "[project]/src/components/admin/verification/DocumentCard.tsx",
                                lineNumber: 65,
                                columnNumber: 17
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/verification/DocumentCard.tsx",
                            lineNumber: 64,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                            src: safeSrc,
                            alt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(title),
                            className: "w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity",
                            onClick: onViewFull,
                            onLoad: handleImageLoad,
                            onError: handleImageError,
                            draggable: false,
                            style: {
                                display: imageError ? 'none' : 'block'
                            }
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/verification/DocumentCard.tsx",
                            lineNumber: 70,
                            columnNumber: 13
                        }, this),
                        !imageLoading && !imageError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "absolute inset-0 bg-black bg-opacity-30 hover:bg-opacity-0 transition flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer",
                            onClick: onViewFull,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$external$2d$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ExternalLink$3e$__["ExternalLink"], {
                                className: "w-6 h-6 text-white pointer-events-none"
                            }, void 0, false, {
                                fileName: "[project]/src/components/admin/verification/DocumentCard.tsx",
                                lineNumber: 87,
                                columnNumber: 17
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/verification/DocumentCard.tsx",
                            lineNumber: 83,
                            columnNumber: 15
                        }, this)
                    ]
                }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "absolute inset-0 flex flex-col items-center justify-center text-gray-500",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ImageIcon$3e$__["ImageIcon"], {
                            className: "w-8 h-8 mb-2"
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/verification/DocumentCard.tsx",
                            lineNumber: 93,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-xs text-center px-2",
                            children: imageError ? 'Failed to load image' : 'Not provided'
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/verification/DocumentCard.tsx",
                            lineNumber: 94,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/admin/verification/DocumentCard.tsx",
                    lineNumber: 92,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/admin/verification/DocumentCard.tsx",
                lineNumber: 59,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/admin/verification/DocumentCard.tsx",
        lineNumber: 54,
        columnNumber: 5
    }, this);
}
_s(DocumentCard, "yA6MC4/13YXgE42AlKw5vrWMK58=");
_c = DocumentCard;
var _c;
__turbopack_context__.k.register(_c, "DocumentCard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/admin/verification/ActionButtons.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/components/admin/verification/ActionButtons.tsx
__turbopack_context__.s({
    "default": ()=>ActionButtons
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-check-big.js [app-client] (ecmascript) <export default as CheckCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__XCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-x.js [app-client] (ecmascript) <export default as XCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/SecureInput.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
function ActionButtons(param) {
    let { showRejectInput, rejectReason, onApprove, onReject, onRejectInputShow, onRejectInputCancel, onRejectReasonChange } = param;
    _s();
    const [busy, setBusy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('none');
    const handleRejectReasonChange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ActionButtons.useCallback[handleRejectReasonChange]": (value)=>{
            onRejectReasonChange((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(value));
        }
    }["ActionButtons.useCallback[handleRejectReasonChange]"], [
        onRejectReasonChange
    ]);
    const handleApprove = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ActionButtons.useCallback[handleApprove]": async ()=>{
            if (busy !== 'none') return;
            setBusy('approve');
            try {
                await Promise.resolve(onApprove());
            } finally{
                setBusy('none');
            }
        }
    }["ActionButtons.useCallback[handleApprove]"], [
        onApprove,
        busy
    ]);
    const handleReject = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ActionButtons.useCallback[handleReject]": async ()=>{
            if (busy !== 'none') return;
            setBusy('reject');
            try {
                await Promise.resolve(onReject());
            } finally{
                setBusy('none');
            }
        }
    }["ActionButtons.useCallback[handleReject]"], [
        onReject,
        busy
    ]);
    if (!showRejectInput) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex gap-3",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    type: "button",
                    onClick: handleApprove,
                    disabled: busy !== 'none',
                    className: "flex-1 px-3 py-2 sm:py-2.5 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-green-900/30 disabled:opacity-60 disabled:cursor-not-allowed",
                    "aria-label": "Approve verification",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__["CheckCircle"], {
                            className: "w-4 h-4"
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/verification/ActionButtons.tsx",
                            lineNumber: 55,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: busy === 'approve' ? 'Approving…' : 'Approve'
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/verification/ActionButtons.tsx",
                            lineNumber: 56,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/admin/verification/ActionButtons.tsx",
                    lineNumber: 48,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    type: "button",
                    onClick: onRejectInputShow,
                    className: "flex-1 px-3 py-2 sm:py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-red-900/30",
                    "aria-label": "Reject verification and add reason",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__XCircle$3e$__["XCircle"], {
                            className: "w-4 h-4"
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/verification/ActionButtons.tsx",
                            lineNumber: 64,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Reject"
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/verification/ActionButtons.tsx",
                            lineNumber: 65,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/admin/verification/ActionButtons.tsx",
                    lineNumber: 58,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/admin/verification/ActionButtons.tsx",
            lineNumber: 47,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-3",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureTextarea"], {
                placeholder: "Provide a reason for rejection...",
                value: rejectReason,
                onChange: handleRejectReasonChange,
                rows: 2,
                maxLength: 500,
                characterCount: true,
                sanitize: true,
                sanitizer: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"],
                className: "w-full p-3 border border-[#2a2a2a] rounded-lg bg-[#121212] text-white resize-none focus:ring-2 focus:ring-[#ff950e] focus:border-transparent focus:outline-none transition-all text-sm",
                "aria-label": "Rejection reason"
            }, void 0, false, {
                fileName: "[project]/src/components/admin/verification/ActionButtons.tsx",
                lineNumber: 73,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "flex-1 bg-red-600 hover:bg-red-500 text-white font-medium px-3 py-2.5 rounded-lg transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center",
                        onClick: handleReject,
                        disabled: !rejectReason.trim() || busy !== 'none',
                        "aria-label": "Confirm rejection",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: busy === 'reject' ? 'Rejecting…' : 'Confirm Rejection'
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/verification/ActionButtons.tsx",
                            lineNumber: 93,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/admin/verification/ActionButtons.tsx",
                        lineNumber: 86,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "px-3 py-2.5 bg-[#1a1a1a] hover:bg-[#252525] text-white font-medium rounded-lg transition-colors border border-[#333]",
                        onClick: onRejectInputCancel,
                        "aria-label": "Cancel rejection",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Cancel"
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/verification/ActionButtons.tsx",
                            lineNumber: 101,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/admin/verification/ActionButtons.tsx",
                        lineNumber: 95,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/admin/verification/ActionButtons.tsx",
                lineNumber: 85,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/admin/verification/ActionButtons.tsx",
        lineNumber: 72,
        columnNumber: 5
    }, this);
}
_s(ActionButtons, "gWR/SKF2HiczptzrNd6RosTlgxs=");
_c = ActionButtons;
var _c;
__turbopack_context__.k.register(_c, "ActionButtons");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/admin/verification/ImageViewer.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/components/admin/verification/ImageViewer.tsx
__turbopack_context__.s({
    "default": ()=>ImageViewer
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/SecureMessageDisplay.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
function ImageViewer(param) {
    let { imageData, isLoading, onClose, onLoad } = param;
    _s();
    const closeBtnRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ImageViewer.useEffect": ()=>{
            if (!imageData) return;
            // Lock body scroll
            const prevOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            // ESC to close + initial focus
            const onKey = {
                "ImageViewer.useEffect.onKey": (e)=>{
                    if (e.key === 'Escape') onClose();
                }
            }["ImageViewer.useEffect.onKey"];
            document.addEventListener('keydown', onKey);
            const t = setTimeout({
                "ImageViewer.useEffect.t": ()=>{
                    var _closeBtnRef_current;
                    return (_closeBtnRef_current = closeBtnRef.current) === null || _closeBtnRef_current === void 0 ? void 0 : _closeBtnRef_current.focus();
                }
            }["ImageViewer.useEffect.t"], 0);
            return ({
                "ImageViewer.useEffect": ()=>{
                    document.removeEventListener('keydown', onKey);
                    clearTimeout(t);
                    document.body.style.overflow = prevOverflow;
                }
            })["ImageViewer.useEffect"];
        }
    }["ImageViewer.useEffect"], [
        imageData,
        onClose
    ]);
    if (!imageData) return null;
    const isDataUrl = imageData.url.startsWith('data:image/');
    const safeImageUrl = isDataUrl ? imageData.url : (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUrl"])(imageData.url);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 bg-black bg-opacity-95 z-[100]",
                onClick: onClose,
                role: "button",
                "aria-label": "Close image viewer"
            }, void 0, false, {
                fileName: "[project]/src/components/admin/verification/ImageViewer.tsx",
                lineNumber: 47,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 flex items-center justify-center z-[101] p-4",
                role: "dialog",
                "aria-modal": "true",
                "aria-label": "Verification image viewer",
                style: {
                    pointerEvents: 'none'
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative max-w-[90vw] max-h-[90vh]",
                    style: {
                        pointerEvents: 'auto'
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            ref: closeBtnRef,
                            onClick: (e)=>{
                                e.stopPropagation();
                                onClose();
                            },
                            className: "absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors p-2",
                            "aria-label": "Close",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                className: "w-8 h-8"
                            }, void 0, false, {
                                fileName: "[project]/src/components/admin/verification/ImageViewer.tsx",
                                lineNumber: 73,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/verification/ImageViewer.tsx",
                            lineNumber: 64,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "absolute -top-12 left-0 text-white",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-lg font-medium",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureMessageDisplay"], {
                                    content: imageData.type,
                                    allowBasicFormatting: false
                                }, void 0, false, {
                                    fileName: "[project]/src/components/admin/verification/ImageViewer.tsx",
                                    lineNumber: 79,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/admin/verification/ImageViewer.tsx",
                                lineNumber: 78,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/verification/ImageViewer.tsx",
                            lineNumber: 77,
                            columnNumber: 11
                        }, this),
                        isLoading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "absolute inset-0 flex items-center justify-center",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ff950e]",
                                "aria-label": "Loading"
                            }, void 0, false, {
                                fileName: "[project]/src/components/admin/verification/ImageViewer.tsx",
                                lineNumber: 89,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/verification/ImageViewer.tsx",
                            lineNumber: 88,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                            src: safeImageUrl,
                            alt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(imageData.type),
                            className: "max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl",
                            onClick: (e)=>e.stopPropagation(),
                            onLoad: ()=>{
                                if (onLoad) onLoad();
                            },
                            onError: (e)=>{
                                const target = e.target;
                                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23333"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="sans-serif" font-size="20"%3EImage failed to load%3C/text%3E%3C/svg%3E';
                            },
                            style: {
                                opacity: isLoading ? 0.2 : 1,
                                transition: 'opacity 0.3s',
                                display: 'block'
                            },
                            draggable: false
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/verification/ImageViewer.tsx",
                            lineNumber: 94,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/admin/verification/ImageViewer.tsx",
                    lineNumber: 62,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/admin/verification/ImageViewer.tsx",
                lineNumber: 55,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
_s(ImageViewer, "GcmP09zRBwnUxO9vSkqphuwbLd0=");
_c = ImageViewer;
var _c;
__turbopack_context__.k.register(_c, "ImageViewer");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/admin/verification/ReviewModal.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/components/admin/verification/ReviewModal.tsx
__turbopack_context__.s({
    "default": ()=>ReviewModal
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-left.js [app-client] (ecmascript) <export default as ArrowLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2f$verification$2f$DocumentCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/admin/verification/DocumentCard.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2f$verification$2f$ActionButtons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/admin/verification/ActionButtons.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2f$verification$2f$ImageViewer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/admin/verification/ImageViewer.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/SecureMessageDisplay.tsx [app-client] (ecmascript)");
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
function ReviewModal(param) {
    let { user, onClose, onApprove, onReject, getTimeAgo } = param;
    var _user_verificationDocs, _user_verificationDocs1, _user_verificationDocs2, _user_verificationDocs3, _user_verificationDocs4;
    _s();
    const [showRejectInput, setShowRejectInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [rejectReason, setRejectReason] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [currentImageView, setCurrentImageView] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const modalRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [busy, setBusy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('none');
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ReviewModal.useEffect": ()=>{
            // Reset inputs when user changes/clears
            if (!user) {
                setShowRejectInput(false);
                setRejectReason('');
            }
        }
    }["ReviewModal.useEffect"], [
        user
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ReviewModal.useEffect": ()=>{
            if (!user) return;
            // Lock scroll & ESC handling
            const prevOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            const onKey = {
                "ReviewModal.useEffect.onKey": (e)=>{
                    if (e.key === 'Escape') handleClose();
                }
            }["ReviewModal.useEffect.onKey"];
            document.addEventListener('keydown', onKey);
            return ({
                "ReviewModal.useEffect": ()=>{
                    document.removeEventListener('keydown', onKey);
                    document.body.style.overflow = prevOverflow;
                }
            })["ReviewModal.useEffect"];
        }
    }["ReviewModal.useEffect"], [
        user
    ]); // eslint-disable-line
    if (!user) return null;
    const openFullImage = (type, url)=>setCurrentImageView({
            type,
            url
        });
    const handleApprove = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ReviewModal.useCallback[handleApprove]": async ()=>{
            if (busy !== 'none') return;
            setBusy('approve');
            try {
                await Promise.resolve(onApprove(user.username));
            } finally{
                setBusy('none');
            }
        }
    }["ReviewModal.useCallback[handleApprove]"], [
        onApprove,
        user === null || user === void 0 ? void 0 : user.username,
        busy
    ]);
    const handleReject = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ReviewModal.useCallback[handleReject]": async ()=>{
            if (busy !== 'none') return;
            setBusy('reject');
            try {
                const sanitizedReason = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(rejectReason);
                await Promise.resolve(onReject(user.username, sanitizedReason));
            } finally{
                setBusy('none');
            }
        }
    }["ReviewModal.useCallback[handleReject]"], [
        onReject,
        user === null || user === void 0 ? void 0 : user.username,
        rejectReason,
        busy
    ]);
    const handleClose = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ReviewModal.useCallback[handleClose]": ()=>{
            setShowRejectInput(false);
            setRejectReason('');
            onClose();
        }
    }["ReviewModal.useCallback[handleClose]"], [
        onClose
    ]);
    const handleRejectReasonChange = (value)=>{
        setRejectReason((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(value));
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 bg-black bg-opacity-60 z-40",
                onClick: handleClose,
                role: "button",
                "aria-label": "Close review modal"
            }, void 0, false, {
                fileName: "[project]/src/components/admin/verification/ReviewModal.tsx",
                lineNumber: 87,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    ref: modalRef,
                    className: "bg-[#121212] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-[#222] flex flex-col",
                    onClick: (e)=>e.stopPropagation(),
                    role: "dialog",
                    "aria-modal": "true",
                    "aria-label": "Verification review",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-gradient-to-r from-[#1a1a1a] to-[#222] p-4 sm:p-6 rounded-t-2xl sticky top-0 z-10",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: handleClose,
                                    className: "absolute left-4 top-4 text-gray-400 hover:text-white transition-colors",
                                    "aria-label": "Back",
                                    title: "Back",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__["ArrowLeft"], {
                                        className: "w-6 h-6"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/verification/ReviewModal.tsx",
                                        lineNumber: 113,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/admin/verification/ReviewModal.tsx",
                                    lineNumber: 106,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-center",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "text-2xl font-bold text-white",
                                            children: [
                                                "Review:",
                                                ' ',
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureMessageDisplay"], {
                                                    content: user.username,
                                                    allowBasicFormatting: false,
                                                    className: "inline"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/admin/verification/ReviewModal.tsx",
                                                    lineNumber: 119,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/admin/verification/ReviewModal.tsx",
                                            lineNumber: 117,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-sm text-gray-400 mt-1",
                                            children: [
                                                "Requested ",
                                                getTimeAgo(user.verificationRequestedAt)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/admin/verification/ReviewModal.tsx",
                                            lineNumber: 125,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/admin/verification/ReviewModal.tsx",
                                    lineNumber: 116,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/admin/verification/ReviewModal.tsx",
                            lineNumber: 105,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "p-4 sm:p-6 flex-grow",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mb-6",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: "text-sm uppercase text-gray-400 font-medium mb-2 tracking-wider",
                                            children: "Verification Code"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/admin/verification/ReviewModal.tsx",
                                            lineNumber: 135,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "inline-block px-4 py-2 bg-[#ff950e] text-black font-mono text-lg border border-[#ff950e] rounded-lg font-bold",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureMessageDisplay"], {
                                                content: ((_user_verificationDocs = user.verificationDocs) === null || _user_verificationDocs === void 0 ? void 0 : _user_verificationDocs.code) || 'No code provided',
                                                allowBasicFormatting: false,
                                                className: "inline"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/admin/verification/ReviewModal.tsx",
                                                lineNumber: 139,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/admin/verification/ReviewModal.tsx",
                                            lineNumber: 138,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/admin/verification/ReviewModal.tsx",
                                    lineNumber: 134,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2f$verification$2f$DocumentCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            title: "Photo with Code",
                                            imageSrc: (_user_verificationDocs1 = user.verificationDocs) === null || _user_verificationDocs1 === void 0 ? void 0 : _user_verificationDocs1.codePhoto,
                                            onViewFull: ()=>{
                                                var _user_verificationDocs;
                                                return ((_user_verificationDocs = user.verificationDocs) === null || _user_verificationDocs === void 0 ? void 0 : _user_verificationDocs.codePhoto) && openFullImage('Photo with Verification Code', user.verificationDocs.codePhoto);
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/admin/verification/ReviewModal.tsx",
                                            lineNumber: 149,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2f$verification$2f$DocumentCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            title: "ID Front",
                                            imageSrc: (_user_verificationDocs2 = user.verificationDocs) === null || _user_verificationDocs2 === void 0 ? void 0 : _user_verificationDocs2.idFront,
                                            onViewFull: ()=>{
                                                var _user_verificationDocs;
                                                return ((_user_verificationDocs = user.verificationDocs) === null || _user_verificationDocs === void 0 ? void 0 : _user_verificationDocs.idFront) && openFullImage('ID Front', user.verificationDocs.idFront);
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/admin/verification/ReviewModal.tsx",
                                            lineNumber: 158,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2f$verification$2f$DocumentCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            title: "ID Back",
                                            imageSrc: (_user_verificationDocs3 = user.verificationDocs) === null || _user_verificationDocs3 === void 0 ? void 0 : _user_verificationDocs3.idBack,
                                            onViewFull: ()=>{
                                                var _user_verificationDocs;
                                                return ((_user_verificationDocs = user.verificationDocs) === null || _user_verificationDocs === void 0 ? void 0 : _user_verificationDocs.idBack) && openFullImage('ID Back', user.verificationDocs.idBack);
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/admin/verification/ReviewModal.tsx",
                                            lineNumber: 166,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2f$verification$2f$DocumentCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            title: "Passport",
                                            imageSrc: (_user_verificationDocs4 = user.verificationDocs) === null || _user_verificationDocs4 === void 0 ? void 0 : _user_verificationDocs4.passport,
                                            onViewFull: ()=>{
                                                var _user_verificationDocs;
                                                return ((_user_verificationDocs = user.verificationDocs) === null || _user_verificationDocs === void 0 ? void 0 : _user_verificationDocs.passport) && openFullImage('Passport', user.verificationDocs.passport);
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/admin/verification/ReviewModal.tsx",
                                            lineNumber: 174,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/admin/verification/ReviewModal.tsx",
                                    lineNumber: 148,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/admin/verification/ReviewModal.tsx",
                            lineNumber: 132,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-[#080808] border-t border-[#1a1a1a] p-3 sm:p-4 mt-auto sticky bottom-0",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2f$verification$2f$ActionButtons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                showRejectInput: showRejectInput,
                                rejectReason: rejectReason,
                                onApprove: handleApprove,
                                onReject: handleReject,
                                onRejectInputShow: ()=>setShowRejectInput(true),
                                onRejectInputCancel: ()=>{
                                    setShowRejectInput(false);
                                    setRejectReason('');
                                },
                                onRejectReasonChange: handleRejectReasonChange
                            }, void 0, false, {
                                fileName: "[project]/src/components/admin/verification/ReviewModal.tsx",
                                lineNumber: 186,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/verification/ReviewModal.tsx",
                            lineNumber: 185,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/admin/verification/ReviewModal.tsx",
                    lineNumber: 96,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/admin/verification/ReviewModal.tsx",
                lineNumber: 95,
                columnNumber: 7
            }, this),
            currentImageView && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2f$verification$2f$ImageViewer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                imageData: currentImageView,
                isLoading: false,
                onClose: ()=>setCurrentImageView(null),
                onLoad: ()=>{}
            }, void 0, false, {
                fileName: "[project]/src/components/admin/verification/ReviewModal.tsx",
                lineNumber: 204,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true);
}
_s(ReviewModal, "3/KgQj6B2QvL4zpPAGn7f4/j7rY=");
_c = ReviewModal;
var _c;
__turbopack_context__.k.register(_c, "ReviewModal");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/services/verification.service.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/services/verification.service.ts
__turbopack_context__.s({
    "verificationService": ()=>verificationService
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/storage.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
;
;
;
class VerificationService {
    /**
   * Get auth token from sessionStorage (where AuthContext stores it)
   */ getAuthToken() {
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        try {
            const stored = sessionStorage.getItem('auth_tokens');
            if (stored) {
                const tokens = JSON.parse(stored);
                return (tokens === null || tokens === void 0 ? void 0 : tokens.token) || null;
            }
        } catch (error) {
            console.error('Failed to get auth token:', error);
        }
        return null;
    }
    /**
   * Make authenticated API call
   */ async apiCall(url) {
        let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const token = this.getAuthToken();
        const headers = {
            ...options.headers
        };
        if (token) {
            headers['Authorization'] = "Bearer ".concat(token);
        }
        try {
            const response = await fetch(url, {
                ...options,
                headers
            });
            const data = await response.json();
            if (!response.ok) {
                return {
                    success: false,
                    error: data.error || {
                        message: 'Request failed'
                    }
                };
            }
            return {
                success: true,
                data: data.data || data
            };
        } catch (error) {
            console.error('API call error:', error);
            return {
                success: false,
                error: {
                    message: 'Network error'
                }
            };
        }
    }
    /**
   * Submit verification request
   */ async submitVerification(data) {
        try {
            console.log('[VerificationService] Submitting verification...');
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_USERS) {
                const formData = new FormData();
                formData.append('code', (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(data.code));
                // Handle files - either File objects or base64 strings
                if (data.codePhoto) {
                    if (data.codePhoto instanceof File) {
                        formData.append('codePhoto', data.codePhoto);
                    } else {
                        // Convert base64 to file
                        const file = this.base64ToFile(data.codePhoto, 'codePhoto.jpg');
                        formData.append('codePhoto', file);
                    }
                }
                if (data.idFront) {
                    if (data.idFront instanceof File) {
                        formData.append('idFront', data.idFront);
                    } else {
                        const file = this.base64ToFile(data.idFront, 'idFront.jpg');
                        formData.append('idFront', file);
                    }
                }
                if (data.idBack) {
                    if (data.idBack instanceof File) {
                        formData.append('idBack', data.idBack);
                    } else {
                        const file = this.base64ToFile(data.idBack, 'idBack.jpg');
                        formData.append('idBack', file);
                    }
                }
                if (data.passport) {
                    if (data.passport instanceof File) {
                        formData.append('passport', data.passport);
                    } else {
                        const file = this.base64ToFile(data.passport, 'passport.jpg');
                        formData.append('passport', file);
                    }
                }
                const token = this.getAuthToken();
                console.log('[VerificationService] Auth token present:', !!token);
                if (!token) {
                    console.error('[VerificationService] No auth token found');
                    return {
                        success: false,
                        error: {
                            message: 'Not authenticated. Please log in again.'
                        }
                    };
                }
                const url = "".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_BASE_URL"], "/api/verification/submit");
                console.log('[VerificationService] Submitting to:', url);
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': "Bearer ".concat(token)
                    },
                    body: formData
                });
                console.log('[VerificationService] Response status:', response.status);
                const result = await response.json();
                console.log('[VerificationService] Response data:', result);
                if (!response.ok) {
                    console.error('[VerificationService] Submit error:', result);
                    return {
                        success: false,
                        error: result.error || {
                            message: 'Failed to submit verification'
                        }
                    };
                }
                return {
                    success: true,
                    data: result.data
                };
            }
            // LocalStorage fallback
            const username = sessionStorage.getItem('username') || localStorage.getItem('username');
            if (!username) {
                return {
                    success: false,
                    error: {
                        message: 'User not authenticated'
                    }
                };
            }
            // Store verification request locally
            const requests = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_verification_requests', {});
            requests[username] = {
                code: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(data.code),
                codePhoto: data.codePhoto,
                idFront: data.idFront,
                idBack: data.idBack,
                passport: data.passport,
                submittedAt: new Date().toISOString(),
                status: 'pending'
            };
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_verification_requests', requests);
            // Update user status
            const users = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('all_users_v2', {});
            if (users[username]) {
                users[username].verificationStatus = 'pending';
                users[username].verificationRequestedAt = new Date().toISOString();
                users[username].verificationDocs = {
                    code: data.code,
                    codePhoto: data.codePhoto,
                    idFront: data.idFront,
                    idBack: data.idBack,
                    passport: data.passport
                };
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('all_users_v2', users);
            }
            return {
                success: true,
                data: {
                    status: 'pending'
                }
            };
        } catch (error) {
            console.error('[VerificationService] Submit verification error:', error);
            return {
                success: false,
                error: {
                    message: error instanceof Error ? error.message : 'Failed to submit verification'
                }
            };
        }
    }
    /**
   * Get verification status
   */ async getVerificationStatus() {
        try {
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_USERS) {
                const token = this.getAuthToken();
                if (!token) {
                    return {
                        success: false,
                        error: {
                            message: 'Not authenticated'
                        }
                    };
                }
                const response = await fetch("".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_BASE_URL"], "/api/verification/status"), {
                    headers: {
                        'Authorization': "Bearer ".concat(token)
                    }
                });
                const data = await response.json();
                if (!response.ok) {
                    return {
                        success: false,
                        error: data.error || {
                            message: 'Failed to get verification status'
                        }
                    };
                }
                return {
                    success: true,
                    data: data.data
                };
            }
            // LocalStorage fallback
            const username = sessionStorage.getItem('username') || localStorage.getItem('username');
            if (!username) {
                return {
                    success: false,
                    error: {
                        message: 'User not authenticated'
                    }
                };
            }
            const users = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('all_users_v2', {});
            const user = users[username];
            if (!user) {
                return {
                    success: true,
                    data: {
                        status: 'unverified'
                    }
                };
            }
            return {
                success: true,
                data: {
                    status: user.verificationStatus || 'unverified',
                    submittedAt: user.verificationRequestedAt,
                    rejectionReason: user.verificationRejectionReason
                }
            };
        } catch (error) {
            console.error('Get verification status error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to get verification status'
                }
            };
        }
    }
    /**
   * Get pending verifications (admin only)
   */ async getPendingVerifications(params) {
        try {
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_USERS) {
                const queryParams = new URLSearchParams();
                if (params === null || params === void 0 ? void 0 : params.page) queryParams.append('page', params.page.toString());
                if (params === null || params === void 0 ? void 0 : params.limit) queryParams.append('limit', params.limit.toString());
                if (params === null || params === void 0 ? void 0 : params.sort) queryParams.append('sort', params.sort);
                const token = this.getAuthToken();
                if (!token) {
                    return {
                        success: false,
                        error: {
                            message: 'Not authenticated'
                        }
                    };
                }
                const response = await fetch("".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_BASE_URL"], "/api/verification/pending?").concat(queryParams.toString()), {
                    headers: {
                        'Authorization': "Bearer ".concat(token)
                    }
                });
                const result = await response.json();
                console.log('[VerificationService] Get pending response:', result);
                if (!response.ok) {
                    return {
                        success: false,
                        error: result.error || {
                            message: 'Failed to get pending verifications'
                        }
                    };
                }
                // Ensure consistent response structure
                if (result.success && result.data) {
                    return {
                        success: true,
                        data: {
                            data: Array.isArray(result.data) ? result.data : [],
                            meta: result.meta || {
                                page: (params === null || params === void 0 ? void 0 : params.page) || 1,
                                pageSize: (params === null || params === void 0 ? void 0 : params.limit) || 20,
                                total: Array.isArray(result.data) ? result.data.length : 0,
                                totalPages: 1
                            }
                        }
                    };
                }
                // Handle direct array response
                if (Array.isArray(result)) {
                    return {
                        success: true,
                        data: {
                            data: result,
                            meta: {
                                page: (params === null || params === void 0 ? void 0 : params.page) || 1,
                                pageSize: (params === null || params === void 0 ? void 0 : params.limit) || 20,
                                total: result.length,
                                totalPages: 1
                            }
                        }
                    };
                }
                return {
                    success: true,
                    data: {
                        data: [],
                        meta: {
                            page: 1,
                            pageSize: 20,
                            total: 0,
                            totalPages: 0
                        }
                    }
                };
            }
            // LocalStorage fallback
            const requests = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_verification_requests', {});
            const pending = Object.entries(requests).filter((param)=>{
                let [_, req] = param;
                return req.status === 'pending';
            }).map((param)=>{
                let [username, req] = param;
                return {
                    _id: "local_".concat(username),
                    userId: {
                        username,
                        email: '',
                        role: 'seller'
                    },
                    status: 'pending',
                    documents: {
                        codePhoto: req.codePhoto ? {
                            url: req.codePhoto,
                            uploadedAt: req.submittedAt
                        } : undefined,
                        idFront: req.idFront ? {
                            url: req.idFront,
                            uploadedAt: req.submittedAt
                        } : undefined,
                        idBack: req.idBack ? {
                            url: req.idBack,
                            uploadedAt: req.submittedAt
                        } : undefined,
                        passport: req.passport ? {
                            url: req.passport,
                            uploadedAt: req.submittedAt
                        } : undefined
                    },
                    verificationCode: req.code,
                    submittedAt: req.submittedAt
                };
            });
            // Sort
            if ((params === null || params === void 0 ? void 0 : params.sort) === 'newest') {
                pending.sort((a, b)=>new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
            } else {
                pending.sort((a, b)=>new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
            }
            // Paginate
            const page = (params === null || params === void 0 ? void 0 : params.page) || 1;
            const limit = (params === null || params === void 0 ? void 0 : params.limit) || 20;
            const start = (page - 1) * limit;
            const paginatedData = pending.slice(start, start + limit);
            return {
                success: true,
                data: {
                    data: paginatedData,
                    meta: {
                        page,
                        pageSize: limit,
                        total: pending.length,
                        totalPages: Math.ceil(pending.length / limit)
                    }
                }
            };
        } catch (error) {
            console.error('Get pending verifications error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to get pending verifications'
                }
            };
        }
    }
    /**
   * Review verification (admin only)
   */ async reviewVerification(verificationId, action, rejectionReason) {
        try {
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_USERS) {
                return await this.apiCall("".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_BASE_URL"], "/api/verification/").concat(verificationId, "/review"), {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action,
                        rejectionReason: rejectionReason ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(rejectionReason) : undefined
                    })
                });
            }
            // LocalStorage fallback
            if (verificationId.startsWith('local_')) {
                var _requests_username;
                const username = verificationId.replace('local_', '');
                // Update verification request
                const requests = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_verification_requests', {});
                if (requests[username]) {
                    requests[username].status = action === 'approve' ? 'approved' : 'rejected';
                    requests[username].reviewedAt = new Date().toISOString();
                    if (action === 'reject' && rejectionReason) {
                        requests[username].rejectionReason = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(rejectionReason);
                    }
                    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_verification_requests', requests);
                }
                // Update user
                const users = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('all_users_v2', {});
                if (users[username]) {
                    if (action === 'approve') {
                        users[username].isVerified = true;
                        users[username].verificationStatus = 'verified';
                    } else {
                        users[username].verificationStatus = 'rejected';
                        users[username].verificationRejectionReason = rejectionReason;
                    }
                    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('all_users_v2', users);
                }
                // Add to resolved verifications
                const resolved = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_resolved_verifications', []);
                resolved.push({
                    id: verificationId,
                    username,
                    requestDate: ((_requests_username = requests[username]) === null || _requests_username === void 0 ? void 0 : _requests_username.submittedAt) || new Date().toISOString(),
                    resolvedDate: new Date().toISOString(),
                    resolvedBy: sessionStorage.getItem('username') || localStorage.getItem('username') || 'admin',
                    status: action === 'approve' ? 'approved' : 'rejected',
                    rejectionReason
                });
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_resolved_verifications', resolved);
                return {
                    success: true,
                    data: {
                        status: action
                    }
                };
            }
            return {
                success: false,
                error: {
                    message: 'Invalid verification ID'
                }
            };
        } catch (error) {
            console.error('Review verification error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to review verification'
                }
            };
        }
    }
    /**
   * Get verification statistics (admin only)
   */ async getVerificationStats() {
        try {
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_USERS) {
                return await this.apiCall("".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_BASE_URL"], "/api/verification/stats"));
            }
            // LocalStorage fallback
            const requests = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_verification_requests', {});
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const pending = Object.values(requests).filter((req)=>req.status === 'pending');
            const todayCount = pending.filter((req)=>new Date(req.submittedAt) >= today).length;
            const weekCount = pending.filter((req)=>new Date(req.submittedAt) >= weekAgo).length;
            // Calculate average processing time from resolved
            const resolved = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_resolved_verifications', []);
            let avgTime = 0;
            if (resolved.length > 0) {
                const times = resolved.filter((r)=>r.requestDate && r.resolvedDate).map((r)=>{
                    const start = new Date(r.requestDate).getTime();
                    const end = new Date(r.resolvedDate).getTime();
                    return (end - start) / (1000 * 60 * 60); // hours
                });
                if (times.length > 0) {
                    avgTime = times.reduce((a, b)=>a + b, 0) / times.length;
                }
            }
            return {
                success: true,
                data: {
                    total: pending.length,
                    today: todayCount,
                    thisWeek: weekCount,
                    averageProcessingTime: avgTime
                }
            };
        } catch (error) {
            console.error('Get verification stats error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to get verification statistics'
                }
            };
        }
    }
    /**
   * Helper: Convert base64 to File
   */ base64ToFile(base64, filename) {
        var _arr__match;
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
    }
}
const verificationService = new VerificationService();
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/app/admin/verification-requests/page.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/app/admin/verification-requests/page.tsx
__turbopack_context__.s({
    "default": ()=>AdminVerificationRequestsPage
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/AuthContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$RequireAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/RequireAuth.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2f$verification$2f$VerificationHeader$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/admin/verification/VerificationHeader.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2f$verification$2f$VerificationSearch$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/admin/verification/VerificationSearch.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2f$verification$2f$VerificationStats$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/admin/verification/VerificationStats.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2f$verification$2f$VerificationList$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/admin/verification/VerificationList.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2f$verification$2f$ReviewModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/admin/verification/ReviewModal.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2f$verification$2f$ImageViewer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/admin/verification/ImageViewer.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$verification$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/verification.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shield.js [app-client] (ecmascript) <export default as Shield>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-alert.js [app-client] (ecmascript) <export default as AlertCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.js [app-client] (ecmascript) <export default as Loader2>");
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
;
// Get backend URL from environment
const BACKEND_URL = ("TURBOPACK compile-time value", "http://localhost:5000") || 'http://localhost:5000';
// Helper to convert relative URL to absolute backend URL
const toAbsoluteUrl = (url)=>{
    if (!url) return undefined;
    // If it's already an absolute URL or data URL, return as is
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
        return url;
    }
    // If it starts with /, remove it to avoid double slashes
    const path = url.startsWith('/') ? url : "/".concat(url);
    return "".concat(BACKEND_URL).concat(path);
};
// Convert PendingVerification to VerificationUser format for components
const convertToVerificationUser = (pv)=>{
    var _pv_userId, _pv_documents_codePhoto, _pv_documents, _pv_documents_idFront, _pv_documents1, _pv_documents_idBack, _pv_documents2, _pv_documents_passport, _pv_documents3;
    return {
        username: ((_pv_userId = pv.userId) === null || _pv_userId === void 0 ? void 0 : _pv_userId.username) || 'Unknown',
        verificationStatus: 'pending',
        verificationRequestedAt: pv.submittedAt,
        verificationDocs: {
            code: pv.verificationCode,
            codePhoto: toAbsoluteUrl((_pv_documents = pv.documents) === null || _pv_documents === void 0 ? void 0 : (_pv_documents_codePhoto = _pv_documents.codePhoto) === null || _pv_documents_codePhoto === void 0 ? void 0 : _pv_documents_codePhoto.url),
            idFront: toAbsoluteUrl((_pv_documents1 = pv.documents) === null || _pv_documents1 === void 0 ? void 0 : (_pv_documents_idFront = _pv_documents1.idFront) === null || _pv_documents_idFront === void 0 ? void 0 : _pv_documents_idFront.url),
            idBack: toAbsoluteUrl((_pv_documents2 = pv.documents) === null || _pv_documents2 === void 0 ? void 0 : (_pv_documents_idBack = _pv_documents2.idBack) === null || _pv_documents_idBack === void 0 ? void 0 : _pv_documents_idBack.url),
            passport: toAbsoluteUrl((_pv_documents3 = pv.documents) === null || _pv_documents3 === void 0 ? void 0 : (_pv_documents_passport = _pv_documents3.passport) === null || _pv_documents_passport === void 0 ? void 0 : _pv_documents_passport.url)
        }
    };
};
function AdminVerificationRequestsPage() {
    _s();
    const { user, isAuthReady } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    // State
    const [pending, setPending] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [pendingMap, setPendingMap] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(new Map()); // username -> verification ID
    const [selected, setSelected] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [searchTerm, setSearchTerm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [sortBy, setSortBy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('oldest');
    const [stats, setStats] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        total: 0,
        today: 0,
        thisWeek: 0,
        averageProcessingTime: 0
    });
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [imageViewer, setImageViewer] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [imageLoading, setImageLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isProcessing, setIsProcessing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Load verifications and stats
    const loadData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AdminVerificationRequestsPage.useCallback[loadData]": async ()=>{
            try {
                setLoading(true);
                setError(null);
                // Load pending verifications
                const verResult = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$verification$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["verificationService"].getPendingVerifications({
                    sort: sortBy === 'alphabetical' ? 'oldest' : sortBy,
                    limit: 100 // Get more for client-side filtering
                });
                console.log('[Admin] Verification result:', verResult);
                if (verResult.success && verResult.data) {
                    const idMap = new Map();
                    // Handle different response structures
                    let verifications = [];
                    // Check if data.data exists (paginated response)
                    if (Array.isArray(verResult.data.data)) {
                        verifications = verResult.data.data;
                    } else if (Array.isArray(verResult.data)) {
                        verifications = verResult.data;
                    } else {
                        console.warn('[Admin] Unexpected verification data structure:', verResult.data);
                        verifications = [];
                    }
                    const converted = verifications.map({
                        "AdminVerificationRequestsPage.useCallback[loadData].converted": (pv)=>{
                            const user = convertToVerificationUser(pv);
                            // Store the verification ID mapping
                            idMap.set(user.username, pv._id);
                            return user;
                        }
                    }["AdminVerificationRequestsPage.useCallback[loadData].converted"]);
                    // Apply alphabetical sort if needed
                    if (sortBy === 'alphabetical') {
                        converted.sort({
                            "AdminVerificationRequestsPage.useCallback[loadData]": (a, b)=>a.username.localeCompare(b.username)
                        }["AdminVerificationRequestsPage.useCallback[loadData]"]);
                    }
                    setPending(converted);
                    setPendingMap(idMap);
                } else {
                    var _verResult_error;
                    console.error('[Admin] Failed to load verifications:', verResult.error);
                    // Don't set error for empty results
                    if (((_verResult_error = verResult.error) === null || _verResult_error === void 0 ? void 0 : _verResult_error.message) && verResult.error.message !== 'No pending verifications') {
                        setError(verResult.error.message);
                    }
                }
                // Load stats
                const statsResult = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$verification$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["verificationService"].getVerificationStats();
                if (statsResult.success && statsResult.data) {
                    setStats(statsResult.data);
                }
            } catch (err) {
                console.error('Error loading verification data:', err);
                setError('Failed to load verification data');
            } finally{
                setLoading(false);
            }
        }
    }["AdminVerificationRequestsPage.useCallback[loadData]"], [
        sortBy
    ]);
    // Initial load and auth check
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AdminVerificationRequestsPage.useEffect": ()=>{
            if (!isAuthReady) return;
            if (!user) {
                router.push('/login');
                return;
            }
            if (user.role !== 'admin') {
                router.push('/');
                return;
            }
            loadData();
        }
    }["AdminVerificationRequestsPage.useEffect"], [
        isAuthReady,
        user,
        router,
        loadData
    ]);
    // Handle search
    const handleSearchTermChange = (term)=>{
        const sanitized = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(term);
        setSearchTerm(sanitized);
    };
    // Filter users based on search
    const filteredUsers = pending.filter((u)=>u.username.toLowerCase().includes(searchTerm.toLowerCase()));
    // Calculate filtered stats
    const filteredStats = {
        ...stats,
        total: filteredUsers.length
    };
    // Time ago helper
    const getTimeAgo = (timestamp)=>{
        if (!timestamp) return 'Unknown';
        const date = new Date(timestamp);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return "".concat(Math.floor(seconds / 60), "m ago");
        if (seconds < 86400) return "".concat(Math.floor(seconds / 3600), "h ago");
        if (seconds < 604800) return "".concat(Math.floor(seconds / 86400), "d ago");
        return "".concat(Math.floor(seconds / 604800), "w ago");
    };
    // Handle approval
    const handleApprove = async (username)=>{
        if (isProcessing) return;
        try {
            setIsProcessing(true);
            console.log('[Admin] Approving verification for:', username);
            // Find the verification ID from our map
            const verificationId = pendingMap.get(username);
            if (!verificationId) {
                throw new Error('Verification ID not found');
            }
            // Call backend API
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$verification$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["verificationService"].reviewVerification(verificationId, 'approve');
            if (result.success) {
                console.log('[Admin] Verification approved successfully');
                // Remove from pending list
                setPending((prev)=>prev.filter((p)=>p.username !== username));
                setSelected(null);
                // Reload data to refresh stats
                loadData();
            } else {
                var _result_error;
                throw new Error(((_result_error = result.error) === null || _result_error === void 0 ? void 0 : _result_error.message) || 'Failed to approve verification');
            }
        } catch (err) {
            console.error('[Admin] Error approving verification:', err);
            alert("Error: ".concat(err instanceof Error ? err.message : 'Failed to approve verification'));
        } finally{
            setIsProcessing(false);
        }
    };
    // Handle rejection
    const handleReject = async (username, reason)=>{
        if (isProcessing) return;
        try {
            setIsProcessing(true);
            console.log('[Admin] Rejecting verification for:', username);
            // Find the verification ID from our map
            const verificationId = pendingMap.get(username);
            if (!verificationId) {
                throw new Error('Verification ID not found');
            }
            // Call backend API
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$verification$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["verificationService"].reviewVerification(verificationId, 'reject', reason);
            if (result.success) {
                console.log('[Admin] Verification rejected successfully');
                // Remove from pending list
                setPending((prev)=>prev.filter((p)=>p.username !== username));
                setSelected(null);
                // Reload data to refresh stats
                loadData();
            } else {
                var _result_error;
                throw new Error(((_result_error = result.error) === null || _result_error === void 0 ? void 0 : _result_error.message) || 'Failed to reject verification');
            }
        } catch (err) {
            console.error('[Admin] Error rejecting verification:', err);
            alert("Error: ".concat(err instanceof Error ? err.message : 'Failed to reject verification'));
        } finally{
            setIsProcessing(false);
        }
    };
    // Refresh data
    const refreshData = ()=>{
        loadData();
    };
    // Handle image viewer
    const handleImageView = (imageData)=>{
        setImageViewer(imageData);
        setImageLoading(true);
    };
    const handleImageLoad = ()=>{
        setImageLoading(false);
    };
    const handleImageClose = ()=>{
        setImageViewer(null);
        setImageLoading(false);
    };
    // Loading state
    if (!isAuthReady || loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-gradient-to-b from-black to-[#0a0a0a] text-white flex items-center justify-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                        className: "w-8 h-8 animate-spin mx-auto mb-4 text-[#ff950e]"
                    }, void 0, false, {
                        fileName: "[project]/src/app/admin/verification-requests/page.tsx",
                        lineNumber: 300,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-gray-400",
                        children: "Loading verification requests..."
                    }, void 0, false, {
                        fileName: "[project]/src/app/admin/verification-requests/page.tsx",
                        lineNumber: 301,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/admin/verification-requests/page.tsx",
                lineNumber: 299,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/admin/verification-requests/page.tsx",
            lineNumber: 298,
            columnNumber: 7
        }, this);
    }
    // Error state
    if (error) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-gradient-to-b from-black to-[#0a0a0a] text-white flex items-center justify-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center max-w-md",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                        className: "w-12 h-12 text-red-500 mx-auto mb-4"
                    }, void 0, false, {
                        fileName: "[project]/src/app/admin/verification-requests/page.tsx",
                        lineNumber: 312,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-xl font-bold mb-2",
                        children: "Error Loading Verifications"
                    }, void 0, false, {
                        fileName: "[project]/src/app/admin/verification-requests/page.tsx",
                        lineNumber: 313,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-gray-400 mb-4",
                        children: error
                    }, void 0, false, {
                        fileName: "[project]/src/app/admin/verification-requests/page.tsx",
                        lineNumber: 314,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: refreshData,
                        className: "px-4 py-2 bg-[#ff950e] text-black font-bold rounded-lg hover:bg-[#e88800] transition",
                        children: "Retry"
                    }, void 0, false, {
                        fileName: "[project]/src/app/admin/verification-requests/page.tsx",
                        lineNumber: 315,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/admin/verification-requests/page.tsx",
                lineNumber: 311,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/admin/verification-requests/page.tsx",
            lineNumber: 310,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$RequireAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
        role: "admin",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-gradient-to-b from-black to-[#0a0a0a] text-white",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2f$verification$2f$VerificationHeader$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    onRefresh: refreshData
                }, void 0, false, {
                    fileName: "[project]/src/app/admin/verification-requests/page.tsx",
                    lineNumber: 329,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2f$verification$2f$VerificationSearch$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    searchTerm: searchTerm,
                    onSearchChange: handleSearchTermChange,
                    sortBy: sortBy,
                    onSortChange: setSortBy,
                    pendingCount: filteredUsers.length
                }, void 0, false, {
                    fileName: "[project]/src/app/admin/verification-requests/page.tsx",
                    lineNumber: 331,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2f$verification$2f$VerificationStats$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    stats: filteredStats
                }, void 0, false, {
                    fileName: "[project]/src/app/admin/verification-requests/page.tsx",
                    lineNumber: 339,
                    columnNumber: 9
                }, this),
                filteredUsers.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-[#121212] rounded-xl border border-gray-800 p-12 text-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__["Shield"], {
                                className: "w-16 h-16 text-gray-600 mx-auto mb-4"
                            }, void 0, false, {
                                fileName: "[project]/src/app/admin/verification-requests/page.tsx",
                                lineNumber: 344,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-xl font-bold mb-2",
                                children: "No Pending Verifications"
                            }, void 0, false, {
                                fileName: "[project]/src/app/admin/verification-requests/page.tsx",
                                lineNumber: 345,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-gray-400",
                                children: searchTerm ? 'No verification requests found matching "'.concat(searchTerm, '"') : 'There are no verification requests awaiting review'
                            }, void 0, false, {
                                fileName: "[project]/src/app/admin/verification-requests/page.tsx",
                                lineNumber: 346,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/admin/verification-requests/page.tsx",
                        lineNumber: 343,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/app/admin/verification-requests/page.tsx",
                    lineNumber: 342,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2f$verification$2f$VerificationList$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    users: filteredUsers,
                    searchTerm: searchTerm,
                    onSelectUser: setSelected
                }, void 0, false, {
                    fileName: "[project]/src/app/admin/verification-requests/page.tsx",
                    lineNumber: 354,
                    columnNumber: 11
                }, this),
                selected && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2f$verification$2f$ReviewModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    user: selected,
                    onClose: ()=>setSelected(null),
                    onApprove: handleApprove,
                    onReject: handleReject,
                    getTimeAgo: getTimeAgo
                }, void 0, false, {
                    fileName: "[project]/src/app/admin/verification-requests/page.tsx",
                    lineNumber: 362,
                    columnNumber: 11
                }, this),
                imageViewer && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2f$verification$2f$ImageViewer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    imageData: imageViewer,
                    isLoading: imageLoading,
                    onClose: handleImageClose,
                    onLoad: handleImageLoad
                }, void 0, false, {
                    fileName: "[project]/src/app/admin/verification-requests/page.tsx",
                    lineNumber: 372,
                    columnNumber: 11
                }, this),
                isProcessing && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-[#121212] rounded-xl border border-gray-800 p-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                className: "w-8 h-8 animate-spin mx-auto mb-4 text-[#ff950e]"
                            }, void 0, false, {
                                fileName: "[project]/src/app/admin/verification-requests/page.tsx",
                                lineNumber: 384,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-gray-400",
                                children: "Processing verification..."
                            }, void 0, false, {
                                fileName: "[project]/src/app/admin/verification-requests/page.tsx",
                                lineNumber: 385,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/admin/verification-requests/page.tsx",
                        lineNumber: 383,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/app/admin/verification-requests/page.tsx",
                    lineNumber: 382,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/app/admin/verification-requests/page.tsx",
            lineNumber: 328,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/admin/verification-requests/page.tsx",
        lineNumber: 327,
        columnNumber: 5
    }, this);
}
_s(AdminVerificationRequestsPage, "m8dqLfR3tHheCWsqW8ZO+N1FGjs=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = AdminVerificationRequestsPage;
var _c;
__turbopack_context__.k.register(_c, "AdminVerificationRequestsPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=src_ad8375b4._.js.map