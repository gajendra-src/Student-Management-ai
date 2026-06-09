import Link from 'next/link';

const Navbar = () => {
  return (
    <nav className="bg-blue-500 p-4">
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
          <Link href="/reports" className="text-white">
            Reports
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;