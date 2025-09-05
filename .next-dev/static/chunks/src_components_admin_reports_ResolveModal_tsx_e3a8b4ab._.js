(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/src/components/admin/reports/ResolveModal.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/components/admin/reports/ResolveModal.tsx
__turbopack_context__.s({
    "default": ()=>ResolveModal
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-check-big.js [app-client] (ecmascript) <export default as CheckCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/SecureMessageDisplay.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
const SEVERITIES = [
    'low',
    'medium',
    'high',
    'critical'
];
const CATEGORIES = [
    'harassment',
    'spam',
    'inappropriate_content',
    'scam',
    'other'
];
function ResolveModal(param) {
    let { isOpen, report, onClose, onConfirm } = param;
    _s();
    const dialogRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const confirmBtnRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [busy, setBusy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Normalize/validate category & severity
    const safeCategory = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ResolveModal.useMemo[safeCategory]": ()=>{
            var _report_category;
            const v = String((_report_category = report === null || report === void 0 ? void 0 : report.category) !== null && _report_category !== void 0 ? _report_category : '').toLowerCase();
            return CATEGORIES.includes(v) ? v : 'other';
        }
    }["ResolveModal.useMemo[safeCategory]"], [
        report === null || report === void 0 ? void 0 : report.category
    ]);
    const safeSeverity = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ResolveModal.useMemo[safeSeverity]": ()=>{
            var _report_severity;
            const v = String((_report_severity = report === null || report === void 0 ? void 0 : report.severity) !== null && _report_severity !== void 0 ? _report_severity : '').toLowerCase();
            return SEVERITIES.includes(v) ? v : 'medium';
        }
    }["ResolveModal.useMemo[safeSeverity]"], [
        report === null || report === void 0 ? void 0 : report.severity
    ]);
    const prettyCategory = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ResolveModal.useMemo[prettyCategory]": ()=>{
            return safeCategory === 'inappropriate_content' ? 'Inappropriate Content' : safeCategory.charAt(0).toUpperCase() + safeCategory.slice(1);
        }
    }["ResolveModal.useMemo[prettyCategory]"], [
        safeCategory
    ]);
    const prettySeverity = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ResolveModal.useMemo[prettySeverity]": ()=>{
            return safeSeverity.charAt(0).toUpperCase() + safeSeverity.slice(1);
        }
    }["ResolveModal.useMemo[prettySeverity]"], [
        safeSeverity
    ]);
    // Close on ESC
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ResolveModal.useEffect": ()=>{
            if (!isOpen) return;
            const handleKeyDown = {
                "ResolveModal.useEffect.handleKeyDown": (e)=>{
                    if (e.key === 'Escape') {
                        e.stopPropagation();
                        onClose();
                    }
                }
            }["ResolveModal.useEffect.handleKeyDown"];
            document.addEventListener('keydown', handleKeyDown);
            return ({
                "ResolveModal.useEffect": ()=>document.removeEventListener('keydown', handleKeyDown)
            })["ResolveModal.useEffect"];
        }
    }["ResolveModal.useEffect"], [
        isOpen,
        onClose
    ]);
    // Lock scroll + focus the confirm button on open
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ResolveModal.useEffect": ()=>{
            if (!isOpen) return;
            const prevOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            const t = setTimeout({
                "ResolveModal.useEffect.t": ()=>{
                    var _confirmBtnRef_current;
                    (_confirmBtnRef_current = confirmBtnRef.current) === null || _confirmBtnRef_current === void 0 ? void 0 : _confirmBtnRef_current.focus();
                }
            }["ResolveModal.useEffect.t"], 0);
            return ({
                "ResolveModal.useEffect": ()=>{
                    clearTimeout(t);
                    document.body.style.overflow = prevOverflow;
                }
            })["ResolveModal.useEffect"];
        }
    }["ResolveModal.useEffect"], [
        isOpen
    ]);
    const handleBackdropClick = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ResolveModal.useCallback[handleBackdropClick]": (e)=>{
            if (e.target === e.currentTarget) onClose();
        }
    }["ResolveModal.useCallback[handleBackdropClick]"], [
        onClose
    ]);
    const handleConfirm = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ResolveModal.useCallback[handleConfirm]": async ()=>{
            if (busy) return;
            setBusy(true);
            try {
                // Works for both sync (void) and async (Promise<void>) handlers
                await Promise.resolve(onConfirm());
            } finally{
                setBusy(false);
            }
        }
    }["ResolveModal.useCallback[handleConfirm]"], [
        onConfirm,
        busy
    ]);
    if (!isOpen || !report) return null;
    const titleId = 'resolve-modal-title';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4",
        onMouseDown: handleBackdropClick,
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": titleId,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            ref: dialogRef,
            className: "bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 max-w-md w-full shadow-2xl",
            onMouseDown: (e)=>e.stopPropagation(),
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                    id: titleId,
                    className: "text-xl font-bold text-white mb-4 flex items-center",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__["CheckCircle"], {
                            className: "mr-2 text-green-400"
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/reports/ResolveModal.tsx",
                            lineNumber: 112,
                            columnNumber: 11
                        }, this),
                        "Resolve Report"
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/admin/reports/ResolveModal.tsx",
                    lineNumber: 111,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-gray-300 mb-4",
                    children: "Are you sure you want to mark this report as resolved without applying a ban?"
                }, void 0, false, {
                    fileName: "[project]/src/components/admin/reports/ResolveModal.tsx",
                    lineNumber: 116,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-[#222] rounded-lg p-3 mb-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm text-gray-400",
                            children: "Report Details:"
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/reports/ResolveModal.tsx",
                            lineNumber: 121,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-white text-sm mt-1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-gray-400",
                                    children: "Reporter:"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/admin/reports/ResolveModal.tsx",
                                    lineNumber: 124,
                                    columnNumber: 13
                                }, this),
                                ' ',
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureMessageDisplay"], {
                                    content: report.reporter,
                                    allowBasicFormatting: false,
                                    className: "inline",
                                    maxLength: 120
                                }, void 0, false, {
                                    fileName: "[project]/src/components/admin/reports/ResolveModal.tsx",
                                    lineNumber: 125,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/admin/reports/ResolveModal.tsx",
                            lineNumber: 123,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-white text-sm",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-gray-400",
                                    children: "Reportee:"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/admin/reports/ResolveModal.tsx",
                                    lineNumber: 134,
                                    columnNumber: 13
                                }, this),
                                ' ',
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureMessageDisplay"], {
                                    content: report.reportee,
                                    allowBasicFormatting: false,
                                    className: "inline",
                                    maxLength: 120
                                }, void 0, false, {
                                    fileName: "[project]/src/components/admin/reports/ResolveModal.tsx",
                                    lineNumber: 135,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/admin/reports/ResolveModal.tsx",
                            lineNumber: 133,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-white text-sm",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-gray-400",
                                    children: "Category:"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/admin/reports/ResolveModal.tsx",
                                    lineNumber: 144,
                                    columnNumber: 13
                                }, this),
                                ' ',
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(prettyCategory)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/admin/reports/ResolveModal.tsx",
                            lineNumber: 143,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-white text-sm",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-gray-400",
                                    children: "Severity:"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/admin/reports/ResolveModal.tsx",
                                    lineNumber: 149,
                                    columnNumber: 13
                                }, this),
                                ' ',
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(prettySeverity)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/admin/reports/ResolveModal.tsx",
                            lineNumber: 148,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/admin/reports/ResolveModal.tsx",
                    lineNumber: 120,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex gap-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            onClick: onClose,
                            className: "flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors",
                            "aria-label": "Cancel resolving report",
                            children: "Cancel"
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/reports/ResolveModal.tsx",
                            lineNumber: 155,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            ref: confirmBtnRef,
                            type: "button",
                            onClick: handleConfirm,
                            disabled: busy,
                            className: "flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center transition-colors",
                            "aria-label": "Confirm resolve without ban",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__["CheckCircle"], {
                                    size: 16,
                                    className: "mr-2"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/admin/reports/ResolveModal.tsx",
                                    lineNumber: 171,
                                    columnNumber: 13
                                }, this),
                                busy ? 'Resolving…' : 'Resolve Without Ban'
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/admin/reports/ResolveModal.tsx",
                            lineNumber: 163,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/admin/reports/ResolveModal.tsx",
                    lineNumber: 154,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/admin/reports/ResolveModal.tsx",
            lineNumber: 106,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/admin/reports/ResolveModal.tsx",
        lineNumber: 99,
        columnNumber: 5
    }, this);
}
_s(ResolveModal, "TDpJ9o93e8+QHqsAFBphDVZGDzs=");
_c = ResolveModal;
var _c;
__turbopack_context__.k.register(_c, "ResolveModal");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=src_components_admin_reports_ResolveModal_tsx_e3a8b4ab._.js.map