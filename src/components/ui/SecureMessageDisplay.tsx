// src/components/ui/SecureMessageDisplay.tsx

import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { sanitizeHtml, sanitizeMarkdown } from '@/utils/security/sanitization';

// Simple gray placeholder as a data URL (1x1 pixel stretched)
// This is a tiny base64 encoded transparent PNG that won't cause 404 errors
const DEFAULT_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0yMDAgMTIwQzE3Ny45MDkgMTIwIDE2MCAxMzcuOTA5IDE2MCAxNjBDMTYwIDE4Mi4wOTEgMTc3LjkwOSAyMDAgMjAwIDIwMEMyMjIuMDkxIDIwMCAyNDAgMTgyLjA5MSAyNDAgMTYwQzI0MCAxMzcuOTA5IDIyMi4wOTEgMTIwIDIwMCAxMjBaTTIwMCAxODBDMTg4Ljk1NCAxODAgMTgwIDE3MS4wNDYgMTgwIDE2MEMxODAgMTQ4Ljk1NCAxODguOTU0IDE0MCAyMDAgMTQwQzIxMS4wNDYgMTQwIDIyMCAxNDguOTU0IDIyMCAxNjBDMjIwIDE3MS4wNDYgMjExLjA0NiAxODAgMjAwIDE4MFoiIGZpbGw9IiM2QjcyODAiLz4KPHBhdGggZD0iTTI4MCAyNDBIMTIwVjI2MEgyODBWMjQwWiIgZmlsbD0iIzZCNzI4MCIvPgo8L3N2Zz4=';

interface SecureMessageDisplayProps {
  content: string;
  allowBasicFormatting?: boolean;
  allowMarkdown?: boolean;
  className?: string;
  maxLength?: number;
  as?: 'div' | 'span' | 'p';
}

/**
 * Secure component for displaying user-generated content
 * Prevents XSS attacks while allowing safe formatting
 */
export const SecureMessageDisplay: React.FC<SecureMessageDisplayProps> = ({
  content,
  allowBasicFormatting = true,
  allowMarkdown = false,
  className = '',
  maxLength,
  as: Component = 'span', // Changed default from 'div' to 'span' for inline usage
}) => {
  const sanitizedContent = useMemo(() => {
    if (!content) return '';

    let processed = content;

    // Truncate if needed
    if (maxLength && processed.length > maxLength) {
      processed = processed.substring(0, maxLength) + '...';
    }

    // Apply appropriate sanitization
    if (allowMarkdown) {
      processed = sanitizeMarkdown(processed);
    } else if (allowBasicFormatting) {
      processed = sanitizeHtml(processed);
    } else {
      // Strip all HTML
      processed = DOMPurify.sanitize(processed, { ALLOWED_TAGS: [] });
    }

    return processed;
  }, [content, allowBasicFormatting, allowMarkdown, maxLength]);

  if (!sanitizedContent) {
    return null;
  }

  // For inline usage or when component is span, never use dangerouslySetInnerHTML
  const isInline = Component === 'span';
  
  // Only use dangerouslySetInnerHTML for block-level elements with formatting
  if ((allowBasicFormatting || allowMarkdown) && !isInline) {
    return (
      <Component
        className={className}
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
    );
  }

  // For plain text or inline content, just render normally
  return <Component className={className}>{sanitizedContent}</Component>;
};

/**
 * Secure link component that validates URLs
 */
interface SecureLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export const SecureLink: React.FC<SecureLinkProps> = ({
  href,
  children,
  className = '',
  external = true,
  onClick,
}) => {
  const sanitizedHref = useMemo(() => {
    if (!href) return '#';

    // Check for dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    const lowerHref = href.toLowerCase().trim();
    
    if (dangerousProtocols.some(protocol => lowerHref.startsWith(protocol))) {
      console.warn('Blocked dangerous URL:', href);
      return '#';
    }

    // For relative URLs, ensure they start with /
    if (!lowerHref.startsWith('http://') && !lowerHref.startsWith('https://')) {
      return href.startsWith('/') ? href : `/${href}`;
    }

    return href;
  }, [href]);

  const handleClick = (e: React.MouseEvent) => {
    if (sanitizedHref === '#') {
      e.preventDefault();
    }
    onClick?.(e);
  };

  return (
    <a
      href={sanitizedHref}
      className={className}
      onClick={handleClick}
      {...(external && sanitizedHref !== '#' ? {
        target: '_blank',
        rel: 'noopener noreferrer'
      } : {})}
    >
      {children}
    </a>
  );
};

/**
 * Secure image component with error handling
 */
interface SecureImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  onError?: () => void;
  onClick?: (e: React.MouseEvent<HTMLImageElement>) => void;
}

export const SecureImage: React.FC<SecureImageProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc = DEFAULT_PLACEHOLDER, // Use data URL instead of file reference
  onError,
  onClick,
}) => {
  const [imageSrc, setImageSrc] = React.useState(src);
  const [hasError, setHasError] = React.useState(false);

  // Reset state when src prop changes
  React.useEffect(() => {
    setImageSrc(src);
    setHasError(false);
  }, [src]);

  const handleError = () => {
    if (!hasError && imageSrc !== fallbackSrc) {
      setHasError(true);
      setImageSrc(fallbackSrc);
      onError?.();
    }
  };

  // Validate image URL
  const isValidImageUrl = useMemo(() => {
    if (!imageSrc) return false;
    
    const lower = imageSrc.toLowerCase();
    
    // Check for data URLs (allowed for images)
    if (lower.startsWith('data:image/')) {
      return true;
    }
    
    // Check for dangerous protocols
    if (lower.startsWith('javascript:') || lower.startsWith('vbscript:')) {
      return false;
    }
    
    return true;
  }, [imageSrc]);

  if (!isValidImageUrl) {
    return (
      <div className={`${className} bg-gray-800 flex items-center justify-center`}>
        <span className="text-gray-500">Invalid image</span>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={handleError}
      onClick={onClick}
      loading="lazy"
    />
  );
};

/**
 * Hook for sanitizing form inputs in real-time
 */
export function useSecureInput(
  initialValue: string = '',
  sanitizer?: (value: string) => string
) {
  const [value, setValue] = React.useState(initialValue);
  const [rawValue, setRawValue] = React.useState(initialValue);

  const handleChange = React.useCallback((newValue: string) => {
    setRawValue(newValue);
    
    const sanitized = sanitizer ? sanitizer(newValue) : newValue;
    setValue(sanitized);
  }, [sanitizer]);

  return {
    value,
    rawValue,
    setValue: handleChange,
    reset: () => {
      setValue(initialValue);
      setRawValue(initialValue);
    },
  };
}
