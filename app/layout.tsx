import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import type React from "react" // Import React

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Juzuli - Mobile application developer",
  description: "Mobile application developer portfolio showcasing projects and skills",
  icons: {
    icon: '/images/profile-circle.png', // Favicon
    apple: '/images/profile-circle.png', // Apple touch icon
  },
  openGraph: {
    title: "Juzuli.dev - Mobile application developer",
    description: "Mobile application developer portfolio showcasing projects and skills",
    images: [
      {
        url: '/images/profile.jpg',
        width: 800,
        height: 800,
        alt: 'Profile Picture',
      }
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Juzuli.dev - Mobile application developer",
    description: "Mobile application developer portfolio showcasing projects and skills",
    images: ['/images/profile.jpg'],
    creator: '@yourtwitterhandle', // Optional: your Twitter handle
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Ensure base path for assets */}
        <base href={process.env.NODE_ENV === 'production' ? '/JuzuliMP.github.io/' : '/'} />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

