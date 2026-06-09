import Link from 'next/link'

const Navbar = () => {
  return (
    <nav className="bg-green-400 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-white text-lg font-bold">Student Management System</h1>
        <div className="flex space-x-4">
          <Link href="/students" className="text-white hover:underline">Students</Link>
          <Link href="/courses" className="text-white hover:underline">Courses</Link>
          <Link href="/grades" className="text-white hover:underline">Grades</Link>
          <Link href="/attendance" className="text-white hover:underline">Attendance</Link>
        </div>
      </div>
    </nav>
  )
}

export default Navbar