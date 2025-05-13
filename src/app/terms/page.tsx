'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  
  // Initialize all sections as expanded
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    'introduction': true,
    'eligibility': true,
    'user-accounts': true,
    'content-listings': true,
    'transactions': true,
    'shipping': true,
    'returns': true,
    'user-conduct': true,
    'privacy': true,
    'liability': true,
    'indemnification': true,
    'amendments': true,
    'governing-law': true,
    'health-safety': true,
    'risk': true,
    'legal-compliance': true,
    'no-endorsement': true,
    'dispute-resolution': true,
    'force-majeure': true,
    'limited-liability': true,
    'disclaimer-warranties': true,
    'data-protection': true,
    'intellectual-property': true,
    'prohibited-uses': true,
    'third-party-services': true,
    'termination': true,
    'taxes': true,
    'reporting': true,
    'illegal-activity': true,
    'severability': true,
    'modifications': true,
    'entire-agreement': true,
    'acceptance': true
  });

  // Handle smooth scrolling to sections
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    setIsScrolling(true);

    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -80; // Adjust based on your header height
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;

      window.scrollTo({ top: y, behavior: 'smooth' });

      // Reset scrolling state after animation completes
      setTimeout(() => setIsScrolling(false), 800);
    }
  };

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Update active section based on scroll position
  useEffect(() => {
    if (isScrolling) return;

    const handleScroll = () => {
      const sections = document.querySelectorAll('section[id]');
      let currentSection: string | null = null;

      sections.forEach((section) => {
        const sectionTop = section.getBoundingClientRect().top;

        if (sectionTop <= 100) {
          currentSection = section.id;
        }
      });

      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check on mount

    return () => window.removeEventListener('scroll', handleScroll);
  }, [isScrolling]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors mr-4">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold text-white">Terms & Conditions</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Table of Contents - Sidebar */}
          <div className="md:w-1/4">
            <div className="bg-[#121212] rounded-xl p-4 sticky top-4">
              <h2 className="text-lg font-semibold text-[#ff950e] mb-4">Contents</h2>
              <ul className="space-y-2 text-sm overflow-y-auto max-h-[70vh] pr-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
                <li>
                  <button
                    onClick={() => scrollToSection('introduction')}
                    className={`text-left w-full py-1 px-2 rounded transition ${activeSection === 'introduction' ? 'bg-[#ff950e] text-black font-medium' : 'text-gray-300 hover:bg-[#1a1a1a]'}`}
                  >
                    Introduction
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('eligibility')}
                    className={`text-left w-full py-1 px-2 rounded transition ${activeSection === 'eligibility' ? 'bg-[#ff950e] text-black font-medium' : 'text-gray-300 hover:bg-[#1a1a1a]'}`}
                  >
                    1. Eligibility
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('user-accounts')}
                    className={`text-left w-full py-1 px-2 rounded transition ${activeSection === 'user-accounts' ? 'bg-[#ff950e] text-black font-medium' : 'text-gray-300 hover:bg-[#1a1a1a]'}`}
                  >
                    2. User Accounts
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('content-listings')}
                    className={`text-left w-full py-1 px-2 rounded transition ${activeSection === 'content-listings' ? 'bg-[#ff950e] text-black font-medium' : 'text-gray-300 hover:bg-[#1a1a1a]'}`}
                  >
                    3. Content and Listings
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('transactions')}
                    className={`text-left w-full py-1 px-2 rounded transition ${activeSection === 'transactions' ? 'bg-[#ff950e] text-black font-medium' : 'text-gray-300 hover:bg-[#1a1a1a]'}`}
                  >
                    4. Transactions and Payments
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('shipping')}
                    className={`text-left w-full py-1 px-2 rounded transition ${activeSection === 'shipping' ? 'bg-[#ff950e] text-black font-medium' : 'text-gray-300 hover:bg-[#1a1a1a]'}`}
                  >
                    5. Shipping and Delivery
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('returns')}
                    className={`text-left w-full py-1 px-2 rounded transition ${activeSection === 'returns' ? 'bg-[#ff950e] text-black font-medium' : 'text-gray-300 hover:bg-[#1a1a1a]'}`}
                  >
                    6. Returns and Refunds
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('user-conduct')}
                    className={`text-left w-full py-1 px-2 rounded transition ${activeSection === 'user-conduct' ? 'bg-[#ff950e] text-black font-medium' : 'text-gray-300 hover:bg-[#1a1a1a]'}`}
                  >
                    7. User Conduct
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('privacy')}
                    className={`text-left w-full py-1 px-2 rounded transition ${activeSection === 'privacy' ? 'bg-[#ff950e] text-black font-medium' : 'text-gray-300 hover:bg-[#1a1a1a]'}`}
                  >
                    8. Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('liability')}
                    className={`text-left w-full py-1 px-2 rounded transition ${activeSection === 'liability' ? 'bg-[#ff950e] text-black font-medium' : 'text-gray-300 hover:bg-[#1a1a1a]'}`}
                  >
                    9. Limitation of Liability
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('indemnification')}
                    className={`text-left w-full py-1 px-2 rounded transition ${activeSection === 'indemnification' ? 'bg-[#ff950e] text-black font-medium' : 'text-gray-300 hover:bg-[#1a1a1a]'}`}
                  >
                    10. Indemnification
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('amendments')}
                    className={`text-left w-full py-1 px-2 rounded transition ${activeSection === 'amendments' ? 'bg-[#ff950e] text-black font-medium' : 'text-gray-300 hover:bg-[#1a1a1a]'}`}
                  >
                    11. Amendments
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('governing-law')}
                    className={`text-left w-full py-1 px-2 rounded transition ${activeSection === 'governing-law' ? 'bg-[#ff950e] text-black font-medium' : 'text-gray-300 hover:bg-[#1a1a1a]'}`}
                  >
                    12. Governing Law
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('health-safety')}
                    className={`text-left w-full py-1 px-2 rounded transition ${activeSection === 'health-safety' ? 'bg-[#ff950e] text-black font-medium' : 'text-gray-300 hover:bg-[#1a1a1a]'}`}
                  >
                    13. Health and Safety
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('risk')}
                    className={`text-left w-full py-1 px-2 rounded transition ${activeSection === 'risk' ? 'bg-[#ff950e] text-black font-medium' : 'text-gray-300 hover:bg-[#1a1a1a]'}`}
                  >
                    14. Assumption of Risk
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('legal-compliance')}
                    className={`text-left w-full py-1 px-2 rounded transition ${activeSection === 'legal-compliance' ? 'bg-[#ff950e] text-black font-medium' : 'text-gray-300 hover:bg-[#1a1a1a]'}`}
                  >
                    15. User Responsibility for Legal Compliance
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('no-endorsement')}
                    className={`text-left w-full py-1 px-2 rounded transition ${activeSection === 'no-endorsement' ? 'bg-[#ff950e] text-black font-medium' : 'text-gray-300 hover:bg-[#1a1a1a]'}`}
                  >
                    16. No Endorsement of Sellers or Products
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('dispute-resolution')}
                    className={`text-left w-full py-1 px-2 rounded transition ${activeSection === 'dispute-resolution' ? 'bg-[#ff950e] text-black font-medium' : 'text-gray-300 hover:bg-[#1a1a1a]'}`}
                  >
                    17. Dispute Resolution and Arbitration
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('force-majeure')}
                    className={`text-left w-full py-1 px-2 rounded transition ${activeSection === 'force-majeure' ? 'bg-[#ff950e] text-black font-medium' : 'text-gray-300 hover:bg-[#1a1a1a]'}`}
                  >
                    18. Force Majeure
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('limited-liability')}
                    className={`text-left w-full py-1 px-2 rounded transition ${activeSection === 'limited-liability' ? 'bg-[#ff950e] text-black font-medium' : 'text-gray-300 hover:bg-[#1a1a1a]'}`}
                  >
                    19. Limited Liability
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('disclaimer-warranties')}
                    className={`text-left w-full py-1 px-2 rounded transition ${activeSection === 'disclaimer-warranties' ? 'bg-[#ff950e] text-black font-medium' : 'text-gray-300 hover:bg-[#1a1a1a]'}`}
                  >
                    20. Disclaimer of Warranties
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('data-protection')}
                    className={`text-left w-full py-1 px-2 rounded transition ${activeSection === 'data-protection' ? 'bg-[#ff950e] text-black font-medium' : 'text-gray-300 hover:bg-[#1a1a1a]'}`}
                  >
                    21. Data Protection and Privacy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('intellectual-property')}
                    className={`text-left w-full py-1 px-2 rounded transition ${activeSection === 'intellectual-property' ? 'bg-[#ff950e] text-black font-medium' : 'text-gray-300 hover:bg-[#1a1a1a]'}`}
                  >
                    22. Intellectual Property
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('prohibited-uses')}
                    className={`text-left w-full py-1 px-2 rounded transition ${activeSection === 'prohibited-uses' ? 'bg-[#ff950e] text-black font-medium' : 'text-gray-300 hover:bg-[#1a1a1a]'}`}
                  >
                    23. Prohibited Uses
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('third-party-services')}
                    className={`text-left w-full py-1 px-2 rounded transition ${activeSection === 'third-party-services' ? 'bg-[#ff950e] text-black font-medium' : 'text-gray-300 hover:bg-[#1a1a1a]'}`}
                  >
                    24. Third-Party Services and Links
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('termination')}
                    className={`text-left w-full py-1 px-2 rounded transition ${activeSection === 'termination' ? 'bg-[#ff950e] text-black font-medium' : 'text-gray-300 hover:bg-[#1a1a1a]'}`}
                  >
                    25. Termination of Accounts
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('taxes')}
                    className={`text-left w-full py-1 px-2 rounded transition ${activeSection === 'taxes' ? 'bg-[#ff950e] text-black font-medium' : 'text-gray-300 hover:bg-[#1a1a1a]'}`}
                  >
                    26. User Responsibility for Taxes
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('reporting')}
                    className={`text-left w-full py-1 px-2 rounded transition ${activeSection === 'reporting' ? 'bg-[#ff950e] text-black font-medium' : 'text-gray-300 hover:bg-[#1a1a1a]'}`}
                  >
                    27. Reporting Violations and Illegal Activity
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('illegal-activity')}
                    className={`text-left w-full py-1 px-2 rounded transition ${activeSection === 'illegal-activity' ? 'bg-[#ff950e] text-black font-medium' : 'text-gray-300 hover:bg-[#1a1a1a]'}`}
                  >
                    28. Disclaimer Regarding Illegal Activity
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('severability')}
                    className={`text-left w-full py-1 px-2 rounded transition ${activeSection === 'severability' ? 'bg-[#ff950e] text-black font-medium' : 'text-gray-300 hover:bg-[#1a1a1a]'}`}
                  >
                    29. Severability
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('modifications')}
                    className={`text-left w-full py-1 px-2 rounded transition ${activeSection === 'modifications' ? 'bg-[#ff950e] text-black font-medium' : 'text-gray-300 hover:bg-[#1a1a1a]'}`}
                  >
                    30. Modifications to the Platform
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('entire-agreement')}
                    className={`text-left w-full py-1 px-2 rounded transition ${activeSection === 'entire-agreement' ? 'bg-[#ff950e] text-black font-medium' : 'text-gray-300 hover:bg-[#1a1a1a]'}`}
                  >
                    31. Entire Agreement
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('acceptance')}
                    className={`text-left w-full py-1 px-2 rounded transition ${activeSection === 'acceptance' ? 'bg-[#ff950e] text-black font-medium' : 'text-gray-300 hover:bg-[#1a1a1a]'}`}
                  >
                    32. Acceptance of Terms
                  </button>
                </li>
              </ul>
              <div className="mt-6 border-t border-gray-800 pt-4">
                <p className="text-xs text-gray-400">Last Updated: October 1, 2024</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:w-3/4">
            <div className="bg-[#121212] rounded-xl p-6 md:p-8 shadow-xl">
              {/* Introduction */}
              <section id="introduction" className="mb-8">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleSection('introduction')}
                >
                  <h2 className="text-2xl font-bold text-white">Terms & Conditions</h2>
                  {expandedSections.introduction ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </div>
                
                {expandedSections.introduction && (
                  <div className="mt-4 space-y-4 text-gray-300 leading-relaxed">
                    <p className="text-[#ff950e] font-medium">
                      Effective Date: 1st October 2024
                    </p>
                    <p>
                      Welcome to Panty Post. By accessing or using our website, products, or services, you agree to comply with and be bound by these Terms and Conditions. If you do not agree to these Terms, you may not use the Service. These Terms govern your use of the Panty Post platform, which facilitates the sale of panties (new or used) by women to consenting adult buyers.
                    </p>
                  </div>
                )}
              </section>

              {/* Eligibility */}
              <section id="eligibility" className="mb-8 border-t border-gray-800 pt-6">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleSection('eligibility')}
                >
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="bg-[#1a1a1a] text-[#ff950e] rounded-full w-8 h-8 inline-flex items-center justify-center mr-3 flex-shrink-0">1</span>
                    Eligibility
                  </h2>
                  {expandedSections.eligibility ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </div>
                
                {expandedSections.eligibility && (
                  <div className="pl-11 mt-4 space-y-6">
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">1.1. Age Requirement</h3>
                      <p className="text-gray-300 leading-relaxed">
                        To register and use the Service, all users must be at least 21 years old. By creating an account, you confirm that you are 21 years of age or older. All buyers must be over the age of 21 years.
                      </p>
                    </div>
                    
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">1.2. Legal Compliance</h3>
                      <p className="text-gray-300 leading-relaxed">
                        Users are solely responsible for ensuring that their use of the Service complies with all applicable local, state, national, and international laws and regulations, including those regarding the sale of adult content and sexual products.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* User Accounts */}
              <section id="user-accounts" className="mb-8 border-t border-gray-800 pt-6">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleSection('user-accounts')}
                >
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="bg-[#1a1a1a] text-[#ff950e] rounded-full w-8 h-8 inline-flex items-center justify-center mr-3 flex-shrink-0">2</span>
                    User Accounts
                  </h2>
                  {expandedSections['user-accounts'] ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </div>
                
                {expandedSections['user-accounts'] && (
                  <div className="pl-11 mt-4 space-y-6">
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">2.1. Registration</h3>
                      <p className="text-gray-300 leading-relaxed">
                        To use certain features of the Service, sellers and buyers must create an account by providing accurate, current, and complete information. Failure to provide accurate details may result in suspension or termination of your account.
                      </p>
                    </div>
                    
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">2.2. Account Security</h3>
                      <p className="text-gray-300 leading-relaxed">
                        You are responsible for maintaining the confidentiality of your account credentials. Any activity conducted under your account is your responsibility. You must immediately notify us of any unauthorized use of your account.
                      </p>
                    </div>
                    
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">2.3. Account Suspension or Termination</h3>
                      <p className="text-gray-300 leading-relaxed">
                        We reserve the right to suspend or terminate any account at our sole discretion, especially in cases of misconduct, fraudulent activity, or violations of these Terms.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* Content and Listings */}
              <section id="content-listings" className="mb-8 border-t border-gray-800 pt-6">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleSection('content-listings')}
                >
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="bg-[#1a1a1a] text-[#ff950e] rounded-full w-8 h-8 inline-flex items-center justify-center mr-3 flex-shrink-0">3</span>
                    Content and Listings
                  </h2>
                  {expandedSections['content-listings'] ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </div>
                
                {expandedSections['content-listings'] && (
                  <div className="pl-11 mt-4 space-y-6">
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">3.1. Seller Responsibilities</h3>
                      <p className="text-gray-300 leading-relaxed">
                        Sellers are responsible for the accuracy of all listings, including descriptions, photos, and any representations of the items being sold. Listings must be legal and comply with the Service's guidelines.
                      </p>
                    </div>
                    
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">3.2. Prohibited Items</h3>
                      <p className="text-gray-300 leading-relaxed">
                        Any items prohibited by law or that may be deemed harmful or dangerous are strictly prohibited from being sold on the platform. This includes any materials that violate local or international law regarding sexual content or trafficking.
                      </p>
                    </div>
                    
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">3.4. Content Ownership</h3>
                      <p className="text-gray-300 leading-relaxed">
                        By listing products on the platform, sellers retain ownership of the content they upload but grant Panty Post a worldwide, non-exclusive, royalty-free license to use, display, and distribute the content for promotional purposes.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* Transactions and Payments */}
              <section id="transactions" className="mb-8 border-t border-gray-800 pt-6">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleSection('transactions')}
                >
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="bg-[#1a1a1a] text-[#ff950e] rounded-full w-8 h-8 inline-flex items-center justify-center mr-3 flex-shrink-0">4</span>
                    Transactions and Payments
                  </h2>
                  {expandedSections['transactions'] ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </div>
                
                {expandedSections['transactions'] && (
                  <div className="pl-11 mt-4 space-y-6">
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">4.1. Pricing</h3>
                      <p className="text-gray-300 leading-relaxed">
                        Sellers are free to set the price for their items. Prices must be fair and comply with any applicable legal pricing regulations.
                      </p>
                    </div>
                    
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">4.2. Payment Processing</h3>
                      <p className="text-gray-300 leading-relaxed">
                        We use third-party payment processors for all financial transactions. By using the platform, you agree to the terms and conditions of the payment processor. Panty Post is not responsible for payment disputes between users and the payment processor.
                      </p>
                    </div>
                    
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">4.3. Fees</h3>
                      <p className="text-gray-300 leading-relaxed">
                        Panty Post charges a commission on each sale made through the platform. The current fee structure is outlined on our website and may change from time to time. Sellers agree to these fees upon listing items for sale.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* Shipping and Delivery */}
              <section id="shipping" className="mb-8 border-t border-gray-800 pt-6">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleSection('shipping')}
                >
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="bg-[#1a1a1a] text-[#ff950e] rounded-full w-8 h-8 inline-flex items-center justify-center mr-3 flex-shrink-0">5</span>
                    Shipping and Delivery
                  </h2>
                  {expandedSections['shipping'] ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </div>
                
                {expandedSections['shipping'] && (
                  <div className="pl-11 mt-4 space-y-6">
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">5.1. Seller's Responsibility</h3>
                      <p className="text-gray-300 leading-relaxed">
                        Sellers are responsible for ensuring that sold items are shipped promptly and discreetly to the buyer's address. The condition, hygiene, and packaging of the items must meet the buyer's expectations as described in the listing.
                      </p>
                    </div>
                    
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">5.2. Delivery Issues</h3>
                      <p className="text-gray-300 leading-relaxed">
                        Panty Post is not responsible for any issues related to the shipping or delivery of items, including lost or damaged packages. Disputes related to shipping must be resolved between the buyer and the seller directly.
                      </p>
                    </div>
                    
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">5.3. Tracking Number Requirement and Delivery Disputes</h3>
                      <p className="text-gray-300 leading-relaxed">
                        Sellers are required to include a valid tracking number when shipping an order. If a seller does not provide a tracking number and the buyer disputes the order, claiming the package was not delivered, the buyer will be eligible for a full refund.
                      </p>
                      <p className="text-gray-300 leading-relaxed mt-2">
                        If the seller provides a tracking number, and the tracking information indicates that the parcel has been marked as "Delivered" to the buyer's specified address, the order will be considered completed. Under these circumstances, the buyer cannot dispute the order or claim non-receipt of the package. It will be assumed that the delivery was legitimate, and no refunds will be issued.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* Returns and Refunds */}
              <section id="returns" className="mb-8 border-t border-gray-800 pt-6">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleSection('returns')}
                >
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="bg-[#1a1a1a] text-[#ff950e] rounded-full w-8 h-8 inline-flex items-center justify-center mr-3 flex-shrink-0">6</span>
                    Returns and Refunds
                  </h2>
                  {expandedSections['returns'] ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </div>
                
                {expandedSections['returns'] && (
                  <div className="pl-11 mt-4 space-y-6">
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">6.1. No Returns</h3>
                      <p className="text-gray-300 leading-relaxed">
                        Due to the nature of the products sold on Panty Post, returns are not accepted under any circumstances. Buyers are encouraged to carefully review listings before purchasing.
                      </p>
                    </div>
                    
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">6.2. Refunds</h3>
                      <p className="text-gray-300 leading-relaxed">
                        Refunds are only issued in exceptional cases, such as if the seller fails to deliver the product or if the product significantly differs from described. All refund requests must be made through Panty Post's support team.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* User Conduct */}
              <section id="user-conduct" className="mb-8 border-t border-gray-800 pt-6">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleSection('user-conduct')}
                >
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="bg-[#1a1a1a] text-[#ff950e] rounded-full w-8 h-8 inline-flex items-center justify-center mr-3 flex-shrink-0">7</span>
                    User Conduct
                  </h2>
                  {expandedSections['user-conduct'] ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </div>
                
                {expandedSections['user-conduct'] && (
                  <div className="pl-11 mt-4 space-y-6">
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">7.1. Prohibited Conduct</h3>
                      <p className="text-gray-300 leading-relaxed mb-3">
                        Users must not engage in any of the following activities:
                      </p>
                      <ul className="list-disc pl-5 text-gray-300 space-y-1">
                        <li>Harassing, bullying, or threatening other users</li>
                        <li>Engaging in illegal activity</li>
                        <li>Sending unsolicited or explicit messages to other users</li>
                        <li>Listing or attempting to sell any prohibited items</li>
                        <li>Misrepresenting the nature of the products being sold</li>
                      </ul>
                    </div>
                    
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">7.2. Community Guidelines</h3>
                      <p className="text-gray-300 leading-relaxed">
                        Users must adhere to the community guidelines, which aim to create a respectful and safe environment for all participants. Any violations may result in account suspension or termination.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* Privacy Policy */}
              <section id="privacy" className="mb-8 border-t border-gray-800 pt-6">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleSection('privacy')}
                >
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="bg-[#1a1a1a] text-[#ff950e] rounded-full w-8 h-8 inline-flex items-center justify-center mr-3 flex-shrink-0">8</span>
                    Privacy Policy
                  </h2>
                  {expandedSections['privacy'] ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </div>
                
                {expandedSections['privacy'] && (
                  <div className="pl-11 mt-4">
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <p className="text-gray-300 leading-relaxed">
                        Your use of Panty Post is also governed by our Privacy Policy, which explains how we collect, use, and share your personal information. By using the Service, you agree to the terms of the Privacy Policy.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* Limitation of Liability */}
              <section id="liability" className="mb-8 border-t border-gray-800 pt-6">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleSection('liability')}
                >
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="bg-[#1a1a1a] text-[#ff950e] rounded-full w-8 h-8 inline-flex items-center justify-center mr-3 flex-shrink-0">9</span>
                    Limitation of Liability
                  </h2>
                  {expandedSections['liability'] ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </div>
                
                {expandedSections['liability'] && (
                  <div className="pl-11 mt-4">
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <p className="text-gray-300 leading-relaxed">
                        Panty Post is not liable for any direct, indirect, incidental, or consequential damages arising from the use of the platform, including, but not limited to, issues related to product quality, delivery, or third-party services. Your use of the Service is at your own risk.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* Indemnification */}
              <section id="indemnification" className="mb-8 border-t border-gray-800 pt-6">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleSection('indemnification')}
                >
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="bg-[#1a1a1a] text-[#ff950e] rounded-full w-8 h-8 inline-flex items-center justify-center mr-3 flex-shrink-0">10</span>
                    Indemnification
                  </h2>
                  {expandedSections['indemnification'] ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </div>
                
                {expandedSections['indemnification'] && (
                  <div className="pl-11 mt-4">
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <p className="text-gray-300 leading-relaxed">
                        You agree to indemnify, defend, and hold harmless Panty Post, its affiliates, officers, directors, and employees from any claims, damages, liabilities, or expenses arising out of your use of the platform or violation of these Terms.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* Amendments */}
              <section id="amendments" className="mb-8 border-t border-gray-800 pt-6">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleSection('amendments')}
                >
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="bg-[#1a1a1a] text-[#ff950e] rounded-full w-8 h-8 inline-flex items-center justify-center mr-3 flex-shrink-0">11</span>
                    Amendments
                  </h2>
                  {expandedSections['amendments'] ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </div>
                
                {expandedSections['amendments'] && (
                  <div className="pl-11 mt-4">
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <p className="text-gray-300 leading-relaxed">
                        Panty Post reserves the right to modify or update these Terms at any time. Changes will be effective immediately upon posting to the website. Continued use of the Service constitutes acceptance of the revised Terms.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* Governing Law */}
              <section id="governing-law" className="mb-8 border-t border-gray-800 pt-6">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleSection('governing-law')}
                >
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="bg-[#1a1a1a] text-[#ff950e] rounded-full w-8 h-8 inline-flex items-center justify-center mr-3 flex-shrink-0">12</span>
                    Governing Law
                  </h2>
                  {expandedSections['governing-law'] ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </div>
                
                {expandedSections['governing-law'] && (
                  <div className="pl-11 mt-4">
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <p className="text-gray-300 leading-relaxed">
                        These Terms and your use of Panty Post are governed by the laws of Australia. Any legal disputes will be resolved in the courts of Australia.
                      </p>
                      <p className="text-gray-300 leading-relaxed mt-2">
                        If you have any questions regarding these Terms and Conditions, please contact us at pantypostbranding@gmail.com
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* Health and Safety */}
              <section id="health-safety" className="mb-8 border-t border-gray-800 pt-6">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleSection('health-safety')}
                >
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="bg-[#1a1a1a] text-[#ff950e] rounded-full w-8 h-8 inline-flex items-center justify-center mr-3 flex-shrink-0">13</span>
                    Health and Safety
                  </h2>
                  {expandedSections['health-safety'] ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </div>
                
                {expandedSections['health-safety'] && (
                  <div className="pl-11 mt-4 space-y-6">
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">13.1. No Health Warranties</h3>
                      <p className="text-gray-300 leading-relaxed">
                        Panty Post and its sellers make no warranties, express or implied, regarding the health or safety of any items sold through the platform. Buyers acknowledge that they are purchasing used intimate products at their own risk, and Panty Post makes no representations regarding the sanitary conditions of these items.
                      </p>
                    </div>
                    
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">13.2. Risk of Exposure</h3>
                      <p className="text-gray-300 leading-relaxed">
                        Buyers understand that by purchasing used intimate apparel, there may be a potential risk of exposure to sexually transmitted infections (STIs) or other health-related concerns. Panty Post is not responsible for any health issues or infections resulting from the use or handling of any products sold through the platform.
                      </p>
                    </div>

                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">13.3. No Medical Claims</h3>
                      <p className="text-gray-300 leading-relaxed">
                        Panty Post does not provide any medical advice or guarantee the hygiene of products sold on the platform. Buyers are encouraged to take appropriate precautions when handling and using products, and it is recommended that buyers seek medical advice or consult with a healthcare professional for any concerns related to product usage.
                      </p>
                    </div>

                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">13.4. Limitation of Liability</h3>
                      <p className="text-gray-300 leading-relaxed">
                        Panty Post shall not be held liable for any damages, claims, or health-related issues, including but not limited to sexually transmitted infections, that arise from the purchase, handling, or use of any products sold through the platform. By using the Service, buyers agree to release Panty Post from any claims or liability related to the transmission of infections or any other health concerns.
                      </p>
                    </div>

                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">13.5. Health Assurance and Biohazard Safety</h3>
                      <p className="text-gray-300 leading-relaxed">
                        Sellers affirm that they do not have any sexually transmitted infections (STIs), sexually transmitted diseases (STDs), or other infectious conditions that could pose a health risk to buyers. Furthermore, sellers confirm that to the best of their knowledge, they and/or their sexual partners are free from any such conditions. This assurance is necessary to prevent the listed items from being classified as biohazards or otherwise harmful for shipping or handling by buyers.
                      </p>
                      <p className="text-gray-300 leading-relaxed mt-2">
                        Any violation of this clause may result in immediate suspension or termination of the seller's account, as well as potential legal action or liability for harm caused.
                      </p>
                    </div>
                  </div>
                )}
              </section>{/* Assumption of Risk */}
              <section id="risk" className="mb-8 border-t border-gray-800 pt-6">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleSection('risk')}
                >
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="bg-[#1a1a1a] text-[#ff950e] rounded-full w-8 h-8 inline-flex items-center justify-center mr-3 flex-shrink-0">14</span>
                    Assumption of Risk
                  </h2>
                  {expandedSections['risk'] ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </div>
                
                {expandedSections['risk'] && (
                  <div className="pl-11 mt-4 space-y-6">
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">14.1. Voluntary Participation</h3>
                      <p className="text-gray-300 leading-relaxed">
                        Buyers and sellers acknowledge that they are voluntarily participating in a platform for the exchange of used intimate products. They agree that they are solely responsible for understanding the risks associated with this type of transaction, including but not limited to health risks, legal issues, and personal discomfort.
                      </p>
                    </div>
                    
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">14.2. No Guarantee of Legality in Specific Jurisdictions</h3>
                      <p className="text-gray-300 leading-relaxed">
                        Panty Post operates as an online platform and cannot guarantee that the sale or purchase of used intimate items is legal in every jurisdiction. It is the responsibility of each user to understand and comply with the laws in their local area. Panty Post disclaims any responsibility for legal repercussions resulting from the use of the platform in areas where such sales are restricted or prohibited.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* User Responsibility for Legal Compliance */}
              <section id="legal-compliance" className="mb-8 border-t border-gray-800 pt-6">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleSection('legal-compliance')}
                >
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="bg-[#1a1a1a] text-[#ff950e] rounded-full w-8 h-8 inline-flex items-center justify-center mr-3 flex-shrink-0">15</span>
                    User Responsibility for Legal Compliance
                  </h2>
                  {expandedSections['legal-compliance'] ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </div>
                
                {expandedSections['legal-compliance'] && (
                  <div className="pl-11 mt-4 space-y-6">
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">15.1. Local Laws and Regulations</h3>
                      <p className="text-gray-300 leading-relaxed">
                        Users (both buyers and sellers) are responsible for ensuring that their participation in Panty Post complies with all applicable local, state, national, and international laws, including but not limited to those related to the sale of adult materials, sexual products, or used intimate apparel. Panty Post is not responsible for any legal action taken against users due to their violation of such laws.
                      </p>
                    </div>
                    
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">15.2. Indemnification</h3>
                      <p className="text-gray-300 leading-relaxed">
                        Users agree to indemnify and hold harmless Panty Post, its owners, directors, employees, and affiliates from any and all claims, legal actions, damages, or losses arising out of the users' violation of laws or regulations, or any breach of these Terms and Conditions.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* No Endorsement of Sellers or Products */}
              <section id="no-endorsement" className="mb-8 border-t border-gray-800 pt-6">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleSection('no-endorsement')}
                >
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="bg-[#1a1a1a] text-[#ff950e] rounded-full w-8 h-8 inline-flex items-center justify-center mr-3 flex-shrink-0">16</span>
                    No Endorsement of Sellers or Products
                  </h2>
                  {expandedSections['no-endorsement'] ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </div>
                
                {expandedSections['no-endorsement'] && (
                  <div className="pl-11 mt-4">
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">16.1. No Screening of Sellers or Products</h3>
                      <p className="text-gray-300 leading-relaxed">
                        Panty Post does not conduct background checks, health screenings, or any form of vetting for sellers or their products. By using the platform, buyers understand that Panty Post is simply an intermediary, and the platform is not responsible for the content, quality, or condition of any products sold. Any issues or disputes regarding product quality or authenticity must be handled directly between buyers and sellers.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* Dispute Resolution and Arbitration */}
              <section id="dispute-resolution" className="mb-8 border-t border-gray-800 pt-6">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleSection('dispute-resolution')}
                >
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="bg-[#1a1a1a] text-[#ff950e] rounded-full w-8 h-8 inline-flex items-center justify-center mr-3 flex-shrink-0">17</span>
                    Dispute Resolution and Arbitration
                  </h2>
                  {expandedSections['dispute-resolution'] ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </div>
                
                {expandedSections['dispute-resolution'] && (
                  <div className="pl-11 mt-4 space-y-6">
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">17.1. Mandatory Arbitration</h3>
                      <p className="text-gray-300 leading-relaxed">
                        In the event of a legal dispute between users and Panty Post, the parties agree to resolve the dispute through binding arbitration rather than in court. Any arbitration will take place in [insert jurisdiction], and the decision of the arbitrator will be final and binding. Each party is responsible for its own legal costs unless otherwise determined by the arbitrator.
                      </p>
                    </div>
                    
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">17.2. Class Action Waiver</h3>
                      <p className="text-gray-300 leading-relaxed">
                        Users agree to resolve any disputes individually and waive their right to participate in any class-action lawsuit against Panty Post.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* Force Majeure */}
              <section id="force-majeure" className="mb-8 border-t border-gray-800 pt-6">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleSection('force-majeure')}
                >
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="bg-[#1a1a1a] text-[#ff950e] rounded-full w-8 h-8 inline-flex items-center justify-center mr-3 flex-shrink-0">18</span>
                    Force Majeure
                  </h2>
                  {expandedSections['force-majeure'] ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </div>
                
                {expandedSections['force-majeure'] && (
                  <div className="pl-11 mt-4">
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">18.1. Unforeseen Circumstances</h3>
                      <p className="text-gray-300 leading-relaxed">
                        Panty Post shall not be held liable for any failure to perform its obligations under these Terms due to circumstances beyond its reasonable control, including but not limited to natural disasters, acts of government, war, terrorism, labor disputes, or other events of "force majeure." This includes the inability to provide the platform due to technical failures or interruptions in services.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* Limited Liability */}
              <section id="limited-liability" className="mb-8 border-t border-gray-800 pt-6">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleSection('limited-liability')}
                >
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="bg-[#1a1a1a] text-[#ff950e] rounded-full w-8 h-8 inline-flex items-center justify-center mr-3 flex-shrink-0">19</span>
                    Limited Liability
                  </h2>
                  {expandedSections['limited-liability'] ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </div>
                
                {expandedSections['limited-liability'] && (
                  <div className="pl-11 mt-4 space-y-6">
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">19.1. Liability Cap</h3>
                      <p className="text-gray-300 leading-relaxed">
                        Panty Post's total liability to any user for any claim arising out of or relating to the use of the platform is limited to the total amount paid by the user to Panty Post over the past 12 months, or AUD [insert appropriate amount], whichever is lower.
                      </p>
                    </div>
                    
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">19.2. Exclusion of Certain Damages</h3>
                      <p className="text-gray-300 leading-relaxed">
                        In no event shall Panty Post be liable for any indirect, incidental, punitive, or consequential damages arising out of or in connection with the use of the platform, even if Panty Post has been advised of the possibility of such damages.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* Disclaimer of Warranties */}
              <section id="disclaimer-warranties" className="mb-8 border-t border-gray-800 pt-6">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleSection('disclaimer-warranties')}
                >
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="bg-[#1a1a1a] text-[#ff950e] rounded-full w-8 h-8 inline-flex items-center justify-center mr-3 flex-shrink-0">20</span>
                    Disclaimer of Warranties
                  </h2>
                  {expandedSections['disclaimer-warranties'] ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </div>
                
                {expandedSections['disclaimer-warranties'] && (
                  <div className="pl-11 mt-4">
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">20.1. Platform Provided "As Is"</h3>
                      <p className="text-gray-300 leading-relaxed">
                        Panty Post makes no warranties, express or implied, regarding the functionality, reliability, or availability of the platform. The service is provided "as is" without any warranties of merchantability, fitness for a particular purpose, or non-infringement.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* Data Protection and Privacy */}
              <section id="data-protection" className="mb-8 border-t border-gray-800 pt-6">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleSection('data-protection')}
                >
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="bg-[#1a1a1a] text-[#ff950e] rounded-full w-8 h-8 inline-flex items-center justify-center mr-3 flex-shrink-0">21</span>
                    Data Protection and Privacy
                  </h2>
                  {expandedSections['data-protection'] ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </div>
                
                {expandedSections['data-protection'] && (
                  <div className="pl-11 mt-4">
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">21.1. User Data Protection</h3>
                      <p className="text-gray-300 leading-relaxed">
                        While Panty Post takes reasonable measures to protect user data, we cannot guarantee absolute security. Users acknowledge and accept that any personal information shared on the platform may be at risk of unauthorized access or disclosure, and Panty Post is not liable for such incidents unless caused by gross negligence.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* Intellectual Property */}
              <section id="intellectual-property" className="mb-8 border-t border-gray-800 pt-6">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleSection('intellectual-property')}
                >
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="bg-[#1a1a1a] text-[#ff950e] rounded-full w-8 h-8 inline-flex items-center justify-center mr-3 flex-shrink-0">22</span>
                    Intellectual Property
                  </h2>
                  {expandedSections['intellectual-property'] ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </div>
                
                {expandedSections['intellectual-property'] && (
                  <div className="pl-11 mt-4 space-y-6">
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">22.1. Ownership of Platform Content</h3>
                      <p className="text-gray-300 leading-relaxed">
                        All content on the Panty Post platform, including but not limited to text, images, graphics, logos, trademarks, and software, is owned by or licensed to Panty Post. Users are not permitted to use, copy, reproduce, or distribute any content from the platform without express written permission from Panty Post.
                      </p>
                    </div>
                    
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">22.2. User Content</h3>
                      <p className="text-gray-300 leading-relaxed">
                        By uploading content to Panty Post, including product images or descriptions, users grant Panty Post a non-exclusive, royalty-free, worldwide license to use, reproduce, modify, adapt, and display such content for the purpose of operating the platform. Users retain ownership of their content but agree not to upload anything that infringes on the intellectual property rights of others.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* Prohibited Uses */}
              <section id="prohibited-uses" className="mb-8 border-t border-gray-800 pt-6">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleSection('prohibited-uses')}
                >
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="bg-[#1a1a1a] text-[#ff950e] rounded-full w-8 h-8 inline-flex items-center justify-center mr-3 flex-shrink-0">23</span>
                    Prohibited Uses
                  </h2>
                  {expandedSections['prohibited-uses'] ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </div>
                
                {expandedSections['prohibited-uses'] && (
                  <div className="pl-11 mt-4 space-y-6">
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">23.1. Misuse of the Platform</h3>
                      <p className="text-gray-300 leading-relaxed mb-3">
                        Users agree not to use the platform for any illegal or unauthorized purpose, including but not limited to:
                      </p>
                      <ul className="list-disc pl-5 text-gray-300 space-y-1">
                        <li>Engaging in any form of fraud or misrepresentation</li>
                        <li>Harassing or abusing other users</li>
                        <li>Sending unsolicited or inappropriate messages</li>
                        <li>Posting misleading or inaccurate listings</li>
                        <li>Attempting to hack or disrupt the platform's systems</li>
                        <li>Using the platform for money laundering or other financial crimes</li>
                        <li>Engaging in any form of prostitution, solicitation, or escort services</li>
                      </ul>
                    </div>
                    
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">23.2. Breach of Terms</h3>
                      <p className="text-gray-300 leading-relaxed">
                        Any violation of these prohibited uses will result in immediate termination of the user's account and potential legal action by Panty Post. Panty Post reserves the right to cooperate with law enforcement agencies and provide any necessary information to assist in investigations.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* Third-Party Services and Links */}
              <section id="third-party-services" className="mb-8 border-t border-gray-800 pt-6">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleSection('third-party-services')}
                >
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="bg-[#1a1a1a] text-[#ff950e] rounded-full w-8 h-8 inline-flex items-center justify-center mr-3 flex-shrink-0">24</span>
                    Third-Party Services and Links
                  </h2>
                  {expandedSections['third-party-services'] ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </div>
                
                {expandedSections['third-party-services'] && (
                  <div className="pl-11 mt-4 space-y-6">
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">24.1. Third-Party Integrations</h3>
                      <p className="text-gray-300 leading-relaxed">
                        Panty Post may use third-party services, such as payment processors, shipping providers, or communication tools, to facilitate transactions. While we aim to work with reliable partners, Panty Post is not responsible for any issues or disputes arising from the use of these third-party services. Users agree to abide by the terms and conditions of these third-party providers.
                      </p>
                    </div>
                    
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">24.2. External Links</h3>
                      <p className="text-gray-300 leading-relaxed">
                        The platform may contain links to external websites or resources. Panty Post is not responsible for the content or practices of these third-party websites. Users acknowledge that they access third-party websites at their own risk.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* Termination of Accounts */}
              <section id="termination" className="mb-8 border-t border-gray-800 pt-6">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleSection('termination')}
                >
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="bg-[#1a1a1a] text-[#ff950e] rounded-full w-8 h-8 inline-flex items-center justify-center mr-3 flex-shrink-0">25</span>
                    Termination of Accounts
                  </h2>
                  {expandedSections['termination'] ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </div>
                
                {expandedSections['termination'] && (
                  <div className="pl-11 mt-4 space-y-6">
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">25.1. Right to Terminate</h3>
                      <p className="text-gray-300 leading-relaxed">
                        Panty Post reserves the right to terminate or suspend any user's account at its discretion, without prior notice, if the user violates these Terms and Conditions or engages in behavior that harms the platform's reputation or operation.
                      </p>
                    </div>
                    
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">25.2. Effect of Termination</h3>
                      <p className="text-gray-300 leading-relaxed">
                        If a user's account is terminated, they will lose access to the platform and any pending or in-process transactions will be canceled. Panty Post is not responsible for any loss of data, listings, or communications as a result of account termination.
                      </p>
                    </div>
                    
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">25.3. Survival of Terms</h3>
                      <p className="text-gray-300 leading-relaxed">
                        Provisions related to intellectual property, limitation of liability, indemnification, and dispute resolution shall survive the termination of the user's account.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* User Responsibility for Taxes */}
              <section id="taxes" className="mb-8 border-t border-gray-800 pt-6">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleSection('taxes')}
                >
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="bg-[#1a1a1a] text-[#ff950e] rounded-full w-8 h-8 inline-flex items-center justify-center mr-3 flex-shrink-0">26</span>
                    User Responsibility for Taxes
                  </h2>
                  {expandedSections['taxes'] ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </div>
                
                {expandedSections['taxes'] && (
                  <div className="pl-11 mt-4 space-y-6">
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">26.1. Seller Tax Responsibility</h3>
                      <p className="text-gray-300 leading-relaxed">
                        Sellers are responsible for determining and paying any applicable taxes associated with their sales on Panty Post. Panty Post does not provide tax advice or handle tax filings on behalf of sellers. It is the seller's responsibility to comply with local tax laws and regulations, including income, sales, and value-added taxes (VAT).
                      </p>
                    </div>
                    
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">26.2. Buyer Tax Responsibility</h3>
                      <p className="text-gray-300 leading-relaxed">
                        Buyers may be responsible for any customs duties, taxes, or import fees associated with purchasing products from sellers in different regions or countries. Panty Post is not responsible for these additional costs.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* Reporting Violations and Illegal Activity */}
              <section id="reporting" className="mb-8 border-t border-gray-800 pt-6">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleSection('reporting')}
                >
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="bg-[#1a1a1a] text-[#ff950e] rounded-full w-8 h-8 inline-flex items-center justify-center mr-3 flex-shrink-0">27</span>
                    Reporting Violations and Illegal Activity
                  </h2>
                  {expandedSections['reporting'] ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </div>
                
                {expandedSections['reporting'] && (
                  <div className="pl-11 mt-4">
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">27.1. Reporting</h3>
                      <p className="text-gray-300 leading-relaxed">
                        If you believe another user is violating these Terms and Conditions, engaging in illegal activity, or attempting to defraud others, you should report this behavior to Panty Post immediately through our email at pantypostbranding@gmail.com. We take violations seriously and will investigate all reports in accordance with our policy.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* Disclaimer Regarding Illegal Activity */}
              <section id="illegal-activity" className="mb-8 border-t border-gray-800 pt-6">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleSection('illegal-activity')}
                >
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="bg-[#1a1a1a] text-[#ff950e] rounded-full w-8 h-8 inline-flex items-center justify-center mr-3 flex-shrink-0">28</span>
                    Disclaimer Regarding Illegal Activity
                  </h2>
                  {expandedSections['illegal-activity'] ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </div>
                
                {expandedSections['illegal-activity'] && (
                  <div className="pl-11 mt-4">
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">28.1. No Facilitation of Illegal Acts</h3>
                      <p className="text-gray-300 leading-relaxed">
                        Panty Post does not support or facilitate any illegal activities. Any users found to be engaging in unlawful actions, including but not limited to the solicitation of illegal services, the sale of contraband items, or engaging in fraud, will be immediately banned from the platform and reported to law enforcement authorities.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* Severability */}
              <section id="severability" className="mb-8 border-t border-gray-800 pt-6">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleSection('severability')}
                >
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="bg-[#1a1a1a] text-[#ff950e] rounded-full w-8 h-8 inline-flex items-center justify-center mr-3 flex-shrink-0">29</span>
                    Severability
                  </h2>
                  {expandedSections['severability'] ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </div>
                
                {expandedSections['severability'] && (
                  <div className="pl-11 mt-4">
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">29.1. Enforceability of Provisions</h3>
                      <p className="text-gray-300 leading-relaxed">
                        If any provision of these Terms and Conditions is found to be unenforceable or invalid under applicable law, such provision will be modified to reflect the parties' intention as closely as possible. The remaining provisions of these Terms and Conditions shall continue in full force and effect.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* Modifications to the Platform */}
              <section id="modifications" className="mb-8 border-t border-gray-800 pt-6">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleSection('modifications')}
                >
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="bg-[#1a1a1a] text-[#ff950e] rounded-full w-8 h-8 inline-flex items-center justify-center mr-3 flex-shrink-0">30</span>
                    Modifications to the Platform
                  </h2>
                  {expandedSections['modifications'] ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </div>
                
                {expandedSections['modifications'] && (
                  <div className="pl-11 mt-4">
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">30.1. Changes to the Service</h3>
                      <p className="text-gray-300 leading-relaxed">
                        Panty Post reserves the right to modify, update, or discontinue any aspect of the platform at any time without notice. Panty Post will not be held liable for any losses or damages resulting from changes to or the termination of services.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* Entire Agreement */}
              <section id="entire-agreement" className="mb-8 border-t border-gray-800 pt-6">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleSection('entire-agreement')}
                >
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="bg-[#1a1a1a] text-[#ff950e] rounded-full w-8 h-8 inline-flex items-center justify-center mr-3 flex-shrink-0">31</span>
                    Entire Agreement
                  </h2>
                  {expandedSections['entire-agreement'] ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </div>
                
                {expandedSections['entire-agreement'] && (
                  <div className="pl-11 mt-4">
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">31.1. Complete Understanding</h3>
                      <p className="text-gray-300 leading-relaxed">
                        These Terms and Conditions, along with any policies or guidelines posted on the platform, constitute the entire agreement between Panty Post and its users. This agreement supersedes any prior agreements or understandings, whether written or oral, related to the use of the platform.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* Acceptance of Terms */}
              <section id="acceptance" className="mb-8 border-t border-gray-800 pt-6">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => toggleSection('acceptance')}
                >
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="bg-[#1a1a1a] text-[#ff950e] rounded-full w-8 h-8 inline-flex items-center justify-center mr-3 flex-shrink-0">32</span>
                    Acceptance of Terms
                  </h2>
                  {expandedSections['acceptance'] ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </div>
                
                {expandedSections['acceptance'] && (
                  <div className="pl-11 mt-4 space-y-6">
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">32.1. Agreement to Terms</h3>
                      <p className="text-gray-300 leading-relaxed">
                        By accessing or using Panty Post, users confirm that they have read, understood, and agree to be bound by these Terms and Conditions, as well as any other policies or guidelines that may be posted on the platform. This agreement constitutes a legally binding contract between the user and Panty Post.
                      </p>
                    </div>
                    
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">32.2. Continued Use</h3>
                      <p className="text-gray-300 leading-relaxed">
                        Continued use of the platform after any updates or modifications to these Terms and Conditions will constitute acceptance of the revised terms. It is the user's responsibility to review these Terms regularly to stay informed of any changes.
                      </p>
                    </div>
                    
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">32.3. Electronic Signature</h3>
                      <p className="text-gray-300 leading-relaxed">
                        Users acknowledge that by clicking "Agree," "Sign Up," or similar buttons indicating acceptance, they are providing an electronic signature that is legally equivalent to a handwritten signature and constitutes acceptance of these Terms and Conditions.
                      </p>
                    </div>
                    
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#ff950e] mb-2">32.4. Withdrawal of Consent</h3>
                      <p className="text-gray-300 leading-relaxed">
                        If a user does not agree with these Terms and Conditions or any future updates, they must immediately cease using Panty Post and may request the deletion of their account by contacting customer support. Continued use of the platform implies consent to all terms and policies.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* Footer with timestamp */}
              <div className="mt-8 pt-6 border-t border-gray-800 text-center">
                <p className="text-sm text-gray-400">
                  Last Updated: October 1, 2024
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
