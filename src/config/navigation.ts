// src/config/navigation.ts
import { ComponentType, SVGProps } from "react";
import {
  HomeIcon,
  BookOpenIcon,
  NewspaperIcon,
  BriefcaseIcon,
  CalendarIcon,
  MegaphoneIcon,
  UserGroupIcon,
  UsersIcon,
  DocumentTextIcon,
  ShareIcon,
  InformationCircleIcon,
  EnvelopeIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";

export type NavItem = {
  name: string;
  href: string;
  external?: boolean;
  icon?: ComponentType<SVGProps<SVGSVGElement>>; // <-- added icon
};

export const mainNavigation: NavItem[] = [
  { name: "Home", href: "/", icon: HomeIcon },
  { name: "Courses", href: "/courses", icon: BookOpenIcon },
  { name: "Blog", href: "/blog", icon: NewspaperIcon },
  { name: "Services", href: "/services", icon: BriefcaseIcon },
  { name: "Events", href: "/events", icon: CalendarIcon },
  { name: "News", href: "/news", icon: MegaphoneIcon },
  { name: "Partners", href: "/partners", icon: UserGroupIcon },
  { name: "Groups", href: "/groups", icon: UsersIcon },
  { name: "Resources", href: "/resources", icon: DocumentTextIcon },
  { name: "Networking", href: "/networking", icon: ShareIcon },
  { name: "About", href: "/about", icon: InformationCircleIcon },
  { name: "Contact", href: "/contact", icon: EnvelopeIcon },
  { name: "Pricing", href: "/pricing", icon: CreditCardIcon },
];

// Optional: secondary navigation for footer or utility links
export const footerNavigation: NavItem[] = [
  { name: "Privacy Policy", href: "/privacy" },
  { name: "Terms of Service", href: "/terms" },
  { name: "Support", href: "/support" },
  { name: "Unsubscribe", href: "/newsletter/unsubscribe" },
];

// Optional: external/social links
export const socialNavigation: NavItem[] = [
  { name: "GitHub", href: "https://github.com/tekpounou", external: true },
  { name: "Twitter", href: "https://twitter.com/tekpounou", external: true },
  { name: "LinkedIn", href: "https://linkedin.com/company/tekpounou", external: true },
];
