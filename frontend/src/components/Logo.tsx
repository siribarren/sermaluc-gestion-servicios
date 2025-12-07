import Link from 'next/link'
import Image from 'next/image'

export function Logo() {
  return (
    <Link href="/" className="flex items-center group">
      <Image
        src="/logo_sermaluc_horizontal.png"
        alt="Sermaluc"
        width={150}
        height={40}
        className="h-10 w-auto object-contain transition-opacity group-hover:opacity-80"
        priority
      />
    </Link>
  )
}
