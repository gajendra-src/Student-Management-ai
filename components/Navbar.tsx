'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

const Navbar: React.FC = () => {
  const router = useRouter();

  return (
    <nav className="bg-emerald-600 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-white text-lg font-semibold">
          Home
        </Link>
        <div className="flex space-x-4">
          <Link href="/students" className="text-white">
            Students
          </Link>
          <Link href="/courses" className="text-white">
            Courses
          </Link>
          <Link href="/grades" className="text-white">
            Grades
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;