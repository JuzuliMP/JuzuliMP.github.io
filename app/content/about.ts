import type { AboutContent } from './types'

export const about: AboutContent = {
  headline: ['App Developer', 'UI/UX Designer'],
  headlineMark: '&',
  note: 'Based in Bangalore, India. Building cross-platform apps since 2022.',
  label: 'About me',
  lead: "Hello, I'm Juzuli. I design and build mobile apps, and I care most about how they feel in someone's hand.",
  bio: [
    'I specialize in mobile apps and UI/UX design. I enjoy building digital products, brands and experiences with a strong focus on what people actually need to get done.',
    'With Flutter, Swift and Kotlin I create cross-platform apps that feel at home on both iOS and Android, using BLoC and Cubit for state, Firebase for the backend pieces and local storage for apps that keep working offline.',
  ],
  experience: { heading: 'Experience', range: '2022 — now' },
  toolkit: { heading: 'Toolkit' },
  cta: {
    eyebrow: 'Contact',
    title: 'Need an app built with care',
    mark: '?',
    button: "Let's talk",
    secondary: { label: 'See the work →', href: '/work/' },
  },
}
