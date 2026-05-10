const API = (path) => (window.__API_BASE__ || "") + path;
const $ = (sel) => document.querySelector(sel);

const token = localStorage.getItem("mm_token");
const role = localStorage.getItem("mm_role");

if (!token || role !== "admin") {
  window.location.href = "/index.html";
}

function setMsg(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text || "";
}

async function apiFetch(path, opts = {}) {
  const isFormData = typeof FormData !== 'undefined' && opts.body instanceof FormData;
  const headers = {
    ...(opts.headers || {}),
    Authorization: `Bearer ${token}`,
  };
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const res = await fetch(API(path), { ...opts, headers });

  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || "Erro");
  return j;
}

// Logout
$("#logout-btn")?.addEventListener("click", () => {
  localStorage.removeItem("mm_token");
  localStorage.removeItem("mm_role");
  window.location.href = "/index.html";
});

// Tabs
document.querySelectorAll('.tab-btn[data-tab]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const tabId = btn.getAttribute('data-tab');
    document.querySelectorAll('.tab-btn[data-tab]').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    document.querySelectorAll('section.tab').forEach((s) => s.classList.remove('active'));
    const tab = document.getElementById(tabId);
    if (tab) tab.classList.add('active');

    if (tabId === 'vitrine-admin') loadVitrine(true);
  });
});


function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeImageUrl(url, fallback) {
  const value = String(url || fallback || "");
  if (value.startsWith("/uploads/") || value.startsWith("/img/")) return value;
  return fallback || "/img/fruta/placeholder.svg";
}

// ------------------ IMAGENS LOCAIS (fallback) ------------------
// Mapa de imagens por nome de produto (normalizado). Isto garante que,
// mesmo que um produto não tenha imageUrl gravado na BD, o Admin mostra
// sempre uma imagem correta baseada no nome.
const FRUIT_IMG = {
  // Fruta
  banana: "/img/fruta/banana.png",
  "pera rocha 75/80": "/img/fruta/pera-rocha.png",
  "pera rocha": "/img/fruta/pera-rocha.png",
  "maca fuji": "/img/fruta/maca-fuji.png",
  "maça fuji": "/img/fruta/maca-fuji.png",
  kiwi: "/img/fruta/kiwi.png",
  laranja: "/img/fruta/laranja.png",
  melao: "/img/fruta/melao.png",
  "pera abacate": "/img/fruta/pera-abacate.png",

  // Legumes
  alface: "/img/fruta/alface.png",
  cebola: "/img/fruta/cebola.png",
  cenoura: "/img/fruta/cenoura.png",
  "couve flor": "/img/fruta/couve_flor.png",
  "batata olho perdiz": "/img/fruta/batata_olho_perdiz.png",
  "batata olho": "/img/fruta/batata_olho_perdiz.png",
  "pimento verde": "/img/fruta/pimento_verde.png",
  "pimento vermelho": "/img/fruta/pimento_vermelho.png",
};

const norm = (s) =>
  (s || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

const getFruitImg = (name) => FRUIT_IMG[norm(name)] || "/img/fruta/placeholder.svg";

function fmtPrice(v) {
  const n = Number(v);
  if (Number.isFinite(n)) return n.toFixed(2);
  return v ?? "";
}

async function loadProducts() {
  setMsg("products-msg", "A carregar...");
  const tbody = document.getElementById("products-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  // Pesquisa + ordenação (extra)
  const q = document.getElementById('admin-q')?.value?.trim();
  const sort = document.getElementById('admin-sort')?.value;
  const params = new URLSearchParams({ all: 'true', limit: '50' });
  if (q) params.set('q', q);
  if (sort) params.set('sort', sort);

  const j = await apiFetch(`/products?${params.toString()}`);
  const list = j.data || [];

  list.forEach((p) => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>
        <div style="display:flex; flex-direction:column; gap:6px;">
          <img src="${escapeHtml(safeImageUrl(p.imageUrl, getFruitImg(p?.name)))}" alt="" style="width:54px; height:54px; border-radius:12px; object-fit:cover; border:1px solid #252a39;" />
          <input type="file" accept="image/*" data-k="image" />
          <button data-act="upload">Upload</button>
        </div>
      </td>
      <td><input class="inp" data-k="name" value="${escapeHtml(p.name ?? '')}"></td>
      <td><input class="inp" data-k="category" value="${escapeHtml(p.category ?? '')}"></td>
      <td><input class="inp" data-k="price" type="number" step="0.01" min="0" value="${escapeHtml(fmtPrice(p.price))}"></td>
      <td>
        <select class="inp" data-k="available">
          <option value="true" ${p.available !== false ? 'selected' : ''}>sim</option>
          <option value="false" ${p.available === false ? 'selected' : ''}>não</option>
        </select>
      </td>
      <td style="display:flex; gap:8px; align-items:center;">
        <button data-act="save">Guardar</button>
        <button data-act="del">Apagar</button>
      </td>
    `;

    // Guardar alterações (PATCH)
    tr.querySelector('[data-act="save"]').addEventListener('click', async () => {
      try {
        setMsg('products-msg', '');
        const fields = Object.fromEntries(
          Array.from(tr.querySelectorAll('.inp')).map((el) => {
            const k = el.dataset.k;
            let v = el.value;
            if (k === 'price') v = Number(v);
            if (k === 'available') v = el.value === 'true';
            return [k, v];
          })
        );

        await apiFetch(`/products/${p._id}`, {
          method: 'PATCH',
          body: JSON.stringify(fields),
        });

        setMsg('products-msg', '✅ Produto atualizado');
      } catch (e) {
        setMsg('products-msg', '❌ ' + e.message);
      }
    });

    // Apagar
    tr.querySelector('[data-act="del"]').addEventListener('click', async () => {
      if (!confirm('Apagar este produto?')) return;
      try {
        setMsg('products-msg', '');
        await apiFetch(`/products/${p._id}`, { method: 'DELETE' });
        await loadProducts();
        setMsg('products-msg', '✅ Produto apagado');
      } catch (e) {
        setMsg('products-msg', '❌ ' + e.message);
      }
    });

    // Upload de imagem (extra)
    tr.querySelector('[data-act="upload"]').addEventListener('click', async () => {
      const file = tr.querySelector('input[type="file"]').files?.[0];
      if (!file) {
        setMsg('products-msg', '❌ Escolhe uma imagem primeiro');
        return;
      }
      try {
        setMsg('products-msg', '');
        const fd = new FormData();
        fd.append('image', file);
        await apiFetch(`/products/${p._id}/image`, { method: 'POST', body: fd });
        await loadProducts();
        setMsg('products-msg', '✅ Imagem atualizada');
      } catch (e) {
        setMsg('products-msg', '❌ ' + e.message);
      }
    });

    tbody.appendChild(tr);
  });

  setMsg('products-msg', list.length ? '' : 'Sem produtos.');
}

$("#product-create-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    setMsg("product-create-msg", "");
    const fd = new FormData(e.target);

    const payload = {
      name: fd.get("name"),
      category: fd.get("category"),
      price: Number(fd.get("price")),
      available: fd.get("available") === "true",
    };

    const created = await apiFetch("/products", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    // Upload de imagem (extra) — se o admin escolheu um ficheiro
    const file = fd.get('image');
    if (file && file instanceof File && file.size > 0) {
      const up = new FormData();
      up.append('image', file);
      await apiFetch(`/products/${created.data?._id}/image`, { method: 'POST', body: up });
    }

    setMsg("product-create-msg", "✅ Produto criado");
    e.target.reset();
    await loadProducts();
  } catch (err) {
    setMsg("product-create-msg", "❌ " + err.message);
  }
});

// Pesquisa admin (extra)
let _t = null;
function reloadProductsDebounced() {
  clearTimeout(_t);
  _t = setTimeout(() => loadProducts(), 250);
}

['admin-q', 'admin-sort'].forEach((id) => {
  document.getElementById(id)?.addEventListener('input', reloadProductsDebounced);
  document.getElementById(id)?.addEventListener('change', reloadProductsDebounced);
});

// ------------------ CUPÕES (extra) ------------------

async function loadCoupons() {
  setMsg('coupons-msg', 'A carregar...');
  const tbody = document.getElementById('coupons-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const j = await apiFetch('/coupons');
  const list = j.data || [];

  list.forEach((c) => {
    const tr = document.createElement('tr');
    const amountLabel = c.type === 'percent' ? `${Number(c.amount).toFixed(0)}%` : `${fmtPrice(c.amount)}€`;
    tr.innerHTML = `
      <td><input class="c-inp" data-k="code" value="${escapeHtml(c.code ?? '')}"></td>
      <td>
        <select class="c-inp" data-k="type">
          <option value="percent" ${c.type === 'percent' ? 'selected' : ''}>percent</option>
          <option value="fixed" ${c.type === 'fixed' ? 'selected' : ''}>fixed</option>
        </select>
      </td>
      <td><input class="c-inp" data-k="amount" type="number" step="0.01" min="0" value="${escapeHtml(String(c.amount ?? ''))}"></td>
      <td><input class="c-inp" data-k="minTotal" type="number" step="0.01" min="0" value="${escapeHtml(String(c.minTotal ?? 0))}"></td>
      <td>${escapeHtml(String(c.usedCount ?? 0))}${c.maxUses ? ` / ${escapeHtml(String(c.maxUses))}` : ''}</td>
      <td>
        <select class="c-inp" data-k="active">
          <option value="true" ${c.active !== false ? 'selected' : ''}>sim</option>
          <option value="false" ${c.active === false ? 'selected' : ''}>não</option>
        </select>
      </td>
      <td style="display:flex; gap:8px; align-items:center;">
        <button data-act="csave">Guardar</button>
        <button data-act="cdel">Apagar</button>
      </td>
    `;

    tr.querySelector('[data-act="csave"]').addEventListener('click', async () => {
      try {
        setMsg('coupons-msg', '');
        const fields = Object.fromEntries(
          Array.from(tr.querySelectorAll('.c-inp')).map((el) => {
            const k = el.dataset.k;
            let v = el.value;
            if (k === 'amount' || k === 'minTotal') v = Number(v);
            if (k === 'active') v = el.value === 'true';
            return [k, v];
          })
        );
        await apiFetch(`/coupons/${c._id}`, { method: 'PATCH', body: JSON.stringify(fields) });
        setMsg('coupons-msg', `✅ Cupão atualizado (${amountLabel})`);
        await loadCoupons();
      } catch (e) {
        setMsg('coupons-msg', '❌ ' + e.message);
      }
    });

    tr.querySelector('[data-act="cdel"]').addEventListener('click', async () => {
      if (!confirm('Apagar este cupão?')) return;
      try {
        setMsg('coupons-msg', '');
        await apiFetch(`/coupons/${c._id}`, { method: 'DELETE' });
        await loadCoupons();
        setMsg('coupons-msg', '✅ Cupão apagado');
      } catch (e) {
        setMsg('coupons-msg', '❌ ' + e.message);
      }
    });

    tbody.appendChild(tr);
  });

  setMsg('coupons-msg', list.length ? '' : 'Sem cupões.');
}

document.getElementById('coupon-create-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    setMsg('coupon-create-msg', '');
    const fd = new FormData(e.target);
    const payload = {
      code: String(fd.get('code') || '').trim(),
      type: fd.get('type'),
      amount: Number(fd.get('amount')),
      minTotal: Number(fd.get('minTotal') || 0),
      startsAt: String(fd.get('startsAt') || '').trim() || undefined,
      endsAt: String(fd.get('endsAt') || '').trim() || undefined,
      maxUses: String(fd.get('maxUses') || '').trim() ? Number(fd.get('maxUses')) : undefined,
      active: fd.get('active') === 'true',
    };

    await apiFetch('/coupons', { method: 'POST', body: JSON.stringify(payload) });
    setMsg('coupon-create-msg', '✅ Cupão criado');
    e.target.reset();
    await loadCoupons();
  } catch (e) {
    setMsg('coupon-create-msg', '❌ ' + e.message);
  }
});

Promise.all([loadProducts(), loadCoupons()]).catch((e) => {
  setMsg('products-msg', '❌ ' + e.message);
  setMsg('coupons-msg', '❌ ' + e.message);
});


// -------------------- VISTA CLIENTE (apenas produtos ativos) --------------------
let _vPage = 1;

function vitrineParams() {
  const params = new URLSearchParams();
  const q = document.getElementById('v-q')?.value?.trim();
  const minPrice = document.getElementById('v-min')?.value;
  const maxPrice = document.getElementById('v-max')?.value;
  const sort = document.getElementById('v-sort')?.value || 'name_asc';
  const limit = document.getElementById('v-limit')?.value || '12';

  if (q) params.set('q', q);
  if (minPrice) params.set('minPrice', minPrice);
  if (maxPrice) params.set('maxPrice', maxPrice);
  if (sort) params.set('sort', sort);
  params.set('page', String(_vPage));
  params.set('limit', String(limit));
  // Não mandamos ?all=true -> API aplica regra pública (só disponíveis)
  return params;
}

function renderVitrine(items) {
  const grid = document.getElementById('vitrine-grid');
  if (!grid) return;
  grid.innerHTML = '';

  items.forEach((p) => {
    const card = document.createElement('div');
    card.className = 'card';
    const img = p.imageUrl ? `<img class="thumb" src="${escapeHtml(safeImageUrl(p.imageUrl, getFruitImg(p?.name)))}" alt="${escapeHtml(p.name)}" />` : `<div class="thumb" style="display:flex;align-items:center;justify-content:center;">sem imagem</div>`;
    card.innerHTML = `
      ${img}
      <div class="card-body">
        <h3>${escapeHtml(p.name)}</h3>
        <p class="muted">${escapeHtml(p.category || 'fruta')}</p>
        <p><strong>${Number(p.price).toFixed(2)} €</strong></p>
      </div>
    `;
    grid.appendChild(card);
  });
}

async function loadVitrine(resetPage = false) {
  try {
    if (resetPage) _vPage = 1;

    setMsg('vitrine-msg', 'A carregar...');
    const params = vitrineParams();
    const res = await apiFetch(`/products?${params.toString()}`, { method: 'GET' });
    const items = res?.data || [];
    const meta = res?.meta || {};

    renderVitrine(items);
    setMsg('vitrine-msg', items.length ? '' : 'Sem produtos ativos para mostrar.');

    const pageEl = document.getElementById('v-page');
    if (pageEl) pageEl.textContent = `Página ${meta.page || _vPage} / ${meta.totalPages || 1}`;

    // controls
    const prev = document.getElementById('v-prev');
    const next = document.getElementById('v-next');
    if (prev) prev.disabled = (meta.page || _vPage) <= 1;
    if (next) next.disabled = (meta.page || _vPage) >= (meta.totalPages || 1);
  } catch (e) {
    setMsg('vitrine-msg', `❌ ${e.message}`);
  }
}

document.getElementById('v-apply')?.addEventListener('click', () => loadVitrine(true));
document.getElementById('v-prev')?.addEventListener('click', () => { _vPage = Math.max(1, _vPage - 1); loadVitrine(false); });
document.getElementById('v-next')?.addEventListener('click', () => { _vPage += 1; loadVitrine(false); });
['v-q','v-min','v-max'].forEach((id) => {
  document.getElementById(id)?.addEventListener('input', () => {
    // debounce simples
    clearTimeout(window.__v_t);
    window.__v_t = setTimeout(() => loadVitrine(true), 300);
  });
});
document.getElementById('v-sort')?.addEventListener('change', () => loadVitrine(true));
document.getElementById('v-limit')?.addEventListener('change', () => loadVitrine(true));
