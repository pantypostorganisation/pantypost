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
"[project]/src/components/skeletons/AdminSkeletons.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/components/skeletons/AdminSkeletons.tsx
__turbopack_context__.s({
    "AdminStatsSkeleton": ()=>AdminStatsSkeleton,
    "BanCardSkeleton": ()=>BanCardSkeleton,
    "BanListSkeleton": ()=>BanListSkeleton,
    "MessageThreadSkeleton": ()=>MessageThreadSkeleton,
    "OrderCardSkeleton": ()=>OrderCardSkeleton,
    "OrderListSkeleton": ()=>OrderListSkeleton,
    "ReportCardSkeleton": ()=>ReportCardSkeleton,
    "ReportListSkeleton": ()=>ReportListSkeleton,
    "VerificationCardSkeleton": ()=>VerificationCardSkeleton,
    "WalletUserListSkeleton": ()=>WalletUserListSkeleton
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
/** Utility: clamp a numeric count to avoid runaway DOM renders */ const clampCount = function(n) {
    let min = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1, max = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 50;
    return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.floor(n))) : min;
};
function BanCardSkeleton() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-[#1a1a1a] border border-gray-800 rounded-lg p-6",
        role: "status",
        "aria-live": "polite",
        "aria-busy": "true",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex justify-between items-start",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-1",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-3 mb-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "h-6 bg-gray-800 rounded w-32 animate-pulse"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                    lineNumber: 17,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "h-5 bg-gray-800 rounded w-20 animate-pulse"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                    lineNumber: 18,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                            lineNumber: 16,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "h-4 bg-gray-800 rounded w-48 mb-2 animate-pulse"
                        }, void 0, false, {
                            fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                            lineNumber: 21,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "h-4 bg-gray-800 rounded w-36 animate-pulse"
                        }, void 0, false, {
                            fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                            lineNumber: 22,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                    lineNumber: 15,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-col gap-2 ml-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "h-8 bg-gray-800 rounded w-16 animate-pulse"
                        }, void 0, false, {
                            fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                            lineNumber: 26,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "h-8 bg-gray-800 rounded w-16 animate-pulse"
                        }, void 0, false, {
                            fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                            lineNumber: 27,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                    lineNumber: 25,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
            lineNumber: 14,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
        lineNumber: 13,
        columnNumber: 5
    }, this);
}
_c = BanCardSkeleton;
function ReportCardSkeleton() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-[#1a1a1a] border border-gray-800 rounded-lg overflow-hidden",
        role: "status",
        "aria-live": "polite",
        "aria-busy": "true",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "p-6",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-between items-start",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-4 mb-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "h-4 w-4 bg-gray-800 rounded animate-pulse"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                                lineNumber: 43,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "h-5 bg-gray-800 rounded w-48 animate-pulse"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                                lineNumber: 44,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                        lineNumber: 42,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "h-5 bg-gray-800 rounded w-24 animate-pulse"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                        lineNumber: 46,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                lineNumber: 41,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "h-4 bg-gray-800 rounded w-32 animate-pulse"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                        lineNumber: 50,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "h-4 bg-gray-800 rounded w-16 animate-pulse"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                        lineNumber: 51,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "h-4 bg-gray-800 rounded w-20 animate-pulse"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                        lineNumber: 52,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                lineNumber: 49,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                        lineNumber: 40,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-8 bg-gray-800 rounded w-24 animate-pulse"
                            }, void 0, false, {
                                fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                lineNumber: 57,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-8 bg-gray-800 rounded w-24 animate-pulse"
                            }, void 0, false, {
                                fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                lineNumber: 58,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-5 w-5 bg-gray-800 rounded animate-pulse"
                            }, void 0, false, {
                                fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                lineNumber: 59,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                        lineNumber: 56,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                lineNumber: 39,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
            lineNumber: 38,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
        lineNumber: 37,
        columnNumber: 5
    }, this);
}
_c1 = ReportCardSkeleton;
function WalletUserListSkeleton() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "lg:col-span-2 bg-[#1a1a1a] rounded-xl border border-gray-800 shadow-lg",
        role: "status",
        "aria-live": "polite",
        "aria-busy": "true",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "p-6 border-b border-gray-800",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "h-5 w-5 bg-gray-800 rounded animate-pulse"
                        }, void 0, false, {
                            fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                            lineNumber: 73,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "h-6 bg-gray-800 rounded w-24 animate-pulse"
                        }, void 0, false, {
                            fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                            lineNumber: 74,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                    lineNumber: 72,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                lineNumber: 71,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "p-2 space-y-1",
                children: Array.from({
                    length: 5
                }).map((_, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-3 rounded-lg bg-black/30",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center justify-between",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-3 flex-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "h-4 w-4 bg-gray-800 rounded animate-pulse"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                                lineNumber: 84,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "h-4 w-4 bg-gray-800 rounded animate-pulse"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                                lineNumber: 85,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                        lineNumber: 83,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2 mb-1",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "h-5 bg-gray-800 rounded w-32 animate-pulse"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                                        lineNumber: 90,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "h-5 bg-gray-800 rounded w-16 animate-pulse"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                                        lineNumber: 91,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                                lineNumber: 89,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "h-4 bg-gray-800 rounded w-24 animate-pulse"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                                lineNumber: 93,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                        lineNumber: 88,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                lineNumber: 82,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                            lineNumber: 81,
                            columnNumber: 13
                        }, this)
                    }, index, false, {
                        fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                        lineNumber: 80,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                lineNumber: 78,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
        lineNumber: 70,
        columnNumber: 5
    }, this);
}
_c2 = WalletUserListSkeleton;
function AdminStatsSkeleton() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
        role: "status",
        "aria-live": "polite",
        "aria-busy": "true",
        children: Array.from({
            length: 4
        }).map((_, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-[#1a1a1a] rounded-lg border border-gray-800 p-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between mb-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-4 bg-gray-800 rounded w-20 animate-pulse"
                            }, void 0, false, {
                                fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                lineNumber: 111,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-8 w-8 bg-gray-800 rounded animate-pulse"
                            }, void 0, false, {
                                fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                lineNumber: 112,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                        lineNumber: 110,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-8 bg-gray-800 rounded w-24 animate-pulse mb-1"
                    }, void 0, false, {
                        fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                        lineNumber: 114,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-3 bg-gray-800 rounded w-16 animate-pulse"
                    }, void 0, false, {
                        fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                        lineNumber: 115,
                        columnNumber: 11
                    }, this)
                ]
            }, index, true, {
                fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                lineNumber: 109,
                columnNumber: 9
            }, this))
    }, void 0, false, {
        fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
        lineNumber: 107,
        columnNumber: 5
    }, this);
}
_c3 = AdminStatsSkeleton;
function MessageThreadSkeleton() {
    _s();
    // Precompute stable widths so they don't change on re-render
    const bubbleWidths = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "MessageThreadSkeleton.useMemo[bubbleWidths]": ()=>Array.from({
                length: 5
            }, {
                "MessageThreadSkeleton.useMemo[bubbleWidths]": ()=>100 + Math.floor(Math.random() * 100)
            }["MessageThreadSkeleton.useMemo[bubbleWidths]"])
    }["MessageThreadSkeleton.useMemo[bubbleWidths]"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-4 p-4",
        role: "status",
        "aria-live": "polite",
        "aria-busy": "true",
        children: bubbleWidths.map((w, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex ".concat(index % 2 === 0 ? 'justify-start' : 'justify-end'),
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-xs space-y-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-2",
                            children: [
                                index % 2 === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "h-8 w-8 bg-gray-800 rounded-full animate-pulse"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                    lineNumber: 136,
                                    columnNumber: 35
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "h-10 bg-gray-800 rounded-lg animate-pulse ".concat(index % 2 === 0 ? 'rounded-bl-none' : 'rounded-br-none'),
                                    style: {
                                        width: "".concat(w, "px")
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                    lineNumber: 137,
                                    columnNumber: 15
                                }, this),
                                index % 2 !== 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "h-8 w-8 bg-gray-800 rounded-full animate-pulse"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                    lineNumber: 143,
                                    columnNumber: 35
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                            lineNumber: 135,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "h-3 bg-gray-800 rounded animate-pulse w-20 ml-10"
                        }, void 0, false, {
                            fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                            lineNumber: 145,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                    lineNumber: 134,
                    columnNumber: 11
                }, this)
            }, index, false, {
                fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                lineNumber: 133,
                columnNumber: 9
            }, this))
    }, void 0, false, {
        fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
        lineNumber: 131,
        columnNumber: 5
    }, this);
}
_s(MessageThreadSkeleton, "uBq3FRmeOJJb0lvw1U+yPRy5BkI=");
_c4 = MessageThreadSkeleton;
function VerificationCardSkeleton() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-[#1a1a1a] rounded-lg border border-gray-800 p-6",
        role: "status",
        "aria-live": "polite",
        "aria-busy": "true",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-between items-start mb-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-10 w-10 bg-gray-800 rounded-full animate-pulse"
                            }, void 0, false, {
                                fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                lineNumber: 159,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "h-5 bg-gray-800 rounded w-32 animate-pulse mb-1"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                        lineNumber: 161,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "h-4 bg-gray-800 rounded w-24 animate-pulse"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                        lineNumber: 162,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                lineNumber: 160,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                        lineNumber: 158,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-5 bg-gray-800 rounded w-20 animate-pulse"
                    }, void 0, false, {
                        fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                        lineNumber: 165,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                lineNumber: 157,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-3 gap-2 mb-4",
                children: Array.from({
                    length: 3
                }).map((_, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "aspect-square bg-gray-800 rounded animate-pulse"
                    }, index, false, {
                        fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                        lineNumber: 170,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                lineNumber: 168,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-9 bg-gray-800 rounded flex-1 animate-pulse"
                    }, void 0, false, {
                        fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                        lineNumber: 175,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-9 bg-gray-800 rounded flex-1 animate-pulse"
                    }, void 0, false, {
                        fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                        lineNumber: 176,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                lineNumber: 174,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
        lineNumber: 156,
        columnNumber: 5
    }, this);
}
_c5 = VerificationCardSkeleton;
function OrderCardSkeleton() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden",
        role: "status",
        "aria-live": "polite",
        "aria-busy": "true",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "p-6",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-between items-start",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex gap-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-12 w-12 bg-gray-800 rounded-full animate-pulse"
                            }, void 0, false, {
                                fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                lineNumber: 189,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "h-5 bg-gray-800 rounded w-48 animate-pulse mb-2"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                        lineNumber: 191,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex gap-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "h-4 bg-gray-800 rounded w-24 animate-pulse"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                                lineNumber: 193,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "h-4 bg-gray-800 rounded w-20 animate-pulse"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                                lineNumber: 194,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "h-4 bg-gray-800 rounded w-16 animate-pulse"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                                lineNumber: 195,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                        lineNumber: 192,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                lineNumber: 190,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                        lineNumber: 188,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-6 bg-gray-800 rounded w-24 animate-pulse"
                            }, void 0, false, {
                                fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                lineNumber: 200,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-8 w-8 bg-gray-800 rounded animate-pulse"
                            }, void 0, false, {
                                fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                                lineNumber: 201,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                        lineNumber: 199,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                lineNumber: 187,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
            lineNumber: 186,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
        lineNumber: 185,
        columnNumber: 5
    }, this);
}
_c6 = OrderCardSkeleton;
function BanListSkeleton(param) {
    let { count = 5 } = param;
    const safe = clampCount(count, 1, 50);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-4",
        role: "status",
        "aria-live": "polite",
        "aria-busy": "true",
        children: Array.from({
            length: safe
        }).map((_, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(BanCardSkeleton, {}, index, false, {
                fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                lineNumber: 215,
                columnNumber: 9
            }, this))
    }, void 0, false, {
        fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
        lineNumber: 213,
        columnNumber: 5
    }, this);
}
_c7 = BanListSkeleton;
function ReportListSkeleton(param) {
    let { count = 5 } = param;
    const safe = clampCount(count, 1, 50);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-4",
        role: "status",
        "aria-live": "polite",
        "aria-busy": "true",
        children: Array.from({
            length: safe
        }).map((_, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ReportCardSkeleton, {}, index, false, {
                fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                lineNumber: 226,
                columnNumber: 9
            }, this))
    }, void 0, false, {
        fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
        lineNumber: 224,
        columnNumber: 5
    }, this);
}
_c8 = ReportListSkeleton;
function OrderListSkeleton(param) {
    let { count = 5 } = param;
    const safe = clampCount(count, 1, 50);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-4",
        role: "status",
        "aria-live": "polite",
        "aria-busy": "true",
        children: Array.from({
            length: safe
        }).map((_, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(OrderCardSkeleton, {}, index, false, {
                fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
                lineNumber: 237,
                columnNumber: 9
            }, this))
    }, void 0, false, {
        fileName: "[project]/src/components/skeletons/AdminSkeletons.tsx",
        lineNumber: 235,
        columnNumber: 5
    }, this);
}
_c9 = OrderListSkeleton;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9;
__turbopack_context__.k.register(_c, "BanCardSkeleton");
__turbopack_context__.k.register(_c1, "ReportCardSkeleton");
__turbopack_context__.k.register(_c2, "WalletUserListSkeleton");
__turbopack_context__.k.register(_c3, "AdminStatsSkeleton");
__turbopack_context__.k.register(_c4, "MessageThreadSkeleton");
__turbopack_context__.k.register(_c5, "VerificationCardSkeleton");
__turbopack_context__.k.register(_c6, "OrderCardSkeleton");
__turbopack_context__.k.register(_c7, "BanListSkeleton");
__turbopack_context__.k.register(_c8, "ReportListSkeleton");
__turbopack_context__.k.register(_c9, "OrderListSkeleton");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/app/admin/bans/page.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/app/admin/bans/page.tsx
__turbopack_context__.s({
    "default": ()=>BanManagementPage
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$RequireAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/RequireAuth.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shield.js [app-client] (ecmascript) <export default as Shield>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/refresh-cw.js [app-client] (ecmascript) <export default as RefreshCw>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/download.js [app-client] (ecmascript) <export default as Download>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$ban$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/ban.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/AuthContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$ToastContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/ToastContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$skeletons$2f$AdminSkeletons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/skeletons/AdminSkeletons.tsx [app-client] (ecmascript)");
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
// Lazy load heavy components
const BanStatsDashboard = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["lazy"])(()=>__turbopack_context__.r("[project]/src/components/admin/bans/BanStatsDashboard.tsx [app-client] (ecmascript, async loader)")(__turbopack_context__.i));
_c = BanStatsDashboard;
const BanTabs = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["lazy"])(()=>__turbopack_context__.r("[project]/src/components/admin/bans/BanTabs.tsx [app-client] (ecmascript, async loader)")(__turbopack_context__.i));
_c1 = BanTabs;
const BanFilters = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["lazy"])(()=>__turbopack_context__.r("[project]/src/components/admin/bans/BanFilters.tsx [app-client] (ecmascript, async loader)")(__turbopack_context__.i));
_c2 = BanFilters;
const UnbanModal = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["lazy"])(()=>__turbopack_context__.r("[project]/src/components/admin/bans/UnbanModal.tsx [app-client] (ecmascript, async loader)")(__turbopack_context__.i));
_c3 = UnbanModal;
const AppealReviewModal = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["lazy"])(()=>__turbopack_context__.r("[project]/src/components/admin/bans/AppealReviewModal.tsx [app-client] (ecmascript, async loader)")(__turbopack_context__.i));
_c4 = AppealReviewModal;
const EvidenceModal = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["lazy"])(()=>__turbopack_context__.r("[project]/src/components/admin/bans/EvidenceModal.tsx [app-client] (ecmascript, async loader)")(__turbopack_context__.i));
_c5 = EvidenceModal;
const ActiveBansContent = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["lazy"])(()=>__turbopack_context__.r("[project]/src/components/admin/bans/ActiveBansContent.tsx [app-client] (ecmascript, async loader)")(__turbopack_context__.i));
_c6 = ActiveBansContent;
const ExpiredBansContent = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["lazy"])(()=>__turbopack_context__.r("[project]/src/components/admin/bans/ExpiredBansContent.tsx [app-client] (ecmascript, async loader)")(__turbopack_context__.i));
_c7 = ExpiredBansContent;
const AppealsContent = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["lazy"])(()=>__turbopack_context__.r("[project]/src/components/admin/bans/AppealsContent.tsx [app-client] (ecmascript, async loader)")(__turbopack_context__.i));
_c8 = AppealsContent;
const HistoryContent = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["lazy"])(()=>__turbopack_context__.r("[project]/src/components/admin/bans/HistoryContent.tsx [app-client] (ecmascript, async loader)")(__turbopack_context__.i));
_c9 = HistoryContent;
const AnalyticsContent = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["lazy"])(()=>__turbopack_context__.r("[project]/src/components/admin/bans/AnalyticsContent.tsx [app-client] (ecmascript, async loader)")(__turbopack_context__.i));
_c10 = AnalyticsContent;
function BanManagementPage() {
    _s();
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const { success: showSuccess, error: showError } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$ToastContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useToast"])();
    const [activeTab, setActiveTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('active');
    const [filters, setFilters] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        searchTerm: '',
        filterBy: 'all',
        sortBy: 'date',
        sortOrder: 'desc'
    });
    // Ban data from MongoDB
    const [activeBans, setActiveBans] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [expiredBans, setExpiredBans] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [banHistory, setBanHistory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [banStats, setBanStats] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        totalActiveBans: 0,
        temporaryBans: 0,
        permanentBans: 0,
        pendingAppeals: 0,
        recentBans24h: 0,
        bansByReason: {
            harassment: 0,
            spam: 0,
            inappropriate_content: 0,
            scam: 0,
            underage: 0,
            payment_fraud: 0,
            other: 0
        },
        appealStats: {
            totalAppeals: 0,
            pendingAppeals: 0,
            approvedAppeals: 0,
            rejectedAppeals: 0
        }
    });
    const [selectedBan, setSelectedBan] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [expandedBans, setExpandedBans] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(new Set());
    const [appealReviewNotes, setAppealReviewNotes] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [selectedEvidence, setSelectedEvidence] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [evidenceIndex, setEvidenceIndex] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [showUnbanModal, setShowUnbanModal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [showAppealModal, setShowAppealModal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [showEvidenceModal, setShowEvidenceModal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isRefreshing, setIsRefreshing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Fetch bans from MongoDB
    const fetchBans = async ()=>{
        setIsLoading(true);
        try {
            // Fetch active bans
            const activeBansResponse = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$ban$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["banService"].getBans({
                active: true
            });
            if (activeBansResponse.success && activeBansResponse.data) {
                // Safely access the data with type checking
                const responseData = activeBansResponse.data;
                const bansArray = responseData.bans || [];
                const transformedActiveBans = bansArray.map((ban)=>({
                        id: ban._id,
                        username: ban.username,
                        bannedBy: ban.bannedBy,
                        reason: ban.reason,
                        customReason: ban.customReason,
                        banType: ban.isPermanent ? 'permanent' : 'temporary',
                        duration: ban.duration,
                        notes: ban.notes,
                        startTime: ban.createdAt,
                        endTime: ban.expiresAt,
                        remainingHours: ban.duration && !ban.isPermanent ? Math.max(0, (new Date(ban.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)) : 0,
                        appealSubmitted: ban.appealSubmitted,
                        appealText: ban.appealText,
                        appealDate: ban.appealDate,
                        appealStatus: ban.appealStatus,
                        appealEvidence: []
                    }));
                setActiveBans(transformedActiveBans);
            }
            // Fetch expired bans
            const expiredBansResponse = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$ban$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["banService"].getBans({
                active: false
            });
            if (expiredBansResponse.success && expiredBansResponse.data) {
                const responseData = expiredBansResponse.data;
                setExpiredBans(responseData.bans || []);
            }
            // Fetch ban stats
            const statsResponse = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$ban$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["banService"].getBanStats();
            if (statsResponse.success && statsResponse.data) {
                // Transform the data to match BanStats type
                const statsData = statsResponse.data;
                setBanStats({
                    totalActiveBans: statsData.totalActiveBans || 0,
                    temporaryBans: statsData.temporaryBans || 0,
                    permanentBans: statsData.permanentBans || 0,
                    pendingAppeals: statsData.pendingAppeals || 0,
                    recentBans24h: statsData.bansLast24h || 0,
                    bansByReason: statsData.bansByReason || {
                        harassment: 0,
                        spam: 0,
                        inappropriate_content: 0,
                        scam: 0,
                        underage: 0,
                        payment_fraud: 0,
                        other: 0
                    },
                    appealStats: statsData.appealStats || {
                        totalAppeals: 0,
                        pendingAppeals: 0,
                        approvedAppeals: 0,
                        rejectedAppeals: 0
                    }
                });
            }
            // Build history from all bans
            const allBans = [
                ...activeBansResponse.data && activeBansResponse.data.bans ? activeBansResponse.data.bans : [],
                ...expiredBansResponse.data && expiredBansResponse.data.bans ? expiredBansResponse.data.bans : []
            ];
            const history = allBans.map((ban)=>({
                    id: ban._id,
                    username: ban.username,
                    action: ban.active ? 'banned' : 'unbanned',
                    details: "".concat(ban.reason).concat(ban.customReason ? ': ' + ban.customReason : ''),
                    adminUsername: ban.bannedBy,
                    timestamp: ban.createdAt
                }));
            setBanHistory(history);
        } catch (error) {
            console.error('Error fetching bans:', error);
            showError('Failed to load ban data');
        } finally{
            setIsLoading(false);
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BanManagementPage.useEffect": ()=>{
            fetchBans();
        }
    }["BanManagementPage.useEffect"], []);
    const handleRefresh = async ()=>{
        setIsRefreshing(true);
        await fetchBans();
        setTimeout(()=>setIsRefreshing(false), 500);
    };
    const handleUnban = (ban)=>{
        setSelectedBan(ban);
        setShowUnbanModal(true);
    };
    const confirmUnban = async (reason)=>{
        if (!selectedBan) return;
        setIsLoading(true);
        try {
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$ban$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["banService"].unbanUser(selectedBan.username, reason);
            if (result.success) {
                showSuccess("Successfully unbanned ".concat(selectedBan.username));
                setShowUnbanModal(false);
                setSelectedBan(null);
                await fetchBans();
            } else {
                var _result_error;
                showError(((_result_error = result.error) === null || _result_error === void 0 ? void 0 : _result_error.message) || 'Failed to unban user');
            }
        } catch (error) {
            console.error('Error unbanning user:', error);
            showError('Failed to unban user');
        } finally{
            setIsLoading(false);
        }
    };
    const handleAppealReview = (ban)=>{
        setSelectedBan(ban);
        setShowAppealModal(true);
        setAppealReviewNotes('');
    };
    const confirmAppealDecision = async (decision)=>{
        if (!selectedBan || !appealReviewNotes.trim()) {
            showError('Please provide review notes');
            return;
        }
        setIsLoading(true);
        try {
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$ban$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["banService"].reviewAppeal(selectedBan.id, decision, appealReviewNotes);
            if (result.success) {
                showSuccess("Appeal ".concat(decision, "d successfully"));
                setShowAppealModal(false);
                setSelectedBan(null);
                setAppealReviewNotes('');
                await fetchBans();
            } else {
                var _result_error;
                showError(((_result_error = result.error) === null || _result_error === void 0 ? void 0 : _result_error.message) || 'Failed to process appeal');
            }
        } catch (error) {
            console.error('Error processing appeal:', error);
            showError('Failed to process appeal');
        } finally{
            setIsLoading(false);
        }
    };
    const toggleBanExpansion = (banId)=>{
        setExpandedBans((prev)=>{
            const newSet = new Set(prev);
            if (newSet.has(banId)) {
                newSet.delete(banId);
            } else {
                newSet.add(banId);
            }
            return newSet;
        });
    };
    const showEvidence = (evidence)=>{
        setSelectedEvidence(evidence);
        setEvidenceIndex(0);
        setShowEvidenceModal(true);
    };
    const exportBanData = ()=>{
        try {
            const exportData = {
                activeBans,
                expiredBans,
                banHistory,
                banStats,
                exportDate: new Date().toISOString(),
                exportedBy: (user === null || user === void 0 ? void 0 : user.username) || 'admin'
            };
            const blob = new Blob([
                JSON.stringify(exportData, null, 2)
            ], {
                type: 'application/json'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = "ban-data-".concat(new Date().toISOString().split('T')[0], ".json");
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showSuccess('Ban data exported successfully');
        } catch (error) {
            console.error('Error exporting ban data:', error);
            showError('Failed to export ban data');
        }
    };
    const handleFiltersChange = (newFilters)=>{
        setFilters((prev)=>({
                ...prev,
                ...newFilters
            }));
    };
    const pendingAppeals = activeBans.filter((ban)=>ban.appealSubmitted && ban.appealStatus === 'pending');
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$RequireAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
        role: "admin",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-black text-white",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "p-8 max-w-7xl mx-auto",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        className: "text-3xl font-bold text-[#ff950e] flex items-center",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__["Shield"], {
                                                className: "mr-3"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/admin/bans/page.tsx",
                                                lineNumber: 308,
                                                columnNumber: 17
                                            }, this),
                                            "Ban Management"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/admin/bans/page.tsx",
                                        lineNumber: 307,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-gray-400 mt-1",
                                        children: "Manage user bans and appeals"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/admin/bans/page.tsx",
                                        lineNumber: 311,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/admin/bans/page.tsx",
                                lineNumber: 306,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex gap-3 flex-wrap",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: exportBanData,
                                        className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__["Download"], {
                                                size: 16
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/admin/bans/page.tsx",
                                                lineNumber: 319,
                                                columnNumber: 17
                                            }, this),
                                            "Export Data"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/admin/bans/page.tsx",
                                        lineNumber: 315,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: handleRefresh,
                                        disabled: isRefreshing,
                                        className: "px-4 py-2 bg-[#ff950e] text-black rounded-lg hover:bg-[#e88800] flex items-center gap-2 transition-colors disabled:opacity-50",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"], {
                                                size: 16,
                                                className: isRefreshing ? 'animate-spin' : ''
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/admin/bans/page.tsx",
                                                lineNumber: 327,
                                                columnNumber: 17
                                            }, this),
                                            "Refresh"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/admin/bans/page.tsx",
                                        lineNumber: 322,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/admin/bans/page.tsx",
                                lineNumber: 314,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/admin/bans/page.tsx",
                        lineNumber: 305,
                        columnNumber: 11
                    }, this),
                    isLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$skeletons$2f$AdminSkeletons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AdminStatsSkeleton"], {}, void 0, false, {
                                fileName: "[project]/src/app/admin/bans/page.tsx",
                                lineNumber: 335,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$skeletons$2f$AdminSkeletons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BanListSkeleton"], {
                                count: 5
                            }, void 0, false, {
                                fileName: "[project]/src/app/admin/bans/page.tsx",
                                lineNumber: 336,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Suspense"], {
                                fallback: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$skeletons$2f$AdminSkeletons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AdminStatsSkeleton"], {}, void 0, false, {
                                    fileName: "[project]/src/app/admin/bans/page.tsx",
                                    lineNumber: 340,
                                    columnNumber: 35
                                }, void 0),
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(BanStatsDashboard, {
                                    banStats: banStats
                                }, void 0, false, {
                                    fileName: "[project]/src/app/admin/bans/page.tsx",
                                    lineNumber: 341,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/admin/bans/page.tsx",
                                lineNumber: 340,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Suspense"], {
                                fallback: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "h-12 bg-gray-800 rounded mb-4 animate-pulse"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/admin/bans/page.tsx",
                                    lineNumber: 344,
                                    columnNumber: 35
                                }, void 0),
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(BanTabs, {
                                    activeTab: activeTab,
                                    onTabChange: setActiveTab,
                                    banStats: banStats,
                                    expiredCount: expiredBans.length,
                                    historyCount: banHistory.length
                                }, void 0, false, {
                                    fileName: "[project]/src/app/admin/bans/page.tsx",
                                    lineNumber: 345,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/admin/bans/page.tsx",
                                lineNumber: 344,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Suspense"], {
                                fallback: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "h-12 bg-gray-800 rounded mb-4 animate-pulse"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/admin/bans/page.tsx",
                                    lineNumber: 354,
                                    columnNumber: 35
                                }, void 0),
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(BanFilters, {
                                    filters: filters,
                                    onFiltersChange: handleFiltersChange,
                                    showTypeFilter: [
                                        'active',
                                        'expired'
                                    ].includes(activeTab),
                                    isVisible: [
                                        'active',
                                        'expired',
                                        'appeals'
                                    ].includes(activeTab)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/admin/bans/page.tsx",
                                    lineNumber: 355,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/admin/bans/page.tsx",
                                lineNumber: 354,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Suspense"], {
                                fallback: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$skeletons$2f$AdminSkeletons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BanListSkeleton"], {
                                    count: 5
                                }, void 0, false, {
                                    fileName: "[project]/src/app/admin/bans/page.tsx",
                                    lineNumber: 363,
                                    columnNumber: 35
                                }, void 0),
                                children: [
                                    activeTab === 'active' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ActiveBansContent, {
                                        activeBans: activeBans,
                                        filters: filters,
                                        totalCount: banStats.totalActiveBans,
                                        expandedBans: expandedBans,
                                        onToggleExpand: toggleBanExpansion,
                                        onUnban: handleUnban,
                                        onReviewAppeal: handleAppealReview,
                                        onShowEvidence: showEvidence
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/admin/bans/page.tsx",
                                        lineNumber: 365,
                                        columnNumber: 19
                                    }, this),
                                    activeTab === 'expired' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ExpiredBansContent, {
                                        expiredBans: expiredBans,
                                        filters: filters
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/admin/bans/page.tsx",
                                        lineNumber: 378,
                                        columnNumber: 19
                                    }, this),
                                    activeTab === 'appeals' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AppealsContent, {
                                        pendingAppeals: pendingAppeals,
                                        onReviewAppeal: handleAppealReview,
                                        onShowEvidence: showEvidence
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/admin/bans/page.tsx",
                                        lineNumber: 382,
                                        columnNumber: 19
                                    }, this),
                                    activeTab === 'history' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(HistoryContent, {
                                        banHistory: banHistory,
                                        filters: filters
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/admin/bans/page.tsx",
                                        lineNumber: 390,
                                        columnNumber: 19
                                    }, this),
                                    activeTab === 'analytics' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AnalyticsContent, {
                                        banStats: banStats
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/admin/bans/page.tsx",
                                        lineNumber: 393,
                                        columnNumber: 47
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/admin/bans/page.tsx",
                                lineNumber: 363,
                                columnNumber: 15
                            }, this),
                            showUnbanModal && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Suspense"], {
                                fallback: null,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(UnbanModal, {
                                    ban: selectedBan,
                                    isLoading: isLoading,
                                    onClose: ()=>{
                                        setShowUnbanModal(false);
                                        setSelectedBan(null);
                                    },
                                    onConfirm: confirmUnban
                                }, void 0, false, {
                                    fileName: "[project]/src/app/admin/bans/page.tsx",
                                    lineNumber: 398,
                                    columnNumber: 19
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/admin/bans/page.tsx",
                                lineNumber: 397,
                                columnNumber: 17
                            }, this),
                            showAppealModal && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Suspense"], {
                                fallback: null,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AppealReviewModal, {
                                    ban: selectedBan,
                                    appealReviewNotes: appealReviewNotes,
                                    setAppealReviewNotes: setAppealReviewNotes,
                                    isLoading: isLoading,
                                    onClose: ()=>{
                                        setShowAppealModal(false);
                                        setSelectedBan(null);
                                        setAppealReviewNotes('');
                                    },
                                    onConfirm: confirmAppealDecision,
                                    onShowEvidence: showEvidence
                                }, void 0, false, {
                                    fileName: "[project]/src/app/admin/bans/page.tsx",
                                    lineNumber: 412,
                                    columnNumber: 19
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/admin/bans/page.tsx",
                                lineNumber: 411,
                                columnNumber: 17
                            }, this),
                            showEvidenceModal && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Suspense"], {
                                fallback: null,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(EvidenceModal, {
                                    evidence: selectedEvidence,
                                    evidenceIndex: evidenceIndex,
                                    setEvidenceIndex: setEvidenceIndex,
                                    onClose: ()=>{
                                        setShowEvidenceModal(false);
                                        setSelectedEvidence([]);
                                        setEvidenceIndex(0);
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/src/app/admin/bans/page.tsx",
                                    lineNumber: 430,
                                    columnNumber: 19
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/admin/bans/page.tsx",
                                lineNumber: 429,
                                columnNumber: 17
                            }, this)
                        ]
                    }, void 0, true)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/admin/bans/page.tsx",
                lineNumber: 304,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/admin/bans/page.tsx",
            lineNumber: 303,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/admin/bans/page.tsx",
        lineNumber: 302,
        columnNumber: 5
    }, this);
}
_s(BanManagementPage, "mSfTRTCjzfpj69d08clKlULoAZ4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$ToastContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useToast"]
    ];
});
_c11 = BanManagementPage;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9, _c10, _c11;
__turbopack_context__.k.register(_c, "BanStatsDashboard");
__turbopack_context__.k.register(_c1, "BanTabs");
__turbopack_context__.k.register(_c2, "BanFilters");
__turbopack_context__.k.register(_c3, "UnbanModal");
__turbopack_context__.k.register(_c4, "AppealReviewModal");
__turbopack_context__.k.register(_c5, "EvidenceModal");
__turbopack_context__.k.register(_c6, "ActiveBansContent");
__turbopack_context__.k.register(_c7, "ExpiredBansContent");
__turbopack_context__.k.register(_c8, "AppealsContent");
__turbopack_context__.k.register(_c9, "HistoryContent");
__turbopack_context__.k.register(_c10, "AnalyticsContent");
__turbopack_context__.k.register(_c11, "BanManagementPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=src_0fc15d45._.js.map