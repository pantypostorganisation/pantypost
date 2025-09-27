import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from "next";

// Content Security Policy - Enhanced for production and network access
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' *.google-analytics.com *.googletagmanager.com *.sentry.io *.sentry-cdn.com https://www.googletagmanager.com https://www.google-analytics.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' blob: data: https: *.cloudinary.com ${process.env.NODE_ENV === 'development'
    ? 'http://localhost:* http://127.0.0.1:* http://192.168.*:* http://10.*:*'
    : ''};
  media-src 'self' https://res.cloudinary.com;
  connect-src 'self' *.google-analytics.com *.googletagmanager.com https://api.pantypost.com wss://api.pantypost.com *.sentry.io https://vitals.vercel-insights.com https://api.cloudinary.com https://res.cloudinary.com ${process.env.NODE_ENV === 'development'
    ? 'http://localhost:* ws://localhost:* http://192.168.*:* ws://192.168.*:* http://10.*:* ws://10.*:*'
    : ''};
  font-src 'self' https://fonts.gstatic.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  block-all-mixed-content;
  worker-src 'self' blob:;
  manifest-src 'self';
  ${process.env.NODE_ENV === 'production' ? 'upgrade-insecure-requests;' : ''}
`.replace(/\s{2,}/g, ' ').trim();

const securityHeaders = process.env.NODE_ENV === 'development'
  ? [
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    ]
  : [
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
      { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
      { key: 'Cross-Origin-Embedder-Policy', value: 'unsafe-none' },
      { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
    ];

const performanceHeaders = [
  { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
];

const nextConfig: NextConfig = {
  // ✅ use default Next.js build folder so PM2 + next start work
  distDir: '.next',

  output: 'standalone',
  poweredByHeader: false,
  compress: true,

  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: '*.cloudinary.com', port: '', pathname: '/**' },
      { protocol: 'http', hostname: 'localhost', port: '5000', pathname: '/uploads/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '5000', pathname: '/uploads/**' },
      { protocol: 'http', hostname: '192.168.*', port: '5000', pathname: '/uploads/**' },
      { protocol: 'http', hostname: '10.*', port: '5000', pathname: '/uploads/**' },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  turbopack: {
    rules: {
      '*.svg': { loaders: ['@svgr/webpack'], as: '*.js' },
    },
  },

  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'framer-motion', 'react-icons'],
  },

  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/_next/static/:path*', headers: performanceHeaders },
      { source: '/images/:path*', headers: performanceHeaders },
      { source: '/icons/:path*', headers: performanceHeaders },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }],
      },
    ];
  },

  async redirects() {
    return [
      { source: '/home', destination: '/', permanent: true },
      { source: '/shop', destination: '/browse', permanent: true },
    ];
  },

  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    return process.env.NODE_ENV === 'development'
      ? [
          { source: '/api/:path*', destination: `${backendUrl}/api/:path*` },
          { source: '/uploads/:path*', destination: `${backendUrl}/uploads/:path*` },
          { source: '/sitemap.xml', destination: '/api/sitemap' },
        ]
      : [{ source: '/sitemap.xml', destination: '/api/sitemap' }];
  },

  webpack: (config, { dev }) => {
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        reportFilename: dev ? './analyze/client-dev.html' : './analyze/client.html',
        openAnalyzer: false,
      }));
    }

    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              maxSize: 200000,
            },
          },
        },
      };
    }

    return config;
  },

  env: { NEXT_PUBLIC_BUILD_TIME: new Date().toISOString() },
};

const sentryOptions = {
  silent: true,
  hideSourceMaps: true,
  widenClientFileUpload: true,
  transpileClientSDK: true,
  tunnelRoute: "/monitoring",
  disableLogger: true,
  automaticVercelMonitors: true,
};

export default process.env.NODE_ENV === 'production' &&
  process.env.NEXT_PUBLIC_ENABLE_ERROR_TRACKING === 'true'
  ? withSentryConfig(nextConfig, sentryOptions)
  : nextConfig;
