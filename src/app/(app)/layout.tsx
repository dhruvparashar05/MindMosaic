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
  Settings,
  BarChart3,
  CheckSquare,
  Activity,
  Phone,
  AlertCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  { href: '/mood-tracker', label: 'Mood Tracker', icon: Smile },
  { href: '/journal', label: 'Journal', icon: Notebook },
  { href: '/chatbot', label: 'AI Coach', icon: Bot },
  { href: '/meditation', label: 'Meditation', icon: Heart },
  { href: '/habits', label: 'Habits', icon: CheckSquare },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/resources', label: 'Resources', icon: BookOpen },
  { href: '/appointments', label: 'Appointments', icon: Calendar },
  { href: '/settings', label: 'Settings', icon: Settings },
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
            username: user.displayName || user.email || 'Anonymous',
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
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <SidebarMenuItem key={link.href}>
                <Link href={link.href}>
                  <SidebarMenuButton
                    isActive={isActive}
                    tooltip={link.label}
                    className={
                      isActive
                        ? 'bg-gradient-to-r from-primary/10 to-secondary/10 text-primary border-l-4 border-primary pl-2 font-semibold transition-all duration-200'
                        : 'hover:bg-sidebar-accent/50 transition-all duration-200'
                    }
                  >
                    <link.icon className={isActive ? 'text-primary' : 'text-muted-foreground'} />
                    <span>{link.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
        <SidebarFooter className="p-4 flex flex-col gap-3">
          {/* Crisis support trigger */}
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="destructive" 
                size="sm" 
                className="w-full rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 hover:text-rose-600 border border-rose-500/20 flex items-center gap-2 font-bold justify-center"
              >
                <Phone className="h-4 w-4 animate-pulse" />
                <span className="group-data-[collapsible=icon]:hidden">Crisis Helpline</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl border border-rose-500/25 bg-zinc-950 text-foreground max-w-md">
              <DialogHeader>
                <DialogTitle className="text-rose-500 flex items-center gap-2 font-bold">
                  <AlertCircle className="h-5 w-5 animate-bounce" /> Emergency Crisis Helplines
                </DialogTitle>
                <DialogDescription className="text-muted-foreground text-xs leading-relaxed mt-1">
                  If you are experiencing severe distress or thoughts of hurting yourself, please reach out immediately. You do not have to go through this alone.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3.5 my-4">
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-1">
                  <p className="text-xs font-bold text-rose-200">United States Crisis Care</p>
                  <p className="text-xs text-muted-foreground">📞 Call or Text: <strong className="text-foreground">988</strong> (Available 24/7, free, confidential)</p>
                  <p className="text-[10px] text-muted-foreground">Crisis Text Line: Text <strong className="text-foreground">HOME</strong> to <strong className="text-foreground">741741</strong></p>
                </div>

                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-1">
                  <p className="text-xs font-bold text-rose-200">United Kingdom Support</p>
                  <p className="text-xs text-muted-foreground">📞 Call Samaritans: <strong className="text-foreground">111</strong> or <strong className="text-foreground">116 123</strong></p>
                </div>

                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-1">
                  <p className="text-xs font-bold text-rose-200">Canada Suicide Prevention Service</p>
                  <p className="text-xs text-muted-foreground">📞 Call or Text: <strong className="text-foreground">988</strong></p>
                </div>

                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-1">
                  <p className="text-xs font-bold text-rose-200">India Helpline (AASRA)</p>
                  <p className="text-xs text-muted-foreground">📞 Call: <strong className="text-foreground">91-9820466726</strong></p>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <div className="flex items-center gap-3 transition-all duration-200 group-data-[collapsible=icon]:justify-center">
            <Avatar className="size-9">
              <AvatarFallback><User /></AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden transition-all duration-200 group-data-[collapsible=icon]:hidden">
              <p className="font-medium truncate">
                {user
                  ? user.isAnonymous
                    ? 'Anonymous User'
                    : user.displayName || user.email
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
