"use client"

import Link from 'next/link'

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <img src="/logo.png" alt="App Logo" className="h-8 w-8 mr-2" />
          <span className="text-lg font-semibold">Student Management System</span>
        </div>
        <nav className="flex space-x-4">
          <Link href="/">
            <a className="hover:underline">Home</a>
          </Link>
          <Link href="/students">
            <a className="hover:underline">Students</a>
          </Link>
          <Link href="/courses">
            <a className="hover:underline">Courses</a>
          </Link>
          <Link href="/grades">
            <a className="hover:underline">Grades</a>
          </Link>
        </nav>
        <div className="text-sm">
          &copy; {new Date().getFullYear()} Student Management System. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

export default Footer