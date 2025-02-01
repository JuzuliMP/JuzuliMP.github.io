"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Icons } from "@/components/icons"
import { motion } from "framer-motion"

export function ContactSection() {
  return (
    <section id="contact" className="container py-24">
      <motion.h2
        className="text-3xl font-bold mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Get in Touch
      </motion.h2>
      <div className="grid md:grid-cols-2 gap-8">
        <motion.form
          className="space-y-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Input type="text" placeholder="Name" required />
          <Input type="email" placeholder="Email" required />
          <Textarea placeholder="Message" required />
          <Button type="submit">Send Message</Button>
        </motion.form>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-lg mb-4">
            Feel free to reach out if you have any questions or if you'd like to work together. I'm always open to new
            opportunities and collaborations.
          </p>
          <motion.div
            className="flex items-center space-x-4 mb-4"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Icons.mail className="w-6 h-6" />
            <a href="mailto:your.email@example.com" className="text-primary hover:underline">
              your.email@example.com
            </a>
          </motion.div>
          <div className="flex space-x-4">
            <motion.a
              href="https://github.com/yourusername"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Icons.gitHub className="w-6 h-6" />
              <span className="sr-only">GitHub</span>
            </motion.a>
            <motion.a
              href="https://linkedin.com/in/yourusername"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Icons.linkedin className="w-6 h-6" />
              <span className="sr-only">LinkedIn</span>
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

