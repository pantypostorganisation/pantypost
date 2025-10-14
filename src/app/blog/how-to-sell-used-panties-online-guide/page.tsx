// src/app/blog/how-to-sell-used-panties-online-guide/page.tsx
'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function SellingGuidePage() {
  useEffect(() => {
    // Set page title
    document.title = 'How to Sell Used Panties Online - Complete 2025 Seller Guide';
    
    // Set meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Learn how to start selling used panties online safely in 2025. Complete guide covering verification, pricing, shipping, and growing your income on PantyPost.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Learn how to start selling used panties online safely in 2025. Complete guide covering verification, pricing, shipping, and growing your income on PantyPost.';
      document.head.appendChild(meta);
    }

    // Set meta keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', 'sell used panties, how to sell used panties, selling panties online, panty seller guide, make money selling panties');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'keywords';
      meta.content = 'sell used panties, how to sell used panties, selling panties online, panty seller guide, make money selling panties';
      document.head.appendChild(meta);
    }

    // Set Open Graph tags
    const updateOrCreateOgTag = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (tag) {
        tag.setAttribute('content', content);
      } else {
        const meta = document.createElement('meta');
        meta.setAttribute('property', property);
        meta.content = content;
        document.head.appendChild(meta);
      }
    };

    updateOrCreateOgTag('og:title', 'How to Sell Used Panties Online - Complete Safety Guide');
    updateOrCreateOgTag('og:description', 'Complete guide to selling used panties safely online in 2025. Verification, pricing strategies, and income tips.');
    updateOrCreateOgTag('og:type', 'article');
  }, []);

  return (
    <article className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gradient-to-b from-[#1a1a1a] to-black py-12 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/" className="text-[#ff950e] hover:underline text-sm mb-4 inline-block">
            ← Back to Panty Post
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            How to Sell Used Panties Online in 2025
          </h1>
          <p className="text-gray-400 text-lg">
            The complete guide to starting, growing, and succeeding as a panty seller
          </p>
          <div className="flex gap-4 mt-6 text-sm text-gray-500">
            <span>📅 Published: January 15, 2025</span>
            <span>⏱️ 15 min read</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        
        {/* Introduction */}
        <section className="mb-12">
          <p className="text-lg text-gray-300 leading-relaxed mb-6">
            Selling used panties online has become a legitimate way for thousands of sellers to earn extra income—or even build a full-time business. Whether you're looking to make a few hundred dollars per month or thousands, this comprehensive guide will teach you everything you need to know about selling safely and successfully on <strong className="text-[#ff950e]">Panty Post</strong> (also known as PantyPost).
          </p>
          <p className="text-lg text-gray-300 leading-relaxed">
            This guide covers verification requirements, pricing strategies, shipping best practices, building a customer base, and growing your income through PantyPost's tier system and premium features.
          </p>
        </section>

        {/* Table of Contents */}
        <nav className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 mb-12">
          <h2 className="text-xl font-bold mb-4 text-[#ff950e]">Table of Contents</h2>
          <ol className="space-y-2 text-gray-300">
            <li><a href="#getting-started" className="hover:text-[#ff950e]">1. Getting Started: Is This Right for You?</a></li>
            <li><a href="#creating-account" className="hover:text-[#ff950e]">2. Creating Your Seller Account</a></li>
            <li><a href="#verification" className="hover:text-[#ff950e]">3. Seller Verification Process</a></li>
            <li><a href="#first-listing" className="hover:text-[#ff950e]">4. Creating Your First Listing</a></li>
            <li><a href="#pricing" className="hover:text-[#ff950e]">5. Pricing Strategy Guide</a></li>
            <li><a href="#photography" className="hover:text-[#ff950e]">6. Photography Tips</a></li>
            <li><a href="#shipping" className="hover:text-[#ff950e]">7. Shipping & Packaging</a></li>
            <li><a href="#customer-service" className="hover:text-[#ff950e]">8. Customer Service & Messaging</a></li>
            <li><a href="#subscriptions" className="hover:text-[#ff950e]">9. Building Recurring Income with Subscriptions</a></li>
            <li><a href="#tier-system" className="hover:text-[#ff950e]">10. Growing Through the Tier System</a></li>
            <li><a href="#safety" className="hover:text-[#ff950e]">11. Safety & Privacy</a></li>
            <li><a href="#taxes" className="hover:text-[#ff950e]">12. Taxes & Legal Considerations</a></li>
            <li><a href="#faq" className="hover:text-[#ff950e]">13. Frequently Asked Questions</a></li>
          </ol>
        </nav>

        {/* Section 1 */}
        <section id="getting-started" className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-white">Getting Started: Is This Right for You?</h2>
          
          <p className="text-gray-300 leading-relaxed mb-6">
            Before diving in, it's important to understand what selling used panties online involves and whether it aligns with your goals and comfort level.
          </p>

          <h3 className="text-2xl font-semibold mb-4 text-white">What to Expect</h3>
          
          <ul className="space-y-3 text-gray-300 mb-6">
            <li className="flex items-start">
              <span className="text-[#ff950e] mr-2">✓</span>
              <span><strong>Flexible income:</strong> Work on your own schedule and set your own prices</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#ff950e] mr-2">✓</span>
              <span><strong>Low startup costs:</strong> You likely already have what you need to get started</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#ff950e] mr-2">✓</span>
              <span><strong>Complete anonymity:</strong> You control what information you share</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#ff950e] mr-2">✓</span>
              <span><strong>Growing demand:</strong> The market continues to expand with serious buyers</span>
            </li>
          </ul>

          <div className="bg-[#1a1a1a] border-l-4 border-[#ff950e] p-6 rounded-r-xl mb-6">
            <p className="text-gray-300 leading-relaxed">
              <strong className="text-white">💡 Reality Check:</strong> Top sellers on <strong className="text-[#ff950e]">Panty Post</strong> earn $500-$3,000+ per month. New sellers typically start at $200-500/month and grow from there. Success requires consistent effort, quality customer service, and building your reputation through reviews.
            </p>
          </div>

          <h3 className="text-2xl font-semibold mb-4 text-white">Requirements</h3>
          
          <ul className="space-y-2 text-gray-300 mb-6">
            <li className="flex items-start">
              <span className="text-[#ff950e] mr-2">•</span>
              <span>Must be 21+ years old</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#ff950e] mr-2">•</span>
              <span>Valid government-issued ID for verification</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#ff950e] mr-2">•</span>
              <span>Ability to ship packages discreetly</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#ff950e] mr-2">•</span>
              <span>Smartphone or camera for photos</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#ff950e] mr-2">•</span>
              <span>Comfortable with the adult nature of this business</span>
            </li>
          </ul>
        </section>

        {/* Section 2 */}
        <section id="creating-account" className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-white">Creating Your Seller Account</h2>
          
          <p className="text-gray-300 leading-relaxed mb-6">
            Getting started on <strong className="text-[#ff950e]">Panty Post</strong> is straightforward. Follow these steps to create your seller account.
          </p>

          <div className="space-y-4 mb-6">
            <div className="flex gap-4">
              <div className="bg-[#ff950e] text-black font-bold rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">Visit PantyPost.com</h4>
                <p className="text-gray-300">
                  Navigate to <Link href="/signup" className="text-[#ff950e] hover:underline">pantypost.com/signup</Link> to begin the registration process.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-[#ff950e] text-black font-bold rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">Choose "Seller" Account Type</h4>
                <p className="text-gray-300">
                  Select the seller option during registration. This gives you access to listing creation, order management, and seller-specific features.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-[#ff950e] text-black font-bold rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">Create Username & Password</h4>
                <p className="text-gray-300">
                  Choose a memorable username (3-20 characters). This will be your brand on the platform, so pick something professional yet memorable. Use a strong, unique password.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-[#ff950e] text-black font-bold rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                4
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">Verify Your Email</h4>
                <p className="text-gray-300">
                  Check your email for a verification link. Click it to activate your account. This ensures account security and allows you to receive important notifications.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-[#ff950e] text-black font-bold rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                5
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">Complete Your Profile</h4>
                <p className="text-gray-300">
                  Add a profile picture (doesn't need to show your face), write a compelling bio (max 500 characters), and set your subscription price for premium content ($9.99 is the default).
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-900/20 border border-green-500/30 p-6 rounded-xl">
            <h4 className="text-lg font-semibold text-green-400 mb-2">✓ Pro Tip</h4>
            <p className="text-gray-300">
              Your username becomes your brand. Choose something that's easy to remember and reflects your personality. Avoid using your real name to maintain privacy.
            </p>
          </div>
        </section>

        {/* Section 3 - Verification */}
        <section id="verification" className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-white">Seller Verification Process</h2>
          
          <p className="text-gray-300 leading-relaxed mb-6">
            <strong className="text-[#ff950e]">Panty Post</strong> requires seller verification to protect buyers and maintain platform integrity. Verified sellers get a blue verification badge, appear higher in search results, and earn buyer trust.
          </p>

          <h3 className="text-2xl font-semibold mb-4 text-white">What You'll Need</h3>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/10">
              <h4 className="text-xl font-semibold text-[#ff950e] mb-3">1. Government-Issued ID</h4>
              <p className="text-gray-300 mb-3">
                Driver's license, passport, or state ID. Must show your photo, date of birth, and be unexpired.
              </p>
              <p className="text-gray-400 text-sm">
                Privacy guaranteed: Your ID is reviewed by admins only and never shared publicly.
              </p>
            </div>

            <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/10">
              <h4 className="text-xl font-semibold text-[#ff950e] mb-3">2. Verification Photo</h4>
              <p className="text-gray-300 mb-3">
                Hold a piece of paper with your unique verification code (provided by the platform) and your username. Photo must clearly show both.
              </p>
              <p className="text-gray-400 text-sm">
                This proves you own the account and are the person on the ID.
              </p>
            </div>
          </div>

          <h3 className="text-2xl font-semibold mb-4 text-white">Verification Steps</h3>

          <ol className="space-y-4 text-gray-300 mb-6">
            <li className="flex items-start gap-3">
              <span className="text-[#ff950e] font-bold">1.</span>
              <div>
                <strong className="text-white">Navigate to Verification Page:</strong> Go to <Link href="/sellers/verify" className="text-[#ff950e] hover:underline">/sellers/verify</Link> in your seller dashboard.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#ff950e] font-bold">2.</span>
              <div>
                <strong className="text-white">Get Your Verification Code:</strong> The system generates a unique code for you (e.g., "PP-A7K9M2"). Write this on paper clearly.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#ff950e] font-bold">3.</span>
              <div>
                <strong className="text-white">Upload ID Photo:</strong> Take a clear photo of the front of your ID (back optional). Ensure all information is legible.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#ff950e] font-bold">4.</span>
              <div>
                <strong className="text-white">Upload Verification Photo:</strong> Hold your paper with the code and username next to your face. Take a clear, well-lit selfie.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#ff950e] font-bold">5.</span>
              <div>
                <strong className="text-white">Submit for Review:</strong> Click submit. Our admin team typically reviews applications within 24-48 hours.
              </div>
            </li>
          </ol>

          <div className="bg-[#1a1a1a] border-l-4 border-[#ff950e] p-6 rounded-r-xl mb-6">
            <h4 className="text-lg font-semibold text-white mb-2">🛡️ Privacy & Security</h4>
            <p className="text-gray-300 leading-relaxed">
              Your ID and verification photos are stored securely, encrypted, and only accessible to admin staff for verification purposes. We never share or sell your personal information. Once verified, these documents are permanently deleted from our servers after 90 days.
            </p>
          </div>

          <h3 className="text-2xl font-semibold mb-4 text-white">Benefits of Verification</h3>
          
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-start">
              <span className="text-[#ff950e] mr-2">✓</span>
              <span>Blue verification badge on your profile and listings</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#ff950e] mr-2">✓</span>
              <span>Higher placement in search results</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#ff950e] mr-2">✓</span>
              <span>Buyers trust verified sellers more (higher conversion rates)</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#ff950e] mr-2">✓</span>
              <span>Access to premium features (auctions, custom requests)</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#ff950e] mr-2">✓</span>
              <span>Required for withdrawal of earnings</span>
            </li>
          </ul>
        </section>

        {/* Section 4 - First Listing */}
        <section id="first-listing" className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-white">Creating Your First Listing</h2>
          
          <p className="text-gray-300 leading-relaxed mb-6">
            Your first listing is crucial—it sets the tone for your shop and helps you understand what buyers are looking for. Follow this guide to create a compelling first listing.
          </p>

          <h3 className="text-2xl font-semibold mb-4 text-white">Listing Components</h3>

          <div className="space-y-6 mb-6">
            <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/10">
              <h4 className="text-xl font-semibold text-[#ff950e] mb-3">📸 Photos (1-10 images)</h4>
              <p className="text-gray-300 mb-3">
                High-quality photos are essential. Upload 3-5 images showing the panties from different angles. You can include modeling shots (face not required), close-ups of fabric/lace, and packaging photos.
              </p>
              <p className="text-gray-400 text-sm">
                <strong>Pro tip:</strong> First photo is your thumbnail. Make it eye-catching and clear.
              </p>
            </div>

            <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/10">
              <h4 className="text-xl font-semibold text-[#ff950e] mb-3">📝 Title (Max 100 characters)</h4>
              <p className="text-gray-300 mb-3">
                Be descriptive and specific. Include material, color, and style.
              </p>
              <div className="bg-black/50 p-4 rounded text-sm">
                <p className="text-green-400 mb-2">✓ Good example:</p>
                <p className="text-white mb-3">"Black Lace Thong - 24hr Wear - Cotton Gusset"</p>
                <p className="text-red-400 mb-2">✗ Bad example:</p>
                <p className="text-white">"Panties for sale"</p>
              </div>
            </div>

            <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/10">
              <h4 className="text-xl font-semibold text-[#ff950e] mb-3">📄 Description (Max 1000 characters)</h4>
              <p className="text-gray-300 mb-3">
                Detailed description including material, size, condition, wear time included, and what makes this pair special.
              </p>
              <div className="bg-black/50 p-4 rounded text-sm text-white">
                <p className="mb-2">Example template:</p>
                <p>"Soft cotton panties with delicate black lace trim. Size M, Brazilian cut. Includes 24 hours of wear. Available add-ons: extra days ($10/day), workout session ($15), special requests (message me). Vacuum-sealed for freshness, shipped discreetly within 48 hours of purchase."</p>
              </div>
            </div>

            <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/10">
              <h4 className="text-xl font-semibold text-[#ff950e] mb-3">💰 Pricing</h4>
              <p className="text-gray-300 mb-3">
                Set your base price for 24-hour wear. Typical range: $25-60 depending on style and extras. See the pricing section below for detailed strategies.
              </p>
              <p className="text-gray-400 text-sm">
                Remember: Buyers pay a 10% platform fee, and you pay a 10% platform fee. Price accordingly.
              </p>
            </div>

            <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/10">
              <h4 className="text-xl font-semibold text-[#ff950e] mb-3">🏷️ Tags (Recommended)</h4>
              <p className="text-gray-300 mb-3">
                Add 3-7 relevant tags to help buyers find your listing. Examples: "lace", "cotton", "thong", "24hr", "workout", "petite", etc.
              </p>
              <p className="text-gray-400 text-sm">
                Tags improve discoverability in search and filtering.
              </p>
            </div>
          </div>

          <div className="bg-green-900/20 border border-green-500/30 p-6 rounded-xl">
            <h4 className="text-lg font-semibold text-green-400 mb-2">✓ Before You Publish</h4>
            <ul className="text-gray-300 space-y-1">
              <li>✓ Check all photos are clear and well-lit</li>
              <li>✓ Proofread title and description for typos</li>
              <li>✓ Verify pricing is competitive</li>
              <li>✓ Add relevant tags</li>
              <li>✓ Review your profile to ensure it's complete</li>
            </ul>
          </div>
        </section>

        {/* Section 5 - Pricing Strategy */}
        <section id="pricing" className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-white">Pricing Strategy Guide</h2>
          
          <p className="text-gray-300 leading-relaxed mb-6">
            Pricing is both art and science. Price too high and you won't get sales; too low and you undervalue your time. Here's how to find the sweet spot.
          </p>

          <h3 className="text-2xl font-semibold mb-4 text-white">Standard Pricing (24-Hour Wear)</h3>

          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#1a1a1a] border-b border-white/10">
                  <th className="text-left p-4 text-white font-semibold">Style</th>
                  <th className="text-left p-4 text-white font-semibold">Typical Range</th>
                  <th className="text-left p-4 text-white font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-white/5">
                  <td className="p-4">Basic Cotton</td>
                  <td className="p-4 text-[#ff950e] font-semibold">$25 - $35</td>
                  <td className="p-4">Good starting point for new sellers</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="p-4">Lace/Silk</td>
                  <td className="p-4 text-[#ff950e] font-semibold">$35 - $50</td>
                  <td className="p-4">Premium materials justify higher prices</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="p-4">Thongs</td>
                  <td className="p-4 text-[#ff950e] font-semibold">$30 - $45</td>
                  <td className="p-4">Popular style, consistent demand</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="p-4">Designer/Luxury</td>
                  <td className="p-4 text-[#ff950e] font-semibold">$60 - $100+</td>
                  <td className="p-4">Victoria's Secret, Agent Provocateur, etc.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-2xl font-semibold mb-4 text-white">Add-On Pricing</h3>

          <ul className="space-y-2 text-gray-300 mb-6">
            <li className="flex items-start">
              <span className="text-[#ff950e] mr-2">•</span>
              <span><strong>Extra Wear Day:</strong> +$10-15 per additional day</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#ff950e] mr-2">•</span>
              <span><strong>Workout Session:</strong> +$15-25</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#ff950e] mr-2">•</span>
              <span><strong>No Wipe:</strong> +$10-20</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#ff950e] mr-2">•</span>
              <span><strong>Masturbation:</strong> +$20-35</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#ff950e] mr-2">•</span>
              <span><strong>Period Panties:</strong> +$15-30 (if comfortable offering)</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#ff950e] mr-2">•</span>
              <span><strong>Photo/Video Set:</strong> +$25-50+ depending on content</span>
            </li>
          </ul>

          <div className="bg-[#1a1a1a] border-l-4 border-[#ff950e] p-6 rounded-r-xl mb-6">
            <h4 className="text-lg font-semibold text-white mb-2">💰 Pricing Psychology</h4>
            <p className="text-gray-300 leading-relaxed mb-3">
              Prices ending in .99 or .97 perform better psychologically. Consider pricing at $29.99 instead of $30.00, or $39.97 instead of $40.00.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Start slightly lower as a new seller to build reviews, then gradually increase prices as you gain reputation and positive feedback.
            </p>
          </div>

          <h3 className="text-2xl font-semibold mb-4 text-white">Platform Fees to Consider</h3>

          <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/10 mb-6">
            <p className="text-gray-300 mb-4">
              <strong className="text-[#ff950e]">Panty Post</strong> uses a double 10% fee model:
            </p>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start">
                <span className="text-[#ff950e] mr-2">•</span>
                <span>Buyers pay your listed price + 10% platform fee</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#ff950e] mr-2">•</span>
                <span>You receive your listed price - 10% platform fee</span>
              </li>
            </ul>
            <p className="text-gray-400 text-sm mt-4">
              <strong>Example:</strong> You list panties for $30. Buyer pays $33 ($30 + $3 fee). You receive $27 ($30 - $3 fee). Platform keeps $6 total.
            </p>
          </div>
        </section>

        {/* Section 6 - Photography */}
        <section id="photography" className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-white">Photography Tips</h2>
          
          <p className="text-gray-300 leading-relaxed mb-6">
            Great photos are the difference between a sale and a scroll. Here's how to take photos that convert browsers into buyers.
          </p>

          <h3 className="text-2xl font-semibold mb-4 text-white">Essential Photography Guidelines</h3>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/10">
              <h4 className="text-xl font-semibold text-[#ff950e] mb-3">💡 Lighting</h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• Natural daylight is best (near a window)</li>
                <li>• Avoid harsh overhead lights</li>
                <li>• No flash—creates harsh shadows</li>
                <li>• Aim for soft, even lighting</li>
              </ul>
            </div>

            <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/10">
              <h4 className="text-xl font-semibold text-[#ff950e] mb-3">📐 Angles</h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• Front view showing full panty</li>
                <li>• Back view</li>
                <li>• Close-up of lace/details</li>
                <li>• On-body shot (optional, no face required)</li>
              </ul>
            </div>

            <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/10">
              <h4 className="text-xl font-semibold text-[#ff950e] mb-3">🎨 Background</h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• Clean, uncluttered background</li>
                <li>• White or neutral colors work best</li>
                <li>• Avoid messy rooms or distractions</li>
                <li>• Consider a fabric backdrop</li>
              </ul>
            </div>

            <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/10">
              <h4 className="text-xl font-semibold text-[#ff950e] mb-3">📱 Equipment</h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• Modern smartphone camera is sufficient</li>
                <li>• Clean your lens before shooting</li>
                <li>• Use portrait mode for depth effect</li>
                <li>• Consider a small ring light ($15-30)</li>
              </ul>
            </div>
          </div>

          <h3 className="text-2xl font-semibold mb-4 text-white">What NOT to Do</h3>

          <ul className="space-y-2 text-gray-300 mb-6">
            <li className="flex items-start">
              <span className="text-red-400 mr-2">✗</span>
              <span>Don't use blurry or low-quality images</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-400 mr-2">✗</span>
              <span>Don't show your face (unless comfortable—privacy first)</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-400 mr-2">✗</span>
              <span>Don't use stock photos or photos from other sellers</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-400 mr-2">✗</span>
              <span>Don't over-edit—buyers want authentic photos</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-400 mr-2">✗</span>
              <span>Don't include identifying information (tattoos you can't crop, backgrounds with addresses)</span>
            </li>
          </ul>

          <div className="bg-green-900/20 border border-green-500/30 p-6 rounded-xl">
            <h4 className="text-lg font-semibold text-green-400 mb-2">✓ Quick Win</h4>
            <p className="text-gray-300">
              Your first photo (thumbnail) gets 80% of attention. Make it your best shot—clear, well-lit, and showing the full panty from a flattering angle.
            </p>
          </div>
        </section>

        {/* Section 7 - Shipping */}
        <section id="shipping" className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-white">Shipping & Packaging</h2>
          
          <p className="text-gray-300 leading-relaxed mb-6">
            Proper packaging ensures freshness, privacy, and professionalism. Here's exactly how to ship orders safely and discreetly.
          </p>

          <h3 className="text-2xl font-semibold mb-4 text-white">Packaging Supplies You'll Need</h3>

          <ul className="space-y-2 text-gray-300 mb-6">
            <li className="flex items-start">
              <span className="text-[#ff950e] mr-2">•</span>
              <span><strong>Vacuum sealer bags</strong> (or ziplock bags as backup)</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#ff950e] mr-2">•</span>
              <span><strong>Bubble mailers</strong> (6x9 or 8x11 size)</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#ff950e] mr-2">•</span>
              <span><strong>Thank you cards</strong> (optional but appreciated)</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#ff950e] mr-2">•</span>
              <span><strong>Fragrance spray</strong> (optional - some buyers request this)</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#ff950e] mr-2">•</span>
              <span><strong>Shipping labels</strong> (print at home or use USPS Click-N-Ship)</span>
            </li>
          </ul>

          <h3 className="text-2xl font-semibold mb-4 text-white">Step-by-Step Packaging Process</h3>

          <ol className="space-y-4 text-gray-300 mb-6">
            <li className="flex items-start gap-3">
              <span className="text-[#ff950e] font-bold">1.</span>
              <div>
                <strong className="text-white">Wear as Promised:</strong> Wear panties for the agreed time (typically 24 hours minimum). Follow any special requests (workout, no shower, etc.).
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#ff950e] font-bold">2.</span>
              <div>
                <strong className="text-white">Remove & Seal Immediately:</strong> Remove panties and immediately place in vacuum seal bag or ziplock. Seal tightly to preserve freshness.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#ff950e] font-bold">3.</span>
              <div>
                <strong className="text-white">Add Thank You Note:</strong> Include a handwritten thank you card (no real name needed). This personal touch encourages repeat business.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#ff950e] font-bold">4.</span>
              <div>
                <strong className="text-white">Place in Bubble Mailer:</strong> Put sealed panties (and card) in bubble mailer. Seal securely with packing tape.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#ff950e] font-bold">5.</span>
              <div>
                <strong className="text-white">Address Discreetly:</strong> Use buyer's provided shipping address. Use a return address that doesn't identify the contents (PO box or initials only).
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#ff950e] font-bold">6.</span>
              <div>
                <strong className="text-white">Ship Within 48 Hours:</strong> Ship via USPS First Class (typically $4-6). Get tracking number and mark order as shipped on <strong className="text-[#ff950e]">Panty Post</strong>.
              </div>
            </li>
          </ol>

          <div className="bg-[#1a1a1a] border-l-4 border-[#ff950e] p-6 rounded-r-xl mb-6">
            <h4 className="text-lg font-semibold text-white mb-2">📦 Discretion is Key</h4>
            <p className="text-gray-300 leading-relaxed mb-3">
              Never include anything on the outside of the package that reveals contents. Use neutral return addresses. Many sellers use initials or a PO box.
            </p>
            <p className="text-gray-300 leading-relaxed">
              <strong>Pro tip:</strong> Create a return address label with just initials and city/state. Example: "A.M., Portland, OR 97201"
            </p>
          </div>

          <h3 className="text-2xl font-semibold mb-4 text-white">Shipping Costs</h3>

          <p className="text-gray-300 mb-4">
            Typical shipping costs for a small bubble mailer via USPS First Class:
          </p>

          <ul className="space-y-2 text-gray-300 mb-6">
            <li className="flex items-start">
              <span className="text-[#ff950e] mr-2">•</span>
              <span><strong>Domestic (US):</strong> $4-6</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#ff950e] mr-2">•</span>
              <span><strong>International:</strong> $15-25+ (if you offer international shipping)</span>
            </li>
          </ul>

          <p className="text-gray-300">
            Most sellers either include shipping in their price or charge buyers separately. Be clear in your listing which approach you use.
          </p>
        </section>

        {/* Section 8 - Customer Service */}
        <section id="customer-service" className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-white">Customer Service & Messaging</h2>
          
          <p className="text-gray-300 leading-relaxed mb-6">
            Excellent customer service leads to repeat buyers, positive reviews, and tips. Here's how to provide a 5-star experience.
          </p>

          <h3 className="text-2xl font-semibold mb-4 text-white">Communication Best Practices</h3>

          <div className="space-y-6 mb-6">
            <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/10">
              <h4 className="text-xl font-semibold text-[#ff950e] mb-3">⚡ Respond Quickly</h4>
              <p className="text-gray-300 mb-3">
                Aim to respond to messages within 2-4 hours during waking hours. Buyers often message multiple sellers—first to respond often gets the sale.
              </p>
              <p className="text-gray-400 text-sm">
                Set up notifications on your phone so you never miss a message.
              </p>
            </div>

            <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/10">
              <h4 className="text-xl font-semibold text-[#ff950e] mb-3">✍️ Be Professional but Friendly</h4>
              <p className="text-gray-300 mb-3">
                Use proper grammar and punctuation. Be warm and approachable, but maintain boundaries. You're running a business.
              </p>
              <div className="bg-black/50 p-4 rounded text-sm mt-3">
                <p className="text-green-400 mb-2">✓ Good example:</p>
                <p className="text-white mb-3">"Hi! Thanks for your interest. I'd be happy to create a custom order for you. The total would be $45 including 2-day wear and a workout session. Let me know if that works! 😊"</p>
              </div>
            </div>

            <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/10">
              <h4 className="text-xl font-semibold text-[#ff950e] mb-3">🔒 Set Clear Boundaries</h4>
              <p className="text-gray-300 mb-3">
                It's okay to say no to requests you're uncomfortable with. Be polite but firm. Never feel pressured to do anything outside your comfort zone.
              </p>
              <p className="text-gray-400 text-sm">
                Example: "I appreciate your interest, but I don't offer that service. Is there anything else I can help you with?"
              </p>
            </div>

            <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/10">
              <h4 className="text-xl font-semibold text-[#ff950e] mb-3">📸 Handle Photo Requests Carefully</h4>
              <p className="text-gray-300 mb-3">
                Custom photo requests should be paid add-ons. Never send free custom content. Set clear pricing for photo sets (typically $25-50).
              </p>
              <p className="text-gray-400 text-sm">
                Always watermark custom photos before sending to prevent theft.
              </p>
            </div>
          </div>

          <h3 className="text-2xl font-semibold mb-4 text-white">Handling Custom Requests</h3>

          <p className="text-gray-300 mb-6">
            <strong className="text-[#ff950e]">Panty Post</strong> has a built-in custom request system. When buyers send you custom requests, you'll receive a notification. Here's how to handle them:
          </p>

          <ol className="space-y-2 text-gray-300 mb-6">
            <li>1. Review the request details (wear time, special activities, price offered)</li>
            <li>2. Respond within 24 hours with acceptance or counter-offer</li>
            <li>3. Once agreed, buyer pays through the platform (you're protected)</li>
            <li>4. Fulfill the order exactly as requested</li>
            <li>5. Ship within 48 hours and mark as shipped</li>
          </ol>

          <div className="bg-green-900/20 border border-green-500/30 p-6 rounded-xl">
            <h4 className="text-lg font-semibold text-green-400 mb-2">✓ Building Repeat Customers</h4>
            <p className="text-gray-300 mb-3">
              Buyers who have a great first experience become loyal repeat customers. Focus on:
            </p>
            <ul className="text-gray-300 space-y-1">
              <li>• Fast, friendly communication</li>
              <li>• Delivering exactly what you promise</li>
              <li>• Shipping quickly (within 48 hours)</li>
              <li>• Including a thank you note</li>
              <li>• Following up after delivery to ensure satisfaction</li>
            </ul>
          </div>
        </section>

        {/* Section 9 - Subscriptions */}
        <section id="subscriptions" className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-white">Building Recurring Income with Subscriptions</h2>
          
          <p className="text-gray-300 leading-relaxed mb-6">
            <strong className="text-[#ff950e]">Panty Post's</strong> subscription feature allows buyers to subscribe to you for $9.99/month (default, you can adjust). Subscribers get access to your premium content and exclusive perks.
          </p>

          <h3 className="text-2xl font-semibold mb-4 text-white">What Are Subscriptions?</h3>

          <p className="text-gray-300 mb-6">
            Subscribers pay a monthly fee to access your premium content. This includes:
          </p>

          <ul className="space-y-2 text-gray-300 mb-6">
            <li className="flex items-start">
              <span className="text-[#ff950e] mr-2">•</span>
              <span><strong>Premium listings:</strong> Exclusive panty listings only subscribers can see</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#ff950e] mr-2">•</span>
              <span><strong>Private gallery:</strong> Exclusive photos/videos in your profile gallery</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#ff950e] mr-2">•</span>
              <span><strong>Subscriber discounts:</strong> You can offer subscribers 10-20% off purchases</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#ff950e] mr-2">•</span>
              <span><strong>Priority messaging:</strong> Faster response times for subscribers</span>
            </li>
          </ul>

          <h3 className="text-2xl font-semibold mb-4 text-white">Subscription Revenue Breakdown</h3>

          <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/10 mb-6">
            <p className="text-gray-300 mb-4">
              <strong className="text-[#ff950e]">Platform fee:</strong> 25% (You keep 75%)
            </p>
            <p className="text-gray-400 text-sm mb-4">
              If you charge $9.99/month, you earn $7.49/month per subscriber.
            </p>
            <p className="text-gray-300">
              <strong>Example earnings:</strong>
            </p>
            <ul className="text-gray-300 space-y-1 mt-2">
              <li>• 10 subscribers = $74.90/month</li>
              <li>• 25 subscribers = $187.25/month</li>
              <li>• 50 subscribers = $374.50/month</li>
              <li>• 100 subscribers = $749/month</li>
            </ul>
          </div>

          <h3 className="text-2xl font-semibold mb-4 text-white">How to Grow Your Subscriber Base</h3>

          <ol className="space-y-4 text-gray-300 mb-6">
            <li className="flex items-start gap-3">
              <span className="text-[#ff950e] font-bold">1.</span>
              <div>
                <strong className="text-white">Create Premium-Only Listings:</strong> Mark your best/most unique panties as premium-only. This incentivizes buyers to subscribe.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#ff950e] font-bold">2.</span>
              <div>
                <strong className="text-white">Build a Photo Gallery:</strong> Upload 10-20 exclusive photos to your profile gallery. Show subscribers what they get.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#ff950e] font-bold">3.</span>
              <div>
                <strong className="text-white">Offer Subscriber Perks:</strong> Give subscribers 15% off all purchases, or free shipping, or priority on custom requests.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#ff950e] font-bold">4.</span>
              <div>
                <strong className="text-white">Promote on Your Profile:</strong> Add a clear call-to-action in your bio: "Subscribe for exclusive access to my premium content! 🔥"
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#ff950e] font-bold">5.</span>
              <div>
                <strong className="text-white">Deliver Value:</strong> Update your gallery regularly (2-3 new photos per week). Post new premium listings weekly.
              </div>
            </li>
          </ol>

          <div className="bg-[#1a1a1a] border-l-4 border-[#ff950e] p-6 rounded-r-xl">
            <h4 className="text-lg font-semibold text-white mb-2">💡 Subscription Strategy</h4>
            <p className="text-gray-300 leading-relaxed">
              Think of subscriptions as your passive income base. Once someone subscribes, they auto-renew monthly. Focus on retention by consistently delivering value and engaging with your subscribers.
            </p>
          </div>
        </section>

        {/* Section 10 - Tier System */}
        <section id="tier-system" className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-white">Growing Through the Tier System</h2>
          
          <p className="text-gray-300 leading-relaxed mb-6">
            <strong className="text-[#ff950e]">Panty Post</strong> rewards successful sellers with a 5-tier system. As you make more sales and earn more revenue, you unlock better commission rates.
          </p>

          <h3 className="text-2xl font-semibold mb-4 text-white">The 5 Tiers</h3>

          <div className="space-y-4 mb-6">
            <div className="bg-gradient-to-r from-pink-900/30 to-pink-800/20 p-6 rounded-xl border border-pink-700/30">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">💋</span>
                <div>
                  <h4 className="text-xl font-bold text-white">Tease (Level 1)</h4>
                  <p className="text-pink-300 text-sm">Starting tier for all sellers</p>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 mb-1">Requirements:</p>
                  <p className="text-white">0 sales, $0 revenue</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Commission:</p>
                  <p className="text-white font-bold">90% (you keep)</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Platform Fee:</p>
                  <p className="text-white">10%</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-900/30 to-orange-800/20 p-6 rounded-xl border border-orange-700/30">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">😘</span>
                <div>
                  <h4 className="text-xl font-bold text-white">Flirt (Level 2)</h4>
                  <p className="text-orange-300 text-sm">Active seller tier</p>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 mb-1">Requirements:</p>
                  <p className="text-white">10 sales OR $5,000 revenue</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Commission:</p>
                  <p className="text-white font-bold">91% (+1% bonus)</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Benefits:</p>
                  <p className="text-white">Priority search results</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-cyan-900/30 to-cyan-800/20 p-6 rounded-xl border border-cyan-700/30">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">💎</span>
                <div>
                  <h4 className="text-xl font-bold text-white">Obsession (Level 3)</h4>
                  <p className="text-cyan-300 text-sm">Established seller</p>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 mb-1">Requirements:</p>
                  <p className="text-white">101 sales OR $12,500 revenue</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Commission:</p>
                  <p className="text-white font-bold">92% (+2% bonus)</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Benefits:</p>
                  <p className="text-white">Premium badge, priority support</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-900/30 to-red-800/20 p-6 rounded-xl border border-red-700/30">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">❤️</span>
                <div>
                  <h4 className="text-xl font-bold text-white">Desire (Level 4)</h4>
                  <p className="text-red-300 text-sm">Top-tier seller</p>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 mb-1">Requirements:</p>
                  <p className="text-white">251 sales OR $75,000 revenue</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Commission:</p>
                  <p className="text-white font-bold">93% (+3% bonus)</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Benefits:</p>
                  <p className="text-white">Advanced analytics, custom features</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-900/30 to-yellow-800/20 p-6 rounded-xl border border-yellow-700/30">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">👑</span>
                <div>
                  <h4 className="text-xl font-bold text-white">Goddess (Level 5)</h4>
                  <p className="text-yellow-300 text-sm">Elite status</p>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 mb-1">Requirements:</p>
                  <p className="text-white">1,001 sales OR $150,000 revenue</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Commission:</p>
                  <p className="text-white font-bold">95% (+5% bonus)</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Benefits:</p>
                  <p className="text-white">VIP support, all premium features</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a1a] border-l-4 border-[#ff950e] p-6 rounded-r-xl">
            <h4 className="text-lg font-semibold text-white mb-2">🎯 Tier Advancement Strategy</h4>
            <p className="text-gray-300 leading-relaxed mb-3">
              Notice the requirements use OR logic—you only need to meet ONE of the two requirements (sales count OR revenue total). This means you can reach higher tiers by either:
            </p>
            <ul className="text-gray-300 space-y-1">
              <li>• Making many smaller sales (volume strategy)</li>
              <li>• Making fewer high-value sales (premium strategy)</li>
              <li>• A combination of both</li>
            </ul>
          </div>
        </section>

        {/* Section 11 - Safety */}
        <section id="safety" className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-white">Safety & Privacy</h2>
          
          <p className="text-gray-300 leading-relaxed mb-6">
            Your safety and privacy should always be your top priority. Here's how to protect yourself while selling.
          </p>

          <h3 className="text-2xl font-semibold mb-4 text-white">Essential Safety Rules</h3>

          <ul className="space-y-4 mb-6">
            <li className="bg-[#1a1a1a] p-6 rounded-xl border border-white/10">
              <div className="flex items-start gap-3">
                <span className="text-[#ff950e] text-2xl">🔒</span>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Never Share Personal Information</h4>
                  <p className="text-gray-300">
                    Never share your real name, address, phone number, social media accounts, or any identifying information. Use the platform's messaging system exclusively.
                  </p>
                </div>
              </div>
            </li>

            <li className="bg-[#1a1a1a] p-6 rounded-xl border border-white/10">
              <div className="flex items-start gap-3">
                <span className="text-[#ff950e] text-2xl">💳</span>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">All Payments Through Platform Only</h4>
                  <p className="text-gray-300">
                    Never accept payment outside the platform (Venmo, CashApp, PayPal, etc.). Platform payments protect you legally and financially.
                  </p>
                </div>
              </div>
            </li>

            <li className="bg-[#1a1a1a] p-6 rounded-xl border border-white/10">
              <div className="flex items-start gap-3">
                <span className="text-[#ff950e] text-2xl">📸</span>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Protect Your Identity in Photos</h4>
                  <p className="text-gray-300">
                    Don't show your face unless you're comfortable. Crop out identifying tattoos, birthmarks, or backgrounds that reveal your location.
                  </p>
                </div>
              </div>
            </li>

            <li className="bg-[#1a1a1a] p-6 rounded-xl border border-white/10">
              <div className="flex items-start gap-3">
                <span className="text-[#ff950e] text-2xl">🚫</span>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Set Firm Boundaries</h4>
                  <p className="text-gray-300">
                    You are never obligated to fulfill requests that make you uncomfortable. Say no to anything outside your comfort zone.
                  </p>
                </div>
              </div>
            </li>

            <li className="bg-[#1a1a1a] p-6 rounded-xl border border-white/10">
              <div className="flex items-start gap-3">
                <span className="text-[#ff950e] text-2xl">⚠️</span>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Report Suspicious Behavior</h4>
                  <p className="text-gray-300">
                    If a buyer harasses you, requests illegal activities, or violates platform rules, report them immediately to admin team.
                  </p>
                </div>
              </div>
            </li>
          </ul>

          <div className="bg-red-900/20 border border-red-500/30 p-6 rounded-xl">
            <h4 className="text-lg font-semibold text-red-400 mb-2">🚨 Red Flags - Block Immediately</h4>
            <ul className="text-gray-300 space-y-1">
              <li>• Requests to move conversation off-platform</li>
              <li>• Asks for personal contact information</li>
              <li>• Pressures you to accept payment outside platform</li>
              <li>• Requests illegal content or services</li>
              <li>• Harassing or threatening messages</li>
              <li>• Attempts to get free content</li>
            </ul>
          </div>
        </section>

        {/* Section 12 - Taxes */}
        <section id="taxes" className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-white">Taxes & Legal Considerations</h2>
          
          <p className="text-gray-300 leading-relaxed mb-6">
            As a seller, you're responsible for reporting your income and paying applicable taxes. Here's what you need to know.
          </p>

          <h3 className="text-2xl font-semibold mb-4 text-white">Tax Basics</h3>

          <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/10 mb-6">
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start">
                <span className="text-[#ff950e] mr-2">•</span>
                <span><strong>Self-Employment Income:</strong> Your earnings are considered self-employment income and must be reported to the IRS (or your country's tax authority).</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#ff950e] mr-2">•</span>
                <span><strong>1099 Forms:</strong> If you earn over $600 in a calendar year, Panty Post will provide a 1099 form for tax filing.</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#ff950e] mr-2">•</span>
                <span><strong>Quarterly Taxes:</strong> Consider paying estimated quarterly taxes if you expect to earn significant income.</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#ff950e] mr-2">•</span>
                <span><strong>Deductible Expenses:</strong> You can deduct business expenses like shipping supplies, panties purchased for sale, photography equipment, etc.</span>
              </li>
            </ul>
          </div>

          <h3 className="text-2xl font-semibold mb-4 text-white">Recommended Record-Keeping</h3>

          <ul className="space-y-2 text-gray-300 mb-6">
            <li className="flex items-start">
              <span className="text-[#ff950e] mr-2">✓</span>
              <span>Track all income and expenses in a spreadsheet</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#ff950e] mr-2">✓</span>
              <span>Save receipts for business purchases</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#ff950e] mr-2">✓</span>
              <span>Download monthly earnings reports from Panty Post</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#ff950e] mr-2">✓</span>
              <span>Consider using accounting software (QuickBooks, Wave, etc.)</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#ff950e] mr-2">✓</span>
              <span>Consult a tax professional for personalized advice</span>
            </li>
          </ul>

          <div className="bg-[#1a1a1a] border-l-4 border-[#ff950e] p-6 rounded-r-xl">
            <h4 className="text-lg font-semibold text-white mb-2">📋 Disclaimer</h4>
            <p className="text-gray-300 leading-relaxed">
              This guide provides general information only and should not be considered tax or legal advice. Tax laws vary by location and individual circumstances. Always consult with a qualified tax professional or accountant for advice specific to your situation.
            </p>
          </div>
        </section>

        {/* Section 13 - FAQ */}
        <section id="faq" className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-white">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-[#ff950e] mb-3">How much can I realistically earn?</h3>
              <p className="text-gray-300">
                New sellers typically earn $200-500/month in their first few months. Established sellers with good reviews average $500-1,500/month. Top sellers who treat it as a full-time business earn $2,000-5,000+/month through a combination of sales, subscriptions, and custom orders.
              </p>
            </div>

            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-[#ff950e] mb-3">Is this legal?</h3>
              <p className="text-gray-300">
                Yes, selling used panties between consenting adults is legal in most countries. You must be 21+ and comply with platform verification requirements. Treat it as self-employment income and report earnings to tax authorities.
              </p>
            </div>

            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-[#ff950e] mb-3">How long does verification take?</h3>
              <p className="text-gray-300">
                Typically 24-48 hours. Submit clear photos of your ID and verification selfie during business hours for fastest processing. You'll receive an email notification once approved.
              </p>
            </div>

            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-[#ff950e] mb-3">Do I need to show my face?</h3>
              <p className="text-gray-300">
                No! Many successful sellers never show their face. You can photograph panties on a bed, mannequin, or wear them in photos that don't include your face. Privacy is completely in your control.
              </p>
            </div>

            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-[#ff950e] mb-3">How do withdrawals work?</h3>
              <p className="text-gray-300">
                Once verified, you can withdraw earnings to your bank account or PayPal. Minimum withdrawal is $50. Processing takes 3-5 business days. Platform holds funds for 7 days after a sale to protect against chargebacks.
              </p>
            </div>

            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-[#ff950e] mb-3">What if a buyer requests a refund?</h3>
              <p className="text-gray-300">
                Contact support immediately. Panty Post reviews each case individually. If you fulfilled the order as described and have proof of shipment, you're typically protected. This is why clear listing descriptions and good communication are essential.
              </p>
            </div>

            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-[#ff950e] mb-3">Can I sell other items?</h3>
              <p className="text-gray-300">
                Yes! Many sellers also offer socks, bras, workout clothes, and other worn items. Some sellers offer digital content like photo sets or videos. Diversifying your offerings can significantly increase income.
              </p>
            </div>

            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-[#ff950e] mb-3">How do I handle difficult buyers?</h3>
              <p className="text-gray-300">
                Stay professional and document everything. If a buyer violates platform rules or harasses you, report them immediately. You can block buyers at any time. Never feel obligated to fulfill requests that make you uncomfortable.
              </p>
            </div>
          </div>
        </section>

        {/* Conclusion CTA */}
        <section className="bg-gradient-to-br from-[#ff950e]/10 to-[#ff6b00]/5 border border-[#ff950e]/20 rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">Ready to Start Your Selling Journey?</h2>
          <p className="text-gray-300 text-lg mb-6 max-w-2xl mx-auto">
            You now have everything you need to start selling successfully on <strong className="text-[#ff950e]">Panty Post</strong>. Create your account, get verified, and start earning today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-block bg-[#ff950e] text-black font-semibold px-8 py-4 rounded-full hover:bg-[#ff7a00] transition-colors"
            >
              Create Seller Account
            </Link>
            <Link
              href="/blog/how-to-buy-used-panties-online-guide"
              className="inline-block bg-white/10 text-white font-semibold px-8 py-4 rounded-full hover:bg-white/20 transition-colors border border-white/20"
            >
              View Buyer's Guide
            </Link>
          </div>
        </section>

        {/* Share Section */}
        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <p className="text-gray-500 text-sm">
            Found this guide helpful? Share it with others who might benefit.
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <button className="text-gray-400 hover:text-[#ff950e] transition-colors">
              Share on Twitter
            </button>
            <button className="text-gray-400 hover:text-[#ff950e] transition-colors">
              Copy Link
            </button>
          </div>
        </div>
      </div>

      {/* Related Articles */}
      <div className="bg-[#1a1a1a] border-t border-white/10 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h3 className="text-2xl font-bold mb-6 text-white">Related Articles</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/blog/how-to-buy-used-panties-online-guide" className="bg-black/50 border border-white/10 rounded-xl p-6 hover:border-[#ff950e]/30 transition-colors">
              <h4 className="text-lg font-semibold text-white mb-2">Buyer's Guide</h4>
              <p className="text-gray-400 text-sm mb-4">Complete guide to buying used panties online</p>
              <span className="text-[#ff950e] text-sm hover:underline">Read Guide →</span>
            </Link>
            <div className="bg-black/50 border border-white/10 rounded-xl p-6 hover:border-[#ff950e]/30 transition-colors">
              <h4 className="text-lg font-semibold text-white mb-2">Safety Tips</h4>
              <p className="text-gray-400 text-sm mb-4">Advanced safety and privacy strategies</p>
              <span className="text-[#ff950e] text-sm hover:underline">Coming Soon →</span>
            </div>
            <div className="bg-black/50 border border-white/10 rounded-xl p-6 hover:border-[#ff950e]/30 transition-colors">
              <h4 className="text-lg font-semibold text-white mb-2">Marketing Tips</h4>
              <p className="text-gray-400 text-sm mb-4">Grow your audience and increase sales</p>
              <span className="text-[#ff950e] text-sm hover:underline">Coming Soon →</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}