'use client';

import Link from 'next/link';
import Image from 'next/image';

const Navbar = () => {
  return (
    <nav className="bg-blue-800 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-white text-lg font-bold">
          <Image src="/logo.png" alt="Logo" width={50} height={50} />
          MyApp
        </Link>
        <div className="flex space-x-4">
          <Link href="/about" className="text-white">
            About
          </Link>
          <Link href="/courses" className="text-white">
            Courses
          </Link>
          <Link href="/contact" className="text-white">
            Contact
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;