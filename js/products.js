/* ═══ PRODUCTS — Rendu boutique & filtres ═══ */
/* ═══════════ PRODUCTS ═══════════ */
function productCardHTML(p) {
  const liked = wishlist.includes(p.id);
  const stars = '★'.repeat(p.stars)+'☆'.repeat(5-p.stars);
  return `
  <div class="product-card" onclick="openProduct(${p.id})">
    <div class="product-img-wrap">
      <img class="product-img" src="${p.img}" alt="${p.name}" loading="lazy">
      ${p.badge ? `<span class="product-badge ${p.badge==='Nouveau'?'new':p.badge==='Promo'?'promo':''}">${p.badge}</span>`:''}
      <div class="product-wishlist ${liked?'liked':''}" onclick="toggleWish(event,${p.id})">${liked?'❤️':'🤍'}</div>
    </div>
    <div class="product-info">
      <div class="product-cat">${p.cat}</div>
      <div class="product-name">${p.name}</div>
      <div class="product-stars">${stars} <span style="color:var(--muted);font-size:11px">(${p.reviews})</span></div>
      <div class="product-price-row">
        <div>
          <span class="product-price">${p.price.toLocaleString()} MAD</span>
          ${p.old?`<span class="product-price-old">${p.old.toLocaleString()}</span>`:''}
        </div>
        <button class="btn-add-cart" onclick="quickAdd(event,${p.id})">+ Panier</button>
      </div>
    </div>
  </div>`;}

function renderFeatured() {
  const el = document.getElementById('featuredGrid');
  if(!el) return;
  el.innerHTML = PRODUCTS.filter(p=>p.actif!==false).slice(0,4).map(p=>productCardHTML(p)).join('');
}

function renderShop() {
  const el = document.getElementById('shopGrid');
  if(!el) return;
  const active = PRODUCTS.filter(p => p.actif !== false);
  const list = currentFilter==='all' ? active : active.filter(p=>p.cat===currentFilter);
  el.innerHTML = list.length ? list.map(p=>productCardHTML(p)).join('') :
    `<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--muted)">
      <div style="font-size:2.5rem;margin-bottom:12px">👗</div>
      <div style="font-size:1rem;color:var(--ivory2)">Aucun produit disponible dans cette catégorie</div>
    </div>`;
}

function filterShop(cat, btn) {
  currentFilter = cat;
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  else { const fb = document.querySelector('.filter-btn'); if(fb) fb.classList.add('active'); }
  renderShop();
}

/* ═══════════ BLOG ═══════════ */
function blogCardHTML(post, mini=false) {
  return `
  <div class="blog-card" onclick="openArticle(${post.id})">
    <div style="overflow:hidden;height:200px">
      <img class="blog-card-img" src="${post.img}" alt="${post.title}" loading="lazy">
    </div>
    <div class="blog-card-body">
      <span class="blog-card-cat">${post.cat}</span>
      <div class="blog-card-title">${post.title}</div>
      <p class="blog-card-excerpt">${post.excerpt}</p>
      <div class="blog-card-meta">
        <span>📅 ${post.date||'2026'}</span>
        <span>📖 5 min de lecture</span>
      </div>
      <button class="blog-read-more" style="margin-top:12px">Lire l'article →</button>
    </div>
  </div>`;
}

function renderBlogGrid() {
  const el = document.getElementById('blogGrid');
  if(!el) return;
  el.innerHTML = BLOG_POSTS.map(p=>blogCardHTML(p)).join('');
}

function renderHomeBlog() {
  const el = document.getElementById('homeBlogGrid');
  if(!el) return;
  el.innerHTML = BLOG_POSTS.slice(0,3).map(p=>blogCardHTML(p)).join('');
}

function renderArticleAffiliates(post) {
  const ids = Array.isArray(post.affiliateIds) ? post.affiliateIds : [];
  if(!ids.length) return '';
  // Loose comparison (== not ===) to handle string/number mismatch after JSON parse
  const affs = ids.map(id => AFFILIATE_PRODUCTS.find(p => p.id == id)).filter(Boolean);
  if(!affs.length) return '';
  return `
  <div style="margin-top:40px;margin-bottom:8px">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
      <div style="height:1px;flex:1;background:var(--border)"></div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:1.2rem;color:var(--gold2);white-space:nowrap">🔗 Nos coups de cœur</div>
      <div style="height:1px;flex:1;background:var(--border)"></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px">
      ${affs.map(p=>`
      <a href="${p.url}" target="_blank" rel="noopener sponsored"
         onclick="trackAffClick('${p.url.replace(/'/g,"\\'")}','${p.title.replace(/'/g,"\\'")}')"
         style="text-decoration:none;display:flex;flex-direction:column;background:var(--ink3);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;transition:border-color 0.2s,transform 0.2s"
         onmouseover="this.style.borderColor='var(--gold2)';this.style.transform='translateY(-2px)'"
         onmouseout="this.style.borderColor='';this.style.transform=''">
        <img src="${p.img}" alt="${p.title}" loading="lazy"
             style="width:100%;height:160px;object-fit:cover;display:block"
             onerror="this.src='https://images.unsplash.com/photo-1583001809873-a128495da465?w=400'">
        <div style="padding:12px;flex:1;display:flex;flex-direction:column;gap:5px">
          <div style="font-size:13px;color:var(--ivory);font-weight:600;line-height:1.4">${p.title}</div>
          ${p.desc ? `<div style="font-size:11px;color:var(--muted);line-height:1.5;flex:1">${p.desc.slice(0,80)}${p.desc.length>80?'…':''}</div>` : ''}
          ${p.price ? `<div style="font-size:14px;color:var(--gold2);font-weight:700">${p.price}</div>` : ''}
          <div style="margin-top:6px;background:linear-gradient(135deg,var(--gold),var(--gold-dim));color:var(--ink);border-radius:6px;padding:7px 12px;font-size:11px;font-weight:700;letter-spacing:1px;text-align:center">Voir le produit →</div>
        </div>
      </a>`).join('')}
    </div>
    <div style="font-size:10px;color:var(--muted2);text-align:center;margin-top:10px;letter-spacing:1px">LIENS AFFILIÉS · UNE COMMISSION PEUT ÊTRE PERÇUE</div>
  </div>`;}

function openArticle(id) {
  const post = BLOG_POSTS.find(p=>p.id===id);
  if(!post) return;
  // Naviguer vers la page blog sans réinitialiser la vue article
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const pg = document.getElementById('page-blog');
  if(pg) pg.classList.add('active');
  document.querySelectorAll('.nav-links a').forEach(a=>a.classList.remove('active'));
  const nl = document.getElementById('nav-blog');
  if(nl) nl.classList.add('active');
  // Afficher la vue article
  document.getElementById('blogListSection').style.display='none';
  document.getElementById('blogArticleSection').style.display='block';
  // Related articles
  const related = BLOG_POSTS.filter(p=>p.id!==id).slice(0,3);
  document.getElementById('blogArticleContent').innerHTML = `
    <div class="blog-article-header">
      <span class="blog-article-cat">${post.cat}</span>
      <h1 class="blog-article-title">${post.title}</h1>
      <div class="blog-article-meta">
        <span>📅 ${post.date||'2026'}</span>
        <span>📖 5 min de lecture</span>
        <span>🏷️ ${(post.keywords||'').split(',').slice(0,2).join(', ')}</span>
      </div>
    </div>
    <img class="blog-article-hero" src="${post.img}" alt="${post.title}" loading="lazy">
    
    <!-- AD inline article top — machine AdSense -->
    <div class="ad-zone blog-ad-inline" style="border-radius:var(--r)">
      <span class="ad-zone-label">Publicité</span>
      <div class="ad-placeholder">Publicité</div>
    </div>
    
    <div class="blog-article-content">${post.content}</div>
    
    ${renderArticleAffiliates(post)}
    
    <!-- AD inline article milieu -->
    <div class="ad-zone blog-ad-inline" style="border-radius:var(--r)">
      <span class="ad-zone-label">Publicité</span>
      <div class="ad-placeholder">Publicité</div>
    </div>
    
    <!-- CTA produit -->
    <div style="background:var(--ink3);border:1px solid var(--border);border-radius:var(--r);padding:24px;margin-top:32px;text-align:center">
      <div style="font-family:'Cormorant Garamond',serif;font-size:1.5rem;color:var(--gold2);margin-bottom:8px">Prête à commander votre caftan ? ✨</div>
      <p style="color:var(--muted);font-size:13px;margin-bottom:16px">Découvrez notre collection et commandez sur mesure avec livraison internationale.</p>
      <span class="btn-hero btn-primary" onclick="showPage('shop')">Voir la boutique →</span>
    </div>
    
    <!-- AD article bas -->
    <div class="ad-zone blog-ad-inline" style="border-radius:var(--r)">
      <span class="ad-zone-label">Publicité</span>
      <div class="ad-placeholder">Publicité</div>
    </div>
    
    <!-- Related -->
    <div class="blog-related">
      <div class="blog-related-title">Articles similaires</div>
      <div class="blog-related-grid">
        ${related.map(p=>`
          <div class="blog-card" onclick="openArticle(${p.id})" style="cursor:pointer">
            <div style="height:120px;overflow:hidden"><img class="blog-card-img" src="${p.img}" alt="${p.title}" loading="lazy" style="height:120px"></div>
            <div class="blog-card-body" style="padding:14px">
              <div class="blog-card-title" style="font-size:1rem">${p.title}</div>
              <button class="blog-read-more" style="margin-top:8px">Lire →</button>
            </div>
          </div>`).join('')}
      </div>
    </div>
  `;
  window.scrollTo(0,0);
}

function showBlogList() {
  document.getElementById('blogListSection').style.display='block';
  document.getElementById('blogArticleSection').style.display='none';
  renderBlogGrid();
  window.scrollTo(0,0);
}



function renderAffiliatePage() {
  // AFFILIATE_PRODUCTS est chargé par loadData() depuis data.json
  const el = document.getElementById('affiliateGrid');
  if(!el) return;
  if(!AFFILIATE_PRODUCTS.length) {
    el.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--muted)">
        <div style="font-size:3rem;margin-bottom:16px">🔗</div>
        <div style="font-size:1rem;margin-bottom:8px;color:var(--ivory2)">Aucun produit affilié pour le moment</div>
        <div style="font-size:13px">Revenez bientôt — nos coups de cœur arrivent !</div>
      </div>`;
    return;
  }
  const activeAffs = AFFILIATE_PRODUCTS.filter(p => p.actif !== false);
  if(!activeAffs.length) {
    el.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--muted)">
        <div style="font-size:3rem;margin-bottom:16px">🔗</div>
        <div style="font-size:1rem;margin-bottom:8px;color:var(--ivory2)">Aucun produit affilié pour le moment</div>
        <div style="font-size:13px">Revenez bientôt — nos coups de cœur arrivent !</div>
      </div>`;
    return;
  }
  el.innerHTML = activeAffs.map(p => `
    <div class="product-card">
      <div class="product-img-wrap">
        <img class="product-img" src="${p.img}" alt="${p.title}" loading="lazy"
             onerror="this.src='https://images.unsplash.com/photo-1583001809873-a128495da465?w=600'">
        <span class="product-badge new" style="background:linear-gradient(135deg,#1a8a3a,#0f6028);letter-spacing:0.5px">🔗 Affilié</span>
      </div>
      <div class="product-info">
        <div class="product-cat">Coup de cœur</div>
        <div class="product-name" style="font-size:0.95rem;line-height:1.4">${p.title}</div>
        ${p.desc ? `<p style="font-size:12px;color:var(--muted);margin:5px 0 0;line-height:1.55;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${p.desc}</p>` : ''}
        <div class="product-price-row" style="margin-top:10px;align-items:center">
          <span class="product-price">${p.price || '—'}</span>
        </div>
        <a href="${p.url}" target="_blank" rel="noopener noreferrer sponsored"
           onclick="event.stopPropagation()"
           class="btn btn-gold"
           style="display:block;margin-top:12px;text-align:center;padding:11px 16px;font-size:11px;letter-spacing:1.8px;text-decoration:none;border-radius:var(--r)">
          Voir le produit →
        </a>
      </div>
    </div>`).join('');
}

/* ── Blog Admin ── */
