'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

const Navbar = () => {
  const router = useRouter()

  return (
    <nav className="bg-purple-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-lg font-bold">
          <Link href="/" className="hover:text-gray-300">
            Home
          </Link>
        </div>
        <div className="space-x-4">
          <Link href="/students" className="hover:text-gray-300">
            Students
          </Link>
          <Link href="/courses" className="hover:text-gray-300">
            Courses
          </Link>
          <Link href="/grades" className="hover:text-gray-300">
            Grades
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default Navbar