'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

const Navbar = () => {
  const router = useRouter()

  return (
    <nav className="bg-light-green p-4">
      <ul className="flex space-x-4">
        <li>
          <Link href="/" className="text-white">
            Home
          </Link>
        </li>
        <li>
          <Link href="/students" className="text-white">
            Students
          </Link>
        </li>
        <li>
          <Link href="/courses" className="text-white">
            Courses
          </Link>
        </li>
        <li>
          <Link href="/grades" className="text-white">
            Grades
          </Link>
        </li>
      </ul>
    </nav>
  )
}

export default Navbar