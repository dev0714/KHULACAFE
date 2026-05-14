export const menuCategories = [
  {
    id: 'african',
    name: 'African Cuisine',
    icon: '🍲',
    description: 'Authentic African dishes cooked with tradition and heart. WhatsApp your order and we will deliver to you.',
    items: [
      { id: 1, name: 'Inhloko / Ox-Head', description: 'Slow-cooked traditional ox-head, tender and full of flavour', price: 'Ask us', badge: 'Traditional' },
      { id: 2, name: 'Beef Curry', description: 'Rich beef curry served with Rice or Pap', price: 'Ask us', badge: null },
      { id: 3, name: 'Chicken Curry', description: 'Flavourful chicken curry served with Rice or Pap', price: 'Ask us', badge: null },
      { id: 4, name: 'Umgxabhiso (usu / amathumbu)', description: 'Traditional tripe and offal, slow-cooked the authentic way', price: 'Ask us', badge: null },
      { id: 5, name: 'Bunny Chow — Lamb / Chicken', description: 'Hollowed quarter loaf filled with your choice of Lamb or Chicken curry', price: 'Ask us', badge: 'Fan Fav' },
      { id: 6, name: 'Briyani (Chicken)', description: 'Fragrant South African chicken briyani with aromatic spices', price: 'Ask us', badge: null },
      { id: 7, name: 'Briyani (Mutton)', description: 'Slow-cooked mutton briyani with traditional spices', price: 'Ask us', badge: null },
      { id: 8, name: 'Braai Pack', description: 'Wors, Lamp chop, Chicken, Beef steak, Lamb rib — the full works', price: 'Ask us', badge: 'Big Meal' },
    ],
  },
  {
    id: 'specials',
    name: 'Daily Specials',
    icon: '⭐',
    description: 'Fresh specials every day of the week — great value, great flavour. WhatsApp us to order.',
    items: [
      { id: 9,  name: 'Monday Special',    description: 'Ask us what\'s on the menu this Monday', price: 'R 55', badge: 'Mon' },
      { id: 10, name: 'Tuesday Special',   description: 'Ask us what\'s on the menu this Tuesday', price: 'R 60', badge: 'Tue' },
      { id: 11, name: 'Wednesday Special', description: 'Midweek treat — ask us what we\'re serving', price: 'R 50', badge: 'Wed' },
      { id: 12, name: 'Wednesday Special', description: 'Second Wednesday option available', price: 'R 45', badge: 'Wed' },
      { id: 13, name: 'Thursday Special',  description: 'Ask us what\'s on the menu this Thursday', price: 'R 60', badge: 'Thu' },
      { id: 14, name: 'Thursday Special',  description: 'Second Thursday option available', price: 'R 60', badge: 'Thu' },
      { id: 15, name: 'Friday Special',    description: 'Start the weekend right — ask us what we\'re serving', price: 'R 50', badge: 'Fri' },
      { id: 16, name: 'Everyday Special',  description: 'Our signature everyday plate — available 7 days a week', price: 'R 90', badge: 'Daily' },
    ],
  },
  {
    id: 'sides',
    name: 'Pick Your Side',
    icon: '🥗',
    description: 'Complete your meal with one of our traditional South African sides.',
    items: [
      { id: 17, name: '2 x Ujeqe (Steambread)', description: 'Two soft, freshly steamed traditional bread rolls', price: 'R 18', badge: null },
      { id: 18, name: 'Ushatini (Chutney)',      description: 'Zesty homemade chutney to complement any dish', price: 'R 10', badge: null },
      { id: 19, name: 'Green Salad',             description: 'Fresh garden salad with your choice of dressing', price: 'R 15', badge: null },
      { id: 20, name: 'Chakalaka',               description: 'Spicy South African vegetable relish', price: 'R 10', badge: null },
      { id: 21, name: 'Istambu (Samp & Beans)',  description: 'Traditional slow-cooked samp and beans', price: 'R 20', badge: null },
      { id: 22, name: 'Pap / Phuthu',            description: 'Smooth pap or crumbly phuthu — your choice', price: 'R 15', badge: null },
      { id: 23, name: 'Isigwaqana',              description: 'Ask us about today\'s Isigwaqana preparation', price: 'Ask us', badge: null },
    ],
  },
  {
    id: 'grills',
    name: 'Signature Grills',
    icon: '🔥',
    description: 'Flame-grilled to perfection, served with traditional South African sides.',
    items: [
      { id: 24, name: 'T-Bone Steak',     description: 'Flame-grilled T-bone with Chakalaka and creamy Pap', price: 'R 189', badge: "Chef's Pick" },
      { id: 25, name: 'Quarter Chicken',  description: 'Succulent flame-grilled quarter chicken with seasonal sides', price: 'R 119', badge: null },
      { id: 26, name: 'Khula Mixed Grill',description: 'T-bone, ribs, chicken, and boerewors — a feast for two', price: 'R 349', badge: 'For Two' },
      { id: 27, name: 'Pork Ribs',        description: 'Slow-cooked fall-off-the-bone ribs with smoky BBQ glaze', price: 'R 219', badge: null },
    ],
  },
  {
    id: 'beverages',
    name: 'Artisan Beverages',
    icon: '☕',
    description: 'From rooibos cappuccinos to fresh ginger sparklers — all crafted with love.',
    items: [
      { id: 28, name: 'Rooibos Cappuccino',     description: 'South African rooibos with velvety steamed milk foam', price: 'R 45', badge: 'Signature' },
      { id: 29, name: 'Condensed Milk Latte',   description: 'Rich espresso with sweet condensed milk and steamed milk', price: 'R 49', badge: null },
      { id: 30, name: 'Freezochino',            description: 'Blended iced coffee — dark, creamy, and irresistible', price: 'R 59', badge: 'Popular' },
      { id: 31, name: 'Ginger & Lemon Sparkler',description: 'Fresh ginger, lemon, honey, and sparkling water', price: 'R 39', badge: null },
    ],
  },
  {
    id: 'something-new',
    name: 'Something New',
    icon: '✨',
    description: 'Weekly rotating fusion specials. Be bold, try something different.',
    items: [
      { id: 32, name: 'Bobotie Spring Rolls',  description: 'Traditional bobotie filling in crispy spring roll wrappers', price: 'R 79', badge: 'This Week' },
      { id: 33, name: 'Bunny Chow Sliders',    description: 'Mini bunny chows — three flavours on a sharing board', price: 'R 89', badge: 'This Week' },
      { id: 34, name: 'Chakalaka Flatbread',   description: 'Wood-fired flatbread with chakalaka salsa and melted cheese', price: 'R 69', badge: 'This Week' },
      { id: 35, name: 'Malva Pudding Tartlet', description: 'Individual malva pudding with warm vanilla custard', price: 'R 55', badge: 'Dessert' },
    ],
  },
]

export const stats = [
  { value: 200, suffix: '+', label: 'Happy Guests Daily' },
  { value: 50, suffix: '+', label: 'Menu Items' },
  { value: 6, suffix: '', label: 'Dining Vibes' },
  { value: 4.9, suffix: '★', label: 'Average Rating' },
]

export const appFeatures = [
  {
    icon: '📅',
    title: 'Smart Booking',
    description: 'Choose your vibe — Romantic, Birthday, Team Lunch, or Proposal. Add balloon arches and centerpieces right from the app.',
  },
  {
    icon: '💛',
    title: 'Khula Bucks',
    description: 'Every R100 spent earns 10 Khula Bucks. Redeem them on your next visit. Our way of saying thank you.',
  },
  {
    icon: '💬',
    title: 'WhatsApp AI — Apollo',
    description: 'Order in isiZulu, Afrikaans, Sesotho, or English. "I want a Mutton Bunny for collection at 1 PM" — done instantly.',
  },
  {
    icon: '🚚',
    title: 'Geofenced Delivery',
    description: 'Free delivery within 5km. Live map tracking shows exactly where your driver is.',
  },
  {
    icon: '⚡',
    title: 'Loadshedding Live',
    description: 'Real-time status: "We are open and cooking on gas/generators!" — because we\'re South African and we plan ahead.',
  },
  {
    icon: '🎁',
    title: 'Digital Gift Cards',
    description: 'Buy a "Romantic Dinner Voucher" for a friend directly in the app. The perfect gift for any occasion.',
  },
]

export const occasions = [
  { id: 'romantic', label: 'Romantic', emoji: '💑', description: 'Intimate table for two, candles included' },
  { id: 'birthday', label: 'Birthday', emoji: '🎂', description: "We'll make them feel extra special" },
  { id: 'team_lunch', label: 'Team Lunch', emoji: '💼', description: 'Great ideas start over great food' },
  { id: 'proposal', label: 'Proposal', emoji: '💍', description: "We'll help you create the perfect moment" },
]

export const addOns = [
  { id: 'balloon_arch', label: 'Balloon Arch', price: 250, icon: '🎈' },
  { id: 'centerpiece', label: 'Custom Centerpiece', price: 150, icon: '💐' },
  { id: 'special_song', label: 'Special Song Request', price: 0, icon: '🎵' },
  { id: 'gift_card', label: 'Gift Card (R100)', price: 100, icon: '🎁' },
]

export const testimonials = [
  {
    id: 1,
    name: 'Sipho M.',
    rating: 5,
    comment: 'The Khula King burger is absolutely unreal. That biltong and avocado combo? Pure genius. Will definitely be back!',
    occasion: 'Birthday Lunch',
  },
  {
    id: 2,
    name: 'Ayesha K.',
    rating: 5,
    comment: 'I proposed here and the team were absolutely amazing. Everything was perfect from the song to the centerpiece. She said yes!',
    occasion: 'Proposal Dinner',
  },
  {
    id: 3,
    name: 'Thandi N.',
    rating: 5,
    comment: 'The ambience is incredible — that forest mural wall is something else. Rooibos Cappuccino is my new obsession.',
    occasion: 'Casual Dining',
  },
]

export const galleryImages = [
  { id: 1, src: '/images/gallery/gallery-1.jpg', alt: 'Khula Cafe dining area with iconic forest mural wall', caption: 'Forest Mural Dining', color: '#1a3a22' },
  { id: 2, src: '/images/gallery/gallery-2.jpg', alt: 'Khula Cafe counter with warm pendant lights and pastry display', caption: 'The Counter', color: '#2d1a0a' },
  { id: 3, src: '/images/gallery/gallery-3.jpg', alt: 'Khula Cafe lounge with grey velvet sofas, botanical pillows and wood slat wall', caption: 'Lounge Vibes', color: '#1a2e1a' },
  { id: 4, src: '/images/gallery/gallery-4.jpg', alt: 'Khula Cafe lounge area with neon green LED accents and kiosk', caption: 'Neon Lounge', color: '#0d2818' },
  { id: 5, src: '/images/gallery/gallery-5.jpg', alt: 'Khula Cafe velvet sofas with botanical cushions and marble coffee table', caption: 'The Sofas', color: '#1a2e1a' },
  { id: 6, src: '/images/gallery/gallery-6.jpg', alt: 'Khula Cafe bakery counter with brownies, cookies and glassware shelving', caption: 'Pastry & Bakes', color: '#2e1a0a' },
]
