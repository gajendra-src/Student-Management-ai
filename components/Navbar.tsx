'use client'

import Link from 'next/link'

const Navbar: React.FC = () => {
  return (
    <nav className="bg-blue-500 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-white text-lg font-bold">Student Management System</h1>
        <div className="flex space-x-4">
          <Link href="/students" className="text-white hover:underline">
            Students
          </Link>
          <Link href="/courses" className="text-white hover:underline">
            Courses
          </Link>
          <Link href="/grades" className="text-white hover:underline">
            Grades
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default Navbar