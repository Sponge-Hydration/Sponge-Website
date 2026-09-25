// Central product + content data for the Sponge site.

export const products = [
  {
    id: 'sponge-clip',
    slug: 'sponge-clip',
    name: 'Sponge Hydration Tracker',
    tagline: 'The clip-on tracker for any water bottle',
    clips: 1,
    price: 59.99,
    badge: 'Order now',
    img: '/media/products/single.jpg',
    gallery: [
      '/media/gallery/g1-white-vertical.jpg',
      '/media/gallery/g2-black-vertical.jpg',
      '/media/gallery/g3-side-profile.jpg',
      '/media/gallery/g4-on-bottle.jpg',
      '/media/gallery/g6-closeup.jpg',
      '/media/gallery/g5-packaging.jpg',
    ],
    short: 'Magnetic clip-on hydration tracking device that auto-logs every sip from the bottle you already own.',
    compare: 'Smart bottles start around $80 and ask you to replace the bottle you already own. Sponge clips onto it.',
    features: [
      'Works with any water bottle',
      'Automatic sip tracking',
      '2-week battery · USB-C charging',
      'Free iOS & Android app with app-lock',
      'Personalized starting goal, recommended at sign-up',
    ],
    ships: 'Ships with our next production batch',
  },
  {
    // The Dot logs what you tell it. It has no sensor and measures nothing, so
    // it must never inherit the Clip's tracking or accuracy language. What is
    // confirmed (Nathan, 2026-09-14): one press logs one full bottle, and setup
    // in the app asks for the bottle's volume. Battery life, charging, colours,
    // Bluetooth and App Lock support are NOT confirmed, so none are claimed.
    // No product photography exists yet; the image is a labelled placeholder.
    id: 'sponge-dot',
    slug: 'sponge-dot',
    name: 'Sponge Dot',
    tagline: 'One press. One bottle logged.',
    clips: 0,
    price: 29.99,
    badge: 'New · In development',
    img: '/media/products/dot-placeholder-wide.jpg',
    gallery: ['/media/products/dot-placeholder.jpg'],
    short: 'A one-button logger for the bottle you already own. Finish the bottle, press the Dot, and a full bottle of water lands in the free Sponge Hydration app.',
    compare: 'The Dot does not measure your sips. It logs a full bottle each time you press it, so it is only as complete as your presses. If you want every sip measured automatically, that is the Sponge Hydration Tracker.',
    features: [
      'One press logs one full bottle',
      'Set your bottle’s volume once, during setup in the app',
      'Logs to the free Sponge Hydration app',
      'No typing in drinks after setup',
    ],
    ships: 'In development, ships once production starts',
  },
  {
    id: 'sponge-2pack',
    slug: 'sponge-2-pack',
    name: 'Sponge 2-Pack',
    tagline: 'One for home, one for the gym',
    // Not currently offered, hidden from the shop, cart, prerender, and
    // checkout, but kept here so historical orders still resolve.
    hidden: true,
    clips: 2,
    price: 109.99,
    compareAt: 119.98,
    compareNote: 'if bought separately',
    badge: 'Best value',
    img: '/media/products/twopack.jpg',
    gallery: [
      '/media/products/twopack.jpg',
      '/media/gallery/g4-on-bottle.jpg',
      '/media/gallery/g6-closeup.jpg',
      '/media/gallery/g5-packaging.jpg',
    ],
    short: 'Two Sponge trackers so you never have to move it between bottles. Save $50 vs. buying separately.',
    features: [
      'Two Sponge hydration trackers',
      'Keep one on each bottle',
      'Both sync to one app account',
      'Same 2-week battery & app-lock',
      'Save $50 vs. buying two singles',
    ],
    ships: 'Ships with our next production batch',
  },
  {
    id: 'sponge-family',
    slug: 'sponge-family-pack',
    name: 'Sponge Family Pack',
    tagline: 'Hydration for the whole household',
    clips: 4,
    price: 199.99,
    compareAt: 239.96,
    compareNote: 'if bought separately',
    badge: 'Save $39.97',
    img: '/media/products/family.png',
    gallery: [
      '/media/products/family.png',
      '/media/gallery/g5-packaging.jpg',
      '/media/gallery/g1-white-vertical.jpg',
      '/media/gallery/g2-black-vertical.jpg',
    ],
    // The shared caregiver view (family dashboard + behind-goal alerts) is in
    // development, not shipped. It was listed here as an included feature until
    // 2026-09-22. Do not restore it until it actually ships.
    short: 'Four Sponge trackers for the household, one on each person’s bottle. A shared caregiver view, so family can see how a loved one is doing, is in development.',
    features: [
      'Four Sponge hydration trackers',
      'One for each person’s bottle',
      'Each person tracks in the free Sponge app',
      'Shared caregiver view in development',
      'Save $39.97 vs. buying four singles',
    ],
    ships: 'Ships with our next production batch',
  },
  {
    id: 'sponge-coaster',
    slug: 'sponge-coaster',
    name: 'Sponge Coaster',
    tagline: 'The set-it-down hydration tracker',
    clips: 0,
    price: 39.99,
    badge: 'Sold out',
    soldOut: true,
    img: '/media/products/coaster.jpg',
    gallery: [
      '/media/products/coaster.jpg',
      '/media/products/coaster-side.jpg',
    ],
    short: 'A coaster-style hydration tracker, set your bottle down on it and every sip is logged to the same free Sponge app.',
    features: [
      'Tracks any bottle you set on it',
      'Automatic sip tracking',
      'USB-C charging',
      'Syncs to the free Sponge app',
      'Works alongside the clip-on tracker',
    ],
    ships: 'Sold out',
  },
  {
    id: 'sponge-adhesive-3pack',
    slug: 'magnetic-adhesive-3-pack',
    name: 'Magnetic Adhesive 3-Pack',
    tagline: 'Make every bottle Sponge-ready',
    clips: 0,
    price: 14.99,
    badge: 'Accessory',
    img: '/media/products/adhesive-3pack.jpg',
    gallery: [
      '/media/products/adhesive-3pack.jpg',
      '/media/products/adhesive-peel.jpg',
      '/media/products/adhesive-dimensions.jpg',
    ],
    short: 'Three slim magnetic mounts so you can swap your Sponge between bottles in seconds, stick one on each bottle you use.',
    features: [
      'Three 60mm magnetic mounts',
      'Ultra-thin 0.7mm profile',
      'Strong 3M adhesive backing',
      'Sticks to steel, plastic, or glass bottles',
      'Snap your Sponge across bottles in seconds',
    ],
    ships: 'Ships with our next production batch',
  },
]

// Products shown in the shop and prerendered, hidden SKUs are excluded.
export const visibleProducts = products.filter((p) => !p.hidden)

export const productById = (id) => products.find((p) => p.id === id)
export const productBySlug = (slug) => products.find((p) => p.slug === slug)

// Color options a customer can choose for each Sponge clip.
export const colorOptions = [
  { id: 'black', label: 'Black', hex: '#1a1a1a' },
  { id: 'white', label: 'White', hex: '#f4f4f5' },
]

// Not currently offered. Kept so historical orders and saved carts still
// resolve to a readable label, re-enable by moving entries back above.
export const retiredColorOptions = [
  { id: 'light-blue', label: 'Light Blue', hex: '#7cc4ff' },
  { id: 'dark-blue', label: 'Dark Blue', hex: '#1e3a8a' },
  { id: 'light-gray', label: 'Light Gray', hex: '#cbd5e1' },
  { id: 'pink', label: 'Pink', hex: '#f9a8d4' },
]

export const DEFAULT_COLOR = 'black'
export const colorById = (id) => [...colorOptions, ...retiredColorOptions].find((c) => c.id === id)
export const colorLabel = (id) => colorById(id)?.label || id
export const isColorAvailable = (id) => colorOptions.some((c) => c.id === id)

// How many physical clips a product contains (multi-packs hold several,
// accessories like the coaster and adhesives have none, no color choice).
export const clipsFor = (id) => productById(id)?.clips ?? 1

// `id` is the stable anchor for /how-it-works#faq-<id>. Links elsewhere on the
// site (the homepage feature cards) point at these, so rename with care.
export const faqs = [
  { id: 'how-it-works', q: 'What is a hydration tracker and how does Sponge work?', a: 'A hydration tracker measures how much water you drink during the day. Sponge is a small clip-on hydration tracking device that snaps magnetically onto any water bottle. On-device sensors record each sip automatically and sync to the free Sponge app, so you never have to log water by hand.' },
  { id: 'any-bottle', q: 'Does the Sponge hydration tracking device work with any water bottle?', a: 'Yes. Sponge is built to clip onto the bottle you already own, insulated steel bottles, plastic tumblers, glass bottles and more. There is no special bottle to buy and nothing to refill differently.' },
  { id: 'battery', q: 'How long does the battery last?', a: 'Sponge lasts about two weeks on a single charge and recharges over USB-C in a couple of hours. Most people plug it in a couple of times a month.' },
  { id: 'app-lock', q: 'Can the hydration tracker really lock apps until I drink water?', a: 'Yes. In the app you pick which apps to gate, and Sponge keeps them locked until you reach your daily hydration goal, turning your phone into a gentle nudge to drink more water.' },
  { id: 'apple-health', q: 'Does it work with Apple Health?', a: 'Not yet. Apple Health sync is in testing now and ships with the next app update. Today there is a home-screen widget that shows how much you have had and how far you have to go, so on most days you never need to open the app.' },
  { id: 'accuracy', q: 'Is it accurate?', a: 'Sponge measures real sips with on-device sensors rather than asking you to remember and self-report, which is where most hydration tracking breaks down. The app shows your intake in real time so you always know where you stand.' },
  { id: 'daily-goal', q: 'How is my daily water goal set?', a: 'When you sign up, the app asks for a few details about you and recommends a starting goal from them, so you are not guessing at a number on day one. You can change it whenever you like. Sponge does not adjust the goal for you afterwards based on your activity or the weather. The target stays where you set it, and the tracker measures how close you get.' },
  { id: 'setup', q: 'How do I set up my Sponge?', a: 'Charge it over USB-C, download the free Sponge app, and pair over Bluetooth. Then clip it onto your bottle. Setup takes about two minutes and the app walks you through calibrating your bottle size.' },
  { id: 'sponge-dot', q: 'What is the Sponge Dot?', a: 'The Sponge Dot is a one-button logger for the bottle you already own. When you set it up, the Sponge Hydration app asks for your bottle’s volume. After that, every press logs one full bottle. The Dot does not measure sips, so it only knows what you press. If you want every sip measured automatically, that is the Sponge Hydration Tracker. The Dot is $29.99 plus shipping and tax. It is still in development, and a pre-order can be cancelled for a full refund any time before it ships.' },
  { id: 'price-and-shipping', q: 'How much does Sponge cost and when does it ship?', a: 'Sponge is $59.99 plus shipping and tax, and the companion app is free on iOS and Android. We build in production batches, and a batch runs once enough pre-orders are reserved to fill it, so rather than quote a delivery date we cannot stand behind, we email you when your batch enters production. You can cancel a pre-order for a full refund any time before it ships, and once it arrives you have 30 days to send it back.' },
  { id: 'returns', q: 'What is your return policy?', a: 'Every Sponge comes with a 30-day money-back guarantee. If it is not for you, contact support within 30 days of delivery for a full refund.' },
]

// Real customer reviews, verbatim from the Airtable feedback survey. No names
// were collected, so cards show "Verified customer" + the use case they picked.
// This is the baked-in fallback that prerenders and shows if Airtable is
// unreachable; the live approved list comes from Airtable via /api/reviews.
//
// ONLY GENUINE OUTSIDE CUSTOMERS BELONG HERE. Two entries were removed on
// 2026-09-09 because the survey rows behind them were submitted by the founders
// themselves ("Beautiful." and "Needs to be thinner, like 10mm total."). An
// officer or manager writing a review without disclosing that relationship is
// an unfair or deceptive practice under FTC 16 CFR 465.5. A third 5-star row
// left no written feedback and never appeared here.
//
// Before adding an entry, check the Email column in the Airtable base. If it
// belongs to anyone at Sponge, it does not go on the site.
// Keep this snapshot in sync when the approved reviews change.
export const reviews = [
  {
    stars: 4,
    quote:
      'Still testing it out but the app works well. It would be nice to see a how-to video explaining any nuances, including whether it keeps tracking water intake when the app is closed. It would be cool if it integrated with Whoop or Apple Health.',
    loc: 'Daily habit building · Fitness and training',
  },
  {
    stars: 4,
    quote:
      'I really like the clip from a hardware perspective. The main thing I’d love is a connection from the app to Apple Health, and, if possible, not having to open the app to sync data from the clip.',
    loc: 'Fitness and training · Preventive health',
  },
]

// Body blocks: a string is a paragraph; {h2}, {h3}, {ul}, {note}, {quote, cite}
// and {img, alt, caption} are blocks. Inside any string, [3] or [3, 4] becomes a
// superscript link to that numbered source, and [label](/path) an internal link.
// Every number in a health post must trace to a source in its `sources` list.
export const blogPosts = [
  {
    slug: 'the-story-behind-sponge',
    title: 'The Story Behind Sponge',
    excerpt: 'Sponge started with an ambulance ride that an IV fixed in under an hour. Here is how two grandparents, a coaster and a lot of water bottles turned into the tracker we make today.',
    date: '2026-09-22',
    readTime: '5 min read',
    tag: 'Our story',
    cover: '/media/team/founders.jpg',
    coverPos: 'center 42%', // keep both founders' faces in the thumbnail crop
    // Facts: Chris's story is his own words from the Elderly Hydration pitch
    // deck (Drive). The deck says "grandmother", but Nathan confirmed on
    // 2026-09-22 that it was Chris's GRANDFATHER, and that his grandfather's
    // dementia, and his better days when well hydrated, are true. The Drive deck
    // still says grandmother; do not "correct" this back from it. Nathan's
    // grandmother, the coaster (V0), the Clip launch and Cal Poly are from
    // marketing/_context and company-strategy.
    body: [
      'Most companies have an origin story that sounds better than it was. Ours is not especially glamorous. It is mostly about a grandfather, an ambulance and a bag of IV fluid.',
      {
        quote: 'My grandfather was bedridden the last two years of his life and needed 24-hour at-home care. There were days when my mom would arrive and my grandfather would tell her that he did not feel well and that he wanted to go to the hospital. So my mom would ask his symptoms and check his vitals. No pain in the chest, normal heart rate and blood pressure, no fever. But my grandfather was adamant, and so my mom called an ambulance. When he got to his room, the first thing the nurse would do is plug in an IV. Thirty to forty-five minutes later my grandfather felt fine again. He was just dehydrated.',
        cite: 'Christopher Miglio, co-founder',
      },
      'It happened three more times in those two years. Each ambulance ride and hospital stay cost more than $5,000, and that was with insurance. The cost of round-the-clock care meant the family had to pitch in, so Chris’s mom was driving two hours, three or four days a week, to help.',
      'His grandfather also had dementia, and Chris noticed a pattern. On well-hydrated days his grandfather was more alert, more oriented, more present. On dehydrated days he was noticeably worse. That is one family’s observation, not a clinical finding, but it is the one that stayed with him.',
      'Nobody in that story did anything wrong. The problem was that nobody (not the family, not the people caring for him, not his grandfather himself) had a reliable way to know how much he had actually had to drink that day.',
      'That turns out to be the normal state of things, not bad luck. Dehydration in older adults is common and hard to see: thirst fades with age, and a Cochrane review found that none of the usual bedside signs reliably detect it [1]. In one UK hospital study, 37% of adults aged 65 and over who were admitted as emergencies arrived dehydrated [2]. We wrote the long version, with the research, in [The Dehydration Problem](/blog/the-dehydration-problem).',
      { h2: 'Nathan’s grandmother' },
      'Nathan’s grandmother had Alzheimer’s disease. Watching her lose her independence sent him looking for anything a person could actually do, day to day, to look after their health over the long run. There are not many dials you control directly. How much you drink is one of them.',
      'He is also a competitive athlete: a marathon finisher who races triathlon in Orange County, so hydration was already part of his training, and he felt the difference in how he trained and recovered. The research backs up the everyday part of that: even mild dehydration shows up in mood, concentration and fatigue in healthy young adults [3, 4]. What research cannot yet tell anyone is whether drinking more water protects the ageing brain. That science is still young, and we do not claim it does.',
      'Two founders, two grandparents, one conclusion. Most people know they should drink more water, and almost nobody actually does. Knowing was never the missing piece.',
      { h2: 'Version zero was a coaster' },
      'Nathan Katzaroff and Christopher Miglio are both Cal Poly San Luis Obispo graduates, and Dominic Dal Porto builds Sponge’s app and firmware. The first Sponge was not a clip at all. It was a coaster: you set your drink on it, and it logged what was gone each time you put the drink back down.',
      'The coaster proved the idea. Weight is a good way to measure what someone drinks, and it asks nothing of the person except putting the cup down. It also showed us the catch. A coaster only works where the coaster is. You had to come back to it after every sip, and the moment your bottle left the desk, the record stopped.',
      'We built our first pitch around care facilities, because that is where the problem is most concentrated: a device at every bedside, and a view for the people doing the caring. The more we worked on it, the clearer it became that the sensor had to go wherever the drink goes.',
      { h2: 'Then it became a clip' },
      'So we moved the sensor off the table and onto the bottle. The Sponge Clip attaches magnetically to the bottom of the bottle you already own: steel, plastic or glass. Every time you set the bottle down, a load cell and an accelerometer take a weight reading, and an on-device algorithm turns the change between readings into your water intake. You drink the way you always have.',
      'The first Clips shipped in the spring of 2026, and more than 100 Sponge products have now shipped to customers.',
      { h2: 'Why your phone gets involved' },
      'Measuring solves half the problem. A number on a screen tells you that you are behind; it does not make you do anything about it. Reminders are the same, and they are easy to swipe away.',
      'So we built App Lock. You choose the apps you lose time to, and they stay locked until you have hit your water goal. It is a little brutal. It is also the most direct way we know to turn a good intention into something you actually do.',
      { h2: 'Where we are going' },
      'We are a small team and we build in batches. Three things are in progress right now:',
      {
        ul: [
          'A caregiver view, so family and care staff can see who is falling behind: the tool Chris’s family never had.',
          'Apple Health sync, in testing now and shipping with the next app update.',
          'The Sponge Dot, a one-button logger for people who want something simpler than measurement.',
        ],
      },
      {
        quote: 'Our desire to never see anyone suffer and deteriorate the way our grandparents did.',
        cite: 'From Sponge’s founding statement',
      },
      'That is still the job. [See how Sponge works](/how-it-works), or [meet the team](/team).',
      { note: 'Sponge is a general wellness product. It measures how much you drink. It does not assess your hydration status, and it is not a medical device. If you care for someone with a condition that affects fluid balance, their clinician sets the target, not an app.' },
    ],
    sources: [
      { text: 'Hooper L, Abdelhamid A, Attreed NJ, et al. Clinical symptoms, signs and tests for identification of impending and current water-loss dehydration in older people. Cochrane Database of Systematic Reviews 2015;(4):CD009647.', url: 'https://pubmed.ncbi.nlm.nih.gov/25924806/' },
      { text: 'El-Sharkawy AM, Watson P, Neal KR, et al. Hydration and outcome in older patients admitted to hospital (the HOOP prospective cohort study). Age and Ageing 2015;44(6):943–947.', url: 'https://pubmed.ncbi.nlm.nih.gov/26316508/' },
      { text: 'Armstrong LE, Ganio MS, Casa DJ, et al. Mild dehydration affects mood in healthy young women. Journal of Nutrition 2012;142(2):382–388.', url: 'https://pubmed.ncbi.nlm.nih.gov/22190027/' },
      { text: 'Ganio MS, Armstrong LE, Casa DJ, et al. Mild dehydration impairs cognitive performance and mood of men. British Journal of Nutrition 2011;106(10):1535–1543.', url: 'https://pubmed.ncbi.nlm.nih.gov/21736786/' },
    ],
  },
  {
    slug: 'the-dehydration-problem',
    title: 'The Dehydration Problem: Who It Hurts, Why the Usual Fixes Fail, and What We Are Doing About It',
    excerpt: 'Dehydration sends older adults to hospital, shows up in kidney stones, infections and headaches, and is remarkably hard to spot. Here is what the research actually says, including where it is weaker than the headlines.',
    date: '2026-09-22',
    readTime: '11 min read',
    tag: 'The problem',
    cover: '/media/lifestyle/closeup.jpg',
    coverPos: 'center 62%', // keep the Sponge and its status light in the thumbnail crop
    // Every figure below was checked against the source abstract on 2026-09-22.
    // Two figures from the 2024 nursing-home deck ("$1.36B in 1996", "a 40.4%
    // rise 1990–2000") are NOT in Xiao 2004's abstract and are deliberately not
    // used. Nor is the popular "75% of Americans are dehydrated" line.
    body: [
      'You already know you should drink more water. Most people do. The trouble is that knowing has never been enough, and the cost of that gap is larger than it looks: hospital admissions for older adults, recurring kidney stones and bladder infections, and a steady drag on how clearly the rest of us think on an ordinary afternoon.',
      'This is the long version of the problem Sponge exists to solve. We have tried to be careful about which claims the research supports and to say plainly where it does not. Every number below links to its source.',
      { h2: 'How common is under-drinking?' },
      'More common than most people guess. Using national survey data from 2009 to 2012, researchers measured urine concentration in more than 9,500 US adults aged 18 to 64. By their threshold, 32.6% were inadequately hydrated, about one in three [1]. The same method applied to children and teenagers found 54.5% [2].',
      'Those figures come from a single urine sample, so they are a snapshot rather than a diagnosis. But they make the point: this is not a problem confined to hospitals or heatwaves. It is the ordinary state of a large share of people on an ordinary day.',
      'You may have seen the claim that 75% of Americans are chronically dehydrated. We could not find a study behind it, so we do not use it.',
      { h2: 'Why older adults are hit hardest' },
      'Thirst gets weaker with age. In a classic study in the New England Journal of Medicine, healthy men aged 67 to 75 went 24 hours without water alongside men in their twenties. The older men ended up more dehydrated, yet felt less thirsty and drank less once water was offered again [3]. Their kidneys were also less able to concentrate urine, so they lost more water in the first place.',
      'In long-term care, the result shows up in blood tests. The UK DRIE study measured serum osmolality in 188 care home residents and found that 20% were dehydrated. Thirst was not associated with hydration status at all [4]: the residents who needed water most were no more likely to feel thirsty. Kidney function, cognitive impairment and diabetes were the factors that tracked with it.',
      'That is the core difficulty. The warning signal most of us rely on is the one that fails first, in the people least able to compensate.',
      { h2: 'The hospital bill' },
      'When dehydration goes unnoticed, it often ends in an admission. An analysis of 1991 Medicare records found dehydration listed among the diagnoses on 6.7% of all hospital stays by older Americans: 731,695 stays, or 236 for every 10,000 beneficiaries. Medicare paid more than $446 million that year for stays where dehydration was the main diagnosis, and about half of the older patients hospitalized with dehydration died within a year [5].',
      'That last figure needs care. Dehydration rarely arrives alone; pneumonia and urinary tract infections were frequent companions in the same data, so it is a marker of frailty as much as a cause of it. But it is also one of the few parts of that picture that is cheap to prevent.',
      'A later analysis of 1999 hospital discharges put the average stay for a principal diagnosis of dehydration at 4.6 days and $7,442 in charges, and estimated that avoidable dehydration admissions of older adults could have cost as much as $1.14 billion nationally that year [6]. Most of those patients lived in the community rather than in a nursing home: at home, often with family doing the caregiving.',
      { h2: 'Nursing homes and avoidable admissions' },
      'For people living in nursing facilities, dehydration is on a short list of conditions that experts class as potentially avoidable hospitalizations: problems that can often be prevented or managed without a hospital stay. In a national study of people covered by both Medicare and Medicaid, 39% of admissions from nursing facilities and home- and community-based care met that definition, and five conditions (pneumonia, heart failure, urinary tract infections, dehydration, and COPD or asthma) accounted for 78% of them [7].',
      'Once an older adult is in hospital, it still matters. In the HOOP study, 37% of adults aged 65 and over admitted as emergencies to a UK teaching hospital were dehydrated on arrival, and 62% of those were still dehydrated two days later. After adjusting for age, frailty and other illness, those who arrived dehydrated were six times more likely to die in hospital [8].',
      'Some of the most encouraging evidence comes from care homes themselves. When four care homes in England introduced seven structured drink rounds a day, plus staff training, urinary tract infections needing antibiotics fell by 58% and infections needing a hospital admission fell by 36% [9]. It was a quality-improvement project rather than a randomized trial, and its authors are candid about its limits, but the direction is hard to ignore. Infections matter doubly here, because in older adults a urinary tract infection often shows up not as a fever but as sudden confusion and delirium [10].',
      'One of our co-founders watched this happen to his grandfather. It is [the reason Sponge exists](/blog/the-story-behind-sponge).',
      { h2: 'The chronic conditions linked to low fluid intake' },
      'Outside hospital, low fluid intake is linked to a longer list of conditions. The evidence ranges from randomized trials to associations in large groups of people, and it is worth knowing which is which.',
      {
        ul: [
          'Kidney stones: the strongest evidence. In a five-year randomized trial of people who had just had their first calcium stone, 12 of 99 who were told to drink more water had another stone, against 27 of 100 who were not, and the stones that did come back took longer to do so [11]. Drinking more is the first-line advice for preventing a repeat.',
          'Urinary tract infections: good evidence in one group. In a year-long randomized trial of 140 premenopausal women with recurrent bladder infections who drank less than 1.5 litres a day, adding 1.5 litres of water a day cut episodes from 3.2 to 1.7 and nearly halved the courses of antibiotics they needed [12].',
          'Chronic kidney disease: a caution. Observational studies link higher intake to better kidney function, but when a randomized trial coached people with stage 3 kidney disease to drink more, their kidney function declined no more slowly after a year than the control group’s [13]. The authors note the trial may have been too small to detect a real difference. More water is not a treatment for kidney disease.',
          'Blood sugar: an association. In a nine-year French study of 3,615 middle-aged adults, those who drank half a litre to a litre of water a day had about a third lower risk of developing high blood sugar than those who drank less than half a litre [14]. Intake was self-reported, and an association is not proof of cause.',
          'Weight: an association, plus some trial evidence. In the national survey above, adults who were inadequately hydrated had higher BMIs and 59% higher odds of obesity [1]. More on weight below.',
          'Chronic disease and ageing: a large, recent association. Following 15,752 adults for 25 years, researchers at the National Institutes of Health found that people whose blood sodium in middle age sat at the high end of normal (above 142 mmol/L, a marker of habitually lower fluid intake) had a 39% higher risk of developing chronic diseases and were up to 50% more likely to be biologically older than their age. Above 144 mmol/L, the risk of dying early was 21% higher [15]. The authors are explicit that intervention trials are needed to show cause.',
        ],
      },
      'The most useful single summary is a 2024 systematic review in JAMA Network Open that gathered every randomized trial it could find that changed how much water people drank. There were only 18. The clearest benefits were for weight loss and kidney stones; single trials suggested benefits for migraine, urinary tract infections, diabetes control and low blood pressure; and 8 of the 18 reported negative results [16]. That is the honest state of the science: fewer trials than the topic deserves, a few solid wins, and a lot of promising associations.',
      { h2: 'What it does to everyone else' },
      'You do not have to be unwell for this to matter. In laboratory studies, losing around 1.5% of body weight in fluid, which these studies produced with a few hours of exercise, measurably changes how healthy young adults feel and think.',
      { h3: 'Focus and mood' },
      'Young women dehydrated by about 1.4% of body weight reported worse mood, lower concentration, more fatigue and more headaches, and found tasks harder, although most of their cognitive test scores held up [17]. Young men at about 1.6% made more errors on a vigilance task, were slower on a working-memory task, and reported more fatigue and tension [18].',
      { h3: 'Headaches' },
      'Water-deprivation headache was first described in the medical literature in 2004. In a survey of family, colleagues and acquaintances, about 1 in 10 said going without fluid gave them a headache, and drinking water usually relieved it within 30 minutes to three hours [19]. Among 256 women with migraine, those who drank more water had less frequent, shorter and less severe attacks [20], an association, not proof. A small pilot trial in 18 people with frequent headaches found that drinking about an extra litre a day cut total headache time by an average of 21 hours over two weeks, but the result was not statistically certain [21]. Promising, not settled.',
      { h3: 'Metabolism' },
      'This is where popular claims run furthest ahead of the evidence. A 2003 study reported that drinking 500 mL of water raised metabolic rate by 30%, peaking within about 40 minutes [22]. When another group tested the idea in a randomized crossover study, room-temperature water produced no measurable increase at all, and ice-cold water produced a small one, about 4.5% over an hour [23]. The better-supported result is about weight rather than metabolism: in a 12-week trial, middle-aged and older adults on a calorie-controlled diet who drank 500 mL of water before each meal lost about 2 kg more than those on the diet alone, probably because they ate a little less at meals [24].',
      { h3: 'Inflammation' },
      'The honest answer is that this link is mostly mechanistic. In cells and tissues, hyperosmotic stress (the more concentrated internal environment that comes with water loss) is a potent trigger for inflammatory signalling [25]. But no trial has shown that drinking more water lowers inflammation in healthy adults. Anyone who tells you it does is ahead of the evidence, and we would rather not be.',
      { h2: 'Why the usual fixes fail' },
      'If the stakes are this real and water is this cheap, why does the problem persist? Because each of the common fixes quietly depends on something that breaks.',
      {
        ul: [
          '“Drink when you are thirsty.” Sound advice for many healthy adults, and exactly the signal that fades with age. In the care home study above, thirst did not track hydration at all [4].',
          '“Watch for the signs.” Dark urine, dry mouth, tiredness. A Cochrane review assessed 67 symptoms, signs and tests for dehydration in older people and found that none worked reliably on its own: they missed many people who were dehydrated and wrongly flagged many who were not [26]. One of the few signals that showed promise, in a single small study, was simply whether a person was missing drinks between meals: a question about intake, not symptoms.',
          '“Write it down.” Care homes use paper fluid charts. In a study that checked them against direct observation, few charts were even returned, and the ones that were bore almost no relation to what residents drank, off by an average of about 700 mL a day [27]. At home, the equivalent is an app you type your drinks into. It works for as long as you remember to type, which is the problem it was meant to solve.',
          '“Set a reminder.” Reminders tell you to drink, but they cannot tell whether you did, so they fire whether you need them or not, and they are easy to dismiss.',
          '“Buy a smart bottle.” The good ones measure well: one was accurate to within 3% over 24 hours in a small clinical pilot [28], although a comparison of four commercial models found real differences, including a smart lid that missed many sips because its sensor did not reach the whole bottle [29]. The bigger problem is the bottle itself. A smart bottle only counts what you drink from that bottle, and they typically start around $80. The moment you grab a different one at the gym or the office, your record has a hole in it.',
          '“Do drink rounds.” The care home project above shows that routine works [9]. It also depends on staff time, and its authors flag staff turnover as a challenge. Rounds make drinking regular; on their own, they do not show anyone who is falling behind.',
        ],
      },
      { h2: 'What we are doing differently' },
      'Sponge is our answer to those failure points, one at a time.',
      {
        ul: [
          'It measures instead of asking you to remember. Sponge clips under the bottle and uses a load cell and an accelerometer to take a weight reading each time the bottle is set down. An on-device algorithm turns the change between readings into your water intake. Nothing to type, nothing to recall.',
          'It works on the bottle you already own. The sensor lives in a clip rather than a bottle, and magnetic adhesive mounts let you move it between the bottles you use.',
          'It makes falling behind visible. The app shows your intake against your goal through the day, so a missed afternoon is obvious at 3 p.m., not at bedtime. It is the kind of intake signal researchers found promising, recorded for you.',
          'It adds a consequence. Knowing was never the missing piece; follow-through was. App Lock keeps the apps you choose shut until you have hit your water goal. We have not run a clinical trial on it and will not pretend otherwise. What we can say is that it turns a reminder you can ignore into a decision you have to make.',
          'It is being built with caregivers in mind. We started with older adults, and a view that lets family and care staff see who is falling behind is in development. [Read more for caregivers](/caregivers).',
        ],
      },
      'What Sponge is not: it measures how much water you drink. It does not measure your hydration status, diagnose anything or replace a clinician. If you care for someone with heart failure, kidney disease or any condition where fluid is restricted, their care team sets the target, not an app.',
      '[See how Sponge works](/how-it-works).',
      { note: 'Sponge is a general wellness product, not a medical device. This article summarises published research for general information; it is not medical advice. If you have symptoms that concern you, or a condition that affects fluid balance, talk to a clinician.' },
    ],
    sources: [
      { text: 'Chang T, Ravi N, Plegue MA, Sonneville KR, Davis MM. Inadequate hydration, BMI, and obesity among US adults: NHANES 2009–2012. Annals of Family Medicine 2016;14(4):320–324.', url: 'https://pubmed.ncbi.nlm.nih.gov/27401419/' },
      { text: 'Kenney EL, Long MW, Cradock AL, Gortmaker SL. Prevalence of inadequate hydration among US children and disparities by gender and race/ethnicity: NHANES 2009–2012. American Journal of Public Health 2015;105(8):e113–e118.', url: 'https://pubmed.ncbi.nlm.nih.gov/26066941/' },
      { text: 'Phillips PA, Rolls BJ, Ledingham JG, et al. Reduced thirst after water deprivation in healthy elderly men. New England Journal of Medicine 1984;311(12):753–759.', url: 'https://pubmed.ncbi.nlm.nih.gov/6472364/' },
      { text: 'Hooper L, Bunn DK, Downing A, et al. Which frail older people are dehydrated? The UK DRIE study. Journals of Gerontology Series A 2016;71(10):1341–1347.', url: 'https://pubmed.ncbi.nlm.nih.gov/26553658/' },
      { text: 'Warren JL, Bacon WE, Harris T, et al. The burden and outcomes associated with dehydration among US elderly, 1991. American Journal of Public Health 1994;84(8):1265–1269.', url: 'https://pubmed.ncbi.nlm.nih.gov/8059883/' },
      { text: 'Xiao H, Barber J, Campbell ES. Economic burden of dehydration among hospitalized elderly patients. American Journal of Health-System Pharmacy 2004;61(23):2534–2540.', url: 'https://pubmed.ncbi.nlm.nih.gov/15595228/' },
      { text: 'Walsh EG, Wiener JM, Haber S, et al. Potentially avoidable hospitalizations of dually eligible Medicare and Medicaid beneficiaries from nursing facility and home- and community-based services waiver programs. Journal of the American Geriatrics Society 2012;60(5):821–829.', url: 'https://pubmed.ncbi.nlm.nih.gov/22458363/' },
      { text: 'El-Sharkawy AM, Watson P, Neal KR, et al. Hydration and outcome in older patients admitted to hospital (the HOOP prospective cohort study). Age and Ageing 2015;44(6):943–947.', url: 'https://pubmed.ncbi.nlm.nih.gov/26316508/' },
      { text: 'Lean K, Nawaz RF, Jawad S, Vincent C. Reducing urinary tract infections in care homes by improving hydration. BMJ Open Quality 2019;8(3):e000563.', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6629391/' },
      { text: 'Dutta C, Pasha K, Paul S, et al. Urinary tract infection induced delirium in elderly patients: a systematic review. Cureus 2022;14(12):e32321.', url: 'https://pubmed.ncbi.nlm.nih.gov/36632270/' },
      { text: 'Borghi L, Meschi T, Amato F, et al. Urinary volume, water and recurrences in idiopathic calcium nephrolithiasis: a 5-year randomized prospective study. Journal of Urology 1996;155(3):839–843.', url: 'https://pubmed.ncbi.nlm.nih.gov/8583588/' },
      { text: 'Hooton TM, Vecchio M, Iroz A, et al. Effect of increased daily water intake in premenopausal women with recurrent urinary tract infections: a randomized clinical trial. JAMA Internal Medicine 2018;178(11):1509–1515.', url: 'https://pubmed.ncbi.nlm.nih.gov/30285042/' },
      { text: 'Clark WF, Sontrop JM, Huang SH, et al. Effect of coaching to increase water intake on kidney function decline in adults with chronic kidney disease: the CKD WIT randomized clinical trial. JAMA 2018;319(18):1870–1879.', url: 'https://pubmed.ncbi.nlm.nih.gov/29801012/' },
      { text: 'Roussel R, Fezeu L, Bouby N, et al. Low water intake and risk for new-onset hyperglycemia. Diabetes Care 2011;34(12):2551–2554.', url: 'https://pubmed.ncbi.nlm.nih.gov/21994426/' },
      { text: 'Dmitrieva NI, Gagarin A, Liu D, Wu CO, Boehm M. Middle-age high normal serum sodium as a risk factor for accelerated biological aging, chronic diseases, and premature mortality. eBioMedicine 2023;87:104404.', url: 'https://pubmed.ncbi.nlm.nih.gov/36599719/' },
      { text: 'Hakam N, Guzman Fuentes JL, Nabavizadeh B, et al. Outcomes in randomized clinical trials testing changes in daily water intake: a systematic review. JAMA Network Open 2024;7(11):e2447621.', url: 'https://pubmed.ncbi.nlm.nih.gov/39585691/' },
      { text: 'Armstrong LE, Ganio MS, Casa DJ, et al. Mild dehydration affects mood in healthy young women. Journal of Nutrition 2012;142(2):382–388.', url: 'https://pubmed.ncbi.nlm.nih.gov/22190027/' },
      { text: 'Ganio MS, Armstrong LE, Casa DJ, et al. Mild dehydration impairs cognitive performance and mood of men. British Journal of Nutrition 2011;106(10):1535–1543.', url: 'https://pubmed.ncbi.nlm.nih.gov/21736786/' },
      { text: 'Blau JN, Kell CA, Sperling JM. Water-deprivation headache: a new headache with two variants. Headache 2004;44(1):79–83.', url: 'https://pubmed.ncbi.nlm.nih.gov/14979888/' },
      { text: 'Khorsha F, Mirzababaei A, Togha M, Mirzaei K. Association of drinking water and migraine headache severity. Journal of Clinical Neuroscience 2020;77:81–84.', url: 'https://pubmed.ncbi.nlm.nih.gov/32446809/' },
      { text: 'Spigt MG, Kuijper EC, Schayck CP, et al. Increasing the daily water intake for the prophylactic treatment of headache: a pilot trial. European Journal of Neurology 2005;12(9):715–718.', url: 'https://pubmed.ncbi.nlm.nih.gov/16128874/' },
      { text: 'Boschmann M, Steiniger J, Hille U, et al. Water-induced thermogenesis. Journal of Clinical Endocrinology & Metabolism 2003;88(12):6015–6019.', url: 'https://pubmed.ncbi.nlm.nih.gov/14671205/' },
      { text: 'Brown CM, Dulloo AG, Montani JP. Water-induced thermogenesis reconsidered: the effects of osmolality and water temperature on energy expenditure after drinking. Journal of Clinical Endocrinology & Metabolism 2006;91(9):3598–3602.', url: 'https://pubmed.ncbi.nlm.nih.gov/16822824/' },
      { text: 'Dennis EA, Dengo AL, Comber DL, et al. Water consumption increases weight loss during a hypocaloric diet intervention in middle-aged and older adults. Obesity 2010;18(2):300–307.', url: 'https://pubmed.ncbi.nlm.nih.gov/19661958/' },
      { text: 'Brocker C, Thompson DC, Vasiliou V. The role of hyperosmotic stress in inflammation and disease. Biomolecular Concepts 2012;3(4):345–364.', url: 'https://pubmed.ncbi.nlm.nih.gov/22977648/' },
      { text: 'Hooper L, Abdelhamid A, Attreed NJ, et al. Clinical symptoms, signs and tests for identification of impending and current water-loss dehydration in older people. Cochrane Database of Systematic Reviews 2015;(4):CD009647.', url: 'https://pubmed.ncbi.nlm.nih.gov/25924806/' },
      { text: 'Jimoh FO, Bunn D, Hooper L. Assessment of a self-reported drinks diary for the estimation of drinks intake by care home residents: Fluid Intake Study in the Elderly (FISE). Journal of Nutrition, Health & Aging 2015;19(5):491–496.', url: 'https://pubmed.ncbi.nlm.nih.gov/25923476/' },
      { text: 'Borofsky MS, Dauw CA, York N, Terry C, Lingeman JE. Accuracy of daily fluid intake measurements using a “smart” water bottle. Urolithiasis 2018;46(4):343–348.', url: 'https://pubmed.ncbi.nlm.nih.gov/28980082/' },
      { text: 'Cohen R, Fernie G, Roshan Fekr A. Monitoring fluid intake by commercially available smart water bottles. Scientific Reports 2022;12:4402.', url: 'https://pubmed.ncbi.nlm.nih.gov/35292675/' },
    ],
  },
  {
    slug: 'how-much-water-should-you-drink',
    title: 'How Much Water Should You Actually Drink a Day?',
    excerpt: 'The "8 glasses a day" rule has no evidence behind it, and the real guidance is stranger than the myth. Here is what the reference intakes actually say.',
    date: '2026-05-28',
    readTime: '4 min read',
    tag: 'Hydration science',
    cover: '/media/lifestyle/desk.jpg',
    coverPos: 'center 82%', // keep the bottle (lower-center) in the thumbnail crop
    body: [
      'Almost everyone has heard that you should drink eight 8-ounce glasses of water a day. It is a tidy number, it fits on a fridge magnet, and it has no scientific basis at all.',
      { h2: 'Where "8 × 8" actually came from' },
      'In 2002, Heinz Valtin, a kidney physiologist at Dartmouth who had spent his career studying water balance, went looking for the evidence behind the rule. He published the result in the American Journal of Physiology, and his conclusion was blunt: he could find no scientific studies in support of 8 × 8.',
      'He did find a likely origin. In 1945 the Food and Nutrition Board of the US National Research Council suggested roughly 1 millilitre of water per calorie of food, which lands somewhere near 64 to 80 ounces a day for a typical diet. The very next sentence noted that most of that quantity is already contained in prepared foods. That second sentence is the one that got lost. What survived was a number, detached from the caveat that made sense of it.',
      'Valtin also dispatched a related myth: caffeinated drinks like coffee, tea and soft drinks do count toward your daily fluid. The idea that coffee somehow puts you in fluid deficit does not hold up.',
      { h2: 'What the reference intakes actually say' },
      'The closest thing to an official number comes from the US National Academies, whose 2004 report set adequate intakes for water. For adults, that is about 3.7 litres a day for men and 2.7 litres a day for women.',
      'Those figures are almost always quoted wrong, so it is worth being precise about three things.',
      {
        ul: [
          'They are total water, not glasses of water. Every beverage counts, and so does the water in your food.',
          'About 20% of the typical intake comes from food, with the remaining 80% from drinks of all kinds. Subtract the food and the drinking target is closer to 3 litres and 2.2 litres.',
          'They are not requirements. An adequate intake is the median intake of people who appeared to be adequately hydrated. It describes what healthy people happened to drink, not a threshold you fall below at your peril.',
        ],
      },
      'The same report was careful to say that people who are very physically active or who live in hot climates need more, and it declined to set an upper limit for healthy people with functioning kidneys.',
      { h2: 'The formula you have probably been given' },
      'A popular rule of thumb says half an ounce to one ounce of water per pound of body weight. It has the appeal of sounding personalised, and for many people it produces a number in a reasonable range. But no major health authority uses it, and the range it gives is enormous: for a 170-pound adult it spans 85 to 170 ounces, which is either modest or close to double the adequate intake depending on which end you pick. A rule that can double its own answer is not really telling you much.',
      { h2: 'What genuinely changes your number' },
      'Body size matters, but so do several things a weight formula cannot see: how much you sweat, the heat and humidity you are in, altitude, illness involving fever or vomiting, pregnancy and breastfeeding, and some medications. Two people of identical weight can have materially different needs on the same day, and the same person can differ from Tuesday to Wednesday.',
      { h2: 'So what should you actually do?' },
      'The National Academies gave sensible advice when the report landed: for most healthy people, thirst is a reasonable guide. Thirst is more sensitive than its reputation suggests: it registers at around 0.5% body-mass loss during ordinary daily activity, and at roughly 1 to 2% under exercise and heat stress.',
      'The problem is not that thirst is a bad signal. It is that thirst is easy to override. A meeting runs long, the bottle is in another room, you are concentrating, and the signal passes unremarked. Thirst also blunts with age, which is why fluid intake is monitored more deliberately in older adults.',
      'Urine colour is the other practical check: pale straw suggests you are keeping up, consistently dark suggests you are not. It is imperfect (vitamins, some foods and some medications shift the colour independently of hydration), but it is free and it is directional.',
      { h2: 'Where measurement comes in' },
      'Whatever target you land on, there is a gap that no guideline can close for you: most people have no idea how much they actually drank yesterday. Estimating your own intake from memory is exactly the kind of task human recall is bad at, because drinking is frequent, unremarkable and spread across the day.',
      'That is the specific problem Sponge is built for. It clips to the bottle you already use and records each sip as it happens, so the number in the app is measured rather than remembered. You set your own daily goal; the tracker tells you honestly how close you got.',
      { note: 'Sponge is a general wellness product. It measures how much you drink. It does not assess your hydration status, and it is not a medical device. If you have symptoms that concern you, or a condition that affects fluid balance, talk to a clinician rather than an app.' },
    ],
    sources: [
      { text: 'Valtin H. "Drink at least eight glasses of water a day." Really? Is there scientific evidence for "8 × 8"? American Journal of Physiology-Regulatory, Integrative and Comparative Physiology, 283(5), R993–R1004 (2002).', url: 'https://pubmed.ncbi.nlm.nih.gov/12376390/' },
      { text: 'National Academies of Sciences (Institute of Medicine). Dietary Reference Intakes for Water, Potassium, Sodium, Chloride, and Sulfate (2004): report announcement.', url: 'https://www.nationalacademies.org/news/report-sets-dietary-intake-levels-for-water-salt-and-potassium-to-maintain-health-and-reduce-chronic-disease-risk' },
      { text: 'Reference Values for Hydration Biomarkers: thirst thresholds during daily activity and exercise-heat stress.', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11989602/' },
    ],
  },
  {
    slug: 'signs-of-dehydration',
    title: 'The Signs of Mild Dehydration That Hold Up, and the Ones That Do Not',
    excerpt: 'Plenty of symptoms get blamed on dehydration. Only some of them survive contact with the research. Here is the honest version.',
    date: '2026-05-12',
    readTime: '4 min read',
    tag: 'Health',
    cover: '/media/lifestyle/gym.jpg',
    coverPos: 'center 74%', // keep the player + ball in the thumbnail crop
    body: [
      'Search for signs of dehydration and you will get lists of a dozen symptoms, most of them presented with equal confidence. The evidence is not that even. Some effects are well demonstrated in controlled studies, others are plausible but thin, and a few are repeated so often that they have stopped being questioned.',
      'Here is what actually holds up.',
      { h2: 'First, the thing everyone gets wrong about thirst' },
      'The usual line is that by the time you feel thirsty, you are already badly behind. That overstates it. Thirst is triggered by small changes in the concentration of your blood, and it registers at around 0.5% body-mass loss during ordinary daily activity, earlier than the myth suggests.',
      'The real problem is behavioural, not physiological. Thirst is a quiet signal competing with everything else in your day, and it is trivially easy to notice and then ignore. It also genuinely does blunt with age: the brain becomes less responsive to the same change in blood concentration, which is why fluid intake in older adults is often managed deliberately rather than left to appetite.',
      { h2: 'What the controlled studies actually found' },
      'Two studies from the University of Connecticut are the ones worth knowing, because they induced mild dehydration deliberately and measured the consequences against a hydrated control condition in the same people.',
      'In the study of healthy young women, published in the Journal of Nutrition in 2012, average dehydration of about 1.36% of body mass produced measurable effects on mood: reduced vigour, increased fatigue, and higher total mood disturbance. Participants also reported that tasks felt harder, that concentration was worse, and that headaches were more frequent.',
      'The companion study in men, published in the British Journal of Nutrition in 2011 at about 1.59% body-mass loss, found a similar pattern: tension, anxiety and fatigue all rose.',
      'So the effects that replicate across both are these:',
      {
        ul: [
          'Lower vigour and higher fatigue: the flat, heavy feeling, not sleepiness exactly.',
          'Worse mood generally, including tension and irritability.',
          'Tasks feeling more effortful, and concentration feeling harder to hold.',
          'More frequent headaches.',
        ],
      },
      { h2: 'The honest caveat about "brain fog"' },
      'You will often see these studies cited as proof that mild dehydration wrecks your cognitive performance. That is a stretch. What moved most reliably was how people felt and how hard tasks seemed, the subjective side. Objective test scores were far less affected, and several cognitive measures did not shift significantly at all.',
      'That distinction matters, and it is more useful than the exaggeration. Mild dehydration is unlikely to make you fail at your work. It is quite likely to make your work feel worse than it needs to.',
      'It is also worth noting what these studies did: they induced fluid loss through exercise and, in some conditions, a diuretic, then tested at a defined deficit. That is not the same as skipping a glass of water at lunch.',
      { h2: 'The signs that are weaker than advertised' },
      'A few staples of the symptom lists do not have the same footing, and we would rather say so than pad the list.',
      {
        ul: [
          'Dry skin. Skin hydration is driven mostly by the barrier function of the outer layer and the environment around it. The link between how much you drink and how your skin looks is far weaker than the wellness industry implies.',
          'Sugar cravings. Widely repeated, poorly evidenced. There is no good trial showing that mild fluid loss specifically drives a craving for sugar.',
          'A precise number for how much performance you lose. Figures like "a 2% loss costs you 20% of your focus" circulate constantly and do not trace back to a study that says anything so specific.',
        ],
      },
      { h2: 'The practical check' },
      'Urine colour remains the most useful everyday marker: pale straw is a reasonable sign you are keeping up, consistently dark is a reasonable sign you are not. It is imperfect (B vitamins, beetroot and some medications will change the colour on their own), but it costs nothing and it points the right way.',
      'The other check is simply knowing what you drank. Most people cannot reconstruct yesterday accurately, because drinking is frequent, forgettable and spread thinly across a day. That is a measurement problem, and it is the one Sponge exists to solve: the tracker clips to the bottle you already use and logs each sip as it happens, so when a flat afternoon arrives you can look at a real number instead of guessing at one.',
      { note: 'Sponge is a general wellness product that measures how much you drink. It does not measure hydration status, diagnose dehydration, or treat any condition. Persistent fatigue, headaches or changes in urination deserve a clinician, not an app.' },
    ],
    sources: [
      { text: 'Armstrong LE et al. Mild Dehydration Affects Mood in Healthy Young Women. Journal of Nutrition, 142(2), 382–388 (2012).', url: 'https://pubmed.ncbi.nlm.nih.gov/22190027/' },
      { text: 'Ganio MS et al. Mild dehydration impairs cognitive performance and mood of men. British Journal of Nutrition, 106(10), 1535–1543 (2011).', url: 'https://www.cambridge.org/core/journals/british-journal-of-nutrition/article/mild-dehydration-impairs-cognitive-performance-and-mood-of-men/3388AB36B8DF73E844C9AD19271A75BF' },
      { text: 'The sensitivity of the human thirst response to changes in plasma osmolality: a systematic review. Perioperative Medicine (2018).', url: 'https://link.springer.com/article/10.1186/s13741-017-0081-4' },
      { text: 'Reference Values for Hydration Biomarkers: thirst thresholds and urinary markers.', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11989602/' },
    ],
  },
  {
    slug: 'smart-bottle-vs-clip-on-tracker',
    title: 'Smart Water Bottle vs. Clip-On Tracker: Which Actually Gets Used?',
    excerpt: 'Both measure what you drink. The difference is what happens on the days you reach for a different bottle.',
    date: '2026-04-30',
    readTime: '3 min read',
    tag: 'Comparison',
    cover: '/media/lifestyle/track.jpg',
    // no coverPos: track.jpg is landscape and shows fully (no meaningful crop)
    body: [
      'There are two ways to automate hydration tracking. Put the sensor in the bottle, or put it on the bottle. That sounds like a minor engineering choice. In practice it decides how often the thing actually works.',
      { h2: 'Why measurement is the point' },
      'The case for tracking anything rests on a reasonably strong body of behavioural research. Across health behaviour reviews, self-monitoring is one of the techniques that consistently earns its place, particularly when paired with a specific goal and feedback against it. Watching your own behaviour, against a target you set, changes it.',
      'But there is a condition buried in that finding which product marketing tends to skip: the self-monitoring has to actually happen. A technique only works while it is in use, and the failure mode for hydration tracking is not inaccuracy. It is abandonment.',
      { h2: 'The smart bottle trade' },
      'A smart bottle puts the sensor in the vessel. The integration can be neat, and there is nothing to attach.',
      'The cost is that your tracking is now bound to one specific bottle. You own one tracked container and, in all likelihood, a cupboard of untracked ones. Every glass from the kitchen tap, every cup of coffee, every bottle handed to you at the gym is invisible. The data is not just incomplete, it is biased: it systematically under-records exactly the drinking you did not plan.',
      'And when that bottle is in the dishwasher, or left at the office, or eventually breaks, the tracking goes with it.',
      { h2: 'The clip-on trade' },
      'A clip-on puts the sensor on the outside, so the intelligence is separable from the container. Sponge attaches to the base of a bottle you already own, which means the bottle you actually like (the insulated one, the wide-mouth one, the one that fits your car) becomes the tracked one.',
      'It also survives replacement. New bottle, same tracker.',
      'We should be straight about what you give up. A clip-on is a second object to keep charged, even if that is roughly once a week rather than nightly. It attaches with an adhesive mount, so it is not something you swap between five bottles casually. And it tracks the bottle it is on. Pour a glass from the kitchen tap and that glass is no more visible to Sponge than it is to a smart bottle.',
      'Neither approach makes drinking effortless to measure everywhere. The question is which one is attached to the container you reach for most.',
      { h2: 'Price, and the honest version of it' },
      'Sponge is $59.99, plus shipping and tax. Connected bottles from the better-known brands generally sit higher, though prices move and vary by model and retailer, so check on the day rather than trusting a number in a blog post.',
      'The more durable point is not the sticker price but what the money buys. With a smart bottle, the sensor and the container are one purchase and one lifespan. With a clip-on, you are buying the sensor only, and reusing containers you already own.',
      { h2: 'How to choose' },
      {
        ul: [
          'If you genuinely drink from one bottle nearly all the time, and you like that bottle, a smart bottle is a reasonable choice and one fewer thing to charge.',
          'If your day involves more than one container (a bottle at the desk, another at the gym, a different one in the car), a clip-on will capture more of the truth, because it can move with you.',
          'If you already own a bottle you are attached to, a clip-on lets you keep it.',
        ],
      },
      'The best hydration tracker is the boring one: the one still attached to something you drink from in three months. That is the standard we designed Sponge against.',
    ],
    sources: [
      { text: 'Self-Regulation Mechanisms in Health Behaviour Change: A Systematic Meta-Review of Meta-Analyses, 2006–2017: on self-monitoring, goal setting and feedback.', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7571594/' },
    ],
  },
]

export const blogBySlug = (slug) => blogPosts.find((p) => p.slug === slug)

export const team = [
  { initial: 'N', name: 'Nathan Katzaroff', role: 'Co-founder', img: '/media/team/nathan-hs.webp', bio: 'Leads brand and growth, on a mission to make hydration something you never have to think about.' },
  { initial: 'C', name: 'Christopher Miglio', role: 'Co-founder', img: '/media/team/chris-hs.webp', bio: 'Heads product and hardware, obsessing over a tiny sensor that disappears onto the bottle you already own.' },
  { initial: 'D', name: 'Dominic Dal Porto', role: 'Engineering', img: '/media/team/dom-hs.webp', bio: 'Builds the app and firmware that turn raw sip data into habits that actually stick.' },
]
