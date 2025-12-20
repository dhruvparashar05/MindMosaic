'use client';

import {
  LogOut,
  User,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { SidebarTrigger } from './ui/sidebar';
import { Avatar, AvatarFallback } from './ui/avatar';
import { usePathname } from 'next/navigation';

export function Header({ pageTitle }: { pageTitle: string }) {
  const pathname = usePathname();
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
      <SidebarTrigger className="md:hidden" />

      <div className="w-full flex-1">
        <h1 className="font-semibold text-xl">{pageTitle}</h1>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <Avatar>
              <AvatarFallback><User /></AvatarFallback>
            </Avatar>
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuSeparator />
          <Link href="/login">
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </Link>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
