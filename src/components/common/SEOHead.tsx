// src/components/common/SEOHead.tsx
import { Helmet } from "react-helmet-async";

// -------- Structured Data Generators --------
export const structuredDataGenerators = {
  organization: (name: string, url: string, logo: string) => ({
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    logo,
  }),
  course: (name: string, description: string, provider: string) => ({
    "@context": "https://schema.org",
    "@type": "Course",
    name,
    description,
    provider: {
      "@type": "Organization",
      name: provider,
    },
  }),
  blogPost: (title: string, description: string, author: string) => ({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    author: {
      "@type": "Person",
      name: author,
    },
  }),
  service: (name: string, description: string, provider: string) => ({
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    provider: {
      "@type": "Organization",
      name: provider,
    },
  }),
  faq: (faqs: { question: string; answer: string }[]) => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }),
};

// -------- Default SEO Configs --------
export const defaultSEOConfigs = {
  home: {
    title: "Tek Pou Nou - Empowering Haitian Entrepreneurs",
    description:
      "Tek Pou Nou se yon ekosistèm teknoloji k ap sipòte antreprenè ak elèv ayisyen.",
    keywords: ["Tek Pou Nou", "Haiti", "entrepreneurship", "education"],
    structuredData: structuredDataGenerators.organization(
      "Tek Pou Nou",
      "https://tekpounou.com",
      "/logo.png"
    ),
    canonical: "https://tekpounou.com",
  },
  courses: {
    title: "Kou yo - Tek Pou Nou",
    description: "Dekouvri kou sou antreprenarya, teknoloji ak plis ankò.",
    keywords: ["courses", "education", "Haiti"],
    structuredData: structuredDataGenerators.course(
      "Kou yo",
      "Aprann ak kou sou teknoloji, biznis, ak plis ankò.",
      "Tek Pou Nou"
    ),
    canonical: "https://tekpounou.com/courses",
  },
  blog: {
    title: "Blog - Tek Pou Nou",
    description: "Lèkti atik sou antreprenarya, teknoloji ak inovasyon.",
    keywords: ["blog", "Haiti", "entrepreneurship", "technology"],
    structuredData: structuredDataGenerators.blogPost(
      "Blog",
      "Eksplore atik sou teknoloji ak antreprenarya.",
      "Tek Pou Nou"
    ),
    canonical: "https://tekpounou.com/blog",
  },
  services: {
    title: "Sèvis - Tek Pou Nou",
    description: "Sèvis pou antreprenè ak biznis yo devlope ak teknoloji.",
    keywords: ["services", "technology", "Haiti"],
    structuredData: structuredDataGenerators.service(
      "Sèvis",
      "Nou ofri sèvis dijital ak konsiltasyon pou antreprenè.",
      "Tek Pou Nou"
    ),
    canonical: "https://tekpounou.com/services",
  },
  about: {
    title: "Sou nou - Tek Pou Nou",
    description: "Aprann plis sou misyon ak vizyon Tek Pou Nou.",
    keywords: ["about", "team", "Haiti"],
    structuredData: structuredDataGenerators.organization(
      "Tek Pou Nou",
      "https://tekpounou.com",
      "/logo.png"
    ),
    canonical: "https://tekpounou.com/about",
  },
  pricing: {
    title: "Plan & Pri - Tek Pou Nou",
    description:
      "Chwazi plan ki mache pou ou: gratis, pwofesyonèl oswa antrepriz.",
    keywords: ["pricing", "plans", "abonman", "pri"],
    structuredData: structuredDataGenerators.faq([
      {
        question: "Ki plan gratis la genyen?",
        answer: "Plan gratis la ofri baz kou ak resous gratis.",
      },
      {
        question: "Ki plan pwofesyonèl la genyen?",
        answer:
          "Plan pwofesyonèl la ofri plis kou, sètifika, ak sipò pèsonalize.",
      },
      {
        question: "Èske gen plan pou gwo antrepriz?",
        answer:
          "Wi, nou ofri plan antrepriz ak sèvis dedye pou gwo òganizasyon.",
      },
    ]),
    canonical: "https://tekpounou.com/pricing",
  },
  contact: {
    title: "Kontakte nou - Tek Pou Nou",
    description:
      "Antre an kontak ak ekip Tek Pou Nou pou kesyon, patenarya oswa sipò.",
    keywords: ["contact", "support", "Haiti"],
    structuredData: structuredDataGenerators.faq([
      {
        question: "Kijan pou m kontakte sipò Tek Pou Nou?",
        answer: "Ou ka ekri nou sou contact@tekpounou.com oswa itilize fòm kontak.",
      },
      {
        question: "Ki lè ekip la disponib?",
        answer: "Ekip la disponib Lendi rive Vandredi, 9am - 5pm.",
      },
    ]),
    canonical: "https://tekpounou.com/contact",
  },
  events: {
    title: "Evènman - Tek Pou Nou",
    description:
      "Patisipe nan evènman, atelye ak konferans pou antreprenè ak etidyan ayisyen.",
    keywords: ["events", "workshops", "Haiti", "conference"],
    canonical: "https://tekpounou.com/events",
  },
  news: {
    title: "Nouvèl - Tek Pou Nou",
    description: "Rete enfòme sou dènye nouvèl teknoloji ak antreprenarya ann Ayiti.",
    keywords: ["news", "Haiti", "updates", "entrepreneurship"],
    canonical: "https://tekpounou.com/news",
  },
};

// -------- SEOHead Component --------
type SEOHeadProps = {
  title: string;
  description: string;
  keywords?: string[];
  structuredData?: Record<string, any> | Record<string, any>[];
  canonical?: string;
  locale?: "en" | "fr" | "ht";
  image?: string;
};

export function SEOHead({
  title,
  description,
  keywords,
  structuredData,
  canonical,
  locale = "ht",
  image = "https://tekpounou.com/og-image.png",
}: SEOHeadProps) {
  const siteName = "Tek Pou Nou";

  const alternateLinks = [
    { lang: "en", href: `https://tekpounou.com/en` },
    { lang: "fr", href: `https://tekpounou.com/fr` },
    { lang: "ht", href: `https://tekpounou.com/ht` },
  ];

  return (
    <Helmet htmlAttributes={{ lang: locale }}>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords.join(", ")} />}
      <meta name="author" content={siteName} />
      <meta name="robots" content="index, follow" />

      {/* Canonical */}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Language Alternates */}
      {alternateLinks.map((alt) => (
        <link
          key={alt.lang}
          rel="alternate"
          hrefLang={alt.lang}
          href={alt.href}
        />
      ))}
      <link rel="alternate" hrefLang="x-default" href="https://tekpounou.com" />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      {canonical && <meta property="og:url" content={canonical} />}
      <meta property="og:site_name" content={siteName} />
      {image && <meta property="og:image" content={image} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}

      {/* Structured Data */}
      {structuredData &&
        (Array.isArray(structuredData) ? (
          structuredData.map((data, idx) => (
            <script key={idx} type="application/ld+json">
              {JSON.stringify(data)}
            </script>
          ))
        ) : (
          <script type="application/ld+json">
            {JSON.stringify(structuredData)}
          </script>
        ))}
    </Helmet>
  );
}
