"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/config/site"
import { motion } from "framer-motion"

export function HeroSection() {
  return (
    <section className="container flex flex-col-reverse md:flex-row items-center justify-between py-24 gap-8">
      <motion.div
        className="flex flex-col items-start gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">{siteConfig.name}</h1>
        <p className="text-xl text-muted-foreground">Web Developer & Designer</p>
        <p className="text-lg text-muted-foreground max-w-[600px]">
          Passionate about creating beautiful, functional, and user-centered digital experiences.
        </p>
        <motion.div
          className="flex gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Button asChild>
            <a href="#projects">View Projects</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="#contact">Contact Me</a>
          </Button>
        </motion.div>
      </motion.div>
      <motion.div
        className="relative w-[280px] h-[280px] md:w-[320px] md:h-[320px]"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Image src="/placeholder.svg" alt={siteConfig.name} fill className="rounded-full object-cover" />
      </motion.div>
    </section>
  )
}

