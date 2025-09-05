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
"[project]/src/hooks/seller-settings/useProfileSave.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/hooks/seller-settings/useProfileSave.ts
__turbopack_context__.s({
    "useProfileSave": ()=>useProfileSave
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/AuthContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/users.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$enhanced$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/users.service.enhanced.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <locals>");
var _s = __turbopack_context__.k.signature();
;
;
;
;
;
;
;
function useProfileSave() {
    _s();
    const { user, updateUser } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const [saveSuccess, setSaveSuccess] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [saveError, setSaveError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [isSaving, setIsSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Store the latest data for debounced saves
    const latestDataRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])({});
    const saveTimeoutRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const pendingSavePromiseRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Custom URL validator that accepts placeholders
    const validateProfilePicUrl = (url)=>{
        if (!url) return null;
        // Allow placeholder URLs
        if (url.includes('placeholder')) return url;
        // Allow relative URLs
        if (url.startsWith('/uploads/')) return url;
        // Allow http/https URLs
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        // Otherwise, consider it invalid
        return null;
    };
    const validateGalleryUrl = (url)=>{
        if (!url) return null;
        // Allow relative URLs
        if (url.startsWith('/uploads/')) return url;
        // Allow http/https URLs
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        // Otherwise, consider it invalid
        return null;
    };
    const validateAndSanitizeData = (data)=>{
        try {
            const sanitized = {};
            // Sanitize bio if provided
            if (data.bio !== undefined) {
                const sanitizedBio = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(data.bio);
                if (sanitizedBio.length > 500) {
                    setSaveError('Bio must be less than 500 characters');
                    return null;
                }
                sanitized.bio = sanitizedBio;
            }
            // Validate profile pic URL if provided
            if (data.profilePic !== undefined) {
                const sanitizedProfilePic = validateProfilePicUrl(data.profilePic);
                if (data.profilePic && !sanitizedProfilePic) {
                    setSaveError('Invalid profile picture URL');
                    return null;
                }
                sanitized.profilePic = sanitizedProfilePic;
            }
            // Validate subscription price if provided
            if (data.subscriptionPrice !== undefined) {
                const priceValidation = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].validateAmount(data.subscriptionPrice, {
                    min: 0,
                    max: 999.99,
                    allowDecimals: true
                });
                if (!priceValidation.valid) {
                    setSaveError(priceValidation.error || 'Invalid subscription price');
                    return null;
                }
                sanitized.subscriptionPrice = data.subscriptionPrice;
            }
            // Sanitize gallery images if provided
            if (data.galleryImages !== undefined) {
                const sanitizedGallery = data.galleryImages.map((url)=>validateGalleryUrl(url)).filter((url)=>url !== null);
                if (sanitizedGallery.length > 20) {
                    setSaveError('Maximum 20 gallery images allowed');
                    return null;
                }
                sanitized.galleryImages = sanitizedGallery;
            }
            return sanitized;
        } catch (error) {
            setSaveError('Data validation failed');
            return null;
        }
    };
    // Quick save for individual fields with optimistic updates
    const handleQuickSave = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useProfileSave.useCallback[handleQuickSave]": async (data)=>{
            if (!(user === null || user === void 0 ? void 0 : user.username)) {
                setSaveError('User not authenticated');
                return;
            }
            setSaveError('');
            // Validate and sanitize data
            const sanitizedData = validateAndSanitizeData(data);
            if (!sanitizedData) {
                return; // Error already set
            }
            try {
                console.log('[useProfileSave] Quick saving:', sanitizedData);
                // Use enhanced service for better caching
                let response;
                if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$enhanced$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["enhancedUsersService"] && typeof __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$enhanced$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["enhancedUsersService"].updateUserProfile === 'function') {
                    response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$enhanced$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["enhancedUsersService"].updateUserProfile(user.username, sanitizedData);
                } else if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usersService"] && typeof __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usersService"].updateUserProfile === 'function') {
                    response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usersService"].updateUserProfile(user.username, sanitizedData);
                } else {
                    response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiClient"].call("/users/".concat(user.username, "/profile"), {
                        method: 'PATCH',
                        body: JSON.stringify(sanitizedData)
                    });
                }
                if (response.success) {
                    console.log('[useProfileSave] Quick save successful');
                    // Update user in auth context if needed
                    const updates = {};
                    if (sanitizedData.bio !== undefined && sanitizedData.bio !== user.bio) {
                        updates.bio = sanitizedData.bio;
                    }
                    if (sanitizedData.profilePic !== undefined && sanitizedData.profilePic !== user.profilePicture) {
                        updates.profilePicture = sanitizedData.profilePic;
                    }
                    if (Object.keys(updates).length > 0 && updateUser) {
                        await updateUser(updates);
                    }
                    // Brief success indication
                    setSaveSuccess(true);
                    setTimeout({
                        "useProfileSave.useCallback[handleQuickSave]": ()=>setSaveSuccess(false)
                    }["useProfileSave.useCallback[handleQuickSave]"], 2000);
                } else {
                    var _response_error;
                    console.error('[useProfileSave] Quick save failed:', response.error);
                    setSaveError(((_response_error = response.error) === null || _response_error === void 0 ? void 0 : _response_error.message) || 'Failed to save');
                    setTimeout({
                        "useProfileSave.useCallback[handleQuickSave]": ()=>setSaveError('')
                    }["useProfileSave.useCallback[handleQuickSave]"], 3000);
                }
            } catch (error) {
                console.error('[useProfileSave] Error in quick save:', error);
                setSaveError('Failed to save. Please try again.');
                setTimeout({
                    "useProfileSave.useCallback[handleQuickSave]": ()=>setSaveError('')
                }["useProfileSave.useCallback[handleQuickSave]"], 3000);
            }
        }
    }["useProfileSave.useCallback[handleQuickSave]"], [
        user === null || user === void 0 ? void 0 : user.username,
        user === null || user === void 0 ? void 0 : user.bio,
        user === null || user === void 0 ? void 0 : user.profilePicture,
        updateUser
    ]);
    // Debounced save function
    const debouncedSave = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useProfileSave.useCallback[debouncedSave]": (data)=>{
            // Update the latest data
            latestDataRef.current = {
                ...latestDataRef.current,
                ...data
            };
            // Clear existing timeout
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            // Show saving indicator immediately
            setIsSaving(true);
            // Set new timeout for save
            saveTimeoutRef.current = setTimeout({
                "useProfileSave.useCallback[debouncedSave]": async ()=>{
                    const savePromise = handleQuickSave(latestDataRef.current);
                    pendingSavePromiseRef.current = savePromise;
                    await savePromise;
                    pendingSavePromiseRef.current = null;
                    latestDataRef.current = {};
                    setIsSaving(false);
                }
            }["useProfileSave.useCallback[debouncedSave]"], 1500); // Save after 1.5 seconds of inactivity
        }
    }["useProfileSave.useCallback[debouncedSave]"], [
        handleQuickSave
    ]);
    // Main save function (for explicit save button)
    const handleSave = async (data)=>{
        if (!(user === null || user === void 0 ? void 0 : user.username)) {
            setSaveError('User not authenticated');
            return;
        }
        // Cancel any pending debounced save
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
        }
        // Wait for any pending save to complete
        if (pendingSavePromiseRef.current) {
            await pendingSavePromiseRef.current;
        }
        setSaveError('');
        setIsSaving(true);
        // Validate and sanitize data
        const sanitizedData = validateAndSanitizeData(data);
        if (!sanitizedData) {
            setIsSaving(false);
            return; // Error already set
        }
        try {
            console.log('[useProfileSave] Saving profile for:', user.username);
            console.log('[useProfileSave] Data to save:', sanitizedData);
            // Use enhanced service for better caching
            let response;
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$enhanced$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["enhancedUsersService"] && typeof __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$enhanced$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["enhancedUsersService"].updateUserProfile === 'function') {
                console.log('[useProfileSave] Using enhancedUsersService.updateUserProfile');
                response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$enhanced$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["enhancedUsersService"].updateUserProfile(user.username, sanitizedData);
            } else if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usersService"] && typeof __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usersService"].updateUserProfile === 'function') {
                console.log('[useProfileSave] Using usersService.updateUserProfile');
                response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usersService"].updateUserProfile(user.username, sanitizedData);
            } else {
                console.log('[useProfileSave] Using direct API call');
                response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiClient"].call("/users/".concat(user.username, "/profile"), {
                    method: 'PATCH',
                    body: JSON.stringify(sanitizedData)
                });
            }
            if (response.success) {
                console.log('[useProfileSave] Profile saved successfully:', response.data);
                // Update user in auth context if bio or profile pic changed
                const updates = {};
                if (sanitizedData.bio && sanitizedData.bio !== user.bio) {
                    updates.bio = sanitizedData.bio;
                }
                if (sanitizedData.profilePic && sanitizedData.profilePic !== user.profilePicture) {
                    updates.profilePicture = sanitizedData.profilePic;
                }
                if (Object.keys(updates).length > 0 && updateUser) {
                    await updateUser(updates);
                }
                // Show success message
                setSaveSuccess(true);
                setTimeout(()=>setSaveSuccess(false), 3000);
            } else {
                var _response_error;
                console.error('[useProfileSave] Failed to save profile:', response.error);
                setSaveError(((_response_error = response.error) === null || _response_error === void 0 ? void 0 : _response_error.message) || 'Failed to save profile');
                setTimeout(()=>setSaveError(''), 5000);
            }
        } catch (error) {
            console.error('[useProfileSave] Error saving profile:', error);
            setSaveError('Failed to save profile. Please try again.');
            setTimeout(()=>setSaveError(''), 5000);
        } finally{
            setIsSaving(false);
        }
    };
    const handleSaveWithGallery = async (galleryImages)=>{
        if (!(user === null || user === void 0 ? void 0 : user.username)) {
            setSaveError('User not authenticated');
            return;
        }
        setSaveError('');
        setIsSaving(true);
        // Sanitize gallery URLs with custom validator
        const sanitizedGallery = galleryImages.map((url)=>validateGalleryUrl(url)).filter((url)=>url !== null).slice(0, 20); // Enforce max limit
        try {
            console.log('[useProfileSave] Updating gallery for:', user.username);
            console.log('[useProfileSave] Gallery images:', sanitizedGallery);
            // Update profile with just gallery images
            let response;
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$enhanced$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["enhancedUsersService"] && typeof __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$enhanced$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["enhancedUsersService"].updateUserProfile === 'function') {
                console.log('[useProfileSave] Updating gallery via enhancedUsersService');
                response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$enhanced$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["enhancedUsersService"].updateUserProfile(user.username, {
                    galleryImages: sanitizedGallery
                });
            } else if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usersService"] && typeof __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usersService"].updateUserProfile === 'function') {
                console.log('[useProfileSave] Updating gallery via usersService');
                response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usersService"].updateUserProfile(user.username, {
                    galleryImages: sanitizedGallery
                });
            } else {
                console.log('[useProfileSave] Updating gallery via direct API call');
                response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiClient"].call("/users/".concat(user.username, "/profile"), {
                    method: 'PATCH',
                    body: JSON.stringify({
                        galleryImages: sanitizedGallery
                    })
                });
            }
            if (!response.success) {
                var _response_error;
                console.error('[useProfileSave] Failed to save gallery:', response.error);
                setSaveError(((_response_error = response.error) === null || _response_error === void 0 ? void 0 : _response_error.message) || 'Failed to save gallery images');
                setTimeout(()=>setSaveError(''), 5000);
            } else {
                console.log('[useProfileSave] Gallery saved successfully');
                setSaveSuccess(true);
                setTimeout(()=>setSaveSuccess(false), 2000);
            }
        } catch (error) {
            console.error('[useProfileSave] Error saving gallery:', error);
            setSaveError('Failed to save gallery images');
            setTimeout(()=>setSaveError(''), 5000);
        } finally{
            setIsSaving(false);
        }
    };
    // Clean up on unmount - ensure pending saves complete
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useProfileSave.useEffect": ()=>{
            return ({
                "useProfileSave.useEffect": ()=>{
                    // Clear timeout
                    if (saveTimeoutRef.current) {
                        clearTimeout(saveTimeoutRef.current);
                    }
                    // If there's pending data, save it immediately
                    if (Object.keys(latestDataRef.current).length > 0) {
                        handleQuickSave(latestDataRef.current);
                    }
                }
            })["useProfileSave.useEffect"];
        }
    }["useProfileSave.useEffect"], [
        handleQuickSave
    ]);
    return {
        saveSuccess,
        saveError,
        isSaving,
        handleSave,
        handleSaveWithGallery,
        handleQuickSave,
        debouncedSave
    };
}
_s(useProfileSave, "e7nzumeR5aQI35JevKP/VlrzqSc=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/seller-settings/ProfileInfoCard.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/components/seller-settings/ProfileInfoCard.tsx
__turbopack_context__.s({
    "default": ()=>ProfileInfoCard
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-alert.js [app-client] (ecmascript) <export default as AlertCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-check-big.js [app-client] (ecmascript) <export default as CheckCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.js [app-client] (ecmascript) <export default as Loader2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/SecureInput.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/SecureMessageDisplay.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$seller$2d$settings$2f$useProfileSave$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/seller-settings/useProfileSave.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-client] (ecmascript) <export * as z>");
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
const PropsSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    username: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    bio: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().default(''),
    setBio: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].function().args(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()).returns(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].void()),
    preview: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().nullable().optional(),
    profilePic: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().nullable().optional(),
    subscriptionPrice: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().default(''),
    setSubscriptionPrice: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].function().args(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()).returns(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].void()),
    handleProfilePicChange: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].function().args(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].any()).returns(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].void()),
    removeProfilePic: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].function().args().returns(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].void()),
    profilePicInputRef: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].any(),
    isUploading: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().optional(),
    onSave: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].function().args().returns(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].promise(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean())).optional()
});
function ProfileInfoCard(rawProps) {
    _s();
    const parsed = PropsSchema.safeParse(rawProps);
    const { username, bio, setBio, preview, profilePic, subscriptionPrice, setSubscriptionPrice, handleProfilePicChange, removeProfilePic, profilePicInputRef, isUploading = false, onSave } = parsed.success ? parsed.data : {
        username: '',
        bio: '',
        setBio: ()=>{},
        preview: null,
        profilePic: null,
        subscriptionPrice: '',
        setSubscriptionPrice: ()=>{},
        handleProfilePicChange: ()=>{},
        removeProfilePic: ()=>{},
        profilePicInputRef: {
            current: null
        },
        isUploading: false,
        onSave: undefined
    };
    const { debouncedSave, isSaving, saveSuccess, saveError } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$seller$2d$settings$2f$useProfileSave$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useProfileSave"])();
    const [fileError, setFileError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [touched, setTouched] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [lastSavedPrice, setLastSavedPrice] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(subscriptionPrice);
    const [showPriceSaving, setShowPriceSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Sanitize username for display
    const sanitizedUsername = username ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(username) : '';
    // Handle secure file selection
    const handleSecureFileChange = (e)=>{
        var _e_target_files;
        setFileError('');
        const file = (_e_target_files = e.target.files) === null || _e_target_files === void 0 ? void 0 : _e_target_files[0];
        if (!file) return;
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
        if (!validation.valid) {
            setFileError(validation.error || 'Invalid file');
            try {
                if (e.target) e.target.value = '';
            } catch (e) {
            /* ignore */ }
            return;
        }
        // If valid, proceed with the original handler
        handleProfilePicChange(e);
    };
    // Handle price change with auto-save
    const handlePriceChange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ProfileInfoCard.useCallback[handlePriceChange]": (value)=>{
            if (value === '') {
                setSubscriptionPrice('');
                setShowPriceSaving(true);
                debouncedSave({
                    subscriptionPrice: '0'
                });
            } else {
                const sanitized = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeCurrency"])(value);
                const sanitizedStr = sanitized.toString();
                setSubscriptionPrice(sanitizedStr);
                setShowPriceSaving(true);
                debouncedSave({
                    subscriptionPrice: sanitizedStr
                });
            }
        }
    }["ProfileInfoCard.useCallback[handlePriceChange]"], [
        setSubscriptionPrice,
        debouncedSave
    ]);
    // Handle bio change with auto-save
    const handleBioChange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ProfileInfoCard.useCallback[handleBioChange]": (value)=>{
            setBio(value);
            debouncedSave({
                bio: value
            });
        }
    }["ProfileInfoCard.useCallback[handleBioChange]"], [
        setBio,
        debouncedSave
    ]);
    // Track when price is actually saved
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ProfileInfoCard.useEffect": ()=>{
            if (saveSuccess && showPriceSaving) {
                setLastSavedPrice(subscriptionPrice);
                setShowPriceSaving(false);
            }
        }
    }["ProfileInfoCard.useEffect"], [
        saveSuccess,
        subscriptionPrice,
        showPriceSaving
    ]);
    // Clear saving indicator when error occurs
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ProfileInfoCard.useEffect": ()=>{
            if (saveError && showPriceSaving) {
                setShowPriceSaving(false);
            }
        }
    }["ProfileInfoCard.useEffect"], [
        saveError,
        showPriceSaving
    ]);
    // Keyboard access for overlay
    const onOverlayKey = (ev)=>{
        if (ev.key === 'Enter' || ev.key === ' ') {
            var _profilePicInputRef_current;
            ev.preventDefault();
            (_profilePicInputRef_current = profilePicInputRef.current) === null || _profilePicInputRef_current === void 0 ? void 0 : _profilePicInputRef_current.click();
        }
    };
    // Calculate if there are unsaved changes
    const hasUnsavedChanges = subscriptionPrice !== lastSavedPrice;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-[#1a1a1a] rounded-xl shadow-lg border border-gray-800 p-6 relative",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute top-4 right-4 flex items-center gap-2",
                children: [
                    isSaving && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2 text-yellow-500 text-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                className: "w-4 h-4 animate-spin"
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller-settings/ProfileInfoCard.tsx",
                                lineNumber: 150,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "Saving..."
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller-settings/ProfileInfoCard.tsx",
                                lineNumber: 151,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/seller-settings/ProfileInfoCard.tsx",
                        lineNumber: 149,
                        columnNumber: 11
                    }, this),
                    saveSuccess && !isSaving && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2 text-green-500 text-sm animate-fade-in",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__["CheckCircle"], {
                                className: "w-4 h-4"
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller-settings/ProfileInfoCard.tsx",
                                lineNumber: 156,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "Saved"
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller-settings/ProfileInfoCard.tsx",
                                lineNumber: 157,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/seller-settings/ProfileInfoCard.tsx",
                        lineNumber: 155,
                        columnNumber: 11
                    }, this),
                    saveError && !isSaving && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2 text-red-500 text-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                                className: "w-4 h-4"
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller-settings/ProfileInfoCard.tsx",
                                lineNumber: 162,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(saveError)
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller-settings/ProfileInfoCard.tsx",
                                lineNumber: 163,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/seller-settings/ProfileInfoCard.tsx",
                        lineNumber: 161,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/seller-settings/ProfileInfoCard.tsx",
                lineNumber: 147,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "text-xl font-bold mb-6 text-white",
                children: "Profile Info"
            }, void 0, false, {
                fileName: "[project]/src/components/seller-settings/ProfileInfoCard.tsx",
                lineNumber: 168,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col items-center mb-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-32 h-32 rounded-full border-4 border-[#ff950e] bg-black flex items-center justify-center overflow-hidden mb-4 shadow-lg relative group",
                        children: [
                            isUploading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-col items-center justify-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-8 h-8 border-2 border-[#ff950e] border-t-transparent rounded-full animate-spin mb-2"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/seller-settings/ProfileInfoCard.tsx",
                                        lineNumber: 175,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs text-[#ff950e]",
                                        children: "Uploading..."
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/seller-settings/ProfileInfoCard.tsx",
                                        lineNumber: 176,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/seller-settings/ProfileInfoCard.tsx",
                                lineNumber: 174,
                                columnNumber: 13
                            }, this) : preview || profilePic ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureImage"], {
                                src: preview || profilePic || '',
                                alt: "Profile preview",
                                className: "w-full h-full object-cover"
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller-settings/ProfileInfoCard.tsx",
                                lineNumber: 179,
                                columnNumber: 13
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-full h-full bg-gray-700 flex items-center justify-center text-gray-400 text-4xl font-bold",
                                children: sanitizedUsername ? sanitizedUsername.charAt(0).toUpperCase() : '?'
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller-settings/ProfileInfoCard.tsx",
                                lineNumber: 181,
                                columnNumber: 13
                            }, this),
                            !isUploading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer",
                                onClick: ()=>{
                                    var _profilePicInputRef_current;
                                    return (_profilePicInputRef_current = profilePicInputRef.current) === null || _profilePicInputRef_current === void 0 ? void 0 : _profilePicInputRef_current.click();
                                },
                                role: "button",
                                tabIndex: 0,
                                onKeyDown: onOverlayKey,
                                "aria-label": "Change profile photo",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-white text-xs font-medium bg-[#ff950e] rounded-full px-3 py-1",
                                    children: "Change Photo"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/seller-settings/ProfileInfoCard.tsx",
                                    lineNumber: 195,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller-settings/ProfileInfoCard.tsx",
                                lineNumber: 187,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/seller-settings/ProfileInfoCard.tsx",
                        lineNumber: 172,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        ref: profilePicInputRef,
                        type: "file",
                        accept: "image/*",
                        onChange: handleSecureFileChange,
                        className: "hidden",
                        disabled: isUploading
                    }, void 0, false, {
                        fileName: "[project]/src/components/seller-settings/ProfileInfoCard.tsx",
                        lineNumber: 200,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureImage"], {
                        src: "/Upload_New_Picture.png",
                        alt: "Upload New Picture",
                        onClick: ()=>{
                            var _profilePicInputRef_current;
                            return !isUploading && ((_profilePicInputRef_current = profilePicInputRef.current) === null || _profilePicInputRef_current === void 0 ? void 0 : _profilePicInputRef_current.click());
                        },
                        className: "w-24 h-auto object-contain transition-transform duration-200 ".concat(isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]')
                    }, void 0, false, {
                        fileName: "[project]/src/components/seller-settings/ProfileInfoCard.tsx",
                        lineNumber: 209,
                        columnNumber: 9
                    }, this),
                    fileError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-2 text-xs text-red-400 flex items-center gap-1",
                        role: "alert",
                        "aria-live": "assertive",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                                className: "w-3 h-3"
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller-settings/ProfileInfoCard.tsx",
                                lineNumber: 221,
                                columnNumber: 13
                            }, this),
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(fileError)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/seller-settings/ProfileInfoCard.tsx",
                        lineNumber: 220,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/seller-settings/ProfileInfoCard.tsx",
                lineNumber: 171,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-6 w-full",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureTextarea"], {
                        label: "Bio",
                        id: "bio",
                        name: "bio",
                        value: bio,
                        onChange: handleBioChange,
                        onBlur: ()=>setTouched((prev)=>({
                                    ...prev,
                                    bio: true
                                })),
                        className: "w-full p-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff950e] h-28 resize-none",
                        placeholder: "Tell buyers about yourself...",
                        maxLength: 500,
                        characterCount: true,
                        helpText: "Describe yourself, your style, and what makes your items special",
                        touched: touched.bio
                    }, void 0, false, {
                        fileName: "[project]/src/components/seller-settings/ProfileInfoCard.tsx",
                        lineNumber: 229,
                        columnNumber: 9
                    }, this),
                    isSaving && touched.bio && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs text-yellow-500 mt-1",
                        children: "Auto-saving bio..."
                    }, void 0, false, {
                        fileName: "[project]/src/components/seller-settings/ProfileInfoCard.tsx",
                        lineNumber: 244,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/seller-settings/ProfileInfoCard.tsx",
                lineNumber: 228,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-4 w-full",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "block text-sm font-medium text-gray-300 mb-2",
                        children: [
                            "Subscription Price ($/month)",
                            showPriceSaving && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "ml-2 text-yellow-500 text-xs",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                        className: "inline w-3 h-3 animate-spin mr-1"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/seller-settings/ProfileInfoCard.tsx",
                                        lineNumber: 254,
                                        columnNumber: 15
                                    }, this),
                                    "Saving..."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/seller-settings/ProfileInfoCard.tsx",
                                lineNumber: 253,
                                columnNumber: 13
                            }, this),
                            !showPriceSaving && hasUnsavedChanges && !isSaving && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "ml-2 text-orange-500 text-xs",
                                children: "• Unsaved"
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller-settings/ProfileInfoCard.tsx",
                                lineNumber: 259,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/seller-settings/ProfileInfoCard.tsx",
                        lineNumber: 250,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureInput"], {
                        id: "subscriptionPrice",
                        name: "subscriptionPrice",
                        type: "number",
                        value: subscriptionPrice,
                        onChange: handlePriceChange,
                        onBlur: ()=>setTouched((prev)=>({
                                    ...prev,
                                    price: true
                                })),
                        className: "w-full px-4 py-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff950e]",
                        placeholder: "19.99",
                        min: "0",
                        max: "999.99",
                        step: "0.01",
                        touched: touched.price,
                        helpText: "This is what buyers will pay to access your premium content (auto-saves as you type)"
                    }, void 0, false, {
                        fileName: "[project]/src/components/seller-settings/ProfileInfoCard.tsx",
                        lineNumber: 262,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/seller-settings/ProfileInfoCard.tsx",
                lineNumber: 249,
                columnNumber: 7
            }, this),
            onSave && hasUnsavedChanges && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-4 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-sm text-yellow-500 flex items-center gap-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                            className: "w-4 h-4"
                        }, void 0, false, {
                            fileName: "[project]/src/components/seller-settings/ProfileInfoCard.tsx",
                            lineNumber: 283,
                            columnNumber: 13
                        }, this),
                        'You have unsaved changes. Click "Save Profile" to save all changes.'
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/seller-settings/ProfileInfoCard.tsx",
                    lineNumber: 282,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/seller-settings/ProfileInfoCard.tsx",
                lineNumber: 281,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/seller-settings/ProfileInfoCard.tsx",
        lineNumber: 145,
        columnNumber: 5
    }, this);
}
_s(ProfileInfoCard, "9RNbrdyztSaSxUaB3MJy5ownKd0=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$seller$2d$settings$2f$useProfileSave$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useProfileSave"]
    ];
});
_c = ProfileInfoCard;
var _c;
__turbopack_context__.k.register(_c, "ProfileInfoCard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/utils/sellerTiers.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/utils/sellerTiers.ts
// Import Order type from shared types to avoid circular dependencies
__turbopack_context__.s({
    "TIER_LEVELS": ()=>TIER_LEVELS,
    "calculateTierInfo": ()=>calculateTierInfo,
    "getSellerTier": ()=>getSellerTier,
    "getSellerTierMemoized": ()=>getSellerTierMemoized
});
const TIER_LEVELS = {
    None: {
        tier: 'None',
        credit: 0,
        minSales: 0,
        minAmount: 0,
        badgeImage: '',
        color: 'gray'
    },
    Tease: {
        tier: 'Tease',
        credit: 0,
        minSales: 0,
        minAmount: 0,
        badgeImage: '/Tease_Badge.png',
        color: 'gray'
    },
    Flirt: {
        tier: 'Flirt',
        credit: 0.01,
        minSales: 10,
        minAmount: 5000,
        badgeImage: '/Flirt_Badge.png',
        color: 'pink'
    },
    Obsession: {
        tier: 'Obsession',
        credit: 0.02,
        minSales: 101,
        minAmount: 12500,
        badgeImage: '/Obsession_Badge.png',
        color: 'purple'
    },
    Desire: {
        tier: 'Desire',
        credit: 0.03,
        minSales: 251,
        minAmount: 75000,
        badgeImage: '/Desire_Badge.png',
        color: 'blue'
    },
    Goddess: {
        tier: 'Goddess',
        credit: 0.05,
        minSales: 1001,
        minAmount: 150000,
        badgeImage: '/Goddess_Badge.png',
        color: 'amber'
    }
};
const getSellerTier = (sellerUsername, orderHistory)=>{
    if (!sellerUsername) {
        return TIER_LEVELS.None;
    }
    // Filter orders for this seller
    const sellerOrders = orderHistory.filter((order)=>order.seller === sellerUsername);
    // Calculate total sales count and amount
    const totalSales = sellerOrders.length;
    const totalAmount = sellerOrders.reduce((sum, order)=>{
        var _order_price;
        return sum + ((_order_price = order === null || order === void 0 ? void 0 : order.price) !== null && _order_price !== void 0 ? _order_price : 0);
    }, 0);
    // Determine tier based on either sales count OR total amount
    // Check from highest to lowest to ensure correct tier assignment
    if (totalSales >= TIER_LEVELS.Goddess.minSales || totalAmount >= TIER_LEVELS.Goddess.minAmount) {
        return TIER_LEVELS.Goddess;
    } else if (totalSales >= TIER_LEVELS.Desire.minSales || totalAmount >= TIER_LEVELS.Desire.minAmount) {
        return TIER_LEVELS.Desire;
    } else if (totalSales >= TIER_LEVELS.Obsession.minSales || totalAmount >= TIER_LEVELS.Obsession.minAmount) {
        return TIER_LEVELS.Obsession;
    } else if (totalSales >= TIER_LEVELS.Flirt.minSales || totalAmount >= TIER_LEVELS.Flirt.minAmount) {
        return TIER_LEVELS.Flirt;
    } else {
        return TIER_LEVELS.Tease;
    }
};
// Cache tier calculations to prevent redundant calculations
// and avoid re-render loops
const tierCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour cache TTL
const getSellerTierMemoized = (sellerUsername, orderHistory)=>{
    if (!sellerUsername) {
        return TIER_LEVELS.None;
    }
    const now = Date.now();
    const cacheKey = "".concat(sellerUsername, ":").concat(orderHistory.length);
    const cachedValue = tierCache.get(cacheKey);
    // Use cached value if it exists and hasn't expired
    if (cachedValue && now - cachedValue.timestamp < CACHE_TTL) {
        return cachedValue.tier;
    }
    // Calculate new tier
    const tier = getSellerTier(sellerUsername, orderHistory);
    // Cache the result
    tierCache.set(cacheKey, {
        tier,
        timestamp: now
    });
    return tier;
};
const calculateTierInfo = getSellerTierMemoized;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/TierBadge.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/components/TierBadge.tsx
__turbopack_context__.s({
    "default": ()=>__TURBOPACK__default__export__
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$sellerTiers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/sellerTiers.ts [app-client] (ecmascript)");
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
// Valid tier levels for validation
const VALID_TIER_LEVELS = [
    'None',
    'Tease',
    'Flirt',
    'Obsession',
    'Desire',
    'Goddess'
];
const VALID_SIZES = [
    'sm',
    'md',
    'lg',
    'xl',
    '2xl'
];
// Get user-friendly tier number
const getTierNumber = (tierName)=>{
    const tierMap = {
        None: '0',
        Tease: 'tier 1',
        Flirt: 'tier 2',
        Obsession: 'tier 3',
        Desire: 'tier 4',
        Goddess: 'tier 5'
    };
    return tierMap[tierName] || 'tier 1';
};
// Get display name (capitalize first letter) with sanitization
const getTierDisplayName = (tierName)=>{
    const sanitized = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(tierName);
    return sanitized.charAt(0).toUpperCase() + sanitized.slice(1);
};
// Get tier-specific colors for text
const getTierColor = (tierName)=>{
    const tierColorMap = {
        None: '#ffffff',
        Tease: '#e37c89',
        Flirt: '#711b2a',
        Obsession: '#2e0c29',
        Desire: '#541831',
        Goddess: '#fddc93'
    };
    return tierColorMap[tierName] || '#e37c89';
};
const sizeClasses = {
    sm: {
        image: 20,
        tooltip: 'w-48'
    },
    md: {
        image: 32,
        tooltip: 'w-52'
    },
    lg: {
        image: 48,
        tooltip: 'w-56'
    },
    xl: {
        image: 64,
        tooltip: 'w-60'
    },
    '2xl': {
        image: 96,
        tooltip: 'w-64'
    }
};
const TierBadge = (param)=>{
    let { tier = 'Tease', size = 'md', showTooltip = true, className = '' } = param;
    var _sizeClasses_validatedSize, _sizeClasses_validatedSize1;
    _s();
    const [showDetails, setShowDetails] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const validatedTier = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "TierBadge.useMemo[validatedTier]": ()=>tier && VALID_TIER_LEVELS.includes(tier) ? tier : 'Tease'
    }["TierBadge.useMemo[validatedTier]"], [
        tier
    ]);
    const validatedSize = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "TierBadge.useMemo[validatedSize]": ()=>VALID_SIZES.includes(size) ? size : 'md'
    }["TierBadge.useMemo[validatedSize]"], [
        size
    ]);
    // If no tier provided or "None", don't render anything
    if (!tier || tier === 'None') {
        return null;
    }
    const tierInfo = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$sellerTiers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TIER_LEVELS"][validatedTier] || __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$sellerTiers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TIER_LEVELS"].Tease;
    const imageSize = ((_sizeClasses_validatedSize = sizeClasses[validatedSize]) === null || _sizeClasses_validatedSize === void 0 ? void 0 : _sizeClasses_validatedSize.image) || 64;
    // Sanitize numerical values
    const sanitizedMinSales = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeNumber"])(tierInfo.minSales, 0, 999_999, 0);
    const sanitizedMinAmount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeNumber"])(tierInfo.minAmount, 0, 9_999_999, 2);
    const sanitizedCredit = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeNumber"])(tierInfo.credit, 0, 1, 2);
    const safeClass = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(className);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative inline-block ".concat(safeClass),
        onMouseEnter: ()=>showTooltip && setShowDetails(true),
        onMouseLeave: ()=>showTooltip && setShowDetails(false),
        children: [
            tierInfo.badgeImage ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-center",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    src: tierInfo.badgeImage,
                    alt: "".concat(getTierDisplayName(validatedTier), " Seller Badge"),
                    width: imageSize,
                    height: imageSize,
                    className: "object-contain drop-shadow-lg",
                    quality: 100,
                    priority: validatedSize === 'xl' || validatedSize === '2xl'
                }, void 0, false, {
                    fileName: "[project]/src/components/TierBadge.tsx",
                    lineNumber: 102,
                    columnNumber: 11
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/TierBadge.tsx",
                lineNumber: 101,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-center",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "font-bold text-center text-xl",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureMessageDisplay"], {
                        content: validatedTier.charAt(0),
                        allowBasicFormatting: false
                    }, void 0, false, {
                        fileName: "[project]/src/components/TierBadge.tsx",
                        lineNumber: 115,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/src/components/TierBadge.tsx",
                    lineNumber: 114,
                    columnNumber: 11
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/TierBadge.tsx",
                lineNumber: 113,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            showDetails && showTooltip && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute z-10 ".concat(((_sizeClasses_validatedSize1 = sizeClasses[validatedSize]) === null || _sizeClasses_validatedSize1 === void 0 ? void 0 : _sizeClasses_validatedSize1.tooltip) || 'w-60', " bg-[#1a1a1a] rounded-md shadow-lg p-4 text-sm border border-gray-700 -translate-x-1/2 left-1/2 mt-1"),
                role: "tooltip",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "font-bold text-center mb-2",
                        style: {
                            color: getTierColor(validatedTier)
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureMessageDisplay"], {
                            content: "".concat(getTierDisplayName(validatedTier), " ").concat(validatedTier !== 'Goddess' ? 'Seller' : ''),
                            allowBasicFormatting: false
                        }, void 0, false, {
                            fileName: "[project]/src/components/TierBadge.tsx",
                            lineNumber: 129,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/src/components/TierBadge.tsx",
                        lineNumber: 128,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-gray-200 space-y-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: [
                                    "This seller is ",
                                    getTierNumber(validatedTier),
                                    " out of 5 as they have:"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/TierBadge.tsx",
                                lineNumber: 136,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: [
                                    "• ",
                                    sanitizedMinSales.toLocaleString(),
                                    "+ sales ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-gray-400",
                                        children: "OR"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/TierBadge.tsx",
                                        lineNumber: 138,
                                        columnNumber: 61
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/TierBadge.tsx",
                                lineNumber: 137,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: [
                                    "• $",
                                    sanitizedMinAmount.toLocaleString(),
                                    "+ in total sales"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/TierBadge.tsx",
                                lineNumber: 140,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "pt-1 text-[#ff950e] font-medium",
                                children: [
                                    "This seller earns an extra ",
                                    (sanitizedCredit * 100).toFixed(0),
                                    "% on all sales made"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/TierBadge.tsx",
                                lineNumber: 141,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/TierBadge.tsx",
                        lineNumber: 135,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/TierBadge.tsx",
                lineNumber: 122,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/TierBadge.tsx",
        lineNumber: 94,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(TierBadge, "pJgdv4lW+j1bQGMqJ1aKE8Fmuug=");
_c = TierBadge;
const __TURBOPACK__default__export__ = TierBadge;
var _c;
__turbopack_context__.k.register(_c, "TierBadge");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/utils/url.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/utils/url.ts
/**
 * Resolve relative file paths (e.g., "/uploads/xyz.jpg") to an absolute backend URL.
 * This assumes NEXT_PUBLIC_API_BASE_URL looks like "http://localhost:5000/api" in dev
 * and strips the trailing "/api" for static files.
 */ __turbopack_context__.s({
    "formatCurrency": ()=>formatCurrency,
    "resolveApiUrl": ()=>resolveApiUrl,
    "safeImageSrc": ()=>safeImageSrc
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
function resolveApiUrl(path) {
    if (!path) return null;
    // Already absolute http(s)
    if (/^https?:\/\//i.test(path)) return path;
    // Reject dangerous schemes outright (javascript:, data:, vbscript:, etc.)
    if (!/^(\/|https?:)/i.test(path)) return null;
    if (/^(javascript|vbscript|data):/i.test(path)) return null;
    const apiBase = ("TURBOPACK compile-time value", "http://localhost:5000") || 'http://localhost:5000/api';
    const baseHost = apiBase.replace(/\/api\/?$/, '').replace(/\/$/, ''); // strip trailing /api and trailing slash
    const normalized = path.startsWith('/') ? path : "/".concat(path);
    return "".concat(baseHost).concat(normalized);
}
function safeImageSrc(input, options) {
    var _options_placeholder;
    const placeholder = (_options_placeholder = options === null || options === void 0 ? void 0 : options.placeholder) !== null && _options_placeholder !== void 0 ? _options_placeholder : '/placeholder-image.png';
    if (!input) return placeholder;
    // Already http(s) — accept
    if (/^https?:\/\//i.test(input)) return input;
    // Unsafe schemes
    if (/^(javascript|vbscript|data):/i.test(input)) return placeholder;
    // Relative path — resolve against backend host
    const resolved = resolveApiUrl(input);
    return resolved !== null && resolved !== void 0 ? resolved : placeholder;
}
function formatCurrency(value) {
    const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
    return "$".concat(n.toFixed(2));
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/seller-settings/TierProgressCard.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/components/seller-settings/TierProgressCard.tsx
__turbopack_context__.s({
    "default": ()=>TierProgressCard
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$award$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Award$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/award.js [app-client] (ecmascript) <export default as Award>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$crown$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Crown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/crown.js [app-client] (ecmascript) <export default as Crown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/star.js [app-client] (ecmascript) <export default as Star>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$gift$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Gift$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/gift.js [app-client] (ecmascript) <export default as Gift>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$target$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Target$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/target.js [app-client] (ecmascript) <export default as Target>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$TierBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/TierBadge.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-client] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$url$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/url.ts [app-client] (ecmascript)");
'use client';
;
;
;
;
;
// Define TIER_LEVELS locally to match the structure with proper typing
const TIER_LEVELS = {
    None: {
        minSales: 0,
        minAmount: 0
    },
    Tease: {
        minSales: 0,
        minAmount: 0
    },
    Flirt: {
        minSales: 10,
        minAmount: 5000
    },
    Obsession: {
        minSales: 101,
        minAmount: 12500
    },
    Desire: {
        minSales: 251,
        minAmount: 75000
    },
    Goddess: {
        minSales: 1001,
        minAmount: 150000
    }
};
const VALID_TIERS = [
    'None',
    'Tease',
    'Flirt',
    'Obsession',
    'Desire',
    'Goddess'
];
function isTierLevel(v) {
    return typeof v === 'string' && VALID_TIERS.includes(v);
}
function normalizeTier(v) {
    if (isTierLevel(v)) return v;
    if (typeof v === 'string') {
        const s = v.trim().toLowerCase();
        switch(s){
            case 'none':
                return 'None';
            case 'tease':
                return 'Tease';
            case 'flirt':
                return 'Flirt';
            case 'obsession':
                return 'Obsession';
            case 'desire':
                return 'Desire';
            case 'goddess':
                return 'Goddess';
            default:
                return null;
        }
    }
    return null;
}
const PropsSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    sellerTierInfo: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        tier: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].unknown()
    }),
    userStats: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        totalSales: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().nonnegative().catch(0),
        totalRevenue: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().nonnegative().catch(0)
    }),
    tierProgress: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        salesProgress: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().nonnegative().catch(0),
        revenueProgress: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().nonnegative().catch(0)
    }),
    nextTier: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].unknown(),
    onTierClick: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].function().args(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].unknown()).returns(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].void())
});
function clampPercent(n) {
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, n));
}
function getTierIcon(tier) {
    switch(tier){
        case 'Tease':
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__["Star"], {
                className: "w-5 h-5"
            }, void 0, false, {
                fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                lineNumber: 72,
                columnNumber: 14
            }, this);
        case 'Flirt':
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$gift$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Gift$3e$__["Gift"], {
                className: "w-5 h-5"
            }, void 0, false, {
                fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                lineNumber: 74,
                columnNumber: 14
            }, this);
        case 'Obsession':
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$award$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Award$3e$__["Award"], {
                className: "w-5 h-5"
            }, void 0, false, {
                fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                lineNumber: 76,
                columnNumber: 14
            }, this);
        case 'Desire':
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$crown$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Crown$3e$__["Crown"], {
                className: "w-5 h-5"
            }, void 0, false, {
                fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                lineNumber: 78,
                columnNumber: 14
            }, this);
        case 'Goddess':
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$target$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Target$3e$__["Target"], {
                className: "w-5 h-5"
            }, void 0, false, {
                fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                lineNumber: 80,
                columnNumber: 14
            }, this);
        default:
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$award$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Award$3e$__["Award"], {
                className: "w-5 h-5"
            }, void 0, false, {
                fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                lineNumber: 82,
                columnNumber: 14
            }, this);
    }
}
function TierProgressCard(rawProps) {
    const parsed = PropsSchema.safeParse(rawProps);
    const { sellerTierInfo, userStats, tierProgress, nextTier: rawNextTier, onTierClick } = parsed.success ? parsed.data : {
        sellerTierInfo: {
            tier: 'None'
        },
        userStats: {
            totalSales: 0,
            totalRevenue: 0
        },
        tierProgress: {
            salesProgress: 0,
            revenueProgress: 0
        },
        nextTier: 'Tease',
        onTierClick: ()=>{}
    };
    const currentTier = normalizeTier(sellerTierInfo.tier);
    var _normalizeTier;
    const nextTier = (_normalizeTier = normalizeTier(rawNextTier)) !== null && _normalizeTier !== void 0 ? _normalizeTier : 'Tease';
    if (!currentTier) return null;
    const currentRequirements = TIER_LEVELS[currentTier];
    const nextRequirements = TIER_LEVELS[nextTier];
    const salesPct = clampPercent(tierProgress.salesProgress);
    const revenuePct = clampPercent(tierProgress.revenueProgress);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-[#1a1a1a] rounded-xl shadow-lg border border-gray-800 p-6 relative overflow-hidden",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute top-0 right-0 opacity-10",
                children: getTierIcon(currentTier)
            }, void 0, false, {
                fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                lineNumber: 111,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "text-xl font-bold mb-6 text-white",
                children: "Seller Tier Progress"
            }, void 0, false, {
                fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                lineNumber: 113,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between mb-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-gray-400 mb-1",
                                children: "Current Tier"
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                                lineNumber: 118,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2",
                                children: [
                                    currentTier !== 'None' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$TierBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        tier: currentTier,
                                        size: "md"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                                        lineNumber: 120,
                                        columnNumber: 39
                                    }, this) : null,
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-lg font-bold text-white",
                                        children: currentTier
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                                        lineNumber: 121,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                                lineNumber: 119,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                        lineNumber: 117,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>onTierClick(currentTier),
                        className: "text-[#ff950e] text-sm hover:underline",
                        type: "button",
                        children: "View Details"
                    }, void 0, false, {
                        fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                        lineNumber: 124,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                lineNumber: 116,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-2 gap-4 mb-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-black rounded-lg p-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-gray-400",
                                children: "Total Sales"
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                                lineNumber: 132,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xl font-bold text-[#ff950e]",
                                children: userStats.totalSales
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                                lineNumber: 133,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                        lineNumber: 131,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-black rounded-lg p-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-gray-400",
                                children: "Total Revenue"
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                                lineNumber: 136,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xl font-bold text-[#ff950e]",
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$url$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCurrency"])(userStats.totalRevenue)
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                                lineNumber: 137,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                        lineNumber: 135,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                lineNumber: 130,
                columnNumber: 7
            }, this),
            currentTier !== 'Goddess' && nextRequirements && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between mb-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-gray-400",
                                children: [
                                    "Progress to ",
                                    nextTier
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                                lineNumber: 145,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$TierBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                tier: nextTier,
                                size: "sm"
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                                lineNumber: 146,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                        lineNumber: 144,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-between text-xs text-gray-400 mb-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: [
                                            "Sales: ",
                                            userStats.totalSales,
                                            "/",
                                            nextRequirements.minSales
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                                        lineNumber: 152,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: [
                                            salesPct.toFixed(0),
                                            "%"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                                        lineNumber: 155,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                                lineNumber: 151,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-full bg-gray-800 rounded-full h-2",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bg-gradient-to-r from-[#ff950e] to-[#ff6b00] h-2 rounded-full transition-all duration-500",
                                    style: {
                                        width: "".concat(salesPct, "%")
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                                    lineNumber: 158,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                                lineNumber: 157,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                        lineNumber: 150,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-between text-xs text-gray-400 mb-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: [
                                            "Revenue: ",
                                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$url$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCurrency"])(userStats.totalRevenue),
                                            "/",
                                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$url$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCurrency"])(nextRequirements.minAmount)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                                        lineNumber: 168,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: [
                                            revenuePct.toFixed(0),
                                            "%"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                                        lineNumber: 171,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                                lineNumber: 167,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-full bg-gray-800 rounded-full h-2",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bg-gradient-to-r from-[#ff950e] to-[#ff6b00] h-2 rounded-full transition-all duration-500",
                                    style: {
                                        width: "".concat(revenuePct, "%")
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                                    lineNumber: 174,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                                lineNumber: 173,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                        lineNumber: 166,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs text-gray-500 text-center mt-3",
                        children: [
                            "Reach both milestones to unlock ",
                            nextTier,
                            " tier"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                        lineNumber: 181,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                lineNumber: 143,
                columnNumber: 9
            }, this),
            currentTier === 'Goddess' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-black p-3 rounded-lg",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "font-bold",
                            children: "🎉 Maximum Tier Achieved!"
                        }, void 0, false, {
                            fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                            lineNumber: 189,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm",
                            children: "You've reached the highest seller tier"
                        }, void 0, false, {
                            fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                            lineNumber: 190,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                    lineNumber: 188,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
                lineNumber: 187,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/seller-settings/TierProgressCard.tsx",
        lineNumber: 110,
        columnNumber: 5
    }, this);
}
_c = TierProgressCard;
var _c;
__turbopack_context__.k.register(_c, "TierProgressCard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/seller-settings/GalleryManager.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/components/seller-settings/GalleryManager.tsx
__turbopack_context__.s({
    "default": ()=>GalleryManager
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trash-2.js [app-client] (ecmascript) <export default as Trash2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Upload$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/upload.js [app-client] (ecmascript) <export default as Upload>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Image$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/image.js [app-client] (ecmascript) <export default as Image>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-client] (ecmascript) <export * as z>");
'use client';
;
;
;
;
const MAX_GALLERY_IMAGES = 20;
const PropsSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    galleryImages: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()).default([]),
    selectedFiles: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].instanceof(File)).default([]),
    isUploading: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().default(false),
    uploadProgress: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(0).max(100).default(0),
    multipleFileInputRef: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].custom(),
    handleMultipleFileChange: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].function().args(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].any()).returns(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].void()),
    uploadGalleryImages: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].function().args().returns(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].void()),
    removeGalleryImage: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].function().args(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number()).returns(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].void()),
    removeSelectedFile: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].function().args(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number()).returns(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].void()),
    clearAllGalleryImages: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].function().args().returns(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].void())
});
function GalleryManager(props) {
    const parsed = PropsSchema.safeParse(props);
    const { galleryImages = [], selectedFiles = [], isUploading = false, uploadProgress = 0, multipleFileInputRef, handleMultipleFileChange, uploadGalleryImages, removeGalleryImage, removeSelectedFile, clearAllGalleryImages } = parsed.success ? parsed.data : props;
    // Wrap async functions to handle Promise return
    const handleUploadClick = ()=>{
        // Call the async function but don't await it (returns void)
        uploadGalleryImages();
    };
    const handleRemoveGalleryImage = (index)=>{
        // Call the function without awaiting
        removeGalleryImage(index);
    };
    const handleClearAll = ()=>{
        // Call the function without awaiting
        clearAllGalleryImages();
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-[#1a1a1a] rounded-xl p-6 border border-gray-800",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between mb-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-xl font-bold text-white flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Image$3e$__["Image"], {
                                className: "w-5 h-5 text-[#ff950e]"
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                                lineNumber: 61,
                                columnNumber: 11
                            }, this),
                            "Photo Gallery"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                        lineNumber: 60,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-sm text-gray-400",
                        children: [
                            galleryImages.length,
                            " / ",
                            MAX_GALLERY_IMAGES,
                            " images"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                        lineNumber: 64,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                lineNumber: 59,
                columnNumber: 7
            }, this),
            galleryImages.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between mb-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-sm font-medium text-gray-300",
                                children: "Current Gallery"
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                                lineNumber: 73,
                                columnNumber: 13
                            }, this),
                            galleryImages.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: handleClearAll,
                                className: "text-xs text-red-500 hover:text-red-400 transition",
                                disabled: isUploading,
                                type: "button",
                                children: "Clear All"
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                                lineNumber: 75,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                        lineNumber: 72,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3",
                        children: galleryImages.map((image, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "relative group aspect-square",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                        src: image,
                                        alt: "Gallery ".concat(index + 1),
                                        className: "w-full h-full object-cover rounded-lg border border-gray-700",
                                        loading: "lazy"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                                        lineNumber: 88,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>handleRemoveGalleryImage(index),
                                        className: "absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700",
                                        title: "Remove image",
                                        disabled: isUploading,
                                        type: "button",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                            className: "w-4 h-4"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                                            lineNumber: 101,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                                        lineNumber: 94,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, index, true, {
                                fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                                lineNumber: 87,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                        lineNumber: 85,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                lineNumber: 71,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-gray-600 transition",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Image$3e$__["Image"], {
                                className: "w-12 h-12 text-gray-500 mx-auto mb-3"
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                                lineNumber: 112,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-gray-400 mb-2",
                                children: galleryImages.length === 0 ? "Add photos to your gallery" : "Add more photos (".concat(MAX_GALLERY_IMAGES - galleryImages.length, " remaining)")
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                                lineNumber: 113,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                ref: multipleFileInputRef,
                                type: "file",
                                multiple: true,
                                accept: "image/*",
                                onChange: handleMultipleFileChange,
                                className: "hidden",
                                disabled: isUploading || galleryImages.length >= MAX_GALLERY_IMAGES
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                                lineNumber: 118,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>{
                                    var _multipleFileInputRef_current;
                                    return multipleFileInputRef === null || multipleFileInputRef === void 0 ? void 0 : (_multipleFileInputRef_current = multipleFileInputRef.current) === null || _multipleFileInputRef_current === void 0 ? void 0 : _multipleFileInputRef_current.click();
                                },
                                disabled: isUploading || galleryImages.length >= MAX_GALLERY_IMAGES,
                                className: "bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed",
                                type: "button",
                                children: "Select Images"
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                                lineNumber: 127,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-gray-500 mt-2",
                                children: "JPEG, JPG, PNG, or WebP • Max 10MB per file"
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                                lineNumber: 135,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                        lineNumber: 111,
                        columnNumber: 9
                    }, this),
                    selectedFiles.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-sm font-medium text-gray-300 mb-2",
                                children: [
                                    "Selected Files (",
                                    selectedFiles.length,
                                    ")"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                                lineNumber: 143,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-2 max-h-40 overflow-y-auto",
                                children: selectedFiles.map((file, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center justify-between p-2 bg-gray-800 rounded-lg",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Image$3e$__["Image"], {
                                                        className: "w-4 h-4 text-gray-400"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                                                        lineNumber: 153,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-sm text-gray-300 truncate max-w-[200px]",
                                                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(file.name)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                                                        lineNumber: 154,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-xs text-gray-500",
                                                        children: [
                                                            "(",
                                                            (file.size / 1024 / 1024).toFixed(2),
                                                            " MB)"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                                                        lineNumber: 157,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                                                lineNumber: 152,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>removeSelectedFile(index),
                                                className: "text-red-500 hover:text-red-400 transition p-1",
                                                disabled: isUploading,
                                                type: "button",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {
                                                    className: "w-4 h-4"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                                                    lineNumber: 167,
                                                    columnNumber: 21
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                                                lineNumber: 161,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, index, true, {
                                        fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                                        lineNumber: 148,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                                lineNumber: 146,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-4",
                                children: isUploading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center justify-between text-sm",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-gray-400",
                                                    children: "Uploading..."
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                                                    lineNumber: 178,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-[#ff950e]",
                                                    children: [
                                                        uploadProgress,
                                                        "%"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                                                    lineNumber: 179,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                                            lineNumber: 177,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "w-full bg-gray-700 rounded-full h-2 overflow-hidden",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "bg-[#ff950e] h-full transition-all duration-300",
                                                style: {
                                                    width: "".concat(uploadProgress, "%")
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                                                lineNumber: 182,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                                            lineNumber: 181,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                                    lineNumber: 176,
                                    columnNumber: 17
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: handleUploadClick,
                                    disabled: selectedFiles.length === 0,
                                    className: "w-full bg-[#ff950e] text-black font-bold py-2 rounded-lg hover:bg-[#e0850d] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
                                    type: "button",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Upload$3e$__["Upload"], {
                                            className: "w-4 h-4"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                                            lineNumber: 195,
                                            columnNumber: 19
                                        }, this),
                                        "Upload ",
                                        selectedFiles.length,
                                        " ",
                                        selectedFiles.length === 1 ? 'Image' : 'Images'
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                                    lineNumber: 189,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                                lineNumber: 174,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                        lineNumber: 142,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                lineNumber: 110,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-4 p-3 bg-gray-800 rounded-lg",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-xs text-gray-400",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                            className: "text-gray-300",
                            children: "Tips:"
                        }, void 0, false, {
                            fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                            lineNumber: 207,
                            columnNumber: 11
                        }, this),
                        " High-quality photos help attract more buyers. Consider adding variety with different angles and styles. All images are automatically optimized for web display."
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                    lineNumber: 206,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
                lineNumber: 205,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/seller-settings/GalleryManager.tsx",
        lineNumber: 58,
        columnNumber: 5
    }, this);
}
_c = GalleryManager;
var _c;
__turbopack_context__.k.register(_c, "GalleryManager");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/seller-settings/modals/TierDetailsModal.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/components/seller-settings/modals/TierDetailsModal.tsx
__turbopack_context__.s({
    "default": ()=>TierDetailsModal
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$award$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Award$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/award.js [app-client] (ecmascript) <export default as Award>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trending-up.js [app-client] (ecmascript) <export default as TrendingUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$crown$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Crown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/crown.js [app-client] (ecmascript) <export default as Crown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/star.js [app-client] (ecmascript) <export default as Star>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$gift$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Gift$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/gift.js [app-client] (ecmascript) <export default as Gift>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$target$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Target$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/target.js [app-client] (ecmascript) <export default as Target>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-check-big.js [app-client] (ecmascript) <export default as CheckCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$TierBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/TierBadge.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-client] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$url$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/url.ts [app-client] (ecmascript)");
'use client';
;
;
;
;
;
// ---- Runtime props validation + normalization ----
const PropsSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    selectedTier: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].unknown().nullable(),
    onClose: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].function().args().returns(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].void())
});
const VALID_TIERS = [
    'None',
    'Tease',
    'Flirt',
    'Obsession',
    'Desire',
    'Goddess'
];
function isTierLevel(v) {
    return typeof v === 'string' && VALID_TIERS.includes(v);
}
function normalizeTier(v) {
    if (isTierLevel(v)) return v;
    if (typeof v === 'string') {
        const s = v.trim().toLowerCase();
        switch(s){
            case 'none':
                return 'None';
            case 'tease':
                return 'Tease';
            case 'flirt':
                return 'Flirt';
            case 'obsession':
                return 'Obsession';
            case 'desire':
                return 'Desire';
            case 'goddess':
                return 'Goddess';
            default:
                return null;
        }
    }
    return null;
}
// ---- Tier data (kept local for this modal) ----
const TIER_LEVELS = {
    None: {
        minSales: 0,
        minAmount: 0
    },
    Tease: {
        minSales: 0,
        minAmount: 0
    },
    Flirt: {
        minSales: 10,
        minAmount: 5000
    },
    Obsession: {
        minSales: 101,
        minAmount: 12500
    },
    Desire: {
        minSales: 251,
        minAmount: 75000
    },
    Goddess: {
        minSales: 1001,
        minAmount: 150000
    }
};
function TierDetailsModal(rawProps) {
    // Validate props at runtime (safe defaults if parsing fails)
    const parsed = PropsSchema.safeParse(rawProps);
    const selectedTierRaw = parsed.success ? parsed.data.selectedTier : null;
    const onClose = parsed.success ? parsed.data.onClose : ()=>{};
    const selectedTier = normalizeTier(selectedTierRaw);
    // If invalid or 'None', don't render
    if (!selectedTier || selectedTier === 'None') return null;
    const tierInfo = TIER_LEVELS[selectedTier] || TIER_LEVELS.Tease;
    const tiers = [
        'Tease',
        'Flirt',
        'Obsession',
        'Desire',
        'Goddess'
    ];
    const getBenefitsForTier = (tier)=>{
        switch(tier){
            case 'Tease':
                return [
                    'Basic seller badge',
                    'Access to marketplace',
                    'Standard support'
                ];
            case 'Flirt':
                return [
                    '1% bonus on all sales',
                    'Flirt badge upgrade',
                    'Priority in search results'
                ];
            case 'Obsession':
                return [
                    '2% bonus on all sales',
                    'Obsession badge upgrade',
                    'Featured seller status'
                ];
            case 'Desire':
                return [
                    '3% bonus on all sales',
                    'Desire badge upgrade',
                    'Premium seller tools'
                ];
            case 'Goddess':
                return [
                    '5% bonus on all sales',
                    'Goddess badge upgrade',
                    'VIP seller status',
                    'Exclusive features'
                ];
            default:
                return [];
        }
    };
    const getTierIcon = (tier)=>{
        switch(tier){
            case 'Tease':
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__["Star"], {
                    className: "w-8 h-8"
                }, void 0, false, {
                    fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                    lineNumber: 92,
                    columnNumber: 16
                }, this);
            case 'Flirt':
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$gift$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Gift$3e$__["Gift"], {
                    className: "w-8 h-8"
                }, void 0, false, {
                    fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                    lineNumber: 94,
                    columnNumber: 16
                }, this);
            case 'Obsession':
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$award$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Award$3e$__["Award"], {
                    className: "w-8 h-8"
                }, void 0, false, {
                    fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                    lineNumber: 96,
                    columnNumber: 16
                }, this);
            case 'Desire':
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$crown$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Crown$3e$__["Crown"], {
                    className: "w-8 h-8"
                }, void 0, false, {
                    fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                    lineNumber: 98,
                    columnNumber: 16
                }, this);
            case 'Goddess':
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$target$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Target$3e$__["Target"], {
                    className: "w-8 h-8"
                }, void 0, false, {
                    fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                    lineNumber: 100,
                    columnNumber: 16
                }, this);
            default:
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$award$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Award$3e$__["Award"], {
                    className: "w-8 h-8"
                }, void 0, false, {
                    fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                    lineNumber: 102,
                    columnNumber: 16
                }, this);
        }
    };
    const getTierColor = (tier)=>{
        switch(tier){
            case 'Tease':
                return 'from-gray-500 to-gray-700';
            case 'Flirt':
                return 'from-blue-500 to-blue-700';
            case 'Obsession':
                return 'from-purple-500 to-purple-700';
            case 'Desire':
                return 'from-pink-500 to-pink-700';
            case 'Goddess':
                return 'from-[#ff950e] to-[#ff6b00]';
            default:
                return 'from-gray-500 to-gray-700';
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4",
        role: "dialog",
        "aria-modal": "true",
        "aria-label": "".concat(selectedTier, " Tier details"),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-[#1a1a1a] rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-gradient-to-r ".concat(getTierColor(selectedTier), " p-6 relative"),
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onClose,
                            className: "absolute top-4 right-4 text-white hover:text-gray-200",
                            type: "button",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                className: "w-6 h-6"
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                                lineNumber: 134,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                            lineNumber: 133,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-white",
                                    children: getTierIcon(selectedTier)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                                    lineNumber: 138,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "text-3xl font-bold text-white",
                                            children: [
                                                selectedTier,
                                                " Tier"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                                            lineNumber: 140,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-white/80",
                                            children: "Seller Achievement Level"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                                            lineNumber: 141,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                                    lineNumber: 139,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                            lineNumber: 137,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                    lineNumber: 132,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "p-6 space-y-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "text-lg font-bold text-white mb-3 flex items-center gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$target$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Target$3e$__["Target"], {
                                            className: "w-5 h-5 text-[#ff950e]"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                                            lineNumber: 151,
                                            columnNumber: 15
                                        }, this),
                                        "Requirements"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                                    lineNumber: 150,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-2 gap-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bg-black rounded-lg p-4",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-sm text-gray-400",
                                                    children: "Minimum Sales"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                                                    lineNumber: 156,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-2xl font-bold text-[#ff950e]",
                                                    children: tierInfo.minSales.toLocaleString()
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                                                    lineNumber: 157,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                                            lineNumber: 155,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bg-black rounded-lg p-4",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-sm text-gray-400",
                                                    children: "Minimum Revenue"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                                                    lineNumber: 160,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-2xl font-bold text-[#ff950e]",
                                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$url$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCurrency"])(tierInfo.minAmount)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                                                    lineNumber: 161,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                                            lineNumber: 159,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                                    lineNumber: 154,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                            lineNumber: 149,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "text-lg font-bold text-white mb-3 flex items-center gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__["CheckCircle"], {
                                            className: "w-5 h-5 text-green-500"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                                            lineNumber: 169,
                                            columnNumber: 15
                                        }, this),
                                        "Benefits"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                                    lineNumber: 168,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                    className: "space-y-2",
                                    children: getBenefitsForTier(selectedTier).map((benefit, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            className: "flex items-start gap-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-green-500 mt-1",
                                                    children: "✓"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                                                    lineNumber: 175,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-gray-300",
                                                    children: benefit
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                                                    lineNumber: 176,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, index, true, {
                                            fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                                            lineNumber: 174,
                                            columnNumber: 17
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                                    lineNumber: 172,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                            lineNumber: 167,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "text-lg font-bold text-white mb-3 flex items-center gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"], {
                                            className: "w-5 h-5 text-[#ff950e]"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                                            lineNumber: 185,
                                            columnNumber: 15
                                        }, this),
                                        "Tier Progression"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                                    lineNumber: 184,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center justify-between",
                                    children: tiers.map((tier, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex flex-col items-center ".concat(tier === selectedTier ? 'scale-110' : ''),
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$TierBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                            tier: tier,
                                                            size: "sm",
                                                            className: tier === selectedTier ? 'ring-2 ring-[#ff950e]' : 'opacity-60'
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                                                            lineNumber: 192,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-xs mt-1 ".concat(tier === selectedTier ? 'text-[#ff950e] font-bold' : 'text-gray-500'),
                                                            children: tier
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                                                            lineNumber: 193,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                                                    lineNumber: 191,
                                                    columnNumber: 19
                                                }, this),
                                                index < tiers.length - 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "w-8 h-0.5 bg-gray-700 mx-1"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                                                    lineNumber: 197,
                                                    columnNumber: 48
                                                }, this)
                                            ]
                                        }, tier, true, {
                                            fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                                            lineNumber: 190,
                                            columnNumber: 17
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                                    lineNumber: 188,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                            lineNumber: 183,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex justify-center pt-4",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: onClose,
                                className: "px-6 py-3 bg-[#ff950e] text-black font-bold rounded-lg hover:bg-[#e88800] transition",
                                type: "button",
                                children: "Got it!"
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                                lineNumber: 205,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                            lineNumber: 204,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
                    lineNumber: 147,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
            lineNumber: 130,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/seller-settings/modals/TierDetailsModal.tsx",
        lineNumber: 124,
        columnNumber: 5
    }, this);
}
_c = TierDetailsModal;
var _c;
__turbopack_context__.k.register(_c, "TierDetailsModal");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/seller-settings/utils/SaveButton.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/components/seller-settings/utils/SaveButton.tsx
__turbopack_context__.s({
    "default": ()=>SaveButton
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
'use client';
;
;
function SaveButton(param) {
    let { onClick, showSuccess = false, showError, isLoading = false } = param;
    // Convert boolean error to string if needed
    let errorMessage;
    if (typeof showError === 'string') {
        errorMessage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(showError);
    } else if (showError === true) {
        errorMessage = 'An error occurred';
    }
    // Handle click with proper async handling
    const handleClick = ()=>{
        // Call onClick and handle any potential promise
        Promise.resolve(onClick()).catch(console.error);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col items-center",
        children: [
            isLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-24 h-auto flex flex-col items-center justify-center p-3 bg-gray-800 rounded-lg",
                role: "status",
                "aria-live": "polite",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-6 h-6 border-2 border-[#ff950e] border-t-transparent rounded-full animate-spin mb-2"
                    }, void 0, false, {
                        fileName: "[project]/src/components/seller-settings/utils/SaveButton.tsx",
                        lineNumber: 42,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-xs text-[#ff950e]",
                        children: "Saving..."
                    }, void 0, false, {
                        fileName: "[project]/src/components/seller-settings/utils/SaveButton.tsx",
                        lineNumber: 43,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/seller-settings/utils/SaveButton.tsx",
                lineNumber: 37,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                onClick: handleClick,
                className: "cursor-pointer hover:scale-[1.02] transition-transform duration-200",
                "aria-label": "Save all profile changes",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                    src: "/Save_All_Button.png",
                    alt: "Save All Profile Changes",
                    className: "w-24 h-auto object-contain",
                    draggable: false
                }, void 0, false, {
                    fileName: "[project]/src/components/seller-settings/utils/SaveButton.tsx",
                    lineNumber: 52,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/seller-settings/utils/SaveButton.tsx",
                lineNumber: 46,
                columnNumber: 9
            }, this),
            showSuccess && !isLoading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-green-900 text-green-100 p-3 rounded-lg mt-3 text-center",
                role: "status",
                "aria-live": "polite",
                children: "✅ Profile updated successfully!"
            }, void 0, false, {
                fileName: "[project]/src/components/seller-settings/utils/SaveButton.tsx",
                lineNumber: 63,
                columnNumber: 9
            }, this),
            errorMessage && !isLoading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-red-900 text-red-100 p-3 rounded-lg mt-3 text-center max-w-xs",
                role: "alert",
                "aria-live": "assertive",
                children: [
                    "❌ ",
                    errorMessage
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/seller-settings/utils/SaveButton.tsx",
                lineNumber: 74,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/seller-settings/utils/SaveButton.tsx",
        lineNumber: 34,
        columnNumber: 5
    }, this);
}
_c = SaveButton;
var _c;
__turbopack_context__.k.register(_c, "SaveButton");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/seller-settings/TierDisplaySection.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/components/seller-settings/TierDisplaySection.tsx
__turbopack_context__.s({
    "default": ()=>TierDisplaySection
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$award$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Award$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/award.js [app-client] (ecmascript) <export default as Award>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trending-up.js [app-client] (ecmascript) <export default as TrendingUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/star.js [app-client] (ecmascript) <export default as Star>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$gift$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Gift$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/gift.js [app-client] (ecmascript) <export default as Gift>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$target$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Target$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/target.js [app-client] (ecmascript) <export default as Target>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$crown$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Crown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/crown.js [app-client] (ecmascript) <export default as Crown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$TierBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/TierBadge.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-client] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$url$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/url.ts [app-client] (ecmascript)");
'use client';
;
;
;
;
;
// Define TIER_LEVELS locally
const TIER_LEVELS = {
    None: {
        minSales: 0,
        minAmount: 0,
        credit: 0
    },
    Tease: {
        minSales: 0,
        minAmount: 0,
        credit: 0
    },
    Flirt: {
        minSales: 10,
        minAmount: 5000,
        credit: 0.01
    },
    Obsession: {
        minSales: 101,
        minAmount: 12500,
        credit: 0.02
    },
    Desire: {
        minSales: 251,
        minAmount: 75000,
        credit: 0.03
    },
    Goddess: {
        minSales: 1001,
        minAmount: 150000,
        credit: 0.05
    }
};
const VALID_TIERS = [
    'None',
    'Tease',
    'Flirt',
    'Obsession',
    'Desire',
    'Goddess'
];
function isTierLevel(v) {
    return typeof v === 'string' && VALID_TIERS.includes(v);
}
function normalizeTier(v) {
    if (isTierLevel(v)) return v;
    if (typeof v === 'string') {
        const s = v.trim().toLowerCase();
        switch(s){
            case 'none':
                return 'None';
            case 'tease':
                return 'Tease';
            case 'flirt':
                return 'Flirt';
            case 'obsession':
                return 'Obsession';
            case 'desire':
                return 'Desire';
            case 'goddess':
                return 'Goddess';
            default:
                return null;
        }
    }
    return null;
}
const PropsSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    sellerTierInfo: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        tier: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].unknown(),
        credit: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().optional()
    }),
    userStats: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        totalSales: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().nonnegative().catch(0),
        totalRevenue: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().nonnegative().catch(0)
    }),
    nextTier: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].unknown(),
    selectedTierDetails: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].unknown().nullable(),
    onTierSelect: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].function().args(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].unknown()).returns(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].void())
});
function TierDisplaySection(rawProps) {
    const parsed = PropsSchema.safeParse(rawProps);
    const { sellerTierInfo, userStats, nextTier: rawNextTier, selectedTierDetails: rawSelected, onTierSelect } = parsed.success ? parsed.data : {
        sellerTierInfo: {
            tier: 'None',
            credit: 0
        },
        userStats: {
            totalSales: 0,
            totalRevenue: 0
        },
        nextTier: 'Tease',
        selectedTierDetails: null,
        onTierSelect: ()=>{}
    };
    const currentTier = normalizeTier(sellerTierInfo.tier);
    var _normalizeTier;
    const nextTier = (_normalizeTier = normalizeTier(rawNextTier)) !== null && _normalizeTier !== void 0 ? _normalizeTier : 'Tease';
    const selectedTierDetails = normalizeTier(rawSelected);
    const credit = typeof sellerTierInfo.credit === 'number' && Number.isFinite(sellerTierInfo.credit) ? sellerTierInfo.credit : 0;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "mt-8 bg-gradient-to-r from-[#1a1a1a] to-[#272727] rounded-xl border border-gray-800 p-6 shadow-xl",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between flex-wrap gap-4 mb-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "pr-6 flex-shrink-0",
                                children: currentTier && currentTier !== 'None' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$TierBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    tier: currentTier,
                                    size: "2xl",
                                    showTooltip: true
                                }, void 0, false, {
                                    fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                    lineNumber: 94,
                                    columnNumber: 54
                                }, this) : null
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                lineNumber: 93,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "text-xl font-bold text-white mb-1 flex items-center",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$award$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Award$3e$__["Award"], {
                                                className: "w-5 h-5 mr-2 text-[#ff950e]"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                lineNumber: 98,
                                                columnNumber: 15
                                            }, this),
                                            "Your Seller Tier:",
                                            ' ',
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "ml-2 text-[#ff950e]",
                                                children: currentTier && currentTier !== 'None' ? currentTier : '—'
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                lineNumber: 100,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                        lineNumber: 97,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-gray-300",
                                        children: credit > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                            children: [
                                                "You earn an additional ",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-bold text-green-400",
                                                    children: [
                                                        (credit * 100).toFixed(0),
                                                        "%"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                    lineNumber: 105,
                                                    columnNumber: 42
                                                }, this),
                                                " on all your sales!"
                                            ]
                                        }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                            children: "Make more sales to earn additional credits on your sales"
                                        }, void 0, false)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                        lineNumber: 102,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                lineNumber: 96,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                        lineNumber: 92,
                        columnNumber: 9
                    }, this),
                    currentTier !== 'Goddess' && nextTier && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-[#111] border border-gray-800 rounded-lg p-3 shadow-inner",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-sm text-gray-400",
                                children: [
                                    "Next tier: ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "font-medium text-purple-400",
                                        children: nextTier
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                        lineNumber: 118,
                                        columnNumber: 26
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                lineNumber: 117,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"], {
                                        className: "w-4 h-4 text-green-400"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                        lineNumber: 121,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-green-300 text-sm",
                                        children: [
                                            "Need: ",
                                            TIER_LEVELS[nextTier].minSales.toLocaleString(),
                                            " sales or",
                                            ' ',
                                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$url$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCurrency"])(TIER_LEVELS[nextTier].minAmount)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                        lineNumber: 122,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                lineNumber: 120,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                        lineNumber: 116,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                lineNumber: 91,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-[#111] rounded-lg p-4 border border-gray-700",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "text-lg font-medium text-gray-300 mb-4 flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__["Star"], {
                                className: "w-5 h-5 text-[#ff950e]"
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                lineNumber: 134,
                                columnNumber: 11
                            }, this),
                            "All Seller Tiers ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-sm text-gray-500 font-normal",
                                children: "(Click to view details)"
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                lineNumber: 135,
                                columnNumber: 28
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                        lineNumber: 133,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-5 gap-3 mb-4",
                        children: [
                            'Tease',
                            'Flirt',
                            'Obsession',
                            'Desire',
                            'Goddess'
                        ].map((tier)=>{
                            const isCurrentTier = currentTier === tier;
                            const isSelected = selectedTierDetails === tier;
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>onTierSelect(isSelected ? null : tier),
                                className: "relative p-3 rounded-lg border-2 transition-all duration-300 ".concat(isCurrentTier ? 'border-[#ff950e] bg-[#ff950e]/10' : isSelected ? 'border-purple-400 bg-purple-400/10' : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'),
                                type: "button",
                                "aria-pressed": isSelected,
                                "aria-label": "View ".concat(tier, " details"),
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex flex-col items-center space-y-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$TierBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            tier: tier,
                                            size: "xl",
                                            showTooltip: false
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                            lineNumber: 160,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-center",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "font-medium text-white text-sm",
                                                    children: tier
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                    lineNumber: 162,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-xs text-gray-400",
                                                    children: [
                                                        "+",
                                                        (TIER_LEVELS[tier].credit * 100).toFixed(0),
                                                        "%"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                    lineNumber: 163,
                                                    columnNumber: 21
                                                }, this),
                                                isCurrentTier && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-xs text-[#ff950e] font-medium mt-1",
                                                    children: "Current"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                    lineNumber: 164,
                                                    columnNumber: 39
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                            lineNumber: 161,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                    lineNumber: 159,
                                    columnNumber: 17
                                }, this)
                            }, tier, false, {
                                fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                lineNumber: 145,
                                columnNumber: 15
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                        lineNumber: 139,
                        columnNumber: 9
                    }, this),
                    selectedTierDetails && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "border-t border-gray-700 pt-4 animate-in slide-in-from-top duration-300",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-[#0a0a0a] rounded-lg p-4 border border-gray-800",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-3 mb-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$TierBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            tier: selectedTierDetails,
                                            size: "lg",
                                            showTooltip: false
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                            lineNumber: 177,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                    className: "text-xl font-bold text-[#ff950e]",
                                                    children: [
                                                        selectedTierDetails,
                                                        " Tier"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                    lineNumber: 179,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-gray-400 text-sm",
                                                    children: [
                                                        "Level ",
                                                        [
                                                            'Tease',
                                                            'Flirt',
                                                            'Obsession',
                                                            'Desire',
                                                            'Goddess'
                                                        ].indexOf(selectedTierDetails) + 1,
                                                        " of 5"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                    lineNumber: 180,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                            lineNumber: 178,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                    lineNumber: 176,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-1 md:grid-cols-2 gap-6",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h5", {
                                                    className: "text-lg font-semibold text-white mb-3 flex items-center gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$target$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Target$3e$__["Target"], {
                                                            className: "w-4 h-4 text-green-400"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                            lineNumber: 191,
                                                            columnNumber: 21
                                                        }, this),
                                                        "Requirements"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                    lineNumber: 190,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "space-y-2 text-sm",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex items-center justify-between p-2 bg-[#111] rounded",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-gray-300",
                                                                    children: "Total Sales"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                                    lineNumber: 196,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-[#ff950e] font-medium",
                                                                    children: [
                                                                        TIER_LEVELS[selectedTierDetails].minSales,
                                                                        "+"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                                    lineNumber: 197,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                            lineNumber: 195,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-center text-gray-500 text-xs",
                                                            children: "OR"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                            lineNumber: 199,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex items-center justify-between p-2 bg-[#111] rounded",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-gray-300",
                                                                    children: "Total Revenue"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                                    lineNumber: 201,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-[#ff950e] font-medium",
                                                                    children: [
                                                                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$url$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCurrency"])(TIER_LEVELS[selectedTierDetails].minAmount),
                                                                        "+"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                                    lineNumber: 202,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                            lineNumber: 200,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "mt-3 pt-3 border-t border-gray-800",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                    className: "text-xs text-gray-400 mb-2",
                                                                    children: "Your Progress:"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                                    lineNumber: 207,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-xs space-y-1",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "flex justify-between",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                    className: "text-gray-300",
                                                                                    children: [
                                                                                        "Sales: ",
                                                                                        userStats.totalSales
                                                                                    ]
                                                                                }, void 0, true, {
                                                                                    fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                                                    lineNumber: 210,
                                                                                    columnNumber: 27
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                    className: "text-gray-300",
                                                                                    children: [
                                                                                        "Revenue: ",
                                                                                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$url$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCurrency"])(userStats.totalRevenue)
                                                                                    ]
                                                                                }, void 0, true, {
                                                                                    fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                                                    lineNumber: 211,
                                                                                    columnNumber: 27
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                                            lineNumber: 209,
                                                                            columnNumber: 25
                                                                        }, this),
                                                                        selectedTierDetails !== currentTier && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                            className: "text-green-400 mt-2",
                                                                            children: [
                                                                                "Need: ",
                                                                                Math.max(0, TIER_LEVELS[selectedTierDetails].minSales - userStats.totalSales),
                                                                                " more sales OR",
                                                                                ' ',
                                                                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$url$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCurrency"])(Math.max(0, TIER_LEVELS[selectedTierDetails].minAmount - userStats.totalRevenue)),
                                                                                " more revenue"
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                                            lineNumber: 214,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                                    lineNumber: 208,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                            lineNumber: 206,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                    lineNumber: 194,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                            lineNumber: 189,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h5", {
                                                    className: "text-lg font-semibold text-white mb-3 flex items-center gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$gift$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Gift$3e$__["Gift"], {
                                                            className: "w-4 h-4 text-purple-400"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                            lineNumber: 228,
                                                            columnNumber: 21
                                                        }, this),
                                                        "Benefits"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                    lineNumber: 227,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "space-y-2 text-sm",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex items-center justify-between p-2 bg-[#111] rounded",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-gray-300",
                                                                    children: "Bonus Credits"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                                    lineNumber: 233,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-green-400 font-bold",
                                                                    children: TIER_LEVELS[selectedTierDetails].credit > 0 ? "+".concat((TIER_LEVELS[selectedTierDetails].credit * 100).toFixed(0), "%") : 'None'
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                                    lineNumber: 234,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                            lineNumber: 232,
                                                            columnNumber: 21
                                                        }, this),
                                                        selectedTierDetails !== 'Tease' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "flex items-center justify-between p-2 bg-[#111] rounded",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "text-gray-300",
                                                                            children: "Priority Support"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                                            lineNumber: 244,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "text-green-400",
                                                                            children: "✓"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                                            lineNumber: 245,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                                    lineNumber: 243,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "flex items-center justify-between p-2 bg-[#111] rounded",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "text-gray-300",
                                                                            children: "Featured Profile"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                                            lineNumber: 248,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "text-green-400",
                                                                            children: "✓"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                                            lineNumber: 249,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                                    lineNumber: 247,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true),
                                                        (selectedTierDetails === 'Desire' || selectedTierDetails === 'Goddess') && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "flex items-center justify-between p-2 bg-[#111] rounded",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "text-gray-300",
                                                                            children: "Custom Badge"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                                            lineNumber: 257,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "text-green-400",
                                                                            children: "✓"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                                            lineNumber: 258,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                                    lineNumber: 256,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "flex items-center justify-between p-2 bg-[#111] rounded",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "text-gray-300",
                                                                            children: "VIP Events"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                                            lineNumber: 261,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "text-green-400",
                                                                            children: "✓"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                                            lineNumber: 262,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                                    lineNumber: 260,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true),
                                                        selectedTierDetails === 'Goddess' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex items-center justify-between p-2 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded border border-purple-500/30",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-gray-300",
                                                                    children: "Elite Status"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                                    lineNumber: 269,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-purple-400 flex items-center gap-1",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$crown$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Crown$3e$__["Crown"], {
                                                                            className: "w-4 h-4"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                                            lineNumber: 271,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        "VIP"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                                    lineNumber: 270,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                            lineNumber: 268,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                                    lineNumber: 231,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                            lineNumber: 226,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                                    lineNumber: 187,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                            lineNumber: 175,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                        lineNumber: 174,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
                lineNumber: 132,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/seller-settings/TierDisplaySection.tsx",
        lineNumber: 90,
        columnNumber: 5
    }, this);
}
_c = TierDisplaySection;
var _c;
__turbopack_context__.k.register(_c, "TierDisplaySection");
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
const CLOUD_NAME = ("TURBOPACK compile-time value", "ddanxxkwz") || '';
const UPLOAD_PRESET = ("TURBOPACK compile-time value", "pantypost_upload") || '';
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
    if (!isCloudinaryConfigured()) //TURBOPACK unreachable
    ;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    try {
        const response = await fetch("https://api.cloudinary.com/v1_1/".concat(CLOUD_NAME, "/image/upload"), {
            method: 'POST',
            body: formData
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error("Upload failed: ".concat(response.statusText || error));
        }
        const data = await response.json();
        return {
            url: data.secure_url,
            publicId: data.public_id,
            format: data.format,
            width: data.width,
            height: data.height,
            bytes: data.bytes,
            createdAt: data.created_at
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error instanceof Error ? error : new Error('Upload failed');
    }
};
const uploadMultipleToCloudinary = async (files, onProgress)=>{
    // Validate all files first
    const invalidFiles = files.filter((file)=>!isValidImageFile(file));
    if (invalidFiles.length > 0) {
        const invalidFileNames = invalidFiles.map((f)=>f.name).join(', ');
        throw new Error("Invalid files detected: ".concat(invalidFileNames, ". ") + "All files must be JPEG, PNG, WebP, or GIF under 10MB each.");
    }
    // Check if we should use mock data
    if (!isCloudinaryConfigured()) //TURBOPACK unreachable
    ;
    const results = [];
    const totalFiles = files.length;
    for(let i = 0; i < files.length; i++){
        try {
            const result = await uploadToCloudinary(files[i]);
            results.push(result);
            if (onProgress) {
                const progress = (i + 1) / totalFiles * 100;
                onProgress(progress);
            }
        } catch (error) {
            console.error("Failed to upload file ".concat(i + 1, ":"), error);
            // Clean up any successful uploads if one fails
            if (results.length > 0 && isCloudinaryConfigured()) {
                console.log('Rolling back successful uploads:', results.map((r)=>r.publicId));
                // Attempt to delete successfully uploaded images
                await batchDeleteFromCloudinary(results.map((r)=>r.publicId));
            }
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error("Failed to upload file ".concat(files[i].name, ": ").concat(errorMessage));
        }
    }
    return results;
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
    try {
        // For now, make a request to the mock API endpoint
        const response = await fetch('/api/cloudinary/delete', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                publicId
            })
        });
        if (!response.ok) {
            const error = await response.json().catch(()=>({
                    message: 'Delete failed'
                }));
            throw new Error(error.message || "Delete failed: ".concat(response.statusText));
        }
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Delete from Cloudinary error:', error);
        throw error instanceof Error ? error : new Error('Delete failed');
    }
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
    if (!isCloudinaryConfigured()) //TURBOPACK unreachable
    ;
    return {
        configured: true
    };
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/hooks/seller-settings/useProfileData.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/hooks/seller-settings/useProfileData.ts
__turbopack_context__.s({
    "useProfileData": ()=>useProfileData
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/AuthContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/index.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/users.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$cloudinary$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/cloudinary.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/types/users.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/validation/schemas.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
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
;
;
function useProfileData() {
    _s();
    const { user, updateUser } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const rateLimiter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getRateLimiter"])();
    // Profile state
    const [bio, setBio] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [profilePic, setProfilePic] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [preview, setPreview] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [subscriptionPrice, setSubscriptionPrice] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [galleryImages, setGalleryImages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    // Additional features
    const [completeness, setCompleteness] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [preferences, setPreferences] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Loading states
    const [isUploading, setIsUploading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isLoadingProfile, setIsLoadingProfile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [isSaving, setIsSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Validation errors
    const [errors, setErrors] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    // Track unsaved changes
    const hasUnsavedChanges = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const originalData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])({});
    // Validate bio with security
    const validateBio = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useProfileData.useCallback[validateBio]": (value)=>{
            try {
                const sanitized = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(value);
                const result = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["profileSchemas"].bio.safeParse(sanitized);
                if (!result.success) {
                    setErrors({
                        "useProfileData.useCallback[validateBio]": (prev)=>({
                                ...prev,
                                bio: result.error.errors[0].message
                            })
                    }["useProfileData.useCallback[validateBio]"]);
                    return false;
                }
                setErrors({
                    "useProfileData.useCallback[validateBio]": (prev)=>({
                            ...prev,
                            bio: undefined
                        })
                }["useProfileData.useCallback[validateBio]"]);
                return true;
            } catch (e) {
                setErrors({
                    "useProfileData.useCallback[validateBio]": (prev)=>({
                            ...prev,
                            bio: 'Invalid bio format'
                        })
                }["useProfileData.useCallback[validateBio]"]);
                return false;
            }
        }
    }["useProfileData.useCallback[validateBio]"], []);
    // Validate subscription price with security
    const validatePrice = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useProfileData.useCallback[validatePrice]": (value)=>{
            const validation = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].validateAmount(value, {
                min: 0,
                max: 999.99,
                allowDecimals: true
            });
            if (!validation.valid) {
                setErrors({
                    "useProfileData.useCallback[validatePrice]": (prev)=>({
                            ...prev,
                            subscriptionPrice: validation.error || 'Invalid price'
                        })
                }["useProfileData.useCallback[validatePrice]"]);
                return false;
            }
            setErrors({
                "useProfileData.useCallback[validatePrice]": (prev)=>({
                        ...prev,
                        subscriptionPrice: undefined
                    })
            }["useProfileData.useCallback[validatePrice]"]);
            return true;
        }
    }["useProfileData.useCallback[validatePrice]"], []);
    // Load profile data
    const loadProfileData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useProfileData.useCallback[loadProfileData]": async ()=>{
            // Check if user exists and has username
            if (!(user === null || user === void 0 ? void 0 : user.username)) {
                console.warn('[useProfileData] No username available, skipping profile load');
                setIsLoadingProfile(false);
                return;
            }
            // Ensure username is defined and valid
            const username = user.username.trim();
            if (!username) {
                console.error('[useProfileData] Username is empty after trim');
                setIsLoadingProfile(false);
                return;
            }
            console.log('[useProfileData] Loading profile data for username: "'.concat(username, '"'));
            setIsLoadingProfile(true);
            try {
                // Get profile data with proper username
                console.log('[useProfileData] Calling getUserProfile with username: "'.concat(username, '"'));
                const profileResult = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usersService"].getUserProfile(username);
                if (!profileResult.success) {
                    console.error('[useProfileData] Failed to get user profile:', profileResult.error);
                } else if (profileResult.data) {
                    const profile = profileResult.data;
                    console.log('[useProfileData] Profile data loaded successfully:', profile);
                    // Sanitize loaded data
                    const sanitizedBio = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(profile.bio || '');
                    const sanitizedProfilePic = profile.profilePic ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUrl"])(profile.profilePic) : null;
                    setBio(sanitizedBio);
                    setProfilePic(sanitizedProfilePic);
                    // Ensure subscriptionPrice is always a string
                    setSubscriptionPrice(String(profile.subscriptionPrice || '0'));
                    // Sanitize gallery URLs
                    const sanitizedGallery = (profile.galleryImages || []).map({
                        "useProfileData.useCallback[loadProfileData].sanitizedGallery": (url)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUrl"])(url)
                    }["useProfileData.useCallback[loadProfileData].sanitizedGallery"]).filter({
                        "useProfileData.useCallback[loadProfileData].sanitizedGallery": (url)=>url !== '' && url !== null
                    }["useProfileData.useCallback[loadProfileData].sanitizedGallery"]);
                    setGalleryImages(sanitizedGallery);
                    // Store original data for change tracking
                    originalData.current = {
                        bio: sanitizedBio,
                        profilePic: sanitizedProfilePic,
                        subscriptionPrice: String(profile.subscriptionPrice || '0'),
                        galleryImages: sanitizedGallery
                    };
                } else {
                    console.warn('[useProfileData] No profile data returned');
                }
                // Calculate completeness - ensure username is passed
                console.log('[useProfileData] Calling getUser with username: "'.concat(username, '"'));
                const userResult = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usersService"].getUser(username);
                if (!userResult.success) {
                    console.error('[useProfileData] Failed to get user:', userResult.error);
                } else if (userResult.data && profileResult.data) {
                    // Ensure subscriptionPrice is a string for calculateProfileCompleteness
                    const comp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["calculateProfileCompleteness"])(userResult.data, {
                        ...profileResult.data,
                        subscriptionPrice: String(profileResult.data.subscriptionPrice || '0')
                    });
                    setCompleteness(comp);
                    console.log('[useProfileData] Profile completeness calculated:', comp);
                }
                // Load preferences - ensure username is passed
                console.log('[useProfileData] Calling getUserPreferences with username: "'.concat(username, '"'));
                const prefsResult = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usersService"].getUserPreferences(username);
                if (!prefsResult.success) {
                    console.error('[useProfileData] Failed to get user preferences:', prefsResult.error);
                } else if (prefsResult.data) {
                    setPreferences(prefsResult.data);
                    console.log('[useProfileData] User preferences loaded:', prefsResult.data);
                }
                // Track profile view activity
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usersService"].trackActivity({
                    userId: username,
                    type: 'profile_update',
                    details: {
                        action: 'profile_settings_viewed'
                    }
                });
            } catch (error) {
                console.error('[useProfileData] Error loading profile data:', error);
            // Don't throw - just log the error and continue
            } finally{
                setIsLoadingProfile(false);
            }
        }
    }["useProfileData.useCallback[loadProfileData]"], [
        user === null || user === void 0 ? void 0 : user.username
    ]);
    // Load profile data on mount and when user changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useProfileData.useEffect": ()=>{
            loadProfileData();
        }
    }["useProfileData.useEffect"], [
        loadProfileData
    ]);
    // Track changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useProfileData.useEffect": ()=>{
            hasUnsavedChanges.current = bio !== originalData.current.bio || profilePic !== originalData.current.profilePic || subscriptionPrice !== originalData.current.subscriptionPrice || JSON.stringify(galleryImages) !== JSON.stringify(originalData.current.galleryImages);
        }
    }["useProfileData.useEffect"], [
        bio,
        profilePic,
        subscriptionPrice,
        galleryImages
    ]);
    // Handle profile picture change with security
    const handleProfilePicChange = async (e)=>{
        var _e_target_files;
        const file = (_e_target_files = e.target.files) === null || _e_target_files === void 0 ? void 0 : _e_target_files[0];
        if (!file) return;
        // Check if user exists
        if (!(user === null || user === void 0 ? void 0 : user.username)) {
            alert('Please log in to upload images');
            return;
        }
        // Check rate limit
        const rateLimitResult = rateLimiter.check('IMAGE_UPLOAD', {
            ...__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RATE_LIMITS"].IMAGE_UPLOAD,
            identifier: user.username
        });
        if (!rateLimitResult.allowed) {
            alert("Too many uploads. Please wait ".concat(rateLimitResult.waitTime, " seconds."));
            return;
        }
        // Validate file with security service
        const validation = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].validateFileUpload(file, {
            maxSize: 10 * 1024 * 1024,
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
        if (!validation.valid) {
            alert(validation.error);
            return;
        }
        try {
            setIsUploading(true);
            // Upload to Cloudinary
            const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$cloudinary$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uploadToCloudinary"])(file);
            console.log('[useProfileData] Profile pic uploaded successfully:', result);
            // Validate uploaded URL
            const sanitizedUrl = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUrl"])(result.url);
            if (!sanitizedUrl) {
                throw new Error('Invalid image URL returned');
            }
            // Set the preview
            setPreview(sanitizedUrl);
            // Track upload activity
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usersService"].trackActivity({
                userId: user.username,
                type: 'profile_update',
                details: {
                    action: 'profile_picture_uploaded'
                }
            });
        } catch (error) {
            console.error("[useProfileData] Error uploading profile image:", error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            alert("Failed to upload image: ".concat(errorMessage));
        } finally{
            setIsUploading(false);
        }
    };
    // Remove profile picture
    const removeProfilePic = ()=>{
        setProfilePic(null);
        setPreview(null);
    };
    // Save profile with optimistic update and security
    const saveProfile = async ()=>{
        if (!(user === null || user === void 0 ? void 0 : user.username)) {
            console.error('[useProfileData] Cannot save profile: no username');
            alert('Please log in to save your profile');
            return false;
        }
        const username = user.username.trim();
        if (!username) {
            console.error('[useProfileData] Cannot save profile: username is empty');
            return false;
        }
        // Validate all fields
        const isBioValid = validateBio(bio);
        const isPriceValid = validatePrice(subscriptionPrice);
        if (!isBioValid || !isPriceValid) {
            return false;
        }
        // Check rate limit for profile saves
        const rateLimitResult = rateLimiter.check('PROFILE_UPDATE', {
            maxAttempts: 10,
            windowMs: 60 * 60 * 1000,
            identifier: username
        });
        if (!rateLimitResult.allowed) {
            alert("Too many profile updates. Please wait ".concat(rateLimitResult.waitTime, " seconds."));
            return false;
        }
        setIsSaving(true);
        try {
            // Sanitize all data before saving
            const sanitizedBio = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(bio);
            const finalProfilePic = preview || profilePic;
            const sanitizedProfilePic = finalProfilePic ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUrl"])(finalProfilePic) : null;
            // Validate gallery images
            const sanitizedGallery = galleryImages.map((url)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUrl"])(url)).filter((url)=>url !== '' && url !== null);
            // Prepare updates
            const updates = {
                bio: sanitizedBio,
                profilePic: sanitizedProfilePic,
                subscriptionPrice,
                galleryImages: sanitizedGallery
            };
            console.log('[useProfileData] Saving profile for username: "'.concat(username, '"'), updates);
            // Update profile
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usersService"].updateUserProfile(username, updates);
            if (result.success) {
                console.log('[useProfileData] Profile saved successfully');
                // Update auth context if profile pic changed
                if (sanitizedProfilePic && sanitizedProfilePic !== user.profilePicture) {
                    await updateUser({
                        profilePicture: sanitizedProfilePic
                    });
                }
                // Update original data
                originalData.current = {
                    ...updates
                };
                hasUnsavedChanges.current = false;
                // Clear preview
                if (preview) {
                    setProfilePic(sanitizedProfilePic);
                    setPreview(null);
                }
                // Recalculate completeness
                const userResult = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usersService"].getUser(username);
                if (userResult.success && userResult.data) {
                    // Ensure subscriptionPrice is a string for calculateProfileCompleteness
                    const comp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["calculateProfileCompleteness"])(userResult.data, {
                        ...result.data,
                        subscriptionPrice: String(result.data.subscriptionPrice || '0')
                    });
                    setCompleteness(comp);
                }
                // Track save activity
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usersService"].trackActivity({
                    userId: username,
                    type: 'profile_update',
                    details: {
                        action: 'profile_saved',
                        fieldsUpdated: Object.keys(updates)
                    }
                });
                return true;
            } else {
                var _result_error;
                console.error('[useProfileData] Failed to save profile:', result.error);
                alert(((_result_error = result.error) === null || _result_error === void 0 ? void 0 : _result_error.message) || 'Failed to save profile');
                return false;
            }
        } catch (error) {
            console.error('[useProfileData] Error saving profile:', error);
            alert('Failed to save profile');
            return false;
        } finally{
            setIsSaving(false);
        }
    };
    // Update preferences with sanitization
    const updatePreferences = async (updates)=>{
        if (!(user === null || user === void 0 ? void 0 : user.username)) {
            console.error('[useProfileData] Cannot update preferences: no username');
            return;
        }
        const username = user.username.trim();
        if (!username) {
            console.error('[useProfileData] Cannot update preferences: username is empty');
            return;
        }
        try {
            // Sanitize preference updates
            const sanitizedUpdates = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].sanitizeForAPI(updates);
            console.log('[useProfileData] Updating preferences for username: "'.concat(username, '"'), sanitizedUpdates);
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usersService"].updateUserPreferences(username, sanitizedUpdates);
            if (result.success) {
                setPreferences(result.data);
                console.log('[useProfileData] Preferences updated successfully');
            } else {
                console.error('[useProfileData] Failed to update preferences:', result.error);
            }
        } catch (error) {
            console.error('[useProfileData] Error updating preferences:', error);
        }
    };
    // Refresh profile data
    const refreshProfile = async ()=>{
        console.log('[useProfileData] Refreshing profile data');
        // Clear cache to force fresh data
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usersService"].clearCache();
        await loadProfileData();
    };
    // Warn about unsaved changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useProfileData.useEffect": ()=>{
            const handleBeforeUnload = {
                "useProfileData.useEffect.handleBeforeUnload": (e)=>{
                    if (hasUnsavedChanges.current) {
                        e.preventDefault();
                        e.returnValue = '';
                    }
                }
            }["useProfileData.useEffect.handleBeforeUnload"];
            window.addEventListener('beforeunload', handleBeforeUnload);
            return ({
                "useProfileData.useEffect": ()=>window.removeEventListener('beforeunload', handleBeforeUnload)
            })["useProfileData.useEffect"];
        }
    }["useProfileData.useEffect"], []);
    // Secure bio setter
    const secureBioSetter = (value)=>{
        // Limit length to prevent DoS
        const truncated = value.slice(0, 600);
        setBio(truncated);
        validateBio(truncated);
    };
    // Secure price setter
    const securePriceSetter = (value)=>{
        // Remove non-numeric characters except decimal
        const cleaned = value.replace(/[^0-9.]/g, '');
        // Ensure only one decimal point
        const parts = cleaned.split('.');
        if (parts.length > 2) return;
        // Limit to 2 decimal places
        if (parts[1] && parts[1].length > 2) return;
        setSubscriptionPrice(cleaned);
        validatePrice(cleaned);
    };
    return {
        // Profile data
        bio,
        setBio: secureBioSetter,
        profilePic,
        setProfilePic,
        preview,
        setPreview,
        subscriptionPrice,
        setSubscriptionPrice: securePriceSetter,
        // Gallery
        galleryImages,
        setGalleryImages,
        // Profile completeness
        completeness,
        // User preferences
        preferences,
        updatePreferences,
        // States
        isUploading,
        isLoadingProfile,
        isSaving,
        // Actions
        handleProfilePicChange,
        removeProfilePic,
        saveProfile,
        refreshProfile,
        // Validation
        errors
    };
}
_s(useProfileData, "vgBDf7WBWays9WtXux8QYMpvYUY=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/hooks/seller-settings/useTierCalculation.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/hooks/seller-settings/useTierCalculation.ts
__turbopack_context__.s({
    "useTierCalculation": ()=>useTierCalculation
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/AuthContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WalletContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/WalletContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$sellerTiers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/sellerTiers.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
;
;
;
;
// Define TIER_LEVELS locally to match the structure in sellerTiers.ts
const TIER_LEVELS = {
    'None': {
        minSales: 0,
        minAmount: 0
    },
    'Tease': {
        minSales: 0,
        minAmount: 0
    },
    'Flirt': {
        minSales: 10,
        minAmount: 5000
    },
    'Obsession': {
        minSales: 101,
        minAmount: 12500
    },
    'Desire': {
        minSales: 251,
        minAmount: 75000
    },
    'Goddess': {
        minSales: 1001,
        minAmount: 150000
    }
};
const VALID_TIERS = [
    'None',
    'Tease',
    'Flirt',
    'Obsession',
    'Desire',
    'Goddess'
];
function useTierCalculation() {
    _s();
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const { orderHistory } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WalletContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWallet"])();
    // Sanitize username to prevent injection
    const sanitizedUsername = (user === null || user === void 0 ? void 0 : user.username) ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(user.username) : null;
    // Calculate seller tier info
    const sellerTierInfo = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useTierCalculation.useMemo[sellerTierInfo]": ()=>{
            return sanitizedUsername ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$sellerTiers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSellerTierMemoized"])(sanitizedUsername, orderHistory) : null;
        }
    }["useTierCalculation.useMemo[sellerTierInfo]"], [
        sanitizedUsername,
        orderHistory
    ]);
    // Calculate user's current stats with validation
    const userStats = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useTierCalculation.useMemo[userStats]": ()=>{
            if (!sanitizedUsername) return {
                totalSales: 0,
                totalRevenue: 0
            };
            const userOrders = orderHistory.filter({
                "useTierCalculation.useMemo[userStats].userOrders": (order)=>order.seller === sanitizedUsername && typeof order.price === 'number' && order.price >= 0
            }["useTierCalculation.useMemo[userStats].userOrders"]);
            const totalSales = userOrders.length;
            const totalRevenue = userOrders.reduce({
                "useTierCalculation.useMemo[userStats].totalRevenue": (sum, order)=>{
                    // Validate each price to prevent NaN or negative values
                    const price = typeof order.price === 'number' && order.price >= 0 ? order.price : 0;
                    return sum + price;
                }
            }["useTierCalculation.useMemo[userStats].totalRevenue"], 0);
            // Ensure values are within reasonable bounds
            return {
                totalSales: Math.min(totalSales, 999999),
                totalRevenue: Math.min(totalRevenue, 99999999) // Cap at reasonable max
            };
        }
    }["useTierCalculation.useMemo[userStats]"], [
        sanitizedUsername,
        orderHistory
    ]);
    // Get next tier info with validation
    const getNextTier = (currentTier)=>{
        // Validate input tier
        if (!VALID_TIERS.includes(currentTier)) {
            return 'Tease'; // Default to lowest tier if invalid
        }
        const tiers = [
            'Tease',
            'Flirt',
            'Obsession',
            'Desire',
            'Goddess'
        ];
        const currentIndex = tiers.indexOf(currentTier);
        if (currentIndex === -1 || currentIndex === tiers.length - 1) {
            return currentTier;
        }
        return tiers[currentIndex + 1];
    };
    // Get tier progress percentages with bounds checking
    const getTierProgress = ()=>{
        if (!sellerTierInfo) return {
            salesProgress: 0,
            revenueProgress: 0
        };
        const currentTier = sellerTierInfo.tier;
        // Validate current tier
        if (!VALID_TIERS.includes(currentTier)) {
            return {
                salesProgress: 0,
                revenueProgress: 0
            };
        }
        const currentRequirements = TIER_LEVELS[currentTier];
        const nextTier = getNextTier(currentTier);
        const nextRequirements = TIER_LEVELS[nextTier];
        if (currentTier === 'Goddess' || !nextRequirements) {
            return {
                salesProgress: 100,
                revenueProgress: 100
            };
        }
        // Calculate progress with bounds checking
        const salesDiff = nextRequirements.minSales - currentRequirements.minSales;
        const revenueDiff = nextRequirements.minAmount - currentRequirements.minAmount;
        let salesProgress = 0;
        let revenueProgress = 0;
        if (salesDiff > 0) {
            salesProgress = Math.min((userStats.totalSales - currentRequirements.minSales) / salesDiff * 100, 100);
        }
        if (revenueDiff > 0) {
            revenueProgress = Math.min((userStats.totalRevenue - currentRequirements.minAmount) / revenueDiff * 100, 100);
        }
        return {
            salesProgress: Math.max(0, Math.floor(salesProgress)),
            revenueProgress: Math.max(0, Math.floor(revenueProgress))
        };
    };
    // Validate tier level
    const isValidTier = (tier)=>{
        return VALID_TIERS.includes(tier);
    };
    return {
        sellerTierInfo,
        userStats,
        getNextTier,
        getTierProgress,
        isValidTier,
        validTiers: VALID_TIERS
    };
}
_s(useTierCalculation, "g6NAn178fy172tGZGDbMwpXRcvM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WalletContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWallet"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/hooks/seller-settings/useProfileSettings.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/hooks/seller-settings/useProfileSettings.ts
__turbopack_context__.s({
    "useProfileSettings": ()=>useProfileSettings
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/AuthContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$seller$2d$settings$2f$useProfileData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/seller-settings/useProfileData.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$seller$2d$settings$2f$useProfileSave$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/seller-settings/useProfileSave.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$seller$2d$settings$2f$useTierCalculation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/seller-settings/useTierCalculation.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/index.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/storage.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
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
;
;
;
const MAX_GALLERY_IMAGES = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
];
function useProfileSettings() {
    _s();
    const { user, token } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const rateLimiter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getRateLimiter"])();
    // Profile data management
    const profileData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$seller$2d$settings$2f$useProfileData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useProfileData"])();
    // Gallery state
    const [galleryImages, setGalleryImages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [selectedFiles, setSelectedFiles] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [galleryUploading, setGalleryUploading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [uploadProgress, setUploadProgress] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [validationError, setValidationError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const multipleFileInputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const profilePicInputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Profile save management - pass gallery images to the hook
    const { saveSuccess, saveError, isSaving, handleSave: baseSaveProfile, handleSaveWithGallery } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$seller$2d$settings$2f$useProfileSave$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useProfileSave"])();
    // Tier calculation
    const tierData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$seller$2d$settings$2f$useTierCalculation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTierCalculation"])();
    // State for tier modal
    const [selectedTierDetails, setSelectedTierDetails] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Load gallery images on mount from backend
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useProfileSettings.useEffect": ()=>{
            const loadGalleryImages = {
                "useProfileSettings.useEffect.loadGalleryImages": async ()=>{
                    if ((user === null || user === void 0 ? void 0 : user.username) && token) {
                        try {
                            // Fetch user profile from backend to get gallery images
                            const response = await fetch("".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_BASE_URL"], "/api/users/").concat(user.username, "/profile/full"), {
                                headers: {
                                    'Authorization': "Bearer ".concat(token)
                                }
                            });
                            if (response.ok) {
                                const data = await response.json();
                                if (data.success && data.data) {
                                    // Handle both direct data and nested profile structure
                                    const userData = data.data.profile || data.data;
                                    if (userData.galleryImages && Array.isArray(userData.galleryImages)) {
                                        const validatedGallery = userData.galleryImages.map({
                                            "useProfileSettings.useEffect.loadGalleryImages.validatedGallery": (url)=>{
                                                // Handle both relative and absolute URLs
                                                if (url.startsWith('http://') || url.startsWith('https://')) {
                                                    return url;
                                                } else if (url.startsWith('/uploads/')) {
                                                    // Convert relative upload paths to full URLs
                                                    return "".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_BASE_URL"]).concat(url);
                                                } else {
                                                    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUrl"])(url);
                                                }
                                            }
                                        }["useProfileSettings.useEffect.loadGalleryImages.validatedGallery"]).filter({
                                            "useProfileSettings.useEffect.loadGalleryImages.validatedGallery": (url)=>url !== '' && url !== null
                                        }["useProfileSettings.useEffect.loadGalleryImages.validatedGallery"]).slice(0, MAX_GALLERY_IMAGES);
                                        setGalleryImages(validatedGallery);
                                    }
                                }
                            }
                        } catch (error) {
                            console.error('Failed to load gallery images from backend:', error);
                            // Fallback to localStorage
                            const storedGallery = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem("profile_gallery_".concat(user.username), []);
                            const validatedGallery = storedGallery.map({
                                "useProfileSettings.useEffect.loadGalleryImages.validatedGallery": (url)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUrl"])(url)
                            }["useProfileSettings.useEffect.loadGalleryImages.validatedGallery"]).filter({
                                "useProfileSettings.useEffect.loadGalleryImages.validatedGallery": (url)=>url !== '' && url !== null
                            }["useProfileSettings.useEffect.loadGalleryImages.validatedGallery"]).slice(0, MAX_GALLERY_IMAGES);
                            setGalleryImages(validatedGallery);
                        }
                    }
                }
            }["useProfileSettings.useEffect.loadGalleryImages"];
            loadGalleryImages();
        }
    }["useProfileSettings.useEffect"], [
        user === null || user === void 0 ? void 0 : user.username,
        token
    ]);
    // Clear validation error when files change
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useProfileSettings.useEffect": ()=>{
            setValidationError('');
        }
    }["useProfileSettings.useEffect"], [
        selectedFiles
    ]);
    // Validate files
    const validateFiles = (files)=>{
        // Check total number of images
        if (galleryImages.length + files.length > MAX_GALLERY_IMAGES) {
            return {
                valid: false,
                error: "Maximum ".concat(MAX_GALLERY_IMAGES, " gallery images allowed. You have ").concat(galleryImages.length, " images.")
            };
        }
        // Validate each file
        for (const file of files){
            const validation = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].validateFileUpload(file, {
                maxSize: MAX_FILE_SIZE,
                allowedTypes: ALLOWED_IMAGE_TYPES,
                allowedExtensions: [
                    'jpg',
                    'jpeg',
                    'png',
                    'webp'
                ]
            });
            if (!validation.valid) {
                return {
                    valid: false,
                    error: validation.error
                };
            }
        }
        return {
            valid: true
        };
    };
    // Handle multiple file selection
    const handleMultipleFileChange = (e)=>{
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const newFiles = Array.from(files);
        // Validate new files
        const validation = validateFiles(newFiles);
        if (!validation.valid) {
            setValidationError(validation.error || 'Invalid files selected');
            if (multipleFileInputRef.current) {
                multipleFileInputRef.current.value = '';
            }
            return;
        }
        setSelectedFiles((prev)=>[
                ...prev,
                ...newFiles
            ]);
        if (multipleFileInputRef.current) {
            multipleFileInputRef.current.value = '';
        }
    };
    // Remove selected file before upload
    const removeSelectedFile = (index)=>{
        setSelectedFiles((prev)=>prev.filter((_, i)=>i !== index));
    };
    // Internal async upload function
    const uploadGalleryImagesAsync = async ()=>{
        if (selectedFiles.length === 0) return;
        // Check rate limit
        if (user === null || user === void 0 ? void 0 : user.username) {
            const rateLimitResult = rateLimiter.check('IMAGE_UPLOAD', {
                ...__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RATE_LIMITS"].IMAGE_UPLOAD,
                identifier: user.username
            });
            if (!rateLimitResult.allowed) {
                setValidationError("Too many uploads. Please wait ".concat(rateLimitResult.waitTime, " seconds."));
                return;
            }
        }
        // Final validation before upload
        const validation = validateFiles(selectedFiles);
        if (!validation.valid) {
            setValidationError(validation.error || 'Invalid files');
            return;
        }
        setGalleryUploading(true);
        setUploadProgress(0);
        setValidationError('');
        try {
            // Create FormData for file upload
            const formData = new FormData();
            selectedFiles.forEach((file)=>{
                formData.append('gallery', file);
            });
            // Start progress simulation
            const progressInterval = setInterval(()=>{
                setUploadProgress((prev)=>Math.min(prev + 10, 90));
            }, 200);
            // Upload to backend
            const response = await fetch("".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_BASE_URL"], "/api/upload/gallery"), {
                method: 'POST',
                headers: {
                    'Authorization': token ? "Bearer ".concat(token) : ''
                },
                body: formData
            });
            clearInterval(progressInterval);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Upload failed');
            }
            const result = await response.json();
            if (result.success && result.data) {
                // Extract URLs from response and convert relative paths to full URLs
                const newGallery = (result.data.gallery || []).map((url)=>{
                    if (url.startsWith('http://') || url.startsWith('https://')) {
                        return url;
                    } else if (url.startsWith('/uploads/')) {
                        return "".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_BASE_URL"]).concat(url);
                    } else {
                        return url;
                    }
                });
                setGalleryImages(newGallery);
                setSelectedFiles([]);
                setUploadProgress(100);
                // Also save to localStorage as backup
                if (user === null || user === void 0 ? void 0 : user.username) {
                    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem("profile_gallery_".concat(user.username), newGallery);
                }
                console.log('Gallery images uploaded successfully:', result.data);
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            console.error("Error uploading images:", error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setValidationError("Failed to upload images: ".concat(errorMessage));
        } finally{
            setGalleryUploading(false);
            setTimeout(()=>setUploadProgress(0), 1000);
        }
    };
    // Wrapped upload function that returns void
    const uploadGalleryImages = ()=>{
        // Call async function but don't return the promise
        uploadGalleryImagesAsync();
    };
    // Internal async remove function
    const removeGalleryImageAsync = async (index)=>{
        if (index < 0 || index >= galleryImages.length) return;
        try {
            // Call backend to remove image
            const response = await fetch("".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_BASE_URL"], "/api/upload/gallery/").concat(index), {
                method: 'DELETE',
                headers: {
                    'Authorization': token ? "Bearer ".concat(token) : ''
                }
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to remove image');
            }
            const result = await response.json();
            if (result.success && result.data) {
                // Update with gallery returned from backend, converting URLs
                const updatedGallery = (result.data.gallery || []).map((url)=>{
                    if (url.startsWith('http://') || url.startsWith('https://')) {
                        return url;
                    } else if (url.startsWith('/uploads/')) {
                        return "".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_BASE_URL"]).concat(url);
                    } else {
                        return url;
                    }
                });
                setGalleryImages(updatedGallery);
                // Update localStorage
                if (user === null || user === void 0 ? void 0 : user.username) {
                    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem("profile_gallery_".concat(user.username), updatedGallery);
                }
            }
        } catch (error) {
            console.error('Failed to remove image:', error);
            // Fallback to local removal
            const updatedGallery = galleryImages.filter((_, i)=>i !== index);
            setGalleryImages(updatedGallery);
            if (user === null || user === void 0 ? void 0 : user.username) {
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem("profile_gallery_".concat(user.username), updatedGallery);
            }
        }
    };
    // Wrapped remove function that returns void
    const removeGalleryImage = (index)=>{
        // Call async function but don't return the promise
        removeGalleryImageAsync(index);
    };
    // Internal async clear function
    const clearAllGalleryImagesAsync = async ()=>{
        if (window.confirm("Are you sure you want to remove all gallery images?")) {
            try {
                // Remove all images one by one from backend
                for(let i = galleryImages.length - 1; i >= 0; i--){
                    await fetch("".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_BASE_URL"], "/api/upload/gallery/").concat(i), {
                        method: 'DELETE',
                        headers: {
                            'Authorization': token ? "Bearer ".concat(token) : ''
                        }
                    });
                }
                setGalleryImages([]);
                // Clear localStorage
                if (user === null || user === void 0 ? void 0 : user.username) {
                    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem("profile_gallery_".concat(user.username), []);
                }
            } catch (error) {
                console.error('Failed to clear gallery:', error);
                setGalleryImages([]);
                if (user === null || user === void 0 ? void 0 : user.username) {
                    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem("profile_gallery_".concat(user.username), []);
                }
            }
        }
    };
    // Wrapped clear function that returns void
    const clearAllGalleryImages = ()=>{
        // Call async function but don't return the promise
        clearAllGalleryImagesAsync();
    };
    // Enhanced save handler that includes gallery
    const handleSave = async ()=>{
        // Create profile data object with gallery
        const profileDataToSave = {
            bio: profileData.bio,
            profilePic: profileData.preview || profileData.profilePic,
            subscriptionPrice: profileData.subscriptionPrice,
            galleryImages: galleryImages.map((url)=>{
                // Convert full URLs back to relative paths for storage
                if (url.startsWith("".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_BASE_URL"], "/uploads/"))) {
                    return url.replace(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_BASE_URL"], '');
                }
                return url;
            })
        };
        // Save profile including gallery URLs
        await baseSaveProfile(profileDataToSave);
        // Also save gallery separately if needed
        if (galleryImages.length > 0) {
            await handleSaveWithGallery(galleryImages);
        }
        return saveSuccess;
    };
    return {
        // User
        user,
        // Profile data
        bio: profileData.bio,
        setBio: profileData.setBio,
        profilePic: profileData.profilePic,
        preview: profileData.preview,
        subscriptionPrice: profileData.subscriptionPrice,
        setSubscriptionPrice: profileData.setSubscriptionPrice,
        profileUploading: profileData.isUploading,
        handleProfilePicChange: profileData.handleProfilePicChange,
        removeProfilePic: profileData.removeProfilePic,
        profilePicInputRef,
        // Gallery - Now returning void functions
        galleryImages,
        selectedFiles,
        galleryUploading,
        uploadProgress,
        multipleFileInputRef,
        handleMultipleFileChange,
        removeSelectedFile,
        uploadGalleryImages,
        removeGalleryImage,
        clearAllGalleryImages,
        validationError,
        // Tier info
        sellerTierInfo: tierData.sellerTierInfo,
        userStats: tierData.userStats,
        getTierProgress: tierData.getTierProgress,
        getNextTier: tierData.getNextTier,
        selectedTierDetails,
        setSelectedTierDetails,
        // Save functionality
        saveSuccess,
        saveError,
        isSaving,
        handleSave
    };
}
_s(useProfileSettings, "FVay93oySeuTxYpZxGGllWJgwSU=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$seller$2d$settings$2f$useProfileData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useProfileData"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$seller$2d$settings$2f$useProfileSave$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useProfileSave"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$seller$2d$settings$2f$useTierCalculation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTierCalculation"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/app/sellers/profile/page.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/app/sellers/profile/page.tsx
__turbopack_context__.s({
    "default": ()=>SellerProfileSettingsPage
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$BanCheck$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/BanCheck.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$RequireAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/RequireAuth.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$seller$2d$settings$2f$ProfileInfoCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/seller-settings/ProfileInfoCard.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$seller$2d$settings$2f$TierProgressCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/seller-settings/TierProgressCard.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$seller$2d$settings$2f$GalleryManager$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/seller-settings/GalleryManager.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$seller$2d$settings$2f$modals$2f$TierDetailsModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/seller-settings/modals/TierDetailsModal.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$seller$2d$settings$2f$utils$2f$SaveButton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/seller-settings/utils/SaveButton.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$seller$2d$settings$2f$TierDisplaySection$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/seller-settings/TierDisplaySection.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$seller$2d$settings$2f$useProfileSettings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/seller-settings/useProfileSettings.ts [app-client] (ecmascript)");
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
function SellerProfileSettingsPage() {
    _s();
    const profilePicInputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const { // User
    user, // Profile data
    bio, setBio, profilePic, preview, subscriptionPrice, setSubscriptionPrice, profileUploading, handleProfilePicChange, removeProfilePic, // Gallery
    galleryImages, selectedFiles, galleryUploading, uploadProgress, multipleFileInputRef, handleMultipleFileChange, removeSelectedFile, uploadGalleryImages, removeGalleryImage, clearAllGalleryImages, // Tier info
    sellerTierInfo, userStats, getTierProgress, getNextTier, selectedTierDetails, setSelectedTierDetails, // Save functionality
    saveSuccess, saveError, isSaving, handleSave } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$seller$2d$settings$2f$useProfileSettings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useProfileSettings"])();
    const tierProgress = getTierProgress();
    const nextTier = sellerTierInfo ? getNextTier(sellerTierInfo.tier) : 'Tease';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$BanCheck$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$RequireAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
            role: "seller",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "min-h-screen bg-black text-white py-10 px-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "max-w-6xl mx-auto",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-3xl font-bold mb-2 text-[#ff950e]",
                                children: "My Profile"
                            }, void 0, false, {
                                fileName: "[project]/src/app/sellers/profile/page.tsx",
                                lineNumber: 68,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-gray-400 mb-8",
                                children: "Manage your seller profile and photo gallery"
                            }, void 0, false, {
                                fileName: "[project]/src/app/sellers/profile/page.tsx",
                                lineNumber: 69,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-1 lg:grid-cols-3 gap-8",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "lg:col-span-1 space-y-6",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$seller$2d$settings$2f$ProfileInfoCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                username: user === null || user === void 0 ? void 0 : user.username,
                                                bio: bio,
                                                setBio: setBio,
                                                preview: preview,
                                                profilePic: profilePic,
                                                subscriptionPrice: subscriptionPrice,
                                                setSubscriptionPrice: setSubscriptionPrice,
                                                handleProfilePicChange: handleProfilePicChange,
                                                removeProfilePic: removeProfilePic,
                                                profilePicInputRef: profilePicInputRef,
                                                isUploading: profileUploading
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/sellers/profile/page.tsx",
                                                lineNumber: 74,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex justify-center",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$seller$2d$settings$2f$utils$2f$SaveButton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                    onClick: handleSave,
                                                    showSuccess: saveSuccess,
                                                    showError: saveError,
                                                    isLoading: isSaving
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/sellers/profile/page.tsx",
                                                    lineNumber: 90,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/sellers/profile/page.tsx",
                                                lineNumber: 89,
                                                columnNumber: 17
                                            }, this),
                                            sellerTierInfo && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$seller$2d$settings$2f$TierProgressCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                sellerTierInfo: sellerTierInfo,
                                                userStats: userStats,
                                                tierProgress: tierProgress,
                                                nextTier: nextTier,
                                                onTierClick: setSelectedTierDetails
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/sellers/profile/page.tsx",
                                                lineNumber: 99,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/sellers/profile/page.tsx",
                                        lineNumber: 73,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "lg:col-span-2",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$seller$2d$settings$2f$GalleryManager$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            galleryImages: galleryImages,
                                            selectedFiles: selectedFiles,
                                            isUploading: galleryUploading,
                                            uploadProgress: uploadProgress,
                                            multipleFileInputRef: multipleFileInputRef,
                                            handleMultipleFileChange: handleMultipleFileChange,
                                            uploadGalleryImages: uploadGalleryImages,
                                            removeGalleryImage: removeGalleryImage,
                                            removeSelectedFile: removeSelectedFile,
                                            clearAllGalleryImages: clearAllGalleryImages
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/sellers/profile/page.tsx",
                                            lineNumber: 111,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/sellers/profile/page.tsx",
                                        lineNumber: 110,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/sellers/profile/page.tsx",
                                lineNumber: 71,
                                columnNumber: 13
                            }, this),
                            sellerTierInfo && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$seller$2d$settings$2f$TierDisplaySection$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                sellerTierInfo: sellerTierInfo,
                                userStats: userStats,
                                nextTier: nextTier,
                                selectedTierDetails: selectedTierDetails,
                                onTierSelect: setSelectedTierDetails
                            }, void 0, false, {
                                fileName: "[project]/src/app/sellers/profile/page.tsx",
                                lineNumber: 128,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/sellers/profile/page.tsx",
                        lineNumber: 67,
                        columnNumber: 11
                    }, this),
                    selectedTierDetails && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$seller$2d$settings$2f$modals$2f$TierDetailsModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        selectedTier: selectedTierDetails,
                        onClose: ()=>setSelectedTierDetails(null)
                    }, void 0, false, {
                        fileName: "[project]/src/app/sellers/profile/page.tsx",
                        lineNumber: 140,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/sellers/profile/page.tsx",
                lineNumber: 66,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/sellers/profile/page.tsx",
            lineNumber: 65,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/sellers/profile/page.tsx",
        lineNumber: 64,
        columnNumber: 5
    }, this);
}
_s(SellerProfileSettingsPage, "M28MdKZGe3p6B+mXDl2wfDrjx/8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$seller$2d$settings$2f$useProfileSettings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useProfileSettings"]
    ];
});
_c = SellerProfileSettingsPage;
var _c;
__turbopack_context__.k.register(_c, "SellerProfileSettingsPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=src_29a52010._.js.map