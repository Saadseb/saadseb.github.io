/* ═══ GITHUB — Publication complète vers GitHub Pages ═══ */

const GH_RAW       = `https://raw.githubusercontent.com/${GH_USER}/${GH_REPO}/main`;
const GH_API       = `https://api.github.com/repos/${GH_USER}/${GH_REPO}/contents`;

// ── UI helpers ─────────────────────────────────────────────────────────────
function saveGhToken() {
  const t = document.getElementById('gh-token')?.value?.trim();
  if (!t) { toast('Token vide ⚠️'); return; }
  localStorage.setItem(GH_TOKEN_KEY, t);
  toast('✅ Token GitHub sauvegardé');
  checkGhTokenStatus();
}

async function checkGhTokenStatus() {
  const token = localStorage.getItem(GH_TOKEN_KEY);
  const el    = document.getElementById('gh-token-status');
  if (!el) return;
  if (!token) { el.innerHTML = '<span style="color:#e74c3c">❌ Aucun token</span>'; return; }
  try {
    const r = await fetch('https://api.github.com/user',
      { headers: { Authorization: `token ${token}` } });
    if (r.ok) {
      const u = await r.json();
      el.innerHTML = `<span style="color:#58d68d">✅ Connecté en tant que <strong>${u.login}</strong></span>`;
    } else {
      el.innerHTML = '<span style="color:#e74c3c">❌ Token invalide</span>';
    }
  } catch(e) {
    el.innerHTML = '<span style="color:#e74c3c">❌ Erreur réseau</span>';
  }
}

// ── Core GitHub API ────────────────────────────────────────────────────────
async function ghGetSha(token, path) {
  const r = await fetch(`${GH_API}/${path}`,
    { headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' } });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`GET ${path} → ${r.status}`);
  const d = await r.json();
  return d.sha || null;
}

async function ghPutFile(token, path, contentB64, sha, message) {
  const body = { message, content: contentB64 };
  if (sha) body.sha = sha;
  const r = await fetch(`${GH_API}/${path}`, {
    method:  'PUT',
    headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json',
                Accept: 'application/vnd.github.v3+json' },
    body: JSON.stringify(body)
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(`PUT ${path} → ${r.status}: ${e.message || r.statusText}`);
  }
  return await r.json();
}

// Convert local image path → base64
async function imageToBase64(localPath) {
  const r = await fetch(localPath);
  if (!r.ok) throw new Error(`Image introuvable: ${localPath}`);
  const blob   = await r.blob();
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload  = () => res(reader.result.split(',')[1]);
    reader.onerror = rej;
    reader.readAsDataURL(blob);
  });
}

// Convert text content → base64
function textToBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

// ── Main publish function ───────────────────────────────────────────────────
async function publishToGitHub() {
  const token    = localStorage.getItem(GH_TOKEN_KEY);
  const statusEl = document.getElementById('gh-status');
  const logEl    = document.getElementById('gh-token-status');

  // ── Logger ─────────────────────────────────────────────────────
  const LOG = [];
  function log(emoji, label, value, ok) {
    LOG.push({ emoji, label, value, ok, ts: new Date().toLocaleTimeString('fr-FR') });
    if (logEl) {
      logEl.innerHTML = LOG.slice(-30).map(e => `
        <div style="display:grid;grid-template-columns:16px 1fr auto;gap:6px;
                    padding:3px 0;border-bottom:1px solid #1e1e2e;font-size:11px;font-family:monospace">
          <span>${e.emoji}</span>
          <span style="color:${e.ok===true?'#58d68d':e.ok===false?'#e74c3c':'#bbb'};word-break:break-all">
            <strong style="color:#ddd">${e.label}</strong>${e.value?' — '+e.value:''}
          </span>
          <span style="color:#444;font-size:10px">${e.ts}</span>
        </div>`).join('');
      logEl.scrollTop = logEl.scrollHeight;
    }
  }
  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
    console.log('[GitHub Publish]', msg);
  }

  if (!token) {
    log('❌', 'Token manquant', 'Entrez votre token GitHub Personal Access Token', false);
    setStatus('❌ Token manquant');
    return;
  }

  setStatus('⏳ Démarrage...');
  log('🚀', 'Publication démarrée', new Date().toLocaleString('fr-FR'), null);

  try {

    // ══════════════════════════════════════════════════════════
    // ÉTAPE 1 — Sauvegarder data.json localement via server.py
    // ══════════════════════════════════════════════════════════
    setStatus('⏳ 1/4 — Sauvegarde data.json...');
    await saveDataJson();
    log('✅', 'data.json sauvegardé localement', '', true);

    // ══════════════════════════════════════════════════════════
    // ÉTAPE 2 — Upload des images vers GitHub
    // ══════════════════════════════════════════════════════════
    setStatus('⏳ 2/4 — Upload des images...');

    // Collect all local images
    const imageFiles = [
      // Backgrounds
      ...['hero.jpg','hero-2.jpg','atelier.jpg','blog-header.jpg',
          'boutique.jpg','contact.jpg','about.jpg','pattern-bg.jpg']
        .map(f => ({ local: `images/backgrounds/${f}`, gh: `images/backgrounds/${f}` })),
      // Products
      ...PRODUCTS.filter(p => p.img && p.img.startsWith('images/'))
        .map(p => ({ local: p.img, gh: p.img })),
      // Blog
      ...BLOG_POSTS.filter(b => b.img && b.img.startsWith('images/'))
        .map(b => ({ local: b.img, gh: b.img })),
    ];

    // Deduplicate
    const seen = new Set();
    const uniqueImages = imageFiles.filter(f => {
      if (seen.has(f.gh)) return false;
      seen.add(f.gh); return true;
    });

    log('📸', 'Images à uploader', `${uniqueImages.length} fichiers`, null);

    let imgOk = 0, imgSkip = 0, imgFail = 0;
    for (const img of uniqueImages) {
      try {
        const b64 = await imageToBase64(img.local);
        const sha = await ghGetSha(token, img.gh);
        await ghPutFile(token, img.gh, b64, sha, `img: ${img.gh}`);
        imgOk++;
        log('✅', img.gh, `${(b64.length*0.75/1024).toFixed(0)} KB`, true);
      } catch(e) {
        imgFail++;
        log('⚠️', img.gh, e.message, null);
      }
    }
    log('📸', 'Images terminées', `✅${imgOk} ⚠️${imgFail} skip:${imgSkip}`, imgFail===0);

    // ══════════════════════════════════════════════════════════
    // ÉTAPE 3 — Mettre à jour data.json avec URLs GitHub raw
    // ══════════════════════════════════════════════════════════
    setStatus('⏳ 3/4 — Mise à jour data.json avec URLs GitHub...');

    // Build data.json with GitHub raw URLs for images
    function toGhUrl(localPath) {
      if (!localPath || localPath.startsWith('http')) return localPath;
      return `${GH_RAW}/${localPath}`;
    }

    const dataForGh = {
      products: PRODUCTS.map(p => ({
        ...p,
        img:    toGhUrl(p.img),
        images: (p.images||[]).map(toGhUrl),
      })),
      blog: BLOG_POSTS.map(b => ({
        ...b,
        img: toGhUrl(b.img),
      })),
      affiliates:  AFFILIATE_PRODUCTS,
      backgrounds: Object.fromEntries(
        Object.entries(BACKGROUNDS || {}).map(([k,v]) => [k, toGhUrl(v)])
      ),
      config: {
        version:      '2.0.0',
        last_updated: new Date().toISOString().split('T')[0],
        hosted_on:    'github_pages'
      }
    };

    const dataJsonB64 = textToBase64(JSON.stringify(dataForGh, null, 2));
    const dataSha     = await ghGetSha(token, 'data.json');
    await ghPutFile(token, 'data.json', dataJsonB64, dataSha, 'data: update data.json with GitHub URLs');
    log('✅', 'data.json publié', 'URLs GitHub raw injectées', true);

    // ══════════════════════════════════════════════════════════
    // ÉTAPE 4 — Publier tous les fichiers HTML + JS
    // ══════════════════════════════════════════════════════════
    setStatus('⏳ 4/4 — Publication des fichiers...');

    // Files to publish (fetch from local server)
    const textFiles = [
      // HTML pages
      'index.html','boutique.html','atelier.html','contact.html',
      'blog.html','suivi.html','affiliation.html','admin.html',
      'mentions.html','confidentialite.html','cgv.html',
      // JS modules
      'js/i18n.js','js/data.js','js/router.js','js/products.js',
      'js/modal.js','js/cart.js','js/ui.js','js/admin.js',
      'js/github.js','js/analytics.js','js/nav.js',
    ];

    let fileOk = 0, fileFail = 0;
    for (const filePath of textFiles) {
      try {
        const r = await fetch(filePath + '?nocache=' + Date.now());
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const text = await r.text();
        const b64  = textToBase64(text);
        const sha  = await ghGetSha(token, filePath);
        await ghPutFile(token, filePath, b64, sha, `deploy: ${filePath}`);
        fileOk++;
        log('✅', filePath, `${(text.length/1024).toFixed(1)} KB`, true);
      } catch(e) {
        fileFail++;
        log('❌', filePath, e.message, false);
      }
    }

    // ══════════════════════════════════════════════════════════
    // RÉSULTAT FINAL
    // ══════════════════════════════════════════════════════════
    const siteUrl = `https://${GH_USER}.github.io`;
    const summary = `Images: ${imgOk}/${uniqueImages.length} · Fichiers: ${fileOk}/${textFiles.length}`;
    
    if (fileFail === 0 && imgFail === 0) {
      log('🎉', 'Publication réussie !', summary, true);
      log('🌐', 'Site en ligne', siteUrl, true);
      setStatus(`✅ Publié ! ${siteUrl}`);
      toast('🎉 Site publié sur GitHub Pages !');
    } else {
      log('⚠️', 'Publication partielle', summary, null);
      setStatus(`⚠️ Partiel — ${fileFail} erreurs`);
      toast(`⚠️ ${fileFail} fichiers en erreur — vérifiez les logs`);
    }

  } catch(e) {
    log('❌', 'Erreur fatale', e.message, false);
    setStatus('❌ Erreur — ' + e.message.slice(0, 60));
    toast('❌ Erreur : ' + e.message.slice(0, 80));
    console.error('[publishToGitHub]', e);
  }
}
