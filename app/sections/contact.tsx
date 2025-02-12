import ContactForm from "@/app/components/contact-form"

export default function ContactSection() {
  return (
    <section id="contact" className="py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-12 text-center">
            Get in Touch
          </h2>
          <ContactForm />
        </div>
      </div>
    </section>
  )
} 