// src/config/navigation.ts

export type NavItem = {
  name: string;
  href: string;
  external?: boolean;
};

export const mainNavigation: NavItem[] = [
  { name: "Home", href: "/" },
  { name: "Courses", href: "/courses" },
  { name: "Blog", href: "/blog" },
  { name: "Services", href: "/services" },
  { name: "Events", href: "/events" },
  { name: "News", href: "/news" },
  { name: "Partners", href: "/partners" },
  { name: "Groups", href: "/groups" },
  { name: "Resources", href: "/resources" },
  { name: "Networking", href: "/networking" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
  { name: "Pricing", href: "/pricing" },
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
