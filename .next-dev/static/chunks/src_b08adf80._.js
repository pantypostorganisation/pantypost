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
"[project]/src/hooks/useSellerMessages.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/hooks/useSellerMessages.ts - OPTIMISTIC VERSION
__turbopack_context__.s({
    "useSellerMessages": ()=>useSellerMessages
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/AuthContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$ListingContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/ListingContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$MessageContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/MessageContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$RequestContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/RequestContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WalletContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/WalletContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/index.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/storage.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$cloudinary$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/cloudinary.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/rate-limiter.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$reports$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/reports.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/validation/schemas.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-client] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-browser/v4.js [app-client] (ecmascript) <export default as v4>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
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
;
;
;
;
// Helper function
const getConversationKey = (userA, userB)=>{
    // Sanitize usernames before creating key
    const sanitizedA = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(userA);
    const sanitizedB = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(userB);
    return [
        sanitizedA,
        sanitizedB
    ].sort().join('-');
};
// Define message schema for validation
const MessageSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    sender: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(100),
    receiver: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(100),
    content: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(0).max(5000),
    date: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    read: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().optional(),
    isRead: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().optional(),
    type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'normal',
        'customRequest',
        'image',
        'tip'
    ]).optional(),
    meta: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
        title: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(200).optional(),
        price: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(0).max(10000).optional(),
        tags: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(50)).max(20).optional(),
        message: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(1000).optional(),
        imageUrl: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url().optional(),
        tipAmount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(1).max(500).optional()
    }).optional()
}).passthrough(); // Allow additional fields like id
function useSellerMessages() {
    _s();
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const { addSellerNotification, users } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$ListingContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useListings"])();
    const { messages, sendMessage, markMessagesAsRead, blockUser, unblockUser, reportUser, isBlocked, hasReported, clearMessageNotifications, getMessagesForUsers, refreshMessages } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$MessageContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMessages"])();
    const { requests, addRequest, getRequestsForUser, respondToRequest, markRequestAsPaid, getRequestById } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$RequestContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRequests"])();
    const { getBuyerBalance, purchaseCustomRequest } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WalletContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWallet"])();
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"])();
    // Add state to track message updates
    const [messageUpdateCounter, setMessageUpdateCounter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    // Track optimistic messages locally
    const [optimisticMessages, setOptimisticMessages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const optimisticMessageIds = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(new Map()); // tempId -> realId mapping
    // Rate limiting
    const { checkLimit: checkMessageLimit } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRateLimit"])('MESSAGE_SEND', {
        maxAttempts: 30,
        windowMs: 60 * 1000 // 1 minute
    });
    const { checkLimit: checkImageLimit } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRateLimit"])('IMAGE_UPLOAD', {
        maxAttempts: 10,
        windowMs: 60 * 60 * 1000 // 1 hour
    });
    const { checkLimit: checkRequestLimit } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRateLimit"])('CUSTOM_REQUEST', {
        maxAttempts: 5,
        windowMs: 60 * 60 * 1000 // 1 hour
    });
    // State for UI
    const [previewImage, setPreviewImage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [searchQuery, setSearchQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [filterBy, setFilterBy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('all');
    const [activeThread, setActiveThread] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [observerReadMessages, setObserverReadMessages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(new Set());
    // State for message input
    const [replyMessage, setReplyMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [selectedImage, setSelectedImage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isImageLoading, setIsImageLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [imageError, setImageError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [showEmojiPicker, setShowEmojiPicker] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [recentEmojis, setRecentEmojis] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    // State for custom request editing
    const [editRequestId, setEditRequestId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [editPrice, setEditPrice] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [editTitle, setEditTitle] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [editMessage, setEditMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    // Validation errors
    const [validationErrors, setValidationErrors] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const readThreadsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(new Set());
    const messagesEndRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const hasLoadedEmojis = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const lastActiveThread = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const isAdmin = (user === null || user === void 0 ? void 0 : user.role) === 'admin';
    // CRITICAL: Listen for new messages and handle optimistic updates
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useSellerMessages.useEffect": ()=>{
            const handleNewMessage = {
                "useSellerMessages.useEffect.handleNewMessage": (event)=>{
                    const customEvent = event;
                    const newMessage = customEvent.detail;
                    console.log('[useSellerMessages] New message event received:', newMessage);
                    // Check if this is a confirmation of an optimistic message
                    if (newMessage.sender === (user === null || user === void 0 ? void 0 : user.username) && newMessage.receiver === activeThread) {
                        // This is our message coming back from the server
                        const threadId = getConversationKey(newMessage.sender, newMessage.receiver);
                        // Find matching optimistic message by content and approximate time
                        setOptimisticMessages({
                            "useSellerMessages.useEffect.handleNewMessage": (prev)=>{
                                const threadOptimistic = prev[threadId] || [];
                                const matchingOptimistic = threadOptimistic.find({
                                    "useSellerMessages.useEffect.handleNewMessage.matchingOptimistic": (msg)=>msg._optimistic && msg.content === newMessage.content && Math.abs(new Date(msg.date).getTime() - new Date(newMessage.date || newMessage.createdAt).getTime()) < 5000 // Within 5 seconds
                                }["useSellerMessages.useEffect.handleNewMessage.matchingOptimistic"]);
                                if (matchingOptimistic && matchingOptimistic._tempId) {
                                    // Store the mapping
                                    optimisticMessageIds.current.set(matchingOptimistic._tempId, newMessage.id);
                                    // Remove the optimistic message (real one will be in main messages now)
                                    return {
                                        ...prev,
                                        [threadId]: threadOptimistic.filter({
                                            "useSellerMessages.useEffect.handleNewMessage": (msg)=>msg._tempId !== matchingOptimistic._tempId
                                        }["useSellerMessages.useEffect.handleNewMessage"])
                                    };
                                }
                                return prev;
                            }
                        }["useSellerMessages.useEffect.handleNewMessage"]);
                    }
                    // Force a re-render to show the new message
                    setMessageUpdateCounter({
                        "useSellerMessages.useEffect.handleNewMessage": (prev)=>prev + 1
                    }["useSellerMessages.useEffect.handleNewMessage"]);
                    // If the message is for the active thread, scroll to bottom
                    if (activeThread && (newMessage.sender === activeThread || newMessage.receiver === activeThread)) {
                        setTimeout({
                            "useSellerMessages.useEffect.handleNewMessage": ()=>{
                                var _messagesEndRef_current;
                                (_messagesEndRef_current = messagesEndRef.current) === null || _messagesEndRef_current === void 0 ? void 0 : _messagesEndRef_current.scrollIntoView({
                                    behavior: 'smooth'
                                });
                            }
                        }["useSellerMessages.useEffect.handleNewMessage"], 100);
                    }
                }
            }["useSellerMessages.useEffect.handleNewMessage"];
            // Also listen for read events to update UI
            const handleMessageRead = {
                "useSellerMessages.useEffect.handleMessageRead": (event)=>{
                    const customEvent = event;
                    console.log('[useSellerMessages] Message read event received:', customEvent.detail);
                    // Update optimistic messages' read status
                    if (customEvent.detail.messageIds) {
                        setOptimisticMessages({
                            "useSellerMessages.useEffect.handleMessageRead": (prev)=>{
                                const updated = {
                                    ...prev
                                };
                                Object.keys(updated).forEach({
                                    "useSellerMessages.useEffect.handleMessageRead": (threadId)=>{
                                        updated[threadId] = updated[threadId].map({
                                            "useSellerMessages.useEffect.handleMessageRead": (msg)=>{
                                                // Check if this message's real ID is in the read list
                                                const realId = msg._tempId ? optimisticMessageIds.current.get(msg._tempId) : msg.id;
                                                if (realId && customEvent.detail.messageIds.includes(realId)) {
                                                    return {
                                                        ...msg,
                                                        isRead: true,
                                                        read: true
                                                    };
                                                }
                                                return msg;
                                            }
                                        }["useSellerMessages.useEffect.handleMessageRead"]);
                                    }
                                }["useSellerMessages.useEffect.handleMessageRead"]);
                                return updated;
                            }
                        }["useSellerMessages.useEffect.handleMessageRead"]);
                    }
                    // Force a re-render to update read receipts
                    setMessageUpdateCounter({
                        "useSellerMessages.useEffect.handleMessageRead": (prev)=>prev + 1
                    }["useSellerMessages.useEffect.handleMessageRead"]);
                }
            }["useSellerMessages.useEffect.handleMessageRead"];
            window.addEventListener('message:new', handleNewMessage);
            window.addEventListener('message:read', handleMessageRead);
            return ({
                "useSellerMessages.useEffect": ()=>{
                    window.removeEventListener('message:new', handleNewMessage);
                    window.removeEventListener('message:read', handleMessageRead);
                }
            })["useSellerMessages.useEffect"];
        }
    }["useSellerMessages.useEffect"], [
        activeThread,
        user === null || user === void 0 ? void 0 : user.username
    ]);
    // Clean up old optimistic messages periodically
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useSellerMessages.useEffect": ()=>{
            const interval = setInterval({
                "useSellerMessages.useEffect.interval": ()=>{
                    setOptimisticMessages({
                        "useSellerMessages.useEffect.interval": (prev)=>{
                            const updated = {
                                ...prev
                            };
                            const now = Date.now();
                            Object.keys(updated).forEach({
                                "useSellerMessages.useEffect.interval": (threadId)=>{
                                    // Remove optimistic messages older than 10 seconds (they should have been confirmed by now)
                                    updated[threadId] = updated[threadId].filter({
                                        "useSellerMessages.useEffect.interval": (msg)=>{
                                            if (msg._optimistic) {
                                                const messageTime = new Date(msg.date).getTime();
                                                return now - messageTime < 10000; // Keep if less than 10 seconds old
                                            }
                                            return true;
                                        }
                                    }["useSellerMessages.useEffect.interval"]);
                                }
                            }["useSellerMessages.useEffect.interval"]);
                            return updated;
                        }
                    }["useSellerMessages.useEffect.interval"]);
                    // Clean up ID mappings
                    if (optimisticMessageIds.current.size > 100) {
                        optimisticMessageIds.current.clear();
                    }
                }
            }["useSellerMessages.useEffect.interval"], 10000); // Every 10 seconds
            return ({
                "useSellerMessages.useEffect": ()=>clearInterval(interval)
            })["useSellerMessages.useEffect"];
        }
    }["useSellerMessages.useEffect"], []);
    // Load recent emojis once on mount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useSellerMessages.useEffect": ()=>{
            const loadRecentEmojis = {
                "useSellerMessages.useEffect.loadRecentEmojis": async ()=>{
                    if (!hasLoadedEmojis.current) {
                        hasLoadedEmojis.current = true;
                        try {
                            const stored = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_recent_emojis', []);
                            if (Array.isArray(stored) && stored.every({
                                "useSellerMessages.useEffect.loadRecentEmojis": (item)=>typeof item === 'string'
                            }["useSellerMessages.useEffect.loadRecentEmojis"])) {
                                // Sanitize stored emojis
                                const sanitized = stored.map({
                                    "useSellerMessages.useEffect.loadRecentEmojis.sanitized": (emoji)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(emoji).slice(0, 10)
                                }["useSellerMessages.useEffect.loadRecentEmojis.sanitized"]);
                                setRecentEmojis(sanitized.slice(0, 30));
                            }
                        } catch (error) {
                            console.error('Failed to load recent emojis:', error);
                        }
                    }
                }
            }["useSellerMessages.useEffect.loadRecentEmojis"];
            loadRecentEmojis();
        }
    }["useSellerMessages.useEffect"], []);
    // Save recent emojis with debounce
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useSellerMessages.useEffect": ()=>{
            const timeoutId = setTimeout({
                "useSellerMessages.useEffect.timeoutId": async ()=>{
                    try {
                        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_recent_emojis', recentEmojis.slice(0, 30));
                    } catch (error) {
                        console.error('Failed to save recent emojis:', error);
                    }
                }
            }["useSellerMessages.useEffect.timeoutId"], 500);
            return ({
                "useSellerMessages.useEffect": ()=>clearTimeout(timeoutId)
            })["useSellerMessages.useEffect"];
        }
    }["useSellerMessages.useEffect"], [
        recentEmojis
    ]);
    // Handle URL thread parameter with validation
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useSellerMessages.useEffect": ()=>{
            const threadParam = searchParams.get('thread');
            if (threadParam && !activeThread && user) {
                // Sanitize and validate thread parameter
                const sanitizedThread = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(threadParam);
                if (sanitizedThread && sanitizedThread.length <= 100) {
                    setActiveThread(sanitizedThread);
                }
            }
        }
    }["useSellerMessages.useEffect"], [
        searchParams,
        user,
        activeThread
    ]);
    // ENHANCED: Merge real messages with optimistic messages
    const { threads, unreadCounts, lastMessages, buyerProfiles, totalUnreadCount } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useSellerMessages.useMemo": ()=>{
            const threads = {};
            const unreadCounts = {};
            const lastMessages = {};
            const buyerProfiles = {};
            let totalUnreadCount = 0;
            if (!user) {
                return {
                    threads,
                    unreadCounts,
                    lastMessages,
                    buyerProfiles,
                    totalUnreadCount
                };
            }
            console.log('[SellerMessages] Processing messages for seller:', user.username);
            // Process all conversations to find ones involving the seller
            Object.entries(messages).forEach({
                "useSellerMessages.useMemo": (param)=>{
                    let [conversationKey, msgs] = param;
                    if (!Array.isArray(msgs) || msgs.length === 0) return;
                    // Check if this conversation involves the current seller
                    const participants = conversationKey.split('-');
                    const involvesCurrentSeller = participants.includes(user.username);
                    if (!involvesCurrentSeller) return;
                    // Determine the other party
                    const otherParty = participants.find({
                        "useSellerMessages.useMemo.otherParty": (p)=>p !== user.username
                    }["useSellerMessages.useMemo.otherParty"]);
                    if (!otherParty) return;
                    // Check if other party is a buyer (skip seller-to-seller conversations)
                    const otherUser = users === null || users === void 0 ? void 0 : users[otherParty];
                    if ((otherUser === null || otherUser === void 0 ? void 0 : otherUser.role) === 'seller' || (otherUser === null || otherUser === void 0 ? void 0 : otherUser.role) === 'admin') {
                        return;
                    }
                    // Validate messages
                    const validMessages = msgs.filter({
                        "useSellerMessages.useMemo.validMessages": (msg)=>{
                            try {
                                return msg && msg.sender && msg.receiver && msg.content !== undefined && msg.date;
                            } catch (error) {
                                console.warn('Invalid message skipped:', error);
                                return false;
                            }
                        }
                    }["useSellerMessages.useMemo.validMessages"]);
                    if (validMessages.length === 0 && !optimisticMessages[conversationKey]) return;
                    // Combine real messages with optimistic ones for this thread
                    let combinedMessages = [
                        ...validMessages
                    ];
                    // Add optimistic messages for this thread
                    const threadOptimistic = optimisticMessages[conversationKey] || [];
                    if (threadOptimistic.length > 0) {
                        combinedMessages = [
                            ...combinedMessages,
                            ...threadOptimistic
                        ];
                    }
                    // Sort messages by date
                    combinedMessages.sort({
                        "useSellerMessages.useMemo": (a, b)=>new Date(a.date).getTime() - new Date(b.date).getTime()
                    }["useSellerMessages.useMemo"]);
                    // Add to threads
                    threads[otherParty] = combinedMessages;
                    // Get last message
                    if (combinedMessages.length > 0) {
                        lastMessages[otherParty] = combinedMessages[combinedMessages.length - 1];
                    }
                    // Count unread messages (only real messages, not optimistic)
                    const threadUnreadCount = validMessages.filter({
                        "useSellerMessages.useMemo": (msg)=>msg.receiver === user.username && msg.sender === otherParty && !msg.read && !msg.isRead
                    }["useSellerMessages.useMemo"]).length;
                    unreadCounts[otherParty] = threadUnreadCount;
                    // Add to total if not already marked as read
                    if (!readThreadsRef.current.has(otherParty) && threadUnreadCount > 0) {
                        totalUnreadCount += threadUnreadCount;
                    }
                    // Get buyer profile
                    const buyerInfo = users === null || users === void 0 ? void 0 : users[otherParty];
                    const isVerified = (buyerInfo === null || buyerInfo === void 0 ? void 0 : buyerInfo.verified) || (buyerInfo === null || buyerInfo === void 0 ? void 0 : buyerInfo.verificationStatus) === 'verified';
                    buyerProfiles[otherParty] = {
                        pic: null,
                        verified: isVerified || false
                    };
                }
            }["useSellerMessages.useMemo"]);
            return {
                threads,
                unreadCounts,
                lastMessages,
                buyerProfiles,
                totalUnreadCount
            };
        }
    }["useSellerMessages.useMemo"], [
        user === null || user === void 0 ? void 0 : user.username,
        messages,
        users,
        optimisticMessages,
        messageUpdateCounter
    ]);
    // Get seller's requests with validation
    const sellerRequests = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useSellerMessages.useMemo[sellerRequests]": ()=>{
            if (!user) return [];
            const rawRequests = getRequestsForUser(user.username, 'seller');
            // Validate requests
            return rawRequests.filter({
                "useSellerMessages.useMemo[sellerRequests]": (request)=>{
                    try {
                        // Basic validation
                        return request.id && request.buyer && request.seller === user.username && typeof request.price === 'number' && request.price > 0 && request.price <= 10000;
                    } catch (e) {
                        return false;
                    }
                }
            }["useSellerMessages.useMemo[sellerRequests]"]);
        }
    }["useSellerMessages.useMemo[sellerRequests]"], [
        user === null || user === void 0 ? void 0 : user.username,
        getRequestsForUser,
        messageUpdateCounter
    ]);
    // Compute UI unread counts
    const uiUnreadCounts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useSellerMessages.useMemo[uiUnreadCounts]": ()=>{
            const counts = {};
            if (threads) {
                Object.keys(threads).forEach({
                    "useSellerMessages.useMemo[uiUnreadCounts]": (buyer)=>{
                        counts[buyer] = readThreadsRef.current.has(buyer) ? 0 : unreadCounts[buyer];
                    }
                }["useSellerMessages.useMemo[uiUnreadCounts]"]);
            }
            return counts;
        }
    }["useSellerMessages.useMemo[uiUnreadCounts]"], [
        threads,
        unreadCounts,
        messageUpdateCounter
    ]);
    // Mark messages as read when thread is selected AND clear notifications
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useSellerMessages.useEffect": ()=>{
            if (!activeThread || !user || activeThread === lastActiveThread.current) {
                return;
            }
            // Update the last active thread
            lastActiveThread.current = activeThread;
            // Clear message notifications for this buyer
            clearMessageNotifications(user.username, activeThread);
            // Check if there are unread messages
            const threadMessages = threads[activeThread] || [];
            const hasUnread = threadMessages.some({
                "useSellerMessages.useEffect.hasUnread": (msg)=>msg.receiver === user.username && msg.sender === activeThread && !msg.read && !msg.isRead && !msg._optimistic
            }["useSellerMessages.useEffect.hasUnread"]);
            if (hasUnread) {
                // Use a small delay to prevent render loops
                const timer = setTimeout({
                    "useSellerMessages.useEffect.timer": ()=>{
                        markMessagesAsRead(user.username, activeThread);
                        // Update read threads ref
                        if (!readThreadsRef.current.has(activeThread)) {
                            readThreadsRef.current.add(activeThread);
                        }
                        // Force update
                        setMessageUpdateCounter({
                            "useSellerMessages.useEffect.timer": (prev)=>prev + 1
                        }["useSellerMessages.useEffect.timer"]);
                    }
                }["useSellerMessages.useEffect.timer"], 100);
                return ({
                    "useSellerMessages.useEffect": ()=>clearTimeout(timer)
                })["useSellerMessages.useEffect"];
            }
            return;
        }
    }["useSellerMessages.useEffect"], [
        activeThread,
        user === null || user === void 0 ? void 0 : user.username,
        markMessagesAsRead,
        threads,
        clearMessageNotifications
    ]);
    // Handle message visibility for marking as read
    const handleMessageVisible = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useSellerMessages.useCallback[handleMessageVisible]": (msg)=>{
            if (!user || msg.sender === user.username || msg.read || msg.isRead || msg._optimistic) return;
            const messageId = "".concat(msg.sender, "-").concat(msg.receiver, "-").concat(msg.date);
            if (observerReadMessages.has(messageId)) return;
            // Use requestAnimationFrame to batch updates
            requestAnimationFrame({
                "useSellerMessages.useCallback[handleMessageVisible]": ()=>{
                    markMessagesAsRead(user.username, msg.sender);
                    setObserverReadMessages({
                        "useSellerMessages.useCallback[handleMessageVisible]": (prev)=>{
                            const newSet = new Set(prev);
                            newSet.add(messageId);
                            return newSet;
                        }
                    }["useSellerMessages.useCallback[handleMessageVisible]"]);
                    // Update read threads if all messages are read
                    const threadMessages = threads[msg.sender] || [];
                    const remainingUnread = threadMessages.filter({
                        "useSellerMessages.useCallback[handleMessageVisible]": (m)=>!m.read && !m.isRead && !m._optimistic && m.sender === msg.sender && m.receiver === user.username && "".concat(m.sender, "-").concat(m.receiver, "-").concat(m.date) !== messageId
                    }["useSellerMessages.useCallback[handleMessageVisible]"]).length;
                    if (remainingUnread === 0 && !readThreadsRef.current.has(msg.sender)) {
                        readThreadsRef.current.add(msg.sender);
                    }
                    // Force update
                    setMessageUpdateCounter({
                        "useSellerMessages.useCallback[handleMessageVisible]": (prev)=>prev + 1
                    }["useSellerMessages.useCallback[handleMessageVisible]"]);
                }
            }["useSellerMessages.useCallback[handleMessageVisible]"]);
        }
    }["useSellerMessages.useCallback[handleMessageVisible]"], [
        user,
        markMessagesAsRead,
        threads
    ]);
    // OPTIMISTIC: Handle sending reply with instant UI update
    const handleReply = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useSellerMessages.useCallback[handleReply]": async ()=>{
            if (!activeThread || !user || !replyMessage.trim() && !selectedImage) return;
            // Check rate limit
            const rateLimitResult = checkMessageLimit();
            if (!rateLimitResult.allowed) {
                setValidationErrors({
                    message: "Too many messages. Wait ".concat(rateLimitResult.waitTime, " seconds.")
                });
                return;
            }
            try {
                // Validate and sanitize message content
                const validationResult = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["messageSchemas"].messageContent.safeParse(replyMessage);
                if (!validationResult.success && replyMessage.trim()) {
                    setValidationErrors({
                        message: validationResult.error.errors[0].message
                    });
                    return;
                }
                const sanitizedContent = replyMessage ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeHtml"])(validationResult.data || replyMessage) : '';
                // For image messages, validate URL
                if (selectedImage) {
                    const urlValidation = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url().safeParse(selectedImage);
                    if (!urlValidation.success) {
                        setValidationErrors({
                            image: 'Invalid image URL'
                        });
                        return;
                    }
                }
                console.log('[SellerMessages] Sending message:', {
                    text: sanitizedContent,
                    imageUrl: selectedImage,
                    receiver: activeThread
                });
                // For image messages, allow empty text
                const messageContent = sanitizedContent || (selectedImage ? 'Image shared' : '');
                // Create optimistic message
                const tempId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])();
                const threadId = getConversationKey(user.username, activeThread);
                const optimisticMsg = {
                    id: tempId,
                    _tempId: tempId,
                    _optimistic: true,
                    sender: user.username,
                    receiver: activeThread,
                    content: messageContent,
                    date: new Date().toISOString(),
                    isRead: false,
                    read: false,
                    type: selectedImage ? 'image' : 'normal',
                    meta: selectedImage ? {
                        imageUrl: selectedImage
                    } : undefined
                };
                // Add optimistic message to UI immediately
                setOptimisticMessages({
                    "useSellerMessages.useCallback[handleReply]": (prev)=>({
                            ...prev,
                            [threadId]: [
                                ...prev[threadId] || [],
                                optimisticMsg
                            ]
                        })
                }["useSellerMessages.useCallback[handleReply]"]);
                // Clear input immediately for better UX
                setReplyMessage('');
                setSelectedImage(null);
                setImageError(null);
                setShowEmojiPicker(false);
                setValidationErrors({});
                // Scroll to bottom immediately
                setTimeout({
                    "useSellerMessages.useCallback[handleReply]": ()=>{
                        var _messagesEndRef_current;
                        (_messagesEndRef_current = messagesEndRef.current) === null || _messagesEndRef_current === void 0 ? void 0 : _messagesEndRef_current.scrollIntoView({
                            behavior: 'smooth'
                        });
                    }
                }["useSellerMessages.useCallback[handleReply]"], 0);
                // Send the actual message in the background
                sendMessage(user.username, activeThread, messageContent, {
                    type: selectedImage ? 'image' : 'normal',
                    meta: selectedImage ? {
                        imageUrl: selectedImage
                    } : undefined
                }).catch({
                    "useSellerMessages.useCallback[handleReply]": (error)=>{
                        console.error('Failed to send message:', error);
                        // Remove optimistic message on error
                        setOptimisticMessages({
                            "useSellerMessages.useCallback[handleReply]": (prev)=>{
                                var _prev_threadId;
                                return {
                                    ...prev,
                                    [threadId]: ((_prev_threadId = prev[threadId]) === null || _prev_threadId === void 0 ? void 0 : _prev_threadId.filter({
                                        "useSellerMessages.useCallback[handleReply]": (msg)=>msg._tempId !== tempId
                                    }["useSellerMessages.useCallback[handleReply]"])) || []
                                };
                            }
                        }["useSellerMessages.useCallback[handleReply]"]);
                        // Restore input on error
                        setReplyMessage(messageContent);
                        setSelectedImage(selectedImage);
                        setValidationErrors({
                            message: 'Failed to send message. Please try again.'
                        });
                    }
                }["useSellerMessages.useCallback[handleReply]"]);
            } catch (error) {
                console.error('Failed to send message:', error);
                setValidationErrors({
                    message: 'Failed to send message'
                });
            }
        }
    }["useSellerMessages.useCallback[handleReply]"], [
        activeThread,
        user,
        replyMessage,
        selectedImage,
        sendMessage,
        checkMessageLimit
    ]);
    // Handle block toggle
    const handleBlockToggle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useSellerMessages.useCallback[handleBlockToggle]": ()=>{
            if (!activeThread || !user) return;
            if (isBlocked(user.username, activeThread)) {
                unblockUser(user.username, activeThread);
            } else {
                blockUser(user.username, activeThread);
            }
            // Force update
            setMessageUpdateCounter({
                "useSellerMessages.useCallback[handleBlockToggle]": (prev)=>prev + 1
            }["useSellerMessages.useCallback[handleBlockToggle]"]);
        }
    }["useSellerMessages.useCallback[handleBlockToggle]"], [
        activeThread,
        user,
        isBlocked,
        unblockUser,
        blockUser
    ]);
    // Handle report
    const handleReport = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useSellerMessages.useCallback[handleReport]": async ()=>{
            if (!activeThread || !user) return;
            if (!hasReported(user.username, activeThread)) {
                var _threads_activeThread_, _threads_activeThread;
                // Use the reports service to send to MongoDB
                const reportData = {
                    reportedUser: activeThread,
                    reportType: 'harassment',
                    description: "Buyer reported from messages by seller ".concat(user.username),
                    severity: 'medium',
                    relatedMessageId: (_threads_activeThread = threads[activeThread]) === null || _threads_activeThread === void 0 ? void 0 : (_threads_activeThread_ = _threads_activeThread[threads[activeThread].length - 1]) === null || _threads_activeThread_ === void 0 ? void 0 : _threads_activeThread_.id
                };
                try {
                    const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$reports$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["reportsService"].submitReport(reportData);
                    if (response.success) {
                        // Also update local state for UI
                        reportUser(user.username, activeThread);
                    }
                } catch (error) {
                    console.error('Failed to submit report:', error);
                    // Fallback to local report
                    reportUser(user.username, activeThread);
                }
            }
            // Force update
            setMessageUpdateCounter({
                "useSellerMessages.useCallback[handleReport]": (prev)=>prev + 1
            }["useSellerMessages.useCallback[handleReport]"]);
        }
    }["useSellerMessages.useCallback[handleReport]"], [
        activeThread,
        user,
        hasReported,
        reportUser,
        threads
    ]);
    // Handle accepting custom request with validation
    const handleAccept = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useSellerMessages.useCallback[handleAccept]": async (customRequestId)=>{
            if (!user) return;
            // Validate request ID
            const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customRequestId) || /^req_\d+_[a-z0-9]+$/i.test(customRequestId);
            if (!isValidUuid) {
                console.error('Invalid request ID format');
                return;
            }
            const request = requests.find({
                "useSellerMessages.useCallback[handleAccept].request": (r)=>r.id === customRequestId
            }["useSellerMessages.useCallback[handleAccept].request"]);
            if (!request) return;
            // Validate request data
            if (!request.price || request.price <= 0 || request.price > 10000) {
                console.error('Invalid request price');
                return;
            }
            // Check rate limit
            const rateLimitResult = checkRequestLimit();
            if (!rateLimitResult.allowed) {
                addSellerNotification(user.username, "⚠️ Too many requests. Wait ".concat(rateLimitResult.waitTime, " seconds."));
                return;
            }
            // Check if buyer has sufficient balance
            const markupPrice = request.price * 1.1;
            const buyerBalance = getBuyerBalance(request.buyer);
            if (buyerBalance >= markupPrice) {
                // Auto-process payment
                const customRequest = {
                    requestId: request.id,
                    buyer: request.buyer,
                    seller: user.username,
                    amount: request.price,
                    description: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(request.title),
                    metadata: request
                };
                const success = await purchaseCustomRequest(customRequest);
                if (success) {
                    // Mark as paid
                    markRequestAsPaid(request.id);
                    // Notify seller (self)
                    addSellerNotification(user.username, '💰 Custom request "'.concat((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(request.title), '" has been paid! Check your orders to fulfill.'));
                    // Send confirmation message to buyer
                    await sendMessage(user.username, request.buyer, '✅ Your custom request "'.concat((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(request.title), '" has been accepted and automatically paid!'), {
                        type: 'normal'
                    });
                } else {
                    // Payment failed
                    await sendMessage(user.username, request.buyer, '⚠️ Custom request "'.concat((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(request.title), '" accepted but payment failed. Please try paying manually.'), {
                        type: 'normal'
                    });
                    respondToRequest(customRequestId, 'accepted', undefined, undefined, user.username);
                }
            } else {
                // Insufficient balance - just accept without payment
                respondToRequest(customRequestId, 'accepted', undefined, undefined, user.username);
                await sendMessage(user.username, request.buyer, '✅ Your custom request "'.concat((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(request.title), '" has been accepted! Payment required - you have insufficient balance (need $').concat(markupPrice.toFixed(2), ")."), {
                    type: 'normal'
                });
            }
            // Force update
            setMessageUpdateCounter({
                "useSellerMessages.useCallback[handleAccept]": (prev)=>prev + 1
            }["useSellerMessages.useCallback[handleAccept]"]);
        }
    }["useSellerMessages.useCallback[handleAccept]"], [
        user,
        requests,
        getBuyerBalance,
        purchaseCustomRequest,
        markRequestAsPaid,
        addSellerNotification,
        sendMessage,
        respondToRequest,
        checkRequestLimit
    ]);
    // Handle declining custom request
    const handleDecline = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useSellerMessages.useCallback[handleDecline]": (customRequestId)=>{
            if (!user) return;
            // Validate request ID
            const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customRequestId) || /^req_\d+_[a-z0-9]+$/i.test(customRequestId);
            if (!isValidUuid) {
                console.error('Invalid request ID format');
                return;
            }
            respondToRequest(customRequestId, 'rejected', undefined, undefined, user.username);
            const request = requests.find({
                "useSellerMessages.useCallback[handleDecline].request": (r)=>r.id === customRequestId
            }["useSellerMessages.useCallback[handleDecline].request"]);
            if (request) {
                sendMessage(user.username, request.buyer, 'Your custom request "'.concat((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(request.title), '" has been declined.'), {
                    type: 'normal'
                });
            }
            // Force update
            setMessageUpdateCounter({
                "useSellerMessages.useCallback[handleDecline]": (prev)=>prev + 1
            }["useSellerMessages.useCallback[handleDecline]"]);
        }
    }["useSellerMessages.useCallback[handleDecline]"], [
        user,
        respondToRequest,
        requests,
        sendMessage
    ]);
    // Handle custom request editing with validation
    const handleEditRequest = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useSellerMessages.useCallback[handleEditRequest]": (requestId, title, price, message)=>{
            // Validate inputs
            const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId) || /^req_\d+_[a-z0-9]+$/i.test(requestId);
            if (!isValidUuid) {
                console.error('Invalid request ID format');
                return;
            }
            setEditRequestId(requestId);
            setEditTitle((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(title).slice(0, 200));
            setEditPrice((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeCurrency"])(price));
            setEditMessage((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeHtml"])(message).slice(0, 1000));
        }
    }["useSellerMessages.useCallback[handleEditRequest]"], []);
    // Handle submitting edited request with validation
    const handleEditSubmit = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useSellerMessages.useCallback[handleEditSubmit]": ()=>{
            if (!editRequestId || !user || editTitle.trim() === '' || editPrice === '' || editPrice <= 0) return;
            // Validate all inputs
            try {
                const validatedData = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["messageSchemas"].customRequest.parse({
                    title: editTitle,
                    description: editMessage,
                    price: Number(editPrice)
                });
                const request = requests.find({
                    "useSellerMessages.useCallback[handleEditSubmit].request": (r)=>r.id === editRequestId
                }["useSellerMessages.useCallback[handleEditSubmit].request"]);
                if (!request) return;
                // Check rate limit
                const rateLimitResult = checkRequestLimit();
                if (!rateLimitResult.allowed) {
                    setValidationErrors({
                        edit: "Too many edits. Wait ".concat(rateLimitResult.waitTime, " seconds.")
                    });
                    return;
                }
                // Update the request with seller as editor
                respondToRequest(editRequestId, 'edited', validatedData.description, {
                    title: validatedData.title,
                    price: validatedData.price,
                    description: validatedData.description
                }, user.username);
                // Send message about the edit
                sendMessage(user.username, request.buyer, "📝 I've modified your custom request \"".concat(validatedData.title, '"'), {
                    type: 'customRequest',
                    meta: {
                        id: editRequestId,
                        title: validatedData.title,
                        price: validatedData.price,
                        message: validatedData.description
                    }
                });
                // Reset edit state
                setEditRequestId(null);
                setEditTitle('');
                setEditPrice('');
                setEditMessage('');
                setValidationErrors({});
                // Force update
                setMessageUpdateCounter({
                    "useSellerMessages.useCallback[handleEditSubmit]": (prev)=>prev + 1
                }["useSellerMessages.useCallback[handleEditSubmit]"]);
                addSellerNotification(user.username, "Custom request modified and sent to buyer!");
            } catch (error) {
                if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].ZodError) {
                    setValidationErrors({
                        edit: error.errors[0].message
                    });
                } else {
                    setValidationErrors({
                        edit: 'Failed to update request'
                    });
                }
            }
        }
    }["useSellerMessages.useCallback[handleEditSubmit]"], [
        editRequestId,
        editTitle,
        editPrice,
        editMessage,
        user,
        requests,
        respondToRequest,
        sendMessage,
        addSellerNotification,
        checkRequestLimit
    ]);
    // Handle emoji click with sanitization
    const handleEmojiClick = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useSellerMessages.useCallback[handleEmojiClick]": (emoji)=>{
            // Sanitize emoji
            const sanitizedEmoji = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(emoji).slice(0, 10);
            setReplyMessage({
                "useSellerMessages.useCallback[handleEmojiClick]": (prev)=>prev + sanitizedEmoji
            }["useSellerMessages.useCallback[handleEmojiClick]"]);
            setRecentEmojis({
                "useSellerMessages.useCallback[handleEmojiClick]": (prev)=>{
                    const filtered = prev.filter({
                        "useSellerMessages.useCallback[handleEmojiClick].filtered": (e)=>e !== sanitizedEmoji
                    }["useSellerMessages.useCallback[handleEmojiClick].filtered"]);
                    return [
                        sanitizedEmoji,
                        ...filtered
                    ].slice(0, 30);
                }
            }["useSellerMessages.useCallback[handleEmojiClick]"]);
            setShowEmojiPicker(false);
        }
    }["useSellerMessages.useCallback[handleEmojiClick]"], []);
    // Handle image selection with enhanced validation
    const handleImageSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useSellerMessages.useCallback[handleImageSelect]": async (file)=>{
            if (!file) return;
            // Check rate limit
            const rateLimitResult = checkImageLimit();
            if (!rateLimitResult.allowed) {
                setImageError("Too many uploads. Wait ".concat(rateLimitResult.waitTime, " seconds."));
                return;
            }
            setIsImageLoading(true);
            setImageError(null);
            try {
                // Validate file with security service
                const validation = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].validateFileUpload(file, {
                    maxSize: 5 * 1024 * 1024,
                    allowedTypes: [
                        'image/jpeg',
                        'image/jpg',
                        'image/png',
                        'image/gif',
                        'image/webp'
                    ],
                    allowedExtensions: [
                        'jpg',
                        'jpeg',
                        'png',
                        'gif',
                        'webp'
                    ]
                });
                if (!validation.valid) {
                    throw new Error(validation.error || 'Invalid file');
                }
                // Upload to Cloudinary
                console.log('Uploading image to Cloudinary...');
                const uploadResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$cloudinary$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uploadToCloudinary"])(file);
                // Validate returned URL
                const urlValidation = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url().safeParse(uploadResult.url);
                if (!urlValidation.success) {
                    throw new Error('Invalid upload URL received');
                }
                // Set the Cloudinary URL
                setSelectedImage(uploadResult.url);
                console.log('Image uploaded successfully:', uploadResult.url);
            } catch (error) {
                console.error('Image upload error:', error);
                const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
                setImageError(errorMessage);
                setSelectedImage(null);
            } finally{
                setIsImageLoading(false);
            }
        }
    }["useSellerMessages.useCallback[handleImageSelect]"], [
        checkImageLimit
    ]);
    const isUserBlocked = !!(user && activeThread && isBlocked(user.username, activeThread));
    const isUserReported = !!(user && activeThread && hasReported(user.username, activeThread));
    return {
        // Auth
        user,
        isAdmin,
        // Messages & threads
        threads,
        unreadCounts,
        uiUnreadCounts,
        lastMessages,
        buyerProfiles,
        totalUnreadCount,
        activeThread,
        setActiveThread,
        // UI State
        previewImage,
        setPreviewImage,
        searchQuery,
        setSearchQuery: (query)=>setSearchQuery((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(query).slice(0, 100)),
        filterBy,
        setFilterBy,
        observerReadMessages,
        setObserverReadMessages,
        messagesEndRef,
        // Message input
        replyMessage,
        setReplyMessage: (msg)=>setReplyMessage(msg.slice(0, 5000)),
        selectedImage,
        setSelectedImage,
        isImageLoading,
        setIsImageLoading,
        imageError,
        setImageError,
        showEmojiPicker,
        setShowEmojiPicker,
        recentEmojis,
        // Custom requests
        sellerRequests,
        editRequestId,
        setEditRequestId,
        editPrice,
        setEditPrice: (price)=>setEditPrice(price === '' ? '' : (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeCurrency"])(price)),
        editTitle,
        setEditTitle: (title)=>setEditTitle((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(title).slice(0, 200)),
        editMessage,
        setEditMessage: (msg)=>setEditMessage((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeHtml"])(msg).slice(0, 1000)),
        // Validation
        validationErrors,
        // Actions
        handleReply,
        handleBlockToggle,
        handleReport,
        handleAccept,
        handleDecline,
        handleEditRequest,
        handleEditSubmit,
        handleImageSelect,
        handleMessageVisible,
        handleEmojiClick,
        // Status
        isUserBlocked,
        isUserReported
    };
}
_s(useSellerMessages, "tcly3mAytMfHNn/sa9V4axXz5F0=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$ListingContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useListings"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$MessageContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMessages"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$RequestContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRequests"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WalletContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWallet"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRateLimit"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRateLimit"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRateLimit"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/utils/messageUtils.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/utils/messageUtils.ts
__turbopack_context__.s({
    "checkImageExists": ()=>checkImageExists,
    "formatMessage": ()=>formatMessage,
    "formatTimeAgo": ()=>formatTimeAgo,
    "getInitial": ()=>getInitial,
    "getLatestCustomRequestMessages": ()=>getLatestCustomRequestMessages,
    "getMessageKey": ()=>getMessageKey,
    "getRecentEmojis": ()=>getRecentEmojis,
    "isSingleEmoji": ()=>isSingleEmoji,
    "saveRecentEmojis": ()=>saveRecentEmojis,
    "validateImageSize": ()=>validateImageSize
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/index.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/storage.service.ts [app-client] (ecmascript)");
;
function getLatestCustomRequestMessages(messages, requests) {
    const seen = new Set();
    const result = [];
    for(let i = messages.length - 1; i >= 0; i--){
        const msg = messages[i];
        if (msg.type === 'customRequest' && msg.meta && msg.meta.id) {
            if (!seen.has(msg.meta.id)) {
                seen.add(msg.meta.id);
                result.unshift(msg);
            }
        } else {
            result.unshift(msg);
        }
    }
    return result;
}
function getInitial(username) {
    return username.charAt(0).toUpperCase();
}
function isSingleEmoji(content) {
    const emojiRegex = RegExp("^(\\p{Emoji_Presentation}|\\p{Extended_Pictographic})(\\u200d(\\p{Emoji_Presentation}|\\p{Extended_Pictographic}))*$", "u");
    return emojiRegex.test(content);
}
function formatTimeAgo(date) {
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now.getTime() - messageDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays > 0) {
        return diffDays === 1 ? '1d ago' : "".concat(diffDays, "d ago");
    }
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours > 0) {
        return diffHours === 1 ? '1h ago' : "".concat(diffHours, "h ago");
    }
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes > 0) {
        return diffMinutes === 1 ? '1m ago' : "".concat(diffMinutes, "m ago");
    }
    return 'Just now';
}
async function saveRecentEmojis(emojis) {
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('recentEmojis', emojis);
}
async function getRecentEmojis() {
    return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('recentEmojis', []);
}
function validateImageSize(file) {
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
        return 'Image must be less than 5MB';
    }
    return null;
}
function checkImageExists(base64String) {
    return !!base64String && base64String.startsWith('data:image/');
}
function getMessageKey(sender, receiver) {
    return [
        sender,
        receiver
    ].sort().join('-');
}
function formatMessage(content) {
    // Simple formatting for now
    return content.trim();
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/seller/messages/ThreadListItem.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": ()=>ThreadListItem
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/clock.js [app-client] (ecmascript) <export default as Clock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$badge$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BadgeCheck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/badge-check.js [app-client] (ecmascript) <export default as BadgeCheck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$messageUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/messageUtils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/SecureMessageDisplay.tsx [app-client] (ecmascript)");
'use client';
;
;
;
;
;
function ThreadListItem(param) {
    let { buyer, lastMessage, isActive, buyerProfile, unreadCount, onClick } = param;
    const sanitizedBuyer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(buyer);
    // Debug click handler
    const handleClick = ()=>{
        console.log('=== ThreadListItem Click Debug ===');
        console.log('Buyer:', buyer);
        console.log('onClick function exists:', !!onClick);
        console.log('Calling onClick...');
        if (onClick) {
            onClick();
            console.log('onClick called successfully');
        } else {
            console.error('onClick is not defined!');
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        onClick: handleClick,
        className: "flex items-center p-3 cursor-pointer relative border-b border-gray-800 ".concat(isActive ? 'bg-[#2a2a2a]' : 'hover:bg-[#1a1a1a]', " transition-colors duration-150 ease-in-out"),
        style: {
            userSelect: 'none'
        },
        children: [
            isActive && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute left-0 top-0 bottom-0 w-1 bg-[#ff950e]"
            }, void 0, false, {
                fileName: "[project]/src/components/seller/messages/ThreadListItem.tsx",
                lineNumber: 55,
                columnNumber: 20
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative mr-3 pointer-events-none",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative w-12 h-12 rounded-full bg-[#333] flex items-center justify-center text-white font-bold overflow-hidden shadow-md",
                        children: [
                            (buyerProfile === null || buyerProfile === void 0 ? void 0 : buyerProfile.pic) ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureImage"], {
                                src: buyerProfile.pic,
                                alt: sanitizedBuyer,
                                className: "w-full h-full object-cover"
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller/messages/ThreadListItem.tsx",
                                lineNumber: 61,
                                columnNumber: 13
                            }, this) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$messageUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getInitial"])(sanitizedBuyer),
                            (buyerProfile === null || buyerProfile === void 0 ? void 0 : buyerProfile.verified) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute bottom-0 right-0 bg-[#1a1a1a] p-0.5 rounded-full border border-[#ff950e] shadow-sm",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$badge$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BadgeCheck$3e$__["BadgeCheck"], {
                                    size: 12,
                                    className: "text-[#ff950e]"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/seller/messages/ThreadListItem.tsx",
                                    lineNumber: 69,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller/messages/ThreadListItem.tsx",
                                lineNumber: 68,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/seller/messages/ThreadListItem.tsx",
                        lineNumber: 59,
                        columnNumber: 9
                    }, this),
                    unreadCount > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute -top-1 -right-1 w-6 h-6 bg-[#ff950e] text-black text-xs rounded-full flex items-center justify-center font-bold border-2 border-[#121212] shadow-lg",
                        children: unreadCount
                    }, void 0, false, {
                        fileName: "[project]/src/components/seller/messages/ThreadListItem.tsx",
                        lineNumber: 76,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/seller/messages/ThreadListItem.tsx",
                lineNumber: 58,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 min-w-0 pointer-events-none",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex justify-between",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "font-bold text-white truncate",
                                children: sanitizedBuyer
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller/messages/ThreadListItem.tsx",
                                lineNumber: 85,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs text-gray-400 whitespace-nowrap ml-1 flex items-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {
                                        size: 12,
                                        className: "mr-1"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/seller/messages/ThreadListItem.tsx",
                                        lineNumber: 87,
                                        columnNumber: 13
                                    }, this),
                                    lastMessage ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$messageUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatTimeAgo"])(lastMessage.date) : ''
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/seller/messages/ThreadListItem.tsx",
                                lineNumber: 86,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/seller/messages/ThreadListItem.tsx",
                        lineNumber: 84,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-gray-400 truncate",
                        children: lastMessage ? lastMessage.type === 'customRequest' ? '🛒 Custom Request' : lastMessage.type === 'image' ? '📷 Image' : (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(lastMessage.content || '') : ''
                    }, void 0, false, {
                        fileName: "[project]/src/components/seller/messages/ThreadListItem.tsx",
                        lineNumber: 91,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/seller/messages/ThreadListItem.tsx",
                lineNumber: 83,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/seller/messages/ThreadListItem.tsx",
        lineNumber: 47,
        columnNumber: 5
    }, this);
}
_c = ThreadListItem;
var _c;
__turbopack_context__.k.register(_c, "ThreadListItem");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/seller/messages/ThreadsSidebar.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/components/sellers/messages/ThreadsSidebar.tsx
__turbopack_context__.s({
    "default": ()=>ThreadsSidebar
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/message-circle.js [app-client] (ecmascript) <export default as MessageCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$funnel$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Filter$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/funnel.js [app-client] (ecmascript) <export default as Filter>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bell$2d$ring$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BellRing$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/bell-ring.js [app-client] (ecmascript) <export default as BellRing>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/search.js [app-client] (ecmascript) <export default as Search>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$seller$2f$messages$2f$ThreadListItem$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/seller/messages/ThreadListItem.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/SecureInput.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
function ThreadsSidebar(param) {
    let { isAdmin, threads, lastMessages, buyerProfiles, totalUnreadCount, uiUnreadCounts, activeThread, setActiveThread, searchQuery, setSearchQuery, filterBy, setFilterBy, setObserverReadMessages } = param;
    _s();
    // Filter and sort threads
    const filteredAndSortedThreads = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ThreadsSidebar.useMemo[filteredAndSortedThreads]": ()=>{
            const filteredThreads = Object.keys(threads).filter({
                "ThreadsSidebar.useMemo[filteredAndSortedThreads].filteredThreads": (buyer)=>{
                    const matchesSearch = searchQuery ? buyer.toLowerCase().includes(searchQuery.toLowerCase()) : true;
                    if (!matchesSearch) return false;
                    if (filterBy === 'unread') {
                        const hasUnread = uiUnreadCounts[buyer] > 0;
                        if (!hasUnread) return false;
                    }
                    return true;
                }
            }["ThreadsSidebar.useMemo[filteredAndSortedThreads].filteredThreads"]);
            return filteredThreads.sort({
                "ThreadsSidebar.useMemo[filteredAndSortedThreads]": (a, b)=>{
                    var _lastMessages_a, _lastMessages_b;
                    const dateA = new Date(((_lastMessages_a = lastMessages[a]) === null || _lastMessages_a === void 0 ? void 0 : _lastMessages_a.date) || 0).getTime();
                    const dateB = new Date(((_lastMessages_b = lastMessages[b]) === null || _lastMessages_b === void 0 ? void 0 : _lastMessages_b.date) || 0).getTime();
                    return dateB - dateA;
                }
            }["ThreadsSidebar.useMemo[filteredAndSortedThreads]"]);
        }
    }["ThreadsSidebar.useMemo[filteredAndSortedThreads]"], [
        threads,
        lastMessages,
        uiUnreadCounts,
        searchQuery,
        filterBy
    ]);
    // Handle thread selection
    const handleThreadSelect = (buyerId)=>{
        console.log('=== ThreadsSidebar handleThreadSelect ===');
        console.log('Trying to select buyer:', buyerId);
        console.log('Current activeThread:', activeThread);
        console.log('setActiveThread function exists:', !!setActiveThread);
        console.log('Threads available:', Object.keys(threads));
        if (activeThread === buyerId) {
            console.log('Same thread already active, returning');
            return;
        }
        console.log('Calling setActiveThread with:', buyerId);
        setActiveThread(buyerId);
        setObserverReadMessages(new Set());
        console.log('setActiveThread called');
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full md:w-1/3 border-r border-gray-800 flex flex-col bg-[#121212]",
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
                                fileName: "[project]/src/components/seller/messages/ThreadsSidebar.tsx",
                                lineNumber: 87,
                                columnNumber: 11
                            }, this),
                            isAdmin ? 'Admin Messages' : 'My Messages'
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/seller/messages/ThreadsSidebar.tsx",
                        lineNumber: 86,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex space-x-2 mb-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setFilterBy('all'),
                                className: "px-4 py-2 rounded-full text-sm font-medium transition flex items-center ".concat(filterBy === 'all' ? 'bg-[#ff950e] text-black' : 'bg-[#1a1a1a] text-white hover:bg-[#222]'),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$funnel$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Filter$3e$__["Filter"], {
                                        size: 14,
                                        className: "mr-1"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/seller/messages/ThreadsSidebar.tsx",
                                        lineNumber: 101,
                                        columnNumber: 13
                                    }, this),
                                    "All Messages"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/seller/messages/ThreadsSidebar.tsx",
                                lineNumber: 93,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setFilterBy('unread'),
                                className: "px-4 py-2 rounded-full text-sm font-medium transition flex items-center ".concat(filterBy === 'unread' ? 'bg-[#ff950e] text-black' : 'bg-[#1a1a1a] text-white hover:bg-[#222]'),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bell$2d$ring$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BellRing$3e$__["BellRing"], {
                                        size: 14,
                                        className: "mr-1"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/seller/messages/ThreadsSidebar.tsx",
                                        lineNumber: 112,
                                        columnNumber: 13
                                    }, this),
                                    "Unread",
                                    totalUnreadCount > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "ml-1 bg-[#ff950e] text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold border border-black",
                                        children: totalUnreadCount
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/seller/messages/ThreadsSidebar.tsx",
                                        lineNumber: 115,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/seller/messages/ThreadsSidebar.tsx",
                                lineNumber: 104,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/seller/messages/ThreadsSidebar.tsx",
                        lineNumber: 92,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/seller/messages/ThreadsSidebar.tsx",
                lineNumber: 85,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-4 pb-3",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureInput"], {
                            type: "text",
                            placeholder: "Search Buyers...",
                            value: searchQuery,
                            onChange: setSearchQuery,
                            className: "w-full py-2 px-4 pr-10 rounded-full bg-[#222] border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e] focus:border-transparent",
                            maxLength: 100
                        }, void 0, false, {
                            fileName: "[project]/src/components/seller/messages/ThreadsSidebar.tsx",
                            lineNumber: 126,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "absolute right-3 top-2.5 text-gray-400 pointer-events-none",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                                size: 18
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller/messages/ThreadsSidebar.tsx",
                                lineNumber: 135,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/seller/messages/ThreadsSidebar.tsx",
                            lineNumber: 134,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/seller/messages/ThreadsSidebar.tsx",
                    lineNumber: 125,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/seller/messages/ThreadsSidebar.tsx",
                lineNumber: 124,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 overflow-y-auto bg-[#121212]",
                children: filteredAndSortedThreads.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "p-4 text-center text-gray-400",
                    children: "No conversations found"
                }, void 0, false, {
                    fileName: "[project]/src/components/seller/messages/ThreadsSidebar.tsx",
                    lineNumber: 143,
                    columnNumber: 11
                }, this) : filteredAndSortedThreads.map((buyer)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$seller$2f$messages$2f$ThreadListItem$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        buyer: buyer,
                        lastMessage: lastMessages[buyer],
                        isActive: activeThread === buyer,
                        buyerProfile: buyerProfiles[buyer],
                        unreadCount: uiUnreadCounts[buyer],
                        onClick: ()=>handleThreadSelect(buyer)
                    }, buyer, false, {
                        fileName: "[project]/src/components/seller/messages/ThreadsSidebar.tsx",
                        lineNumber: 148,
                        columnNumber: 13
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/components/seller/messages/ThreadsSidebar.tsx",
                lineNumber: 141,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/seller/messages/ThreadsSidebar.tsx",
        lineNumber: 83,
        columnNumber: 5
    }, this);
}
_s(ThreadsSidebar, "J3agX4MIPNlynWx9L1sGzKvROSc=");
_c = ThreadsSidebar;
var _c;
__turbopack_context__.k.register(_c, "ThreadsSidebar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/utils/format.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/utils/format.ts
__turbopack_context__.s({
    "formatActivityStatus": ()=>formatActivityStatus,
    "formatFeeBreakdown": ()=>formatFeeBreakdown,
    "formatLimit": ()=>formatLimit,
    "formatMoney": ()=>formatMoney,
    "formatMoneyRange": ()=>formatMoneyRange,
    "formatMoneyWithSign": ()=>formatMoneyWithSign,
    "formatPercentage": ()=>formatPercentage,
    "formatReconciliation": ()=>formatReconciliation,
    "formatRiskScore": ()=>formatRiskScore,
    "formatShortDate": ()=>formatShortDate,
    "formatTime": ()=>formatTime,
    "formatTransaction": ()=>formatTransaction,
    "formatTransactionSummary": ()=>formatTransactionSummary,
    "formatWalletBalance": ()=>formatWalletBalance
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/types/common.ts [app-client] (ecmascript)");
;
function formatActivityStatus(isOnline, lastActive) {
    if (isOnline) {
        return 'Active now';
    }
    if (!lastActive) {
        return 'Offline';
    }
    const now = new Date();
    const diffMs = now.getTime() - lastActive.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMinutes < 1) {
        return 'Active just now';
    } else if (diffMinutes < 60) {
        return "Active ".concat(diffMinutes, "m ago");
    } else if (diffHours < 24) {
        return "Active ".concat(diffHours, "h ago");
    } else if (diffDays === 1) {
        return 'Active yesterday';
    } else if (diffDays < 7) {
        return "Active ".concat(diffDays, "d ago");
    } else {
        return 'Offline';
    }
}
function formatMoney(amount) {
    let locale = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 'en-US', currency = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 'USD';
    // Convert from cents to dollars
    const dollars = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Money"].toDollars(amount);
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(dollars);
}
function formatMoneyWithSign(amount, isCredit) {
    let locale = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 'en-US', currency = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 'USD';
    const formatted = formatMoney(amount, locale, currency);
    return isCredit ? "+".concat(formatted) : "-".concat(formatted);
}
function formatMoneyRange(min, max) {
    let locale = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 'en-US', currency = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 'USD';
    return "".concat(formatMoney(min, locale, currency), " - ").concat(formatMoney(max, locale, currency));
}
function formatTransaction(transaction, currentUserId) {
    // Determine if credit or debit
    const isCredit = transaction.to === currentUserId || transaction.type === 'deposit' || transaction.type === 'admin_credit' || transaction.type === 'tier_credit';
    // Format amount with sign
    const amount = formatMoneyWithSign(transaction.amount, isCredit);
    // Format type
    const typeLabels = {
        deposit: 'Deposit',
        withdrawal: 'Withdrawal',
        purchase: 'Purchase',
        sale: 'Sale',
        tip: 'Tip',
        subscription: 'Subscription',
        admin_credit: 'Credit',
        admin_debit: 'Debit',
        refund: 'Refund',
        fee: 'Fee',
        tier_credit: 'Bonus'
    };
    // Format status
    const statusLabels = {
        pending: 'Pending',
        completed: 'Completed',
        failed: 'Failed',
        cancelled: 'Cancelled'
    };
    // Get icon and color based on type
    const typeConfig = getTransactionTypeConfig(transaction.type);
    return {
        amount,
        type: typeLabels[transaction.type],
        status: statusLabels[transaction.status],
        date: formatShortDate(transaction.createdAt),
        time: formatTime(transaction.createdAt),
        description: transaction.description,
        isCredit,
        icon: typeConfig.icon,
        color: typeConfig.color
    };
}
/**
 * Get transaction type configuration
 */ function getTransactionTypeConfig(type) {
    const config = {
        deposit: {
            icon: 'download',
            color: 'text-green-500'
        },
        withdrawal: {
            icon: 'upload',
            color: 'text-red-500'
        },
        purchase: {
            icon: 'shopping-bag',
            color: 'text-blue-500'
        },
        sale: {
            icon: 'tag',
            color: 'text-green-500'
        },
        tip: {
            icon: 'gift',
            color: 'text-purple-500'
        },
        subscription: {
            icon: 'repeat',
            color: 'text-indigo-500'
        },
        admin_credit: {
            icon: 'plus-circle',
            color: 'text-green-500'
        },
        admin_debit: {
            icon: 'minus-circle',
            color: 'text-red-500'
        },
        refund: {
            icon: 'rotate-ccw',
            color: 'text-orange-500'
        },
        fee: {
            icon: 'percent',
            color: 'text-gray-500'
        },
        tier_credit: {
            icon: 'star',
            color: 'text-yellow-500'
        }
    };
    return config[type] || {
        icon: 'circle',
        color: 'text-gray-500'
    };
}
function formatPercentage(value) {
    let decimals = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1;
    return "".concat(value.toFixed(decimals), "%");
}
function formatFeeBreakdown(amount, feePercent) {
    const fee = Math.floor(amount * feePercent);
    const net = amount - fee;
    return {
        total: formatMoney(amount),
        fee: formatMoney(fee),
        net: formatMoney(net),
        feePercentage: formatPercentage(feePercent * 100)
    };
}
function formatWalletBalance(balance, available, pending) {
    const restriction = balance - available - pending;
    return {
        balance: formatMoney(balance),
        available: formatMoney(available),
        pending: formatMoney(pending),
        hasRestriction: restriction > 0,
        restrictionAmount: formatMoney(restriction)
    };
}
function formatLimit(used, limit) {
    const remaining = Math.max(0, limit - used);
    const percentage = limit > 0 ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Money"].toDollars(used) / __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Money"].toDollars(limit) * 100 : 0;
    return {
        used: formatMoney(used),
        limit: formatMoney(limit),
        remaining: formatMoney(remaining),
        percentage,
        percentageFormatted: formatPercentage(percentage),
        isExceeded: used > limit
    };
}
function formatRiskScore(score) {
    let level;
    let color;
    let label;
    if (score < 25) {
        level = 'low';
        color = 'text-green-500';
        label = 'Low Risk';
    } else if (score < 50) {
        level = 'medium';
        color = 'text-yellow-500';
        label = 'Medium Risk';
    } else if (score < 75) {
        level = 'high';
        color = 'text-orange-500';
        label = 'High Risk';
    } else {
        level = 'critical';
        color = 'text-red-500';
        label = 'Critical Risk';
    }
    return {
        score,
        level,
        color,
        label
    };
}
function formatReconciliation(current, calculated) {
    const discrepancy = current - calculated;
    return {
        current: formatMoney(current),
        calculated: formatMoney(calculated),
        discrepancy: formatMoney(Math.abs(discrepancy)),
        isReconciled: discrepancy === 0,
        discrepancyType: discrepancy > 0 ? 'over' : discrepancy < 0 ? 'under' : 'none'
    };
}
function formatShortDate(date) {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
        return 'Invalid date';
    }
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return dateObj.toLocaleDateString(undefined, {
            weekday: 'long'
        });
    }
    return dateObj.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: dateObj.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}
function formatTime(date) {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
        return 'Invalid time';
    }
    return dateObj.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}
function formatTransactionSummary(transactions) {
    let totalIn = 0;
    let totalOut = 0;
    transactions.forEach((t)=>{
        if (t.status === 'completed') {
            if (t.type === 'deposit' || t.type === 'admin_credit' || t.type === 'tier_credit') {
                totalIn += t.amount;
            } else if (t.type === 'withdrawal' || t.type === 'admin_debit') {
                totalOut += t.amount;
            }
        }
    });
    const netFlow = totalIn - totalOut;
    const averageSize = transactions.length > 0 ? Math.floor(transactions.reduce((sum, t)=>sum + t.amount, 0) / transactions.length) : 0;
    return {
        totalIn: formatMoney(totalIn),
        totalOut: formatMoney(totalOut),
        netFlow: formatMoneyWithSign(netFlow, netFlow >= 0),
        count: transactions.length,
        averageSize: formatMoney(averageSize)
    };
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/hooks/useUserActivityStatus.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/hooks/useUserActivityStatus.ts
__turbopack_context__.s({
    "useUserActivityStatus": ()=>useUserActivityStatus
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WebSocketContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/WebSocketContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/AuthContext.tsx [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
;
;
function useUserActivityStatus(username) {
    _s();
    const [activityStatus, setActivityStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        isOnline: false,
        lastActive: null
    });
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const wsContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WebSocketContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWebSocket"])();
    const { apiClient } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    // Handler functions wrapped in useCallback to prevent recreation
    const handleStatusUpdate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useUserActivityStatus.useCallback[handleStatusUpdate]": (data)=>{
            if (!username) return;
            console.log("[useUserActivityStatus] Processing user:status event for ".concat(username, ":"), data);
            if (data.username === username) {
                console.log("[useUserActivityStatus] ✅ Status update matches ".concat(username, ": online=").concat(data.isOnline));
                setActivityStatus({
                    isOnline: Boolean(data.isOnline),
                    lastActive: data.lastActive ? new Date(data.lastActive) : new Date()
                });
            }
        }
    }["useUserActivityStatus.useCallback[handleStatusUpdate]"], [
        username
    ]);
    const handleOnlineEvent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useUserActivityStatus.useCallback[handleOnlineEvent]": (data)=>{
            if (!username) return;
            console.log("[useUserActivityStatus] Processing user:online event for ".concat(username, ":"), data);
            if (data.username === username) {
                console.log("[useUserActivityStatus] ✅ ".concat(username, " is now ONLINE"));
                setActivityStatus({
                    isOnline: true,
                    lastActive: new Date()
                });
            }
        }
    }["useUserActivityStatus.useCallback[handleOnlineEvent]"], [
        username
    ]);
    const handleOfflineEvent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useUserActivityStatus.useCallback[handleOfflineEvent]": (data)=>{
            if (!username) return;
            console.log("[useUserActivityStatus] Processing user:offline event for ".concat(username, ":"), data);
            if (data.username === username) {
                console.log("[useUserActivityStatus] ✅ ".concat(username, " is now OFFLINE"));
                setActivityStatus({
                    isOnline: false,
                    lastActive: data.lastActive ? new Date(data.lastActive) : new Date()
                });
            }
        }
    }["useUserActivityStatus.useCallback[handleOfflineEvent]"], [
        username
    ]);
    // Main effect for fetching and subscribing
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useUserActivityStatus.useEffect": ()=>{
            if (!username) {
                setActivityStatus({
                    isOnline: false,
                    lastActive: null
                });
                setLoading(false);
                return;
            }
            let mounted = true;
            const unsubscribers = [];
            // First, set up WebSocket subscriptions if available
            if (wsContext) {
                console.log("[useUserActivityStatus] Subscribing to WebSocket events for ".concat(username));
                try {
                    // Subscribe to all status events
                    const unsub1 = wsContext.subscribe('user:status', handleStatusUpdate);
                    const unsub2 = wsContext.subscribe('user:online', handleOnlineEvent);
                    const unsub3 = wsContext.subscribe('user:offline', handleOfflineEvent);
                    unsubscribers.push(unsub1, unsub2, unsub3);
                    console.log("[useUserActivityStatus] ✅ Successfully subscribed to events for ".concat(username));
                } catch (error) {
                    console.error("[useUserActivityStatus] Error subscribing to events:", error);
                }
            } else {
                console.warn("[useUserActivityStatus] No WebSocket context available for ".concat(username));
            }
            // Then fetch initial status from API
            const fetchInitialStatus = {
                "useUserActivityStatus.useEffect.fetchInitialStatus": async ()=>{
                    try {
                        console.log("[useUserActivityStatus] Fetching initial status for ".concat(username, "..."));
                        const response = await apiClient.get("/messages/user-status/".concat(username));
                        if (mounted && response.success && response.data) {
                            console.log("[useUserActivityStatus] Initial status for ".concat(username, ":"), response.data);
                            setActivityStatus({
                                isOnline: response.data.isOnline || false,
                                lastActive: response.data.lastActive ? new Date(response.data.lastActive) : null
                            });
                        }
                    } catch (error) {
                        console.error("[useUserActivityStatus] Error fetching status for ".concat(username, ":"), error);
                    } finally{
                        if (mounted) {
                            setLoading(false);
                        }
                    }
                }
            }["useUserActivityStatus.useEffect.fetchInitialStatus"];
            fetchInitialStatus();
            // Cleanup function
            return ({
                "useUserActivityStatus.useEffect": ()=>{
                    mounted = false;
                    console.log("[useUserActivityStatus] Unsubscribing from events for ".concat(username));
                    unsubscribers.forEach({
                        "useUserActivityStatus.useEffect": (unsub)=>{
                            try {
                                unsub();
                            } catch (error) {
                                console.error("[useUserActivityStatus] Error unsubscribing:", error);
                            }
                        }
                    }["useUserActivityStatus.useEffect"]);
                }
            })["useUserActivityStatus.useEffect"];
        }
    }["useUserActivityStatus.useEffect"], [
        username,
        wsContext,
        apiClient,
        handleStatusUpdate,
        handleOnlineEvent,
        handleOfflineEvent
    ]);
    // Update relative times periodically
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useUserActivityStatus.useEffect": ()=>{
            if (!activityStatus.isOnline && activityStatus.lastActive) {
                const interval = setInterval({
                    "useUserActivityStatus.useEffect.interval": ()=>{
                        // Force a re-render to update the relative time display
                        setActivityStatus({
                            "useUserActivityStatus.useEffect.interval": (prev)=>({
                                    ...prev
                                })
                        }["useUserActivityStatus.useEffect.interval"]);
                    }
                }["useUserActivityStatus.useEffect.interval"], 60000); // Update every minute
                return ({
                    "useUserActivityStatus.useEffect": ()=>clearInterval(interval)
                })["useUserActivityStatus.useEffect"];
            }
            return undefined;
        }
    }["useUserActivityStatus.useEffect"], [
        activityStatus.isOnline,
        activityStatus.lastActive
    ]);
    return {
        activityStatus,
        loading
    };
}
_s(useUserActivityStatus, "3aPdu2cE8a3mJ34wcwR1cPbTDyo=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WebSocketContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWebSocket"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/seller/messages/ChatHeader.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": ()=>ChatHeader
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$badge$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BadgeCheck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/badge-check.js [app-client] (ecmascript) <export default as BadgeCheck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/sparkles.js [app-client] (ecmascript) <export default as Sparkles>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/triangle-alert.js [app-client] (ecmascript) <export default as AlertTriangle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldAlert$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shield-alert.js [app-client] (ecmascript) <export default as ShieldAlert>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$messageUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/messageUtils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/format.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useUserActivityStatus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useUserActivityStatus.ts [app-client] (ecmascript)");
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
function ChatHeader(param) {
    let { activeThread, buyerProfile, isUserReported, isUserBlocked, onReport, onBlockToggle } = param;
    _s();
    const sanitizedActiveThread = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(activeThread);
    // Guard against undefined shape while loading
    const { activityStatus = {
        isOnline: false,
        lastActive: null
    }, loading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useUserActivityStatus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUserActivityStatus"])(activeThread);
    const getActivityDisplay = ()=>{
        if (isUserBlocked) return 'Blocked';
        if (loading) return '...';
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatActivityStatus"])(activityStatus.isOnline, activityStatus.lastActive);
    };
    const verified = !!(buyerProfile === null || buyerProfile === void 0 ? void 0 : buyerProfile.verified);
    const pic = (buyerProfile === null || buyerProfile === void 0 ? void 0 : buyerProfile.pic) || null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "px-4 py-3 flex items-center justify-between border-b border-gray-800 bg-[#1a1a1a]",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative w-10 h-10 rounded-full bg-[#333] flex items-center justify-center text-white font-bold mr-3 overflow-hidden shadow-md",
                        children: [
                            pic ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureImage"], {
                                src: pic,
                                alt: sanitizedActiveThread,
                                className: "w-full h-full object-cover"
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller/messages/ChatHeader.tsx",
                                lineNumber: 51,
                                columnNumber: 13
                            }, this) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$messageUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getInitial"])(sanitizedActiveThread),
                            verified && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute bottom-0 right-0 bg-[#1a1a1a] p-0.5 rounded-full border border-[#ff950e] shadow-sm",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$badge$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BadgeCheck$3e$__["BadgeCheck"], {
                                    size: 12,
                                    className: "text-[#ff950e]",
                                    "aria-label": "Verified"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/seller/messages/ChatHeader.tsx",
                                    lineNumber: 58,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller/messages/ChatHeader.tsx",
                                lineNumber: 57,
                                columnNumber: 13
                            }, this),
                            (activityStatus === null || activityStatus === void 0 ? void 0 : activityStatus.isOnline) && !isUserBlocked && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute bottom-0 left-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1a1a1a]",
                                "aria-label": "Online"
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller/messages/ChatHeader.tsx",
                                lineNumber: 63,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/seller/messages/ChatHeader.tsx",
                        lineNumber: 49,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "font-bold text-lg text-white",
                                children: sanitizedActiveThread
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller/messages/ChatHeader.tsx",
                                lineNumber: 70,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs flex items-center ".concat((activityStatus === null || activityStatus === void 0 ? void 0 : activityStatus.isOnline) && !isUserBlocked ? 'text-green-400' : 'text-gray-400'),
                                children: [
                                    (activityStatus === null || activityStatus === void 0 ? void 0 : activityStatus.isOnline) && !isUserBlocked && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__["Sparkles"], {
                                        size: 12,
                                        className: "mr-1 text-green-400"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/seller/messages/ChatHeader.tsx",
                                        lineNumber: 77,
                                        columnNumber: 15
                                    }, this),
                                    getActivityDisplay()
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/seller/messages/ChatHeader.tsx",
                                lineNumber: 71,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/seller/messages/ChatHeader.tsx",
                        lineNumber: 69,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/seller/messages/ChatHeader.tsx",
                lineNumber: 48,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex space-x-2 text-white",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: onReport,
                        disabled: isUserReported,
                        className: "px-3 py-1 text-xs border rounded flex items-center ".concat(isUserReported ? 'text-gray-400 border-gray-500' : 'text-red-500 border-red-500 hover:bg-red-500/10', " transition-colors duration-150"),
                        title: isUserReported ? 'Already reported' : 'Report user',
                        "aria-disabled": isUserReported,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"], {
                                size: 12,
                                className: "mr-1"
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller/messages/ChatHeader.tsx",
                                lineNumber: 94,
                                columnNumber: 11
                            }, this),
                            isUserReported ? 'Reported' : 'Report'
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/seller/messages/ChatHeader.tsx",
                        lineNumber: 85,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: onBlockToggle,
                        className: "px-3 py-1 text-xs border rounded flex items-center ".concat(isUserBlocked ? 'text-green-500 border-green-500 hover:bg-green-500/10' : 'text-red-500 border-red-500 hover:bg-red-500/10', " transition-colors duration-150"),
                        title: isUserBlocked ? 'Unblock user' : 'Block user',
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldAlert$3e$__["ShieldAlert"], {
                                size: 12,
                                className: "mr-1"
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller/messages/ChatHeader.tsx",
                                lineNumber: 106,
                                columnNumber: 11
                            }, this),
                            isUserBlocked ? 'Unblock' : 'Block'
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/seller/messages/ChatHeader.tsx",
                        lineNumber: 97,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/seller/messages/ChatHeader.tsx",
                lineNumber: 84,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/seller/messages/ChatHeader.tsx",
        lineNumber: 47,
        columnNumber: 5
    }, this);
}
_s(ChatHeader, "YNjiQdn5BEvSqMFDE/88UjM7snk=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useUserActivityStatus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUserActivityStatus"]
    ];
});
_c = ChatHeader;
var _c;
__turbopack_context__.k.register(_c, "ChatHeader");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/hooks/useIntersectionObserver.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/hooks/useIntersectionObserver.ts
__turbopack_context__.s({
    "useIntersectionObserver": ()=>useIntersectionObserver,
    "useIntersectionObserverMultiple": ()=>useIntersectionObserverMultiple,
    "useLazyImageObserver": ()=>useLazyImageObserver
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature();
;
function useIntersectionObserver(targetRef, options) {
    _s();
    // Use refs to maintain stable references
    const savedCallback = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(options.onIntersect);
    const observerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Update callback ref when it changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useIntersectionObserver.useEffect": ()=>{
            savedCallback.current = options.onIntersect;
        }
    }["useIntersectionObserver.useEffect"], [
        options.onIntersect
    ]);
    // Validate and normalize threshold
    const normalizedThreshold = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useIntersectionObserver.useCallback[normalizedThreshold]": ()=>{
            const threshold = options.threshold;
            if (threshold === undefined || threshold === null) {
                return 0.5;
            }
            // Handle array of thresholds
            if (Array.isArray(threshold)) {
                return threshold.map({
                    "useIntersectionObserver.useCallback[normalizedThreshold]": (t)=>{
                        const num = Number(t);
                        return isNaN(num) ? 0.5 : Math.max(0, Math.min(1, num));
                    }
                }["useIntersectionObserver.useCallback[normalizedThreshold]"]);
            }
            // Handle single threshold
            const num = Number(threshold);
            return isNaN(num) ? 0.5 : Math.max(0, Math.min(1, num));
        }
    }["useIntersectionObserver.useCallback[normalizedThreshold]"], [
        options.threshold
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useIntersectionObserver.useEffect": ()=>{
            // Check if observation is enabled (default to true)
            if (options.enabled === false) {
                return;
            }
            // Check for IntersectionObserver support
            if ("object" === 'undefined' || !window.IntersectionObserver) {
                console.warn('IntersectionObserver is not supported in this browser');
                return;
            }
            try {
                // Create stable callback
                const callback = {
                    "useIntersectionObserver.useEffect.callback": (entries)=>{
                        entries.forEach({
                            "useIntersectionObserver.useEffect.callback": (entry)=>{
                                if (entry.isIntersecting && savedCallback.current) {
                                    try {
                                        savedCallback.current();
                                    } catch (error) {
                                        console.error('Error in intersection observer callback:', error);
                                    }
                                }
                            }
                        }["useIntersectionObserver.useEffect.callback"]);
                    }
                }["useIntersectionObserver.useEffect.callback"];
                // Create observer with validated options
                observerRef.current = new IntersectionObserver(callback, {
                    root: options.root || null,
                    rootMargin: options.rootMargin || '0px',
                    threshold: normalizedThreshold()
                });
                // Start observing
                const target = targetRef.current;
                if (target && observerRef.current) {
                    observerRef.current.observe(target);
                }
                // Cleanup function
                return ({
                    "useIntersectionObserver.useEffect": ()=>{
                        if (observerRef.current) {
                            observerRef.current.disconnect();
                            observerRef.current = null;
                        }
                    }
                })["useIntersectionObserver.useEffect"];
            } catch (error) {
                console.error('Error creating IntersectionObserver:', error);
                return undefined;
            }
        }
    }["useIntersectionObserver.useEffect"], [
        targetRef,
        options.root,
        options.rootMargin,
        options.enabled,
        normalizedThreshold
    ]);
    // Return observer instance for advanced use cases
    return observerRef.current;
}
_s(useIntersectionObserver, "tTgyrSo1nR517TqqiMieJVynFS0=");
function useIntersectionObserverMultiple(targetsRef, options) {
    _s1();
    const savedCallback = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(options.onIntersect);
    const observerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useIntersectionObserverMultiple.useEffect": ()=>{
            savedCallback.current = options.onIntersect;
        }
    }["useIntersectionObserverMultiple.useEffect"], [
        options.onIntersect
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useIntersectionObserverMultiple.useEffect": ()=>{
            if (options.enabled === false) {
                return;
            }
            if ("object" === 'undefined' || !window.IntersectionObserver) {
                console.warn('IntersectionObserver is not supported in this browser');
                return;
            }
            try {
                const callback = {
                    "useIntersectionObserverMultiple.useEffect.callback": (entries)=>{
                        entries.forEach({
                            "useIntersectionObserverMultiple.useEffect.callback": (entry)=>{
                                if (entry.isIntersecting && savedCallback.current) {
                                    try {
                                        savedCallback.current(entry.target, entry);
                                    } catch (error) {
                                        console.error('Error in intersection observer callback:', error);
                                    }
                                }
                            }
                        }["useIntersectionObserverMultiple.useEffect.callback"]);
                    }
                }["useIntersectionObserverMultiple.useEffect.callback"];
                observerRef.current = new IntersectionObserver(callback, {
                    root: options.root || null,
                    rootMargin: options.rootMargin || '0px',
                    threshold: options.threshold || 0.5
                });
                const targets = targetsRef.current;
                if (targets && observerRef.current) {
                    targets.forEach({
                        "useIntersectionObserverMultiple.useEffect": (target)=>{
                            if (target) {
                                observerRef.current.observe(target);
                            }
                        }
                    }["useIntersectionObserverMultiple.useEffect"]);
                }
                return ({
                    "useIntersectionObserverMultiple.useEffect": ()=>{
                        if (observerRef.current) {
                            observerRef.current.disconnect();
                            observerRef.current = null;
                        }
                    }
                })["useIntersectionObserverMultiple.useEffect"];
            } catch (error) {
                console.error('Error creating IntersectionObserver:', error);
                return undefined;
            }
        }
    }["useIntersectionObserverMultiple.useEffect"], [
        targetsRef,
        options.root,
        options.rootMargin,
        options.threshold,
        options.enabled
    ]);
    return observerRef.current;
}
_s1(useIntersectionObserverMultiple, "HPFs5snMq3Ouaq3uqz9IxcjDzMM=");
function useLazyImageObserver(imageRef, src, placeholder) {
    _s2();
    const [imageSrc, setImageSrc] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(placeholder || '');
    const [isLoaded, setIsLoaded] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    useIntersectionObserver(imageRef, {
        onIntersect: {
            "useLazyImageObserver.useIntersectionObserver": ()=>{
                if (src && !isLoaded) {
                    // Validate image URL before setting
                    try {
                        const url = new URL(src, window.location.origin);
                        if (url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'data:') {
                            setImageSrc(src);
                            setIsLoaded(true);
                        } else {
                            console.warn('Invalid image URL protocol:', url.protocol);
                        }
                    } catch (error) {
                        console.error('Invalid image URL:', src);
                    }
                }
            }
        }["useLazyImageObserver.useIntersectionObserver"],
        threshold: 0.1,
        enabled: !!src && !isLoaded
    });
    return {
        imageSrc,
        isLoaded
    };
}
_s2(useLazyImageObserver, "fqy7EZFAYiKuaeqwiBO2fv/K0Ow=", false, function() {
    return [
        useIntersectionObserver
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/utils/validation/schemas.ts [app-client] (ecmascript) <export * as validationSchemas>": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "validationSchemas": ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/validation/schemas.ts [app-client] (ecmascript)");
}),
"[project]/src/components/seller/messages/MessageItem.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/components/seller/messages/MessageItem.tsx
__turbopack_context__.s({
    "default": ()=>MessageItem
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCheck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/check-check.js [app-client] (ecmascript) <export default as CheckCheck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/clock.js [app-client] (ecmascript) <export default as Clock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-check.js [app-client] (ecmascript) <export default as CheckCircle2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__XCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-x.js [app-client] (ecmascript) <export default as XCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pen$2d$line$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Edit3$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/pen-line.js [app-client] (ecmascript) <export default as Edit3>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useIntersectionObserver$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useIntersectionObserver.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$messageUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/messageUtils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/SecureMessageDisplay.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/SecureInput.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/index.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__validationSchemas$3e$__ = __turbopack_context__.i("[project]/src/utils/validation/schemas.ts [app-client] (ecmascript) <export * as validationSchemas>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
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
function MessageItem(param) {
    let { msg, index, isFromMe, user, activeThread, onMessageVisible, customReq, isLatestCustom, isPaid, showActionButtons, handleAccept, handleDecline, handleEditRequest, editRequestId, editTitle, setEditTitle, editPrice, setEditPrice, editMessage, setEditMessage, handleEditSubmit, setEditRequestId, statusBadge, setPreviewImage } = param;
    var _msg_meta;
    _s();
    const messageRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [hasBeenVisible, setHasBeenVisible] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [editErrors, setEditErrors] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    // Use Intersection Observer to track when message becomes visible
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useIntersectionObserver$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useIntersectionObserver"])(messageRef, {
        threshold: 0.8,
        onIntersect: {
            "MessageItem.useIntersectionObserver": ()=>{
                if (!hasBeenVisible && !isFromMe && !msg.read) {
                    setHasBeenVisible(true);
                    onMessageVisible(msg);
                }
            }
        }["MessageItem.useIntersectionObserver"]
    });
    const time = new Date(msg.date).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });
    const isSingleEmojiMsg = msg.content && (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$messageUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isSingleEmoji"])(msg.content);
    // Validate edit form before submission
    const handleSecureEditSubmit = ()=>{
        // Validate the custom request data
        const validationResult = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].validateAndSanitize({
            title: editTitle,
            description: editMessage,
            price: typeof editPrice === 'string' ? parseFloat(editPrice) || 0 : editPrice
        }, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__validationSchemas$3e$__["validationSchemas"].messageSchemas.customRequest);
        if (!validationResult.success) {
            setEditErrors(validationResult.errors || {});
            return;
        }
        // Clear errors and submit
        setEditErrors({});
        handleEditSubmit();
    };
    // Sanitize display names
    const sanitizedSender = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(msg.sender || '');
    const sanitizedActiveThread = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(activeThread || '');
    const sanitizedUsername = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])((user === null || user === void 0 ? void 0 : user.username) || '');
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: messageRef,
        className: "flex ".concat(isFromMe ? 'justify-end' : 'justify-start'),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "rounded-lg p-3 max-w-[75%] ".concat(isFromMe ? 'bg-[#ff950e] text-black shadow-lg' : 'bg-[#303030] text-[#fefefe] shadow-md'),
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center text-xs mb-1",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: isFromMe ? 'text-black opacity-75' : 'text-[#fefefe] opacity-75',
                            children: [
                                isFromMe ? 'You' : sanitizedSender,
                                " • ",
                                time
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                            lineNumber: 141,
                            columnNumber: 11
                        }, this),
                        isFromMe && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "ml-2 text-[10px]",
                            children: msg.read ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "flex items-center ".concat(isFromMe ? 'text-black opacity-60' : 'text-[#fefefe] opacity-60'),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCheck$3e$__["CheckCheck"], {
                                        size: 12,
                                        className: "mr-1"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                                        lineNumber: 148,
                                        columnNumber: 19
                                    }, this),
                                    " Read"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                                lineNumber: 147,
                                columnNumber: 17
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: isFromMe ? 'text-black opacity-50' : 'text-[#fefefe] opacity-50',
                                children: "Sent"
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                                lineNumber: 151,
                                columnNumber: 17
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                            lineNumber: 145,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                    lineNumber: 140,
                    columnNumber: 9
                }, this),
                msg.type === 'image' && ((_msg_meta = msg.meta) === null || _msg_meta === void 0 ? void 0 : _msg_meta.imageUrl) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-1 mb-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureImage"], {
                            src: msg.meta.imageUrl,
                            alt: "Shared image",
                            className: "max-w-full rounded cursor-pointer hover:opacity-90 transition-opacity shadow-sm",
                            onError: ()=>console.error('Failed to load image'),
                            onClick: (e)=>{
                                var _msg_meta;
                                e.stopPropagation();
                                setPreviewImage(((_msg_meta = msg.meta) === null || _msg_meta === void 0 ? void 0 : _msg_meta.imageUrl) || null);
                            }
                        }, void 0, false, {
                            fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                            lineNumber: 160,
                            columnNumber: 13
                        }, this),
                        msg.content && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-2 ".concat(isSingleEmojiMsg ? 'text-3xl' : ''),
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureMessageDisplay"], {
                                content: msg.content,
                                allowBasicFormatting: false,
                                className: isFromMe ? 'text-black' : 'text-[#fefefe]'
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                                lineNumber: 172,
                                columnNumber: 17
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                            lineNumber: 171,
                            columnNumber: 15
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                    lineNumber: 159,
                    columnNumber: 11
                }, this),
                msg.type !== 'image' && msg.type !== 'customRequest' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: isSingleEmojiMsg ? 'text-3xl' : '',
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureMessageDisplay"], {
                        content: msg.content || '',
                        allowBasicFormatting: false,
                        className: isFromMe ? 'text-black' : 'text-[#fefefe]'
                    }, void 0, false, {
                        fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                        lineNumber: 185,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                    lineNumber: 184,
                    columnNumber: 11
                }, this),
                msg.type === 'customRequest' && msg.meta && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-2 text-sm space-y-1 border-t ".concat(isFromMe ? 'border-black/20' : 'border-white/20', " pt-2"),
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "font-semibold flex items-center ".concat(isFromMe ? 'text-black' : 'text-[#fefefe]'),
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "relative mr-2 flex items-center justify-center",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bg-white w-6 h-6 rounded-full absolute"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                                            lineNumber: 198,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureImage"], {
                                            src: "/Custom_Request_Icon.png",
                                            alt: "Custom Request",
                                            className: "w-8 h-8 relative z-10"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                                            lineNumber: 199,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                                    lineNumber: 197,
                                    columnNumber: 15
                                }, this),
                                "Custom Request"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                            lineNumber: 196,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: isFromMe ? 'text-black' : 'text-[#fefefe]',
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                    children: "Title:"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                                    lineNumber: 210,
                                    columnNumber: 15
                                }, this),
                                " ",
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(customReq ? customReq.title : msg.meta.title || '')
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                            lineNumber: 209,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: isFromMe ? 'text-black' : 'text-[#fefefe]',
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                    children: "Price:"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                                    lineNumber: 213,
                                    columnNumber: 15
                                }, this),
                                " $",
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeCurrency"])(customReq ? customReq.price : msg.meta.price || 0).toFixed(2)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                            lineNumber: 212,
                            columnNumber: 13
                        }, this),
                        (customReq ? customReq.description : msg.meta.message) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: isFromMe ? 'text-black' : 'text-[#fefefe]',
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                    children: "Message:"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                                    lineNumber: 217,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureMessageDisplay"], {
                                    content: customReq ? customReq.description : msg.meta.message || '',
                                    allowBasicFormatting: false,
                                    className: "inline"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                                    lineNumber: 218,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                            lineNumber: 216,
                            columnNumber: 15
                        }, this),
                        customReq && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "flex items-center ".concat(isFromMe ? 'text-black' : 'text-[#fefefe]'),
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                    children: "Status:"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                                    lineNumber: 227,
                                    columnNumber: 17
                                }, this),
                                statusBadge(customReq.status)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                            lineNumber: 226,
                            columnNumber: 15
                        }, this),
                        customReq && isLatestCustom && (customReq.status === 'pending' || customReq.status === 'edited') && !isPaid && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-xs italic ".concat(isFromMe ? 'text-black/70' : 'text-[#fefefe]/70'),
                            children: customReq.pendingWith === sanitizedUsername ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "flex items-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {
                                        size: 12,
                                        className: "mr-1"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                                        lineNumber: 237,
                                        columnNumber: 21
                                    }, this),
                                    "Action required from you"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                                lineNumber: 236,
                                columnNumber: 19
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "flex items-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {
                                        size: 12,
                                        className: "mr-1"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                                        lineNumber: 242,
                                        columnNumber: 21
                                    }, this),
                                    "Waiting for ",
                                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(customReq.pendingWith || sanitizedActiveThread),
                                    " to respond..."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                                lineNumber: 241,
                                columnNumber: 19
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                            lineNumber: 234,
                            columnNumber: 15
                        }, this),
                        showActionButtons && !isPaid && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-wrap gap-2 pt-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: (e)=>{
                                        e.stopPropagation();
                                        handleAccept();
                                    },
                                    className: "bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 flex items-center transition-colors duration-150 font-medium shadow-sm",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle2$3e$__["CheckCircle2"], {
                                            size: 12,
                                            className: "mr-1"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                                            lineNumber: 259,
                                            columnNumber: 19
                                        }, this),
                                        "Accept"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                                    lineNumber: 252,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: (e)=>{
                                        e.stopPropagation();
                                        handleDecline();
                                    },
                                    className: "bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 flex items-center transition-colors duration-150 font-medium shadow-sm",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__XCircle$3e$__["XCircle"], {
                                            size: 12,
                                            className: "mr-1"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                                            lineNumber: 269,
                                            columnNumber: 19
                                        }, this),
                                        "Decline"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                                    lineNumber: 262,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: (e)=>{
                                        e.stopPropagation();
                                        handleEditRequest();
                                    },
                                    className: "bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 flex items-center transition-colors duration-150 font-medium shadow-sm",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pen$2d$line$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Edit3$3e$__["Edit3"], {
                                            size: 12,
                                            className: "mr-1"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                                            lineNumber: 279,
                                            columnNumber: 19
                                        }, this),
                                        "Edit"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                                    lineNumber: 272,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                            lineNumber: 251,
                            columnNumber: 15
                        }, this),
                        editRequestId === (customReq === null || customReq === void 0 ? void 0 : customReq.id) && customReq && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-3 space-y-2 bg-white/90 p-3 rounded border border-black/20 shadow-sm",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureInput"], {
                                    type: "text",
                                    placeholder: "Title",
                                    value: editTitle,
                                    onChange: setEditTitle,
                                    error: editErrors.title,
                                    touched: true,
                                    className: "w-full p-2 border rounded bg-white border-gray-300 text-black placeholder-gray-500",
                                    onClick: (e)=>e.stopPropagation(),
                                    maxLength: 100
                                }, void 0, false, {
                                    fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                                    lineNumber: 288,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureInput"], {
                                    type: "number",
                                    placeholder: "Price (USD)",
                                    value: editPrice.toString(),
                                    onChange: (val)=>{
                                        const sanitized = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeNumber"])(val, 0.01, 1000);
                                        setEditPrice(val === '' ? '' : sanitized);
                                    },
                                    error: editErrors.price,
                                    touched: true,
                                    min: "0.01",
                                    max: "1000",
                                    step: "0.01",
                                    className: "w-full p-2 border rounded bg-white border-gray-300 text-black placeholder-gray-500",
                                    onClick: (e)=>e.stopPropagation()
                                }, void 0, false, {
                                    fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                                    lineNumber: 299,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureTextarea"], {
                                    placeholder: "Message",
                                    value: editMessage,
                                    onChange: setEditMessage,
                                    error: editErrors.description,
                                    touched: true,
                                    maxLength: 500,
                                    characterCount: true,
                                    className: "w-full p-2 border rounded bg-white border-gray-300 text-black placeholder-gray-500 min-h-[80px]",
                                    onClick: (e)=>e.stopPropagation()
                                }, void 0, false, {
                                    fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                                    lineNumber: 315,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: (e)=>{
                                                e.stopPropagation();
                                                handleSecureEditSubmit();
                                            },
                                            className: "bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 flex items-center transition-colors duration-150 font-medium shadow-sm",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pen$2d$line$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Edit3$3e$__["Edit3"], {
                                                    size: 12,
                                                    className: "mr-1"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                                                    lineNumber: 334,
                                                    columnNumber: 21
                                                }, this),
                                                "Submit Edit"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                                            lineNumber: 327,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: (e)=>{
                                                e.stopPropagation();
                                                setEditRequestId(null);
                                                setEditErrors({});
                                            },
                                            className: "bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700 flex items-center transition-colors duration-150 font-medium shadow-sm",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                                    size: 12,
                                                    className: "mr-1"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                                                    lineNumber: 345,
                                                    columnNumber: 21
                                                }, this),
                                                "Cancel"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                                            lineNumber: 337,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                                    lineNumber: 326,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                            lineNumber: 287,
                            columnNumber: 15
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
                    lineNumber: 195,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
            lineNumber: 134,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/seller/messages/MessageItem.tsx",
        lineNumber: 133,
        columnNumber: 5
    }, this);
}
_s(MessageItem, "7uH93Kp3kxZzovw7OTtm4F8DJA0=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useIntersectionObserver$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useIntersectionObserver"]
    ];
});
_c = MessageItem;
var _c;
__turbopack_context__.k.register(_c, "MessageItem");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/VirtualList.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/components/VirtualList.tsx
__turbopack_context__.s({
    "VirtualList": ()=>VirtualList
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$virtual$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@tanstack/react-virtual/dist/esm/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function VirtualList(param) {
    let { items, itemHeight, renderItem, className, overscan = 5 } = param;
    _s();
    const parentRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Guards to prevent pathological values
    const safeItemHeight = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "VirtualList.useMemo[safeItemHeight]": ()=>itemHeight > 0 ? itemHeight : 56
    }["VirtualList.useMemo[safeItemHeight]"], [
        itemHeight
    ]);
    const safeOverscan = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "VirtualList.useMemo[safeOverscan]": ()=>overscan >= 0 && Number.isFinite(overscan) ? overscan : 5
    }["VirtualList.useMemo[safeOverscan]"], [
        overscan
    ]);
    const virtualizer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$virtual$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["useVirtualizer"])({
        count: items.length,
        getScrollElement: {
            "VirtualList.useVirtualizer[virtualizer]": ()=>parentRef.current
        }["VirtualList.useVirtualizer[virtualizer]"],
        estimateSize: {
            "VirtualList.useVirtualizer[virtualizer]": ()=>safeItemHeight
        }["VirtualList.useVirtualizer[virtualizer]"],
        overscan: safeOverscan
    });
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: parentRef,
        className: className,
        style: {
            overflow: 'auto',
            willChange: 'transform'
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: {
                height: "".concat(virtualizer.getTotalSize(), "px"),
                width: '100%',
                position: 'relative'
            },
            children: virtualizer.getVirtualItems().map((virtualItem)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: "".concat(virtualItem.size, "px"),
                        transform: "translateY(".concat(virtualItem.start, "px)")
                    },
                    children: renderItem(items[virtualItem.index], virtualItem.index)
                }, virtualItem.key, false, {
                    fileName: "[project]/src/components/VirtualList.tsx",
                    lineNumber: 45,
                    columnNumber: 11
                }, this))
        }, void 0, false, {
            fileName: "[project]/src/components/VirtualList.tsx",
            lineNumber: 37,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/VirtualList.tsx",
        lineNumber: 36,
        columnNumber: 5
    }, this);
}
_s(VirtualList, "d+7gHwYxxMazUi0AEQiwzVt+aPM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$virtual$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["useVirtualizer"]
    ];
});
_c = VirtualList;
var _c;
__turbopack_context__.k.register(_c, "VirtualList");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/seller/messages/MessagesList.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/components/seller/messages/MessagesList.tsx
__turbopack_context__.s({
    "default": ()=>MessagesList
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$seller$2f$messages$2f$MessageItem$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/seller/messages/MessageItem.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$VirtualList$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/VirtualList.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
function MessagesList(param) {
    let { threadMessages, sellerRequests, user, activeThread, handleAccept, handleDecline, handleEditRequest, handleEditSubmit, handleMessageVisible, editRequestId, setEditRequestId, editPrice, setEditPrice, editTitle, setEditTitle, editMessage, setEditMessage, setPreviewImage } = param;
    _s();
    // Create status badge
    const createStatusBadge = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MessagesList.useCallback[createStatusBadge]": (status)=>{
            const badgeClasses = {
                pending: "bg-yellow-500 text-black",
                accepted: "bg-green-500 text-white",
                rejected: "bg-red-500 text-white",
                paid: "bg-blue-500 text-white",
                edited: "bg-purple-500 text-white",
                cancelled: "bg-gray-500 text-white"
            };
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "ml-2 px-2 py-1 rounded text-xs font-medium ".concat(badgeClasses[status] || 'bg-gray-500 text-white'),
                children: status.charAt(0).toUpperCase() + status.slice(1)
            }, void 0, false, {
                fileName: "[project]/src/components/seller/messages/MessagesList.tsx",
                lineNumber: 61,
                columnNumber: 7
            }, this);
        }
    }["MessagesList.useCallback[createStatusBadge]"], []);
    // Find the latest custom request message
    const latestCustomRequestIndex = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "MessagesList.useMemo[latestCustomRequestIndex]": ()=>{
            for(let i = threadMessages.length - 1; i >= 0; i--){
                var _threadMessages_i_meta;
                if (threadMessages[i].type === 'customRequest' && ((_threadMessages_i_meta = threadMessages[i].meta) === null || _threadMessages_i_meta === void 0 ? void 0 : _threadMessages_i_meta.id)) {
                    return i;
                }
            }
            return -1;
        }
    }["MessagesList.useMemo[latestCustomRequestIndex]"], [
        threadMessages
    ]);
    // Prepare message data with all necessary props
    const messageData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "MessagesList.useMemo[messageData]": ()=>{
            return threadMessages.map({
                "MessagesList.useMemo[messageData]": (msg, index)=>{
                    const isFromMe = msg.sender === (user === null || user === void 0 ? void 0 : user.username);
                    // Find the custom request if this is a custom request message
                    const customReq = msg.type === 'customRequest' && msg.meta && msg.meta.id ? sellerRequests.find({
                        "MessagesList.useMemo[messageData]": (req)=>req.id === msg.meta.id
                    }["MessagesList.useMemo[messageData]"]) : null;
                    // Check if this is the latest custom request message
                    const isLatestCustom = index === latestCustomRequestIndex;
                    const isPaid = customReq && (customReq.paid || customReq.status === 'paid');
                    // Show action buttons if:
                    // 1. This is a custom request
                    // 2. This is the latest custom request message
                    // 3. The request is pending or edited
                    // 4. The request is pending with the current user (seller)
                    const showActionButtons = !!customReq && isLatestCustom && !isPaid && (customReq.status === 'pending' || customReq.status === 'edited') && customReq.pendingWith === (user === null || user === void 0 ? void 0 : user.username);
                    return {
                        msg,
                        index,
                        isFromMe,
                        customReq,
                        isLatestCustom,
                        isPaid,
                        showActionButtons,
                        key: "".concat(msg.id || index, "-").concat(msg.date || index)
                    };
                }
            }["MessagesList.useMemo[messageData]"]);
        }
    }["MessagesList.useMemo[messageData]"], [
        threadMessages,
        user,
        sellerRequests,
        latestCustomRequestIndex
    ]);
    // Render function for virtual list
    const renderMessage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MessagesList.useCallback[renderMessage]": (item)=>{
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$seller$2f$messages$2f$MessageItem$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                msg: item.msg,
                index: item.index,
                isFromMe: item.isFromMe,
                user: user,
                activeThread: activeThread,
                onMessageVisible: handleMessageVisible,
                customReq: item.customReq,
                isLatestCustom: item.isLatestCustom,
                isPaid: item.isPaid,
                showActionButtons: item.showActionButtons,
                handleAccept: {
                    "MessagesList.useCallback[renderMessage]": ()=>item.customReq && handleAccept(item.customReq.id)
                }["MessagesList.useCallback[renderMessage]"],
                handleDecline: {
                    "MessagesList.useCallback[renderMessage]": ()=>item.customReq && handleDecline(item.customReq.id)
                }["MessagesList.useCallback[renderMessage]"],
                handleEditRequest: {
                    "MessagesList.useCallback[renderMessage]": ()=>item.customReq && handleEditRequest(item.customReq.id, item.customReq.title, item.customReq.price, item.customReq.description || '')
                }["MessagesList.useCallback[renderMessage]"],
                editRequestId: editRequestId,
                editTitle: editTitle,
                setEditTitle: setEditTitle,
                editPrice: editPrice,
                setEditPrice: setEditPrice,
                editMessage: editMessage,
                setEditMessage: setEditMessage,
                handleEditSubmit: handleEditSubmit,
                setEditRequestId: setEditRequestId,
                statusBadge: createStatusBadge,
                setPreviewImage: setPreviewImage
            }, item.key, false, {
                fileName: "[project]/src/components/seller/messages/MessagesList.tsx",
                lineNumber: 119,
                columnNumber: 7
            }, this);
        }
    }["MessagesList.useCallback[renderMessage]"], [
        user,
        activeThread,
        handleMessageVisible,
        handleAccept,
        handleDecline,
        handleEditRequest,
        editRequestId,
        editTitle,
        setEditTitle,
        editPrice,
        setEditPrice,
        editMessage,
        setEditMessage,
        handleEditSubmit,
        setEditRequestId,
        createStatusBadge,
        setPreviewImage
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex-1 overflow-hidden",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$VirtualList$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VirtualList"], {
            items: messageData,
            itemHeight: 100,
            renderItem: renderMessage,
            className: "p-4 h-full overflow-y-auto"
        }, void 0, false, {
            fileName: "[project]/src/components/seller/messages/MessagesList.tsx",
            lineNumber: 174,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/seller/messages/MessagesList.tsx",
        lineNumber: 173,
        columnNumber: 5
    }, this);
}
_s(MessagesList, "WZSptIs1LnX2oZZQfhtf5TgKoyA=");
_c = MessagesList;
var _c;
__turbopack_context__.k.register(_c, "MessagesList");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/seller/messages/MessageInput.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": ()=>__TURBOPACK__default__export__
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/triangle-alert.js [app-client] (ecmascript) <export default as AlertTriangle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$smile$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Smile$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/smile.js [app-client] (ecmascript) <export default as Smile>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldAlert$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shield-alert.js [app-client] (ecmascript) <export default as ShieldAlert>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/SecureInput.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-client] (ecmascript) <locals>");
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
const MessageInput = /*#__PURE__*/ _s((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c = _s((param, ref)=>{
    let { replyMessage, setReplyMessage, selectedImage, setSelectedImage, imageError, isImageLoading, showEmojiPicker, setShowEmojiPicker, isUserBlocked, onReply, onKeyDown, onImageClick, onBlockToggle, fileInputRef, emojiPickerRef, onImageSelect } = param;
    _s();
    const [validationError, setValidationError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Secure image selection with validation
    const handleSecureImageSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MessageInput.useCallback[handleSecureImageSelect]": (e)=>{
            var _e_target_files;
            const file = (_e_target_files = e.target.files) === null || _e_target_files === void 0 ? void 0 : _e_target_files[0];
            if (!file) return;
            // Validate file before processing
            const validation = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].validateFileUpload(file, {
                maxSize: 5 * 1024 * 1024,
                allowedTypes: [
                    'image/jpeg',
                    'image/png',
                    'image/gif',
                    'image/webp'
                ],
                allowedExtensions: [
                    'jpg',
                    'jpeg',
                    'png',
                    'gif',
                    'webp'
                ]
            });
            if (!validation.valid) {
                setValidationError(validation.error || 'Invalid file');
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                return;
            }
            // Clear validation error and proceed
            setValidationError(null);
            onImageSelect(e);
        }
    }["MessageInput.useCallback[handleSecureImageSelect]"], [
        onImageSelect,
        fileInputRef
    ]);
    if (isUserBlocked) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "p-4 border-t border-gray-800 text-center text-sm text-red-400 bg-[#1a1a1a] flex items-center justify-center",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldAlert$3e$__["ShieldAlert"], {
                    size: 16,
                    className: "mr-2"
                }, void 0, false, {
                    fileName: "[project]/src/components/seller/messages/MessageInput.tsx",
                    lineNumber: 84,
                    columnNumber: 11
                }, ("TURBOPACK compile-time value", void 0)),
                "You have blocked this buyer",
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: (e)=>{
                        e.stopPropagation();
                        onBlockToggle();
                    },
                    className: "ml-2 underline text-gray-400 hover:text-white transition-colors duration-150",
                    children: "Unblock"
                }, void 0, false, {
                    fileName: "[project]/src/components/seller/messages/MessageInput.tsx",
                    lineNumber: 86,
                    columnNumber: 11
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/seller/messages/MessageInput.tsx",
            lineNumber: 83,
            columnNumber: 9
        }, ("TURBOPACK compile-time value", void 0));
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative border-t border-gray-800 bg-[#1a1a1a]",
        children: [
            selectedImage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-4 pt-3 pb-2",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative inline-block",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureMessageDisplay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureImage"], {
                            src: selectedImage,
                            alt: "Preview",
                            className: "max-h-20 rounded shadow-md",
                            onError: ()=>{
                                setValidationError('Failed to load image');
                                setSelectedImage(null);
                            }
                        }, void 0, false, {
                            fileName: "[project]/src/components/seller/messages/MessageInput.tsx",
                            lineNumber: 105,
                            columnNumber: 15
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>{
                                setSelectedImage(null);
                                setValidationError(null);
                                if (fileInputRef.current) {
                                    fileInputRef.current.value = '';
                                }
                            },
                            className: "absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs shadow-md transform transition-transform hover:scale-110",
                            style: {
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            },
                            "aria-label": "Remove image",
                            title: "Remove image",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                size: 14
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller/messages/MessageInput.tsx",
                                lineNumber: 127,
                                columnNumber: 17
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/src/components/seller/messages/MessageInput.tsx",
                            lineNumber: 114,
                            columnNumber: 15
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/seller/messages/MessageInput.tsx",
                    lineNumber: 104,
                    columnNumber: 13
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/seller/messages/MessageInput.tsx",
                lineNumber: 103,
                columnNumber: 11
            }, ("TURBOPACK compile-time value", void 0)),
            isImageLoading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-4 pt-3 pb-0 text-sm text-gray-400",
                children: "Loading image..."
            }, void 0, false, {
                fileName: "[project]/src/components/seller/messages/MessageInput.tsx",
                lineNumber: 135,
                columnNumber: 11
            }, ("TURBOPACK compile-time value", void 0)),
            (imageError || validationError) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-4 pt-3 pb-0 text-sm text-red-400 flex items-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"], {
                        size: 14,
                        className: "mr-1"
                    }, void 0, false, {
                        fileName: "[project]/src/components/seller/messages/MessageInput.tsx",
                        lineNumber: 141,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0)),
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(imageError || validationError || '')
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/seller/messages/MessageInput.tsx",
                lineNumber: 140,
                columnNumber: 11
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-4 py-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative mb-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SecureInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SecureTextarea"], {
                                ref: ref,
                                value: replyMessage,
                                onChange: setReplyMessage,
                                onKeyDown: onKeyDown,
                                placeholder: selectedImage ? 'Add a caption...' : 'Type a message',
                                className: "w-full p-3 pr-12 rounded-lg bg-[#222] border border-gray-700 text-white focus:outline-none focus:ring-1 focus:ring-[#ff950e] min-h-[40px] max-h-20 resize-none overflow-auto leading-tight",
                                rows: 1,
                                maxLength: 250,
                                characterCount: false,
                                sanitize: true
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller/messages/MessageInput.tsx",
                                lineNumber: 149,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: (e)=>{
                                    e.stopPropagation();
                                    setShowEmojiPicker(!showEmojiPicker);
                                },
                                className: "absolute right-3 top-1/2 transform -translate-y-1/2 mt-[-4px] flex items-center justify-center h-8 w-8 rounded-full ".concat(showEmojiPicker ? 'bg-[#ff950e] text-black' : 'text-[#ff950e] hover:bg-[#333]', " transition-colors duration-150"),
                                title: "Emoji",
                                type: "button",
                                "aria-pressed": showEmojiPicker,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$smile$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Smile$3e$__["Smile"], {
                                    size: 20,
                                    className: "flex-shrink-0"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/seller/messages/MessageInput.tsx",
                                    lineNumber: 175,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller/messages/MessageInput.tsx",
                                lineNumber: 163,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/seller/messages/MessageInput.tsx",
                        lineNumber: 148,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    replyMessage.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-xs text-gray-400 mb-2 text-right",
                        children: [
                            replyMessage.length,
                            "/250"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/seller/messages/MessageInput.tsx",
                        lineNumber: 181,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex justify-between items-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                src: "/Attach_Image_Icon.png",
                                alt: "Attach Image",
                                className: "w-14 h-14 cursor-pointer hover:opacity-80 transition-opacity ".concat(isImageLoading ? 'opacity-50 cursor-not-allowed' : ''),
                                onClick: (e)=>{
                                    if (isImageLoading) return;
                                    e.stopPropagation();
                                    onImageClick();
                                },
                                title: "Attach Image"
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller/messages/MessageInput.tsx",
                                lineNumber: 187,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "file",
                                accept: "image/jpeg,image/png,image/gif,image/webp",
                                ref: fileInputRef,
                                style: {
                                    display: 'none'
                                },
                                onChange: handleSecureImageSelect
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller/messages/MessageInput.tsx",
                                lineNumber: 202,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                src: "/Send_Button.png",
                                alt: "Send",
                                onClick: (e)=>{
                                    e.stopPropagation();
                                    onReply();
                                },
                                className: "cursor-pointer hover:opacity-90 transition-opacity h-11 ".concat(!replyMessage.trim() && !selectedImage || isImageLoading ? 'opacity-50 cursor-not-allowed' : ''),
                                style: {
                                    pointerEvents: !replyMessage.trim() && !selectedImage || isImageLoading ? 'none' : 'auto'
                                },
                                title: "Send message"
                            }, void 0, false, {
                                fileName: "[project]/src/components/seller/messages/MessageInput.tsx",
                                lineNumber: 211,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/seller/messages/MessageInput.tsx",
                        lineNumber: 185,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/seller/messages/MessageInput.tsx",
                lineNumber: 147,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/seller/messages/MessageInput.tsx",
        lineNumber: 100,
        columnNumber: 7
    }, ("TURBOPACK compile-time value", void 0));
}, "a5mnzJuUqImCO72rbTQP5VK+eLA=")), "a5mnzJuUqImCO72rbTQP5VK+eLA=");
_c1 = MessageInput;
MessageInput.displayName = 'MessageInput';
const __TURBOPACK__default__export__ = MessageInput;
var _c, _c1;
__turbopack_context__.k.register(_c, "MessageInput$forwardRef");
__turbopack_context__.k.register(_c1, "MessageInput");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/constants/emojis.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/constants/emojis.ts
__turbopack_context__.s({
    "ALLOWED_IMAGE_TYPES": ()=>ALLOWED_IMAGE_TYPES,
    "ALL_EMOJIS": ()=>ALL_EMOJIS,
    "FREQUENT_EMOJIS": ()=>FREQUENT_EMOJIS,
    "MAX_IMAGE_SIZE": ()=>MAX_IMAGE_SIZE
});
const ALL_EMOJIS = [
    // ❤️ MOST LIKELY TO BE USED - Love, flirty, suggestive
    '❤️',
    '💕',
    '💖',
    '💗',
    '💓',
    '💞',
    '💝',
    '😍',
    '🥰',
    '😘',
    '😗',
    '😙',
    '😚',
    '💋',
    '😋',
    '😛',
    '😜',
    '😝',
    '🤤',
    '🥵',
    '🔥',
    '💦',
    '🍑',
    '🍆',
    '🌶',
    '🍯',
    '🍒',
    '🍓',
    '🥥',
    '🍌',
    '🍭',
    '🍰',
    '🧁',
    '🍪',
    '🥛',
    '☕',
    '🍷',
    '🥂',
    '🍾',
    '💎',
    '🎁',
    '🌹',
    '🌺',
    '🌸',
    '💐',
    '🦋',
    '✨',
    '💫',
    '⭐',
    '🌟',
    '💯',
    // 😊 COMMON POSITIVE EMOTIONS
    '😊',
    '🙂',
    '😁',
    '😄',
    '😃',
    '😀',
    '😆',
    '😅',
    '😂',
    '🤣',
    '🥳',
    '😇',
    '🤗',
    '🤭',
    '😉',
    '😌',
    '🥺',
    '🥹',
    '😏',
    '🤩',
    '😎',
    '🤓',
    '🧐',
    '🤔',
    '🤫',
    '🤐',
    '😌',
    // 💜 MORE HEARTS & LOVE
    '🧡',
    '💛',
    '💚',
    '💙',
    '💜',
    '🖤',
    '🤍',
    '🤎',
    '💔',
    '❣️',
    '💘',
    '💟',
    // 😢 EMOTIONS & EXPRESSIONS  
    '😢',
    '😭',
    '😤',
    '😠',
    '😡',
    '🤬',
    '🤯',
    '😳',
    '😱',
    '😨',
    '😰',
    '😥',
    '😓',
    '😞',
    '😔',
    '😟',
    '😕',
    '🙁',
    '☹️',
    '😣',
    '😖',
    '😫',
    '😩',
    '😪',
    '😴',
    '🤤',
    '😵',
    '🥴',
    '🤢',
    '🤮',
    '🤧',
    '😷',
    '🤒',
    '🤕',
    '🥶',
    // 🎉 CELEBRATION & FUN
    '🎉',
    '🎊',
    '🎈',
    '🎂',
    '🎀',
    '🎁',
    '🏆',
    '🥇',
    '🥈',
    '🥉',
    '🏅',
    '🎖',
    '🎗',
    '🎫',
    '🎟',
    '🎪',
    '🎭',
    '🎨',
    '🎬',
    '🎤',
    '🎧',
    '🎵',
    '🎶',
    '🎸',
    '🎹',
    '🎺',
    '🎻',
    '🥁',
    // 💰 MONEY & SHOPPING
    '💰',
    '💵',
    '💴',
    '💶',
    '💷',
    '🪙',
    '💳',
    '💸',
    '🛍',
    '🛒',
    '🛁',
    '👑',
    '💍',
    '👄',
    '💄',
    '👗',
    '👙',
    '👠',
    '🩱',
    '🧿',
    // 🍕 FOOD & DRINKS (selective favorites)
    '🍕',
    '🍔',
    '🍟',
    '🌮',
    '🌯',
    '🥪',
    '🥗',
    '🍝',
    '🍜',
    '🍲',
    '🍛',
    '🍣',
    '🍱',
    '🍙',
    '🍚',
    '🥟',
    '🍤',
    '🦪',
    '🥘',
    '🫕',
    '🥫',
    '🍳',
    '🥚',
    '🧀',
    '🥓',
    '🥩',
    '🍗',
    '🍖',
    '🥞',
    '🧇',
    '🥐',
    '🥯',
    '🍞',
    '🥖',
    '🥨',
    '🧈',
    // 🍎 FRUITS (keeping sexy ones at front)
    '🍎',
    '🍐',
    '🍊',
    '🍋',
    '🍉',
    '🍇',
    '🫐',
    '🍈',
    '🍑',
    '🥭',
    '🍍',
    '🥝',
    '🍅',
    // 🐱 CUTE ANIMALS
    '🐱',
    '🐶',
    '🦊',
    '🐻',
    '🐼',
    '🐨',
    '🐰',
    '🐹',
    '🐭',
    '🐯',
    '🦁',
    '🐮',
    '🐷',
    '🐸',
    '🐵',
    '🙈',
    '🙉',
    '🙊',
    '🐔',
    '🐧',
    '🦆',
    '🦉',
    '🦇',
    '🐺',
    '🐴',
    '🦄',
    '🐝',
    '🦋',
    '🐌',
    '🐞',
    '🐜',
    '🕷',
    '🦂',
    '🐢',
    '🐍',
    '🦎',
    '🐙',
    '🦑',
    '🦐',
    '🦞',
    '🦀',
    '🐡',
    '🐠',
    '🐟',
    '🐬',
    '🐳',
    '🐋',
    '🦈',
    '🐊',
    '🐅',
    '🐆',
    '🦓',
    '🦍',
    '🦧',
    '🐘',
    '🦛',
    '🦏',
    '🐪',
    '🐫',
    '🦒',
    '🦘',
    '🐃',
    // ⚽ ACTIVITIES & SPORTS
    '⚽',
    '🏀',
    '🏈',
    '⚾',
    '🥎',
    '🎾',
    '🏐',
    '🏉',
    '🥏',
    '🎱',
    '🏓',
    '🏸',
    '🏒',
    '🏑',
    '🥍',
    '🏏',
    '🥅',
    '⛳',
    '🏹',
    '🎣',
    '🤿',
    '🥊',
    '🥋',
    '🎽',
    '🛹',
    '🛼',
    '🛷',
    '⛸',
    '🥌',
    '🎿',
    '⛷',
    '🏂',
    '🏋️',
    '🤼',
    '🤸',
    '⛹️',
    '🤺',
    '🤾',
    '🏌️',
    '🏇',
    '🧘',
    '🏄',
    '🏊',
    '🤽',
    '🚣',
    '🧗',
    '🚵',
    '🚴',
    '🤹',
    // 🚗 TRAVEL & PLACES  
    '🚗',
    '🚕',
    '🚙',
    '🚌',
    '🚎',
    '🏎',
    '🚓',
    '🚑',
    '🚒',
    '🚐',
    '🛻',
    '🚚',
    '🚛',
    '🚜',
    '🛴',
    '🚲',
    '🛵',
    '🏍',
    '🛺',
    '🚁',
    '✈️',
    '🛫',
    '🛬',
    '🛩',
    '🚀',
    '🛸',
    '⛵',
    '🚤',
    '🛥',
    '🛳',
    '⚴',
    '🚢',
    '🏖',
    '🏝',
    '🏕',
    '🗻',
    '🏔',
    '❄️',
    '☀️',
    '🌤',
    '⛅',
    '🌦',
    '🌧',
    '⛈',
    '🌩',
    '🌨',
    '☁️',
    '🌪',
    '🌈',
    '☂️',
    '☔',
    // 📱 OBJECTS & TECH
    '📱',
    '💻',
    '⌨️',
    '🖥',
    '🖨',
    '🖱',
    '📷',
    '📸',
    '📹',
    '🎥',
    '📽',
    '🎞',
    '📞',
    '☎️',
    '📺',
    '📻',
    '🎙',
    '⌚',
    '⏰',
    '⏲',
    '⏱',
    '🕰',
    '⌛',
    '⏳',
    '🔋',
    '🔌',
    '💡',
    '🔦',
    '🕯',
    '🧯',
    '💽',
    '💾',
    '💿',
    '📀',
    '📼',
    '📡',
    // 🎯 SYMBOLS & MISC
    '☮️',
    '✝️',
    '☪️',
    '🕉',
    '☸️',
    '✡️',
    '🔯',
    '🕎',
    '☯️',
    '☦️',
    '🛐',
    '⛎',
    '♈',
    '♉',
    '♊',
    '♋',
    '♌',
    '♍',
    '♎',
    '♏',
    '♐',
    '♑',
    '♒',
    '♓',
    '🆔',
    '⚛️',
    '🉑',
    '☢️',
    '☣️',
    '📴',
    '📳',
    '🈶',
    '🈚',
    '🈸',
    '🈺',
    '🈷️',
    '✴️',
    '🆚',
    '💮',
    '🉐',
    '㊙️',
    '㊗️',
    '🈴',
    '🈵',
    '🈹',
    '🈲',
    '🅰️',
    '🅱️',
    '🆎',
    '🆑',
    // 🏁 FLAGS (minimal selection)
    '🏁',
    '🚩',
    '🎌',
    '🏴',
    '🏳️',
    '🏳️‍🌈',
    '🏳️‍⚧️',
    '🏴‍☠️'
];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB limit for images
const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
];
const FREQUENT_EMOJIS = [
    '❤️',
    '💕',
    '😍',
    '🥰',
    '😘',
    '💋',
    '🔥',
    '💦',
    '😊',
    '😁',
    '😂',
    '🥳',
    '😎',
    '🤩',
    '😏',
    '😉',
    '🍑',
    '🍆',
    '🌶',
    '🍒',
    '💎',
    '🎁',
    '🌹',
    '✨',
    '💯',
    '👍',
    '👌',
    '🙌',
    '💪',
    '🤝',
    '👏',
    '🎉'
];
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/seller/messages/EmojiPicker.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/components/sellers/messages/EmojiPicker.tsx
__turbopack_context__.s({
    "default": ()=>EmojiPicker
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$emojis$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/constants/emojis.ts [app-client] (ecmascript)");
'use client';
;
;
function EmojiPicker(param) {
    let { recentEmojis, onEmojiClick } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "absolute left-0 right-0 mx-4 bottom-full mb-2 bg-black border border-gray-800 shadow-lg z-50 rounded-lg overflow-hidden",
        children: [
            recentEmojis.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-3 pt-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-xs text-gray-400 mb-2",
                        children: "Recent"
                    }, void 0, false, {
                        fileName: "[project]/src/components/seller/messages/EmojiPicker.tsx",
                        lineNumber: 18,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-8 gap-1 mb-3",
                        children: recentEmojis.slice(0, 16).map((emoji, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                onClick: ()=>onEmojiClick(emoji),
                                className: "emoji-button flex items-center justify-center text-xl rounded-full w-10 h-10 cursor-pointer bg-black hover:bg-[#222] transition-colors duration-150",
                                children: emoji
                            }, "recent-".concat(index), false, {
                                fileName: "[project]/src/components/seller/messages/EmojiPicker.tsx",
                                lineNumber: 21,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/components/seller/messages/EmojiPicker.tsx",
                        lineNumber: 19,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/seller/messages/EmojiPicker.tsx",
                lineNumber: 17,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-3 pt-2 pb-3",
                children: [
                    recentEmojis.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-xs text-gray-400 mb-2",
                        children: "All Emojis"
                    }, void 0, false, {
                        fileName: "[project]/src/components/seller/messages/EmojiPicker.tsx",
                        lineNumber: 36,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-8 gap-1 p-0 overflow-auto",
                        style: {
                            maxHeight: '200px'
                        },
                        children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$emojis$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ALL_EMOJIS"].map((emoji, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                onClick: ()=>onEmojiClick(emoji),
                                className: "emoji-button flex items-center justify-center text-xl rounded-full w-10 h-10 cursor-pointer bg-black hover:bg-[#222] transition-colors duration-150",
                                children: emoji
                            }, "emoji-".concat(index), false, {
                                fileName: "[project]/src/components/seller/messages/EmojiPicker.tsx",
                                lineNumber: 40,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/components/seller/messages/EmojiPicker.tsx",
                        lineNumber: 38,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/seller/messages/EmojiPicker.tsx",
                lineNumber: 34,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/seller/messages/EmojiPicker.tsx",
        lineNumber: 14,
        columnNumber: 5
    }, this);
}
_c = EmojiPicker;
var _c;
__turbopack_context__.k.register(_c, "EmojiPicker");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/seller/messages/MessageInputContainer.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/components/sellers/messages/MessageInputContainer.tsx
__turbopack_context__.s({
    "default": ()=>MessageInputContainer
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$seller$2f$messages$2f$MessageInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/seller/messages/MessageInput.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$seller$2f$messages$2f$EmojiPicker$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/seller/messages/EmojiPicker.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$emojis$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/constants/emojis.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
function MessageInputContainer(param) {
    let { isUserBlocked, onBlockToggle, activeThread, replyMessage, setReplyMessage, selectedImage, setSelectedImage, isImageLoading, setIsImageLoading, imageError, setImageError, showEmojiPicker, setShowEmojiPicker, recentEmojis, handleReply, handleEmojiClick, handleImageSelect } = param;
    _s();
    const fileInputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const emojiPickerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const inputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Handle clicks outside emoji picker
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MessageInputContainer.useEffect": ()=>{
            const handleClickOutside = {
                "MessageInputContainer.useEffect.handleClickOutside": (event)=>{
                    if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                        setShowEmojiPicker(false);
                    }
                }
            }["MessageInputContainer.useEffect.handleClickOutside"];
            document.addEventListener('mousedown', handleClickOutside);
            return ({
                "MessageInputContainer.useEffect": ()=>{
                    document.removeEventListener('mousedown', handleClickOutside);
                }
            })["MessageInputContainer.useEffect"];
        }
    }["MessageInputContainer.useEffect"], [
        setShowEmojiPicker
    ]);
    // Focus input after emoji selection
    const handleEmojiClickWithFocus = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MessageInputContainer.useCallback[handleEmojiClickWithFocus]": (emoji)=>{
            handleEmojiClick(emoji);
            setTimeout({
                "MessageInputContainer.useCallback[handleEmojiClickWithFocus]": ()=>{
                    if (inputRef.current) {
                        inputRef.current.focus();
                    }
                }
            }["MessageInputContainer.useCallback[handleEmojiClickWithFocus]"], 0);
        }
    }["MessageInputContainer.useCallback[handleEmojiClickWithFocus]"], [
        handleEmojiClick
    ]);
    // Handle reply with input focus
    const handleReplyWithFocus = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MessageInputContainer.useCallback[handleReplyWithFocus]": ()=>{
            console.log('handleReplyWithFocus called', {
                activeThread,
                replyMessage,
                hasImage: !!selectedImage
            });
            // Don't send if no active thread
            if (!activeThread) {
                console.error('No active thread selected');
                return;
            }
            // Don't send if message is empty and no image
            if (!replyMessage.trim() && !selectedImage) {
                console.log('Cannot send empty message');
                return;
            }
            console.log('Calling handleReply...');
            handleReply();
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            setTimeout({
                "MessageInputContainer.useCallback[handleReplyWithFocus]": ()=>{
                    if (inputRef.current) {
                        inputRef.current.focus();
                    }
                }
            }["MessageInputContainer.useCallback[handleReplyWithFocus]"], 0);
        }
    }["MessageInputContainer.useCallback[handleReplyWithFocus]"], [
        activeThread,
        replyMessage,
        selectedImage,
        handleReply
    ]);
    // Handle image selection from file input
    const handleImageSelectFromInput = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MessageInputContainer.useCallback[handleImageSelectFromInput]": (event)=>{
            var _event_target_files;
            const file = (_event_target_files = event.target.files) === null || _event_target_files === void 0 ? void 0 : _event_target_files[0];
            if (!file) return;
            setImageError(null);
            if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$emojis$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ALLOWED_IMAGE_TYPES"].includes(file.type)) {
                setImageError("Please select a valid image file (JPEG, PNG, GIF, WEBP)");
                return;
            }
            if (file.size > __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$emojis$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MAX_IMAGE_SIZE"]) {
                setImageError("Image too large. Maximum size is ".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$emojis$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MAX_IMAGE_SIZE"] / (1024 * 1024), "MB"));
                return;
            }
            handleImageSelect(file);
        }
    }["MessageInputContainer.useCallback[handleImageSelectFromInput]"], [
        setImageError,
        handleImageSelect
    ]);
    const handleKeyDown = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MessageInputContainer.useCallback[handleKeyDown]": (e)=>{
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleReplyWithFocus();
            }
        }
    }["MessageInputContainer.useCallback[handleKeyDown]"], [
        handleReplyWithFocus
    ]);
    const triggerFileInput = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MessageInputContainer.useCallback[triggerFileInput]": ()=>{
            var _fileInputRef_current;
            (_fileInputRef_current = fileInputRef.current) === null || _fileInputRef_current === void 0 ? void 0 : _fileInputRef_current.click();
        }
    }["MessageInputContainer.useCallback[triggerFileInput]"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative",
        children: [
            showEmojiPicker && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                ref: emojiPickerRef,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$seller$2f$messages$2f$EmojiPicker$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    recentEmojis: recentEmojis,
                    onEmojiClick: handleEmojiClickWithFocus
                }, void 0, false, {
                    fileName: "[project]/src/components/seller/messages/MessageInputContainer.tsx",
                    lineNumber: 143,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/seller/messages/MessageInputContainer.tsx",
                lineNumber: 142,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$seller$2f$messages$2f$MessageInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                ref: inputRef,
                replyMessage: replyMessage,
                setReplyMessage: setReplyMessage,
                selectedImage: selectedImage,
                setSelectedImage: setSelectedImage,
                imageError: imageError,
                isImageLoading: isImageLoading,
                showEmojiPicker: showEmojiPicker,
                setShowEmojiPicker: setShowEmojiPicker,
                isUserBlocked: isUserBlocked,
                onReply: handleReplyWithFocus,
                onKeyDown: handleKeyDown,
                onImageClick: triggerFileInput,
                onBlockToggle: onBlockToggle,
                fileInputRef: fileInputRef,
                emojiPickerRef: emojiPickerRef,
                onImageSelect: handleImageSelectFromInput
            }, void 0, false, {
                fileName: "[project]/src/components/seller/messages/MessageInputContainer.tsx",
                lineNumber: 150,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/seller/messages/MessageInputContainer.tsx",
        lineNumber: 139,
        columnNumber: 5
    }, this);
}
_s(MessageInputContainer, "3LhT87339DWAI4/fSMgnAyrqR+Y=");
_c = MessageInputContainer;
var _c;
__turbopack_context__.k.register(_c, "MessageInputContainer");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/messaging/TypingIndicator.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/components/messaging/TypingIndicator.tsx
__turbopack_context__.s({
    "default": ()=>TypingIndicator
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$jsx$2f$style$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/styled-jsx/style.js [app-client] (ecmascript)");
'use client';
;
;
function TypingIndicator(param) {
    let { username, isTyping, userPic } = param;
    if (!isTyping) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            animation: 'fadeIn 0.3s ease-out'
        },
        "aria-live": "polite",
        "aria-atomic": "true",
        className: "jsx-50743052ec6e6a34" + " " + "flex items-end gap-2 mb-3",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "jsx-50743052ec6e6a34" + " " + "flex-shrink-0",
                children: userPic ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                    src: userPic,
                    alt: username,
                    className: "jsx-50743052ec6e6a34" + " " + "w-8 h-8 rounded-full object-cover"
                }, void 0, false, {
                    fileName: "[project]/src/components/messaging/TypingIndicator.tsx",
                    lineNumber: 25,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "jsx-50743052ec6e6a34" + " " + "w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold",
                    children: username.charAt(0).toUpperCase()
                }, void 0, false, {
                    fileName: "[project]/src/components/messaging/TypingIndicator.tsx",
                    lineNumber: 31,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/messaging/TypingIndicator.tsx",
                lineNumber: 23,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "jsx-50743052ec6e6a34" + " " + "flex flex-col",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        "aria-label": "".concat(username, " is typing"),
                        className: "jsx-50743052ec6e6a34" + " " + "text-xs text-gray-400 mb-1",
                        children: [
                            username,
                            " is typing"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/messaging/TypingIndicator.tsx",
                        lineNumber: 39,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            background: 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)',
                            border: '1px solid rgba(255, 149, 14, 0.15)',
                            borderRadius: '6px',
                            width: 'fit-content',
                            minWidth: '48px',
                            maxWidth: '56px'
                        },
                        className: "jsx-50743052ec6e6a34" + " " + "inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded shadow-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    width: '5px',
                                    height: '5px',
                                    background: '#ff950e',
                                    borderRadius: '50%',
                                    display: 'inline-block',
                                    animation: 'typingBounce 1.4s infinite ease-in-out',
                                    animationDelay: '0ms'
                                },
                                className: "jsx-50743052ec6e6a34" + " " + "typing-dot"
                            }, void 0, false, {
                                fileName: "[project]/src/components/messaging/TypingIndicator.tsx",
                                lineNumber: 56,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    width: '5px',
                                    height: '5px',
                                    background: '#ff950e',
                                    borderRadius: '50%',
                                    display: 'inline-block',
                                    animation: 'typingBounce 1.4s infinite ease-in-out',
                                    animationDelay: '200ms'
                                },
                                className: "jsx-50743052ec6e6a34" + " " + "typing-dot"
                            }, void 0, false, {
                                fileName: "[project]/src/components/messaging/TypingIndicator.tsx",
                                lineNumber: 68,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    width: '5px',
                                    height: '5px',
                                    background: '#ff950e',
                                    borderRadius: '50%',
                                    display: 'inline-block',
                                    animation: 'typingBounce 1.4s infinite ease-in-out',
                                    animationDelay: '400ms'
                                },
                                className: "jsx-50743052ec6e6a34" + " " + "typing-dot"
                            }, void 0, false, {
                                fileName: "[project]/src/components/messaging/TypingIndicator.tsx",
                                lineNumber: 80,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/messaging/TypingIndicator.tsx",
                        lineNumber: 44,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/messaging/TypingIndicator.tsx",
                lineNumber: 38,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$jsx$2f$style$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                id: "50743052ec6e6a34",
                children: "@keyframes typingBounce{0%,60%,to{opacity:.6;transform:translateY(0)}30%{opacity:1;transform:translateY(-4px)}}@keyframes fadeIn{0%{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}"
            }, void 0, false, void 0, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/messaging/TypingIndicator.tsx",
        lineNumber: 16,
        columnNumber: 5
    }, this);
}
_c = TypingIndicator;
var _c;
__turbopack_context__.k.register(_c, "TypingIndicator");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/seller/messages/ConversationView.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": ()=>ConversationView
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WebSocketContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/WebSocketContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$seller$2f$messages$2f$ChatHeader$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/seller/messages/ChatHeader.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$seller$2f$messages$2f$MessagesList$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/seller/messages/MessagesList.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$seller$2f$messages$2f$MessageInputContainer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/seller/messages/MessageInputContainer.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$messaging$2f$TypingIndicator$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/messaging/TypingIndicator.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
// Helper to get conversation key
const getConversationKey = (userA, userB)=>{
    return [
        userA,
        userB
    ].sort().join('-');
};
// Debug flag - set to false in production
const DEBUG = ("TURBOPACK compile-time value", "development") === 'development';
function ConversationView(param) {
    let { activeThread, threads, buyerProfiles, sellerRequests, isUserBlocked, isUserReported, handleReport, handleBlockToggle, user, messageInputControls, editRequestControls, handleAccept, handleDecline, handleEditRequest, handleMessageVisible, setPreviewImage } = param;
    var _buyerProfiles_activeThread;
    _s();
    const messagesEndRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const messagesContainerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Get WebSocket context for thread focus/blur and typing
    const wsContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WebSocketContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWebSocket"])();
    // State for typing indicator
    const [isBuyerTyping, setIsBuyerTyping] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Refs for typing management
    const typingTimeoutRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const isTypingRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const lastTypingEmitRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(0);
    const autoHideTimeoutRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const hasScrolledForTypingRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false); // Track if we've already scrolled for current typing session
    const userHasScrolledRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false); // Track if user has manually scrolled
    // Track manual scrolling
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ConversationView.useEffect": ()=>{
            const container = messagesContainerRef.current;
            if (!container) return;
            const handleScroll = {
                "ConversationView.useEffect.handleScroll": ()=>{
                    const { scrollHeight, scrollTop, clientHeight } = container;
                    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
                    // If user scrolled up (not at bottom), mark as manually scrolled
                    if (!isAtBottom) {
                        userHasScrolledRef.current = true;
                    } else {
                        userHasScrolledRef.current = false;
                    }
                }
            }["ConversationView.useEffect.handleScroll"];
            container.addEventListener('scroll', handleScroll);
            return ({
                "ConversationView.useEffect": ()=>container.removeEventListener('scroll', handleScroll)
            })["ConversationView.useEffect"];
        }
    }["ConversationView.useEffect"], [
        activeThread
    ]); // Reset when thread changes
    // Handle thread focus/blur for auto-read functionality
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ConversationView.useEffect": ()=>{
            if (!activeThread || !user || !(wsContext === null || wsContext === void 0 ? void 0 : wsContext.sendMessage)) {
                return;
            }
            const threadId = getConversationKey(user.username, activeThread);
            // Notify backend that seller is viewing this thread
            wsContext.sendMessage('thread:focus', {
                threadId,
                otherUser: activeThread
            });
            return ({
                "ConversationView.useEffect": ()=>{
                    var // Notify backend when seller leaves the thread
                    _wsContext_sendMessage;
                    (_wsContext_sendMessage = wsContext.sendMessage) === null || _wsContext_sendMessage === void 0 ? void 0 : _wsContext_sendMessage.call(wsContext, 'thread:blur', {
                        threadId,
                        otherUser: activeThread
                    });
                }
            })["ConversationView.useEffect"];
        }
    }["ConversationView.useEffect"], [
        activeThread,
        user,
        wsContext
    ]);
    // Listen for buyer typing events
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ConversationView.useEffect": ()=>{
            if (!wsContext || !activeThread || !user) return;
            const conversationId = getConversationKey(user.username, activeThread);
            const handleTypingEvent = {
                "ConversationView.useEffect.handleTypingEvent": (data)=>{
                    if (data.conversationId === conversationId && data.username === activeThread) {
                        // Clear any existing auto-hide timeout
                        if (autoHideTimeoutRef.current) {
                            clearTimeout(autoHideTimeoutRef.current);
                            autoHideTimeoutRef.current = null;
                        }
                        setIsBuyerTyping(data.isTyping);
                        // Auto-hide after 5 seconds
                        if (data.isTyping) {
                            autoHideTimeoutRef.current = setTimeout({
                                "ConversationView.useEffect.handleTypingEvent": ()=>{
                                    setIsBuyerTyping(false);
                                    hasScrolledForTypingRef.current = false;
                                    autoHideTimeoutRef.current = null;
                                }
                            }["ConversationView.useEffect.handleTypingEvent"], 5000);
                        } else {
                            hasScrolledForTypingRef.current = false;
                        }
                    }
                }
            }["ConversationView.useEffect.handleTypingEvent"];
            // Listen for new messages to clear typing indicator
            const handleNewMessage = {
                "ConversationView.useEffect.handleNewMessage": (data)=>{
                    // If we receive a message from the buyer, clear their typing indicator immediately
                    if (data.sender === activeThread && data.receiver === user.username) {
                        setIsBuyerTyping(false);
                        hasScrolledForTypingRef.current = false;
                        if (autoHideTimeoutRef.current) {
                            clearTimeout(autoHideTimeoutRef.current);
                            autoHideTimeoutRef.current = null;
                        }
                    }
                }
            }["ConversationView.useEffect.handleNewMessage"];
            const unsubscribeTyping = wsContext === null || wsContext === void 0 ? void 0 : wsContext.subscribe('message:typing', handleTypingEvent);
            const unsubscribeMessage = wsContext === null || wsContext === void 0 ? void 0 : wsContext.subscribe('message:new', handleNewMessage);
            return ({
                "ConversationView.useEffect": ()=>{
                    if (autoHideTimeoutRef.current) {
                        clearTimeout(autoHideTimeoutRef.current);
                        autoHideTimeoutRef.current = null;
                    }
                    unsubscribeTyping === null || unsubscribeTyping === void 0 ? void 0 : unsubscribeTyping();
                    unsubscribeMessage === null || unsubscribeMessage === void 0 ? void 0 : unsubscribeMessage();
                }
            })["ConversationView.useEffect"];
        }
    }["ConversationView.useEffect"], [
        activeThread,
        user,
        wsContext
    ]);
    // Track typing state changes for scroll management
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ConversationView.useEffect": ()=>{
            // If typing just started, reset the scroll flag and scroll to bottom once
            if (isBuyerTyping && !isTypingRef.current) {
                hasScrolledForTypingRef.current = false;
                userHasScrolledRef.current = false; // Reset user scroll flag for new typing session
                // Auto-scroll to bottom once when typing starts
                setTimeout({
                    "ConversationView.useEffect": ()=>{
                        if (messagesContainerRef.current && !hasScrolledForTypingRef.current) {
                            const container = messagesContainerRef.current;
                            container.scrollTop = container.scrollHeight - container.clientHeight;
                            hasScrolledForTypingRef.current = true;
                        }
                    }
                }["ConversationView.useEffect"], 350); // Wait for typing indicator to render
            }
            isTypingRef.current = isBuyerTyping;
        }
    }["ConversationView.useEffect"], [
        isBuyerTyping
    ]);
    // Enhanced message input controls with typing events
    const enhancedMessageInputControls = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ConversationView.useMemo[enhancedMessageInputControls]": ()=>{
            const handleTypingChange = {
                "ConversationView.useMemo[enhancedMessageInputControls].handleTypingChange": (value)=>{
                    messageInputControls.setReplyMessage(value);
                    // Emit typing event
                    if (wsContext && activeThread && user) {
                        const conversationId = getConversationKey(user.username, activeThread);
                        const now = Date.now();
                        // Clear existing timeout
                        if (typingTimeoutRef.current) {
                            clearTimeout(typingTimeoutRef.current);
                        }
                        // Send typing indicator
                        if (value.trim()) {
                            // Only send typing event if we haven't sent one recently (debounce)
                            // OR if we weren't typing before
                            if (!isTypingRef.current || now - lastTypingEmitRef.current > 1000) {
                                wsContext.sendMessage('message:typing', {
                                    conversationId,
                                    isTyping: true
                                });
                                lastTypingEmitRef.current = now;
                                isTypingRef.current = true;
                            }
                            // Stop typing after 3 seconds of inactivity
                            typingTimeoutRef.current = setTimeout({
                                "ConversationView.useMemo[enhancedMessageInputControls].handleTypingChange": ()=>{
                                    isTypingRef.current = false;
                                    wsContext.sendMessage('message:typing', {
                                        conversationId,
                                        isTyping: false
                                    });
                                }
                            }["ConversationView.useMemo[enhancedMessageInputControls].handleTypingChange"], 3000);
                        } else {
                            // If input is empty, stop typing immediately
                            if (isTypingRef.current) {
                                isTypingRef.current = false;
                                wsContext.sendMessage('message:typing', {
                                    conversationId,
                                    isTyping: false
                                });
                            }
                        }
                    }
                }
            }["ConversationView.useMemo[enhancedMessageInputControls].handleTypingChange"];
            // Stop typing when message is sent
            const stopTyping = {
                "ConversationView.useMemo[enhancedMessageInputControls].stopTyping": ()=>{
                    if (wsContext && activeThread && user && isTypingRef.current) {
                        const conversationId = getConversationKey(user.username, activeThread);
                        // Clear typing timeout
                        if (typingTimeoutRef.current) {
                            clearTimeout(typingTimeoutRef.current);
                            typingTimeoutRef.current = null;
                        }
                        // Send stop typing event
                        isTypingRef.current = false;
                        wsContext.sendMessage('message:typing', {
                            conversationId,
                            isTyping: false
                        });
                    }
                }
            }["ConversationView.useMemo[enhancedMessageInputControls].stopTyping"];
            // Wrap the original handleReply to stop typing first
            const handleReplyWithStopTyping = {
                "ConversationView.useMemo[enhancedMessageInputControls].handleReplyWithStopTyping": ()=>{
                    stopTyping();
                    messageInputControls.handleReply();
                }
            }["ConversationView.useMemo[enhancedMessageInputControls].handleReplyWithStopTyping"];
            return {
                ...messageInputControls,
                setReplyMessage: handleTypingChange,
                handleReply: handleReplyWithStopTyping
            };
        }
    }["ConversationView.useMemo[enhancedMessageInputControls]"], [
        messageInputControls,
        activeThread,
        user,
        wsContext
    ]);
    // Get messages for the active thread (use raw key for data access)
    const threadMessages = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ConversationView.useMemo[threadMessages]": ()=>{
            if ("TURBOPACK compile-time truthy", 1) {
                console.log('=== ConversationView threadMessages calculation ===');
                console.log('activeThread:', activeThread);
                console.log('threads keys:', Object.keys(threads));
            }
            if (!activeThread || typeof activeThread !== 'string') {
                if ("TURBOPACK compile-time truthy", 1) console.log('Invalid activeThread');
                return [];
            }
            if (!threads || !threads[activeThread]) {
                if ("TURBOPACK compile-time truthy", 1) console.log('No threads object or no messages for thread');
                return [];
            }
            const messages = Array.isArray(threads[activeThread]) ? threads[activeThread] : [];
            if ("TURBOPACK compile-time truthy", 1) console.log('Thread messages for', activeThread, ':', messages);
            // Process custom request messages with validation
            const processed = getLatestCustomRequestMessages(messages, sellerRequests);
            if ("TURBOPACK compile-time truthy", 1) console.log('Processed messages:', processed);
            return processed;
        }
    }["ConversationView.useMemo[threadMessages]"], [
        activeThread,
        threads,
        sellerRequests
    ]);
    // Auto-scroll to bottom when messages change
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ConversationView.useEffect": ()=>{
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        }
    }["ConversationView.useEffect"], [
        activeThread,
        threadMessages.length
    ]);
    var _buyerProfiles_activeThread1;
    const safeBuyerProfile = (_buyerProfiles_activeThread1 = buyerProfiles[activeThread]) !== null && _buyerProfiles_activeThread1 !== void 0 ? _buyerProfiles_activeThread1 : {
        pic: null,
        verified: false
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$seller$2f$messages$2f$ChatHeader$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                activeThread: activeThread,
                buyerProfile: safeBuyerProfile,
                isUserReported: isUserReported,
                isUserBlocked: isUserBlocked,
                onReport: handleReport,
                onBlockToggle: handleBlockToggle
            }, void 0, false, {
                fileName: "[project]/src/components/seller/messages/ConversationView.tsx",
                lineNumber: 362,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                ref: messagesContainerRef,
                className: "flex-1 overflow-y-auto p-4 bg-[#121212]",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-3xl mx-auto space-y-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$seller$2f$messages$2f$MessagesList$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            threadMessages: threadMessages,
                            sellerRequests: sellerRequests,
                            user: user,
                            activeThread: activeThread,
                            handleAccept: handleAccept,
                            handleDecline: handleDecline,
                            handleEditRequest: handleEditRequest,
                            handleEditSubmit: editRequestControls.handleEditSubmit,
                            handleMessageVisible: handleMessageVisible,
                            editRequestId: editRequestControls.editRequestId,
                            setEditRequestId: editRequestControls.setEditRequestId,
                            editPrice: editRequestControls.editPrice,
                            setEditPrice: editRequestControls.setEditPrice,
                            editTitle: editRequestControls.editTitle,
                            setEditTitle: editRequestControls.setEditTitle,
                            editMessage: editRequestControls.editMessage,
                            setEditMessage: editRequestControls.setEditMessage,
                            setPreviewImage: setPreviewImage
                        }, void 0, false, {
                            fileName: "[project]/src/components/seller/messages/ConversationView.tsx",
                            lineNumber: 374,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$messaging$2f$TypingIndicator$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            username: activeThread,
                            isTyping: isBuyerTyping,
                            userPic: (_buyerProfiles_activeThread = buyerProfiles[activeThread]) === null || _buyerProfiles_activeThread === void 0 ? void 0 : _buyerProfiles_activeThread.pic
                        }, void 0, false, {
                            fileName: "[project]/src/components/seller/messages/ConversationView.tsx",
                            lineNumber: 396,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            ref: messagesEndRef
                        }, void 0, false, {
                            fileName: "[project]/src/components/seller/messages/ConversationView.tsx",
                            lineNumber: 403,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/seller/messages/ConversationView.tsx",
                    lineNumber: 373,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/seller/messages/ConversationView.tsx",
                lineNumber: 372,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$seller$2f$messages$2f$MessageInputContainer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                isUserBlocked: isUserBlocked,
                onBlockToggle: handleBlockToggle,
                activeThread: activeThread,
                ...enhancedMessageInputControls
            }, void 0, false, {
                fileName: "[project]/src/components/seller/messages/ConversationView.tsx",
                lineNumber: 408,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
_s(ConversationView, "+/0TNtU65588AbuKyVPiyb3GdtA=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WebSocketContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWebSocket"]
    ];
});
_c = ConversationView;
// Helper function to process custom request messages with validation
function getLatestCustomRequestMessages(messages, requests) {
    if (!Array.isArray(messages)) {
        if ("TURBOPACK compile-time truthy", 1) console.warn('Invalid messages array provided to getLatestCustomRequestMessages');
        return [];
    }
    const seen = new Set();
    const result = [];
    for(let i = messages.length - 1; i >= 0; i--){
        const msg = messages[i];
        if (!msg || typeof msg !== 'object') continue;
        if (msg.type === 'customRequest' && msg.meta && msg.meta.id) {
            const requestId = String(msg.meta.id);
            if (!seen.has(requestId)) {
                seen.add(requestId);
                result.unshift(msg);
            }
        } else {
            result.unshift(msg);
        }
    }
    return result;
}
var _c;
__turbopack_context__.k.register(_c, "ConversationView");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/seller/messages/EmptyState.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": ()=>EmptyState
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$square$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageSquare$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/message-square.js [app-client] (ecmascript) <export default as MessageSquare>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$dollar$2d$sign$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__DollarSign$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/dollar-sign.js [app-client] (ecmascript) <export default as DollarSign>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/star.js [app-client] (ecmascript) <export default as Star>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trending-up.js [app-client] (ecmascript) <export default as TrendingUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Package$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/package.js [app-client] (ecmascript) <export default as Package>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shield.js [app-client] (ecmascript) <export default as Shield>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$camera$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Camera$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/camera.js [app-client] (ecmascript) <export default as Camera>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/clock.js [app-client] (ecmascript) <export default as Clock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
function EmptyState() {
    _s();
    const [messageCount, setMessageCount] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useState(0);
    const [showCounter, setShowCounter] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useState(false);
    const countIntervalRef = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useRef(null);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useEffect({
        "EmptyState.useEffect": ()=>{
            const animateCounter = {
                "EmptyState.useEffect.animateCounter": ()=>{
                    // Show counter
                    setShowCounter(true);
                    setMessageCount(0);
                    // Count up animation
                    let count = 0;
                    if (countIntervalRef.current) clearInterval(countIntervalRef.current);
                    countIntervalRef.current = setInterval({
                        "EmptyState.useEffect.animateCounter": ()=>{
                            count++;
                            setMessageCount(count);
                            if (count >= 5) {
                                if (countIntervalRef.current) {
                                    clearInterval(countIntervalRef.current);
                                    countIntervalRef.current = null;
                                }
                                // Hide counter after a brief pause
                                setTimeout({
                                    "EmptyState.useEffect.animateCounter": ()=>{
                                        setShowCounter(false);
                                        setMessageCount(0);
                                    }
                                }["EmptyState.useEffect.animateCounter"], 1000);
                            }
                        }
                    }["EmptyState.useEffect.animateCounter"], 1000); // 1 second per count
                }
            }["EmptyState.useEffect.animateCounter"];
            // Initial animation after a short delay
            const initialTimeout = setTimeout(animateCounter, 500);
            // Repeat animation every 8 seconds (5 seconds counting + 1 second pause + 2 seconds wait)
            const repeatInterval = setInterval(animateCounter, 8000);
            return ({
                "EmptyState.useEffect": ()=>{
                    clearTimeout(initialTimeout);
                    clearInterval(repeatInterval);
                    if (countIntervalRef.current) {
                        clearInterval(countIntervalRef.current);
                        countIntervalRef.current = null;
                    }
                }
            })["EmptyState.useEffect"];
        }
    }["EmptyState.useEffect"], []);
    const tips = [
        {
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {
                className: "w-4 h-4 text-green-500"
            }, void 0, false, {
                fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
                lineNumber: 59,
                columnNumber: 13
            }, this),
            text: 'Respond to messages quickly to boost your rating'
        },
        {
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$camera$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Camera$3e$__["Camera"], {
                className: "w-4 h-4 text-blue-500"
            }, void 0, false, {
                fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
                lineNumber: 63,
                columnNumber: 13
            }, this),
            text: 'Send clear photos when discussing custom orders'
        },
        {
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$dollar$2d$sign$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__DollarSign$3e$__["DollarSign"], {
                className: "w-4 h-4 text-yellow-500"
            }, void 0, false, {
                fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
                lineNumber: 67,
                columnNumber: 13
            }, this),
            text: 'Set competitive prices for custom requests'
        },
        {
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__["Shield"], {
                className: "w-4 h-4 text-purple-500"
            }, void 0, false, {
                fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
                lineNumber: 71,
                columnNumber: 13
            }, this),
            text: 'Get verified to attract more buyers'
        }
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex-1 flex items-center justify-center bg-[#121212] p-8",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "text-center max-w-md",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative mb-6",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-24 h-24 bg-gradient-to-br from-[#ff950e]/20 to-[#ff950e]/5 rounded-full flex items-center justify-center mx-auto animate-pulse",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-20 h-20 bg-gradient-to-br from-[#ff950e]/30 to-[#ff950e]/10 rounded-full flex items-center justify-center relative",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$square$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageSquare$3e$__["MessageSquare"], {
                                    className: "w-12 h-12 text-[#ff950e]"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
                                    lineNumber: 83,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "absolute top-2 right-2 bg-red-500 text-white rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 font-bold text-xs shadow-lg transition-all duration-300 ".concat(showCounter ? 'opacity-100 scale-100' : 'opacity-0 scale-0'),
                                    children: messageCount
                                }, void 0, false, {
                                    fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
                                    lineNumber: 86,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
                            lineNumber: 82,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
                        lineNumber: 81,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
                    lineNumber: 80,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                    className: "text-3xl font-bold text-white mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent",
                    children: "Ready for Messages"
                }, void 0, false, {
                    fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
                    lineNumber: 97,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-gray-400 mb-8 text-lg leading-relaxed",
                    children: "When buyers message you, they'll appear here. Keep your notifications on to never miss a sale!"
                }, void 0, false, {
                    fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
                    lineNumber: 101,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-3 gap-4 mb-8",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-[#1a1a1a] rounded-lg p-3 border border-gray-800",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Package$3e$__["Package"], {
                                    className: "w-5 h-5 text-[#ff950e] mx-auto mb-1"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
                                    lineNumber: 108,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-xs text-gray-400",
                                    children: "Active Listings"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
                                    lineNumber: 109,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-lg font-bold text-white",
                                    children: "--"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
                                    lineNumber: 110,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
                            lineNumber: 107,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-[#1a1a1a] rounded-lg p-3 border border-gray-800",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__["Star"], {
                                    className: "w-5 h-5 text-yellow-500 mx-auto mb-1"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
                                    lineNumber: 113,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-xs text-gray-400",
                                    children: "Avg Rating"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
                                    lineNumber: 114,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-lg font-bold text-white",
                                    children: "--"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
                                    lineNumber: 115,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
                            lineNumber: 112,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-[#1a1a1a] rounded-lg p-3 border border-gray-800",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"], {
                                    className: "w-5 h-5 text-green-500 mx-auto mb-1"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
                                    lineNumber: 118,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-xs text-gray-400",
                                    children: "Response Time"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
                                    lineNumber: 119,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-lg font-bold text-white",
                                    children: "--"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
                                    lineNumber: 120,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
                            lineNumber: 117,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
                    lineNumber: 106,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    href: "/sellers/my-listings",
                    className: "group inline-flex items-center gap-3 bg-gradient-to-r from-[#ff950e] to-[#e88800] text-white px-8 py-4 rounded-xl font-semibold hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 shadow-lg",
                    style: {
                        color: '#ffffff !important',
                        textDecoration: 'none'
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            style: {
                                color: '#ffffff'
                            },
                            className: "text-lg",
                            children: "Create a Listing"
                        }, void 0, false, {
                            fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
                            lineNumber: 133,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Package$3e$__["Package"], {
                            size: 20,
                            style: {
                                color: '#ffffff'
                            },
                            className: "group-hover:rotate-12 transition-transform"
                        }, void 0, false, {
                            fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
                            lineNumber: 136,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
                    lineNumber: 125,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-12 bg-[#1a1a1a] rounded-xl p-6 border border-gray-800",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm font-semibold text-white mb-4 flex items-center justify-center gap-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__["Star"], {
                                    className: "w-4 h-4 text-[#ff950e]"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
                                    lineNumber: 142,
                                    columnNumber: 13
                                }, this),
                                "Pro Seller Tips"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
                            lineNumber: 141,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-3",
                            children: tips.map((tip, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-start gap-3 text-left group hover:bg-[#222] p-2 rounded-lg transition-colors",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex-shrink-0 mt-0.5",
                                            children: tip.icon
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
                                            lineNumber: 151,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-sm text-gray-400 group-hover:text-gray-300 transition-colors",
                                            children: tip.text
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
                                            lineNumber: 152,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, index, true, {
                                    fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
                                    lineNumber: 147,
                                    columnNumber: 15
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
                            lineNumber: 145,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
                    lineNumber: 140,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-8 flex items-center justify-center gap-4 text-sm",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            href: "/sellers/profile",
                            className: "text-[#ff950e] hover:text-[#e88800] font-medium transition-colors",
                            style: {
                                color: '#ff950e !important'
                            },
                            children: "Complete Your Profile"
                        }, void 0, false, {
                            fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
                            lineNumber: 160,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-gray-600",
                            children: "•"
                        }, void 0, false, {
                            fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
                            lineNumber: 167,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            href: "/sellers/verify",
                            className: "text-[#ff950e] hover:text-[#e88800] font-medium transition-colors",
                            style: {
                                color: '#ff950e !important'
                            },
                            children: "Get Verified"
                        }, void 0, false, {
                            fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
                            lineNumber: 168,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
                    lineNumber: 159,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
            lineNumber: 78,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/seller/messages/EmptyState.tsx",
        lineNumber: 77,
        columnNumber: 5
    }, this);
}
_s(EmptyState, "BYToLDe2WFwXzVztboMgmFO8ZYI=");
_c = EmptyState;
var _c;
__turbopack_context__.k.register(_c, "EmptyState");
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
"[project]/src/app/sellers/messages/page.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/app/sellers/messages/page.tsx
__turbopack_context__.s({
    "default": ()=>SellerMessagesPage
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$RequireAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/RequireAuth.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$BanCheck$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/BanCheck.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useSellerMessages$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useSellerMessages.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$seller$2f$messages$2f$ThreadsSidebar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/seller/messages/ThreadsSidebar.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$seller$2f$messages$2f$ConversationView$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/seller/messages/ConversationView.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$seller$2f$messages$2f$EmptyState$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/seller/messages/EmptyState.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$messaging$2f$ImagePreviewModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/messaging/ImagePreviewModal.tsx [app-client] (ecmascript)");
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
function SellerMessagesPage() {
    _s();
    const { // Auth
    user, isAdmin, // Messages & threads
    threads, unreadCounts, uiUnreadCounts, lastMessages, buyerProfiles, totalUnreadCount, activeThread, setActiveThread, // UI State
    previewImage, setPreviewImage, searchQuery, setSearchQuery, filterBy, setFilterBy, observerReadMessages, setObserverReadMessages, // Message input
    replyMessage, setReplyMessage, selectedImage, setSelectedImage, isImageLoading, setIsImageLoading, imageError, setImageError, showEmojiPicker, setShowEmojiPicker, recentEmojis, // Custom requests
    sellerRequests, editRequestId, setEditRequestId, editPrice, setEditPrice, editTitle, setEditTitle, editMessage, setEditMessage, // Actions
    handleReply, handleBlockToggle, handleReport, handleAccept, handleDecline, handleEditRequest, handleEditSubmit, handleImageSelect, handleMessageVisible, handleEmojiClick, // Status
    isUserBlocked, isUserReported } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useSellerMessages$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSellerMessages"])();
    if (!user) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$BanCheck$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$RequireAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                role: "seller",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "h-screen bg-black flex items-center justify-center",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-white",
                        children: "Loading..."
                    }, void 0, false, {
                        fileName: "[project]/src/app/sellers/messages/page.tsx",
                        lineNumber: 85,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/app/sellers/messages/page.tsx",
                    lineNumber: 84,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/sellers/messages/page.tsx",
                lineNumber: 83,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/sellers/messages/page.tsx",
            lineNumber: 82,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$BanCheck$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$RequireAuth$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
            role: "seller",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "py-3 bg-black"
                }, void 0, false, {
                    fileName: "[project]/src/app/sellers/messages/page.tsx",
                    lineNumber: 96,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "h-screen bg-black flex flex-col overflow-hidden",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex-1 flex flex-col md:flex-row max-w-6xl mx-auto w-full bg-[#121212] rounded-lg shadow-lg overflow-hidden",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$seller$2f$messages$2f$ThreadsSidebar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    isAdmin: isAdmin,
                                    threads: threads,
                                    lastMessages: lastMessages,
                                    buyerProfiles: buyerProfiles,
                                    totalUnreadCount: totalUnreadCount,
                                    uiUnreadCounts: uiUnreadCounts,
                                    activeThread: activeThread,
                                    setActiveThread: setActiveThread,
                                    searchQuery: searchQuery,
                                    setSearchQuery: setSearchQuery,
                                    filterBy: filterBy,
                                    setFilterBy: setFilterBy,
                                    setObserverReadMessages: setObserverReadMessages
                                }, void 0, false, {
                                    fileName: "[project]/src/app/sellers/messages/page.tsx",
                                    lineNumber: 101,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "w-full md:w-2/3 flex flex-col bg-[#121212]",
                                    children: activeThread ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$seller$2f$messages$2f$ConversationView$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        activeThread: activeThread,
                                        threads: threads,
                                        buyerProfiles: buyerProfiles,
                                        sellerRequests: sellerRequests,
                                        isUserBlocked: isUserBlocked,
                                        isUserReported: isUserReported,
                                        handleReport: handleReport,
                                        handleBlockToggle: handleBlockToggle,
                                        user: user,
                                        messageInputControls: {
                                            replyMessage,
                                            setReplyMessage,
                                            selectedImage,
                                            setSelectedImage,
                                            isImageLoading,
                                            setIsImageLoading,
                                            imageError,
                                            setImageError,
                                            showEmojiPicker,
                                            setShowEmojiPicker,
                                            recentEmojis,
                                            handleReply,
                                            handleEmojiClick,
                                            handleImageSelect
                                        },
                                        editRequestControls: {
                                            editRequestId,
                                            setEditRequestId,
                                            editPrice,
                                            setEditPrice,
                                            editTitle,
                                            setEditTitle,
                                            editMessage,
                                            setEditMessage,
                                            handleEditSubmit
                                        },
                                        handleAccept: handleAccept,
                                        handleDecline: handleDecline,
                                        handleEditRequest: handleEditRequest,
                                        handleMessageVisible: handleMessageVisible,
                                        setPreviewImage: setPreviewImage
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/sellers/messages/page.tsx",
                                        lineNumber: 120,
                                        columnNumber: 17
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$seller$2f$messages$2f$EmptyState$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                                        fileName: "[project]/src/app/sellers/messages/page.tsx",
                                        lineNumber: 164,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/sellers/messages/page.tsx",
                                    lineNumber: 118,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/sellers/messages/page.tsx",
                            lineNumber: 99,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "py-6 bg-black"
                        }, void 0, false, {
                            fileName: "[project]/src/app/sellers/messages/page.tsx",
                            lineNumber: 170,
                            columnNumber: 11
                        }, this),
                        previewImage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$messaging$2f$ImagePreviewModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            imageUrl: previewImage,
                            isOpen: true,
                            onClose: ()=>setPreviewImage(null)
                        }, void 0, false, {
                            fileName: "[project]/src/app/sellers/messages/page.tsx",
                            lineNumber: 174,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/sellers/messages/page.tsx",
                    lineNumber: 98,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/app/sellers/messages/page.tsx",
            lineNumber: 94,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/sellers/messages/page.tsx",
        lineNumber: 93,
        columnNumber: 5
    }, this);
}
_s(SellerMessagesPage, "whHfBwzej2zmnh/KD3ewVaMv7E0=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useSellerMessages$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSellerMessages"]
    ];
});
_c = SellerMessagesPage;
var _c;
__turbopack_context__.k.register(_c, "SellerMessagesPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=src_b08adf80._.js.map