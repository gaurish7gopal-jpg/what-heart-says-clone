# What Heart Says — Interactive Digital Cards Clone

A pixel-perfect, interactive digital greeting cards web application inspired by [whatheartsays.com](https://www.whatheartsays.com/).

## 💖 Features

- **Interactive Digital Cards**:
  - 🎂 **Virtual Birthday Bash**: Multi-tier animated birthday cake with flickering candles you blow out.
  - 💍 **The Perfect Proposal**: The unrejectable love card where the "No" button playfully dodges every tap until they say "Yes!".
  - 🙏 **Sorry Card**: Floating starfield with a beating wax-sealed heart envelope that gently unfolds line-by-line.
  - 💞 **Anniversary Special**: Live ticking countdown timer and interactive love meter.
- **3-Step Multi-Step Builder Wizard (`create.html`)**:
  - Step 1: Sticker header badge, recipient name input, quick-switcher chips.
  - Step 2: 3 custom teaser messages + personal note textarea with 500-char counter.
  - Step 3: Glowing iPhone preview, "Cute & Sweet" vs "Romantic One" style toggle, value proposition badges, discount pricing strip (₹199), and instant link generator with Razorpay trust badges.
- **Technical SEO & Metadata**:
  - Full self-canonical tags across all pages.
  - Route-specific Open Graph and Twitter Cards.
  - Schema.org `FAQPage` and `Product` rich snippets.
  - Search engine crawlable semantic headings and intro copy on all experience routes.

## 🚀 Getting Started

Simply open `index.html` in any modern web browser or serve locally:

```bash
# Using Python built-in server
python -m http.server 3000

# Open in browser
http://localhost:3000/index.html
```

## 📁 Project Structure

```
├── index.html              # Main homepage with hero, demo mockup, experiences grid, reviews
├── create.html             # 3-step interactive card builder wizard
├── card-interactive.html   # Standalone interactive card player engine
├── birthday.html           # Crawlable Birthday experience landing page
├── proposal.html           # Crawlable Proposal experience landing page
├── sorry.html              # Crawlable Sorry experience landing page
├── anniversary.html        # Crawlable Anniversary experience landing page
├── faq.html                # FAQ page with Schema.org FAQPage JSON-LD
├── blog.html               # Blog listing with working anchors and valid OG images
├── about.html              # About page with legal entity disclosure
├── privacy.html            # Privacy policy with self-canonical tag
├── terms.html              # Terms of use with 24-hr refund policy
├── styles.css              # Design system tokens, typography, animations, phone mockups
├── app.js                  # Navigation drawer, demo tab switcher, live countdown ticker
├── audit_report.html       # Printable technical SEO and CRO audit report
├── growth_strategy.md      # Product & conversion growth roadmap
└── nextjs_fixes.md         # Production Next.js App Router copy-paste snippets
```

---
Made with care.
