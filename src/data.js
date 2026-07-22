// Central product + content data for the Sponge site.

export const products = [
  {
    id: 'sponge-clip',
    slug: 'sponge-clip',
    name: 'Sponge Hydration Tracker',
    tagline: 'The clip-on tracker for any water bottle',
    clips: 1,
    price: 59.99,
    compareAt: 79.99,
    badge: 'Pre-order',
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
    features: [
      'Works with any water bottle',
      'Automatic sip tracking',
      '8-day battery · USB-C charging',
      'Free iOS & Android app with app-lock',
      'Personalized daily hydration goals',
    ],
    ships: 'Ships in ~8 weeks',
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
    compareAt: 159.98,
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
      'Same 8-day battery & app-lock',
      'Save $50 vs. buying two singles',
    ],
    ships: 'Ships in ~8 weeks',
  },
  {
    id: 'sponge-family',
    slug: 'sponge-family-pack',
    name: 'Sponge Family Pack',
    tagline: 'Hydration for the whole household',
    clips: 4,
    price: 199.99,
    compareAt: 299.96,
    badge: 'Save $100',
    img: '/media/products/family.png',
    gallery: [
      '/media/products/family.png',
      '/media/gallery/g5-packaging.jpg',
      '/media/gallery/g1-white-vertical.jpg',
      '/media/gallery/g2-black-vertical.jpg',
    ],
    short: 'Four trackers with shared family dashboard, ideal for households and caregivers monitoring loved ones.',
    features: [
      'Four Sponge hydration trackers',
      'Shared family dashboard',
      'Caregiver alerts & reminders',
      'Per-person goals and trends',
      'Save $100 vs. buying singles',
    ],
    ships: 'Ships in ~8 weeks',
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
    ships: 'Ships in ~8 weeks',
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

export const faqs = [
  { q: 'What is a hydration tracker and how does Sponge work?', a: 'A hydration tracker measures how much water you drink during the day. Sponge is a small clip-on hydration tracking device that snaps magnetically onto any water bottle. On-device sensors record each sip automatically and sync to the free Sponge app, so you never have to log water by hand.' },
  { q: 'Does the Sponge hydration tracking device work with any water bottle?', a: 'Yes. Sponge is built to clip onto the bottle you already own, insulated steel bottles, plastic tumblers, glass bottles and more. There is no special bottle to buy and nothing to refill differently.' },
  { q: 'How long does the battery last?', a: 'Sponge lasts about 8 days on a single charge and recharges over USB-C in a couple of hours. Most people charge it once a week.' },
  { q: 'Can the hydration tracker really lock apps until I drink water?', a: 'Yes. In the app you pick which apps to gate, and Sponge keeps them locked until you reach your daily hydration goal, turning your phone into a gentle nudge to drink more water.' },
  { q: 'Is it accurate?', a: 'Sponge measures real sips with on-device sensors rather than asking you to remember and self-report, which is where most hydration tracking breaks down. The app shows your intake in real time so you always know where you stand.' },
  { q: 'How do I set up my Sponge?', a: 'Charge it over USB-C, download the free Sponge app, and pair over Bluetooth. Then clip it onto your bottle. Setup takes about two minutes and the app walks you through calibrating your bottle size.' },
  { q: 'How much does Sponge cost and when does it ship?', a: 'Sponge is available to pre-order for $59.99 with a 30-day money-back guarantee. Pre-orders currently ship in about 8 weeks, and the companion app is free on iOS and Android.' },
  { q: 'What is your return policy?', a: 'Every Sponge comes with a 30-day money-back guarantee. If it is not for you, contact support within 30 days of delivery for a full refund.' },
]

// Real customer reviews, verbatim from the Airtable reviews survey. No names
// were collected, so cards show "Verified customer" + the use case they picked.
// This is the baked-in fallback that prerenders and shows if Airtable is
// unreachable; the live approved list comes from Airtable via /api/reviews.
// (A 5th 5-star response left no written feedback, so it isn't shown here.)
// Keep this snapshot in sync when the featured reviews change.
export const reviews = [
  {
    stars: 5,
    quote: 'Beautiful.',
    loc: 'Focus and energy · Gift for someone',
  },
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
  {
    stars: 5,
    quote: 'Needs to be thinner, like 10mm total.',
    loc: 'Preventive health',
  },
]

export const blogPosts = [
  {
    slug: 'how-much-water-should-you-drink',
    title: 'How Much Water Should You Actually Drink a Day?',
    excerpt: 'The "8 glasses a day" rule is a myth. Here is how to find the hydration target that fits your body, activity, and climate.',
    date: '2026-05-28',
    readTime: '6 min read',
    tag: 'Hydration science',
    cover: '/media/lifestyle/desk.jpg',
    body: [
      'The familiar "eight 8-ounce glasses" guideline is easy to remember and almost entirely made up. Your real water needs depend on your body weight, how active you are, the climate you live in, and even what you eat.',
      'A more useful starting point is roughly half an ounce to one ounce of water per pound of body weight per day, adjusted up for exercise and hot weather. But the only way to know whether you are actually meeting your needs is to measure, which is exactly the gap a hydration tracker like Sponge fills.',
      'Instead of guessing, Sponge records every sip automatically and learns your patterns over time, then sets a personalized daily goal that reflects what your body actually needs rather than a one-size-fits-all number.',
    ],
  },
  {
    slug: 'signs-of-dehydration',
    title: '7 Subtle Signs You Are Dehydrated (That Are Not Thirst)',
    excerpt: 'By the time you feel thirsty you are already behind. These quieter signals show up first.',
    date: '2026-05-12',
    readTime: '5 min read',
    tag: 'Health',
    cover: '/media/lifestyle/gym.jpg',
    body: [
      'Thirst is a late signal. Long before you feel it, mild dehydration shows up as afternoon fatigue, brain fog, headaches, dry skin, irritability, sugar cravings, and dark-colored urine.',
      'The problem is that these symptoms are easy to blame on something else, a bad night of sleep, too much screen time, a skipped meal. That is why so many people are chronically under-hydrated without realizing it.',
      'Passive tracking removes the guesswork. When Sponge shows that you have only had 600ml by 3pm, the cause of that 3pm slump suddenly becomes obvious, and fixable.',
    ],
  },
  {
    slug: 'smart-bottle-vs-clip-on-tracker',
    title: 'Smart Water Bottle vs. Clip-On Tracker: Which Is Better?',
    excerpt: 'Smart bottles force you to give up the bottle you love. Here is why a clip-on hydration tracking device is the smarter buy.',
    date: '2026-04-30',
    readTime: '7 min read',
    tag: 'Comparison',
    cover: '/media/lifestyle/track.jpg',
    body: [
      'Smart water bottles bundle the sensor into the bottle itself. That sounds convenient until you realize you now own one tracked bottle and a cabinet full of untracked ones, and you have to drink from the right one to get any data.',
      'A clip-on hydration tracker takes the opposite approach: the intelligence lives in a small device that attaches to whatever bottle you already use. Your favorite insulated bottle, the glass on your desk, the tumbler in your car, all tracked.',
      'It is also future-proof. When you buy a new bottle, you keep your tracker. That flexibility, plus a lower price than most smart bottles, is why we built Sponge as a clip-on.',
    ],
  },
]

export const blogBySlug = (slug) => blogPosts.find((p) => p.slug === slug)

export const team = [
  { initial: 'N', name: 'Nathan Katzaroff', role: 'Co-founder', img: '/media/team/nathan.jpg', bio: 'Leads brand and growth, on a mission to make hydration something you never have to think about.' },
  { initial: 'C', name: 'Christopher Miglio', role: 'Co-founder', img: '/media/team/chris.jpg', bio: 'Heads product and hardware, obsessing over a tiny sensor that disappears onto the bottle you already own.' },
  { initial: 'D', name: 'Dominic Dal Porto', role: 'Engineering', img: '/media/team/dom.jpg', bio: 'Builds the app and firmware that turn raw sip data into habits that actually stick.' },
]
