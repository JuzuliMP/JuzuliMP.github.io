import type { HomeContent } from './types'

/** Copy for the first-visit loader screen (Loader.dc.html). */
export type HomeLoaderCopy = {
  /** Top-left mono line. */
  title: string
  /** Top-right mono line. */
  soundNote: string
  /** Mono line under the big percentage. */
  status: string
  /** Accessible name of the progress bar. */
  label: string
}

/** Home content as defined in `types.ts`, plus the few strings only the Home page needs. */
export type HomePageContent = HomeContent & {
  loader: HomeLoaderCopy
  writing: HomeContent['writing'] & {
    /** Mono call-to-action at the end of each article row (an arrow is added by the link). */
    readLabel: string
  }
}

export const home: HomePageContent = {
  loader: {
    title: 'Mohammed Juzuli — Portfolio',
    soundNote: 'Sound is on · switch it off anytime',
    status: 'Building the scene · Flutter · Dart · Swift',
    label: 'Loading the site',
  },
  hero: {
    eyebrow: 'Software Engineer — Bangalore, India',
    nameLines: ['Mohammed', 'Juzuli M P'],
    bio: "I'm a Software Engineer who specializes in mobile applications and loves bringing ideas to life. Right now I'm building real-time social experiences at YACHII.",
    scrollCue: { label: 'Scroll', counter: '01 / 03' },
  },
  chapters: [
    {
      number: '01',
      word: 'Design',
      lead: 'It starts on a canvas.',
      body: 'Every app begins as flows and screens: the states, the edge cases and the small details that make an interface feel obvious.',
      tags: ['Wireframes', 'UI / UX', 'Prototyping'],
      shape: 'phone',
    },
    {
      number: '02',
      word: 'Build',
      lead: 'Then it becomes an app.',
      body: 'One codebase for iPhone and Android, native code where the platform needs it, and a clean structure that keeps the app fast and reliable as it grows.',
      tags: ['iOS', 'Android', 'Cross-platform', 'Performance'],
      shape: 'code',
    },
    {
      number: '03',
      word: 'Ship',
      lead: 'And it reaches real people.',
      body: 'Calls, chat and a shared whiteboard at YChat, screen-time tools for families at Superr, grocery delivery in Qatar with Ablemart: apps released to the App Store and Google Play.',
      tags: ['Releases', 'Updates', 'App Store', 'Google Play'],
      shape: 'globe',
    },
  ],
  selectedApps: {
    heading: 'Selected apps',
    link: { label: 'All work (05) →', href: '/work/' },
    slugs: ['ychat', 'superr-parents', 'ablemart'],
  },
  openSource: {
    heading: 'Open source',
    eyebrow: 'For the Flutter community',
    package: {
      label: 'Flutter package',
      name: 'office_viewer',
      description: 'A ready-made viewer that lets Flutter apps open PDF and Office documents.',
      links: [
        { label: 'View on pub.dev ↗', href: 'https://pub.dev/packages/office_viewer' },
        { label: 'GitHub ↗', href: 'https://github.com/juzuli/office_viewer' },
      ],
    },
  },
  writing: {
    heading: 'Writing',
    link: { label: 'All articles on Medium ↗', href: 'https://juzuli.medium.com/' },
    readLabel: 'Read',
    articles: [
      {
        date: 'Apr 2026',
        title: 'How to Find Unused Files in a Flutter Project (Without Guessing)',
        href: 'https://juzuli.medium.com/how-to-find-unused-files-in-a-flutter-project-without-guessing-9a7728ef2d51',
      },
      {
        date: 'Jul 2024',
        title: 'FlutterGen: The Unsung Hero of Flutter Asset Management',
        href: 'https://juzuli.medium.com/fluttergen-the-unsung-hero-of-flutter-asset-management-be4a45fb1832',
      },
      {
        date: 'Jul 2024',
        title: "Flutter Localization: A Developer's Journey with easy_localization",
        href: 'https://juzuli.medium.com/flutter-localization-a-developers-journey-with-easy-localization-ebf5d93b871a',
      },
    ],
  },
  cta: {
    eyebrow: 'Contact',
    title: 'Have an app in mind',
    mark: '?',
    button: "Let's talk",
    secondary: { label: 'Or learn more about me →', href: '/about/' },
  },
}
