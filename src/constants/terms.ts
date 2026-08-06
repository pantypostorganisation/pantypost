// src/constants/terms.ts
import { TermsSection } from '@/types/terms';

export const TERMS_SECTIONS: TermsSection[] = [
  {
    id: 'introduction',
    title: 'Terms & Conditions',
    content: [
      { type: 'paragraph', text: 'Effective Date: 2 August 2026' },
      { type: 'paragraph', text: 'Welcome to Panty Post. By accessing or using our website, products, or services, you agree to comply with and be bound by these Terms and Conditions. If you do not agree to these Terms, you may not use the Service. These Terms govern your use of the Panty Post platform, which facilitates the sale of intimate garments (new or used) by verified sellers to consenting adult buyers.' },
      { type: 'paragraph', text: 'Panty Post is operated by G Dykyj & O Richards, trading as Panty Post (ABN 16 501 428 474), an Australian partnership. These Terms should be read alongside our Privacy Policy, Content Policy and Age Verification Policy, each of which forms part of your agreement with us.' }
    ]
  },
  {
    id: 'eligibility',
    title: 'Eligibility',
    number: '1',
    content: [
      { type: 'heading', title: '1.1. Age Requirement', text: 'To register and use the Service, all users must be at least 18 years old. By creating an account, you confirm that you are 18 years of age or older. Where the law of your own jurisdiction sets a higher minimum age for accessing adult material, that higher age applies to you.' },
      { type: 'heading', title: '1.2. Age Assurance', text: 'Age is confirmed through independent third-party age assurance, not by self-declaration alone. You may be required to complete a verification check before accessing the marketplace. Sellers must additionally complete identity verification using a government-issued photographic identification document. Full details are set out in our Age Verification Policy.' },
      { type: 'heading', title: '1.3. Persons Depicted', text: 'Anyone appearing in content uploaded to Panty Post must be 18 or over and must have consented to that content being published. By uploading, you confirm both. Consent may be withdrawn at any time through our Complaints & Content Removal process.' },
      { type: 'heading', title: '1.4. Consent Records for Third Parties', text: 'Where content depicts any person other than the uploading seller, the seller must, before uploading: (a) verify the identity and age of that person using government-issued photographic identification and confirm they are 18 or over; (b) obtain the written consent of that person to being depicted in the content; (c) obtain the written consent of that person to the public distribution of the content and to its upload to Panty Post; and (d) where the content may be downloaded by other users, obtain the written consent of that person to it being downloaded.\n\nThe seller must retain these records for as long as the content remains published and for a minimum of seven years thereafter, and must produce them to Panty Post within 48 hours of a request. Failure to produce records on request will result in immediate removal of the content and may result in suspension or permanent closure of the account.' },
      { type: 'heading', title: '1.5. Attestation on Upload', text: 'Sellers must confirm, when creating each listing, either that no person other than the seller appears in the content, or that they hold the verification and written consent records described in clause 1.4 for every person depicted. This confirmation is recorded against the listing with a timestamp.' },
      { type: 'heading', title: '1.6. Legal Compliance', text: 'Users are solely responsible for ensuring that their use of the Service complies with all applicable local, state, national, and international laws and regulations, including those regarding the sale of adult content and intimate products.' }
    ]
  },
  {
    id: 'user-accounts',
    title: 'User Accounts',
    number: '2',
    content: [
      { type: 'heading', title: '2.1. Registration', text: 'To use certain features of the Service, sellers and buyers must create an account by providing accurate, current, and complete information. Failure to provide accurate details may result in suspension or termination of your account.' },
      { type: 'heading', title: '2.2. Account Security', text: 'You are responsible for maintaining the confidentiality of your account credentials. Any activity conducted under your account is your responsibility. You must immediately notify us of any unauthorized use of your account.' },
      { type: 'heading', title: '2.3. Account Suspension or Termination', text: 'We reserve the right to suspend or terminate any account at our sole discretion, especially in cases of misconduct, fraudulent activity, or violations of these Terms.' }
    ]
  },
  {
    id: 'content-listings',
    title: 'Content and Listings',
    number: '3',
    content: [
      { type: 'heading', title: '3.1. Pre-Publication Review', text: 'All user-generated content on Panty Post is reviewed by a platform administrator before it becomes publicly visible. This includes listings, posts, profile pictures and gallery images. Until content is approved it is visible only to the user who submitted it. Approval applies to the content that was reviewed: materially editing an approved item returns it to the review queue and withdraws it from public view until approved again. Full details are set out in our Content Policy.' },
      { type: 'heading', title: '3.2. Seller Responsibilities', text: 'Sellers are responsible for the accuracy of all listings, including descriptions, photos, and any representations of the items being sold. Listings must be lawful and comply with our Content Policy. Only verified sellers may upload listings or gallery images.' },
      { type: 'heading', title: '3.3. Prohibited Items and Content', text: 'Any items prohibited by law, or that may be deemed harmful or dangerous, are strictly prohibited. This includes any material that violates local or international law regarding sexual content, exploitation or trafficking; any content involving or appearing to involve a person under 18; and any content depicting a person who has not consented to its publication. Our Content Policy sets out the full list of prohibited content.' },
      { type: 'heading', title: '3.4. Content Ownership', text: 'By listing products on the platform, sellers retain ownership of the content they upload but grant Panty Post a worldwide, non-exclusive, royalty-free license to use, display, and distribute the content for the purpose of operating and promoting the platform.' },
      { type: 'heading', title: '3.5. Removal of Content', text: 'We may remove any content at any time where it breaches these Terms or our Content Policy, where we are required to do so by law, or where a complaint has been received. Content reported as non-consensual, or as involving a person under 18, is withdrawn from public view immediately on receipt of the report and reviewed afterwards.' }
    ]
  },
  {
    id: 'transactions',
    title: 'Transactions and Payments',
    number: '4',
    content: [
      { type: 'heading', title: '4.1. Pricing', text: 'Sellers are free to set the price for their items. Prices must be fair and comply with any applicable legal pricing regulations.' },
      { type: 'heading', title: '4.2. Payment Processing', text: 'We use third-party payment processors for all financial transactions. By using the platform, you agree to the terms and conditions of the payment processor. Panty Post is not responsible for payment disputes between users and the payment processor.' },
      { type: 'heading', title: '4.3. Fees', text: 'Panty Post charges a commission on each sale made through the platform. The current fee structure is outlined on our website and may change from time to time. Sellers agree to these fees upon listing items for sale.' }
    ]
  },
  {
    id: 'shipping',
    title: 'Shipping and Delivery',
    number: '5',
    content: [
      { type: 'heading', title: '5.1. Seller\'s Responsibility', text: 'Sellers are responsible for ensuring that sold items are shipped promptly and discreetly to the buyer\'s address. The condition, hygiene, and packaging of the items must meet the buyer\'s expectations as described in the listing.' },
      { type: 'heading', title: '5.2. Delivery Issues', text: 'Panty Post is not responsible for any issues related to the shipping or delivery of items, including lost or damaged packages. Disputes related to shipping must be resolved between the buyer and the seller directly.' },
      { type: 'heading', title: '5.3. Tracking Number Requirement and Delivery Disputes', text: 'Sellers are required to include a valid tracking number when shipping an order. If a seller does not provide a tracking number and the buyer disputes the order, claiming the package was not delivered, the buyer will be eligible for a full refund.\n\nIf the seller provides a tracking number, and the tracking information indicates that the parcel has been marked as "Delivered" to the buyer\'s specified address, the order will be considered completed. Under these circumstances, the buyer cannot dispute the order or claim non-receipt of the package. It will be assumed that the delivery was legitimate, and no refunds will be issued.' }
    ]
  },
  {
    id: 'returns',
    title: 'Returns and Refunds',
    number: '6',
    content: [
      { type: 'heading', title: '6.1. No Returns', text: 'Due to the nature of the products sold on Panty Post, returns are not accepted under any circumstances. Buyers are encouraged to carefully review listings before purchasing.' },
      { type: 'heading', title: '6.2. Refunds', text: 'Refunds are only issued in exceptional cases, such as if the seller fails to deliver the product or if the product significantly differs from described. All refund requests must be made through Panty Post\'s support team.' }
    ]
  },
  {
    id: 'user-conduct',
    title: 'User Conduct',
    number: '7',
    content: [
      {
        type: 'heading',
        title: '7.1. Prohibited Conduct',
        text: 'Users must not engage in any of the following activities:'
      },
      {
        type: 'list',
        items: [
          'Harassing, bullying, or threatening other users',
          'Engaging in illegal activity',
          'Sending unsolicited or explicit messages to other users',
          'Listing or attempting to sell any prohibited items',
          'Misrepresenting the nature of the products being sold',
          'Uploading content depicting any person who has not consented to its publication',
          'Attempting to circumvent age assurance or content review'
        ]
      },
      { type: 'heading', title: '7.2. Community Guidelines', text: 'Users must adhere to the community guidelines, which aim to create a respectful and safe environment for all participants. Any violations may result in account suspension or termination.' }
    ]
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    number: '8',
    content: [
      { type: 'paragraph', text: 'Your use of Panty Post is also governed by our Privacy Policy, which explains how we collect, use, and share your personal information, and how identity documents are protected. By using the Service, you agree to the terms of the Privacy Policy.' }
    ]
  },
  {
    id: 'liability',
    title: 'Limitation of Liability',
    number: '9',
    content: [
      { type: 'paragraph', text: 'Panty Post is not liable for any direct, indirect, incidental, or consequential damages arising from the use of the platform, including, but not limited to, issues related to product quality, delivery, or third-party services. Your use of the Service is at your own risk. Nothing in these Terms excludes, restricts or modifies any guarantee, right or remedy you may have under the Australian Consumer Law that cannot lawfully be excluded.' }
    ]
  },
  {
    id: 'indemnification',
    title: 'Indemnification',
    number: '10',
    content: [
      { type: 'paragraph', text: 'You agree to indemnify, defend, and hold harmless Panty Post, its affiliates, officers, directors, and employees from any claims, damages, liabilities, or expenses arising out of your use of the platform or violation of these Terms.' }
    ]
  },
  {
    id: 'amendments',
    title: 'Amendments',
    number: '11',
    content: [
      { type: 'paragraph', text: 'Panty Post reserves the right to modify or update these Terms at any time. Changes will be effective immediately upon posting to the website. Continued use of the Service constitutes acceptance of the revised Terms.' }
    ]
  },
  {
    id: 'governing-law',
    title: 'Governing Law',
    number: '12',
    content: [
      { type: 'paragraph', text: 'These Terms and your use of Panty Post are governed by the laws of New South Wales, Australia. Any legal disputes will be resolved in the courts of New South Wales, Australia.' },
      { type: 'paragraph', text: 'If you have any questions regarding these Terms and Conditions, please contact us at support@pantypost.com' }
    ]
  },
  {
    id: 'health-safety',
    title: 'Health and Safety',
    number: '13',
    content: [
      { type: 'heading', title: '13.1. No Health Warranties', text: 'Panty Post and its sellers make no warranties, express or implied, regarding the health or safety of any items sold through the platform. Buyers acknowledge that they are purchasing used intimate products at their own risk, and Panty Post makes no representations regarding the sanitary conditions of these items.' },
      { type: 'heading', title: '13.2. Risk of Exposure', text: 'Buyers understand that by purchasing used intimate apparel, there may be a potential risk of exposure to sexually transmitted infections (STIs) or other health-related concerns. Panty Post is not responsible for any health issues or infections resulting from the use or handling of any products sold through the platform.' },
      { type: 'heading', title: '13.3. No Medical Claims', text: 'Panty Post does not provide any medical advice or guarantee the hygiene of products sold on the platform. Buyers are encouraged to take appropriate precautions when handling and using products, and it is recommended that buyers seek medical advice or consult with a healthcare professional for any concerns related to product usage.' },
      { type: 'heading', title: '13.4. Limitation of Liability', text: 'Subject to the Australian Consumer Law, Panty Post shall not be held liable for any damages, claims, or health-related issues, including but not limited to sexually transmitted infections, that arise from the purchase, handling, or use of any products sold through the platform.' },
      { type: 'heading', title: '13.5. Health Assurance and Biohazard Safety', text: 'Sellers affirm that they do not have any sexually transmitted infections (STIs), sexually transmitted diseases (STDs), or other infectious conditions that could pose a health risk to buyers. Furthermore, sellers confirm that to the best of their knowledge, they and/or their sexual partners are free from any such conditions. This assurance is necessary to prevent the listed items from being classified as biohazards or otherwise harmful for shipping or handling by buyers.\n\nAny violation of this clause may result in immediate suspension or termination of the seller\'s account, as well as potential legal action or liability for harm caused.' }
    ]
  },
  {
    id: 'risk',
    title: 'Assumption of Risk',
    number: '14',
    content: [
      { type: 'heading', title: '14.1. Voluntary Participation', text: 'Buyers and sellers acknowledge that they are voluntarily participating in a platform for the exchange of used intimate products. They agree that they are solely responsible for understanding the risks associated with this type of transaction, including but not limited to health risks, legal issues, and personal discomfort.' },
      { type: 'heading', title: '14.2. No Guarantee of Legality in Specific Jurisdictions', text: 'Panty Post operates as an online platform and cannot guarantee that the sale or purchase of used intimate items is legal in every jurisdiction. It is the responsibility of each user to understand and comply with the laws in their local area. Panty Post disclaims any responsibility for legal repercussions resulting from the use of the platform in areas where such sales are restricted or prohibited.' }
    ]
  },
  {
    id: 'legal-compliance',
    title: 'User Responsibility for Legal Compliance',
    number: '15',
    content: [
      { type: 'heading', title: '15.1. Local Laws and Regulations', text: 'Users (both buyers and sellers) are responsible for ensuring that their participation in Panty Post complies with all applicable local, state, national, and international laws, including but not limited to those related to the sale of adult materials, sexual products, or used intimate apparel. Panty Post is not responsible for any legal action taken against users due to their violation of such laws.' },
      { type: 'heading', title: '15.2. Indemnification', text: 'Users agree to indemnify and hold harmless Panty Post, its owners, directors, employees, and affiliates from any and all claims, legal actions, damages, or losses arising out of the users\' violation of laws or regulations, or any breach of these Terms and Conditions.' }
    ]
  },
  {
    id: 'verification-moderation',
    title: 'Verification, Moderation and Product Quality',
    number: '16',
    content: [
      { type: 'heading', title: '16.1. Seller Verification', text: 'Sellers must complete identity verification before they may list any item. Verification requires a valid government-issued photographic identification document and a photograph of the seller holding a unique code issued by us, both reviewed by a trained administrator. This confirms the seller\'s identity and that they are 18 or over.' },
      { type: 'heading', title: '16.2. Content Moderation', text: 'All listings, posts, profile pictures and gallery images are reviewed by a platform administrator before publication. Every decision is recorded with the reviewer\'s identity, the date and time, and the reason for any denial. Verification does not exempt a seller\'s content from review.' },
      { type: 'heading', title: '16.3. Scope of Our Review', text: 'Our review assesses whether content complies with our Content Policy and applicable law. It is not an inspection of the physical goods themselves. Panty Post does not physically examine, test, handle or store any item sold through the platform, and does not conduct health screening of sellers. We therefore make no representation as to the quality, condition, authenticity or hygiene of any item.' },
      { type: 'heading', title: '16.4. No Endorsement', text: 'Approval of a listing means only that it passed content review. It is not an endorsement of the seller, a warranty as to the item, or a guarantee of any transaction. Disputes regarding product quality or authenticity must be resolved between buyer and seller, though we may assist where our Complaints process applies.' }
    ]
  },
  {
    id: 'dispute-resolution',
    title: 'Dispute Resolution and Arbitration',
    number: '17',
    content: [
      { type: 'heading', title: '17.1. Mandatory Arbitration', text: 'In the event of a legal dispute between users and Panty Post, the parties agree to first attempt resolution through binding arbitration rather than in court. Any arbitration will take place in New South Wales, Australia, and the decision of the arbitrator will be final and binding. Each party is responsible for its own legal costs unless otherwise determined by the arbitrator. Nothing in this clause prevents either party from seeking urgent injunctive relief, or from exercising any right that cannot lawfully be subject to arbitration.' },
      { type: 'heading', title: '17.2. Class Action Waiver', text: 'To the extent permitted by law, users agree to resolve any disputes individually and waive their right to participate in any class-action lawsuit against Panty Post.' },
      { type: 'heading', title: '17.3. Complaints', text: 'Disputes about specific content, including requests for its removal, should be raised through our Complaints & Content Removal process rather than under this section. That process is open to anyone, whether or not they hold an account, and complaints are investigated and resolved within five business days.' }
    ]
  },
  {
    id: 'force-majeure',
    title: 'Force Majeure',
    number: '18',
    content: [
      { type: 'heading', title: '18.1. Unforeseen Circumstances', text: 'Panty Post shall not be held liable for any failure to perform its obligations under these Terms due to circumstances beyond its reasonable control, including but not limited to natural disasters, acts of government, war, terrorism, labor disputes, or other events of "force majeure." This includes the inability to provide the platform due to technical failures or interruptions in services.' }
    ]
  },
  {
    id: 'limited-liability',
    title: 'Limited Liability',
    number: '19',
    content: [
      { type: 'heading', title: '19.1. Liability Cap', text: 'To the maximum extent permitted by law, Panty Post\'s total liability to any user for any claim arising out of or relating to the use of the platform is limited to the total amount paid by the user to Panty Post over the preceding 12 months, or AUD 500, whichever is lower.' },
      { type: 'heading', title: '19.2. Exclusion of Certain Damages', text: 'In no event shall Panty Post be liable for any indirect, incidental, punitive, or consequential damages arising out of or in connection with the use of the platform, even if Panty Post has been advised of the possibility of such damages.' },
      { type: 'heading', title: '19.3. Australian Consumer Law', text: 'Nothing in these Terms excludes, restricts or modifies any consumer guarantee, right or remedy conferred by the Competition and Consumer Act 2010 (Cth) or any other applicable law that cannot lawfully be excluded or limited.' }
    ]
  },
  {
    id: 'disclaimer-warranties',
    title: 'Disclaimer of Warranties',
    number: '20',
    content: [
      { type: 'heading', title: '20.1. Platform Provided "As Is"', text: 'Subject to section 19.3, Panty Post makes no warranties, express or implied, regarding the functionality, reliability, or availability of the platform. The service is provided "as is" without any warranties of merchantability, fitness for a particular purpose, or non-infringement.' }
    ]
  },
  {
    id: 'data-protection',
    title: 'Data Protection and Privacy',
    number: '21',
    content: [
      { type: 'heading', title: '21.1. User Data Protection', text: 'Panty Post handles personal information in accordance with the Privacy Act 1988 (Cth) and the Australian Privacy Principles. While we take reasonable measures to protect user data, no system can be guaranteed absolutely secure. Where a data breach is likely to result in serious harm, we will notify affected individuals and the Office of the Australian Information Commissioner as required by the Notifiable Data Breaches scheme.' },
      { type: 'heading', title: '21.2. Identity Documents', text: 'Identity documents submitted for verification are never publicly accessible. They can be viewed only by authorised administrators, through short-lived access links that expire automatically. They are retained only as long as necessary to evidence that verification took place and are then securely deleted.' },
      { type: 'heading', title: '21.3. Age Assurance Data', text: 'Age assurance is performed by an independent third-party provider. Photographs and identity documents submitted during that check are handled by the provider and are not stored by Panty Post. We record only whether the check was passed.' }
    ]
  },
  {
    id: 'intellectual-property',
    title: 'Intellectual Property',
    number: '22',
    content: [
      { type: 'heading', title: '22.1. Ownership of Platform Content', text: 'All content on the Panty Post platform, including but not limited to text, images, graphics, logos, trademarks, and software, is owned by or licensed to Panty Post. Users are not permitted to use, copy, reproduce, or distribute any content from the platform without express written permission from Panty Post.' },
      { type: 'heading', title: '22.2. User Content', text: 'By uploading content to Panty Post, including product images or descriptions, users grant Panty Post a non-exclusive, royalty-free, worldwide license to use, reproduce, modify, adapt, and display such content for the purpose of operating the platform. Users retain ownership of their content but agree not to upload anything that infringes on the intellectual property rights of others.' },
      { type: 'heading', title: '22.3. Infringement Claims', text: 'If you believe content on the platform infringes your intellectual property rights, please raise this through our Complaints & Content Removal process. Infringing content will be removed and repeat infringers will have their accounts terminated.' }
    ]
  },
  {
    id: 'prohibited-uses',
    title: 'Prohibited Uses',
    number: '23',
    content: [
      {
        type: 'heading',
        title: '23.1. Misuse of the Platform',
        text: 'Users agree not to use the platform for any illegal or unauthorized purpose, including but not limited to:'
      },
      {
        type: 'list',
        items: [
          'Engaging in any form of fraud or misrepresentation',
          'Harassing or abusing other users',
          'Sending unsolicited or inappropriate messages',
          'Posting misleading or inaccurate listings',
          'Attempting to hack or disrupt the platform\'s systems',
          'Using the platform for money laundering or other financial crimes',
          'Engaging in any form of prostitution, solicitation, or escort services',
          'Attempting to circumvent age assurance, identity verification or content review',
          'Uploading content depicting a person under 18, or any person who has not consented'
        ]
      },
      { type: 'heading', title: '23.2. Breach of Terms', text: 'Any violation of these prohibited uses will result in immediate termination of the user\'s account and potential legal action by Panty Post. Panty Post reserves the right to cooperate with law enforcement agencies and provide any necessary information to assist in investigations. Content involving a person under 18 is reported to the relevant authorities proactively.' }
    ]
  },
  {
    id: 'third-party-services',
    title: 'Third-Party Services and Links',
    number: '24',
    content: [
      { type: 'heading', title: '24.1. Third-Party Integrations', text: 'Panty Post uses third-party services, including payment processors, age assurance providers, shipping providers, and communication tools, to operate the platform. While we aim to work with reliable partners, Panty Post is not responsible for any issues or disputes arising from the use of these third-party services. Users agree to abide by the terms and conditions of these third-party providers.' },
      { type: 'heading', title: '24.2. External Links', text: 'The platform may contain links to external websites or resources. Panty Post is not responsible for the content or practices of these third-party websites. Users acknowledge that they access third-party websites at their own risk.' }
    ]
  },
  {
    id: 'termination',
    title: 'Termination of Accounts',
    number: '25',
    content: [
      { type: 'heading', title: '25.1. Right to Terminate', text: 'Panty Post reserves the right to terminate or suspend any user\'s account at its discretion, without prior notice, if the user violates these Terms and Conditions or engages in behavior that harms the platform\'s reputation or operation.' },
      { type: 'heading', title: '25.2. Effect of Termination', text: 'If a user\'s account is terminated, they will lose access to the platform and any pending or in-process transactions will be canceled. Panty Post is not responsible for any loss of data, listings, or communications as a result of account termination.' },
      { type: 'heading', title: '25.3. Survival of Terms', text: 'Provisions related to intellectual property, limitation of liability, indemnification, and dispute resolution shall survive the termination of the user\'s account.' }
    ]
  },
  {
    id: 'taxes',
    title: 'User Responsibility for Taxes',
    number: '26',
    content: [
      { type: 'heading', title: '26.1. Seller Tax Responsibility', text: 'Sellers are responsible for determining and paying any applicable taxes associated with their sales on Panty Post. Panty Post does not provide tax advice or handle tax filings on behalf of sellers. It is the seller\'s responsibility to comply with local tax laws and regulations, including income, sales, and value-added taxes (VAT) or goods and services tax (GST).' },
      { type: 'heading', title: '26.2. Buyer Tax Responsibility', text: 'Buyers may be responsible for any customs duties, taxes, or import fees associated with purchasing products from sellers in different regions or countries. Panty Post is not responsible for these additional costs.' }
    ]
  },
  {
    id: 'reporting',
    title: 'Reporting Violations and Illegal Activity',
    number: '27',
    content: [
      { type: 'heading', title: '27.1. Reporting', text: 'If you believe another user is violating these Terms and Conditions, engaging in illegal activity, or attempting to defraud others, you should report this immediately through our Complaints & Content Removal process, or by email to support@pantypost.com. We take violations seriously and investigate all reports.' },
      { type: 'heading', title: '27.2. Complaints Without an Account', text: 'You do not need a Panty Post account to make a complaint. Anyone may report content through our Complaints & Content Removal page, including a person who believes content depicting them has been published without their consent. Every complaint receives a reference number and is investigated and resolved within five business days.' },
      { type: 'heading', title: '27.3. Urgent Reports', text: 'Reports of non-consensual content, or content appearing to involve a person under 18, are treated as urgent. Where a link is provided, the content is withdrawn from public view immediately on receipt, before any review takes place.' }
    ]
  },
  {
    id: 'illegal-activity',
    title: 'Disclaimer Regarding Illegal Activity',
    number: '28',
    content: [
      { type: 'heading', title: '28.1. No Facilitation of Illegal Acts', text: 'Panty Post does not support or facilitate any illegal activities. Any users found to be engaging in unlawful actions, including but not limited to the solicitation of illegal services, the sale of contraband items, or engaging in fraud, will be immediately banned from the platform and reported to law enforcement authorities.' }
    ]
  },
  {
    id: 'severability',
    title: 'Severability',
    number: '29',
    content: [
      { type: 'heading', title: '29.1. Enforceability of Provisions', text: 'If any provision of these Terms and Conditions is found to be unenforceable or invalid under applicable law, such provision will be modified to reflect the parties\' intention as closely as possible. The remaining provisions of these Terms and Conditions shall continue in full force and effect.' }
    ]
  },
  {
    id: 'modifications',
    title: 'Modifications to the Platform',
    number: '30',
    content: [
      { type: 'heading', title: '30.1. Changes to the Service', text: 'Panty Post reserves the right to modify, update, or discontinue any aspect of the platform at any time without notice. Panty Post will not be held liable for any losses or damages resulting from changes to or the termination of services.' }
    ]
  },
  {
    id: 'entire-agreement',
    title: 'Entire Agreement',
    number: '31',
    content: [
      { type: 'heading', title: '31.1. Complete Understanding', text: 'These Terms and Conditions, together with our Privacy Policy, Content Policy, Age Verification Policy, and any other policies or guidelines posted on the platform, constitute the entire agreement between Panty Post and its users. This agreement supersedes any prior agreements or understandings, whether written or oral, related to the use of the platform.' },
      { type: 'heading', title: '31.2. Order of Precedence', text: 'Where these Terms conflict with a specific policy on a matter that policy addresses in detail, the specific policy prevails.' }
    ]
  },
  {
    id: 'acceptance',
    title: 'Acceptance of Terms',
    number: '32',
    content: [
      { type: 'heading', title: '32.1. Agreement to Terms', text: 'By accessing or using Panty Post, users confirm that they have read, understood, and agree to be bound by these Terms and Conditions, as well as any other policies or guidelines that may be posted on the platform. This agreement constitutes a legally binding contract between the user and Panty Post.' },
      { type: 'heading', title: '32.2. Continued Use', text: 'Continued use of the platform after any updates or modifications to these Terms and Conditions will constitute acceptance of the revised terms. It is the user\'s responsibility to review these Terms regularly to stay informed of any changes.' },
      { type: 'heading', title: '32.3. Electronic Signature', text: 'Users acknowledge that by clicking "Agree," "Sign Up," or similar buttons indicating acceptance, they are providing an electronic signature that is legally equivalent to a handwritten signature and constitutes acceptance of these Terms and Conditions.' },
      { type: 'heading', title: '32.4. Withdrawal of Consent', text: 'If a user does not agree with these Terms and Conditions or any future updates, they must immediately cease using Panty Post and may request the deletion of their account by contacting support@pantypost.com. Continued use of the platform implies consent to all terms and policies.' }
    ]
  }
];

export const LAST_UPDATED = 'August 2, 2026';