/* ═══ GITHUB — Publication complète vers GitHub Pages ═══ */

// GH_USER, GH_REPO, GH_TOKEN_KEY sont dans data.js

const GH_RAW = `https://raw.githubusercontent.com/${GH_USER}/${GH_REPO}/main`;
const GH_API = `https://api.github.com/repos/${GH_USER}/${GH_REPO}/contents`;

// ── UI ─────────────────────────────────────────────────────────────────────
function saveGhToken() {
  const t = document.getElementById('gh-token')?.value?.trim();
  if (!t) { toast('Token vide ⚠️'); return; }
  localStorage.setItem(GH_TOKEN_KEY, t);
  toast('✅ Token GitHub sauvegardé');
  checkGhTokenStatus();
}

async function checkGhTokenStatus() {
  const token = localStorage.getItem(GH_TOKEN_KEY);
  const el = document.getElementById('gh-token-status');
  if (!el) return;
  if (!token) { el.innerHTML = '<span style="color:#e74c3c">❌ Aucun token</span>'; return; }
  try {
    const r = await fetch('https://api.github.com/user',
      { headers: { Authorization: `token ${token}` } });
    if (r.ok) {
      const u = await r.json();
      el.innerHTML = `<span style="color:#58d68d">✅ Connecté : <strong>${u.login}</strong></span>`;
    } else {
      el.innerHTML = '<span style="color:#e74c3c">❌ Token invalide</span>';
    }
  } catch(e) {
    el.innerHTML = '<span style="color:#e74c3c">❌ Erreur réseau</span>';
  }
}

// ── GitHub API helpers ─────────────────────────────────────────────────────
async function ghGetSha(token, path) {
  const r = await fetch(`${GH_API}/${path}`,
    { headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' } });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`GET sha ${path} → ${r.status}`);
  return (await r.json()).sha || null;
}

async function ghPutFile(token, path, contentB64, sha, message) {
  const body = { message, content: contentB64 };
  if (sha) body.sha = sha;
  const r = await fetch(`${GH_API}/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github.v3+json'
    },
    body: JSON.stringify(body)
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(`PUT ${path} → ${r.status}: ${e.message || r.statusText}`);
  }
}

function toBase64Text(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

async function fetchBinaryAsBase64(localPath) {
  const r = await fetch(localPath + '?t=' + Date.now());
  if (!r.ok) throw new Error(`Fetch ${localPath} → ${r.status}`);
  const blob = await r.blob();
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload  = () => res(reader.result.split(',')[1]);
    reader.onerror = rej;
    reader.readAsDataURL(blob);
  });
}

// ── Main publish ───────────────────────────────────────────────────────────
async function publishToGitHub() {
  const token    = localStorage.getItem(GH_TOKEN_KEY);
  const statusEl = document.getElementById('gh-status');
  const logEl    = document.getElementById('gh-token-status');

  const LOG = [];
  function log(emoji, label, value, ok) {
    LOG.push({ emoji, label, value, ok, ts: new Date().toLocaleTimeString('fr-FR') });
    if (logEl) {
      logEl.innerHTML = LOG.slice(-40).map(e => `
        <div style="display:grid;grid-template-columns:18px 1fr auto;gap:6px;
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
  }

  if (!token) {
    toast('❌ Token GitHub manquant');
    setStatus('❌ Token manquant');
    return;
  }

  setStatus('⏳ Démarrage...');
  log('🚀', 'Publication démarrée', new Date().toLocaleString('fr-FR'), null);

  try {

    // ── ÉTAPE 1 : Sauvegarder data.json localement ─────────────────
    setStatus('⏳ 1/4 — Sauvegarde locale...');
    await saveDataJson();
    log('✅', 'data.json sauvegardé localement', '', true);

    // ── ÉTAPE 2 : Récupérer la liste complète des fichiers ──────────
    setStatus('⏳ 2/4 — Lecture des fichiers...');
    const listRes = await fetch('/file-list');
    if (!listRes.ok) throw new Error('Impossible de lire /file-list — server.py en marche ?');
    const { files } = await listRes.json();
    log('📁', 'Fichiers détectés', `${files.length} fichiers à publier`, null);

    // ── ÉTAPE 3 : Construire data.json avec URLs GitHub ─────────────
    setStatus('⏳ 3/4 — Préparation data.json...');

    function toGhUrl(localPath) {
      if (!localPath || localPath.startsWith('http')) return localPath;
      return `${GH_RAW}/${localPath}`;
    }

    const dataForGh = {
      products: PRODUCTS.map(p => ({
        ...p,
        img:    toGhUrl(p.img),
        images: (p.images || []).map(toGhUrl),
      })),
      blog: BLOG_POSTS.map(b => ({ ...b, img: toGhUrl(b.img) })),
      affiliates: AFFILIATE_PRODUCTS,
      backgrounds: Object.fromEntries(
        Object.entries(BACKGROUNDS || {}).map(([k, v]) => [k, toGhUrl(v)])
      ),
      config: {
        version: '2.0.0',
        last_updated: new Date().toISOString().split('T')[0],
        hosted_on: 'github_pages'
      }
    };

    // ── ÉTAPE 4 : Uploader tous les fichiers ────────────────────────
    setStatus('⏳ 4/4 — Upload en cours...');
    let ok = 0, fail = 0;
    const total = files.length + 1; // +1 for data.json

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const pct  = Math.round((i / total) * 100);
      setStatus(`⏳ Upload ${pct}% — ${file.path.split('/').pop()}`);

      try {
        let b64;
        if (file.type === 'binary') {
          b64 = await fetchBinaryAsBase64(file.path);
        } else {
          const r = await fetch(file.path + '?t=' + Date.now());
          if (!r.ok) throw new Error(`fetch ${r.status}`);
          const text = await r.text();
          b64 = toBase64Text(text);
        }

        const sha = await ghGetSha(token, file.path);
        await ghPutFile(token, file.path, b64, sha, `deploy: ${file.path}`);
        ok++;

        const size = Math.round(b64.length * 0.75 / 1024);
        log('✅', file.path, `${size} KB`, true);

      } catch(e) {
        fail++;
        log('❌', file.path, e.message, false);
      }
    }

    // Upload data.json with GitHub URLs
    try {
      const dataB64 = toBase64Text(JSON.stringify(dataForGh, null, 2));
      const dataSha = await ghGetSha(token, 'data.json');
      await ghPutFile(token, 'data.json', dataB64, dataSha, 'data: GitHub URLs');
      ok++;
      log('✅', 'data.json', 'URLs GitHub injectées', true);
    } catch(e) {
      fail++;
      log('❌', 'data.json', e.message, false);
    }

    // ── Résultat ────────────────────────────────────────────────────
    const siteUrl = `https://${GH_USER}.github.io`;
    if (fail === 0) {
      log('🎉', 'Publication réussie !', `${ok}/${total} fichiers`, true);
      log('🌐', 'Site en ligne', siteUrl, true);
      setStatus(`✅ Publié ! ${siteUrl}`);
      toast('🎉 Site publié sur GitHub Pages !');
    } else {
      log('⚠️', 'Publication partielle', `✅${ok} ❌${fail}`, null);
      setStatus(`⚠️ ${fail} erreurs — ${ok} fichiers publiés`);
      toast(`⚠️ ${fail} fichiers en erreur`);
    }

  } catch(e) {
    log('❌', 'Erreur fatale', e.message, false);
    setStatus('❌ ' + e.message.slice(0, 80));
    toast('❌ ' + e.message.slice(0, 80));
    console.error('[publishToGitHub]', e);
  }
}
