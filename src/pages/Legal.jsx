import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Seo } from '../components/useSEO'
import { CONSENT_EVENT, clearTrackingCookies, getConsent, revokeConsent } from '../consent'
import { openPrivacyPreferences } from '../components/PrivacyControls'

const PAGES = {
  terms: {
    title: 'Terms of Service',
    updated: 'September 23, 2026',
    // Drafted 2026-09-23 at Nathan's request to be strongly protective of the
    // company. NOT reviewed by a lawyer yet — have counsel review before relying
    // on it, especially Section 17 (arbitration). Facts it depends on: Sponge
    // Hydration LLC is a California LLC with its principal office in Orange
    // County (CA SoS Statement of Information, Nov 2025). The consumer promises
    // in the Pre-Order, Return and Warranty policies are deliberately preserved,
    // not overridden: Section 1 says those policies control on their subjects.
    body: [
      "These Terms of Service (“Terms”) are a binding agreement between you and Sponge Hydration LLC, a California limited liability company (“Sponge”, “we”, “us” or “our”). They govern your use of spongehydration.com (the “Site”), the Sponge mobile apps (the “App”), Sponge devices and accessories, including the Sponge Clip, the Sponge Dot, the Sponge Coaster and magnetic adhesive mounts (the “Products”), and any related services (together with the Site and the App, the “Services”).",
      "By visiting the Site, creating an account, downloading or using the App, using a Product, or placing an order, you agree to these Terms. If you do not agree, do not use the Services or buy our Products.",
      { b: "PLEASE READ SECTION 17 CAREFULLY. IT REQUIRES MOST DISPUTES BETWEEN YOU AND SPONGE TO BE RESOLVED BY BINDING INDIVIDUAL ARBITRATION RATHER THAN IN COURT, AND IT WAIVES YOUR RIGHT TO A JURY TRIAL AND TO TAKE PART IN A CLASS ACTION. YOU CAN OPT OUT OF ARBITRATION WITHIN 30 DAYS, AS SECTION 17 EXPLAINS." },

      { h: '1. Policies that are part of these Terms' },
      'The following policies are part of these Terms. If one of them conflicts with these Terms on the subject it covers, that policy controls for that subject.',
      { ul: [
        'Privacy Policy — how we collect, use and share personal information.',
        'Pre-Order Policy — how pre-orders are charged, produced, shipped and cancelled.',
        'Return Policy — our 30-day money-back guarantee.',
        'Warranty Policy — our 1-year limited warranty.',
      ] },

      { h: '2. Who can use Sponge, and your account' },
      'You must be at least 18, or the age of majority where you live, to buy Products or create an account. A person aged 13 to 17 may use the App only with the involvement of a parent or guardian who agrees to these Terms for them and is responsible for their use. The Services are not directed to children under 13, and children under 13 may not create an account.',
      'You agree to give us accurate information, keep your login details secure, and tell us promptly at team@spongehydration.com if you believe your account has been used without your permission. You are responsible for everything that happens under your account.',

      { h: '3. Sponge is not medical advice' },
      'Sponge is a general wellness product. The Products and the App are designed to help you keep track of how much you drink and to build a habit. They are not medical devices. They have not been cleared or approved by the U.S. Food and Drug Administration, and they are not intended to diagnose, treat, cure, mitigate, monitor or prevent any disease or medical condition.',
      'Nothing in the Services — including any daily goal the App recommends, any reminder or notification, and any article or other content on the Site — is medical advice or a substitute for the advice of a qualified health professional. Talk to your doctor before changing how much you drink, especially if you are pregnant or breastfeeding, are an older adult, or have (or care for someone who has) heart, kidney or liver disease, diabetes, a condition that affects fluid or sodium balance, or any condition for which a clinician has limited fluid intake.',
      'Drinking too much water can be dangerous. Never drink more than is safe for you in order to reach a goal, unlock an app or keep a streak going. If you have symptoms of dehydration or overhydration, seek medical attention. In an emergency, call 911 or your local emergency number. The Services are not an emergency, alert or monitoring service.',
      { b: 'YOU ARE SOLELY RESPONSIBLE FOR YOUR HEALTH DECISIONS, AND YOU ASSUME ALL RISK ARISING FROM YOUR USE OF THE SERVICES AND PRODUCTS AND FROM ANY DECISION YOU MAKE BASED ON THEM.' },

      { h: '4. Measurements are estimates' },
      'The Products estimate how much you drink from changes in weight and motion. Readings can be inaccurate, incomplete, delayed or missing — for example, if a bottle is set down on an uneven surface, is knocked or moved while it is being weighed, is used with a bottle or mount the Product does not suit, or if the Product loses power or its connection to your phone. We do not promise that any measurement, total, goal, streak or trend is accurate or complete, and you must not rely on one for any medical, safety or other critical purpose.',

      { h: '5. App Lock and features that restrict your phone' },
      'App Lock lets you choose apps that stay locked until you reach a goal you set. You decide which apps to lock and what unlocks them, and you use the feature at your own risk.',
      'Do not lock any app you might need for your health or safety, to contact emergency services or other people, to manage a medical condition, to navigate, or for work, school or caregiving. Because intake readings are estimates (Section 4), an app may stay locked even when you have drunk enough.',
      'App Lock depends on permissions and features provided by Apple and Google, which they can change or withdraw at any time. We do not guarantee that App Lock will lock or unlock any app at any particular time, or at all. We are not responsible for anything you miss, lose or cannot do because an app was locked, failed to lock or failed to unlock.',

      { h: '6. Sharing and caregiving features' },
      'Where the Services let you share your intake with people you invite, or let you see someone else’s, those features are not a medical alert, remote patient monitoring, fall detection or emergency response service. Shared data and notifications can be delayed, wrong or not delivered at all. Never rely on the Services as the way you check on another person’s health, wellbeing or safety.',
      'Only invite people you want to see your information, and only track or view another person’s information with their permission, or the permission of someone legally entitled to give it for them.',

      { h: '7. Beta and in-development features and products' },
      'We may offer features or products that are described as beta, preview, testing, coming soon or in development — for example, Apple Health sync, the shared caregiver view and the Sponge Dot. They are provided “as is”, may not work as described, may change or be discontinued at any time, and may never be released. A pre-order for a product in development is covered by the Pre-Order Policy, including your right to cancel for a full refund before it ships.',

      { h: '8. Orders, pricing and payment' },
      'When you place an order you are making an offer to buy. We may refuse, limit or cancel any order, or any part of one, at any time — including after we have charged you — for example because a product is unavailable, we suspect fraud or resale, or there was an error in the price or description. If we cancel, we refund what you paid for the cancelled items. We may limit quantities per person, household or order.',
      'Prices are in U.S. dollars and may change at any time. If a price or product description on the Site is wrong, we may cancel the affected order even after confirming it. Shipping charges are shown before you pay, and you are responsible for any applicable sales tax.',
      'Sponge is currently sold as a pre-order. Pre-orders are charged when you order, do not carry a committed delivery date, and may be cancelled by you for a full refund at any time before your order ships, as the Pre-Order Policy explains.',
      'Payments are processed by Stripe. By placing an order, you authorize us and Stripe to charge your chosen payment method for the total shown. We do not receive or store your full card details.',
      'Product images and descriptions are for illustration. Colors, finishes and packaging may vary, and an image may be a rendering or placeholder rather than a photograph of the finished product. Promotional codes have no cash value, cannot be combined unless we say so, and may expire or be withdrawn at any time.',
      'If you have a problem with a charge, please contact us first at team@spongehydration.com so we can put it right. If you dispute a valid charge with your bank, we may suspend your account and any open orders while the dispute is resolved.',

      { h: '9. Shipping, title and risk of loss' },
      'We ship to addresses in the United States only. Any delivery date we give is an estimate, and pre-orders carry no committed date at all. Title to a Product, and the risk of its loss or damage, pass to you when we hand it to the carrier. If a shipment is lost or arrives damaged, contact us within 14 days of the date tracking shows it was delivered — or, if it never arrives, within 14 days of the date it was expected — and we will work with the carrier to resolve it.',

      { h: '10. Returns, refunds and warranty' },
      'Your 30-day money-back guarantee is set out in the Return Policy, and your 1-year limited warranty in the Warranty Policy. They are the only guarantees and warranties we give, and they are subject to Section 13.',

      { h: '11. Using the Products safely' },
      { ul: [
        'Follow the setup guide and any instructions and warnings that come with the Product.',
        'Products contain magnets. Keep them away from pacemakers, implanted medical devices, credit cards and magnetic storage, and follow the advice of your doctor and your device’s manufacturer about magnets.',
        'Products and accessories contain small parts and magnets that can be a choking hazard or cause serious internal injury if swallowed. Keep them away from children and pets. If a magnet or small part is swallowed, get medical help immediately.',
        'Products contain a rechargeable battery. Charge only with a suitable USB-C cable and power source. Do not puncture, crush, heat, open or modify a Product, and stop using it if it swells, overheats, leaks or smells. Dispose of it according to local rules for batteries and electronics.',
        'Do not submerge a Product in water, put it in a dishwasher, microwave or freezer, or expose it to extreme heat, unless our documentation says it is safe to do so.',
        'Make sure your bottle is stable with the Product attached before you set it down. Adhesive mounts can leave residue and can mark or damage some surfaces and finishes, so check the bottle’s care instructions first. We are not responsible for damage to a bottle, its contents or anything nearby.',
      ] },

      { h: '12. Your license to use the App and the Site' },
      'We grant you a limited, personal, revocable, non-exclusive and non-transferable license to use the App and the Site, and the software built into your Product, for your own non-commercial use on devices you own or control. You own the hardware you buy; we and our licensors own the software, firmware and content.',
      'You agree not to:',
      { ul: [
        'copy, modify, distribute, sell or rent any part of the Services;',
        'reverse engineer, decompile or disassemble the App or any Product firmware, except where the law expressly allows it despite this restriction;',
        'bypass, disable or interfere with any security, access or usage-limiting feature;',
        'use bots, scrapers or other automated means to access the Services;',
        'use the Services unlawfully, to harm anyone, or to upload malicious code;',
        'buy Products for commercial resale without our written consent; or',
        'use the Services to build or benchmark a competing product.',
      ] },
      'We may update the App and Product software, sometimes automatically, and some features may not work until you install an update. We may change or remove features, and we are not obliged to support any Product, phone or software version indefinitely.',

      { h: '13. Disclaimer of warranties' },
      { b: 'EXCEPT FOR THE 30-DAY MONEY-BACK GUARANTEE IN OUR RETURN POLICY AND THE 1-YEAR LIMITED WARRANTY IN OUR WARRANTY POLICY, THE SERVICES AND PRODUCTS ARE PROVIDED “AS IS” AND “AS AVAILABLE”. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL OTHER WARRANTIES, WHETHER EXPRESS, IMPLIED OR STATUTORY, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT AND ACCURACY, AND ANY WARRANTIES ARISING FROM A COURSE OF DEALING OR USAGE OF TRADE.' },
      { b: 'WHERE THE LAW DOES NOT ALLOW AN IMPLIED WARRANTY ON A PRODUCT TO BE DISCLAIMED, THAT IMPLIED WARRANTY IS LIMITED IN DURATION TO THE ONE-YEAR TERM OF OUR LIMITED WARRANTY. WE DO NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED, SECURE OR ERROR-FREE, THAT THEY WILL WORK WITH ANY PARTICULAR BOTTLE, PHONE, OPERATING SYSTEM OR THIRD-PARTY SERVICE, OR THAT YOUR DATA WILL NOT BE LOST.' },
      'Some states do not allow limits on how long an implied warranty lasts, or the exclusion of certain damages, so some of the limits in Sections 13 and 14 may not apply to you. This gives you specific legal rights, and you may have other rights that vary from state to state.',

      { h: '14. Limitation of liability' },
      { b: 'TO THE FULLEST EXTENT PERMITTED BY LAW, SPONGE AND ITS MEMBERS, MANAGERS, EMPLOYEES, CONTRACTORS, AGENTS, SUPPLIERS AND LICENSORS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY OR PUNITIVE DAMAGES; FOR ANY LOSS OF PROFITS, REVENUE, DATA, GOODWILL OR USE; OR FOR ANY INJURY, ILLNESS OR LOSS ARISING FROM RELIANCE ON ANY MEASUREMENT, GOAL, REMINDER, NOTIFICATION, SHARED DATA OR APP LOCK — IN EACH CASE EVEN IF WE HAVE BEEN TOLD THAT SUCH DAMAGES ARE POSSIBLE.' },
      { b: 'TO THE FULLEST EXTENT PERMITTED BY LAW, OUR TOTAL LIABILITY FOR ALL CLAIMS RELATING TO THE SERVICES OR PRODUCTS, WHETHER IN CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT LIABILITY OR OTHERWISE, IS LIMITED TO THE GREATER OF (A) THE AMOUNT YOU PAID US FOR THE PRODUCT OR SERVICE THAT GAVE RISE TO THE CLAIM IN THE 12 MONTHS BEFORE THE CLAIM AROSE, AND (B) US $50.' },
      'These limits apply even if a limited remedy fails of its essential purpose. They are a fundamental part of the bargain between us, and our prices would be higher without them. They do not limit any liability that cannot lawfully be limited — such as liability for fraud, for gross negligence or willful misconduct, or for death or personal injury caused by our negligence where the law does not allow it to be limited — and they do not reduce your rights under the Return Policy or the Warranty Policy.',

      { h: '15. Indemnity' },
      'To the fullest extent permitted by law, you will defend, indemnify and hold harmless Sponge and its members, managers, employees, contractors and agents from and against any claims, losses, damages, liabilities, costs and expenses (including reasonable attorneys’ fees) arising out of (a) your misuse of the Services or Products, (b) your breach of these Terms or of any law, (c) any content you submit, or (d) your tracking, viewing or sharing of another person’s information. We may take control of the defense of any such matter, and you will cooperate with us.',

      { h: '16. Reviews, content and feedback' },
      'If you submit a review, photo, message or other content, you confirm that it is honest, that it is yours to share, and that you will disclose any connection you have with Sponge (for example, if we gave you a product or you work with us). You grant us a worldwide, royalty-free, perpetual, irrevocable, non-exclusive and sublicensable license to use, reproduce, display, format and excerpt it, and to publish it with the first name or description you provide, in connection with the Services and our marketing. We will not change the meaning of a review.',
      'We moderate reviews against consistent standards. We may decline or remove content that is abusive, obscene, off-topic, spam, contains someone’s personal information, infringes anyone’s rights, or comes from someone with an undisclosed connection to Sponge. We do not decline to publish a review because it is negative.',
      'If you send us ideas or feedback, we may use them for any purpose without paying or crediting you.',

      { h: '17. Disputes: informal resolution, arbitration and class-action waiver' },
      { b: 'THIS SECTION AFFECTS YOUR LEGAL RIGHTS. PLEASE READ IT CAREFULLY.' },
      '(a) Try to resolve it informally first. Before starting an arbitration or court case, you and we each agree to try to resolve any dispute informally for at least 60 days after the other side receives a written notice describing it. Send your notice to team@spongehydration.com with “Legal Notice” in the subject line, including your name, contact details, any order number, a description of the dispute and the relief you want. We will send ours to the email address on your account or order. Any time limit for bringing the claim is paused during those 60 days.',
      '(b) Agreement to arbitrate. You and Sponge agree that any dispute, claim or controversy arising out of or relating to these Terms, the Services, the Products, any purchase, or our relationship (a “Dispute”) will be resolved by final and binding arbitration on an individual basis, and not in court, except as set out in (c). This includes Disputes about the scope, validity or enforceability of this Section, which the arbitrator will decide — except that a court will decide Disputes about the class-action waiver in (e), the batch procedure in (f), and (g).',
      '(c) Exceptions. Either of us may bring an individual claim in small claims court if it qualifies there and stays there. Either of us may also bring an individual action in court to stop infringement or misuse of intellectual property.',
      '(d) Rules and location. The arbitration will be administered by the American Arbitration Association (“AAA”) under its Consumer Arbitration Rules then in effect, as modified by this Section (available at adr.org), before a single arbitrator. If the AAA is unavailable, the parties will agree on another administrator, or a court will appoint one. Any hearing will take place in the county where you live, or, if you prefer, by video or on written submissions alone. Fees are governed by the AAA’s rules, which limit what a consumer pays. Each side bears its own attorneys’ fees unless the law or the arbitrator awards otherwise. The Federal Arbitration Act governs this Section, and judgment on the award may be entered in any court with jurisdiction.',
      { b: '(e) CLASS-ACTION AND JURY WAIVER. YOU AND SPONGE EACH AGREE TO BRING DISPUTES ONLY IN AN INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS, COLLECTIVE, CONSOLIDATED, PRIVATE ATTORNEY GENERAL OR REPRESENTATIVE PROCEEDING. THE ARBITRATOR MAY NOT CONSOLIDATE MORE THAN ONE PERSON’S CLAIMS, AND MAY AWARD RELIEF ONLY IN FAVOR OF THE INDIVIDUAL PARTY SEEKING IT AND ONLY TO THE EXTENT NEEDED TO RESOLVE THAT PARTY’S INDIVIDUAL CLAIM. YOU AND SPONGE EACH WAIVE THE RIGHT TO A TRIAL BY JURY.' },
      '(f) Many similar claims. If 25 or more similar demands for arbitration are filed against us by or with the help of the same law firm or group of coordinated firms, they will be administered in batches of up to 25, with one arbitrator deciding each batch, and the remaining demands held until earlier batches are resolved. The AAA’s Mass Arbitration Supplementary Rules will also apply. Time limits for the held claims are paused while they wait.',
      '(g) Public injunctive relief. If a court decides that the law prevents part of (e) from being enforced against a claim for public injunctive relief, that claim will be separated and decided by a court only after the individual arbitration is complete, and the rest of this Section will still apply.',
      '(h) Opting out. You may reject this Section 17 by emailing team@spongehydration.com, from the email address on your account or order, within 30 days after you first accept these Terms, with the subject line “Arbitration Opt-Out” and your name and mailing address. Opting out does not affect any other part of these Terms.',
      '(i) Changes to this Section. If we change this Section, the change will not apply to a Dispute we already knew about or that you had already notified us of. You may reject a material change by emailing us within 30 days after it takes effect, in which case the version you last accepted continues to apply.',
      '(j) If the waiver fails. If the class-action waiver in (e) is found unenforceable for a Dispute (other than a claim for public injunctive relief), then this entire Section 17 will not apply to that Dispute, and it will be decided in court under Section 18.',

      { h: '18. Governing law and courts' },
      'These Terms and any Dispute are governed by the laws of the State of California, without regard to its conflict-of-laws rules, and by the Federal Arbitration Act as to Section 17. For any Dispute that is not arbitrated, you and we consent to the exclusive jurisdiction and venue of the state and federal courts located in Orange County, California.',

      { h: '19. Time limit for claims' },
      'To the extent permitted by law, any claim relating to the Services or Products must be brought within one year after it arises. Otherwise it is permanently barred.',

      { h: '20. Third-party services and app stores' },
      'The Services rely on third parties, including Stripe for payments, Apple and Google for the App and phone features, and carriers for delivery, and they may link to or work with other services such as Apple Health. Those third parties’ own terms and privacy policies apply to your use of them. We are not responsible for their products, services, availability or content.',
      'If you downloaded the App from Apple’s App Store: these Terms are between you and Sponge, not Apple, and Sponge — not Apple — is responsible for the App and its content. Your license is limited to using the App on Apple-branded products you own or control, as the App Store Terms of Service allow. Apple has no obligation to provide maintenance or support for the App. If the App fails to conform to any applicable warranty, you may notify Apple for a refund of the App’s purchase price (the App is free), and, to the maximum extent permitted by law, Apple has no other warranty obligation for it. Apple is not responsible for addressing any claim relating to the App or your use of it, including product liability claims, claims that the App fails to meet a legal or regulatory requirement, and claims under consumer protection or similar laws, nor for investigating, defending, settling or discharging any claim that the App infringes someone’s intellectual property. You confirm that you are not located in a country subject to a U.S. Government embargo or designated as a “terrorist supporting” country, and that you are not on any U.S. Government list of prohibited or restricted parties. You must comply with any third-party terms that apply when using the App. Apple and its subsidiaries are third-party beneficiaries of these Terms and may enforce them against you.',
      'If you downloaded the App from Google Play, Google Play’s terms also apply, and Google is not responsible for the App.',

      { h: '21. Intellectual property' },
      'The Services and Products — including software, firmware, designs, text, graphics, photographs, video and the Sponge and Sponge Hydration names and logos — are owned by Sponge or its licensors and protected by intellectual property laws. Our Products may be covered by patents or pending patent applications. Except for the limited license in Section 12, these Terms give you no right in any of them.',
      'If you believe something on the Services infringes your copyright, email team@spongehydration.com with a description of the work, where it appears on the Services, your contact details, a statement that you believe in good faith the use is not authorized, a statement under penalty of perjury that your notice is accurate and that you are the owner or authorized to act for the owner, and your physical or electronic signature.',

      { h: '22. Changes to the Services and to these Terms' },
      'We may change, suspend or discontinue any part of the Services at any time, and we will not be liable to you for doing so.',
      'We may update these Terms. We will post the new version here with a new “last updated” date, and for material changes we will also tell you by email or in the App. The new Terms take effect when posted unless we say otherwise, and your continued use of the Services after that means you accept them. Changes do not apply retroactively to an order placed before they took effect, and changes to Section 17 follow Section 17(i).',

      { h: '23. Suspension and termination' },
      'We may suspend or end your access to all or part of the Services at any time, with or without notice, including if we reasonably believe you have broken these Terms or the law. You may stop using the Services and ask us to close your account at any time. Sections 3 to 7 and 13 to 24, and any other part of these Terms that by its nature should continue, survive termination.',

      { h: '24. General' },
      'These Terms, with the policies in Section 1, are the entire agreement between you and Sponge about the Services and replace any earlier agreement on the same subject. If any provision is found unenforceable, it will be enforced to the maximum extent possible and the rest will stay in effect. Our failure to enforce a provision is not a waiver of it. You may not assign or transfer these Terms without our written consent; we may assign them, including as part of a merger, acquisition or sale of assets. We are not liable for any delay or failure caused by events beyond our reasonable control, including natural disasters, pandemics, supply shortages, carrier delays, internet or power failures and acts of government. You agree that we may give you notices and agreements electronically. Nothing in these Terms creates a partnership, employment or agency relationship. “Including” means “including without limitation”, and headings are for convenience only.',
      'Notice to California residents: under California Civil Code Section 1789.3, you may contact the Complaint Assistance Unit of the Division of Consumer Services of the California Department of Consumer Affairs in writing at 1625 North Market Blvd., Suite N 112, Sacramento, CA 95834, or by telephone at (916) 445-1254 or (800) 952-5210.',

      { h: '25. Contact us' },
      'Sponge Hydration LLC — team@spongehydration.com. Formal legal notices to us must be sent to that address with “Legal Notice” in the subject line. If you need a postal address for a formal notice, ask and we will provide it.',
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    updated: 'August 2026',
    body: [
      'This policy explains what Sponge Hydration LLC collects, why, who we hand it to, and what you can tell us to stop. It covers spongehydration.com and the Sponge mobile app. We have written it in plain English on purpose.',

      { h: 'The short version' },
      'We collect what we need to sell you a device, ship it, support it, and run the app. We do not sell your personal information for money. We do allow advertising companies to see some of your activity on this site — but only if you agree, and California law calls that "sharing". You can switch it off at the bottom of this page, from the "Do Not Sell or Share My Personal Information" link in our footer, or by turning on Global Privacy Control in your browser. We honour that signal automatically.',

      { h: 'What we collect, and where it comes from' },
      'Directly from you, when you give it to us:',
      { ul: [
        'Order details — name, email, shipping address, and what you bought. Your card details go straight to Stripe; we never see or store them.',
        'Contact form — your name, email, chosen topic, and message.',
        'Reviews — your rating, written feedback, what you use Sponge for, how you heard about us, an optional recommendation score, and an optional email address so we can follow up. Emails submitted with a review are never published.',
        'App account and hydration data — your account details and the sip and intake readings your device records.',
      ] },
      'Automatically, when you use the site:',
      { ul: [
        'Basic request data such as IP address and browser type, handled by Cloudflare as our host and security layer.',
        'Page-view measurement from Cloudflare Web Analytics. For each page load it records the page address, the referring address, the navigation type, and load-speed timings, together with a randomly generated identifier for that single page load and a token identifying this website. It sets no cookies, does not fingerprint your device, and does not link page loads together or follow you to other sites. We are being specific because this is measurement rather than strictly necessary infrastructure, and — unlike everything below — it currently runs before you make a choice. It is switched on at our hosting account rather than in the site itself, so the controls on this page cannot yet turn it off.',
        'If, and only if, you allow it: analytics and advertising identifiers stored as cookies in your browser by the companies named below. Nothing in that group loads before you choose, and declining means no request is made to them at all.',
      ] },

      { h: 'Why we use it' },
      { ul: [
        'To take payment, ship your order, and tell you where it is.',
        'To answer your emails and support requests.',
        'To run the app, show you your hydration history, and share it with the family members or caregivers you invite.',
        'To publish reviews you submit for publication.',
        'To keep the site up, secure, and free of fraud and abuse.',
        'With your permission only: to understand how the site is used, and to measure and target advertising.',
      ] },

      { h: 'Who we give it to' },
      'We use a small number of service providers, and only for the jobs listed here. We do not give your information to anyone else except where the law requires it, or if the business is sold — in which case this policy travels with it.',
      { ul: [
        'Stripe — payment processing and hosted checkout. Stripe collects your card and billing details directly and is responsible for them.',
        'Cloudflare — website hosting, content delivery, security, and the cookieless page-view measurement described above.',
        'Google — Gmail, to send your order confirmation and to deliver contact-form messages to our team, and Google Sheets, where our order records and email-list signups are kept. The site’s typefaces are served from our own domain, so no font provider sees your visit.',
        'Airtable — where submitted product reviews are stored.',
        'Google Analytics — site usage measurement. Only if you allow analytics.',
        'Microsoft Clarity — anonymised session replay and heatmaps that show how pages are used so we can improve them. It masks the text you type and the contents of form fields, so it does not capture what you enter. Only if you allow analytics.',
        'Meta (Facebook and Instagram) and TikTok — advertising measurement and targeting, both in your browser and, after a completed order, from our own server. Only if you allow advertising.',
      ] },

      { h: 'Selling versus sharing' },
      'These two words mean specific things under California law, and they are not the same, so we will be precise rather than reassuring.',
      'We do not sell your personal information. We do not exchange it for money, and we have not done so in the past twelve months.',
      'We do share personal information for cross-context behavioural advertising, if you allow advertising cookies. In practice that means Meta and TikTok can see pages you viewed, items you added to your cart, and orders you completed on this site, and can connect that to your account with them so that advertising can be targeted and measured. Because that fits California’s definition of "sharing", we disclose it plainly here and give you a way to stop it.',
      'If you decline advertising, or your browser sends a Global Privacy Control signal, we do not load those companies’ code and we do not send them your order from our server either. We have not shared the personal information of anyone we know to be under 16.',

      { h: 'Cookies and tracking technologies' },
      'Essential storage always runs: your cart is kept in your own browser, and Cloudflare sets what it needs to serve and protect the site. None of it is used to advertise to you and none of it can be switched off without breaking the store. Cloudflare Web Analytics, described above, also runs on every page load without setting a cookie.',
      'Optional cookies are set by Google Analytics and Microsoft Clarity (analytics) and by Meta and TikTok (advertising). They only ever load after you choose to allow that category. Decline, and no request is made to those companies at all.',
      'You can change your mind at any time using the controls at the bottom of this page or the "Do Not Sell or Share My Personal Information" link in the footer of every page. Withdrawing consent clears the cookies we can reach and reloads the page so nothing keeps running.',

      { h: 'Global Privacy Control' },
      'If your browser or extension sends a Global Privacy Control signal, we treat it as a valid request to opt out of sharing for advertising. It applies automatically, on every visit, without you having to click anything. When it is on, advertising is switched off, the toggle for it is locked, and we tell you that is why. Turn the signal off in your browser if you want that choice back.',

      { h: 'How long we keep it' },
      { ul: [
        'Order records — kept while we are still responsible for the order and for as long as tax, accounting, and warranty obligations require.',
        'Contact messages — kept as long as needed to resolve your question and keep a record of support history.',
        'Reviews — kept until you ask us to remove yours.',
        'App account and hydration data — kept while your account is open, and deleted when you close it or ask us to.',
        'Analytics and advertising data — retained by Google, Microsoft, Meta, and TikTok under their own policies once shared. Ask us and we will tell you what we hold on our side.',
      ] },

      { h: 'How we protect it' },
      'The site is served over HTTPS. Payment card details never reach our servers. Access to order records and support mailboxes is limited to the people who need it. Our service providers are bound by their own agreements with us. No system is perfectly secure, and we will not claim otherwise — if a breach affects you, we will tell you as required by law.',

      { h: 'Your rights' },
      'If you are a California resident, you have the right to:',
      { ul: [
        'Know what personal information we have collected, where it came from, why we collected it, and who we disclosed it to.',
        'Access a copy of it.',
        'Correct anything that is wrong.',
        'Delete it, subject to the records we are legally required to keep.',
        'Opt out of sharing for cross-context behavioural advertising — the control is on this page and in the footer of every page.',
        'Not be discriminated against for exercising any of these rights. Our prices and service do not change because you opted out.',
      ] },
      'We do not use or disclose sensitive personal information for purposes that require a separate right to limit it.',
      'You do not have to have an account to make a request. Email team@spongehydration.com with the words "privacy request" and tell us what you want. We will confirm receipt within 10 business days and respond within 45 calendar days, extending once by a further 45 days if we need longer and telling you why. To protect you, we will ask you to confirm details we already hold before we act — for an order, that usually means the email address you ordered with. An authorised agent may act for you if you give them written permission and we can verify it.',
      'You can also exercise the advertising opt-out yourself, immediately and without contacting us, using the controls below.',

      { h: 'Children' },
      'Sponge is not directed at children under 13, and we do not knowingly collect personal information from them. We do not knowingly sell or share the personal information of anyone under 16. If you believe a child has given us information, email team@spongehydration.com and we will delete it.',

      { h: 'Changes to this policy' },
      'If we change how we handle your information, we will update this page and change the "last updated" date at the top. Material changes to advertising or sharing will also reset your saved privacy choices, so you get asked again rather than being carried over silently.',

      { h: 'How to contact us' },
      'Sponge Hydration LLC — email team@spongehydration.com and we will reply within one business day. If you need a postal address for a formal privacy request, ask and we will provide it.',
    ],
  },
  'pre-order': {
    title: 'Pre-Order Policy',
    updated: 'August 2026',
    body: [
      'Sponge is currently sold as a pre-order. We manufacture in production batches, and a batch is built once enough pre-orders are reserved to fill one. Because of that, we do not commit to a delivery date when you order. We would rather tell you that plainly than give you a date we cannot stand behind.',
      'Your card is charged when you place a pre-order. Pre-order payments are what fund the production run your device comes from. In exchange, the price you pay is locked — if our pricing changes before your batch ships, you still pay what you paid on the day you ordered.',
      'You may cancel a pre-order at any time before it ships, for any reason, and receive a full refund to your original payment method. Email team@spongehydration.com with your order number. Refunds are issued within 7 business days of your request.',
      'We will email you when your batch enters production, and again with tracking when your device ships. If we decide not to produce a batch you have reserved, we will cancel your order and refund you in full without you needing to ask.',
      'Hardware specifications, colour, finish, and packaging may change in minor ways between pre-order and production. If we make a change that materially reduces what the device does, we will tell you before it ships and you may cancel for a full refund.',
      'Once your Sponge is delivered, our 30-day money-back guarantee and 1-year limited warranty apply from the delivery date. See the Return Policy and Warranty Policy for those terms.',
    ],
  },
  returns: {
    title: 'Return Policy',
    updated: 'August 2026',
    body: [
      'Every Sponge comes with a 30-day money-back guarantee. If you’re not happy, contact us within 30 days of delivery for a full refund.',
      'To start a return, email team@spongehydration.com with your order number. We’ll send a prepaid label for items being returned within the U.S.',
      'Refunds are issued to your original payment method once the device is received and inspected.',
      'This guarantee applies from the date your device is delivered. If you have placed a pre-order that has not shipped yet, you are not waiting on this policy — you can cancel outright for a full refund at any time. See our Pre-Order Policy.',
    ],
  },
  warranty: {
    title: 'Warranty Policy',
    updated: 'June 2026',
    body: [
      'Sponge devices are covered by a 1-year limited warranty against manufacturing defects from the date of delivery.',
      'If your device stops working due to a defect, contact team@spongehydration.com and we’ll repair or replace it at no cost.',
      'The warranty does not cover damage from misuse, accidents, or unauthorized modification.',
    ],
  },
}

// A body entry is a plain string (paragraph), { h } (heading), { ul } (list),
// or { b } — a bold paragraph, for the clauses (warranty disclaimer, liability
// cap, arbitration and class waiver) that the law expects to be conspicuous.
function Block({ block }) {
  if (typeof block === 'string') return <p>{block}</p>
  if (block.b) return <p className="legal__conspicuous"><strong>{block.b}</strong></p>
  if (block.h) return <h2 style={{ fontSize: 21, marginTop: 32 }}>{block.h}</h2>
  if (block.ul) {
    return (
      <ul style={{ margin: '0 0 14px', paddingLeft: '1.15em', color: 'var(--ink-soft)' }}>
        {block.ul.map((item, i) => <li key={i} style={{ marginBottom: 6 }}>{item}</li>)}
      </ul>
    )
  }
  return null
}

// Live controls on the privacy page itself, so "change or withdraw your choice"
// is something the reader can actually do here rather than be told about.
function PrivacyChoicesPanel() {
  const [consent, setConsentState] = useState(null)

  useEffect(() => {
    setConsentState(getConsent())
    const onChange = () => setConsentState(getConsent())
    window.addEventListener(CONSENT_EVENT, onChange)
    return () => window.removeEventListener(CONSENT_EVENT, onChange)
  }, [])

  const summary = () => {
    if (!consent) return ''
    if (!consent.decided) return 'You have not made a choice yet, so nothing optional is running.'
    const on = [consent.analytics && 'analytics', consent.advertising && 'advertising'].filter(Boolean)
    return on.length
      ? `Currently allowed: ${on.join(' and ')}.`
      : 'You have declined all optional analytics and advertising.'
  }

  return (
    <div className="privacy-panel">
      <h2 style={{ fontSize: 21, marginTop: 0 }}>Your current choices</h2>
      <p>
        {summary()}
        {consent?.gpc && ' Your browser is sending a Global Privacy Control signal, so advertising sharing is switched off automatically and cannot be turned on here.'}
      </p>
      <div className="privacy-panel__actions">
        <button type="button" className="btn btn--primary" onClick={openPrivacyPreferences}>
          Manage privacy choices
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => { clearTrackingCookies(); revokeConsent(); window.location.reload() }}
        >
          Withdraw my consent
        </button>
      </div>
    </div>
  )
}

export default function Legal() {
  const { doc } = useParams()
  const page = PAGES[doc]

  if (!page) {
    return (
      <section className="section">
        <Seo title="Not found | Sponge" description="Page not found." path={`/legal/${doc || ''}`} noindex />
        <div className="container empty-state">
          <h2>Page not found</h2>
          <Link to="/" className="btn btn--primary">Back home</Link>
        </div>
      </section>
    )
  }

  return (
    <section className="section">
      <Seo title={`${page.title} | Sponge Hydration`} description={`${page.title} for Sponge Hydration.`} path={`/legal/${doc}`} />
      <div className="container prose">
        <h1 style={{ fontSize: 34, fontWeight: 800, marginBottom: 8 }}>{page.title}</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 24 }}>Last updated {page.updated}</p>
        {page.body.map((block, i) => <Block key={i} block={block} />)}
        {doc === 'privacy' && <PrivacyChoicesPanel />}
        <p style={{ marginTop: 24 }}>
          Questions? <Link to="/contact" className="link-btn" style={{ display: 'inline' }}>Contact us</Link>.
        </p>
      </div>
    </section>
  )
}
