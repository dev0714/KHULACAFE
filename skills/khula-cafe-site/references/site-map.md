# Khula Cafe Site Map

## Core Files

- `app/layout.js` - Global HTML shell, fonts, metadata, navbar, and footer.
- `app/globals.css` - Theme tokens, shared section styles, animation helpers, and mobile rules.
- `app/page.js` - Homepage hero and all major landing sections.
- `app/menu/page.js` - Menu categories, tab switching, and item cards.
- `app/about/page.js` - About page content and page-level presentation.
- `app/gallery/page.js` - Gallery layout and image presentation.
- `app/contact/page.js` - Contact details, form, and CTA content.
- `app/book/page.js` - Booking flow and reservation UI.
- `app/loyalty/page.js` - Loyalty program presentation and reward content.
- `components/Navbar.jsx` - Global top navigation and mobile drawer.
- `components/Footer.jsx` - Global footer and bottom links.
- `hooks/useScrollReveal.js` - Scroll-triggered reveal behavior.
- `lib/mockData.js` - Shared menu, stats, app features, testimonials, and gallery metadata.

## Visual System

- Backgrounds use very dark forest tones.
- Accent colors use green, gold, and warm cream.
- Headings use Playfair Display.
- Body copy uses Poppins.
- Cards and CTAs use rounded corners and soft shadows.
- Motion stays subtle and atmospheric rather than flashy.

## Safe Editing Order

1. Inspect the route file first.
2. Check whether the content belongs in `lib/mockData.js`.
3. Update shared CSS in `app/globals.css` if the pattern should be reusable.
4. Adjust shared components like the navbar or footer last.

## Common Gotchas

- Do not break the mobile drawer overflow lock in `components/Navbar.jsx`.
- Do not remove the `section-wrap` spacing system unless the page is being redesigned.
- Do not add a new font stack unless the user requests a typography change.
- Do not introduce bright or flat color palettes that conflict with the current forest theme.
