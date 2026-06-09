'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

const Navbar = () => {
  const router = useRouter();

  return (
    <nav className="bg-teal-600 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-white text-lg font-bold">
          <Link href="/" className="hover:text-teal-200">
            Home
          </Link>
        </div>
        <div className="flex space-x-4">
          <Link href="/students" className="text-white hover:text-teal-200">
            Students
          </Link>
          <Link href="/courses" className="text-white hover:text-teal-200">
            Courses
          </Link>
          <Link href="/grades" className="text-white hover:text-teal-200">
            Grades
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;