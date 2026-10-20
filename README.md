# Karakoram Naturals — Shopify theme

A custom Shopify Online Store 2.0 theme for **Karakoram Naturals**, built for two hero products: **bilona desi ghee** and **Himalayan shilajit**. The animation work follows the techniques used by Awwwards-winning sites: GSAP ScrollTrigger scenes, SplitText reveals, Lenis smooth scrolling, magnetic buttons and a custom cursor.

## The signature scenes

| Scene | Where | What happens |
| --- | --- | --- |
| **Golden Pour** | Homepage hero | Scrolling lifts the jar lid. A brass ladle tips in and pours a golden stream. The jar fills up with grainy (danedar) ghee while a "Poured %" meter counts. Callouts draw in, the lid comes back, the label wraps on, and a buy card slides in. |
| **From the Peaks** | Homepage, shilajit | You descend through Himalayan ranges at night as an altitude counter ticks from 5,800 m down to 4,200 m. The camera zooms into a glowing crack, resin seeps and forms a drop, and the drop falls into the jar. Then the buy card appears. |
| **Bilona process** | Homepage, ghee product page, Our Story | A pinned horizontal timeline with six illustrated steps (cow, overnight curd, hand-churning, makhan, wood fire, jar), each with its own small looping animation, plus a progress rail. |
| **Purity reveal** | Homepage, Lab Reports | Lab stats count up. Certificate cards drop in and get stamped with wax seals. Tapping a card opens the certificate (image or PDF) in a lightbox. |

All jars and illustrations are drawn in SVG, so they animate without any photography. Your real product photos can be added at any time and show up as thumbnails on the product page.

Visitors whose device asks for reduced motion get a calm, static version of every scene. If JavaScript doesn't run, the static layout still shows everything.

## Store features

- **Product page:** size pills with per-size prices, quantity, AJAX add-to-cart, *Buy it now*, **Order on WhatsApp** (pre-filled message with the product, size and quantity), a delivery date estimate, trust badges, a lab report link, collapsible tabs and a sticky add-to-cart bar.
- **Shilajit product page:** a dark theme, a "4 ways to test pure shilajit" section and a lab results table.
- **Cart drawer:** a free-delivery progress bar, quantity steppers, an upsell for the other product, a cash-on-delivery note, and checkout.
- **Reviews:** works with **Judge.me** (free plan). Star ratings read Shopify's standard review metafields. The review sections accept Judge.me app blocks, and the **Reviews** page has a "write a review" flow for each product.
- **Pages:** Lab Reports & Certificates, Our Story, FAQ, Contact (form + WhatsApp), Track Order (courier lookup + WhatsApp fallback) and Reviews.
- **Other:** floating WhatsApp button, rotating announcement bar, newsletter signup, product structured data for SEO, and classic customer account pages.

## Going live — checklist

### 1. Upload the theme
- **Option A:** In Shopify admin, go to **Online Store → Themes → Add theme → Connect from GitHub**. Pick this repo and branch. The `dev/` folder is ignored by Shopify.
- **Option B:** Zip the theme folders (`assets config layout locales sections snippets templates`) and choose **Add theme → Upload zip file**.

### 2. Create the products
Use these handles so the homepage connects to them automatically. You can also pick products in the theme editor later.

| Product | Handle | Variants | Template |
| --- | --- | --- | --- |
| Bilona Desi Ghee | `desi-ghee` | Size: 500 g / 1 kg / 2 kg | `product` (default) |
| Himalayan Shilajit | `shilajit` | Size: 10 g / 20 g / 30 g | **`product.shilajit`** |
| The Karakoram Ritual Bundle | `ghee-shilajit-bundle` | none | `product` |

To get the dark page, assign the **shilajit** template on the product's admin page under **Theme template**. A product whose handle, type, title or tags mention "shilajit" automatically gets the dark jar illustration.

### 3. Create the pages
In **Online Store → Pages**, create each page and choose its template:

| Page title | Handle | Template |
| --- | --- | --- |
| Lab reports & certificates | `lab-reports` | `page.lab-reports` |
| Our story | `our-story` | `page.our-story` |
| FAQ | `faq` | `page.faq` |
| Contact | `contact` | `page.contact` |
| Track your order | `track-order` | `page.track-order` |
| Reviews | `reviews` | `page.reviews` |

### 4. Navigation
Create a **main-menu** with Shop, Lab Reports, Our Story, Reviews and FAQ. Until you do, the header shows sensible default links.

### 5. Payments, cash on delivery and shipping
- **Settings → Payments → Manual payment methods → Cash on Delivery (COD)**. Add **Bank Deposit** too if you take transfers.
- For card, JazzCash or Easypaisa, add a Pakistan-supported gateway such as Safepay or PayFast.
- **Settings → Shipping:** create a free-delivery rate for orders above Rs. 5,000. The theme setting **Cart & delivery → Free delivery threshold** should match it.

### 6. Reviews (Judge.me)
1. Install **Judge.me Product Reviews** from the Shopify App Store.
2. In the theme editor, add the Judge.me **Review Widget** app block to the **Product reviews** section on both product templates.
3. Optionally add the **Reviews Carousel** to the homepage **Reviews** section.
4. Turn on review-request emails in Judge.me.

Star ratings across the site fill in automatically from Judge.me's metafields.

### 7. Theme settings (Customize → Theme settings)
WhatsApp number, phone, email, address, logo (optional, a wordmark is used by default), colours, motion toggles, the cart upsell product and social links.

## ⚠️ Replace the placeholders before launch
These were written as **realistic placeholders**. Please verify or replace each one:

- **Certificates:** upload real PFA / lab / Halal certificates (image or PDF) in the *Purity & certificates* blocks. Remove any you don't hold.
- **Lab results tables:** results ship as "—". Enter the values from your actual lab report, and tick **Passed** only for real passes.
- **Stats:** 100% pure, 0 additives, ~30 L milk per jar, 4,200 m altitude. Edit them to match your own facts.
- **Claims and copy:** "grass-fed", the bilona steps and timings, shilajit sourcing and the usage instructions. Adjust these to your real process. Keep health wording modest.
- **Courier tracking URLs** on the Track Order page. Test each with a real tracking number and fix or remove any that don't work.
- **Story text** on the Our Story page.
- **Contact details** and the WhatsApp number (theme settings).
- **Reviews:** only add testimonials from real customers. The sample reviews exist **only in the local preview**, not in the theme.

## Local preview & checks (optional)

```bash
cd dev
npm install
npm run preview   # renders every template with mock data → dev/preview/dist/
npm run serve     # http://localhost:4173
npm run check     # Shopify Theme Check
```

The preview renderer (`dev/preview/`) runs the real Liquid templates through LiquidJS with mock products and a fake AJAX cart. It's for design review only. Use `shopify theme dev` against a development store for the real thing.

## Structure

```
assets/      theme.css · theme.js (cart, variants, UI) · motion.js (all animation)
             gsap / ScrollTrigger / SplitText / lenis (bundled, no CDN)
layout/      theme.liquid · password.liquid
sections/    hero-golden-pour · shilajit-peaks · bilona-process · purity-reveal · …
snippets/    jar-ghee · jar-shilajit · bilona-art · wax-seal · product-card · …
templates/   JSON templates for every page type, incl. product.shilajit and page.*
dev/         preview renderer + theme check (not uploaded to Shopify)
```

GSAP (including SplitText) is free for commercial use under the GSAP Standard License. Lenis is MIT-licensed.
