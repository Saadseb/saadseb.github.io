/* ═══ MODAL — Fiche produit, galerie, zoom ═══ */
/* ═══════════ MODAL PRODUCT ═══════════ */
function openProduct(id) {
  // Use == for loose equality (id may be string from onclick, number in data)
  const p = PRODUCTS.find(x => x.id == id);
  if (!p) { console.error('Product not found:', id, 'PRODUCTS:', PRODUCTS.length); return; }
  selectedProduct = p;
  selectedSize = p.sizes?.[2] || p.sizes?.[0] || '';
  selectedColor = p.colors?.[0] || '';
  qty = 1;
  modalImgIndex = 0;
  renderModalGallery();
  renderModalInfo();
  const modal = document.getElementById('productModal');
  if (modal) modal.classList.add('open');
}

function renderModalGallery() {
  const p = selectedProduct;
  if (!p) return;
  const imgs = p.images && p.images.length > 0 ? p.images : [p.img];
  const idx = Math.max(0, Math.min(modalImgIndex, imgs.length-1));
  modalImgIndex = idx;

  // Main image
  const mainImg = document.getElementById('modalImg');
  if (!mainImg) return;
  mainImg.src = imgs[idx];
  mainImg.alt = p.name;

  // Counter
  const counter = document.getElementById('modalImgCounter');
  if(counter && imgs.length > 1) {
    counter.style.display='block';
    counter.textContent = `${idx+1} / ${imgs.length}`;
  } else if(counter) {
    counter.style.display='none';
  }

  // Nav arrows
  const prev = document.querySelector('.modal-img-nav.prev');
  const next = document.querySelector('.modal-img-nav.next');
  if(imgs.length > 1) {
    prev.style.display='flex'; next.style.display='flex';
    prev.style.opacity = idx===0 ? '0.35' : '1';
    next.style.opacity = idx===imgs.length-1 ? '0.35' : '1';
  } else {
    prev.style.display='none'; next.style.display='none';
  }

  // Thumbnails
  const thumbs = document.getElementById('modalThumbs');
  if(imgs.length > 1) {
    thumbs.style.display='flex';
    thumbs.innerHTML = imgs.map((src, i) => `
      <div class="modal-thumb ${i===idx?'active':''}" onclick="setModalImg(${i})">
        <img src="${src}" alt="${p.name} photo ${i+1}" loading="lazy">
      </div>`).join('');
  } else {
    thumbs.style.display='none';
    thumbs.innerHTML='';
  }
}

function setModalImg(idx) {
  modalImgIndex = idx;
  renderModalGallery();
}

function navModalImg(dir) {
  const p = selectedProduct;
  const imgs = p.images && p.images.length > 0 ? p.images : [p.img];
  modalImgIndex = Math.max(0, Math.min(modalImgIndex + dir, imgs.length-1));
  renderModalGallery();
}

function zoomCurrentImg() {
  const p = selectedProduct;
  const imgs = p.images && p.images.length > 0 ? p.images : [p.img];
  document.getElementById('zoomImg').src = imgs[modalImgIndex];
  document.getElementById('zoomOverlay').classList.add('open');
}

function renderModalAffiliates(p) {
  const ids = Array.isArray(p.affiliateIds) ? p.affiliateIds : [];
  if(!ids.length) return '';
  const affs = ids.map(id => AFFILIATE_PRODUCTS.find(a => a.id == id)).filter(Boolean);
  if(!affs.length) return '';
  return `
  <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border)">
    <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:10px">🔗 Vous aimerez aussi</div>
    <div style="display:flex;flex-direction:column;gap:10px;max-height:260px;overflow-y:auto;
                padding-right:4px;scrollbar-width:thin;scrollbar-color:var(--gold-dim) transparent">
      ${affs.map(a => `
      <a href="${a.url}" target="_blank" rel="noopener sponsored"
         onclick="trackAffClick('${a.url.replace(/'/g,"\\'")}','${a.title.replace(/'/g,"\\'")}')"
         style="display:flex;gap:12px;align-items:center;text-decoration:none;
                background:var(--ink3);border:1px solid var(--border);border-radius:10px;
                padding:0;overflow:hidden;flex-shrink:0;transition:border-color 0.2s"
         onmouseover="this.style.borderColor='var(--gold2)'"
         onmouseout="this.style.borderColor=''">
        <img src="${a.img}" alt="${a.title}" loading="lazy"
             style="width:80px;height:80px;object-fit:cover;flex-shrink:0;display:block"
             onerror="this.src='https://images.unsplash.com/photo-1583001809873-a128495da465?w=200'">
        <div style="flex:1;min-width:0;padding:10px 4px">
          <div style="font-size:12px;color:var(--ivory);font-weight:600;line-height:1.35;
                      display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${a.title}</div>
          ${a.price ? `<div style="font-size:13px;color:var(--gold2);font-weight:700;margin-top:4px">${a.price}</div>` : ''}
        </div>
        <div style="font-size:10px;color:var(--gold);font-weight:700;white-space:nowrap;
                    flex-shrink:0;padding:0 12px">Voir →</div>
      </a>`).join('')}
    </div>
    <div style="font-size:9px;color:var(--muted2);text-align:center;margin-top:8px;letter-spacing:1px">LIENS AFFILIÉS</div>
  </div>`;
}

function renderModalInfo() {
  const p = selectedProduct;
  const stars = '★'.repeat(p.stars)+'☆'.repeat(5-p.stars);
  document.getElementById('modalInfo').innerHTML = `
    <div class="modal-product-name">${p.name}</div>
    <div style="color:var(--gold2);font-size:13px;margin-bottom:4px">${stars} (${p.reviews} avis)</div>
    <div class="modal-price">${p.price.toLocaleString()} <span style="font-size:1rem;color:var(--muted)">MAD</span>
      ${p.old?`<span style="font-size:1rem;color:var(--muted2);text-decoration:line-through;margin-left:8px">${p.old.toLocaleString()}</span>`:''}
    </div>
    <p class="modal-desc">${p.desc}</p>
    <div>
      <div class="modal-lbl" style="margin-bottom:8px">Taille</div>
      <div class="size-grid">
        ${p.sizes.map(s=>`<button class="size-btn ${s===selectedSize?'active':''}" onclick="selectSize('${s}')">${s}</button>`).join('')}
      </div>
    </div>
    <div>
      <div class="modal-lbl" style="margin-bottom:8px">Couleur</div>
      <div class="color-grid">
        ${p.colors.map(c=>`<div class="color-dot ${c===selectedColor?'active':''}" style="background:${c}" onclick="selectColor('${c}')"></div>`).join('')}
      </div>
    </div>
    <div>
      <div class="modal-lbl" style="margin-bottom:8px">Quantité</div>
      <div class="qty-row">
        <button class="qty-btn" onclick="changeQty(-1)">−</button>
        <span class="qty-val" id="qtyVal">${qty}</span>
        <button class="qty-btn" onclick="changeQty(1)">+</button>
      </div>
    </div>
    <button class="btn btn-gold" onclick="addToCart(${p.id})">🛍 Ajouter au panier</button>
    <!--<button class="btn btn-ghost" onclick="orderWhatsApp(${p.id})" style="margin-top:8px;font-size:11px">💬 Commander sur WhatsApp</button>-->
    ${p.affiliate ? `<a href="${p.affiliate}" target="_blank" rel="noopener noreferrer" class="btn" style="margin-top:8px;font-size:11px;background:linear-gradient(135deg,#27ae60,#1e8449);color:white;text-align:center;display:block;padding:13px;border-radius:var(--r);font-weight:700;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none">🔗 Acheter via lien affilié</a>` : ''}
    ${renderModalAffiliates(p)}
  `;
}

function selectSize(s) { selectedSize=s; renderModalInfo(); }
function selectColor(c) { selectedColor=c; renderModalInfo(); }
function changeQty(d) { qty=Math.max(1,qty+d); document.getElementById('qtyVal').textContent=qty; }
function closeProduct() { document.getElementById('productModal').classList.remove('open'); }

/* ── Policy Modals ── */
// POLICY_CONTENT is defined in data.js

function openPolicyModal(type) {
  const data = POLICY_CONTENT[type];
  if(!data) return;
  document.getElementById('policyModalTitle').textContent = data.title;
  document.getElementById('policyModalBody').innerHTML = data.html;
  document.getElementById('policyModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closePolicyModal() {
  document.getElementById('policyModal').classList.remove('open');
  document.body.style.overflow = '';
}
function closeProductModal(e) {
  if(!e||e.target===document.getElementById('productModal'))
    document.getElementById('productModal').classList.remove('open');
}

/* ─ Touch/swipe support for modal gallery ─ */
(function(){
  let _sx=0, _sy=0;
  document.addEventListener('touchstart', e=>{
    const _pmT=document.getElementById('productModal'); if(!_pmT||!_pmT.classList.contains('open')) return;
    _sx=e.touches[0].clientX; _sy=e.touches[0].clientY;
  }, {passive:true});
  document.addEventListener('touchend', e=>{
    const _pmE=document.getElementById('productModal'); if(!_pmE||!_pmE.classList.contains('open')) return;
    if(!selectedProduct) return;
    const dx=e.changedTouches[0].clientX-_sx;
    const dy=Math.abs(e.changedTouches[0].clientY-_sy);
    if(Math.abs(dx)>50 && dy<60) {
      navModalImg(dx<0?1:-1);
    }
  }, {passive:true});
})();

