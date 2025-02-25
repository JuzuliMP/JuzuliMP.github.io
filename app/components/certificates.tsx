import Image from 'next/image'
import { motion } from 'framer-motion'

type Certificate = {
  title: string
  issuer: string
  date: string
  credentialId: string
  credentialUrl?: string
  pdfPath?: string
  image: string
  skills: string[]
}

const certificates: Certificate[] = [
    {
      title: "Flutter Development",
      issuer: "Techmindz",
      date: "2022",
      credentialId: "N/A",
      pdfPath: "/docs/flutter-certificate.pdf",
      image: "/images/flutter-cover.png",
      skills: ["Flutter", "Firebase", "Figma", "Dart", "Cubit"]
    },
    {
      title: "Pair Programming with a Large Language Model",
      issuer: "DeepLearning.AI",
      date: "2024",
      credentialId: "d4291fde-84f4-4040-b540-1a2ed2372a79",
      credentialUrl: "https://learn.deeplearning.ai/accomplishments/d4291fde-84f4-4040-b540-1a2ed2372a79?usp=sharing",
      image: "/images/google-cover.png",
      skills: ["Gemini", "AI in Software Development", "GenAI Applications", "Prompt Engineering"]
    }
  ]

const CertificateCard = ({ certificate }: { certificate: Certificate }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="relative h-48 w-full">
        <Image
          src={certificate.image}
          alt={`${certificate.title} certificate`}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2">
          {certificate.title}
        </h3>
        <p className="text-muted-foreground mb-2">
          Issued by {certificate.issuer}
        </p>
        <p className="text-sm text-muted-foreground mb-3">
          {certificate.date}
        </p>
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Credential ID: {certificate.credentialId}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {certificate.skills.map((skill) => (
            <span
              key={skill}
              className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
            >
              {skill}
            </span>
          ))}
        </div>
        {(certificate.credentialUrl || certificate.pdfPath) && (
          <a
            href={certificate.credentialUrl || certificate.pdfPath}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-primary hover:text-primary/80"
            aria-label={`View ${certificate.title} credential`}
            tabIndex={0}
          >
            View Credential →
          </a>
        )}
      </div>
    </motion.div>
  )
}

export default function Certificates() {
  return (
    <section className="py-16" id="certificates">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">
          Certificates & Credentials
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {certificates.map((cert) => (
          <CertificateCard key={cert.credentialId} certificate={cert} />
        ))}
      </div>
    </section>
  )
} 