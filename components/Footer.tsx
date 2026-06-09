import Link from 'next/link'

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <span className="text-lg font-semibold">Student Management System</span>
        </div>
        <nav className="flex space-x-4">
          <Link href="/" className="hover:underline">Home</Link>
          <Link href="/students" className="hover:underline">Students</Link>
          <Link href="/courses" className="hover:underline">Courses</Link>
          <Link href="/grades" className="hover:underline">Grades</Link>
        </nav>
        <div className="text-sm">
          &copy; {new Date().getFullYear()} Student Management System. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

export default Footer