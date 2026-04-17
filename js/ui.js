/* ═══ UI — Menu mobile, Toast, Bannière, Ads ═══ */
/* ═══════════ WISHLIST ═══════════ */
function toggleWish(e, id) {
  e.stopPropagation();
  const idx = wishlist.indexOf(id);
  if(idx>-1) wishlist.splice(idx,1);
  else wishlist.push(id);
  localStorage.setItem('fc_wish', JSON.stringify(wishlist));
  renderFeatured(); renderShop();
  toast(idx>-1 ? 'Retiré des favoris' : 'Ajouté aux favoris ❤️');
}

/* ═══════════ SUIVI ═══════════ */
function chercher() {
  const code = document.getElementById('trackCode').value.trim();
  const res = document.getElementById('trackResult');
  if(!code) { toast('Entrez un code de commande','⚠️'); return; }
  const o = ORDERS.find(x=>x.id===code);
  if(!o) {
    res.innerHTML=`<div style="background:var(--ink3);border:1px solid rgba(192,57,43,0.3);border-radius:var(--r);padding:24px;text-align:center;color:var(--red)">
      <div style="font-size:2rem;margin-bottom:8px">❌</div>
      <div style="font-weight:700">Commande introuvable</div>
      <div style="font-size:12px;color:var(--muted);margin-top:4px">Vérifiez votre code. Ex: FC-001</div>
    </div>`; return;
  }
  const cur = o.history&&o.history.length>0 ? o.history[o.history.length-1] : null;
  const stepIdx = STEPS_ALL.indexOf(cur?cur.step:"En attente");
  const pct = Math.round((Math.max(0,stepIdx)/(STEPS_ALL.length-1))*100);
  const sc = STATUS_CLS[cur?cur.step:'En attente']||'sb-wait';
  res.innerHTML=`
    <div class="track-card">
      ${cur?`<img src="${cur.photo}" class="track-hero" style="cursor:zoom-in" onclick="zoomPhoto(this.src)" loading="lazy">`
        :`<div class="track-hero-empty"><div style="font-size:32px">📷</div>Aucune photo disponible</div>`}
      <div class="track-body">
        <div class="track-title">${o.desc}</div>
        <div class="track-meta"><span>👤 ${o.name}</span><span>📌 ${o.id}</span></div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
          <span class="sb ${sc}">${cur?cur.step:'En attente'}</span>
          <span style="font-size:11px;color:var(--muted)">Étape ${Math.max(0,stepIdx)} / ${STEPS_ALL.length-1}</span>
          <span style="margin-left:auto;font-size:13px;font-weight:700;color:var(--gold2)">${pct}%</span>
        </div>
        <div class="progress-steps">
          ${STEPS_ALL.slice(1).map((s,i)=>{
            const ri=i+1; const cls=ri<stepIdx?'done':ri===stepIdx?'active':'';
            return `<div class="ps ${cls}" title="${s}"></div>`;
          }).join('')}
        </div>
        ${o.history&&o.history.length>0?`
        <hr class="div">
        <div style="font-size:10px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;margin-bottom:10px">Historique des étapes</div>
        <div class="timeline">
          ${o.history.map((h,i)=>`
            <div class="tl-item ${i===o.history.length-1?'last':''}">
              <div class="tl-card">
                <img src="${h.photo}" class="tl-img" style="cursor:zoom-in" onclick="zoomPhoto(this.src)" loading="lazy">
                <div class="tl-info">
                  <div class="tl-step">${h.step}</div>
                  <div class="tl-idx">Étape ${i+1} sur ${o.history.length}${h.date?' · '+h.date:''}</div>
                </div>
              </div>
            </div>`).join('')}
        </div>`:''} 
      </div>
    </div>`;
}

function zoomImg() {
  const imgs = selectedProduct ? selectedProduct.images || [selectedProduct.img] : [];
  const src = imgs[modalImgIndex] || (imgs[0] || '');
  if(src) zoomPhoto(src);
}
function zoomPhoto(src) {
  document.getElementById('zoomImg').src = src;
  document.getElementById('zoomOverlay').classList.add('open');
}

/* ═══════════ CONTACT ═══════════ */
function sendContact() {
  const name = document.getElementById('cf-name').value.trim();
  const email = document.getElementById('cf-email').value.trim();
  const subject = document.getElementById('cf-subject').value;
  const msg = document.getElementById('cf-msg').value.trim();
  if(!name||!email||!msg) { toast('Remplissez tous les champs','⚠️'); return; }
  const wa = localStorage.getItem('fc_settings') ? JSON.parse(localStorage.getItem('fc_settings')).wa || '491729092941' : '491729092941';
  const text = `👗 *FaizaCaftan — Contact*\n\n👤 ${name}\n📧 ${email}\n📋 ${subject}\n\n💬 ${msg}`;
  window.open(`https://wa.me/${wa}?text=${encodeURIComponent(text)}`);
  toast('Message envoyé ! Nous vous répondrons sous 24h ✅');
}

/* ═══════════ MOBILE MENU ═══════════ */
function toggleMobileMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
}


/* ═══════════ SAVE BANNER ═══════════ */
function showSaveBanner(category, message) {
  const banner = document.getElementById('saveBanner');
  if (!banner) { toast(category + ' — ' + message); return; }
  const prog   = document.getElementById('saveBannerProgress');
  const sbCat  = document.getElementById('sbCategory');
  const sbMsg  = document.getElementById('sbMessage');
  const sbTime = document.getElementById('sbTime');
  if (sbCat)  sbCat.textContent  = category;
  if (sbMsg)  sbMsg.textContent  = message;
  if (sbTime) sbTime.textContent = new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  banner.classList.add('show');
  if (prog) {
    prog.classList.remove('running');
    void prog.offsetWidth;
    prog.classList.add('running');
  }
  clearTimeout(_bannerTimer);
  _bannerTimer = setTimeout(() => banner.classList.remove('show'), 3500);
  toast(message);
}
function closeSaveBanner() {
  document.getElementById('saveBanner').classList.remove('show');
  clearTimeout(_bannerTimer);
}

/* ═══════════ TOAST ═══════════ */
function toast(msg, icon='✅') {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%) translateY(20px);background:#1e1e2e;color:#fff;padding:12px 24px;border-radius:40px;font-size:13px;z-index:9999;opacity:0;transition:all 0.3s;pointer-events:none;border:1px solid rgba(108,99,255,0.3);white-space:nowrap';
    document.body.appendChild(t);
  }
  t.textContent = (icon==='✅'?'':icon+' ')+msg;
  t.style.opacity = '1';
  t.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(20px)';
  }, 3000);
}

/* ═══════════ ADS CONFIG ═══════════ */
function applyAdsConfig() {
  const zones = {
    'ad-home_top':          ADS_CONFIG.home_top,
    'ad-between_products':  ADS_CONFIG.between_products,
    'ad-footer':            ADS_CONFIG.footer,
    'ad-blog_top':          ADS_CONFIG.blog_top,
    'ad-blog_bottom':       ADS_CONFIG.blog_bottom,
  };
  const pubId = ADS_CONFIG.adsenseId || ADS_DEFAULTS.adsenseId;
  // Only inject if AdSense script is present
  const adsenseReady = !!document.querySelector('script[src*="adsbygoogle"]');

  Object.entries(zones).forEach(([id, active]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('hidden', !active);
    if (active && pubId && adsenseReady && !el.querySelector('.adsbygoogle')) {
      // Clear any legacy Adsterra or placeholder content
      el.innerHTML = '<ins class="adsbygoogle" style="display:block;width:100%;min-height:90px" data-ad-client="' + pubId + '" data-ad-format="auto" data-full-width-responsive="true"></ins>';
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch(e) { console.warn('AdSense push error:', e); }
    }
  });
}

