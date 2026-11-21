import type { ImageAsset, Project, ProjectCover, ProjectScreenshot, ProjectSlug, WorkPageContent } from './types'

/** Intrinsic pixel size of an image file, required on every project image (the shared type leaves it optional). */
export type ImageSize = Required<Pick<ImageAsset, 'width' | 'height'>>

/**
 * The shared `Project` type, with image sizes made mandatory and the
 * project-title font-size range added. Anything that accepts a `Project` also
 * accepts a `ProjectEntry`.
 */
export type ProjectEntry = Omit<Project, 'cover' | 'screenshots'> & {
  cover: ProjectCover & ImageSize
  screenshots: Array<ProjectScreenshot & ImageSize>
  /** Fluid font-size of the project h1 in px: `min` at 390px wide, `max` at 1440px (from the mockups). */
  h1Size: { min: number; max: number }
}

/** Fixed UI strings of the project page (labels, landmark names). */
export const projectPage = {
  back: 'All work',
  nextEyebrow: 'Next project',
  caseStudyLabel: 'Case study',
  screenshotsLabel: 'Screenshots',
  screenshotsHint: 'Swipe for more',
  factLabels: { role: 'Role', company: 'Company', year: 'Year', platforms: 'Platforms' },
  placeholderHint: 'Placeholder: replace before launch',
} as const

export const workPage: WorkPageContent = {
  title: 'Selected apps',
  count: '(05)',
  intro: "Mobile apps I've designed, built and shipped between 2022 and 2026.",
  hoverChip: 'View case →',
}

export const projects: ProjectEntry[] = [
  {
    slug: 'ychat',
    number: '001',
    name: 'YChat',
    domain: 'Social · Real-time',
    tagline: 'Social · Flutter · WebSockets',
    summary:
      'An online hangout app for doing things together: chat, audio and video calls, a shared whiteboard for drawing, co-browsing and media sharing, all in sync across devices.',
    metaDescription:
      'Case study of YChat, a real-time hangout app with chat, video calls, a shared whiteboard and co-browsing, built with Flutter and WebSockets.',
    facts: {
      role: 'Software Engineer, mobile app lead',
      company: 'YACHII PTE. LTD.',
      year: '2025 — now',
      platforms: 'iOS · Android',
    },
    stack: ['Flutter', 'Dart', 'WebSockets', 'WebRTC', 'Firebase', 'BLoC', 'Node.js'],
    link: { label: 'Visit ychatt.com ↗', href: 'https://ychatt.com/' },
    cover: {
      src: '/images/work/ychat/cover.png',
      alt: 'YChat app screens',
      listAlt: 'YChat social hangout app',
      width: 1024,
      height: 500,
    },
    sections: [
      {
        title: 'The product',
        body: 'YChat is a social space where people hang out and do things together online. They can chat one-to-one or in groups, jump on audio and video calls, draw together on a shared whiteboard, browse the web together and share photos and videos, all in real time.',
      },
      {
        title: 'My role',
        body: 'I lead mobile app development at YACHII, from app architecture and state management to shipping releases on both stores.',
      },
      {
        title: "How it's built",
        body: "One Flutter codebase in Dart, WebSockets for real-time messaging, WebRTC for audio and video calls, Firebase for sign-in and push notifications, and BLoC to keep chat state predictable. The backend runs on Node.js, and I've worked on parts of it as well.",
      },
      {
        title: 'The interesting part',
        body: 'Making real time feel effortless: high-quality video calls, messages that stay in sync across group and one-to-one chats, a shared whiteboard where every stroke shows up for everyone at the same moment, and co-browsing that keeps everyone on the same page as it scrolls.',
      },
    ],
    screenshots: [
      {
        src: '/images/work/ychat/shot-1.jpg',
        alt: 'YChat screen: a one-to-one chat turned into a live call while planning a trip',
        caption: '01 · Chat',
        width: 750,
        height: 1630,
      },
      {
        src: '/images/work/ychat/shot-2.jpg',
        alt: 'YChat screen: group video and voice calls',
        caption: '02 · Group calls',
        width: 750,
        height: 1630,
      },
      {
        src: '/images/work/ychat/shot-3.jpg',
        alt: 'YChat screen: co-browsing a shopping site with friends',
        caption: '03 · Co-browsing',
        width: 750,
        height: 1630,
      },
      {
        src: '/images/work/ychat/shot-4.jpg',
        alt: 'YChat screen: studying together with a live sketch board and shared notes',
        caption: '04 · Sketch board',
        width: 750,
        height: 1630,
      },
    ],
    h1Size: { min: 88, max: 176 },
    nextSlug: 'superr-parents',
  },
  {
    slug: 'superr-parents',
    number: '002',
    name: 'Superr Parents',
    domain: 'Family · Parental control',
    tagline: 'Family · Flutter · Firebase · Hive',
    summary:
      'A parental control app that helps parents keep kids safe online and offline, build healthy habits and stay connected as a family.',
    metaDescription:
      'Case study of Superr Parents, a Flutter parental control app with monitoring, geofencing and family routines for iOS and Android.',
    facts: {
      role: 'Mobile Application Developer',
      company: 'CoinedOne Technologies',
      year: '2022 — 2025',
      platforms: 'iOS · Android',
    },
    stack: ['Flutter', 'Firebase', 'BLoC', 'Hive'],
    link: { label: 'Visit superr.app ↗', href: 'https://superr.app/' },
    cover: {
      src: '/images/work/superr-parents/cover.jpg',
      alt: 'Superr Parents app',
      listAlt: 'Superr Parents parental control app',
      width: 1600,
      height: 800,
    },
    sections: [
      {
        title: 'The product',
        body: 'Superr Parents is a digital parenting assistant. Parents see their whole family at a glance, set smart boundaries such as call, location, YouTube and social media monitoring, and plan routines and habits that help their kids grow.',
      },
      {
        title: 'My role',
        body: 'I built the Superr Parents app at CoinedOne for iOS and Android, alongside its companion app for kids, Superr Child.',
      },
      {
        title: "How it's built",
        body: 'One Flutter codebase for both platforms, Firebase on the backend, BLoC to keep state predictable and Hive for fast local storage.',
      },
      {
        title: 'The interesting part',
        body: "Social media monitoring and geofencing: alerting parents when keywords they've chosen show up in their child's social apps, and when their child enters or leaves the safe and unsafe zones they've marked on the map.",
      },
    ],
    screenshots: [
      {
        src: '/images/work/superr-parents/shot-1.jpg',
        alt: 'Superr Parents screen: family dashboard with locations',
        caption: '01 · Family dashboard',
        width: 720,
        height: 1280,
      },
      {
        src: '/images/work/superr-parents/shot-2.jpg',
        alt: 'Superr Parents screen: monitoring rules for calls, location, YouTube and social media',
        caption: '02 · Smart boundaries',
        width: 720,
        height: 1280,
      },
      {
        src: '/images/work/superr-parents/shot-3.jpg',
        alt: 'Superr Parents screen: routines and habits for kids',
        caption: '03 · Routines & habits',
        width: 720,
        height: 1280,
      },
    ],
    h1Size: { min: 64, max: 136 },
    nextSlug: 'superr-child',
  },
  {
    slug: 'superr-child',
    number: '003',
    name: 'Superr Child',
    domain: 'Kids · Screen time',
    tagline: 'Screen time · Swift · Flutter',
    summary:
      'A screen-time companion for kids aged 6 to 18 that builds healthy digital habits, with parents kept in the loop.',
    metaDescription:
      'Case study of Superr Child, a screen-time app for kids built with Flutter and native Swift, with schedules, insights and app blocking.',
    facts: {
      role: 'Mobile Application Developer',
      company: 'CoinedOne Technologies',
      year: '2022 — 2025',
      platforms: 'iOS · Android',
    },
    stack: ['Flutter', 'Swift', 'Firebase'],
    link: { label: 'Visit superr.app ↗', href: 'https://superr.app/' },
    cover: {
      src: '/images/work/superr-child/cover.jpg',
      alt: 'Superr Child app',
      listAlt: 'Superr Child screen-time app',
      width: 1600,
      height: 800,
    },
    sections: [
      {
        title: 'The product',
        body: "Superr Child is the app kids use. It gives them a daily schedule of routines, shows insights on their screen time and goals, and blocks apps when they're off limits, all set up by their parents in Superr Parents.",
      },
      {
        title: 'My role',
        body: 'I built Superr Child at CoinedOne alongside Superr Parents, using Swift where the platform needed native code.',
      },
      {
        title: "How it's built",
        body: 'Flutter for most of the app, Swift for native iOS features, and Firebase on the backend.',
      },
      {
        title: 'The interesting part',
        body: "Getting real device usage on iPhone. Swift reads it through Apple's device activity monitoring (part of Screen Time), and the data is handed to the Flutter app over method channels, so one shared app can show and act on it.",
      },
    ],
    screenshots: [
      {
        src: '/images/work/superr-child/shot-1.jpg',
        alt: 'Superr Child screen: daily schedule of routines',
        caption: '01 · Daily schedule',
        width: 720,
        height: 1279,
      },
      {
        src: '/images/work/superr-child/shot-2.jpg',
        alt: 'Superr Child screen: insights on goals and screen time',
        caption: '02 · Insights',
        width: 720,
        height: 1279,
      },
      {
        src: '/images/work/superr-child/shot-3.jpg',
        alt: "Superr Child screen: an app blocked for the child's protection",
        caption: '03 · App blocking',
        width: 720,
        height: 1279,
      },
    ],
    h1Size: { min: 64, max: 136 },
    nextSlug: 'ablemart',
  },
  {
    slug: 'ablemart',
    number: '004',
    name: 'Ablemart',
    domain: 'Grocery · Delivery',
    tagline: 'Grocery delivery · REST · PostgreSQL',
    summary:
      'The online delivery app for Able Mart Hypermarket in Qatar: browse the store, fill a cart and track orders to the door.',
    metaDescription:
      'Case study of Ablemart, the Flutter delivery app for Able Mart Hypermarket in Qatar, backed by a REST API and PostgreSQL.',
    facts: {
      role: 'Mobile app developer',
      company: 'Freelance',
      // First release: Google Play 24 Jan 2024, App Store 10 Mar 2024.
      year: '2024',
      platforms: 'iOS · Android',
    },
    stack: ['Flutter', 'REST API', 'PostgreSQL'],
    link: { label: 'Visit ablemartonline.com ↗', href: 'https://ablemartonline.com/' },
    cover: {
      src: '/images/work/ablemart/cover.jpg',
      alt: 'Ablemart app',
      listAlt: 'Ablemart grocery delivery app',
      width: 1600,
      height: 800,
    },
    sections: [
      {
        title: 'The product',
        body: 'Ablemart puts Able Mart Hypermarket on your phone. Shoppers browse by category, from fresh fish and meat to dairy, vegetables and spices, pick up deals, add to their cart and follow each order through to delivery.',
      },
      {
        title: 'My role',
        body: 'A freelance project. Ablemart started as a simple ordering app and has kept growing along with its users.',
      },
      {
        title: "How it's built",
        body: 'A Flutter app talking to a REST API, with product and order data stored in PostgreSQL.',
      },
      {
        title: 'The interesting part',
        body: "Handling the whole flow from data to checkout: the CRUD operations behind the store's products, carts and orders, and the payment integration that lets customers pay right in the app.",
      },
    ],
    screenshots: [
      {
        src: '/images/work/ablemart/shot-1.jpg',
        alt: 'Ablemart launch screen with the Able Mart logo',
        caption: '01 · Launch',
        width: 750,
        height: 1333,
      },
      {
        src: '/images/work/ablemart/shot-2.jpg',
        alt: 'Ablemart screen: shopping by category',
        caption: '02 · Shop by category',
        width: 750,
        height: 1333,
      },
      {
        src: '/images/work/ablemart/shot-3.jpg',
        alt: 'Ablemart screen: account with order history and delivery address',
        caption: '03 · Orders & account',
        width: 750,
        height: 1333,
      },
    ],
    h1Size: { min: 64, max: 136 },
    nextSlug: 'topsite',
  },
  {
    slug: 'topsite',
    number: '005',
    name: 'Topsite',
    domain: 'Real estate · Marketplace',
    tagline: 'Real estate · Flutter · Firebase',
    summary:
      'A real-estate marketplace for buying, renting and selling property, with listings, search filters and enquiries in one place.',
    metaDescription:
      'Case study of Topsite, an Android real-estate marketplace for buying, renting and selling property, released on Google Play.',
    facts: {
      role: 'Mobile app developer',
      company: 'Freelance',
      // First release: Google Play 22 Feb 2024.
      year: '2024',
      platforms: 'Android',
    },
    link: {
      label: 'View on Google Play ↗',
      href: 'https://play.google.com/store/apps/details?id=com.topsite.app',
    },
    cover: {
      src: '/images/work/topsite/cover.jpg',
      alt: 'Topsite app',
      listAlt: 'Topsite real estate app',
      width: 1600,
      height: 800,
    },
    sections: [
      {
        title: 'The product',
        body: "Topsite helps people find a place or post what they're looking for. Buyers and renters search listings by type (house, villa, apartment, plot) and by place, and anyone can post an enquiry that sellers and agents can browse.",
      },
      {
        title: 'My role',
        body: 'A freelance project, built for Android and released on Google Play.',
      },
    ],
    screenshots: [
      {
        src: '/images/work/topsite/shot-1.jpg',
        alt: 'Topsite screen: searching properties by type and place',
        caption: '01 · Property search',
        width: 720,
        height: 1280,
      },
      {
        src: '/images/work/topsite/shot-2.jpg',
        alt: 'Topsite screen: posting an enquiry',
        caption: '02 · Post an enquiry',
        width: 720,
        height: 1280,
      },
      {
        src: '/images/work/topsite/shot-3.jpg',
        alt: 'Topsite screen: browsing enquiries with filters',
        caption: '03 · Browse enquiries',
        width: 720,
        height: 1280,
      },
    ],
    h1Size: { min: 72, max: 150 },
    nextSlug: 'ychat',
  },
]

export function getProject(slug: string): ProjectEntry | undefined {
  return projects.find((p) => p.slug === slug)
}

export function requireProject(slug: ProjectSlug): ProjectEntry {
  const project = getProject(slug)
  if (!project) throw new Error(`Unknown project: ${slug}`)
  return project
}
