/* ═══ MODAL — Fiche produit, galerie, zoom ═══ */
/* ═══════════ MODAL PRODUCT ═══════════ */
function openProduct(id) {
  const p = PRODUCTS.find(x=>x.id===id);
  selectedProduct = p;
  selectedSize = p.sizes[2]||p.sizes[0];
  selectedColor = p.colors[0];
  qty = 1;
  modalImgIndex = 0;
  renderModalGallery();
  renderModalInfo();
  document.getElementById('productModal').classList.add('open');
}

function renderModalGallery() {
  const p = selectedProduct;
  const imgs = p.images && p.images.length > 0 ? p.images : [p.img];
  const idx = Math.max(0, Math.min(modalImgIndex, imgs.length-1));
  modalImgIndex = idx;

  // Main image
  document.getElementById('modalImg').src = imgs[idx];
  document.getElementById('modalImg').alt = p.name;

  // Counter
  const counter = document.getElementById('modalImgCounter');
  if(imgs.length > 1) {
    counter.style.display='block';
    counter.textContent = `${idx+1} / ${imgs.length}`;
  } else {
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

