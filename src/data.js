// Central product + content data for the Sponge site.

export const products = [
  {
    id: 'sponge-clip',
    slug: 'sponge-clip',
    name: 'Sponge Hydration Tracker',
    tagline: 'The clip-on tracker for any water bottle',
    clips: 1,
    price: 59.99,
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
    ships: 'Ships with our next production batch',
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
      'Same 8-day battery & app-lock',
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
    short: 'Four trackers with shared family dashboard, ideal for households and caregivers monitoring loved ones.',
    features: [
      'Four Sponge hydration trackers',
      'Shared family dashboard',
      'Caregiver alerts & reminders',
      'Per-person goals and trends',
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

export const faqs = [
  { q: 'What is a hydration tracker and how does Sponge work?', a: 'A hydration tracker measures how much water you drink during the day. Sponge is a small clip-on hydration tracking device that snaps magnetically onto any water bottle. On-device sensors record each sip automatically and sync to the free Sponge app, so you never have to log water by hand.' },
  { q: 'Does the Sponge hydration tracking device work with any water bottle?', a: 'Yes. Sponge is built to clip onto the bottle you already own, insulated steel bottles, plastic tumblers, glass bottles and more. There is no special bottle to buy and nothing to refill differently.' },
  { q: 'How long does the battery last?', a: 'Sponge lasts about 8 days on a single charge and recharges over USB-C in a couple of hours. Most people charge it once a week.' },
  { q: 'Can the hydration tracker really lock apps until I drink water?', a: 'Yes. In the app you pick which apps to gate, and Sponge keeps them locked until you reach your daily hydration goal, turning your phone into a gentle nudge to drink more water.' },
  { q: 'Does it work with Apple Health?', a: 'Yes. On iPhone, Sponge writes your water intake straight into Apple Health, so it sits with the rest of your health data rather than being stranded in one more app. There is also a home-screen widget that shows how much you have had and how far you have to go, so on most days you never need to open the app.' },
  { q: 'Is it accurate?', a: 'Sponge measures real sips with on-device sensors rather than asking you to remember and self-report, which is where most hydration tracking breaks down. The app shows your intake in real time so you always know where you stand.' },
  { q: 'How do I set up my Sponge?', a: 'Charge it over USB-C, download the free Sponge app, and pair over Bluetooth. Then clip it onto your bottle. Setup takes about two minutes and the app walks you through calibrating your bottle size.' },
  { q: 'How much does Sponge cost and when does it ship?', a: 'Sponge is $59.99 plus shipping and tax, and the companion app is free on iOS and Android. We build in production batches, and a batch runs once enough pre-orders are reserved to fill it — so rather than quote a delivery date we cannot stand behind, we email you when your batch enters production. You can cancel a pre-order for a full refund any time before it ships, and once it arrives you have 30 days to send it back.' },
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
      'The National Academies gave sensible advice when the report landed: for most healthy people, thirst is a reasonable guide. Thirst is more sensitive than its reputation suggests — it registers at around 0.5% body-mass loss during ordinary daily activity, and at roughly 1 to 2% under exercise and heat stress.',
      'The problem is not that thirst is a bad signal. It is that thirst is easy to override. A meeting runs long, the bottle is in another room, you are concentrating, and the signal passes unremarked. Thirst also blunts with age, which is why fluid intake is monitored more deliberately in older adults.',
      'Urine colour is the other practical check: pale straw suggests you are keeping up, consistently dark suggests you are not. It is imperfect — vitamins, some foods and some medications shift the colour independently of hydration — but it is free and it is directional.',
      { h2: 'Where measurement comes in' },
      'Whatever target you land on, there is a gap that no guideline can close for you: most people have no idea how much they actually drank yesterday. Estimating your own intake from memory is exactly the kind of task human recall is bad at, because drinking is frequent, unremarkable and spread across the day.',
      'That is the specific problem Sponge is built for. It clips to the bottle you already use and records each sip as it happens, so the number in the app is measured rather than remembered. You set your own daily goal; the tracker tells you honestly how close you got.',
      { note: 'Sponge is a general wellness product. It measures how much you drink. It does not assess your hydration status, and it is not a medical device — if you have symptoms that concern you, or a condition that affects fluid balance, talk to a clinician rather than an app.' },
    ],
    sources: [
      { text: 'Valtin H. "Drink at least eight glasses of water a day." Really? Is there scientific evidence for "8 × 8"? American Journal of Physiology — Regulatory, Integrative and Comparative Physiology, 283(5), R993–R1004 (2002).', url: 'https://pubmed.ncbi.nlm.nih.gov/12376390/' },
      { text: 'National Academies of Sciences (Institute of Medicine). Dietary Reference Intakes for Water, Potassium, Sodium, Chloride, and Sulfate (2004) — report announcement.', url: 'https://www.nationalacademies.org/news/report-sets-dietary-intake-levels-for-water-salt-and-potassium-to-maintain-health-and-reduce-chronic-disease-risk' },
      { text: 'Reference Values for Hydration Biomarkers — thirst thresholds during daily activity and exercise-heat stress.', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11989602/' },
    ],
  },
  {
    slug: 'signs-of-dehydration',
    title: 'The Signs of Mild Dehydration That Hold Up — and the Ones That Do Not',
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
      'The usual line is that by the time you feel thirsty, you are already badly behind. That overstates it. Thirst is triggered by small changes in the concentration of your blood, and it registers at around 0.5% body-mass loss during ordinary daily activity — earlier than the myth suggests.',
      'The real problem is behavioural, not physiological. Thirst is a quiet signal competing with everything else in your day, and it is trivially easy to notice and then ignore. It also genuinely does blunt with age: the brain becomes less responsive to the same change in blood concentration, which is why fluid intake in older adults is often managed deliberately rather than left to appetite.',
      { h2: 'What the controlled studies actually found' },
      'Two studies from the University of Connecticut are the ones worth knowing, because they induced mild dehydration deliberately and measured the consequences against a hydrated control condition in the same people.',
      'In the study of healthy young women, published in the Journal of Nutrition in 2012, average dehydration of about 1.36% of body mass produced measurable effects on mood: reduced vigour, increased fatigue, and higher total mood disturbance. Participants also reported that tasks felt harder, that concentration was worse, and that headaches were more frequent.',
      'The companion study in men, published in the British Journal of Nutrition in 2011 at about 1.59% body-mass loss, found a similar pattern — tension, anxiety and fatigue all rose.',
      'So the effects that replicate across both are these:',
      {
        ul: [
          'Lower vigour and higher fatigue — the flat, heavy feeling, not sleepiness exactly.',
          'Worse mood generally, including tension and irritability.',
          'Tasks feeling more effortful, and concentration feeling harder to hold.',
          'More frequent headaches.',
        ],
      },
      { h2: 'The honest caveat about "brain fog"' },
      'You will often see these studies cited as proof that mild dehydration wrecks your cognitive performance. That is a stretch. What moved most reliably was how people felt and how hard tasks seemed — the subjective side. Objective test scores were far less affected, and several cognitive measures did not shift significantly at all.',
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
      'Urine colour remains the most useful everyday marker: pale straw is a reasonable sign you are keeping up, consistently dark is a reasonable sign you are not. It is imperfect — B vitamins, beetroot and some medications will change the colour on their own — but it costs nothing and it points the right way.',
      'The other check is simply knowing what you drank. Most people cannot reconstruct yesterday accurately, because drinking is frequent, forgettable and spread thinly across a day. That is a measurement problem, and it is the one Sponge exists to solve: the tracker clips to the bottle you already use and logs each sip as it happens, so when a flat afternoon arrives you can look at a real number instead of guessing at one.',
      { note: 'Sponge is a general wellness product that measures how much you drink. It does not measure hydration status, diagnose dehydration, or treat any condition. Persistent fatigue, headaches or changes in urination deserve a clinician, not an app.' },
    ],
    sources: [
      { text: 'Armstrong LE et al. Mild Dehydration Affects Mood in Healthy Young Women. Journal of Nutrition, 142(2), 382–388 (2012).', url: 'https://pubmed.ncbi.nlm.nih.gov/22190027/' },
      { text: 'Ganio MS et al. Mild dehydration impairs cognitive performance and mood of men. British Journal of Nutrition, 106(10), 1535–1543 (2011).', url: 'https://www.cambridge.org/core/journals/british-journal-of-nutrition/article/mild-dehydration-impairs-cognitive-performance-and-mood-of-men/3388AB36B8DF73E844C9AD19271A75BF' },
      { text: 'The sensitivity of the human thirst response to changes in plasma osmolality: a systematic review. Perioperative Medicine (2018).', url: 'https://link.springer.com/article/10.1186/s13741-017-0081-4' },
      { text: 'Reference Values for Hydration Biomarkers — thirst thresholds and urinary markers.', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11989602/' },
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
      'The case for tracking anything rests on a reasonably strong body of behavioural research. Across health behaviour reviews, self-monitoring is one of the techniques that consistently earns its place — particularly when paired with a specific goal and feedback against it. Watching your own behaviour, against a target you set, changes it.',
      'But there is a condition buried in that finding which product marketing tends to skip: the self-monitoring has to actually happen. A technique only works while it is in use, and the failure mode for hydration tracking is not inaccuracy. It is abandonment.',
      { h2: 'The smart bottle trade' },
      'A smart bottle puts the sensor in the vessel. The integration can be neat, and there is nothing to attach.',
      'The cost is that your tracking is now bound to one specific bottle. You own one tracked container and, in all likelihood, a cupboard of untracked ones. Every glass from the kitchen tap, every cup of coffee, every bottle handed to you at the gym is invisible. The data is not just incomplete, it is biased — it systematically under-records exactly the drinking you did not plan.',
      'And when that bottle is in the dishwasher, or left at the office, or eventually breaks, the tracking goes with it.',
      { h2: 'The clip-on trade' },
      'A clip-on puts the sensor on the outside, so the intelligence is separable from the container. Sponge attaches to the base of a bottle you already own, which means the bottle you actually like — the insulated one, the wide-mouth one, the one that fits your car — becomes the tracked one.',
      'It also survives replacement. New bottle, same tracker.',
      'We should be straight about what you give up. A clip-on is a second object to keep charged, even if that is roughly once a week rather than nightly. It attaches with an adhesive mount, so it is not something you swap between five bottles casually. And it tracks the bottle it is on — pour a glass from the kitchen tap and that glass is no more visible to Sponge than it is to a smart bottle.',
      'Neither approach makes drinking effortless to measure everywhere. The question is which one is attached to the container you reach for most.',
      { h2: 'Price, and the honest version of it' },
      'Sponge is $59.99, plus shipping and tax. Connected bottles from the better-known brands generally sit higher, though prices move and vary by model and retailer, so check on the day rather than trusting a number in a blog post.',
      'The more durable point is not the sticker price but what the money buys. With a smart bottle, the sensor and the container are one purchase and one lifespan. With a clip-on, you are buying the sensor only, and reusing containers you already own.',
      { h2: 'How to choose' },
      {
        ul: [
          'If you genuinely drink from one bottle nearly all the time, and you like that bottle, a smart bottle is a reasonable choice and one fewer thing to charge.',
          'If your day involves more than one container — a bottle at the desk, another at the gym, a different one in the car — a clip-on will capture more of the truth, because it can move with you.',
          'If you already own a bottle you are attached to, a clip-on lets you keep it.',
        ],
      },
      'The best hydration tracker is the boring one: the one still attached to something you drink from in three months. That is the standard we designed Sponge against.',
    ],
    sources: [
      { text: 'Self-Regulation Mechanisms in Health Behaviour Change: A Systematic Meta-Review of Meta-Analyses, 2006–2017 — on self-monitoring, goal setting and feedback.', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7571594/' },
    ],
  },
]

export const blogBySlug = (slug) => blogPosts.find((p) => p.slug === slug)

export const team = [
  { initial: 'N', name: 'Nathan Katzaroff', role: 'Co-founder', img: '/media/team/nathan-hs.webp', bio: 'Leads brand and growth, on a mission to make hydration something you never have to think about.' },
  { initial: 'C', name: 'Christopher Miglio', role: 'Co-founder', img: '/media/team/chris-hs.webp', bio: 'Heads product and hardware, obsessing over a tiny sensor that disappears onto the bottle you already own.' },
  { initial: 'D', name: 'Dominic Dal Porto', role: 'Engineering', img: '/media/team/dom-hs.webp', bio: 'Builds the app and firmware that turn raw sip data into habits that actually stick.' },
]
