/* ═══ DATA — Loader async depuis data.json ═══ */
const GITHUB_RAW = 'https://raw.githubusercontent.com/saadseb/saadseb.github.io/main'; // used for absolute URLs if needed

// ── State global ──────────────────────────────────────────────────────────
let PRODUCTS          = [];
let BLOG_POSTS        = [];
let AFFILIATE_PRODUCTS = [];
let BACKGROUNDS       = {};

// Ads config
const ADS_DEFAULTS = {
  home_top: true, between_products: true, footer: true,
  blog_top: true, blog_bottom: true,
  adsenseId: 'ca-pub-7479282629047694', strategy: 'blog_heavy'
};
let ADS_CONFIG = Object.assign({}, ADS_DEFAULTS, JSON.parse(localStorage.getItem('fc_ads') || '{}'));
if (!ADS_CONFIG.adsenseId) ADS_CONFIG.adsenseId = ADS_DEFAULTS.adsenseId;

// Auth
const ADMIN_PWD_KEY   = 'fc_admin_pwd_hash';
const DEFAULT_PWD_HASH = '10f65a7fbba9133825ec7517cedde4593f11a8e5262b2aba3ab5cd9947f9cbdb';
let adminPwdHash = localStorage.getItem(ADMIN_PWD_KEY) || DEFAULT_PWD_HASH;
async function hashPwd(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

// Orders
const STEPS_ALL  = ['En attente','Mesures','Coupe','Couture','Finition','Prêt'];
const STATUS_CLS = {'En attente':'sb-wait','Mesures':'sb-mesures','Coupe':'sb-coupe',
                    'Couture':'sb-couture','Finition':'sb-finition','Prêt':'sb-pret'};
let ORDERS = JSON.parse(localStorage.getItem('fc_orders') || 'null') || [
  { id:'FC-001', name:'Fatima Zahra', desc:'Caftan vert brodé, taille M',
    history:[
      {step:'Mesures', photo:'images/backgrounds/hero-2.jpg'},
      {step:'Coupe',   photo:'https://images.unsplash.com/photo-1521334884684-d80222895322?w=400'},
      {step:'Couture', photo:'https://images.unsplash.com/photo-1520975916090-3105956dac38?w=400'}
    ]},
  { id:'FC-002', name:'Khadija Benali', desc:'Takchita bordeaux, taille S',
    history:[{step:'Mesures', photo:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'}]}
];

// Cart / Wishlist
let cart     = JSON.parse(localStorage.getItem('fc_cart') || '[]');
let wishlist = JSON.parse(localStorage.getItem('fc_wish') || '[]');
let currentFilter   = 'all';
let selectedProduct = null, selectedSize = '', selectedColor = '', qty = 1;
let modalImgIndex   = 0;
let editingProductId = null;
let editingBlogId    = null;
let pfImages = [];

const OG_WORKER_KEY = 'fc_worker_url';
let _selectedProdAffs = [];
let _selectedBlogAffs = [];
let _orderPhotoBase64 = null;
let editingAffId = null;
let affImgBase64 = null;
let _chkPayMethod = 'whatsapp';
let _bannerTimer  = null;

const GH_USER       = 'saadseb';
const GH_REPO       = 'saadseb.github.io';
const GH_TOKEN_KEY  = 'fc_gh_token';

// ── normalizeProduct ──────────────────────────────────────────────────────
function normalizeProduct(p) {
  let images = Array.isArray(p.images) && p.images.length > 0 ? p.images : [];
  if (images.length === 0 && p.img) images = [p.img];
  const fallback = 'images/backgrounds/hero-2.jpg';
  return {
    affiliate: null, affiliateIds: [],
    ...p,
    id:      p.id      || Date.now(),
    name:    p.name    || '',
    price:   p.price   || 0,
    img:     images[0] || fallback,
    images:  images.length > 0 ? images : [fallback],
    sizes:   p.sizes   || ['XS','S','M','L','XL','XXL'],
    colors:  p.colors  || ['#c9a84c','#8b1a1a','#1a2744'],
    stars:   p.stars   || 5,
    reviews: p.reviews || 0,
  };
}

// ── loadData — fetch data.json ────────────────────────────────────────────
async function loadData() {
  // Check localStorage for admin-saved data first
  const savedProducts   = localStorage.getItem('fc_products');
  const savedBlog       = localStorage.getItem('fc_blog');
  const savedAffiliates = localStorage.getItem('fc_affiliates');

  try {
    const res  = await fetch('data.json?v=' + Date.now());
    const json = await res.json();

    // Use localStorage overrides if admin has saved changes, else use JSON
    PRODUCTS           = (savedProducts   ? JSON.parse(savedProducts)   : json.products   || []).map(normalizeProduct);
    BLOG_POSTS         = (savedBlog       ? JSON.parse(savedBlog)       : json.blog       || []);
    AFFILIATE_PRODUCTS = (savedAffiliates ? JSON.parse(savedAffiliates) : json.affiliates || []);
    BACKGROUNDS        = json.backgrounds || {};

    // Apply background images to DOM
    applyBackgrounds();

  } catch (err) {
    console.warn('data.json not found, using localStorage or defaults', err);
    PRODUCTS           = (savedProducts   ? JSON.parse(savedProducts)   : []).map(normalizeProduct);
    BLOG_POSTS         = (savedBlog       ? JSON.parse(savedBlog)       : []);
    AFFILIATE_PRODUCTS = (savedAffiliates ? JSON.parse(savedAffiliates) : []);
  }
}

// ── applyBackgrounds ──────────────────────────────────────────────────────
function applyBackgrounds() {
  if (!BACKGROUNDS) return;

  // Helper: set background-image on element
  const setBg = (el, key) => {
    if (el && BACKGROUNDS[key]) 
      el.style.backgroundImage = `url('${BACKGROUNDS[key]}')`;
  };

  // Hero
  setBg(document.getElementById('heroBg'), 'hero');

  // Section photo divs
  setBg(document.querySelector('.about-hero-photo'),   'atelier');
  setBg(document.querySelector('.contact-hero-photo'), 'contact');
  setBg(document.querySelector('.blog-hero-photo'),    'blog_header');

  // Inline background-image pages (boutique, suivi, affiliation)
  const inlineMap = {
    'page-shop':      'boutique',
    'page-suivi':     'suivi',
    'page-affiliate': 'affiliation',
    'page-about':     'about',
    'page-mentions':  'about',
    'page-privacy':   'about',
    'page-cgv':       'about',
  };

  for (const [pageId, bgKey] of Object.entries(inlineMap)) {
    const page = document.getElementById(pageId);
    if (!page || !BACKGROUNDS[bgKey]) continue;
    // First div with background-image style in this page
    const bgDiv = page.querySelector('[style*="background-image"]');
    if (bgDiv) bgDiv.style.backgroundImage = `url('${BACKGROUNDS[bgKey]}')`;
  }
}
