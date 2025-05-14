'use client';

import {
  UserGroupIcon,
  HomeIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
const WaterDropIcon = ({ className = "w-6 h-6", strokeWidth = 1.5 }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={strokeWidth}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 2c-5.33 7.33-8 11-8 14a8 8 0 1016 0c0-3-2.67-6.67-8-14z"
    />
  </svg>
);
// Map of links to display in the side navigation.
// Depending on the size of the application, this would be stored in a database.
const links = [
  // { name: 'Home', href: '/dashboard', icon: HomeIcon },
  {
    name: 'Cervical Cancer Detection',
    href: '/cervical',
    icon: DocumentDuplicateIcon,
  },
  { name: 'Tube Well Automation System', href: '/tubwell', icon: WaterDropIcon },
  { name: 'Chemo', href: '/chemo', icon: DocumentDuplicateIcon },
  { name: 'OCT segmentation', href: '/oct', icon: DocumentDuplicateIcon },
];

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;
        return (
          <Link
            key={link.name}
            href={link.href}
            className={clsx(
              'flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3',
              {
                'bg-sky-100 text-blue-600': pathname === link.href,
              },
            )}
          >
            <LinkIcon className="w-6" />
            <p className="hidden md:block">{link.name}</p>
          </Link> 
        );
      })}
    </>
  );
}
