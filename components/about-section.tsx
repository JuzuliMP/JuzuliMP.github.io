"use client"

import { motion } from "framer-motion"

export function AboutSection() {
  const skillsAnimation = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const skillItem = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <section id="about" className="container py-24">
      <motion.h2
        className="text-3xl font-bold mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        About Me
      </motion.h2>
      <div className="grid md:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-lg mb-4">
            I'm a passionate web developer and designer with a keen eye for creating beautiful, functional, and
            user-centered digital experiences. With a background in both front-end and back-end development, I bring a
            holistic approach to every project.
          </p>
          <p className="text-lg">
            When I'm not coding, you can find me exploring new technologies, contributing to open-source projects, or
            enjoying the great outdoors.
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <h3 className="text-xl font-semibold mb-4">Skills & Expertise</h3>
          <motion.ul className="grid grid-cols-2 gap-2" variants={skillsAnimation} initial="hidden" animate="show">
            {[
              "HTML5 & CSS3",
              "JavaScript (ES6+)",
              "React.js",
              "Next.js",
              "Node.js",
              "TypeScript",
              "Responsive Design",
              "UI/UX Design",
            ].map((skill, index) => (
              <motion.li key={index} className="flex items-center" variants={skillItem}>
                <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                {skill}
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>
      </div>
    </section>
  )
}

