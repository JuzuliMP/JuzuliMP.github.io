"use client"

import { Card } from "@/components/ui/card"
import { 
  FaGitAlt, 
} from "react-icons/fa"
import { 
  SiFlutter,
  SiDart,
  SiFirebase,
  SiSwift,
  SiPostgresql,
  SiRsocket,
  SiHive
} from "react-icons/si"
import {
  TbBrandVlc,
  TbCube,
} from "react-icons/tb"

const technologies = [
  { icon: SiFlutter, name: "Flutter" },
  { icon: SiDart, name: "Dart" },
  { icon: SiFirebase, name: "Firebase" },
  { icon: SiSwift, name: "Swift" },
  { icon: FaGitAlt, name: "Git" },
  { icon: SiPostgresql, name: "PostgreSQL" },
  { icon: TbBrandVlc, name: "BLoC" },
  { icon: TbCube, name: "Cubit" },
  { icon: SiHive, name: "Hive" },
  { icon: SiRsocket, name: "WebSockets" },
]

export default function TechStackSection() {
  return (
    <section id="tech-stack" className="py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-12 text-center">
          Tech Stack
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {technologies.map(({ icon: Icon, name }) => (
            <Card 
              key={name} 
              className="p-6 flex flex-col items-center justify-center gap-4 hover:shadow-lg transition-shadow group"
            >
              <Icon className="w-12 h-12 group-hover:text-primary transition-colors" />
              <span className="font-medium">{name}</span>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
} 