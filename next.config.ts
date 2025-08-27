// next.config.ts
import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from "next";

// Content Security Policy - Enhanced for production
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' *.google-analytics.com *.googletagmanager.com *.sentry.io *.sentry-cdn.com https://www.googletagmanager.com https://www.google-analytics.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' blob: data: https: *.cloudinary.com ${process.env.NODE_ENV === 'development' ? 'http://localhost:* http://127.0.0.1:* http://192.168.*:*' : ''};
  media-src 'self' https://res.cloudinary.com;
  connect-src 'self' *.google-analytics.com *.googletagmanager.com https://api.pantypost.com wss://api.pantypost.com *.sentry.io https://vitals.vercel-insights.com https://api.cloudinary.com https://res.cloudinary.com ${process.env.NODE_ENV === 'development' ? 'http://localhost:5000 ws://localhost:5000' : ''};
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

// Enhanced security headers
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()'
  },
  {
    key: 'X-Permitted-Cross-Domain-Policies',
    value: 'none'
  },
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin'
  },
  {
    key: 'Cross-Origin-Resource-Policy',
    value: 'cross-origin'
  },
  {
    key: 'Cross-Origin-Embedder-Policy',
    value: 'unsafe-none'
  },
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy
  }
];

// Performance optimization headers
const performanceHeaders = [
  {
    key: 'Cache-Control',
    value: 'public, max-age=31536000, immutable'
  }
];

const nextConfig: NextConfig = {
  // Build output configuration
  output: 'standalone',
  
  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Enhanced image configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      // Add localhost for development
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '5000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.*',
        port: '5000',
        pathname: '/uploads/**',
      }
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Turbopack configuration (moved from experimental)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // Experimental features for performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'framer-motion', 'react-icons'],
  },
  
  // Security and performance headers
  async headers() {
    return [
      // Apply security headers to all routes
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      // Apply performance headers to static assets
      {
        source: '/_next/static/:path*',
        headers: performanceHeaders,
      },
      {
        source: '/images/:path*',
        headers: performanceHeaders,
      },
      {
        source: '/icons/:path*',
        headers: performanceHeaders,
      },
      // Service Worker headers
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate'
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/'
          }
        ]
      },
      // Manifest headers
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400'
          }
        ]
      }
    ];
  },
  
  // Enhanced redirects for SEO
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/shop',
        destination: '/browse',
        permanent: true,
      }
    ];
  },
  
  // Enhanced rewrites for clean URLs
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap',
      },
    ];
  },
  
  // Bundle analyzer and webpack optimizations
  webpack: (config, { isServer, dev }) => {
    // Bundle analyzer
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: isServer
            ? '../analyze/server.html'
            : './analyze/client.html',
          openAnalyzer: false,
        })
      );
    }
    
    // Performance optimizations
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
  
  // Environment variables for build optimization
  env: {
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
};

// Sentry configuration - enable in production when ready
const sentryOptions = {
  silent: true,
  hideSourceMaps: true,
  widenClientFileUpload: true,
  transpileClientSDK: true,
  tunnelRoute: "/monitoring",
  disableLogger: true,
  automaticVercelMonitors: true,
};

// Export configuration based on environment
export default process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_ENABLE_ERROR_TRACKING === 'true'
  ? withSentryConfig(nextConfig, sentryOptions)
  : nextConfig;