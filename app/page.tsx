"use client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import ContactSection from "./sections/contact"
import HeroSection from "./sections/hero"
import ProjectsSection from "./sections/projects"
import TechStackSection from "./sections/tech-stack"
import { Github, Linkedin, Mail, X } from "lucide-react"
import { useState } from "react"
import ResumeModal from "./components/resume-modal"
import Certificates from './components/certificates'
// import Timeline from "./components/timeline"

export default function Page() {
  const [isResumeOpen, setIsResumeOpen] = useState(false)

  const handleResumeClick = () => {
    setIsResumeOpen(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 items-center px-4 md:px-6">
        <div className="container flex h-14 items-center justify-between">
          <Link className="flex items-center space-x-2" href="/">
            <span className="hidden font-bold sm:inline-block">Juzuli</span>
          </Link>
          <div className="flex items-center space-x-6">
            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
              <Link href="#about" className="transition-colors hover:text-foreground/80">
                About
              </Link>
              <Link href="#projects" className="transition-colors hover:text-foreground/80">
                Projects
              </Link>
              <Link href="#tech-stack" className="transition-colors hover:text-foreground/80">
                Tech Stack
              </Link>
              <Link href="#certificates" className="transition-colors hover:text-foreground/80">
                Certificates
              </Link>
              <Link href="#contact" className="transition-colors hover:text-foreground/80">
                Contact
              </Link>
            </nav>
            <Button
              variant="outline"
              onClick={handleResumeClick}
              aria-label="Open Resume"
            >
              Resume
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 md:px-6">
        <HeroSection />
        {/* <Timeline /> */}
        <ProjectsSection />
        <TechStackSection />
        <Certificates />
        <ContactSection />
      </main>

      <footer className="border-t">
        <div className="container flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center justify-between px-4 md:px-6">
          <p className="text-xs text-gray-500 dark:text-gray-400">© 2025 Mohammed Juzuli M P. All rights reserved.</p>
          <div className="space-x-4">
            <SocialLinks />
          </div>
        </div>
      </footer>
      
      <ResumeModal
        isOpen={isResumeOpen}
        onClose={() => setIsResumeOpen(false)}
      />
    </div>
  )
}

function SocialLinks() {
  const socialLinks = [
    { href: "https://github.com/JuzuliMP", icon: Github, label: "GitHub" },
    { href: "https://www.linkedin.com/in/juzuli/", icon: Linkedin, label: "LinkedIn" },
    { href: "https://x.com/Juzuli_M_P", icon: X, label: "x" },
    { href: "mailto:juzulitry@gmail.com.com", icon: Mail, label: "Email" },
  ]

  return (
    <>
      {socialLinks.map(({ href, icon: Icon, label }) => (
        <Link key={href} href={href} target="_blank">
          <Button variant="outline" size="icon">
            <Icon className="h-4 w-4" />
            <span className="sr-only">{label}</span>
          </Button>
        </Link>
      ))}
    </>
  )
}

