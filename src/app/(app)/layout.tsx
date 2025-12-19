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
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useUser, useAuth, useFirestore } from '@/firebase';
import {
  initiateAnonymousSignIn,
  initiateEmailSignOut,
} from '@/firebase/non-blocking-login';
import { useEffect } from 'react';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

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
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();

  useEffect(() => {
    if (!isUserLoading && !user && auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [isUserLoading, user, auth]);

  useEffect(() => {
    if (user && firestore) {
      const userRef = doc(firestore, 'users', user.uid);
      getDoc(userRef).then((docSnap) => {
        if (!docSnap.exists()) {
          // The user document doesn't exist, so create it.
          const newUserProfile = {
            id: user.uid,
            email: user.email || '', // Email might be null for anonymous users
            username: user.email || 'Anonymous',
            dateJoined: serverTimestamp(),
          };
          // Use setDoc with the user's UID to create the document.
          setDoc(userRef, newUserProfile);
        }
      });
    }
  }, [user, firestore]);

  const handleSignOut = () => {
    if (auth) {
      initiateEmailSignOut(auth);
    }
  };

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
              <Link href={link.href}>
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
              <p className="font-medium truncate">
                {user
                  ? user.isAnonymous
                    ? 'Anonymous User'
                    : user.email
                  : 'Not logged in'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.uid}
              </p>
            </div>
            {user && !user.isAnonymous ? (
              <Button
                variant="ghost"
                size="icon"
                className="transition-all duration-200 group-data-[collapsible=icon]:hidden"
                onClick={handleSignOut}
              >
                <LogOut />
              </Button>
            ) : (
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="icon"
                  className="transition-all duration-200 group-data-[collapsible=icon]:hidden"
                >
                  <LogOut />
                </Button>
              </Link>
            )}
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
