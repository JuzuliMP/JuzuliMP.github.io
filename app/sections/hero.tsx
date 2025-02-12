"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

export default function HeroSection() {
  return (
    <section id="about" className="py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="relative h-32 w-32 overflow-hidden rounded-full ring-2 ring-gray-200 dark:ring-gray-700">
            <Image
              src="/images/profile.jpg"
              alt="Profile picture"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="space-y-2">
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
              Hi, I'm Juzuli
            </p>
            <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-300 sm:text-2xl md:text-3xl">
              Mobile Application Developer
            </h2>
            <div className="py-4" />
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
              Building digital{" "}
              <br />
              products, brands,{" "}
              <br />
              and experience.
            </h1>
          </div>
        </div>
      </div>
    </section>
  )
}