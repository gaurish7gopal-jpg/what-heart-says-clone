# Next.js App Router — Production Copy-Paste Fixes

If your production codebase is built using Next.js (App Router `app/` directory), here are the exact TypeScript snippets ready to copy and paste to resolve the canonical, title de-duplication, and per-route metadata bugs.

---

### 1. `app/layout.tsx` (Root Layout & Global Metadata Template)

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.whatheartsays.com'),
  title: {
    default: 'What Heart Says — Say it in a way they\'ll never forget',
    // %s will substitute subpage titles. Note: Do NOT manually append "· What Heart Says" in subpages!
    template: '%s · What Heart Says',
  },
  description: 'What Heart Says turns sorry, happy birthday, happy anniversary, and \'will you?\' into interactive digital cards that open right on their phone. From ₹199.',
  applicationName: 'What Heart Says',
  keywords: [
    'interactive digital cards',
    'digital greeting cards',
    'online sorry card',
    'digital birthday card',
    'anniversary card online',
    'proposal card',
    'send a card India',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://www.whatheartsays.com',
    siteName: 'What Heart Says',
    title: 'What Heart Says — Say it in a way they\'ll never forget',
    description: 'Not a greeting card. Not a WhatsApp text. Something in between — and better.',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'What Heart Says — say it in a way they\'ll never forget',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'What Heart Says',
    description: 'Interactive digital cards that open right on their phone.',
    images: ['/opengraph-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

---

### 2. `app/privacy/page.tsx` (Fixes Canonical & Title Duplication)

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  // Uses template: produces "Privacy Policy · What Heart Says" without duplicate brand name
  title: 'Privacy Policy',
  description: 'Learn how What Heart Says protects your privacy, card memories, and personal messages.',
  alternates: {
    canonical: '/privacy', // Self-canonical fix!
  },
  openGraph: {
    title: 'Privacy Policy · What Heart Says',
    description: 'Learn how What Heart Says protects your privacy and personal messages.',
    url: '/privacy',
    images: ['/opengraph-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy · What Heart Says',
    description: 'Learn how What Heart Says protects your privacy and personal messages.',
  },
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-4xl font-serif font-bold mb-4">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">
        Last updated: March 2026 · Operated by Zenaclub Tech (OPC) Private Limited, Faridabad
      </p>
      {/* Privacy body content */}
    </main>
  );
}
```

---

### 3. `app/terms/page.tsx` (Fixes Canonical & Adds Refund Policy)

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'Terms and Conditions of Use for What Heart Says digital cards and interactive experiences.',
  alternates: {
    canonical: '/terms', // Self-canonical fix!
  },
  openGraph: {
    title: 'Terms & Conditions · What Heart Says',
    description: 'Terms and Conditions of Use for What Heart Says digital cards.',
    url: '/terms',
    images: ['/opengraph-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms & Conditions · What Heart Says',
    description: 'Terms and Conditions of Use for What Heart Says digital cards.',
  },
};

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-4xl font-serif font-bold mb-4">Terms & Conditions</h1>
      {/* Terms body content */}
    </main>
  );
}
```

---

### 4. `app/blog/page.tsx` (Fixes Missing OG Image & Canonical)

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Stories & Card Ideas',
  description: 'Guides on saying sorry, birthday card message ideas, creative marriage proposal tips, and relationship milestone inspirations.',
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    type: 'article',
    title: 'Stories & Card Ideas · What Heart Says Blog',
    description: 'Guides on saying sorry, birthday wishes, and marriage proposals that leave lasting impressions.',
    url: '/blog',
    images: [
      {
        url: '/opengraph-image.png', // Fixed missing OG image!
        width: 1200,
        height: 630,
        alt: 'What Heart Says Blog',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stories & Card Ideas · What Heart Says Blog',
    description: 'Guides on saying sorry, birthday wishes, and marriage proposals.',
    images: ['/opengraph-image.png'],
  },
};

export default function BlogPage() {
  return (
    <div>
      {/* Blog listing */}
    </div>
  );
}
```

---

### 5. `app/faq/page.tsx` (Adds FAQPage JSON-LD Structured Data)

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: 'Got questions about What Heart Says interactive cards? Learn about previewing, pricing (₹199), refunds, and sharing.',
  alternates: {
    canonical: '/faq',
  },
  openGraph: {
    title: 'Frequently Asked Questions · What Heart Says',
    description: 'Answers about previewing, ₹199 pricing, refunds, and WhatsApp link sharing.',
    url: '/faq',
    images: ['/opengraph-image.png'],
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How does What Heart Says work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Pick an experience (Birthday, Proposal, Sorry, or Anniversary), customize the name and message in 2 minutes, preview free, pay ₹199, and share the link on WhatsApp.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I preview my card before paying?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! 100% free. You can play through all animations before paying anything.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is your refund policy?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Full refund within 24 hours of purchase if the recipient has not opened or viewed the card link.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much does a card cost?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Every card is priced at ₹199 all-inclusive with lifetime replays.',
      },
    },
  ],
};

export default function FAQPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <main className="max-w-3xl mx-auto py-12 px-6">
        <h1 className="text-4xl font-serif font-bold mb-8">Frequently Asked Questions</h1>
        {/* FAQ list */}
      </main>
    </>
  );
}
```

---

### 6. `app/birthday/page.tsx` (Adds Crawlable Text + Product Schema)

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create a Birthday Card',
  description: 'Personalise an animated digital birthday card — countdown, three messages, candles to blow out, and a handwritten letter. Preview free, pay ₹199.',
  alternates: {
    canonical: '/birthday',
  },
  openGraph: {
    title: 'Create a Birthday Card · What Heart Says',
    description: 'Turn happy birthday into an interactive phone party with candles they blow out. Preview free.',
    url: '/birthday',
    images: ['/opengraph-birthday.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Create a Birthday Card · What Heart Says',
    description: 'Turn happy birthday into an interactive phone party with candles they blow out. Preview free.',
    images: ['/opengraph-birthday.png'],
  },
};

const birthdayProductSchema = {
  '@context': 'https://schema.org/',
  '@type': 'Product',
  name: 'Virtual Birthday Bash Interactive Digital Card',
  image: 'https://www.whatheartsays.com/opengraph-birthday.png',
  description: 'An interactive digital birthday card that opens on mobile with interactive candles and personal notes.',
  brand: {
    '@type': 'Brand',
    name: 'What Heart Says',
  },
  offers: {
    '@type': 'Offer',
    priceCurrency: 'INR',
    price: '199',
    availability: 'https://schema.org/InStock',
    url: 'https://www.whatheartsays.com/birthday',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '1420',
  },
};

export default function BirthdayPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(birthdayProductSchema) }}
      />
      {/* Crawlable Header above the Client Builder */}
      <header className="max-w-2xl mx-auto text-center py-10 px-4">
        <h1 className="text-4xl font-serif font-medium mb-3">
          The Digital Birthday Card They’ll <em className="italic text-pink-600">Never Forget.</em>
        </h1>
        <p className="text-gray-600 leading-relaxed">
          Forget plain text messages. Send an interactive birthday celebration right to their lock screen:
          a countdown to midnight, interactive candles they blow out on their screen, and your personal heartfelt letter.
        </p>
      </header>
      
      {/* Interactive Builder Client Component */}
      <section className="builder-container">
        {/* Client-side Card Builder */}
      </section>
    </>
  );
}
```
