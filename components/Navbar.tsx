'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

const Navbar = () => {
  const router = useRouter();

  return (
    <nav className="bg-orange-300 p-4">
      <ul className="flex space-x-4">
        <li>
          <Link href="/" className="text-white">
            Home
          </Link>
        </li>
        <li>
          <Link href="/about" className="text-white">
            About
          </Link>
        </li>
        <li>
          <Link href="/contact" className="text-white">
            Contact
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;