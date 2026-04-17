/* ═══ ANALYTICS — Stats, Reviews, Email, Tracking ═══ */

/* ═══════════ ADSENSE LOADER ═══════════ */
function loadAdsenseScript(onLoaded) {
  if (document.querySelector('script[src*="adsbygoogle"]')) {
    if (onLoaded) onLoaded();
    return;
  }
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + (ADS_CONFIG.adsenseId || ADS_DEFAULTS.adsenseId);
  script.crossOrigin = 'anonymous';
  if (onLoaded) script.onload = onLoaded;
  document.head.appendChild(script);
}

// Auto-load AdSense if user already accepted cookies (returning visitors)
document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('fc_cookies_choice') === 'accepted') {
    loadAdsenseScript(() => {
      if (typeof applyAdsConfig === 'function') applyAdsConfig();
    });
  }
});
/* ═══════════ KEYBOARD ═══════════ */
document.addEventListener('keydown', e => {
  if(e.key==='Enter' && document.activeElement===document.getElementById('trackCode')) chercher();
  if(e.key==='Escape') {
    ['productModal','zoomOverlay','mobileMenu'].forEach(id=>{const el=document.getElementById(id);if(el)el.classList.remove('open');});
  }
  const _pm=document.getElementById('productModal');
  if(_pm && _pm.classList.contains('open')) {
    if(e.key==='ArrowLeft') navModalImg(-1);
    if(e.key==='ArrowRight') navModalImg(1);
  }
});





/* ═══════════════════════════════════════════════════
   EMAIL POPUP
═══════════════════════════════════════════════════ */
const EMAIL_LIST_KEY = 'fc_email_list';

function getEmailList() {
  return JSON.parse(localStorage.getItem(EMAIL_LIST_KEY) || '[]');
}

function openEmailPopup() {
  if(localStorage.getItem('fc_popup_dismissed')) return;
  if(localStorage.getItem('fc_popup_done')) return;
  const popup = document.getElementById('emailPopup');
  if(!popup) return;
  // Masquer le cookie banner pendant que le popup est ouvert
  const cb = document.getElementById('cookieBanner');
  if(cb) cb.classList.remove('show');
  popup.classList.add('open');
  // Focus automatique sur l'input
  setTimeout(() => {
    const inp = document.getElementById('popupEmail');
    if(inp) inp.focus();
  }, 400);
}

function closeEmailPopup() {
  const popup = document.getElementById('emailPopup');
  if(!popup) return;
  popup.classList.remove('open');
  localStorage.setItem('fc_popup_dismissed', '1');
  // Réafficher le cookie banner si pas encore choisi
  const cb = document.getElementById('cookieBanner');
  if(cb && !localStorage.getItem('fc_cookies_choice')) cb.classList.add('show');
}

function submitEmailPopup() {
  const emailInput = document.getElementById('popupEmail');
  const email = emailInput ? emailInput.value.trim() : '';
  const res = document.getElementById('popupResult');

  // Validation
  if(!email || !email.includes('@') || !email.includes('.')) {
    if(res) { res.style.color='#e74c3c'; res.textContent='⚠️ Entrez un email valide'; }
    if(emailInput) emailInput.focus();
    return;
  }

  // Enregistrer l'email dans la liste
  const list = getEmailList();
  const already = list.find(e => e.email === email);
  if(!already) {
    const newEntry = {
      email,
      date: new Date().toLocaleDateString('fr-FR'),
      heure: new Date().toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'}),
      src: 'popup'
    };
    list.push(newEntry);
    localStorage.setItem(EMAIL_LIST_KEY, JSON.stringify(list));
    // Save to data.json via server.py
    saveEmailToDataJson(newEntry).catch(() => {});
  }

  // Copier le code promo
  navigator.clipboard?.writeText('BIENVENUE10').catch(()=>{});
  localStorage.setItem('fc_popup_done', '1');

  // Afficher message de succès dans le popup
  if(res) {
    res.style.color = '#58d68d';
    res.innerHTML = already
      ? '✅ Code <strong style="color:var(--gold2);letter-spacing:2px">BIENVENUE10</strong> copié !'
      : '✅ Email enregistré ! Code <strong style="color:var(--gold2);letter-spacing:2px">BIENVENUE10</strong> copié !';
  }

  // Toast visible partout
  toast(already ? 'Code BIENVENUE10 copié ! 🎁' : 'Email enregistré — Code BIENVENUE10 copié ! 🎁');

  // Fermer le popup après 2 secondes
  setTimeout(() => {
    closeEmailPopup();
    // Rafraîchir les stats admin si le panneau est ouvert
    const statsTab = document.getElementById('adm-stats');
    if(statsTab && statsTab.classList.contains('active')) renderStatsAdmin();
  }, 2000);
}

function copyPromoCode() {
  navigator.clipboard?.writeText('BIENVENUE10').catch(()=>{});
  toast('Code BIENVENUE10 copié ! 🎁');
}

/* ═══════════════════════════════════════════════════
   WHATSAPP FLOAT
═══════════════════════════════════════════════════ */
function openWhatsAppFloat() {
  const wa = localStorage.getItem('fc_settings')
    ? (JSON.parse(localStorage.getItem('fc_settings')).wa || '491729092941')
    : '491729092941';
  const msg = "Bonjour FaizaCaftan ! Je souhaite des informations sur vos caftans 👗";
  window.open('https://wa.me/' + wa + '?text=' + encodeURIComponent(msg), '_blank');
  trackAffClick('whatsapp_float', 'WhatsApp Contact');
}

/* ═══════════════════════════════════════════════════
   PROMO COUNTDOWN
═══════════════════════════════════════════════════ */
(function startCountdown() {
  const KEY = 'fc_promo_end';
  let end = parseInt(localStorage.getItem(KEY) || '0');
  if(!end || end < Date.now()) {
    end = Date.now() + 24 * 3600 * 1000; // 24h
    localStorage.setItem(KEY, end);
  }
  function tick() {
    const diff = Math.max(0, end - Date.now());
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    const pad = n => String(n).padStart(2, '0');
    const hEl = document.getElementById('cdH');
    const mEl = document.getElementById('cdM');
    const sEl = document.getElementById('cdS');
    if(hEl) hEl.textContent = pad(h);
    if(mEl) mEl.textContent = pad(m);
    if(sEl) sEl.textContent = pad(s);
    if(diff <= 0) {
      localStorage.removeItem(KEY);
      const b = document.getElementById('promoBanner');
      if(b) b.classList.add('hidden');
    }
  }
  tick();
  setInterval(tick, 1000);
})();

/* ═══════════════════════════════════════════════════
   AVIS CLIENTS
═══════════════════════════════════════════════════ */
const REVIEWS_KEY = 'fc_reviews';
let currentReviewStar = 5;

const DEFAULT_REVIEWS = [
  { name:'Fatima Z.', star:5, text:'Magnifique caftan, broderies impeccables. La qualité est extraordinaire, je recommande vivement !', date:'mars 2026', product:'Caftan Royal', verified:true },
  { name:'Samira K.', star:5, text:'Reçu pour mon mariage, toutes mes invitées ont adoré. Livraison rapide et emballage soigné.', date:'fév. 2026', product:'Takchita Mariage', verified:true },
  { name:'Nadia B.', star:4, text:'Très belle qualité, couleurs fidèles aux photos. Je commanderai à nouveau !', date:'janv. 2026', product:'Caftan Luxe', verified:false },
];

function getReviews() {
  return JSON.parse(localStorage.getItem(REVIEWS_KEY) || 'null') || DEFAULT_REVIEWS;
}

function setReviewStar(n) {
  currentReviewStar = n;
  document.querySelectorAll('.star-btn').forEach((b, i) => {
    b.classList.toggle('active', i < n);
  });
}

function submitReview() {
  const name = document.getElementById('rv-name')?.value.trim();
  const text = document.getElementById('rv-text')?.value.trim();
  const product = document.getElementById('rv-product')?.value.trim();
  if(!name || !text) { toast('Remplissez votre prénom et votre avis','⚠️'); return; }
  const reviews = getReviews();
  reviews.unshift({
    name, star: currentReviewStar, text,
    date: new Date().toLocaleDateString('fr-FR', {month:'short', year:'numeric'}),
    product: product || '',
    verified: false
  });
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  renderReviews();
  document.getElementById('rv-name').value = '';
  document.getElementById('rv-text').value = '';
  document.getElementById('rv-product').value = '';
  setReviewStar(5);
  toast('Merci pour votre avis ! ⭐');
}

function renderReviews() {
  const el = document.getElementById('reviewsList');
  if(!el) return;
  const reviews = getReviews();

  // Stats
  const avg = reviews.reduce((s,r)=>s+r.star,0) / reviews.length;
  const avgEl = document.getElementById('avgRating');
  const starsEl = document.getElementById('avgStars');
  const totalEl = document.getElementById('totalReviews');
  if(avgEl) avgEl.textContent = avg.toFixed(1);
  if(starsEl) starsEl.textContent = '★'.repeat(Math.round(avg)) + '☆'.repeat(5-Math.round(avg));
  if(totalEl) totalEl.textContent = reviews.length + ' avis';

  // Barres par étoile
  const barsEl = document.getElementById('ratingBars');
  if(barsEl) {
    barsEl.innerHTML = [5,4,3,2,1].map(s => {
      const cnt = reviews.filter(r=>r.star===s).length;
      const pct = reviews.length ? Math.round((cnt/reviews.length)*100) : 0;
      return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
        <span style="font-size:11px;color:var(--muted);width:20px;text-align:right">${s}★</span>
        <div style="flex:1;height:6px;background:var(--ink4);border-radius:3px;overflow:hidden">
          <div style="width:${pct}%;height:100%;background:var(--gold2);border-radius:3px;transition:width 0.5s"></div>
        </div>
        <span style="font-size:11px;color:var(--muted);width:28px">${cnt}</span>
      </div>`;
    }).join('');
  }

  // Liste
  el.innerHTML = reviews.map(r => `
    <div class="review-card">
      <div class="review-card-header">
        <div class="review-avatar">${r.name[0].toUpperCase()}</div>
        <div>
          <div class="review-name">${r.name}${r.product?` <span style="font-size:10px;color:var(--muted);font-weight:400">· ${r.product}</span>`:''}</div>
          <div class="review-date">${r.date}</div>
        </div>
        ${r.verified ? '<span class="review-badge-verified">✓ Achat vérifié</span>' : ''}
      </div>
      <div class="review-stars">${'★'.repeat(r.star)}${'☆'.repeat(5-r.star)}</div>
      <p class="review-text" style="margin-top:6px">${r.text}</p>
    </div>`).join('');
}

function clearReviews() {
  if(!confirm('Effacer tous les avis ?')) return;
  localStorage.removeItem(REVIEWS_KEY);
  renderReviews();
  toast('Avis effacés');
}

/* ═══════════════════════════════════════════════════
   STATS ADMIN
═══════════════════════════════════════════════════ */
const VISITS_KEY  = 'fc_visits';
const CLICKS_KEY  = 'fc_aff_clicks';

function trackVisit() {
  const today = new Date().toLocaleDateString('fr-FR');
  const visits = JSON.parse(localStorage.getItem(VISITS_KEY) || '{}');
  visits[today] = (visits[today] || 0) + 1;
  // Garder 30 jours max
  const keys = Object.keys(visits).slice(-30);
  const trimmed = {};
  keys.forEach(k => trimmed[k] = visits[k]);
  localStorage.setItem(VISITS_KEY, JSON.stringify(trimmed));
}

function trackAffClick(url, title) {
  const clicks = JSON.parse(localStorage.getItem(CLICKS_KEY) || '[]');
  clicks.unshift({ url, title, date: new Date().toLocaleString('fr-FR') });
  localStorage.setItem(CLICKS_KEY, JSON.stringify(clicks.slice(0, 100)));
}

function renderStatsAdmin() {
  const visits = JSON.parse(localStorage.getItem(VISITS_KEY) || '{}');
  const emails  = getEmailList();
  const reviews = getReviews();
  const clicks  = JSON.parse(localStorage.getItem(CLICKS_KEY) || '[]');
  const orders  = ORDERS.length;
  const today   = new Date().toLocaleDateString('fr-FR');
  const todayV  = visits[today] || 0;
  const totalV  = Object.values(visits).reduce((s,v)=>s+v, 0);

  // Stat cards
  const grid = document.getElementById('statsGrid');
  if(grid) grid.innerHTML = [
    { icon:'👁', val: totalV, lbl:'Vues totales', trend:'↑ ce mois', cls:'up' },
    { icon:'📅', val: todayV, lbl:"Aujourd'hui", trend:'visites', cls:'up' },
    { icon:'💌', val: emails.length, lbl:'Emails collectés', trend:'abonnés', cls:'up' },
    { icon:'⭐', val: reviews.length, lbl:'Avis clients', trend:'publiés', cls:'up' },
    { icon:'🔗', val: clicks.length, lbl:'Clics affiliés', trend:'total', cls:'warn' },
    { icon:'📦', val: orders, lbl:'Commandes', trend:'enregistrées', cls:'up' },
  ].map(s => `
    <div class="stat-mini">
      <div style="font-size:1.5rem;margin-bottom:6px">${s.icon}</div>
      <div class="stat-mini-val">${s.val}</div>
      <div class="stat-mini-lbl">${s.lbl}</div>
      <div class="stat-mini-trend ${s.cls}">${s.trend}</div>
    </div>`).join('');

  // Sparkline visites 7j
  const spark = document.getElementById('visitSparkline');
  const labels = document.getElementById('sparkLabels');
  if(spark) {
    const days7 = [...Array(7)].map((_,i) => {
      const d = new Date(); d.setDate(d.getDate()-6+i);
      return d.toLocaleDateString('fr-FR');
    });
    const vals = days7.map(d => visits[d] || 0);
    const max = Math.max(...vals, 1);
    spark.innerHTML = vals.map((v,i) => `
      <div class="spark-bar" style="height:${Math.round((v/max)*36)+4}px" title="${days7[i]}: ${v} visite(s)"></div>`).join('');
    if(labels) labels.innerHTML = days7.map(d => `<span>${d.split('/').slice(0,2).join('/')}</span>`).join('');
  }

  // Clics affiliés
  const affEl = document.getElementById('affClicksTable');
  if(affEl) {
    affEl.innerHTML = clicks.length ? clicks.slice(0,10).map(cl=>`
      <div style="padding:8px 0;border-bottom:1px solid var(--adm-border);display:flex;gap:10px;align-items:center">
        <div style="flex:1;font-size:12px;color:#ddd;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${cl.title||cl.url}</div>
        <div style="font-size:10px;color:#555;flex-shrink:0">${cl.date}</div>
      </div>`).join('')
    : '<div style="color:#555;padding:12px 0;font-size:13px">Aucun clic affilié enregistré</div>';
  }

  // Emails
  const emailEl = document.getElementById('emailListAdmin');
  const emailCountEl = document.getElementById('emailCount');
  if(emailCountEl) emailCountEl.textContent = emails.length;
  if(emailEl) {
    emailEl.innerHTML = emails.length ? emails.map(e=>`
      <div style="padding:6px 0;border-bottom:1px solid #1a1a28;display:flex;justify-content:space-between">
        <span style="color:#ddd">${e.email}</span>
        <span style="color:#555;font-size:10px">${e.date} · ${e.src||'site'}</span>
      </div>`).join('')
    : '<div style="color:#555;padding:8px 0">Aucun email collecté</div>';
  }

  // Avis admin
  const rvAdmEl = document.getElementById('reviewsAdmin');
  const rvCntEl = document.getElementById('reviewCountAdmin');
  if(rvCntEl) rvCntEl.textContent = reviews.length;
  if(rvAdmEl) {
    rvAdmEl.innerHTML = reviews.map(r=>`
      <div style="padding:8px 0;border-bottom:1px solid #1a1a28">
        <span style="color:var(--adm-gold)">${'★'.repeat(r.star)}</span>
        <span style="color:#ddd;font-size:12px;margin-left:6px">${r.name}</span>
        <span style="color:#555;font-size:10px;margin-left:8px">${r.date}</span>
        <div style="color:#777;font-size:11px;margin-top:3px">${r.text.slice(0,80)}${r.text.length>80?'…':''}</div>
      </div>`).join('');
  }
}

function exportEmails() {
  const emails = getEmailList();
  if(!emails.length) { toast('Aucun email à exporter','⚠️'); return; }
  const rows = ['Email,Date,Source'].concat(emails.map(function(e){ return e.email+','+e.date+','+(e.src||'site'); }));
  const csv = rows.join(String.fromCharCode(10));
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'faizacaftan_emails.csv'; a.click();
  URL.revokeObjectURL(url);
  toast('CSV exporté ✅');
}

/* ── Tracking clics affiliés ── */
function addAffTracking() {
  setTimeout(() => {
    document.querySelectorAll('#affiliateGrid a[href]').forEach(a => {
      a.addEventListener('click', () => {
        const p = AFFILIATE_PRODUCTS.find(x => x.url && a.href.includes(x.url.slice(0,30)));
        trackAffClick(a.href, p ? p.title : a.href.slice(0,40));
      }, {once:true});
    });
  }, 150);
}



// ── Cookie Banner ──────────────────────────────────────────────────────────
function showCookieBanner() {
  if (localStorage.getItem('fc_cookies_choice')) return; // already chose
  const banner = document.getElementById('cookieBanner');
  if (banner) {
    setTimeout(() => banner.classList.add('show'), 1500);
  }
}

function acceptCookies() {
  localStorage.setItem('fc_cookies_choice', 'accepted');
  const banner = document.getElementById('cookieBanner');
  if (banner) banner.classList.remove('show');
  // Load AdSense then inject ad slots
  loadAdsenseScript(() => {
    if (typeof applyAdsConfig === 'function') applyAdsConfig();
  });
}

function rejectCookies() {
  localStorage.setItem('fc_cookies_choice', 'rejected');
  const banner = document.getElementById('cookieBanner');
  if (banner) banner.classList.remove('show');
}

function closePolicyModal() {
  const el = document.getElementById('policyModal');
  if(el) el.classList.remove('open');
}
