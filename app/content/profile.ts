import type { Profile } from './types'

export const profile: Profile = {
  name: 'Mohammed Juzuli M P',
  shortName: 'Mohammed Juzuli',
  title: 'Software Engineer',
  location: 'Bangalore, India',
  email: 'juzulitry@gmail.com',
  emailHref: 'mailto:juzulitry@gmail.com',
  socials: [
    { id: 'github', label: 'GitHub', href: 'https://github.com/JuzuliMP' },
    { id: 'linkedin', label: 'LinkedIn', href: 'https://linkedin.com/in/juzuli' },
    { id: 'x', label: 'X', href: 'https://x.com/Juzuli_M_P' },
    { id: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/juzuli._/' },
  ],
  portrait: {
    src: '/images/portrait.jpg',
    alt: 'Portrait of Mohammed Juzuli M P',
  },
}
