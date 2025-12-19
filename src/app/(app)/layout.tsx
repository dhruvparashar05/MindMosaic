'use client';
import type { PropsWithChildren } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import {
  Bot,
  Calendar,
  Heart,
  LayoutDashboard,
  LogOut,
  Notebook,
  BookOpen,
  Smile,
  User,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/resources', label: 'Resources', icon: BookOpen },
  { href: '/journal', label: 'Journal', icon: Notebook },
  { href: '/mood-tracker', label: 'Mood Tracker', icon: Smile },
  { href: '/chatbot', label: 'AI Chatbot', icon: Bot },
  { href: '/appointments', label: 'Appointments', icon: Calendar },
];

export default function AppLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary">
              <Heart className="text-primary-foreground" />
            </div>
            <h1 className="font-headline text-2xl font-bold text-primary-foreground transition-all group-data-[collapsible=icon]:-ml-8 group-data-[collapsible=icon]:opacity-0">
              Mind Mosaic
            </h1>
          </div>
        </SidebarHeader>
        <SidebarMenu className="flex-1 overflow-y-auto">
          {navLinks.map((link) => (
            <SidebarMenuItem key={link.href}>
              <Link href={link.href} legacyBehavior passHref>
                <SidebarMenuButton
                  isActive={pathname.startsWith(link.href)}
                  tooltip={link.label}
                >
                  <link.icon />
                  <span>{link.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <SidebarFooter className="p-4">
          <div className="flex items-center gap-3 transition-all duration-200 group-data-[collapsible=icon]:justify-center">
            <Avatar className="size-9">
               <AvatarImage src="https://picsum.photos/seed/user/100/100" />
               <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden transition-all duration-200 group-data-[collapsible=icon]:hidden">
                <p className="font-medium truncate">User Name</p>
                <p className="text-xs text-muted-foreground truncate">user@email.com</p>
            </div>
             <Link href="/login" passHref legacyBehavior>
                <Button variant="ghost" size="icon" className="transition-all duration-200 group-data-[collapsible=icon]:hidden">
                  <LogOut />
                </Button>
            </Link>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
