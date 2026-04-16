/* ═══ ROUTER — Navigation SPA + Init async ═══ */
// ── Bootstrap ─────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {

  // 1. Load data.json (products, blog, affiliates, backgrounds)
  await loadData();

  // 2. Close all overlays on fresh load
  ['adminModal','adminLogin','cartOverlay','cartSidebar','productModal','mobileMenu']
    .forEach(id => { const el = document.getElementById(id); if (el) el.classList.remove('open','visible'); });

  // 3. Activate the page that's already marked active in HTML
  //    (each HTML file pre-sets its own page div as active)
  const activePage = document.querySelector('.page.active');
  const activeId   = activePage ? activePage.id.replace('page-', '') : 'home';

  // 4. Render based on active page
  if (typeof updateCartBadge   === 'function') updateCartBadge();
  if (typeof applyAdsConfig    === 'function') applyAdsConfig();
  if (typeof trackVisit        === 'function') trackVisit();
  if (typeof setReviewStar     === 'function') setReviewStar(5);

  // Always render shop + home sections if elements exist
  if (typeof renderFeatured    === 'function') renderFeatured();
  if (typeof renderShop        === 'function') renderShop();
  if (typeof renderBlogGrid    === 'function') renderBlogGrid();
  if (typeof renderHomeBlog    === 'function') renderHomeBlog();
  if (typeof renderAffiliatePage === 'function') renderAffiliatePage();
  if (typeof renderReviews     === 'function') renderReviews();

  // 5. Cookie banner
  if (typeof showCookieBanner === 'function') showCookieBanner();

  // 6. Email popup after 8s (after cookie banner)
  setTimeout(openEmailPopup, 8000);
});

// ── Page router ───────────────────────────────────────────────────────────
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pageEl = document.getElementById('page-' + name);
  if (pageEl) pageEl.classList.add('active');

  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  const navLink = document.getElementById('nav-' + name);
  if (navLink) navLink.classList.add('active');

  // Hero scroll indicator
  const hs = document.querySelector('.hero-scroll');
  if (hs) hs.style.display = name === 'home' ? '' : 'none';

  window.scrollTo(0, 0);

  // Lazy renders per page
  if (name === 'shop')      { renderShop(); renderReviews(); }
  if (name === 'home')      { renderFeatured(); renderHomeBlog(); }
  if (name === 'blog')      {
    renderBlogGrid();
    const bls = document.getElementById('blogListSection');
    if (bls) bls.style.display = 'block';
    const ba = document.getElementById('blogArticle');
    if (ba)  ba.style.display  = 'none';
  }
  if (name === 'affiliate') { renderAffiliatePage(); addAffTracking(); }
}
