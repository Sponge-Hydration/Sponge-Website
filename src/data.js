// Central product + content data for the Sponge site.

export const products = [
  {
    id: 'sponge-clip',
    slug: 'sponge-clip',
    name: 'Sponge Hydration Tracker',
    tagline: 'The clip-on tracker for any water bottle',
    price: 59.99,
    compareAt: 79.99,
    badge: 'Pre-order',
    emoji: '\u{1F4A7}',
    img: '/media/products/single.jpg',
    gallery: [
      '/media/gallery/g1-white-vertical.jpg',
      '/media/gallery/g2-black-vertical.jpg',
      '/media/gallery/g3-side-profile.jpg',
      '/media/gallery/g5-packaging.jpg',
      '/media/lifestyle/gym.jpg',
      '/media/lifestyle/desk.jpg',
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
    price: 109.99,
    compareAt: 159.98,
    badge: 'Best value',
    emoji: '\u{1F4A7}\u{1F4A7}',
    img: '/media/products/twopack.jpg',
    gallery: [
      '/media/products/twopack.jpg',
      '/media/gallery/g1-white-vertical.jpg',
      '/media/gallery/g2-black-vertical.jpg',
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
    price: 199.99,
    compareAt: 299.96,
    badge: 'Save $100',
    emoji: '\u{1F4A7}\u{1F4A7}\u{1F4A7}\u{1F4A7}',
    img: '/media/products/family.jpg',
    gallery: [
      '/media/products/family.jpg',
      '/media/gallery/g5-packaging.jpg',
      '/media/gallery/g1-white-vertical.jpg',
      '/media/gallery/g2-black-vertical.jpg',
    ],
    short: 'Four trackers with shared family dashboard — ideal for households and caregivers monitoring loved ones.',
    features: [
      'Four Sponge hydration trackers',
      'Shared family dashboard',
      'Caregiver alerts & reminders',
      'Per-person goals and trends',
      'Save $100 vs. buying singles',
    ],
    ships: 'Ships in ~8 weeks',
  },
]

export const productById = (id) => products.find((p) => p.id === id)
export const productBySlug = (slug) => products.find((p) => p.slug === slug)

export const faqs = [
  { q: 'What is a hydration tracker and how does Sponge work?', a: 'A hydration tracker measures how much water you drink during the day. Sponge is a small clip-on hydration tracking device that snaps magnetically onto any water bottle. On-device sensors record each sip automatically and sync to the free Sponge app — so you never have to log water by hand.' },
  { q: 'Does the Sponge hydration tracking device work with any water bottle?', a: 'Yes. Sponge is built to clip onto the bottle you already own — insulated steel bottles, plastic tumblers, glass bottles and more. There is no special bottle to buy and nothing to refill differently.' },
  { q: 'How long does the battery last?', a: 'Sponge lasts about 8 days on a single charge and recharges over USB-C in a couple of hours. Most people charge it once a week.' },
  { q: 'Can the hydration tracker really lock apps until I drink water?', a: 'Yes. In the app you pick which apps to gate, and Sponge keeps them locked until you reach your daily hydration goal — turning your phone into a gentle nudge to drink more water.' },
  { q: 'Is it accurate?', a: 'Sponge measures real sips with on-device sensors rather than asking you to remember and self-report, which is where most hydration tracking breaks down. The app shows your intake in real time so you always know where you stand.' },
  { q: 'How do I set up my Sponge?', a: 'Charge it over USB-C, download the free Sponge app, and pair over Bluetooth. Then clip it onto your bottle. Setup takes about two minutes and the app walks you through calibrating your bottle size.' },
  { q: 'How much does Sponge cost and when does it ship?', a: 'Sponge is available to pre-order for $59.99 with a 30-day money-back guarantee. Pre-orders currently ship in about 8 weeks, and the companion app is free on iOS and Android.' },
  { q: 'What is your return policy?', a: 'Every Sponge comes with a 30-day money-back guarantee. If it is not for you, contact support within 30 days of delivery for a full refund.' },
]

export const testimonials = [
  { initial: 'B', name: 'Brian', loc: 'Maryland · Triathlete', quote: 'As a triathlete I obsess over hydration. Sponge finally tracks it for me without another thing to log. It just works.' },
  { initial: 'K', name: 'Kelly', loc: 'California', quote: 'I had no idea how little water I was actually drinking until Sponge showed me. Now I hit my goal almost every day.' },
  { initial: 'I', name: 'Isabella', loc: 'Florida', quote: 'The app-lock feature is genius. It actually gets me to drink water instead of just reminding me and being ignored.' },
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
      'A more useful starting point is roughly half an ounce to one ounce of water per pound of body weight per day, adjusted up for exercise and hot weather. But the only way to know whether you are actually meeting your needs is to measure — which is exactly the gap a hydration tracker like Sponge fills.',
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
    cover: '/media/lifestyle/closeup.jpg',
    body: [
      'Thirst is a late signal. Long before you feel it, mild dehydration shows up as afternoon fatigue, brain fog, headaches, dry skin, irritability, sugar cravings, and dark-colored urine.',
      'The problem is that these symptoms are easy to blame on something else — a bad night of sleep, too much screen time, a skipped meal. That is why so many people are chronically under-hydrated without realizing it.',
      'Passive tracking removes the guesswork. When Sponge shows that you have only had 600ml by 3pm, the cause of that 3pm slump suddenly becomes obvious — and fixable.',
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
      'Smart water bottles bundle the sensor into the bottle itself. That sounds convenient until you realize you now own one tracked bottle and a cabinet full of untracked ones — and you have to drink from the right one to get any data.',
      'A clip-on hydration tracker takes the opposite approach: the intelligence lives in a small device that attaches to whatever bottle you already use. Your favorite insulated bottle, the glass on your desk, the tumbler in your car — all tracked.',
      'It is also future-proof. When you buy a new bottle, you keep your tracker. That flexibility, plus a lower price than most smart bottles, is why we built Sponge as a clip-on.',
    ],
  },
]

export const blogBySlug = (slug) => blogPosts.find((p) => p.slug === slug)

export const team = [
  { initial: 'N', name: 'Nathan Katzaroff', role: 'Co-founder', img: '/media/team/nathan.jpg', bio: 'Leads brand and growth — on a mission to make hydration something you never have to think about.' },
  { initial: 'C', name: 'Christopher Miglio', role: 'Co-founder', img: '/media/team/chris.jpg', bio: 'Heads product and hardware, obsessing over a tiny sensor that disappears onto the bottle you already own.' },
  { initial: 'D', name: 'Dom', role: 'Engineering', img: '/media/team/dom.jpg', bio: 'Builds the app and firmware that turn raw sip data into habits that actually stick.' },
]
