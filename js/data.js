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


const POLICY_CONTENT = {
  privacy: {
    title: '🔒 Politique de Confidentialité',
    html: `
      <h2>1. Responsable du traitement</h2>
      <p>FaizaCaftan — contact@faizacaftan.ma — Médina de Fès, Maroc.</p>
      <h2>2. Données collectées</h2>
      <p>Nous collectons uniquement les données que vous nous transmettez directement (formulaire de contact, commandes) : nom, email, numéro de téléphone, adresse de livraison. Ces données sont utilisées exclusivement pour traiter votre commande et vous contacter.</p>
      <h2>3. Cookies</h2>
      <p>Ce site utilise des cookies Google AdSense et Google Analytics pour mesurer l'audience et afficher des publicités pertinentes. Les cookies ne contiennent aucune information personnelle identifiable.</p>
      <p>Vous pouvez désactiver les cookies à tout moment dans les paramètres de votre navigateur ou via <a href="https://adssettings.google.com" target="_blank">Google Ads Settings</a>.</p>
      <h2>4. Google AdSense</h2>
      <p>Ce site participe au programme Google AdSense. Google, en tant que fournisseur tiers, utilise des cookies pour diffuser des annonces en fonction des visites précédentes. Pour en savoir plus : <a href="https://policies.google.com/privacy" target="_blank">politique de confidentialité de Google</a>.</p>
      <h2>5. Partage des données</h2>
      <p>Nous ne vendons ni ne louons vos données personnelles à des tiers. Vos informations peuvent être partagées avec des prestataires de livraison uniquement dans le cadre de l'exécution de votre commande.</p>
      <h2>6. Vos droits (RGPD)</h2>
      <p>Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Contactez-nous à : contact@faizacaftan.ma</p>
      <h2>7. Modification</h2>
      <p>Cette politique peut être mise à jour. Dernière mise à jour : avril 2026.</p>`
  },
  cgv: {
    title: '📋 Conditions Générales de Vente',
    html: `
      <h2>1. Objet</h2>
      <p>Les présentes conditions générales de vente régissent les relations contractuelles entre FaizaCaftan et ses clients pour toute commande passée via ce site ou par WhatsApp.</p>
      <h2>2. Prix</h2>
      <p>Les prix sont indiqués en MAD (Dirham marocain). FaizaCaftan se réserve le droit de modifier ses prix à tout moment. La commande est facturée au tarif en vigueur lors de la validation.</p>
      <h2>3. Commandes sur mesure</h2>
      <p>Les caftans sur mesure font l'objet d'un devis personnalisé. Un acompte de 50 % est demandé à la commande. Le solde est réglé avant l'expédition. Les commandes sur mesure ne sont pas remboursables une fois la confection commencée.</p>
      <h2>4. Livraison</h2>
      <p>Délais indicatifs : 7–12 jours pour la France/Belgique, 10–18 jours pour l'Amérique du Nord, 14–21 jours pour le reste du monde. FaizaCaftan ne saurait être tenue responsable des retards dus aux services postaux ou douaniers.</p>
      <h2>5. Retours</h2>
      <p>Les articles standard (non personnalisés) peuvent être retournés dans un délai de 14 jours à compter de la réception, en parfait état et dans leur emballage d'origine. Les frais de retour sont à la charge du client.</p>
      <h2>6. Paiement</h2>
      <p>Les paiements sont acceptés par carte bancaire (Stripe), PayPal ou virement WhatsApp. Toutes les transactions sont sécurisées.</p>
      <h2>7. Litiges</h2>
      <p>En cas de litige, une solution amiable sera recherchée en priorité. À défaut, les tribunaux compétents de Fès, Maroc, seront saisis.</p>`
  },
  cookies: {
    title: '🍪 Politique des Cookies',
    html: `
      <h2>Qu'est-ce qu'un cookie ?</h2>
      <p>Un cookie est un petit fichier texte déposé sur votre appareil lors de votre visite sur notre site. Il permet de mémoriser des informations sur votre navigation.</p>
      <h2>Cookies utilisés</h2>
      <p><strong style="color:var(--ivory)">Google Analytics</strong> — mesure d'audience anonymisée (pages visitées, durée de session). Ces données sont agrégées et ne permettent pas de vous identifier personnellement.</p>
      <p><strong style="color:var(--ivory)">Google AdSense</strong> — affichage de publicités personnalisées basées sur vos centres d'intérêt. Google peut utiliser ces cookies sur d'autres sites que vous visitez.</p>
      <p><strong style="color:var(--ivory)">Cookies fonctionnels</strong> — mémorisent votre panier, vos préférences de langue et votre consentement aux cookies.</p>
      <h2>Gérer vos préférences</h2>
      <p>Vous pouvez accepter ou refuser les cookies via la bannière qui s'affiche lors de votre première visite. Vous pouvez également les désactiver dans les paramètres de votre navigateur ou via <a href="https://adssettings.google.com" target="_blank">Google Ads Settings</a>.</p>
      <h2>Durée de conservation</h2>
      <p>Les cookies analytiques sont conservés 13 mois. Les cookies publicitaires sont conservés 24 mois. Les cookies fonctionnels sont conservés jusqu'à la fin de la session ou 12 mois.</p>
      <h2>Contact</h2>
      <p>Pour toute question relative aux cookies : contact@faizacaftan.ma</p>`
  }
};
