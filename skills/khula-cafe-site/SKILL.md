---
name: khula-cafe-site-editing
description: This skill should be used when editing the Khula Cafe Next.js website, including page content, navigation, styling, layout, menu data, gallery content, booking flows, and responsive behavior. It preserves the site's dark forest-and-gold visual system, typography, and section patterns.
---

# Khula Cafe Site Editing

Use this skill when making any future edits to the Khula Cafe website.

## Working Rules

1. Start by reading `references/site-map.md` and the specific route or component being changed.
2. Preserve the existing brand system unless the user explicitly asks for a redesign:
   - deep forest backgrounds
   - green and gold accents
   - Playfair Display for headings
   - Poppins for body text
   - rounded pill CTAs
   - subtle glow, shimmer, and parallax motion
3. Prefer updating `lib/mockData.js` for menu items, testimonials, stats, gallery captions, and feature content before hardcoding new text in page components.
4. Reuse shared helpers and section patterns already present in the app:
   - `useScrollReveal`
   - `section-wrap`
   - `section-label`
   - `page-hero`
   - `card-lift`
   - `gallery-grid`
   - `cta-row`
5. Treat `components/Navbar.jsx` and `components/Footer.jsx` as global layout surfaces. Update them carefully because they affect every page.
6. Treat `app/layout.js` as the place for site-wide metadata, fonts, and document-level structure.
7. Keep responsive behavior aligned with the existing mobile rules in `app/globals.css`, especially for sticky tabs, CTA stacking, gallery grids, and overflow handling.
8. Prefer targeted edits over large refactors. If a visual change is needed, adjust the shared CSS helper first, then refine the page.
9. Keep copy consistent with the restaurant’s tone: warm, premium, South African, and welcoming.
10. After making code changes, run lint and build checks if the edit touches application code.
11. On the homepage hero, hide or simplify decorative line systems on small screens before they crowd the logo, title, or CTAs.
12. For Paystack checkout, use the proxy variables `PAYSTACK_FN_BASE`, `PAYSTACK_CREDENTIAL_ID`, `PAYSTACK_CREDENTIAL_KEY`, and `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` instead of a direct secret key flow.

## Edit Order

1. Inspect the relevant page, component, or data source.
2. Check whether the change belongs in shared styling, reusable data, or a single route file.
3. Make the smallest change that preserves the current system.
4. Verify the result against the site’s existing visual language and mobile behavior.

## When To Use

Use this skill for homepage updates, menu changes, gallery edits, booking flow tweaks, navigation changes, mobile fixes, new content sections, SEO updates, and any future polish work on the Khula Cafe site.
