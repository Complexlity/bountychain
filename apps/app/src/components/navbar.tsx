"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coins } from "lucide-react";
import { Button } from "./ui/button";
import { CreateBountyDialog } from "@/features/bounties/components/create-bounty-dialog";
import { cn } from "@/lib/utils";
import {type  ReactNode } from "react";

interface NavbarLink {
  href: string;
  name: string;
}

export default function Navbar() {
  const navLinks: NavbarLink[] = [
    { href: "/", name: "home" },
    { href: "/bounties", name: "bounties" },
  ];

  return (
    <>
      <div>
        <header className="flex h-14 items-center justify-between px-4 py-8 lg:px-6">
          <Link className="flex items-center justify-center" href="/">
            <Coins className="h-8 w-8" />
            <span className="ml-2 text-xl md:text-2xl font-bold hidden sm:inline-flex">
              BountyChain
            </span>
          </Link>
          <nav className="flex items-center gap-4 sm:gap-6">
            <div className="hidden md:flex gap-4 sm:gap-6">
              <NavbarLinks links={navLinks} />
            </div>

            <CreateBountyDialog>
              <Button className="bold flex h-fit rounded-none gap-1 px-2 py-2 text-sm">
                <span className="hidden sm:inline">Create</span>
                <span>New Bounty</span>
              </Button>
            </CreateBountyDialog>
            <ConnectButton chainStatus={"icon"} showBalance={false} />
          </nav>
        </header>
      </div>
      <MobileNavbar className="z-50">
        <NavbarLinks links={navLinks} />
      </MobileNavbar>
    </>
  );
}

interface NavbarLinksProps {
  links: NavbarLink[];
}

const NavbarLinks = (props: NavbarLinksProps) => {
  const { links } = props;
  const pathname = usePathname();

  return (
    <>
      {links.map((link, i) => (
        <Link
          key={`nav-${i}-${link.name.toLowerCase()}`}
          className={cn(
            "text-sm sm:text-xl font-medium underline-offset-4 transition-colors",
            pathname === link.href
              ? "text-primary font-semibold underline"
              : "text-muted-foreground hover:text-primary hover:underline"
          )}
          href={link.href}
        >
          {link.name[0].toUpperCase() + link.name.slice(1)}
        </Link>
      ))}
    </>
  );
};

interface MobileNavbarProps {
  children?: ReactNode;
  className?: string;
}

const MobileNavbar = (props: MobileNavbarProps) => {
  const { children, className } = props;

  return (
    <div
      className={cn(
        "fixed  bottom-0 flex w-full h-[60px] justify-center items-center gap-6 md:hidden",
        "bg-pt-purple-600 border-t-2 border-pt-purple-500 bg-white",
        className
      )}
    >
      {children}
    </div>
  );
};
