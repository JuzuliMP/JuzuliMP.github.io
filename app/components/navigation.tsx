import Link from 'next/link'
import { usePathname } from 'next/navigation'

const Navigation = () => {
  const basePath = process.env.NODE_ENV === 'production' ? '/JuzuliMP.github.io' : ''
  const pathname = usePathname()

  return (
    <Link href={`${basePath}/your-path`}>
      Your Link
    </Link>
  )
} 