(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/src/utils/banUtils.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/utils/banUtils.tsx
__turbopack_context__.s({
    "getBanReasonDisplay": ()=>getBanReasonDisplay,
    "isValidBan": ()=>isValidBan
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/triangle-alert.js [app-client] (ecmascript) <export default as AlertTriangle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$square$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageSquare$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/message-square.js [app-client] (ecmascript) <export default as MessageSquare>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-alert.js [app-client] (ecmascript) <export default as AlertCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__UserCheck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/user-check.js [app-client] (ecmascript) <export default as UserCheck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Info$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/info.js [app-client] (ecmascript) <export default as Info>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
;
;
;
const getBanReasonDisplay = (reason, customReason)=>{
    if (!reason || typeof reason !== 'string') {
        return 'Unknown Reason';
    }
    const reasonMap = {
        harassment: {
            label: 'Harassment',
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"],
            color: 'text-red-400'
        },
        spam: {
            label: 'Spam',
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$square$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageSquare$3e$__["MessageSquare"],
            color: 'text-yellow-400'
        },
        inappropriate_content: {
            label: 'Inappropriate Content',
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"],
            color: 'text-orange-400'
        },
        scam: {
            label: 'Scam/Fraud',
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"],
            color: 'text-red-500'
        },
        underage: {
            label: 'Underage',
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__UserCheck$3e$__["UserCheck"],
            color: 'text-purple-400'
        },
        payment_fraud: {
            label: 'Payment Fraud',
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"],
            color: 'text-red-600'
        },
        other: {
            label: 'Other',
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Info$3e$__["Info"],
            color: 'text-gray-400'
        }
    };
    const reasonInfo = reasonMap[reason.toLowerCase()] || {
        label: reason,
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Info$3e$__["Info"],
        color: 'text-gray-400'
    };
    const Icon = reasonInfo.icon;
    // Sanitize customReason before display to prevent XSS
    const sanitizedCustomReason = customReason ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(customReason) : undefined;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: "flex items-center gap-1 ".concat(reasonInfo.color),
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                size: 14
            }, void 0, false, {
                fileName: "[project]/src/utils/banUtils.tsx",
                lineNumber: 35,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            reasonInfo.label,
            sanitizedCustomReason && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "text-gray-400 ml-1",
                children: [
                    "- ",
                    sanitizedCustomReason
                ]
            }, void 0, true, {
                fileName: "[project]/src/utils/banUtils.tsx",
                lineNumber: 37,
                columnNumber: 33
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/utils/banUtils.tsx",
        lineNumber: 34,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const isValidBan = (ban)=>{
    return ban && typeof ban === 'object' && ban.id && ban.username && typeof ban.username === 'string' && ban.banType && ban.reason && ban.startTime && typeof ban.bannedBy === 'string'; // Changed to check type instead of truthiness
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/admin/bans/BanCard.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/components/admin/bans/BanCard.tsx
__turbopack_context__.s({
    "default": ()=>BanCard
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/eye.js [app-client] (ecmascript) <export default as Eye>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$square$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageSquare$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/message-square.js [app-client] (ecmascript) <export default as MessageSquare>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__UserCheck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/user-check.js [app-client] (ecmascript) <export default as UserCheck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$infinity$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Infinity$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/infinity.js [app-client] (ecmascript) <export default as Infinity>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$banUtils$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/banUtils.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/SecureMessageDisplay.tsx [app-client] (ecmascript)");
'use client';
;
;
;
;
const formatRemainingTime = (ban)=>{
    if (!ban || typeof ban !== 'object') return 'Unknown';
    if (ban.banType === 'permanent') {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "flex items-center gap-1 text-red-400",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$infinity$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Infinity$3e$__["Infinity"], {
                    size: 14
                }, void 0, false, {
                    fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                    lineNumber: 24,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                " Permanent"
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/admin/bans/BanCard.tsx",
            lineNumber: 23,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0));
    }
    if (!ban.remainingHours || ban.remainingHours <= 0) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-gray-500",
            children: "Expired"
        }, void 0, false, {
            fileName: "[project]/src/components/admin/bans/BanCard.tsx",
            lineNumber: 30,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
    }
    const hours = Number(ban.remainingHours);
    if (hours < 1) {
        const minutes = Math.ceil(hours * 60);
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-yellow-400",
            children: [
                minutes,
                "m remaining"
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/admin/bans/BanCard.tsx",
            lineNumber: 36,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
    }
    if (hours < 24) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-orange-400",
            children: [
                Math.ceil(hours),
                "h remaining"
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/admin/bans/BanCard.tsx",
            lineNumber: 40,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
    }
    const days = Math.floor(hours / 24);
    const remainingHours = Math.ceil(hours % 24);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: "text-red-400",
        children: [
            days,
            "d ",
            remainingHours,
            "h remaining"
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/admin/bans/BanCard.tsx",
        lineNumber: 45,
        columnNumber: 10
    }, ("TURBOPACK compile-time value", void 0));
};
function BanCard(param) {
    let { ban, isExpanded, onToggleExpand, onUnban, onReviewAppeal, onShowEvidence } = param;
    // Build a definite evidence list (no non-null assertions)
    const evidenceList = Array.isArray(ban.appealEvidence) ? ban.appealEvidence.filter((x)=>typeof x === 'string') : [];
    const hasEvidence = evidenceList.length > 0;
    var _ban_appealStatus, _ban_bannedBy, _ban_appealText;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-between items-start",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-3 mb-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "text-lg font-semibold text-white",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureMessageDisplay"], {
                                            content: ban.username,
                                            allowBasicFormatting: false
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                                            lineNumber: 68,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                                        lineNumber: 67,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "px-2 py-1 text-xs rounded font-medium ".concat(ban.banType === 'permanent' ? 'bg-red-900/20 text-red-400' : 'bg-orange-900/20 text-orange-400'),
                                        children: ban.banType
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                                        lineNumber: 70,
                                        columnNumber: 13
                                    }, this),
                                    ban.appealSubmitted && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "px-2 py-1 bg-blue-900/20 text-blue-400 text-xs rounded font-medium",
                                        children: [
                                            "Appeal ",
                                            (_ban_appealStatus = ban.appealStatus) !== null && _ban_appealStatus !== void 0 ? _ban_appealStatus : 'Pending'
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                                        lineNumber: 80,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                                lineNumber: 66,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-sm text-gray-400 mb-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Reason: "
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                                        lineNumber: 87,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-gray-300",
                                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$banUtils$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getBanReasonDisplay"])(ban.reason, ban.customReason)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                                        lineNumber: 88,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                                lineNumber: 86,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-sm text-gray-400",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Duration: "
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                                        lineNumber: 94,
                                        columnNumber: 13
                                    }, this),
                                    formatRemainingTime(ban)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                                lineNumber: 93,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                        lineNumber: 65,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-2 ml-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>onToggleExpand(ban.id),
                                className: "px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 flex items-center transition-colors",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__["Eye"], {
                                        size: 12,
                                        className: "mr-1"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                                        lineNumber: 104,
                                        columnNumber: 13
                                    }, this),
                                    isExpanded ? 'Less' : 'More'
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                                lineNumber: 100,
                                columnNumber: 11
                            }, this),
                            ban.appealSubmitted && ban.appealStatus === 'pending' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>onReviewAppeal(ban),
                                className: "px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center transition-colors",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$square$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageSquare$3e$__["MessageSquare"], {
                                        size: 12,
                                        className: "mr-1"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                                        lineNumber: 113,
                                        columnNumber: 15
                                    }, this),
                                    "Review"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                                lineNumber: 109,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>onUnban(ban),
                                className: "px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center transition-colors",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__UserCheck$3e$__["UserCheck"], {
                                        size: 12,
                                        className: "mr-1"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                                        lineNumber: 122,
                                        columnNumber: 13
                                    }, this),
                                    "Unban"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                                lineNumber: 118,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                        lineNumber: 99,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                lineNumber: 64,
                columnNumber: 7
            }, this),
            isExpanded && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-4 pt-4 border-t border-gray-700",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-2 gap-4 text-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-gray-400",
                                        children: "Start Time:"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                                        lineNumber: 132,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-gray-300",
                                        children: new Date(ban.startTime).toLocaleString()
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                                        lineNumber: 133,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                                lineNumber: 131,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-gray-400",
                                        children: "Banned By:"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                                        lineNumber: 136,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-gray-300",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureMessageDisplay"], {
                                            content: (_ban_bannedBy = ban.bannedBy) !== null && _ban_bannedBy !== void 0 ? _ban_bannedBy : 'Unknown',
                                            allowBasicFormatting: false
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                                            lineNumber: 138,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                                        lineNumber: 137,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                                lineNumber: 135,
                                columnNumber: 13
                            }, this),
                            ban.endTime && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-gray-400",
                                        children: "End Time:"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                                        lineNumber: 143,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-gray-300",
                                        children: new Date(ban.endTime).toLocaleString()
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                                        lineNumber: 144,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                                lineNumber: 142,
                                columnNumber: 15
                            }, this),
                            ban.notes && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "col-span-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-gray-400",
                                        children: "Notes:"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                                        lineNumber: 149,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-gray-300 mt-1",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureMessageDisplay"], {
                                            content: ban.notes,
                                            allowBasicFormatting: false,
                                            maxLength: 500
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                                            lineNumber: 151,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                                        lineNumber: 150,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                                lineNumber: 148,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                        lineNumber: 130,
                        columnNumber: 11
                    }, this),
                    ban.appealSubmitted && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-4 p-3 bg-blue-900/10 border border-blue-800 rounded",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center justify-between mb-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-sm text-blue-400 font-medium",
                                        children: "Appeal Submitted"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                                        lineNumber: 160,
                                        columnNumber: 17
                                    }, this),
                                    hasEvidence && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>onShowEvidence(evidenceList),
                                        className: "text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "w-2 h-2 bg-blue-400 rounded"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                                                lineNumber: 167,
                                                columnNumber: 21
                                            }, this),
                                            evidenceList.length,
                                            " Evidence"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                                        lineNumber: 163,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                                lineNumber: 159,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-sm text-gray-300",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureMessageDisplay"], {
                                    content: (_ban_appealText = ban.appealText) !== null && _ban_appealText !== void 0 ? _ban_appealText : 'No appeal text provided',
                                    allowBasicFormatting: false,
                                    maxLength: 500
                                }, void 0, false, {
                                    fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                                    lineNumber: 174,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                                lineNumber: 173,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-xs text-gray-500 mt-1",
                                children: ban.appealDate ? new Date(ban.appealDate).toLocaleString() : 'Unknown date'
                            }, void 0, false, {
                                fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                                lineNumber: 180,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                        lineNumber: 158,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/admin/bans/BanCard.tsx",
                lineNumber: 129,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/admin/bans/BanCard.tsx",
        lineNumber: 63,
        columnNumber: 5
    }, this);
}
_c = BanCard;
var _c;
__turbopack_context__.k.register(_c, "BanCard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/admin/bans/ActiveBansContent.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/components/admin/bans/ActiveBansContent.tsx
__turbopack_context__.s({
    "default": ()=>ActiveBansContent
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__UserCheck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/user-check.js [app-client] (ecmascript) <export default as UserCheck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2f$bans$2f$BanCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/admin/bans/BanCard.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$banUtils$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/banUtils.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
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
const VALID_SORT_OPTIONS = [
    'username',
    'duration',
    'date'
];
const VALID_FILTER_OPTIONS = [
    'all',
    'temporary',
    'permanent'
];
const VALID_SORT_ORDERS = [
    'asc',
    'desc'
];
function filterAndSortBans(bans, filters) {
    if (!Array.isArray(bans)) return [];
    const sanitizedSearchTerm = filters.searchTerm ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeSearchQuery"])(filters.searchTerm) : '';
    const validatedSortBy = VALID_SORT_OPTIONS.includes(filters.sortBy) ? filters.sortBy : 'date';
    const validatedFilterBy = VALID_FILTER_OPTIONS.includes(filters.filterBy) ? filters.filterBy : 'all';
    const validatedSortOrder = VALID_SORT_ORDERS.includes(filters.sortOrder) ? filters.sortOrder : 'desc';
    const filtered = bans.filter((ban)=>{
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$banUtils$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidBan"])(ban)) return false;
        const sanitizedUsername = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(ban.username || '').toLowerCase();
        const sanitizedReason = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(ban.reason || '').toLowerCase();
        const sanitizedCustomReason = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(ban.customReason || '').toLowerCase();
        const searchTermLower = sanitizedSearchTerm.toLowerCase();
        const matchesSearch = sanitizedSearchTerm ? sanitizedUsername.includes(searchTermLower) || sanitizedReason.includes(searchTermLower) || sanitizedCustomReason.includes(searchTermLower) : true;
        const matchesFilter = validatedFilterBy === 'all' ? true : validatedFilterBy === 'temporary' ? ban.banType === 'temporary' : ban.banType === 'permanent';
        return matchesSearch && matchesFilter;
    });
    filtered.sort((a, b)=>{
        let comparison = 0;
        switch(validatedSortBy){
            case 'username':
                {
                    const usernameA = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(a.username || '');
                    const usernameB = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(b.username || '');
                    comparison = usernameA.localeCompare(usernameB);
                    break;
                }
            case 'duration':
                {
                    const aDuration = a.banType === 'permanent' ? Number.POSITIVE_INFINITY : Number(a.remainingHours) || 0;
                    const bDuration = b.banType === 'permanent' ? Number.POSITIVE_INFINITY : Number(b.remainingHours) || 0;
                    comparison = aDuration - bDuration;
                    break;
                }
            case 'date':
            default:
                {
                    const dateA = new Date(a.startTime || 0).getTime();
                    const dateB = new Date(b.startTime || 0).getTime();
                    comparison = isNaN(dateA) || isNaN(dateB) ? 0 : dateA - dateB;
                    break;
                }
        }
        return validatedSortOrder === 'asc' ? comparison : -comparison;
    });
    return filtered;
}
function ActiveBansContent(param) {
    let { activeBans, filters, totalCount, expandedBans, onToggleExpand, onUnban, onReviewAppeal, onShowEvidence } = param;
    _s();
    const validatedTotalCount = Number.isInteger(totalCount) && totalCount >= 0 ? totalCount : 0;
    const filteredBans = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ActiveBansContent.useMemo[filteredBans]": ()=>filterAndSortBans(activeBans, filters)
    }["ActiveBansContent.useMemo[filteredBans]"], [
        activeBans,
        filters
    ]);
    console.log('[ActiveBansContent] Rendering:', {
        receivedBans: Array.isArray(activeBans) ? activeBans.length : 0,
        filteredBans: filteredBans.length,
        totalCount: validatedTotalCount
    });
    const headerCount = filteredBans.length !== validatedTotalCount ? "".concat(filteredBans.length, " of ").concat(validatedTotalCount) : "".concat(validatedTotalCount);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-between items-center mb-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-xl font-semibold text-white",
                        children: [
                            "Active Bans (",
                            headerCount,
                            ")"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/admin/bans/ActiveBansContent.tsx",
                        lineNumber: 117,
                        columnNumber: 9
                    }, this),
                    validatedTotalCount > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-gray-400",
                        children: "Click on a ban to expand details"
                    }, void 0, false, {
                        fileName: "[project]/src/components/admin/bans/ActiveBansContent.tsx",
                        lineNumber: 118,
                        columnNumber: 37
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/admin/bans/ActiveBansContent.tsx",
                lineNumber: 116,
                columnNumber: 7
            }, this),
            filteredBans.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-[#1a1a1a] border border-gray-800 rounded-lg p-8 text-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__UserCheck$3e$__["UserCheck"], {
                        size: 48,
                        className: "mx-auto text-gray-600 mb-4"
                    }, void 0, false, {
                        fileName: "[project]/src/components/admin/bans/ActiveBansContent.tsx",
                        lineNumber: 123,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-gray-400 text-lg",
                        children: "No active bans found"
                    }, void 0, false, {
                        fileName: "[project]/src/components/admin/bans/ActiveBansContent.tsx",
                        lineNumber: 124,
                        columnNumber: 11
                    }, this),
                    filters.searchTerm && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-gray-500 text-sm mt-2",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureMessageDisplay"], {
                            content: "Try adjusting your search terms or filters",
                            allowBasicFormatting: false
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/bans/ActiveBansContent.tsx",
                            lineNumber: 127,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/admin/bans/ActiveBansContent.tsx",
                        lineNumber: 126,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/admin/bans/ActiveBansContent.tsx",
                lineNumber: 122,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-4",
                children: filteredBans.map((ban)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2f$bans$2f$BanCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        ban: ban,
                        isExpanded: expandedBans.has(ban.id),
                        onToggleExpand: onToggleExpand,
                        onUnban: onUnban,
                        onReviewAppeal: onReviewAppeal,
                        onShowEvidence: onShowEvidence
                    }, ban.id, false, {
                        fileName: "[project]/src/components/admin/bans/ActiveBansContent.tsx",
                        lineNumber: 134,
                        columnNumber: 13
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/components/admin/bans/ActiveBansContent.tsx",
                lineNumber: 132,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/admin/bans/ActiveBansContent.tsx",
        lineNumber: 115,
        columnNumber: 5
    }, this);
}
_s(ActiveBansContent, "wI9WDlawFHvgqTrM96fxgsw4d2M=");
_c = ActiveBansContent;
var _c;
__turbopack_context__.k.register(_c, "ActiveBansContent");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/node_modules/lucide-react/dist/esm/icons/user-check.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ __turbopack_context__.s({
    "__iconNode": ()=>__iconNode,
    "default": ()=>UserCheck
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/createLucideIcon.js [app-client] (ecmascript)");
;
const __iconNode = [
    [
        "path",
        {
            d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
            key: "1yyitq"
        }
    ],
    [
        "circle",
        {
            cx: "9",
            cy: "7",
            r: "4",
            key: "nufk8"
        }
    ],
    [
        "polyline",
        {
            points: "16 11 18 13 22 9",
            key: "1pwet4"
        }
    ]
];
const UserCheck = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("user-check", __iconNode);
;
 //# sourceMappingURL=user-check.js.map
}),
"[project]/node_modules/lucide-react/dist/esm/icons/user-check.js [app-client] (ecmascript) <export default as UserCheck>": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "UserCheck": ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/user-check.js [app-client] (ecmascript)");
}),
}]);

//# sourceMappingURL=_5701fc87._.js.map