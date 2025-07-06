// src/components/ui/SecureMessageDisplay.tsx

import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { sanitizeHtml, sanitizeMarkdown } from '@/utils/security/sanitization';

interface SecureMessageDisplayProps {
  content: string;
  allowBasicFormatting?: boolean;
  allowMarkdown?: boolean;
  className?: string;
  maxLength?: number;
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

  // For content with HTML, use dangerouslySetInnerHTML safely
  if (allowBasicFormatting || allowMarkdown) {
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
    );
  }

  // For plain text, just render normally
  return <div className={className}>{sanitizedContent}</div>;
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
  fallbackSrc = '/placeholder-image.png',
  onError,
  onClick,
}) => {
  const [imageSrc, setImageSrc] = React.useState(src);
  const [hasError, setHasError] = React.useState(false);

  const handleError = () => {
    if (!hasError) {
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
