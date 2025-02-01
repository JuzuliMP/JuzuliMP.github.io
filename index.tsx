import Head from "next/head"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Send, GitlabIcon as GitHub, Linkedin, Mail, ChevronDown } from "lucide-react"
import { motion } from "framer-motion"

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("home")

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["home", "about", "projects", "contact"]
      const currentSection = sections.find((section) => {
        const element = document.getElementById(section)
        if (element) {
          const rect = element.getBoundingClientRect()
          return rect.top <= 100 && rect.bottom >= 100
        }
        return false
      })
      if (currentSection) {
        setActiveSection(currentSection)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Your Name - Modern Portfolio</title>
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>

      <header className="fixed top-0 left-0 right-0 z-50 bg-white bg-opacity-90 backdrop-filter backdrop-blur-sm">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-gray-800 hover:text-blue-600 transition duration-300">
              YN
            </Link>
            <div className="hidden md:flex space-x-8">
              {["home", "about", "projects", "contact"].map((item) => (
                <Link
                  key={item}
                  href={`#${item}`}
                  className={`text-gray-600 hover:text-blue-600 transition duration-300 ${
                    activeSection === item ? "border-b-2 border-blue-600" : ""
                  }`}
                >
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </Link>
              ))}
            </div>
            <button
              className="md:hidden focus:outline-none"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
          {menuOpen && (
            <div className="md:hidden mt-4 space-y-2">
              {["home", "about", "projects", "contact"].map((item) => (
                <Link
                  key={item}
                  href={`#${item}`}
                  className="block text-gray-600 hover:text-blue-600 transition duration-300"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </Link>
              ))}
            </div>
          )}
        </nav>
      </header>

      <main>
        <section
          id="home"
          className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100"
        >
          <motion.div className="text-center" initial="initial" animate="animate" variants={fadeInUp}>
            <Image
              src="/placeholder.svg"
              alt="Your Name"
              width={200}
              height={200}
              className="rounded-full mx-auto mb-8 border-4 border-white shadow-lg"
            />
            <h1 className="text-5xl font-bold mb-4 text-gray-800">Your Name</h1>
            <p className="text-xl text-gray-600 mb-8">Web Developer & Designer</p>
            <Link
              href="#about"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300"
            >
              Learn More
              <ChevronDown className="ml-2 -mr-1 h-5 w-5" aria-hidden="true" />
            </Link>
          </motion.div>
        </section>

        <section id="about" className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <motion.div initial="initial" whileInView="animate" viewport={{ once: true }} variants={fadeInUp}>
              <h2 className="text-3xl font-bold mb-8 text-center">About Me</h2>
              <div className="max-w-3xl mx-auto">
                <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                  I'm a passionate web developer and designer with a keen eye for creating beautiful, functional, and
                  user-centered digital experiences. With a background in both front-end and back-end development, I
                  bring a holistic approach to every project.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-gray-50 p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold mb-4 text-blue-600">Skills</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        HTML5 & CSS3
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        JavaScript (ES6+)
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        React.js
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Node.js
                      </li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold mb-4 text-blue-600">Expertise</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Responsive Web Design
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        UI/UX Design
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        RESTful API Development
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Version Control (Git)
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="projects" className="py-20 bg-gray-50">
          <div className="container mx-auto px-6">
            <motion.div initial="initial" whileInView="animate" viewport={{ once: true }} variants={fadeInUp}>
              <h2 className="text-3xl font-bold mb-12 text-center">Featured Projects</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((project) => (
                  <motion.div
                    key={project}
                    className="bg-white rounded-lg shadow-lg overflow-hidden transition duration-300 hover:shadow-xl"
                    whileHover={{ y: -5 }}
                  >
                    <Image
                      src="/placeholder.svg"
                      alt={`Project ${project}`}
                      width={400}
                      height={200}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-2 text-gray-800">Project {project}</h3>
                      <p className="text-gray-600 mb-4">
                        A brief description of the project and its main features. Highlight the problem it solves and
                        the technologies used.
                      </p>
                      <div className="mb-4">
                        <span className="inline-block bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm font-semibold mr-2 mb-2">
                          #react
                        </span>
                        <span className="inline-block bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm font-semibold mr-2 mb-2">
                          #nodejs
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <a href="#" className="text-blue-600 hover:text-blue-800 transition duration-300">
                          Live Demo
                        </a>
                        <a href="#" className="text-blue-600 hover:text-blue-800 transition duration-300">
                          Source Code
                        </a>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section id="contact" className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <motion.div initial="initial" whileInView="animate" viewport={{ once: true }} variants={fadeInUp}>
              <h2 className="text-3xl font-bold mb-12 text-center">Get in Touch</h2>
              <div className="max-w-3xl mx-auto">
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required
                    ></textarea>
                  </div>
                  <div>
                    <button
                      type="submit"
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300"
                    >
                      Send Message
                      <Send className="ml-2 -mr-1 h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </form>
                <div className="mt-12 flex justify-center space-x-6">
                  <a href="#" className="text-gray-400 hover:text-blue-600 transition duration-300">
                    <span className="sr-only">GitHub</span>
                    <GitHub className="h-6 w-6" />
                  </a>
                  <a href="#" className="text-gray-400 hover:text-blue-600 transition duration-300">
                    <span className="sr-only">LinkedIn</span>
                    <Linkedin className="h-6 w-6" />
                  </a>
                  <a
                    href="mailto:your.email@example.com"
                    className="text-gray-400 hover:text-blue-600 transition duration-300"
                  >
                    <span className="sr-only">Email</span>
                    <Mail className="h-6 w-6" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; {new Date().getFullYear()} Your Name. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

