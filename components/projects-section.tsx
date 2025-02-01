"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"

const projects = [
  {
    title: "Project 1",
    description:
      "A brief description of the project and its main features. Highlight the problem it solves and the technologies used.",
    image: "/placeholder.svg",
    technologies: ["React", "Node.js", "MongoDB"],
    demoLink: "#",
    sourceLink: "#",
  },
  {
    title: "Project 2",
    description:
      "Another project description showcasing your skills and problem-solving abilities. Mention any challenges overcome during development.",
    image: "/placeholder.svg",
    technologies: ["Next.js", "TypeScript", "Tailwind CSS"],
    demoLink: "#",
    sourceLink: "#",
  },
  {
    title: "Project 3",
    description:
      "A third project highlighting your versatility as a developer. Discuss the impact of this project and any interesting features implemented.",
    image: "/placeholder.svg",
    technologies: ["Vue.js", "Express", "PostgreSQL"],
    demoLink: "#",
    sourceLink: "#",
  },
]

export function ProjectsSection() {
  return (
    <section id="projects" className="container py-24">
      <motion.h2
        className="text-3xl font-bold mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Featured Projects
      </motion.h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((project, index) => (
          <motion.div
            key={index}
            className="flex flex-col border rounded-lg overflow-hidden transition-all hover:shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <div className="relative h-48">
              <Image src={project.image || "/placeholder.svg"} alt={project.title} fill className="object-cover" />
            </div>
            <div className="p-4 flex flex-col flex-grow">
              <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
              <p className="text-muted-foreground mb-4 flex-grow">{project.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {project.technologies.map((tech, techIndex) => (
                  <Badge key={techIndex} variant="secondary">
                    {tech}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <a href={project.demoLink} target="_blank" rel="noopener noreferrer">
                    Live Demo
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a href={project.sourceLink} target="_blank" rel="noopener noreferrer">
                    Source Code
                  </a>
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

