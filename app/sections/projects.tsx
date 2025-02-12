import ProjectCard from "@/app/components/project-card"

export default function ProjectsSection() {
  const projects = [
    {
      title: "Superr Parents App",
      description: "The ultimate parental control app, it empowers you to protect your kids online and offline, foster healthy habits, and stay connected wherever they go.",
      image: "/images/superr-parents.jpg?height=400&width=600",
      link: "https://apps.apple.com/in/app/superr-parents-app/id6443956249",
      tags: ["Flutter"],
    },
    {
      title: "Superr Child App",
      description: "Empower your children to manage their digital habits with Superr, the intuitive screen time app designed for kids ages 6-18.",
      image: "/images/superr-kids.jpg?height=400&width=600",
      link: "https://apps.apple.com/in/app/superr-child-app-early-access/id6505095316",
      tags: ["Swift", "Flutter"],
    },
    {
      title: "Ablemart | Online Delivery App",
      description: "Online delivery app introduced by Able Mart Hypermarket in Qatar. We provide delivery service to your door step. Sit back at home and relax. We will deliver all your need. We have wide range of products.",
      image: "/images/ablemart.jpg?height=400&width=600",
      link: "https://apps.apple.com/in/app/ablemart-online-delivery-app/id6479014426m",
      tags: ["Flutter"],
    },
    {
      title: "Topsite -Buy, Rent, Sell & more",
      description: "Today everyone is busy with getting a space to make sure own existence. There's room for everyone in this land!! We are with you until you find it. One step away from your dream!.",
      image: "/images/topsites.jpg?height=400&width=600",
      link: "https://apps.apple.com/in/app/topsite/id6478765755",
      tags: ["Flutter"],
    },
  ]

  return (
    <section id="projects" className="py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-12 text-center">
          Projects
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.title} {...project} />
          ))}
        </div>
      </div>
    </section>
  )
} 