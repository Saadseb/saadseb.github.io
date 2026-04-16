/* ═══ CART — Panier, Checkout, Paiements ═══ */
/* ═══════════ CART ═══════════ */
function quickAdd(e, id) {
  e.stopPropagation();
  const p = PRODUCTS.find(x=>x.id===id);
  addToCartDirect(p, p.sizes[2]||p.sizes[0], p.colors[0], 1);
}
function addToCart(id) {
  const p = id ? PRODUCTS.find(x=>x.id===id) : selectedProduct;
  if(!p) return;
  addToCartDirect(p, selectedSize, selectedColor, qty);
  document.getElementById('productModal')?.classList.remove('open');
}
function addToCartDirect(p, size, color, q) {
  // Sécurisation : taille et couleur par défaut si non sélectionnées
  const safeSize  = size  || (p.sizes  && p.sizes[0])  || 'M';
  const safeColor = color || (p.colors && p.colors[0]) || '#c9a84c';
  const safeQty   = (q && q > 0) ? q : 1;
  const key = `${p.id}-${safeSize}-${safeColor}`;
  const ex = cart.find(x => x.key === key);
  if (ex) { ex.qty += safeQty; }
  else { cart.push({ key, id: p.id, name: p.name, price: p.price, img: p.img, size: safeSize, color: safeColor, qty: safeQty }); }
  saveCart();
  updateCartBadge();
  toast(`${p.name} ajouté au panier 🛍`);
}
function removeFromCart(key) {
  cart = cart.filter(x=>x.key!==key);
  saveCart(); updateCartBadge(); renderCart();
}
function saveCart() { localStorage.setItem('fc_cart', JSON.stringify(cart)); }
function updateCartBadge() {
  const total = cart.reduce((s,i)=>s+i.qty,0);
  const badge = document.getElementById('cartBadge'); if(badge) badge.textContent = total;
}
function openCart() {
  document.getElementById('cartOverlay')?.classList.add('open');
  document.getElementById('cartSidebar')?.classList.add('open');
  renderCart();
}
function closeCart() {
  document.getElementById('cartOverlay')?.classList.remove('open');
  document.getElementById('cartSidebar')?.classList.remove('open');
}
function toggleCart() {
  document.getElementById('cartOverlay')?.classList.toggle('open');
  document.getElementById('cartSidebar')?.classList.toggle('open');
  renderCart();
}
function renderCart() {
  const el = document.getElementById('cartItems');
  const ft = document.getElementById('cartFooter');
  if(!cart.length) {
    el.innerHTML=`<div class="cart-empty"><div class="cart-empty-icon">🛍</div>Votre panier est vide</div>`;
    ft.innerHTML=''; return;
  }
  el.innerHTML = cart.map(item=>`
    <div class="cart-item">
      <img src="${item.img}" alt="${item.name}" class="cart-item-img">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-meta">
          <span>T: ${item.size}</span>
          ${item.color ? `<span>·</span><span class="cart-item-color-dot" style="background:${item.color}"></span>` : ''}
        </div>
        <div class="cart-item-qty-row">
          <button class="cart-item-qty-btn" onclick="cartChangeQty('${item.key}',-1)">−</button>
          <span class="cart-item-qty-val">${item.qty}</span>
          <button class="cart-item-qty-btn" onclick="cartChangeQty('${item.key}',1)">+</button>
          <span class="cart-item-price" style="margin-left:6px">${(item.price*item.qty).toLocaleString()} MAD</span>
        </div>
      </div>
      <button class="cart-item-del" onclick="removeFromCart('${item.key}')">✕</button>
    </div>`).join('');
  const total = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const rate = parseFloat(localStorage.getItem('fc_mad_rate') || '0.093');
  const totalEUR = (total * rate).toFixed(2);
  const pm = getPaymentMethods();
  let btns = '';
  if(pm.card) {
    btns += `<button class="btn-checkout" onclick="openCheckout('stripe')" style="background:linear-gradient(135deg,#635bff,#3d35c0);margin-bottom:8px">
      💳 Payer par Carte (Visa / Mastercard)
    </button>`;
  }
  if(pm.paypal) {
    btns += `<button class="btn-checkout" onclick="openCheckout('paypal')" style="background:linear-gradient(135deg,#0070ba,#003087);margin-bottom:8px">
      🅿️ Payer avec PayPal
    </button>`;
  }
  if(pm.whatsapp) {
    btns += `<button class="btn-checkout" onclick="openCheckout('whatsapp')" style="background:linear-gradient(135deg,#25d366,#128c7e)">
      💬 Commander via WhatsApp
    </button>`;
  }
  // Badges cartes acceptées
  const cardBadges = pm.card ? `
    <div class="pay-methods-label">Cartes acceptées</div>
    <div class="pay-cards-row">
      <div class="pay-card-badge">
        <svg viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg"><rect width="38" height="24" rx="4" fill="#1A1F71"/><path d="M14.5 7h9L21 17h-9z" fill="#fff" opacity=".3"/><path d="M15.5 7l-4 10h3l.7-2h3.6l.7 2h3L19.5 7h-4zm-.2 6l1.2-3.5L17.7 13h-2.4z" fill="#fff"/></svg>
        VISA
      </div>
      <div class="pay-card-badge">
        <svg viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg"><rect width="38" height="24" rx="4" fill="#252525"/><circle cx="15" cy="12" r="7" fill="#EB001B"/><circle cx="23" cy="12" r="7" fill="#F79E1B"/><path d="M19 6.8a7 7 0 0 1 0 10.4A7 7 0 0 1 19 6.8z" fill="#FF5F00"/></svg>
        MC
      </div>
      <div class="pay-card-badge" style="font-size:10px;color:#888">🔒 Sécurisé</div>
    </div>` : '';
  // Cross-sell : produits boutique pas encore dans le panier
  const cartIds = cart.map(i=>i.id);
  const crossProds = PRODUCTS.filter(p => p.actif!==false && !cartIds.includes(p.id)).slice(0,4);

  // Produits affiliés actifs
  const activeAffs = (typeof AFFILIATE_PRODUCTS !== 'undefined' ? AFFILIATE_PRODUCTS : [])
    .filter(p => p.actif !== false).slice(0,3);

  const shopCardsHtml = crossProds.map(p=>`
    <div class="cross-sell-card">
      <img src="${p.img}" alt="${p.name}" loading="lazy" onclick="closeCart();openProduct(${p.id})">
      <div class="cross-sell-card-info">
        <div class="cross-sell-card-name">${p.name}</div>
        <div class="cross-sell-card-price">${p.price.toLocaleString()} MAD</div>
      </div>
      <button class="cross-sell-add" onclick="quickAddCross(event,${p.id})">+ Ajouter</button>
    </div>`).join('');

  const affCardsHtml = activeAffs.map(p=>`
    <div class="cross-sell-card" style="border:1px solid rgba(201,168,76,0.18);position:relative">
      <span style="position:absolute;top:6px;left:6px;background:var(--gold);color:var(--ink);font-size:9px;font-weight:700;letter-spacing:1px;padding:2px 6px;border-radius:4px;z-index:1">AFFILIÉ</span>
      <img src="${p.img||'https://via.placeholder.com/80x100?text=+'}" alt="${p.name}" loading="lazy" style="cursor:pointer" onclick="window.open('${p.url}','_blank')">
      <div class="cross-sell-card-info">
        <div class="cross-sell-card-name">${p.name}</div>
        <div class="cross-sell-card-price">${p.price ? p.price.toLocaleString()+' MAD' : 'Voir le prix'}</div>
      </div>
      <a href="${p.url}" target="_blank" rel="noopener sponsored"
         style="display:block;text-align:center;margin-top:6px;padding:6px 10px;border-radius:6px;
                background:linear-gradient(135deg,var(--gold),var(--gold-dim));
                color:var(--ink);font-size:11px;font-weight:700;text-decoration:none;transition:opacity 0.2s"
         onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
        Voir →
      </a>
    </div>`).join('');

  const allCards = shopCardsHtml + affCardsHtml;
  const crossHtml = allCards ? `
    <div class="cross-sell-wrap">
      <div class="cross-sell-title">✦ Vous aimerez aussi</div>
      <div class="cross-sell-list">${allCards}</div>
    </div>` : '';

  ft.innerHTML=`
    <div class="cart-total-row">
      <span class="cart-total-label">Total</span>
      <span class="cart-total-val">${total.toLocaleString()} MAD</span>
    </div>
    <div style="font-size:11px;color:var(--muted);text-align:center;margin-bottom:12px">≈ ${totalEUR} EUR</div>
    ${btns}
    ${cardBadges}
    <div style="font-size:11px;color:var(--muted);text-align:center;margin-top:10px">Livraison calculée à la commande</div>
    ${crossHtml}`;
}

function quickAddCross(e, id) {
  e.stopPropagation();
  const p = PRODUCTS.find(x=>x.id===id);
  if(!p) return;
  addToCartDirect(p, p.sizes[2]||p.sizes[0], p.colors[0], 1);
  renderCart();
}
function cartChangeQty(key, delta) {
  const idx = cart.findIndex(i=>i.key===key);
  if(idx===-1) return;
  cart[idx].qty = Math.max(1, cart[idx].qty + delta);
  saveCart(); updateCartBadge(); renderCart();
}
function checkout() {
  const total = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const lines = cart.map(i=>`- ${i.name} (${i.size}) x${i.qty}: ${(i.price*i.qty).toLocaleString()} MAD`).join('\n');
  const msg = `👗 *FaizaCaftan — Nouvelle Commande*\n\n${lines}\n\n💰 Total: ${total.toLocaleString()} MAD\n\nJe souhaite finaliser ma commande.`;
  const wa = localStorage.getItem('fc_settings') ? JSON.parse(localStorage.getItem('fc_settings')).wa || '491729092941' : '491729092941';
  window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`);
}
function checkoutPaypal() {
  const total = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const rate = parseFloat(localStorage.getItem('fc_mad_rate') || '0.093');
  const totalEUR = (total * rate).toFixed(2);
  const lines = cart.map(i=>`${i.name} x${i.qty}`).join(', ');
  const paypalEmail = localStorage.getItem('fc_settings') ? JSON.parse(localStorage.getItem('fc_settings')).paypal || 'sdn.sebti@gmail.com' : 'sdn.sebti@gmail.com';
  const note = encodeURIComponent(`FaizaCaftan — Commande: ${lines}`);
  window.open(`https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(paypalEmail)}&item_name=${note}&amount=${totalEUR}&currency_code=EUR&no_shipping=1`);
  const wa = localStorage.getItem('fc_settings') ? JSON.parse(localStorage.getItem('fc_settings')).wa || '491729092941' : '491729092941';
  const msg = `👗 *FaizaCaftan — Paiement PayPal*\n\n${cart.map(i=>`- ${i.name} (${i.size}) x${i.qty}: ${(i.price*i.qty).toLocaleString()} MAD`).join('\n')}\n\n💰 Total: ${total.toLocaleString()} MAD (≈${totalEUR} EUR)\n\n✅ Je viens de payer via PayPal. Merci de confirmer ma commande !`;
  setTimeout(() => window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`), 1500);
}
/* ═══ PAYMENT METHODS HELPERS ═══ */
function getPaymentMethods() {
  try { return JSON.parse(localStorage.getItem('fc_pay_methods') || '{"whatsapp":true,"paypal":true,"card":false}'); }
  catch(e) { return {whatsapp:true,paypal:true,card:false}; }
}
function savePaymentMethods() {
  const pm = {
    whatsapp: document.getElementById('pm-whatsapp')?.checked ?? true,
    paypal:   document.getElementById('pm-paypal')?.checked ?? true,
    card:     document.getElementById('pm-card')?.checked ?? false
  };
  localStorage.setItem('fc_pay_methods', JSON.stringify(pm));
  renderCart();
  showSaveBanner('Paiements', 'Méthodes de paiement mises à jour');
}

/* ═══ STRIPE CHECKOUT ═══ */
function checkoutStripe() {
  const cfg = getStripeConfig();
  if(!cfg.pk) {
    toast('⚠️ Clé Stripe non configurée — allez dans Admin > Paiements','⚠️');
    return;
  }
  const total = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const rate = parseFloat(localStorage.getItem('fc_mad_rate') || '0.093');
  const totalEUR = (total * rate).toFixed(2);
  const totalCents = Math.round(parseFloat(totalEUR) * 100);
  const currency = cfg.currency || 'eur';
  const items = cart.map(i=>`${i.name} x${i.qty}`).join(', ');

  // Enregistrer la transaction localement
  logTransaction({
    id: 'STR-' + Date.now(),
    type: 'stripe',
    method: 'Visa/Mastercard',
    amount: total,
    amountEUR: totalEUR,
    currency: currency.toUpperCase(),
    items,
    date: new Date().toLocaleString('fr-FR'),
    status: 'pending'
  });

  // Ouvrir Stripe Payment Link ou Stripe Checkout
  // En mode test/live, on génère un lien de paiement Stripe
  if(cfg.pk.startsWith('pk_test_') || cfg.pk.startsWith('pk_live_')) {
    // Construire URL Stripe Payment Link (nécessite Payment Link créé dans dashboard)
    const stripeLink = localStorage.getItem('fc_stripe_link');
    if(stripeLink) {
      window.open(stripeLink + '?prefilled_email=&client_reference_id=FC-' + Date.now());
    } else {
      // Fallback : afficher modal de saisie carte (démo)
      showStripeModal(totalEUR, currency, items);
    }
  }
}

function showStripeModal(amount, currency, items) {
  const existing = document.getElementById('stripeModal');
  if(existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'stripeModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;padding:16px';
  modal.innerHTML = `
    <div style="background:#0f0f1a;border:1px solid rgba(99,91,255,0.4);border-radius:16px;padding:28px;max-width:420px;width:100%;position:relative">
      <button onclick="document.getElementById('stripeModal').remove()" style="position:absolute;top:14px;right:14px;background:none;border:none;color:#555;font-size:18px;cursor:pointer">✕</button>
      <div style="text-align:center;margin-bottom:20px">
        <div style="font-size:28px;margin-bottom:6px">💳</div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:1.3rem;color:#e8c96a;font-weight:700">Paiement sécurisé</div>
        <div style="font-size:12px;color:#555;margin-top:4px">${items.substring(0,60)}${items.length>60?'...':''}</div>
        <div style="font-size:1.6rem;font-weight:700;color:#fff;margin-top:10px">${amount} ${currency.toUpperCase()}</div>
      </div>
      <div style="display:flex;gap:8px;justify-content:center;margin-bottom:20px">
        <div style="background:#1a1f71;border-radius:6px;padding:4px 12px;font-size:11px;color:#fff;font-weight:700">VISA</div>
        <div style="background:#252525;border-radius:6px;padding:4px 12px;font-size:11px;color:#fff;font-weight:700">MASTERCARD</div>
        <div style="background:#1a1a2e;border-radius:6px;padding:4px 12px;font-size:11px;color:#aaa;font-weight:700">🔒 SSL</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div>
          <label style="font-size:11px;color:#777;letter-spacing:1px;text-transform:uppercase">Numéro de carte</label>
          <input id="sc-num" placeholder="1234 5678 9012 3456" maxlength="19" style="width:100%;background:#1a1a28;border:1px solid #2a2a3a;color:#fff;border-radius:8px;padding:10px 12px;font-size:14px;margin-top:4px;letter-spacing:2px" oninput="formatCardNum(this)">
        </div>
        <div style="display:flex;gap:10px">
          <div style="flex:1">
            <label style="font-size:11px;color:#777;letter-spacing:1px;text-transform:uppercase">Expiration</label>
            <input id="sc-exp" placeholder="MM/AA" maxlength="5" style="width:100%;background:#1a1a28;border:1px solid #2a2a3a;color:#fff;border-radius:8px;padding:10px 12px;font-size:14px;margin-top:4px" oninput="formatExpiry(this)">
          </div>
          <div style="flex:1">
            <label style="font-size:11px;color:#777;letter-spacing:1px;text-transform:uppercase">CVV</label>
            <input id="sc-cvv" placeholder="123" maxlength="4" type="password" style="width:100%;background:#1a1a28;border:1px solid #2a2a3a;color:#fff;border-radius:8px;padding:10px 12px;font-size:14px;margin-top:4px">
          </div>
        </div>
        <div>
          <label style="font-size:11px;color:#777;letter-spacing:1px;text-transform:uppercase">Nom sur la carte</label>
          <input id="sc-name" placeholder="PRENOM NOM" style="width:100%;background:#1a1a28;border:1px solid #2a2a3a;color:#fff;border-radius:8px;padding:10px 12px;font-size:14px;margin-top:4px;text-transform:uppercase">
        </div>
      </div>
      <button onclick="submitStripeCard('${amount}','${currency}')" style="width:100%;margin-top:18px;padding:14px;background:linear-gradient(135deg,#635bff,#3d35c0);color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;letter-spacing:1px">
        🔒 Payer ${amount} ${currency.toUpperCase()} en toute sécurité
      </button>
      <div style="text-align:center;margin-top:12px;font-size:10px;color:#444">
        🔒 Paiement crypté SSL · Propulsé par Stripe · Données jamais stockées
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function formatCardNum(el) {
  let v = el.value.replace(/\D/g,'').substring(0,16);
  el.value = v.replace(/(\d{4})/g,'$1 ').trim();
}
function formatExpiry(el) {
  let v = el.value.replace(/\D/g,'');
  if(v.length>=2) v = v.substring(0,2) + '/' + v.substring(2,4);
  el.value = v;
}

function submitStripeCard(amount, currency) {
  const num = document.getElementById('sc-num').value.replace(/\s/g,'');
  const exp = document.getElementById('sc-exp').value;
  const cvv = document.getElementById('sc-cvv').value;
  const name = document.getElementById('sc-name').value;
  if(num.length < 16 || !exp.includes('/') || cvv.length < 3 || !name) {
    document.querySelectorAll('#stripeModal input').forEach(i=>i.style.borderColor='rgba(192,57,43,0.6)');
    setTimeout(()=>document.querySelectorAll('#stripeModal input').forEach(i=>i.style.borderColor='#2a2a3a'),1500);
    return;
  }
  // Simulation paiement Stripe (en production, utiliser Stripe.js)
  const btn = document.querySelector('#stripeModal button:last-of-type');
  btn.innerHTML = '⏳ Traitement en cours...';
  btn.disabled = true;
  setTimeout(()=>{
    document.getElementById('stripeModal').remove();
    // Marquer la dernière transaction comme payée
    updateLastTransaction('paid');
    toast('✅ Paiement accepté ! Commande confirmée.','✅');
    // Notifier via WhatsApp
    const total = cart.reduce((s,i)=>s+i.price*i.qty,0);
    const lines = cart.map(i=>`- ${i.name} (${i.size}) x${i.qty}: ${(i.price*i.qty).toLocaleString()} MAD`).join('\n');
    const wa = localStorage.getItem('fc_settings') ? JSON.parse(localStorage.getItem('fc_settings')).wa || '491729092941' : '491729092941';
    const msg = `💳 *FaizaCaftan — Paiement Carte*\n\n${lines}\n\n💰 Total: ${total.toLocaleString()} MAD (≈${amount} ${currency.toUpperCase()})\n\n✅ Paiement par carte bancaire effectué. Merci de confirmer !`;
    setTimeout(()=>window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`), 800);
    cart = []; saveCart(); updateCartBadge(); renderCart();
  }, 2200);
}

/* ═══ STRIPE ADMIN HELPERS ═══ */
function getStripeConfig() {
  try { return JSON.parse(localStorage.getItem('fc_stripe') || '{}'); }
  catch(e) { return {}; }
}
function saveStripeConfig() {
  const cfg = {
    pk: document.getElementById('stripe-pk').value.trim(),
    sk: document.getElementById('stripe-sk').value.trim(),
    currency: document.getElementById('stripe-currency').value,
    mode: document.getElementById('stripe-mode').value
  };
  if(!cfg.pk) { toast('Entrez votre clé Publishable Key Stripe','⚠️'); return; }
  localStorage.setItem('fc_stripe', JSON.stringify(cfg));
  // Activer auto le mode carte
  const pm = getPaymentMethods();
  pm.card = true;
  localStorage.setItem('fc_pay_methods', JSON.stringify(pm));
  if(document.getElementById('pm-card')) document.getElementById('pm-card').checked = true;
  renderCart();
  updateStripeStatusBadge();
  showSaveBanner('Stripe', 'Configuration Stripe sauvegardée — Visa/Mastercard activé');
}
function updateStripeStatusBadge() {
  const cfg = getStripeConfig();
  const badge = document.getElementById('stripe-status-badge');
  if(!badge) return;
  if(cfg.pk) {
    const mode = cfg.mode === 'live' ? '🚀 Production' : '🧪 Test';
    badge.className = 'stripe-status-badge active';
    badge.innerHTML = `● Configuré (${mode})`;
  } else {
    badge.className = 'stripe-status-badge inactive';
    badge.innerHTML = '● Non configuré';
  }
}
function testStripeConnection() {
  const cfg = getStripeConfig();
  const res = document.getElementById('stripe-test-result');
  if(!cfg.pk) { res.innerHTML = '<span style="color:#e74c3c">❌ Aucune clé configurée</span>'; return; }
  res.innerHTML = '<span style="color:#e8c96a">⏳ Test en cours...</span>';
  setTimeout(()=>{
    if(cfg.pk.startsWith('pk_test_') || cfg.pk.startsWith('pk_live_')) {
      res.innerHTML = '<span style="color:#27ae60">✅ Format de clé valide — activez le paiement carte et testez avec la carte test: 4242 4242 4242 4242</span>';
    } else {
      res.innerHTML = '<span style="color:#e74c3c">❌ Clé invalide — doit commencer par pk_test_ ou pk_live_</span>';
    }
  }, 1200);
}
function savePaypalEmail() {
  const email = document.getElementById('paypal-email-pay').value.trim();
  if(!email) { toast('Entrez un email PayPal','⚠️'); return; }
  const s = localStorage.getItem('fc_settings') ? JSON.parse(localStorage.getItem('fc_settings')) : {};
  s.paypal = email;
  localStorage.setItem('fc_settings', JSON.stringify(s));
  showSaveBanner('PayPal', 'Email PayPal mis à jour: ' + email);
  renderPaymentsTab();
}

/* ═══ TRANSACTIONS LOG ═══ */
function logTransaction(tx) {
  const txs = JSON.parse(localStorage.getItem('fc_transactions') || '[]');
  txs.unshift(tx);
  if(txs.length > 100) txs.splice(100);
  localStorage.setItem('fc_transactions', JSON.stringify(txs));
}
function updateLastTransaction(status) {
  const txs = JSON.parse(localStorage.getItem('fc_transactions') || '[]');
  if(txs.length > 0) { txs[0].status = status; localStorage.setItem('fc_transactions', JSON.stringify(txs)); }
}
function clearTransactions() {
  if(!confirm("Vider tout l'historique des transactions ?")) return;
  localStorage.removeItem('fc_transactions');
  renderTransactionsList();
  toast('Historique effacé');
}
function renderTransactionsList() {
  const el = document.getElementById('transactions-list');
  if(!el) return;
  const txs = JSON.parse(localStorage.getItem('fc_transactions') || '[]');
  if(!txs.length) {
    el.innerHTML = '<div style="text-align:center;color:#555;padding:20px;font-size:13px"><div style="font-size:2rem;margin-bottom:8px">📊</div>Aucune transaction enregistrée pour l\'instant.</div>';
    return;
  }
  el.innerHTML = txs.map(tx=>{
    const statusClass = tx.status==='paid'?'paid':tx.status==='pending'?'pending':'refund';
    const statusLabel = tx.status==='paid'?'Payé':tx.status==='pending'?'En attente':'Remboursé';
    const icon = tx.type==='stripe'?'💳':'🅿️';
    return `<div class="stripe-tx-row">
      <div>
        <div style="font-size:13px;font-weight:700;color:#e8c96a">${icon} ${tx.id}</div>
        <div style="font-size:11px;color:#555;margin-top:2px">${tx.date} · ${tx.method}</div>
        <div style="font-size:11px;color:#777;margin-top:2px;max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${tx.items}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:14px;font-weight:700;color:#fff">${tx.amountEUR || tx.amount} ${tx.currency||'MAD'}</div>
        <span class="stripe-tx-badge ${statusClass}" style="margin-top:4px;display:inline-block">${statusLabel}</span>
      </div>
    </div>`;
  }).join('');
}

/* ═══════════ CHECKOUT FORM ═══════════ */

function openCheckout(method) {
  if(!cart.length) { toast('Votre panier est vide','⚠️'); return; }
  _chkPayMethod = method;
  // Close cart sidebar first
  document.getElementById('cartOverlay')?.classList.remove('open');
  document.getElementById('cartSidebar')?.classList.remove('open');
  // Show step 1
  _chkShowStep(1);
  _chkRenderSummary();
  document.getElementById('checkoutModal')?.classList.add('open');
}

function closeCheckout() {
  document.getElementById('checkoutModal')?.classList.remove('open');
}

function _chkShowStep(n) {
  document.querySelectorAll('.checkout-step').forEach(s=>s.classList.remove('active'));
  document.getElementById('chk-step-'+n).classList.add('active');
}

function _chkRenderSummary() {
  const total = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const rate = parseFloat(localStorage.getItem('fc_mad_rate') || '0.093');
  const totalEUR = (total * rate).toFixed(2);
  const lines = cart.map(i=>`<div class="chk-summary-line"><span>${i.name} × ${i.qty}</span><span>${(i.price*i.qty).toLocaleString()} MAD</span></div>`).join('');
  const html = `${lines}<div class="chk-summary-total"><span>Total</span><span>${total.toLocaleString()} MAD <small style="font-weight:400;color:var(--muted)">(≈${totalEUR}€)</small></span></div>`;
  ['chk-summary-1','chk-summary-2'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML=html;});
}

function chkGoToPayment() {
  const prenom = document.getElementById('chk-prenom').value.trim();
  const nom = document.getElementById('chk-nom').value.trim();
  const email = document.getElementById('chk-email').value.trim();
  const adresse = document.getElementById('chk-adresse').value.trim();
  const ville = document.getElementById('chk-ville').value.trim();
  const pays = document.getElementById('chk-pays').value.trim();
  if(!prenom||!nom||!email||!adresse||!ville||!pays) {
    toast('Veuillez remplir tous les champs obligatoires','⚠️'); return;
  }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    toast('Adresse email invalide','⚠️'); return;
  }
  _chkRenderSummary();
  // Render pay buttons for step 2
  const pm = getPaymentMethods();
  const btnsEl = document.getElementById('chk-pay-btns');
  let btns = '';
  if(pm.card && (_chkPayMethod==='stripe'||_chkPayMethod==='card')) {
    btns += `<button class="btn-checkout-pay" onclick="chkProcessPayment('stripe')" style="background:linear-gradient(135deg,#635bff,#3d35c0)">💳 Payer par Carte</button>`;
  }
  if(pm.paypal && _chkPayMethod==='paypal') {
    btns += `<button class="btn-checkout-pay" onclick="chkProcessPayment('paypal')" style="background:linear-gradient(135deg,#0070ba,#003087)">🅿️ Payer avec PayPal</button>`;
  }
  if(pm.whatsapp && _chkPayMethod==='whatsapp') {
    btns += `<button class="btn-checkout-pay" onclick="chkProcessPayment('whatsapp')" style="background:linear-gradient(135deg,#25d366,#128c7e)">💬 Confirmer via WhatsApp</button>`;
  }
  // Fallback: show all available methods
  if(!btns) {
    if(pm.card) btns += `<button class="btn-checkout-pay" onclick="chkProcessPayment('stripe')" style="background:linear-gradient(135deg,#635bff,#3d35c0)">💳 Payer par Carte</button>`;
    if(pm.paypal) btns += `<button class="btn-checkout-pay" onclick="chkProcessPayment('paypal')" style="background:linear-gradient(135deg,#0070ba,#003087)">🅿️ Payer avec PayPal</button>`;
    if(pm.whatsapp) btns += `<button class="btn-checkout-pay" onclick="chkProcessPayment('whatsapp')" style="background:linear-gradient(135deg,#25d366,#128c7e)">💬 Commander via WhatsApp</button>`;
  }
  btnsEl.innerHTML = btns;
  _chkShowStep(2);
}

function chkBackToInfo() { _chkShowStep(1); }

function chkProcessPayment(method) {
  const prenom = document.getElementById('chk-prenom').value.trim();
  const nom = document.getElementById('chk-nom').value.trim();
  const email = document.getElementById('chk-email').value.trim();
  const adresse = document.getElementById('chk-adresse').value.trim();
  const ville = document.getElementById('chk-ville').value.trim();
  const pays = document.getElementById('chk-pays').value.trim();
  const total = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const rate = parseFloat(localStorage.getItem('fc_mad_rate') || '0.093');
  const totalEUR = (total * rate).toFixed(2);
  const lines = cart.map(i=>`- ${i.name} (${i.size}) ×${i.qty}: ${(i.price*i.qty).toLocaleString()} MAD`).join('\n');
  const wa = localStorage.getItem('fc_settings') ? JSON.parse(localStorage.getItem('fc_settings')).wa || '491729092941' : '491729092941';

  // Generate tracking code
  const trackCode = 'FC-' + Date.now().toString().slice(-6);

  // Save order to ORDERS
  const newOrder = {
    id: trackCode,
    name: prenom + ' ' + nom,
    desc: cart.map(i=>i.name).join(', '),
    email: email,
    adresse: adresse + ', ' + ville + ', ' + pays,
    total: total,
    history: [{ step: 'En attente', photo: 'https://images.unsplash.com/photo-1583001809873-a128495da465?w=400', date: new Date().toLocaleDateString('fr-FR') }]
  };
  ORDERS.push(newOrder);
  localStorage.setItem('fc_orders', JSON.stringify(ORDERS));

  // Process payment
  if(method === 'paypal') {
    const paypalEmail = localStorage.getItem('fc_settings') ? JSON.parse(localStorage.getItem('fc_settings')).paypal || 'sdn.sebti@gmail.com' : 'sdn.sebti@gmail.com';
    const note = encodeURIComponent(`FaizaCaftan — ${trackCode} — ${cart.map(i=>i.name+' x'+i.qty).join(', ')}`);
    window.open(`https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(paypalEmail)}&item_name=${note}&amount=${totalEUR}&currency_code=EUR&no_shipping=1`);
  } else if(method === 'stripe') {
    checkoutStripe();
  } else {
    // WhatsApp
    const msg = `👗 *FaizaCaftan — Nouvelle Commande*\n\n📌 Code: *${trackCode}*\n👤 ${prenom} ${nom}\n📧 ${email}\n📍 ${adresse}, ${ville}, ${pays}\n\n${lines}\n\n💰 Total: ${total.toLocaleString()} MAD (≈${totalEUR}€)\n\nMerci de confirmer ma commande !`;
    window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`);
  }

  // Send confirmation email via mailto
  const emailSubject = encodeURIComponent(`FaizaCaftan — Commande confirmée ${trackCode}`);
  const emailBody = encodeURIComponent(`Bonjour ${prenom},\n\nVotre commande FaizaCaftan a bien été enregistrée !\n\nCode de suivi : ${trackCode}\n\nProduits commandés :\n${lines}\n\nTotal : ${total.toLocaleString()} MAD\n\nAdresse de livraison : ${adresse}, ${ville}, ${pays}\n\nUtilisez votre code ${trackCode} sur https://faizacaftan.com/#suivi pour suivre l'avancement de votre commande étape par étape.\n\nMerci pour votre confiance !\n\nL'équipe FaizaCaftan 👗`);
  setTimeout(() => {
    window.open(`mailto:${email}?subject=${emailSubject}&body=${emailBody}`);
  }, 1000);

  // Show confirmation
  document.getElementById('chk-tracking-code').textContent = trackCode;
  document.getElementById('chk-confirm-email').textContent = email;
  document.getElementById('chk-confirm-recap').innerHTML = `
    <div style="margin-bottom:4px">👤 <strong>${prenom} ${nom}</strong></div>
    <div style="margin-bottom:4px">📍 ${adresse}, ${ville}, ${pays}</div>
    <div style="margin-bottom:4px">📦 ${cart.map(i=>i.name+' ×'+i.qty).join(', ')}</div>
    <div style="color:var(--gold2);font-weight:700">💰 ${total.toLocaleString()} MAD</div>`;
  // Clear cart
  cart = [];
  saveCart(); updateCartBadge();
  _chkShowStep(3);
}

function chkFinish() {
  closeCheckout();
  showPage('suivi');
}

function orderWhatsApp(id) {
  const p = PRODUCTS.find(x=>x.id===id);
  const wa = localStorage.getItem('fc_settings') ? JSON.parse(localStorage.getItem('fc_settings')).wa || '491729092941' : '491729092941';
  const msg = `👗 *FaizaCaftan*\n\nBonjour ! Je souhaite commander :\n\n- ${p.name}\n- Taille: ${selectedSize}\n- Prix: ${p.price.toLocaleString()} MAD\n\nMerci !`;
  window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`);
}

