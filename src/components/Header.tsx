'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-pink-500 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          <Link href="/">PantyPost</Link>
        </h1>
        <nav>
          <ul className="flex space-x-4">
            <li>
              <Link href="/browse">Browse</Link>
            </li>
            <li>
              <Link href="/sellers/my-listings">My Listings</Link>
            </li>
            <li>
              <Link href="/login">Login</Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
