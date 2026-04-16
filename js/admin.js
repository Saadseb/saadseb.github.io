/* ═══ ADMIN — Panneau de gestion complet ═══ */
/* ═══════════ ADMIN ═══════════ */
function openAdminLogin() {
  document.getElementById('adminLogin')?.classList.add('open');
  (document.getElementById('loginError')||{style:{}}).style.display ='none';
  document.getElementById('adminPwd').value='';
  setTimeout(()=>document.getElementById('adminPwd').focus(), 100);
}

async function checkLogin() {
  const pwd = document.getElementById('adminPwd').value;
  const h = await hashPwd(pwd);
  if(h === adminPwdHash) {
    document.getElementById('adminLogin')?.classList.remove('open');
    document.getElementById('adminModal')?.classList.add('open');
    initAdminPanel();
    setTimeout(checkGhTokenStatus, 200);
  } else {
    (document.getElementById('loginError')||{style:{}}).style.display ='block';
  }
}

function closeAdmin() {
  document.getElementById('adminModal')?.classList.remove('open');
}

function showAdmTab(name, el) {
  document.querySelectorAll('.adm-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.adm-nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('adm-'+name).classList.add('active');
  if(el) el.classList.add('active');
  if(name==='products') { renderProductsTable(); renderProductAffPicker(); }
  if(name==='blog-adm') { renderBlogAdm(); renderBlogAffPicker(); }
  if(name==='affiliate-adm') {
    renderAffiliateTable();
    (document.getElementById('aff-count')||{}).textContent = AFFILIATE_PRODUCTS.length;
    // Afficher le statut du Worker
    const banner = document.getElementById('worker-banner');
    if(banner) {
      const wUrl = getWorkerUrl();
      if(wUrl) {
        banner.style.display = 'block';
        banner.style.background = 'rgba(39,174,96,0.10)';
        banner.style.color = '#58d68d';
        banner.style.border = '1px solid rgba(39,174,96,0.25)';
        banner.innerHTML = `✅ Cloudflare Worker actif — le bouton <strong>🔍 Auto-remplir</strong> récupérera photo, titre, description et prix automatiquement.<br><span style="font-size:10px;color:#3a8a50">${wUrl.slice(0,60)}${wUrl.length>60?'…':''}</span>`;
      } else {
        banner.style.display = 'block';
        banner.style.background = 'rgba(201,168,76,0.08)';
        banner.style.color = '#e8c96a';
        banner.style.border = '1px solid rgba(201,168,76,0.25)';
        banner.innerHTML = `⚠️ Aucun Worker configuré — l'auto-remplissage utilisera un proxy de secours (résultats limités sur Amazon).<br>
          <a href="#" onclick="showAdmTab('settings',document.querySelector('.adm-nav-item:last-child'));return false;" style="color:#c9a84c;font-size:11px;text-decoration:underline">→ Configurer le Worker dans Paramètres</a>`;
      }
    }
  }
  if(name==='orders') renderOrdersTable();
  if(name==='settings') { setTimeout(checkGhTokenStatus, 100); setTimeout(checkWorkerStatus, 100); }
  if(name==='stats') renderStatsAdmin();
  if(name==='ads') renderAdsToggle();
  if(name==='promo') renderPromoProductSelect();
  if(name==='payments') renderPaymentsTab();
}

function initAdminPanel() {
  renderProductsTable();
  renderBlogAdm();
  renderOrdersTable();
  renderAdsToggle();
  renderRevChart();
  renderImgGrid();
  renderAffiliateTable();
  (document.getElementById('aff-count')||{}).textContent = AFFILIATE_PRODUCTS.length;
  (document.getElementById('dash-affiliate')||{}).textContent = AFFILIATE_PRODUCTS.length;
  (document.getElementById('dash-products')||{}).textContent = PRODUCTS.length;
  (document.getElementById('dash-blog')||{}).textContent = BLOG_POSTS.length;
  (document.getElementById('dash-orders')||{}).textContent = ORDERS.length;
}

/* ── Products Admin ── */
function renderProductsTable(filter) {
  const tb = document.getElementById('productsTableBody');
  if(!tb) return;
  const q = (filter||'').toLowerCase();
  const list = q ? PRODUCTS.filter(p=>p.name.toLowerCase().includes(q)||p.cat.toLowerCase().includes(q)) : PRODUCTS;
  if(!list.length) { tb.innerHTML=`<tr><td colspan="7" style="text-align:center;color:#555;padding:24px">Aucun produit trouvé</td></tr>`; return; }
  tb.innerHTML = list.map(p=>{
    const actif = p.actif !== false; // true par défaut
    const imgs = p.images && p.images.length > 1 ? p.images.slice(1,3) : [];
    const extraHtml = imgs.map(src=>`<img src="${src}" class="adm-prod-thumb-extra" alt="">`).join('');
    const more = (p.images||[]).length > 3 ? `<span class="adm-prod-more">+${(p.images.length-3)}</span>` : '';
    return `<tr class="${actif?'':'prod-inactive'}">
      <td>
        <div class="adm-prod-imgs">
          <img src="${p.img}" class="adm-prod-thumb" alt="${p.name}">
          ${extraHtml}${more}
        </div>
      </td>
      <td>
        <strong style="color:#ddd;font-size:13px">${p.name}</strong>
        <div style="font-size:10px;color:#555;margin-top:2px">⭐ ${p.stars} · ${p.reviews} avis</div>
      </td>
      <td><span class="adm-badge adm-badge-gold">${p.cat}</span></td>
      <td style="color:#e8c96a;font-weight:700">${p.price.toLocaleString()} <span style="color:#555;font-size:10px">MAD</span></td>
      <td>${p.badge?`<span class="adm-badge adm-badge-green">${p.badge}</span>`:'-'}</td>
      <td>
        <div style="display:flex;align-items:center;gap:7px">
          <label class="stock-toggle" title="${actif?'Désactiver':'Activer'} ce produit">
            <input type="checkbox" ${actif?'checked':''} onchange="toggleProductStock(${p.id},this.checked)">
            <span class="stock-track"></span>
          </label>
          <span class="${actif?'stock-label-on':'stock-label-off'}">${actif?'EN STOCK':'INACTIF'}</span>
        </div>
      </td>
      <td>
        <div style="display:flex;gap:5px">
          <button class="adm-btn adm-btn-primary adm-btn-sm" onclick="editProduct(${p.id})" title="Modifier">✏️</button>
          <button class="adm-btn adm-btn-danger adm-btn-sm" onclick="deleteProduct(${p.id})" title="Supprimer">🗑️</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}
function filterProductsTable(q) { renderProductsTable(q); }

function toggleProductStock(id, actif) {
  const p = PRODUCTS.find(x => x.id === id);
  if(!p) return;
  p.actif = actif;
  localStorage.setItem('fc_products', JSON.stringify(PRODUCTS));
  renderProductsTable();
  renderShop();
  renderFeatured();
  showSaveBanner('Stock', `${p.name} — ${actif ? '✅ Activé (en stock)' : '❌ Désactivé (hors stock)'}`);

  saveDataJson();
}


function renderProductAffPicker() {
  const el = document.getElementById('pf-aff-picker');
  const none = document.getElementById('pf-aff-none');
  if(!el) return;
  const affs = AFFILIATE_PRODUCTS.filter(p => p.actif !== false);
  if(!affs.length) {
    el.innerHTML = '';
    if(none) none.style.display = 'block';
    return;
  }
  if(none) none.style.display = 'none';
  el.innerHTML = affs.map(p => {
    const sel = _selectedProdAffs.includes(p.id) || _selectedProdAffs.map(String).includes(String(p.id));
    return `<div onclick="toggleProdAff(${p.id})" style="cursor:pointer;border-radius:8px;border:2px solid ${sel?'var(--gold2)':'#2a2a3a'};background:${sel?'rgba(201,168,76,0.08)':'#12121a'};padding:6px;transition:all 0.2s;position:relative">
      <img src="${p.img}" alt="${p.title}" style="width:100%;height:65px;object-fit:cover;border-radius:5px;display:block" onerror="this.src='https://images.unsplash.com/photo-1583001809873-a128495da465?w=200'">
      <div style="font-size:10px;color:${sel?'var(--gold2)':'#aaa'};margin-top:4px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.title}</div>
      ${sel ? '<div style="position:absolute;top:4px;right:4px;background:var(--gold2);color:#000;border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700">✓</div>' : ''}
    </div>`;
  }).join('');
}

function toggleProdAff(id) {
  const idx = _selectedProdAffs.findIndex(x => x == id);
  if(idx > -1) _selectedProdAffs.splice(idx, 1);
  else _selectedProdAffs.push(id);
  renderProductAffPicker();
}

function saveProduct() {
  console.log('[saveProduct] called');
  
  const nameEl  = document.getElementById('pf-name');
  const priceEl = document.getElementById('pf-price');
  
  if (!nameEl || !priceEl) { 
    console.error('[saveProduct] form fields not found'); 
    toast('Erreur: formulaire introuvable','⚠️'); 
    return; 
  }

  const name  = nameEl.value.trim();
  const price = parseInt(priceEl.value);
  
  console.log('[saveProduct] name:', name, 'price:', price);
  
  if (!name || !price) { 
    toast('Remplissez nom et prix ⚠️'); 
    return; 
  }

  // Build images
  let images = pfImages.map(x => x.src);
  if (images.length === 0) images = ['images/backgrounds/hero-2.jpg'];
  console.log('[saveProduct] images:', images.length);

  const existingProd = editingProductId ? PRODUCTS.find(p => p.id === editingProductId) : null;

  const prod = {
    id:          editingProductId || Date.now(),
    name,
    cat:         document.getElementById('pf-cat')?.value || 'caftan',
    price,
    old:         parseInt(document.getElementById('pf-old')?.value) || null,
    img:         images[0],
    images:      images,
    desc:        document.getElementById('pf-desc')?.value || name,
    badge:       document.getElementById('pf-badge')?.value || null,
    stars:       parseInt(document.getElementById('pf-stars')?.value) || 5,
    reviews:     existingProd ? existingProd.reviews : Math.floor(Math.random()*50)+5,
    sizes:       existingProd ? existingProd.sizes   : ['XS','S','M','L','XL','XXL'],
    colors:      existingProd ? existingProd.colors  : ['#c9a84c','#8b1a1a','#1a2744'],
    affiliate:   document.getElementById('pf-affiliate')?.value.trim() || null,
    affiliateIds: [..._selectedProdAffs],
    actif:       true,
  };

  console.log('[saveProduct] prod built:', prod.name);

  if (editingProductId) {
    const idx = PRODUCTS.findIndex(p => p.id === editingProductId);
    if (idx > -1) PRODUCTS[idx] = normalizeProduct(prod);
    else PRODUCTS.push(normalizeProduct(prod));
    toast('✅ ' + name + ' modifié');
  } else {
    PRODUCTS.push(normalizeProduct(prod));
    toast('✅ ' + name + ' ajouté à la boutique');
  }

  console.log('[saveProduct] PRODUCTS now:', PRODUCTS.length);

  // Save to localStorage — sans base64 pour éviter quota overflow
  try {
    const toSave = PRODUCTS.map(p => {
      const imgs = p.images.map(img => img.startsWith('data:') ? p.img : img);
      return { ...p, img: p.img.startsWith('data:') ? '' : p.img, images: imgs };
    });
    localStorage.setItem('fc_products', JSON.stringify(toSave));
    console.log('[saveProduct] saved to localStorage');
  } catch(e) {
    console.warn('[saveProduct] localStorage failed:', e);
    toast('⚠️ Stockage local plein — produit actif en mémoire seulement');
  }

  // Update UI
  resetProductForm();
  renderProductsTable();

  const dashEl = document.getElementById('dash-products');
  if (dashEl) dashEl.textContent = PRODUCTS.length;

  console.log('[saveProduct] done ✅');

  saveDataJson();
}


function editProduct(id) {
  const p = PRODUCTS.find(x=>x.id===id);
  editingProductId = id;
  _selectedProdAffs = Array.isArray(p.affiliateIds) ? [...p.affiliateIds] : [];
  document.getElementById('pf-name').value = p.name;
  document.getElementById('pf-cat').value = p.cat;
  document.getElementById('pf-price').value = p.price;
  document.getElementById('pf-old').value = p.old||'';
  document.getElementById('pf-desc').value = p.desc;
  document.getElementById('pf-badge').value = p.badge||'';
  document.getElementById('pf-stars').value = p.stars;
  document.getElementById('pf-affiliate').value = p.affiliate||'';
  // Load existing images into pfImages
  pfImages = (p.images && p.images.length > 0 ? p.images : [p.img]).map(src=>({src}));
  renderImgGrid();
  renderProductAffPicker();
  (document.getElementById('productFormTitle')||{}).textContent = '✏️ Modifier le produit';
  (document.getElementById('cancelEditBtn')||{style:{}}).style.display ='block';
  document.getElementById('productForm').scrollIntoView({behavior:'smooth'});
}

function deleteProduct(id) {
  if(!confirm('Supprimer ce produit ?')) return;
  PRODUCTS = PRODUCTS.filter(p=>p.id!==id);
  localStorage.setItem('fc_products', JSON.stringify(PRODUCTS));
  renderProductsTable(); renderFeatured(); renderShop();
  toast('Produit supprimé');

  saveDataJson();
}

function resetProductForm() {
  editingProductId = null;
  _selectedProdAffs = [];
  ['pf-name','pf-price','pf-old','pf-desc','pf-affiliate'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.value='';
  });
  document.getElementById('pf-cat').value='caftan';
  document.getElementById('pf-badge').value='';
  document.getElementById('pf-stars').value='5';
  (document.getElementById('productFormTitle')||{}).textContent ='➕ Ajouter un produit';
  (document.getElementById('cancelEditBtn')||{style:{}}).style.display ='none';
  const filesInput = document.getElementById('pf-img-files');
  if(filesInput) filesInput.value='';
  pfImages = [];
  renderImgGrid();
  renderProductAffPicker();
}

/* ══════════════════════════════════════════════════════
   COMPRESSION IMAGE — réduit à max 800×800px / ~80 Ko
   Permet stockage base64 persistant dans localStorage
══════════════════════════════════════════════════════ */
function compressImage(file, maxW, maxH, quality, callback) {
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      // Calcul des dimensions cibles en conservant le ratio
      let w = img.width, h = img.height;
      if(w > maxW || h > maxH) {
        const ratio = Math.min(maxW / w, maxH / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width  = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      // JPEG avec qualité réduite = ~60-120 Ko selon l'image
      const compressed = canvas.toDataURL('image/jpeg', quality);
      callback(compressed);
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

/* ── Produit : upload multi-images avec compression ── */
function renderImgGrid() {
  const grid = document.getElementById('pf-img-grid');
  if(!grid) return;
  const MAX = 6;
  let html = '';
  pfImages.forEach((img, i) => {
    html += `<div class="multi-img-slot filled" title="Cliquer pour supprimer">
      <span class="slot-num">${i+1}</span>
      <img src="${img.src}" alt="photo ${i+1}">
      ${i===0 ? '<span class="multi-img-main-badge">Principale</span>' : ''}
      <div class="slot-overlay">
        <button class="slot-del-btn" onclick="removeImgSlot(${i})">🗑 Supprimer</button>
      </div>
    </div>`;
  });
  // Empty slots
  for(let i=pfImages.length; i<MAX; i++) {
    html += `<div class="multi-img-slot" onclick="document.getElementById('pf-img-files').click()" title="Ajouter une photo">
      <span class="slot-add-icon">${i===0&&pfImages.length===0?'📷':'+'}</span>
      <span style="font-size:10px">${i===0&&pfImages.length===0?'Photo principale':'Ajouter'}</span>
    </div>`;
  }
  grid.innerHTML = html;
}

function removeImgSlot(idx) {
  pfImages.splice(idx, 1);
  renderImgGrid();
}

function handleMultiImageUpload(input) {
  const files = Array.from(input.files);
  if(!files.length) return;
  const MAX = 6;
  const remaining = MAX - pfImages.length;
  if(remaining <= 0) { toast('Maximum 6 photos atteint','⚠️'); return; }
  const toProcess = files.slice(0, remaining);
  if(files.length > remaining) toast(`⚠️ Seulement ${remaining} photo(s) ajoutée(s) — maximum 6 atteint`);
  let processed = 0;
  toProcess.forEach(file => {
    if(file.size > 20 * 1024 * 1024) { toast(`${file.name} trop lourd (max 20 Mo)`,'⚠️'); processed++; return; }
    compressImage(file, 800, 1000, 0.72, compressed => {
      pfImages.push({src: compressed});
      processed++;
      if(processed === toProcess.length) {
        renderImgGrid();
        toast(`✅ ${toProcess.length} photo(s) ajoutée(s)`);
      }
    });
  });
  input.value = '';
}

function addImgFromUrl() {
  const url = document.getElementById('pf-img-url').value.trim();
  if(!url) { toast('Entrez une URL d\'image','⚠️'); return; }
  if(pfImages.length >= 6) { toast('Maximum 6 photos atteint','⚠️'); return; }
  pfImages.push({src: url});
  document.getElementById('pf-img-url').value = '';
  renderImgGrid();
  toast('✅ URL ajoutée');
}

/* ── Produit : upload image locale avec compression ── */
function handleProductImageUpload(input) {
  const file = input.files[0];
  if(!file) return;
  if(file.size > 20 * 1024 * 1024) { toast('Image trop lourde (max 20 Mo)','⚠️'); input.value=''; return; }
  toast('Compression en cours… ⏳');
  compressImage(file, 800, 1000, 0.72, compressed => {
    document.getElementById('pf-img').value = '';
    // Add to pfImages so saveProduct picks it up
    pfImages = [{src: compressed}];
    setImgPreview(compressed);
    renderImgGrid();
    toast('✅ Image ajoutée — Enregistrez le produit');
  });
}

function setImgPreview(src) {
  const el = document.getElementById('pf-img-preview');
  if(!el) return;
  if(src) {
    el.innerHTML = `<img src="${src}" style="width:100%;height:100%;object-fit:cover;border-radius:8px">`;
  } else {
    el.innerHTML = '<span style="font-size:1.8rem">👗</span>';
  }
}

/* ═══════════════════════════════════════════════════
   AFFILIATE PRODUCTS — Données & Fonctions
═══════════════════════════════════════════════════ */
// AFFILIATE_PRODUCTS loaded from data.json via loadData()

function saveAffiliateProduct() {
  const url   = document.getElementById('af-url').value.trim();
  const title = document.getElementById('af-title').value.trim();
  const price = document.getElementById('af-price').value.trim();
  const img   = affImgBase64 || document.getElementById('af-img').value.trim();
  const desc  = document.getElementById('af-desc').value.trim();

  if(!title || !url) { toast('Remplissez au moins le titre et le lien affilié','⚠️'); return; }

  const prod = {
    id:    editingAffId || Date.now(),
    url,
    title,
    price,
    img:   img || 'https://images.unsplash.com/photo-1583001809873-a128495da465?w=600',
    desc
  };

  if(editingAffId) {
    const idx = AFFILIATE_PRODUCTS.findIndex(p => p.id === editingAffId);
    if(idx > -1) AFFILIATE_PRODUCTS[idx] = prod;
    showSaveBanner('Affilié', `${title} modifié`);
  } else {
    AFFILIATE_PRODUCTS.push(prod);
    showSaveBanner('Affilié', `${title} ajouté à la page Affiliation`);
  }

  localStorage.setItem('fc_affiliates', JSON.stringify(AFFILIATE_PRODUCTS));
  resetAffiliateForm();
  renderAffiliateTable();
  if(typeof renderAffiliatePage==="function") renderAffiliatePage();
  (document.getElementById('aff-count')||{}).textContent = AFFILIATE_PRODUCTS.length;

  saveDataJson();
}

function editAffiliateProduct(id) {
  const p = AFFILIATE_PRODUCTS.find(x => x.id === id);
  if(!p) return;
  editingAffId = id;
  affImgBase64 = null;
  document.getElementById('af-url').value   = p.url   || '';
  document.getElementById('af-title').value = p.title || '';
  document.getElementById('af-price').value = p.price || '';
  document.getElementById('af-img').value   = p.img   || '';
  document.getElementById('af-desc').value  = p.desc  || '';
  setAffImgPreview(p.img);
  (document.getElementById('affiliateFormTitle')||{}).textContent = '✏️ Modifier le produit affilié';
  (document.getElementById('cancelAffBtn')||{style:{}}).style.display = 'block';
  document.getElementById('affiliateForm').scrollIntoView({behavior:'smooth'});
}

function deleteAffiliateProduct(id) {
  if(!confirm('Supprimer ce produit affilié ?')) return;
  AFFILIATE_PRODUCTS = AFFILIATE_PRODUCTS.filter(p => p.id !== id);
  localStorage.setItem('fc_affiliates', JSON.stringify(AFFILIATE_PRODUCTS));
  renderAffiliateTable();
  if(typeof renderAffiliatePage==="function") renderAffiliatePage();
  (document.getElementById('aff-count')||{}).textContent = AFFILIATE_PRODUCTS.length;
  toast('Produit affilié supprimé');

  saveDataJson();
}

function toggleAffiliateStock(id, actif) {
  const p = AFFILIATE_PRODUCTS.find(x => x.id === id);
  if(!p) return;
  p.actif = actif;
  localStorage.setItem('fc_affiliates', JSON.stringify(AFFILIATE_PRODUCTS));
  renderAffiliateTable();
  if(typeof renderAffiliatePage==="function") renderAffiliatePage();
  showSaveBanner('Affilié Stock', `${p.title} — ${actif ? '✅ Activé' : '❌ Désactivé'}`);

  saveDataJson();
}

function resetAffiliateForm() {
  editingAffId = null;
  affImgBase64 = null;
  ['af-url','af-title','af-price','af-img','af-desc'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.value = '';
  });
  const prev = document.getElementById('af-img-preview');
  if(prev) prev.innerHTML = '<span style="color:#555;font-size:12px">Aperçu de l\'image</span>';
  const st = document.getElementById('af-fetch-status');
  if(st) { st.style.display='none'; st.textContent=''; }
  (document.getElementById('affiliateFormTitle')||{}).textContent = '🔗 Ajouter un produit affilié';
  (document.getElementById('cancelAffBtn')||{style:{}}).style.display = 'none';
}

function setAffImgPreview(src) {
  const el = document.getElementById('af-img-preview');
  if(!el || !src) return;
  el.innerHTML = `<img src="${src}" style="width:100%;height:100%;object-fit:cover;border-radius:8px" onerror="this.parentNode.innerHTML='<span style=color:#e74c3c;font-size:12px>Image introuvable</span>'">`;
}

function handleAffImageUpload(input) {
  const file = input.files[0];
  if(!file) return;
  if(file.size > 20 * 1024 * 1024) { toast('Image trop lourde (max 20 Mo)','⚠️'); input.value=''; return; }
  toast('Compression en cours… ⏳');
  compressImage(file, 800, 800, 0.75, compressed => {
    affImgBase64 = compressed;
    setAffImgPreview(compressed);
    toast('✅ Image prête');
  });
  input.value = '';
}

/* ── Auto-remplissage via Cloudflare Worker (og-worker.js) ── */

function getWorkerUrl() {
  return localStorage.getItem(OG_WORKER_KEY) || 'https://affiliateamazone.sdn-sebti.workers.dev';
}

async function fetchAffiliateInfo() {
  const rawUrl   = document.getElementById('af-url').value.trim();
  const statusEl = document.getElementById('af-fetch-status');

  if(!rawUrl) { toast('Entrez d\'abord un lien affilié','⚠️'); return; }

  const workerUrl = getWorkerUrl();

  // ── Affichage état chargement ──
  statusEl.style.display    = 'block';
  statusEl.style.background = 'rgba(108,99,255,0.12)';
  statusEl.style.color      = '#c4bcff';
  statusEl.innerHTML = '<span style="animation:spin 1s linear infinite;display:inline-block">⏳</span> Récupération des informations du produit…';

  // ── Fonction utilitaire fill ──
  function fillFields(name, img, desc, price) {
    if(name)  { document.getElementById('af-title').value = name.slice(0,120); }
    if(img)   { document.getElementById('af-img').value = img; setAffImgPreview(img); affImgBase64 = null; }
    if(desc)  { document.getElementById('af-desc').value  = desc.slice(0,300); }
    if(price) {
      const formatted = typeof price === 'number'
        ? price.toLocaleString('fr-FR', {style:'currency', currency:'EUR'})
        : price;
      document.getElementById('af-price').value = formatted;
    }
    return [name, img, desc, price].filter(Boolean).length;
  }

  // ══════════════════════════════════════
  //  MÉTHODE 1 — Cloudflare Worker
  // ══════════════════════════════════════
  if(workerUrl) {
    try {
      const endpoint = workerUrl.replace(/\/$/, '') + '?url=' + encodeURIComponent(rawUrl);
      const resp = await Promise.race([
        fetch(endpoint),
        new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout 12s')), 12000))
      ]);

      if(!resp.ok) throw new Error(`Worker HTTP ${resp.status}`);
      const data = await resp.json();

      if(!data.ok) throw new Error(data.error || 'Worker: réponse invalide');

      const filled = fillFields(data.name, data.img, data.desc, data.price);

      if(filled === 0) throw new Error('Aucune donnée retournée par le worker');

      statusEl.style.background = 'rgba(39,174,96,0.12)';
      statusEl.style.color      = '#58d68d';
      statusEl.innerHTML = `✅ ${filled} champ(s) rempli(s) via Worker — vérifiez et complétez si besoin.<br>
        <span style="font-size:10px;color:#555">URL finale : ${(data.url||rawUrl).slice(0,60)}${data.url&&data.url.length>60?'…':''}</span>`;
      return;

    } catch(err) {
      // On continue vers la méthode de secours
      statusEl.innerHTML = `⚠️ Worker indisponible (${err.message}) — tentative avec proxy de secours…`;
    }
  } else {
    statusEl.innerHTML = '⚠️ Aucun Worker configuré — tentative avec proxy de secours…<br><span style="font-size:10px;color:#888">Configurez votre Worker dans Admin → Paramètres → OG Worker pour de meilleurs résultats.</span>';
  }

  // ══════════════════════════════════════
  //  MÉTHODE 2 — Fallback : allorigins.win
  // ══════════════════════════════════════
  try {
    await new Promise(r => setTimeout(r, 400)); // petit délai visuel
    const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(rawUrl);
    const resp2 = await Promise.race([
      fetch(proxyUrl),
      new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout 10s')), 10000))
    ]);
    if(!resp2.ok) throw new Error('Proxy allorigins indisponible');
    const json2 = await resp2.json();
    const html  = json2.contents || '';
    if(!html)   throw new Error('Page vide ou bloquée par le proxy');

    const parser = new DOMParser();
    const doc    = parser.parseFromString(html, 'text/html');

    const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content')
                 || doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content')
                 || doc.querySelector('title')?.textContent || '';
    const ogImg   = doc.querySelector('meta[property="og:image"]')?.getAttribute('content')
                 || doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content') || '';
    const ogDesc  = doc.querySelector('meta[property="og:description"]')?.getAttribute('content')
                 || doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';

    // Prix
    let ogPrice = null;
    const priceRegexes = [
      /([0-9]{1,6}[.,][0-9]{2})\s*€/,/€\s*([0-9]{1,6}[.,][0-9]{2})/,
      /\$\s*([0-9]{1,6}[.,][0-9]{2})/,/"price":\s*"?([0-9]{1,6}[.,][0-9]{0,2})"?/i
    ];
    for(const pat of priceRegexes) {
      const m = html.match(pat);
      if(m) { const v = parseFloat(m[1].replace(',','.')); if(v > 0.5 && v < 100000) { ogPrice = v; break; } }
    }

    const filled2 = fillFields(ogTitle.trim(), ogImg, ogDesc.trim(), ogPrice);
    if(filled2 === 0) throw new Error('Aucune donnée trouvée dans la page');

    statusEl.style.background = 'rgba(201,168,76,0.12)';
    statusEl.style.color      = '#e8c96a';
    statusEl.innerHTML = `⚡ ${filled2} champ(s) rempli(s) via proxy de secours — résultats partiels possibles.<br>
      <span style="font-size:10px;color:#888">Pour de meilleurs résultats sur Amazon/Etsy, configurez votre <a href="#" onclick="showAdmTab('settings',document.querySelector('.adm-nav-item:last-child'));return false;" style="color:#6c63ff">Cloudflare Worker</a>.</span>`;

  } catch(err2) {
    statusEl.style.background = 'rgba(192,57,43,0.12)';
    statusEl.style.color      = '#e74c3c';
    statusEl.innerHTML = `❌ Impossible de récupérer les informations (${err2.message}).<br>
      <span style="font-size:11px;color:#888">Remplissez les champs manuellement ou configurez votre <a href="#" onclick="showAdmTab('settings',document.querySelector('.adm-nav-item:last-child'));return false;" style="color:#6c63ff">Cloudflare Worker</a>.</span>`;
  }
}

/* ── Rendu du tableau admin ── */
function renderAffiliateTable() {
  const el = document.getElementById('affiliateTableBody');
  if(!el) return;
  if(!AFFILIATE_PRODUCTS.length) {
    el.innerHTML = '<div style="text-align:center;color:#555;padding:24px;font-size:13px">Aucun produit affilié. Ajoutez-en un ci-dessus.</div>';
    return;
  }
  el.innerHTML = AFFILIATE_PRODUCTS.map(p => {
    const actif = p.actif !== false;
    return `<div style="display:flex;align-items:center;gap:12px;padding:12px;border-bottom:1px solid var(--adm-border);${actif?'':'opacity:0.45'}">
      <img src="${p.img}" alt="${p.title}" style="width:54px;height:54px;object-fit:cover;border-radius:8px;flex-shrink:0;background:#1a1a28" onerror="this.src='https://images.unsplash.com/photo-1583001809873-a128495da465?w=100'">
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;color:#ddd;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.title}</div>
        <div style="font-size:11px;color:#e8c96a;margin-top:2px">${p.price || 'Prix non défini'}</div>
        <a href="${p.url}" target="_blank" rel="noopener" style="font-size:10px;color:#6c63ff;text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;max-width:260px" title="${p.url}">🔗 ${p.url.slice(0,50)}${p.url.length>50?'…':''}</a>
      </div>
      <div style="display:flex;align-items:center;gap:7px;flex-shrink:0">
        <label class="stock-toggle" title="${actif?'Désactiver':'Activer'}">
          <input type="checkbox" ${actif?'checked':''} onchange="toggleAffiliateStock(${p.id},this.checked)">
          <span class="stock-track"></span>
        </label>
        <span class="${actif?'stock-label-on':'stock-label-off'}" style="min-width:42px">${actif?'ACTIF':'INACTIF'}</span>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0">
        <button class="adm-btn adm-btn-primary adm-btn-sm" onclick="editAffiliateProduct(${p.id})" title="Modifier">✏️</button>
        <button class="adm-btn adm-btn-danger adm-btn-sm" onclick="deleteAffiliateProduct(${p.id})" title="Supprimer">🗑️</button>
      </div>
    </div>`;
  }).join('');
  (document.getElementById('aff-count')||{}).textContent = AFFILIATE_PRODUCTS.length;
}

/* ── Rendu de la page publique Affiliation ── */
function renderAffiliatePage() {
  // Relire depuis localStorage si disponible, sinon garder les données injectées dans le HTML (après publish GitHub)
  const stored = localStorage.getItem('fc_affiliates');
  if (stored) {
    try { AFFILIATE_PRODUCTS = JSON.parse(stored); } catch(e) {}
  }
  // Si localStorage vide mais que AFFILIATE_PRODUCTS est déjà rempli par l'injection GitHub → on garde
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

function renderBlogAffPicker() {
  const el = document.getElementById('bf-aff-picker');
  const none = document.getElementById('bf-aff-none');
  if(!el) return;
  const affs = AFFILIATE_PRODUCTS.filter(p => p.actif !== false);
  if(!affs.length) {
    el.innerHTML = '';
    if(none) none.style.display = 'block';
    return;
  }
  if(none) none.style.display = 'none';
  el.innerHTML = affs.map(p => {
    const sel = _selectedBlogAffs.includes(p.id);
    return `<div onclick="toggleBlogAff(${p.id})" style="cursor:pointer;border-radius:8px;border:2px solid ${sel?'var(--gold2)':'#2a2a3a'};background:${sel?'rgba(201,168,76,0.08)':'#12121a'};padding:6px;transition:all 0.2s;position:relative">
      <img src="${p.img}" alt="${p.title}" style="width:100%;height:70px;object-fit:cover;border-radius:5px;display:block" onerror="this.src='https://images.unsplash.com/photo-1583001809873-a128495da465?w=200'">
      <div style="font-size:10px;color:${sel?'var(--gold2)':'#aaa'};margin-top:4px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.title}</div>
      ${sel ? '<div style="position:absolute;top:4px;right:4px;background:var(--gold2);color:#000;border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700">✓</div>' : ''}
    </div>`;
  }).join('');
}

function toggleBlogAff(id) {
  const idx = _selectedBlogAffs.indexOf(id);
  if(idx > -1) _selectedBlogAffs.splice(idx, 1);
  else _selectedBlogAffs.push(id);
  renderBlogAffPicker();
}

function renderBlogAdm() {
  const el = document.getElementById('blogListAdm');
  if(!el) return;
  renderBlogAffPicker();
  el.innerHTML = BLOG_POSTS.map(p=>`
    <div class="blog-list-item">
      <img src="${p.img}" style="width:50px;height:50px;object-fit:cover;border-radius:6px;flex-shrink:0" alt="">
      <div class="blog-list-item-info">
        <div class="blog-list-item-title">${p.title}</div>
        <div class="blog-list-item-meta">${p.cat} · ${p.date||'2026'} · <span style="color:#6c63ff">${(p.keywords||'').split(',')[0]}</span>${p.affiliateIds&&p.affiliateIds.length?` · <span style="color:#e8c96a">🔗 ${p.affiliateIds.length} affilié(s)</span>`:''}</div>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0">
        <button class="adm-btn adm-btn-primary adm-btn-sm" onclick="editBlogPost(${p.id})">✏️</button>
        <button class="adm-btn adm-btn-danger adm-btn-sm" onclick="deleteBlogPost(${p.id})">🗑️</button>
      </div>
    </div>`).join('');
}

function saveBlogPost() {
  const title = document.getElementById('bf-title').value.trim();
  if(!title) { toast('Remplissez le titre','⚠️'); return; }
  // Priorité image : 1) base64 locale (fichier uploadé) 2) URL saisie 3) image par défaut
  const previewImgEl = document.getElementById('bf-img-preview').querySelector('img');
  const urlField = document.getElementById('bf-img').value.trim();
  let imgVal = urlField || 'https://images.unsplash.com/photo-1583001809873-a128495da465?w=800';
  // Priorité à la base64 uniquement si c'est bien une image locale uploadée
  if(previewImgEl && previewImgEl.src && previewImgEl.src.startsWith('data:image')) {
    imgVal = previewImgEl.src;
  }
  const post = {
    id: editingBlogId || Date.now(),
    title,
    cat: document.getElementById('bf-cat').value,
    img: imgVal,
    excerpt: document.getElementById('bf-excerpt').value || title,
    content: document.getElementById('bf-content').value || `<p>${title}</p>`,
    keywords: document.getElementById('bf-keywords').value,
    date: new Date().toISOString().split('T')[0],
    affiliateIds: [..._selectedBlogAffs]
  };
  if(editingBlogId) {
    const idx = BLOG_POSTS.findIndex(p=>p.id===editingBlogId);
    if(idx > -1) BLOG_POSTS[idx] = post;
    showSaveBanner('Blog', `Article modifié avec succès`);
  } else {
    BLOG_POSTS.unshift(post);
    showSaveBanner('Blog', `Article publié avec succès`);
  }
  // Sauvegarde persistante — images compressées (~80Ko) → persistent après fermeture navigateur
  try {
    localStorage.setItem('fc_blog', JSON.stringify(BLOG_POSTS));
  } catch(e) {
    try {
      ['fc_cart','fc_wish'].forEach(k => localStorage.removeItem(k));
      localStorage.setItem('fc_blog', JSON.stringify(BLOG_POSTS));
      toast('⚠️ Cache purgé pour libérer de l\'espace.');
    } catch(_) {
      toast('❌ Stockage plein. Supprimez quelques articles ou utilisez des URL externes.','⚠️');
    }
  }
  resetBlogForm();
  renderBlogAdm();
  if(typeof renderBlogGrid==="function") renderBlogGrid();
  if(typeof renderHomeBlog==="function") renderHomeBlog();
  (document.getElementById('dash-blog')||{}).textContent = BLOG_POSTS.length;

  saveDataJson();
}

function editBlogPost(id) {
  const p = BLOG_POSTS.find(x=>x.id===id);
  editingBlogId = id;
  _selectedBlogAffs = Array.isArray(p.affiliateIds) ? [...p.affiliateIds] : [];
  document.getElementById('bf-title').value = p.title;
  document.getElementById('bf-cat').value = p.cat;
  // Si image externe (pas base64), on met l'URL dans le champ texte
  if(p.img && !p.img.startsWith('data:')) {
    document.getElementById('bf-img').value = p.img;
  } else {
    document.getElementById('bf-img').value = '';
  }
  setBlogImgPreview(p.img); // Affiche l'aperçu (base64 ou URL)
  document.getElementById('bf-excerpt').value = p.excerpt;
  document.getElementById('bf-content').value = p.content;
  document.getElementById('bf-keywords').value = p.keywords||'';
  (document.getElementById('blogFormTitle')||{}).textContent = '✏️ Modifier l\'article';
  (document.getElementById('cancelBlogBtn')||{style:{}}).style.display ='block';
  renderBlogAffPicker();
  document.getElementById('blogFormTitle').scrollIntoView({behavior:'smooth'});
  document.getElementById('adm-blog-adm').scrollIntoView({behavior:'smooth'});
}

function deleteBlogPost(id) {
  if(!confirm('Supprimer cet article ?')) return;
  BLOG_POSTS = BLOG_POSTS.filter(p=>p.id!==id);
  localStorage.setItem('fc_blog', JSON.stringify(BLOG_POSTS));
  renderBlogAdm(); renderBlogGrid(); renderHomeBlog();
  toast('Article supprimé');

  saveDataJson();
}

function resetBlogForm() {
  editingBlogId = null;
  _selectedBlogAffs = [];
  ['bf-title','bf-img','bf-excerpt','bf-content','bf-keywords'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('bf-cat').value='guide';
  (document.getElementById('blogFormTitle')||{}).textContent ='✍️ Nouvel article';
  (document.getElementById('cancelBlogBtn')||{style:{}}).style.display ='none';
  // Réinitialise l'aperçu et le file input
  document.getElementById('bf-img-file').value='';
  (document.getElementById('bf-img-preview')||{}).innerHTML ='<span style="color:#555;font-size:12px">Aperçu de l\'image</span>';
  renderBlogAffPicker();
}

/* ── Blog: Upload image locale avec compression ── */
function handleBlogImageUpload(input) {
  const file = input.files[0];
  if(!file) return;
  if(file.size > 20 * 1024 * 1024) { toast('Image trop lourde (max 20 Mo)','⚠️'); input.value=''; return; }
  toast('Compression en cours… ⏳');
  // Max 1200×800px, qualité 0.72 → image hero légère et persistante
  compressImage(file, 1200, 800, 0.72, compressed => {
    document.getElementById('bf-img').value = '';
    setBlogImgPreview(compressed);
    toast('✅ Image compressée et prête — Publiez l\'article');
  });
}

function setBlogImgPreview(src) {
  const el = document.getElementById('bf-img-preview');
  if(!el) return;
  if(src && src.length > 4) {
    el.innerHTML = `<img src="${src}" style="width:100%;height:100%;object-fit:cover;border-radius:8px" alt="Aperçu">`;
  } else {
    el.innerHTML = '<span style="color:#555;font-size:12px">Aperçu de l\'image</span>';
  }
}

function prefillSeoArticle() {
  const templates = [
    { title:"Caftan Marocain Luxe 2026 — Tendances et Prix", cat:"seo", keywords:"caftan marocain luxe 2026, caftan prix, caftan tendance",
      excerpt:"Découvrez les tendances du caftan marocain luxe pour 2026. Prix, matières, couleurs : le guide complet.",
      content:`<h2>Introduction</h2><p>Le caftan marocain luxe connaît un regain d'intérêt mondial en 2026...</p><h2>Les Prix du Caftan Luxe</h2><p>Les prix varient de 2000 à 8000 MAD selon la qualité...</p><h2>Où Commander ?</h2><p>FaizaCaftan propose des caftans sur mesure livrés dans le monde entier.</p>` },
    { title:"Takchita Mariage Pas Cher — Guide 2026", cat:"mariage", keywords:"takchita mariage pas cher, takchita prix 2026",
      excerpt:"Comment trouver une belle takchita de mariage à prix abordable ? Notre guide complet 2026.",
      content:`<h2>Takchita Mariage Prix</h2><p>Une belle takchita ne doit pas nécessairement coûter une fortune...</p><h2>Notre Sélection</h2><p>Chez FaizaCaftan, nous proposons des takchitas dès 3000 MAD.</p>` },
    { title:"Comment Entretenir son Caftan Marocain ?", cat:"conseil", keywords:"entretien caftan, laver caftan, caftan soie entretien",
      excerpt:"Conseils d'experts pour entretenir votre caftan marocain et le garder comme neuf pendant des années.",
      content:`<h2>Entretien du Caftan</h2><p>Un caftan bien entretenu peut durer toute une vie...</p><h2>Lavage à la Main</h2><p>Toujours laver votre caftan à la main avec un savon doux...</p>` }
  ];
  const t = templates[Math.floor(Math.random()*templates.length)];
  document.getElementById('bf-title').value = t.title;
  document.getElementById('bf-cat').value = t.cat;
  document.getElementById('bf-keywords').value = t.keywords;
  document.getElementById('bf-excerpt').value = t.excerpt;
  document.getElementById('bf-content').value = t.content;
  document.getElementById('bf-img').value = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800';
  setBlogImgPreview('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800');
  toast('Modèle SEO chargé ! Personnalisez et publiez 📝');
}

/* ── Payments Admin ── */
function renderPaymentsTab() {
  const settings = localStorage.getItem('fc_settings') ? JSON.parse(localStorage.getItem('fc_settings')) : {};
  const paypal = settings.paypal || 'sdn.sebti@gmail.com';

  // PayPal status
  const el = document.getElementById('paypal-status-display');
  if(el) el.innerHTML = `🅿️ <strong style="color:#5ba3d9">${paypal}</strong> — <span style="color:#27ae60">✅ Compte configuré</span>`;
  const paypalEmailEl = document.getElementById('paypal-email-pay');
  if(paypalEmailEl) paypalEmailEl.value = paypal;

  // Taux
  const rate = parseFloat(localStorage.getItem('fc_mad_rate') || '0.093');
  const rateEl = document.getElementById('mad-rate');
  if(rateEl) rateEl.value = rate;

  // Stripe config
  const cfg = getStripeConfig();
  if(cfg.pk && document.getElementById('stripe-pk')) document.getElementById('stripe-pk').value = cfg.pk;
  if(cfg.sk && document.getElementById('stripe-sk')) document.getElementById('stripe-sk').value = cfg.sk;
  if(cfg.currency && document.getElementById('stripe-currency')) document.getElementById('stripe-currency').value = cfg.currency;
  if(cfg.mode && document.getElementById('stripe-mode')) document.getElementById('stripe-mode').value = cfg.mode;
  updateStripeStatusBadge();

  // Méthodes actives
  const pm = getPaymentMethods();
  if(document.getElementById('pm-whatsapp')) document.getElementById('pm-whatsapp').checked = pm.whatsapp !== false;
  if(document.getElementById('pm-paypal')) document.getElementById('pm-paypal').checked = pm.paypal !== false;
  if(document.getElementById('pm-card')) document.getElementById('pm-card').checked = !!pm.card;

  // Transactions
  renderTransactionsList();
}
function saveRate() {
  const rate = parseFloat(document.getElementById('mad-rate').value) || 0.093;
  localStorage.setItem('fc_mad_rate', rate.toString());
  showSaveBanner('PayPal', `Taux MAD→EUR mis à jour: 1 MAD = ${rate} EUR`);

  saveDataJson();
}

/* ── Orders Admin ── */

function renderOrdersTable() {
  const tb = document.getElementById('ordersTableBody');
  if(!tb) return;
  // Also populate the select
  const sel = document.getElementById('of-select-id');
  if(sel) {
    sel.innerHTML = '<option value="">— Choisir une commande —</option>' + ORDERS.map(o=>`<option value="${o.id}">${o.id} — ${o.name}</option>`).join('');
  }
  tb.innerHTML = ORDERS.map(o=>{
    const cur = o.history&&o.history.length>0 ? o.history[o.history.length-1] : null;
    const sc = STATUS_CLS[cur?cur.step:'En attente']||'sb-wait';
    const photoCount = o.history ? o.history.filter(h=>h.photo).length : 0;
    return `<tr>
      <td style="font-weight:700;color:#e8c96a">${o.id}</td>
      <td>${o.name}</td>
      <td style="max-width:180px;font-size:12px">${o.desc||'-'}</td>
      <td style="font-size:11px;color:#6c8">${o.email||'-'}</td>
      <td><span class="sb ${sc}">${cur?cur.step:'En attente'}</span></td>
      <td style="font-size:12px;color:#888">📷 ${photoCount}</td>
      <td><button class="adm-btn adm-btn-danger adm-btn-sm" onclick="deleteOrder('${o.id}')">🗑️</button></td>
    </tr>`;
  }).join('');
}

function onOrderSelect(id) {
  _orderPhotoBase64 = null;
  (document.getElementById('of-photo-preview')||{}).innerHTML = '<span style="color:#555;font-size:12px">Aperçu de la photo</span>';
  document.getElementById('of-photo-file').value = '';
  if(!id) return;
  const o = ORDERS.find(x=>x.id===id);
  if(!o) return;
  const cur = o.history&&o.history.length>0 ? o.history[o.history.length-1] : null;
  if(cur) {
    document.getElementById('of-step').value = cur.step;
    if(cur.photo) {
      (document.getElementById('of-photo-preview')||{}).innerHTML = `<img src="${cur.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:8px" alt="Photo étape">`;
    }
  }
}

function handleOrderPhotoUpload(input) {
  const file = input.files[0];
  if(!file) return;
  if(file.size > 20 * 1024 * 1024) { toast('Image trop lourde (max 20 Mo)','⚠️'); input.value=''; return; }
  toast('Compression en cours… ⏳');
  compressImage(file, 1000, 750, 0.75, compressed => {
    _orderPhotoBase64 = compressed;
    (document.getElementById('of-photo-preview')||{}).innerHTML = `<img src="${compressed}" style="width:100%;height:100%;object-fit:cover;border-radius:8px" alt="Photo étape">`;
    toast('✅ Photo prête');
  });
}

function saveOrderStep() {
  const id = document.getElementById('of-select-id').value;
  const step = document.getElementById('of-step').value;
  if(!id) { toast('Choisissez une commande','⚠️'); return; }
  const o = ORDERS.find(x=>x.id===id);
  if(!o) { toast('Commande introuvable','⚠️'); return; }
  const photo = _orderPhotoBase64 || (o.history&&o.history.length>0 ? o.history[o.history.length-1].photo : 'https://images.unsplash.com/photo-1583001809873-a128495da465?w=400');
  o.history = o.history || [];
  o.history.push({ step, photo, date: new Date().toLocaleDateString('fr-FR') });
  try {
    localStorage.setItem('fc_orders', JSON.stringify(ORDERS));
  } catch(e) {
    toast('❌ Stockage plein — supprimez des commandes ou utilisez des URL externes','⚠️'); return;
  }
  _orderPhotoBase64 = null;
  document.getElementById('of-photo-file').value = '';
  renderOrdersTable();
  (document.getElementById('dash-orders')||{}).textContent = ORDERS.length;
  showSaveBanner('Commande', `${id} — étape "${step}" mise à jour`);
}

function createOrderManual() {
  const id = document.getElementById('of-id').value.trim().toUpperCase();
  const name = document.getElementById('of-name').value.trim();
  const desc = document.getElementById('of-desc').value.trim();
  if(!id || !name) { toast('Remplissez le code et le nom','⚠️'); return; }
  const existing = ORDERS.find(o=>o.id===id);
  if(existing) { toast('Ce code existe déjà — utilisez "Mettre à jour"','⚠️'); return; }
  ORDERS.push({id, name, desc, email:'', history:[{step:'En attente', photo:'https://images.unsplash.com/photo-1583001809873-a128495da465?w=400', date: new Date().toLocaleDateString('fr-FR')}]});
  localStorage.setItem('fc_orders', JSON.stringify(ORDERS));
  document.getElementById('of-id').value='';
  document.getElementById('of-name').value='';
  document.getElementById('of-desc').value='';
  renderOrdersTable();
  (document.getElementById('dash-orders')||{}).textContent = ORDERS.length;
  showSaveBanner('Commande', `${id} créée avec succès`);
}

function saveOrder() { createOrderManual(); }

function deleteOrder(id) {
  if(!confirm('Supprimer cette commande ?')) return;
  ORDERS = ORDERS.filter(o=>o.id!==id);
  localStorage.setItem('fc_orders', JSON.stringify(ORDERS));
  renderOrdersTable();
  toast('Commande supprimée');
}

/* ── Ads Admin ── */
function renderAdsToggle() {
  const el = document.getElementById('adsToggleList');
  if(!el) return;
  el.innerHTML = document.getElementById('adsenseId') ? '' : '';
  document.getElementById('adsenseId').value = ADS_CONFIG.adsenseId || ADS_DEFAULTS.adsenseId;
  document.getElementById('adStrategy').value = ADS_CONFIG.strategy || 'blog_heavy';

  const zones = [
    { key:'home_top', label:"🏠 Accueil — Bandeau top", desc:"Bannière 728×90 juste après le hero" },
    { key:'between_products', label:"🛍 Entre les produits vedettes", desc:"Rectangle 336×280 au milieu de la home" },
    { key:'footer', label:"📋 Bas de page home", desc:"Bannière 728×90 avant le footer" },
    { key:'blog_top', label:"📝 Blog — Haut de la liste", desc:"Rectangle avant la liste d'articles (très efficace)" },
    { key:'blog_bottom', label:"📝 Blog — Bas de la liste", desc:"Bannière après la liste d'articles" },
  ];
  el.innerHTML = zones.map(z=>`
    <div class="toggle-row">
      <div class="toggle-info">
        <div class="toggle-label">${z.label}</div>
        <div class="toggle-desc">${z.desc}</div>
      </div>
      <label class="toggle-switch">
        <input type="checkbox" ${ADS_CONFIG[z.key]?'checked':''} onchange="toggleAd('${z.key}',this.checked)">
        <span class="toggle-slider"></span>
      </label>
    </div>`).join('');
}

function toggleAd(key, val) {
  ADS_CONFIG[key] = val;
  // Ensure adsenseId is never lost when saving
  if(!ADS_CONFIG.adsenseId) ADS_CONFIG.adsenseId = ADS_DEFAULTS.adsenseId;
  localStorage.setItem('fc_ads', JSON.stringify(ADS_CONFIG));
  applyAdsConfig();
  const labels = {'home_top':'Accueil top','between_products':'Entre produits','footer':'Pied de page','blog_top':'Blog haut','blog_bottom':'Blog bas'};
  showSaveBanner('Zone pub', `${labels[key]||key} ${val?'✅ activée':'❌ désactivée'}`);
}

function saveAdsConfig() {
  const newId = document.getElementById('adsenseId').value.trim();
  ADS_CONFIG.adsenseId = newId || ADS_DEFAULTS.adsenseId;
  ADS_CONFIG.strategy = document.getElementById('adStrategy').value;
  // Save merged object to localStorage
  localStorage.setItem('fc_ads', JSON.stringify(ADS_CONFIG));
  applyAdsConfig();
  renderAdsToggle();
  showSaveBanner('AdSense', `✅ ID sauvegardé: ${ADS_CONFIG.adsenseId}`);

  saveDataJson();
}

/* ── Promo Admin ── */
function renderPromoProductSelect() {
  const sel = document.getElementById('promo-product');
  if(!sel) return;
  sel.innerHTML = PRODUCTS.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
}

function savePromo() {
  const pId = parseInt(document.getElementById('promo-product').value);
  const pct = parseInt(document.getElementById('promo-pct').value);
  if(!pct || pct<1 || pct>80) { toast('Entrez une réduction valide (1-80%)','⚠️'); return; }
  const p = PRODUCTS.find(x=>x.id===pId);
  if(p) {
    p.old = p.price;
    p.price = Math.round(p.price * (1 - pct/100));
    p.badge = 'Promo';
    localStorage.setItem('fc_products', JSON.stringify(PRODUCTS));
    renderShop(); renderFeatured(); renderProductsTable();
    (document.getElementById('promoList')||{}).innerHTML = `
      <div style="background:#1a1a28;border-radius:8px;padding:12px;display:flex;gap:12px;align-items:center">
        <span style="color:#e8c96a;font-weight:700">${p.name}</span>
        <span class="adm-badge adm-badge-green">-${pct}%</span>
        <span style="color:#555;font-size:12px">${p.old?.toLocaleString()} → ${p.price.toLocaleString()} MAD</span>
      </div>`;
    showSaveBanner('Promotion', `-${pct}% appliqué sur ${p.name}`);
  }
}

/* ── Worker URL — Paramètres ── */
function saveWorkerUrl() {
  const url = document.getElementById('set-worker-url').value.trim();
  if(url && !url.startsWith('http')) { toast('L\'URL doit commencer par https://','⚠️'); return; }
  if(url) {
    localStorage.setItem(OG_WORKER_KEY, url);
    showSaveBanner('Worker', '✅ URL du Worker enregistrée');
  } else {
    localStorage.removeItem(OG_WORKER_KEY);
    toast('URL Worker supprimée','⚠️');
  }
  checkWorkerStatus();
}

function clearWorkerUrl() {
  localStorage.removeItem(OG_WORKER_KEY);
  document.getElementById('set-worker-url').value = '';
  toast('Worker supprimé');
  checkWorkerStatus();
}

async function testWorkerUrl() {
  const url = document.getElementById('set-worker-url').value.trim() || getWorkerUrl();
  const resEl = document.getElementById('worker-test-result');
  if(!url) { toast('Entrez d\'abord une URL de Worker','⚠️'); return; }
  resEl.style.display = 'block';
  resEl.style.color = '#c4bcff';
  resEl.textContent = '⏳ Test en cours…';
  try {
    const testUrl = url.replace(/\/$/, '') + '?url=https://www.amazon.fr/dp/B0XXXXXXXX';
    const resp = await Promise.race([
      fetch(testUrl),
      new Promise((_,rej)=>setTimeout(()=>rej(new Error('Timeout')),8000))
    ]);
    const data = await resp.json();
    if(resp.ok) {
      resEl.style.color = '#58d68d';
      resEl.textContent = '✅ Worker actif et accessible — prêt à utiliser !';
    } else {
      throw new Error(data.error || `HTTP ${resp.status}`);
    }
  } catch(e) {
    resEl.style.color = '#e74c3c';
    resEl.textContent = `❌ Erreur : ${e.message}. Vérifiez l'URL et que le Worker est bien déployé.`;
  }
}

function checkWorkerStatus() {
  const url = getWorkerUrl();
  const inputEl2 = document.getElementById('set-worker-url');
  if(inputEl2 && !inputEl2.value) inputEl2.value = localStorage.getItem(OG_WORKER_KEY) || '';
  const statusEl = document.getElementById('worker-status');
  if(!statusEl) return;
  if(url) {
    statusEl.innerHTML = `<span style="color:#58d68d">✅ Worker configuré : <code style="background:#1a1a28;padding:1px 6px;border-radius:4px;font-size:11px">${url.slice(0,60)}${url.length>60?'…':''}</code></span>`;
  } else {
    statusEl.innerHTML = '<span style="color:#e8c96a">⚠️ Aucun Worker configuré — l\'auto-remplissage utilisera le proxy de secours (moins fiable)</span>';
  }
  const inputEl = document.getElementById('set-worker-url');
  if(inputEl && !inputEl.value) inputEl.value = url;
}

/* ── Settings Admin ── */
async function saveSettings() {
  const pwd = document.getElementById('set-pwd').value;
  if(pwd) {
    adminPwdHash = await hashPwd(pwd);
    localStorage.setItem(ADMIN_PWD_KEY, adminPwdHash);
  }
  const settings = {
    name: document.getElementById('set-name').value,
    wa: document.getElementById('set-wa').value,
    email: document.getElementById('set-email').value,
    paypal: document.getElementById('set-paypal').value.trim() || 'sdn.sebti@gmail.com',
    addr: document.getElementById('set-addr').value,
  };
  // Stripe Payment Link
  const stripeLink = document.getElementById('set-stripe-link')?.value.trim();
  if(stripeLink) localStorage.setItem('fc_stripe_link', stripeLink);
  const seoTitle = document.getElementById('set-seo-title').value;
  const seoDesc = document.getElementById('set-seo-desc').value;
  if(seoTitle) document.title = seoTitle;
  document.querySelector('meta[name="description"]').setAttribute('content', seoDesc);
  localStorage.setItem('fc_settings', JSON.stringify(settings));
  showSaveBanner('Paramètres', 'Tous les paramètres sauvegardés');

  saveDataJson();
}

/* ── Revenue Chart ── */
function renderRevChart() {
  const el = document.getElementById('revChart');
  if(!el) return;
  const days = ['Lu','Ma','Me','Je','Ve','Sa','Di'];
  const vals = [2800,3200,1500,4500,6200,8400,5100];
  const max = Math.max(...vals);
  el.innerHTML = vals.map((v,i)=>`
    <div class="rev-bar-wrap">
      <div class="rev-bar" style="height:${Math.round((v/max)*100)}px" title="${v.toLocaleString()} MAD"></div>
      <div class="rev-bar-lbl">${days[i]}</div>
    </div>`).join('');
}


// ═══════════════════════════════════════════════════
// SAVE DATA.JSON — écrit directement sur le disque
// via le serveur local server.py (POST /save-data)
// ═══════════════════════════════════════════════════
async function saveDataJson() {
  // Build the full data object from current state
  const data = {
    products:    PRODUCTS,
    blog:        BLOG_POSTS,
    affiliates:  AFFILIATE_PRODUCTS,
    backgrounds: BACKGROUNDS,
    config: {
      version:      '2.0.0',
      last_updated: new Date().toISOString().split('T')[0]
    }
  };

  try {
    const res = await fetch('/save-data', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data)
    });
    const json = await res.json();
    if (json.ok) {
      toast('✅ data.json sauvegardé');
    } else {
      toast('⚠️ Erreur serveur : ' + json.msg);
    }
  } catch (e) {
    // Serveur non disponible — fallback localStorage
    console.warn('saveDataJson: serveur non disponible, fallback localStorage', e);
    try {
      localStorage.setItem('fc_products',   JSON.stringify(PRODUCTS));
      localStorage.setItem('fc_blog',       JSON.stringify(BLOG_POSTS));
      localStorage.setItem('fc_affiliates', JSON.stringify(AFFILIATE_PRODUCTS));
      toast('⚠️ Serveur inactif — sauvegardé en localStorage');
    } catch(le) {
      toast('❌ Impossible de sauvegarder');
    }
  }
}
