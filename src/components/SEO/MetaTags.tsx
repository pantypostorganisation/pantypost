// src/components/SEO/MetaTags.tsx

import Head from 'next/head';
import { usePathname } from 'next/navigation';

interface MetaTagsProps {
  title: string;
  description: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
  price?: {
    amount: number;
    currency: string;
  };
}

export function MetaTags({
  title,
  description,
  image = '/og-image.png',
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  tags,
  price
}: MetaTagsProps) {
  const pathname = usePathname();
  const url = `${process.env.NEXT_PUBLIC_APP_URL}${pathname}`;

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title} | PantyPost</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="canonical" href={url} />

      {/* Open Graph Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="PantyPost" />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Article specific tags */}
      {type === 'article' && (
        <>
          {author && <meta property="article:author" content={author} />}
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {tags?.map(tag => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* Product specific tags */}
      {type === 'product' && price && (
        <>
          <meta property="product:price:amount" content={price.amount.toString()} />
          <meta property="product:price:currency" content={price.currency} />
        </>
      )}

      {/* Additional SEO tags */}
      <meta name="robots" content="index,follow" />
      <meta name="googlebot" content="index,follow" />
      <meta httpEquiv="x-ua-compatible" content="ie=edge" />
    </Head>
  );
}