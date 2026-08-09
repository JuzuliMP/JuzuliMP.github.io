import {
  Github, Linkedin, Mail, ExternalLink, Rocket, Users, Award, Code, Twitter,
  Briefcase, Calendar, MapPin, ArrowUpRight, Sparkles,
} from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { GradientMeshBackground } from "./components/GradientMeshBackground";
import { ParticleNetwork } from "./components/ParticleNetwork";
import { CursorGlow } from "./components/CursorGlow";
import { SmoothScroll } from "./components/SmoothScroll";
import { Navigation } from "./components/Navigation";
import { TypingEffect } from "./components/TypingEffect";
import { TerminalWindow } from "./components/TerminalWindow";
import { MagneticButton } from "./components/MagneticButton";
import { TextScramble } from "./components/TextScramble";
import { TiltCard } from "./components/TiltCard";
import { AnimatedCounter } from "./components/AnimatedCounter";

const projects = [
  {
    title: "YChat: Online Hangout App",
    description: "Social networking hangout app with real-time messaging, media sharing, and group interactions.",
    technologies: ["Flutter", "Dart", "WebSockets", "Firebase", "BLoC"],
    link: "https://ychatt.com/",
    image: "/images/ychat.png",
    featured: false,
  },
  {
    title: "Superr Parents App",
    description: "The ultimate parental control app — empowering parents to protect kids online and offline, foster healthy habits, and stay connected.",
    technologies: ["Flutter", "Firebase", "BLoC", "Hive"],
    link: "https://superr.app/",
    image: "/images/superr-parents.jpg",
  },
  {
    title: "Superr Child App",
    description: "Screen time management for kids ages 6-18. Helps create healthy digital habits with interactive features and parental oversight.",
    technologies: ["Swift", "Flutter", "Firebase"],
    link: "https://superr.app/",
    image: "/images/superr-kids.jpg",
  },
  {
    title: "Ablemart",
    description: "Online delivery app for Able Mart Hypermarket in Qatar. Full shopping experience with browsing, cart management, and order tracking.",
    technologies: ["Flutter", "REST API", "PostgreSQL"],
    link: "https://ablemartonline.com/",
    image: "/images/ablemart.jpg",
  },
  {
    title: "Topsite",
    description: "Real estate marketplace for buying, renting, and selling properties. Features listings, search filters, and seamless UX.",
    technologies: ["Flutter", "Firebase", "Figma"],
    link: "https://play.google.com/store/apps/details?id=com.topsite.app",
    image: "/images/topsites.jpg",
  },
];

const skills = [
  { category: "Mobile Development", items: ["Flutter", "Dart", "Swift", "iOS", "Android"] },
  { category: "State Management", items: ["BLoC", "Cubit", "Provider", "Riverpod"] },
  { category: "Backend & Database", items: ["Firebase", "PostgreSQL", "Hive", "WebSockets"] },
  { category: "Design & Tools", items: ["Figma", "Git", "CI/CD", "UI/UX Design"] },
];

const experience = [
  {
    role: "Software Engineer",
    company: "YACHII PTE. LTD.",
    period: "Aug 2025 - Present",
    location: "Bangalore, India",
    description: "Leading Flutter development for YChat social networking platform. Building real-time messaging, media sharing, and interactive features.",
    link: "https://yachii.com/"
  },
  {
    role: "Mobile Application Developer",
    company: "CoinedOne Technologies Pvt. Ltd.",
    period: "Jul 2022 - Aug 2025 · 3 yrs 2 mos",
    location: "Kochi, India",
    description: "Developed Superr Parents & Child apps for parental control and screen time management across iOS and Android platforms.",
    link: "https://coined.one/"
  },
  {
    role: "Jr Flutter Developer",
    company: "NDimensionZ Solutions Pvt Ltd",
    period: "Apr 2022 - Jun 2022",
    location: "Kochi, India",
    description: "Closely worked with NDZ Design and Development department and worked in the live project “Learning Management and System” for Techmindz.",
    link: "https://www.ndimensionz.com/"
  },
];

const socials = [
  { icon: Github, href: "https://github.com/JuzuliMP", label: "GitHub" },
  { icon: Linkedin, href: "https://linkedin.com/in/juzuli", label: "LinkedIn" },
  { icon: Twitter, href: "https://x.com/Juzuli_M_P", label: "X/Twitter" },
  { icon: Mail, href: "mailto:juzulitry@gmail.com", label: "Email" },
];

function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center pt-20">
      <motion.div style={{ y, opacity }} className="max-w-7xl mx-auto px-6 py-20 w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="space-y-8">
            {/* Name */}
            <div>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-muted-foreground mb-3 text-lg">
                Hi, I'm
              </motion.p>
              <h1>
                <span className="gradient-text-purple">Mohammed</span>
                <br />
                <span className="gradient-text-purple">Juzuli M P</span>
              </h1>
            </div>

            {/* Typing role */}
            <div className="text-xl md:text-2xl text-muted-foreground font-[family-name:var(--font-mono)]">
              {">"} <TypingEffect texts={["Flutter Developer", "UI/UX Designer", "Mobile App Specialist", "Cross-Platform Expert"]} />
            </div>

            {/* Bio */}
            <p className="text-muted-foreground text-lg leading-relaxed max-w-lg">
              Building beautiful, performant mobile applications with Flutter. Specialized in creating seamless user experiences across iOS and Android.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 pt-2">
              <MagneticButton href="#contact">
                <span className="flex items-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
                  <Sparkles className="w-4 h-4" /> Get in Touch
                </span>
              </MagneticButton>
              <MagneticButton href="#projects">
                <span className="flex items-center gap-2 px-8 py-3.5 border border-primary/30 rounded-xl font-medium text-primary hover:bg-primary/10 hover:border-primary/50 transition-all">
                  View Projects <ArrowUpRight className="w-4 h-4" />
                </span>
              </MagneticButton>
            </div>

            {/* Social links */}
            <div className="flex gap-3 pt-2">
              {socials.map(({ icon: Icon, href, label }) => (
                <MagneticButton key={label} href={href} strength={0.4}>
                  <span className="flex items-center justify-center w-11 h-11 rounded-xl glass hover:border-primary/40 transition-all group">
                    <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </span>
                </MagneticButton>
              ))}
            </div>
          </motion.div>

          {/* Terminal */}
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="hidden lg:block">
            <div className="perspective-container">
              <TiltCard className="rounded-2xl" tiltStrength={5}>
                <TerminalWindow />
              </TiltCard>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground text-xs z-10">
        <span>Scroll</span>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-5 h-8 rounded-full border border-primary/30 flex justify-center pt-1.5">
          <div className="w-1 h-1.5 rounded-full bg-primary" />
        </motion.div>
      </motion.div>
    </section>
  );
}

function StatsSection() {
  const yearsExperience = Math.max(1, new Date().getFullYear() - 2022 - (new Date().getMonth() < 5 ? 1 : 0));

  const stats = [
    { icon: Award, value: yearsExperience, suffix: "+", label: "Years Experience" },
    { icon: Code, value: 100, suffix: "K+", label: "Lines of Code" },
  ];

  return (
    <section className="relative z-10 py-20">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row justify-center gap-4 md:gap-8">
          {stats.map(({ icon: Icon, value, suffix, label }, i) => (
            <TiltCard key={label} className="glass-card rounded-2xl p-6 md:p-8 flex-1 w-full">
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex flex-col items-center text-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-heading)] gradient-text-purple">
                  <AnimatedCounter target={value} suffix={suffix} />
                </div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </motion.div>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section id="about" className="relative z-10 py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Photo */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="flex justify-center">
            <div className="relative">
              <div className="w-64 h-64 md:w-80 md:h-80 rounded-3xl overflow-hidden glass-card p-1">
                <img src="/images/profile.jpeg" alt="Mohammed Juzuli M P — Software Engineer and Flutter Developer based in Bangalore, India" className="w-full h-full object-cover rounded-[calc(1.5rem-4px)]" />
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-2xl border border-primary/20 float" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-2xl bg-primary/10 float-delay-1" />
              <div className="absolute top-1/2 -right-8 w-3 h-3 rounded-full bg-accent float-delay-2" />
            </div>
          </motion.div>

          {/* Text */}
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <TextScramble text="// ABOUT ME" className="text-sm text-primary tracking-widest mb-3 block" />
              <h2 className="text-foreground">Crafting Digital <span className="gradient-text-purple">Experiences</span></h2>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                I'm a passionate mobile application developer specializing in Flutter development and UI/UX design. Building digital products, brands, and experiences with a focus on user experience and functionality.
              </p>
              <p>
                With expertise in both Flutter and Swift, I create beautiful cross-platform applications that deliver seamless experiences across iOS and Android. My skill set includes state management with BLoC and Cubit, Firebase integration, and local storage solutions.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ExperienceSection() {
  return (
    <section id="experience" className="relative z-10 py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <TextScramble text="// EXPERIENCE" className="text-sm text-primary tracking-widest mb-3 block" />
          <h2>Work <span className="gradient-text-purple">Timeline</span></h2>
        </motion.div>

        <div className="relative max-w-3xl mx-auto">
          <div className="timeline-line" />
          {experience.map((exp, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="relative pl-14 pb-12 last:pb-0">
              <div className="absolute left-[14px] top-1 timeline-dot" />
              <TiltCard className="glass-card rounded-2xl p-6 md:p-8" tiltStrength={5}>
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" /> {exp.period}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" /> {exp.location}
                  </span>
                </div>
                <h3 className="text-foreground mb-1">{exp.role}</h3>
                {exp.link ? (
                  <a href={exp.link} target="_blank" rel="noopener noreferrer" className="text-primary text-sm mb-3 inline-flex items-center gap-1.5 hover:text-primary/80 transition-colors">
                    <Briefcase className="w-3.5 h-3.5" /> {exp.company}
                  </a>
                ) : (
                  <p className="text-primary text-sm mb-3 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" /> {exp.company}
                  </p>
                )}
                <p className="text-muted-foreground text-sm leading-relaxed">{exp.description}</p>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectsSection() {
  return (
    <section id="projects" className="relative z-10 py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <TextScramble text="// PROJECTS" className="text-sm text-primary tracking-widest mb-3 block" />
          <h2>Featured <span className="gradient-text-purple">Work</span></h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {projects.map((project, i) => (
            <motion.div key={project.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className={project.featured ? 'md:col-span-2' : ''}>
              <TiltCard className="glass-card rounded-2xl overflow-hidden group neon-border">
                <a href={project.link} target="_blank" rel="noopener noreferrer" className={`block h-full ${project.featured ? 'md:grid md:grid-cols-2' : ''}`}>
                  {/* Image */}
                  <div className="relative h-48 md:h-56 overflow-hidden">
                    <img src={project.image} alt={`${project.title} — ${project.description}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--card)] via-transparent to-transparent" />
                    {project.featured && (
                      <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium border border-primary/30 backdrop-blur-sm">
                        ⭐ Featured
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6 md:p-8">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-foreground group-hover:text-primary transition-colors">{project.title}</h3>
                      <div className="p-2 rounded-lg bg-primary/5 hover:bg-primary/20 transition-colors">
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{project.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech) => (
                        <span key={tech} className="skill-tag text-xs">{tech}</span>
                      ))}
                    </div>
                  </div>
                </a>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SkillsSection() {
  return (
    <section id="skills" className="relative z-10 py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <TextScramble text="// TECH STACK" className="text-sm text-primary tracking-widest mb-3 block" />
          <h2>Skills & <span className="gradient-text-purple">Technologies</span></h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {skills.map((group, gi) => (
            <motion.div key={group.category} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: gi * 0.1 }}>
              <TiltCard className="glass-card rounded-2xl p-6 h-full" tiltStrength={8}>
                <h4 className="text-foreground mb-4 text-sm font-semibold tracking-wide uppercase">{group.category}</h4>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((skill, si) => (
                    <motion.span key={skill} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: gi * 0.1 + si * 0.05 }} className="skill-tag">
                      {skill}
                    </motion.span>
                  ))}
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section id="contact" className="relative z-10 py-24 md:py-32">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <TextScramble text="// CONTACT" className="text-sm text-primary tracking-widest mb-3 block" />
          <h2 className="mb-6">Let's Build Something <span className="gradient-text-purple">Amazing</span></h2>
        </motion.div>
        <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-muted-foreground text-lg mb-10 leading-relaxed">
          I'm always interested in hearing about new projects and opportunities. Whether you have a question or just want to say hi, feel free to reach out!
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
          <MagneticButton href="mailto:juzulitry@gmail.com">
            <span className="inline-flex items-center gap-3 px-10 py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-lg shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow">
              <Mail className="w-5 h-5" /> Get in Touch
            </span>
          </MagneticButton>
        </motion.div>

        {/* Social links */}
        <div className="flex justify-center gap-4 mt-10">
          {socials.map(({ icon: Icon, href, label }) => (
            <MagneticButton key={label} href={href} strength={0.4}>
              <span className="flex items-center justify-center w-12 h-12 rounded-xl glass hover:border-primary/40 transition-all group">
                <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </span>
            </MagneticButton>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative z-10 py-8 border-t border-border">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <p className="text-sm text-muted-foreground">
          © 2026 Mohammed Juzuli M P. Designed & built with <span className="text-primary">♥</span> using React & Tailwind CSS.
        </p>
      </div>
    </footer>
  );
}

function Portfolio() {
  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* Background effects */}
      <GradientMeshBackground />
      <ParticleNetwork />
      <CursorGlow />
      <div className="noise-overlay" />

      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main>
        <HeroSection />
        <div className="section-divider" />
        <StatsSection />
        <div className="section-divider" />
        <AboutSection />
        <div className="section-divider" />
        <ExperienceSection />
        <div className="section-divider" />
        <ProjectsSection />
        <div className="section-divider" />
        <SkillsSection />
        <div className="section-divider" />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <SmoothScroll>
      <Portfolio />
    </SmoothScroll>
  );
}