const API = (path) => (window.__API_BASE__ || "") + path;

function authHeaders() {
  const token = localStorage.getItem('mm_token');
  return token ? { Authorization: 'Bearer ' + token } : {};
}


let currentUser = null;

async function syncMe() {
  const token = localStorage.getItem('mm_token');
  if (!token) {
    currentUser = null;
    localStorage.removeItem('mm_name');
    localStorage.removeItem('mm_email');
    return;
  }
  try {
    const res = await fetch(API('/auth/me'), { headers: { ...authHeaders() } });
    const j = await res.json().catch(() => ({}));
    if (res.ok) {
      currentUser = j.data;
      if (currentUser?.name) localStorage.setItem('mm_name', currentUser.name);
      if (currentUser?.email) localStorage.setItem('mm_email', currentUser.email);
    }
  } catch {
    // ignore
  }
}

function fillCheckoutUser() {
  const form = document.getElementById('checkout-form');
  if (!form) return;

  const token = localStorage.getItem('mm_token');
  const name = localStorage.getItem('mm_name') || '';
  const email = localStorage.getItem('mm_email') || '';

  const nameEl = form.querySelector('input[name="name"]');
  const emailEl = form.querySelector('input[name="email"]');

  if (!token) {
    if (emailEl) emailEl.value = '';
    return;
  }

  if (nameEl && name && !nameEl.value) nameEl.value = name;
  if (emailEl) emailEl.value = email;
}

// -------- Extra: Favoritos --------
let favoriteIds = new Set();

async function syncFavorites() {
  const token = localStorage.getItem('mm_token');
  if (!token) {
    favoriteIds = new Set();
    return;
  }
  try {
    const res = await fetch(API('/favorites'), { headers: { ...authHeaders() } });
    const j = await res.json().catch(() => ({}));
    const favs = (j.data || []).map((p) => p._id);
    favoriteIds = new Set(favs);
  } catch {
    // ignore
  }
}

async function toggleFavorite(productId) {
  const token = localStorage.getItem('mm_token');
  if (!token) {
    alert('Faz login para usar Favoritos.');
    return;
  }
  const isFav = favoriteIds.has(productId);
  const method = isFav ? 'DELETE' : 'POST';
  const res = await fetch(API('/favorites/' + productId), {
    method,
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    alert('Erro: ' + (j.error || 'não foi possível atualizar favoritos'));
    return;
  }
  await syncFavorites();
// Preencher checkout com dados do utilizador (se autenticado)
syncMe().then(fillCheckoutUser);
fillCheckoutUser();
}
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

// Imagens locais por nome (fallback: placeholder)
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

  // Legumes (imagens novas)
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

// Tabs
$$('.tab-btn').forEach((btn) =>
  btn.addEventListener('click', () => {
    $$('.tab-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    $$('.tab').forEach((s) => s.classList.toggle('active', s.id === tab));
  })
);
document.querySelector('.tab-btn[data-tab="produtos"]').click();

// Favoritos: sincronizar ao arrancar (se houver login)
syncFavorites();
// Preencher checkout com dados do utilizador (se autenticado)
syncMe().then(fillCheckoutUser);
fillCheckoutUser();

// Cart
const CART_KEY = 'mm_cart';
const getCart = () => JSON.parse(localStorage.getItem(CART_KEY) || '[]');
const setCart = (arr) => localStorage.setItem(CART_KEY, JSON.stringify(arr));

function renderCart() {
  const items = getCart();
  $('#cart-count').textContent = items.reduce((a, it) => a + it.qty, 0);

  const wrap = $('#cart-items');
  wrap.innerHTML = '';

  let total = 0;

  items.forEach((it) => {
    const row = document.createElement('div');
    row.className = 'cart-row';

    const lineTotal = it.price * it.qty;
    total += lineTotal;

    row.innerHTML = `
      <div>
        <strong>${it.name}</strong>
        <div class="muted">${it.qty} × ${it.price.toFixed(2)}€</div>
      </div>
      <div>
        <button class="btn" data-act="sub">-</button>
        <button class="btn" data-act="add">+</button>
        <button class="btn" data-act="rm">remover</button>
      </div>
    `;

    row.querySelector('[data-act="sub"]').onclick = () => {
      it.qty = Math.max(1, it.qty - 1);
      setCart(items);
      renderCart();
    };

    row.querySelector('[data-act="add"]').onclick = () => {
      it.qty++;
      setCart(items);
      renderCart();
    };

    row.querySelector('[data-act="rm"]').onclick = () => {
      setCart(items.filter((x) => x.id !== it.id));
      renderCart();
    };

    wrap.appendChild(row);
  });

  $('#cart-total').textContent = total.toFixed(2) + ' €';
}

// Botão checkout só ativo quando há token
function updateCheckoutButtonState() {
  // Checkout: ativo sempre (requisitos: campos preenchidos)
  const btn = document.querySelector('.btn-checkout-large');
  if (!btn) return;
  btn.disabled = false;
  btn.removeAttribute('title');
}


function addToCart(p) {
  const items = getCart();
  const found = items.find((x) => x.id === p._id);

  if (found) found.qty++;
  else items.push({ id: p._id, name: p.name, price: p.price, qty: 1 });

  setCart(items);
  renderCart();
  document.querySelector('.tab-btn[data-tab="carrinho"]').click();
}

// Produtos (apenas fruta): GET /products

function applyClientFilters(products) {
  const q = (document.getElementById('f-q')?.value || '').trim().toLowerCase();
  const min = parseFloat(document.getElementById('f-min')?.value || '');
  const max = parseFloat(document.getElementById('f-max')?.value || '');
  const sort = document.getElementById('f-sort')?.value || 'newest';

  let out = [...products];

  if (q) {
    out = out.filter((p) => {
      const name = (p.name || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }
  if (!Number.isNaN(min)) out = out.filter((p) => Number(p.price || 0) >= min);
  if (!Number.isNaN(max)) out = out.filter((p) => Number(p.price || 0) <= max);

  if (sort === 'name_asc') out.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  if (sort === 'price_asc') out.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  if (sort === 'price_desc') out.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
  if (sort === 'newest') out.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  return out;
}

async function loadProducts() {
  const listEl = document.querySelector('#produtos-fruta-list');
  listEl.innerHTML = '';

  try {
    // Pesquisa + filtros (extra)
    const params = new URLSearchParams();

    // Nota: a API tem paginação (por defeito devolve 12 produtos).
    // Como o cliente não tem paginação UI, pedimos um limite alto para mostrar tudo.
    params.set('limit', '200');

    const q = document.getElementById('f-q')?.value?.trim();
    const minPrice = document.getElementById('f-min')?.value;
    const maxPrice = document.getElementById('f-max')?.value;
    const sort = document.getElementById('f-sort')?.value;

    if (q) params.set('q', q);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (sort) params.set('sort', sort);


    let products = [];
    const favOnly = document.getElementById('f-favs')?.checked;

    if (favOnly) {
      const token = localStorage.getItem('mm_token');
      if (!token) {
        listEl.innerHTML = '<div class="muted">Faz login para ver Favoritos.</div>';
        return;
      }
      const resFav = await fetch(API('/favorites'), { headers: { ...authHeaders() } });
      const jsonFav = await resFav.json().catch(() => ({}));
      products = applyClientFilters(jsonFav.data || []);
    } else {
      const res = await fetch(API('/products?' + params.toString()));
      const json = await res.json().catch(() => ({}));
      products = json.data || [];
    }


    if (products.length === 0) {
      listEl.innerHTML = '<div class="muted">Sem produtos.</div>';
      return;
    }

    products.forEach((p) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <img class="thumb" src="${p.imageUrl || getFruitImg(p?.name)}" alt="${p?.name || 'Fruta'}">
        <h3>${p?.name || 'Fruta'}</h3>
        <div class="muted">${(p.category || 'fruta').toString()}</div>
        <div class="price">${Number(p.price || 0).toFixed(2)} €</div>
        <div class="card-actions">
          <button class="fav-btn" title="Favorito">❤</button>
          <button class="btn">Adicionar</button>
        </div>
      `;
      card.querySelector('.btn').onclick = () => addToCart(p);
      const favBtn = card.querySelector('.fav-btn');
      if (favoriteIds.has(p._id)) favBtn.classList.add('is-fav');
      favBtn.onclick = async () => {
        await toggleFavorite(p._id);
        loadProducts();
      };
      listEl.appendChild(card);
    });
  } catch (e) {
    listEl.innerHTML = '<div class="muted">Erro a carregar produtos.</div>';
    console.error(e);
  }
}

// Debounce simples para pesquisa
let _t = null;
function reloadProductsDebounced() {
  clearTimeout(_t);
  _t = setTimeout(() => loadProducts(), 250);
}

['f-q', 'f-min', 'f-max', 'f-sort'].forEach((id) => {
  document.getElementById(id)?.addEventListener('input', reloadProductsDebounced);
  document.getElementById(id)?.addEventListener('change', reloadProductsDebounced);
});

// Checkout (orders)
// Checkout (sem BD): validar campos e limpar carrinho
document.getElementById('checkout-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const form = e.target;
  const items = getCart();

  if (items.length === 0) {
    document.getElementById('checkout-msg').textContent = '✅ Encomenda concluída!';
    return;
  }

  // Só avança se os campos obrigatórios estiverem válidos
  if (!form.reportValidity()) return;

  // "Efetuar encomenda" -> apenas mensagem e limpar carrinho
  setCart([]);
  renderCart();

  // limpar campos (mantém email se estiver preenchido automaticamente)
  const phoneEl = form.querySelector('input[name="phone"]');
  const dateEl = form.querySelector('input[name="date"]');
  const couponEl = form.querySelector('input[name="coupon"]');

  if (phoneEl) phoneEl.value = '';
  if (dateEl) dateEl.value = '';
  if (couponEl) couponEl.value = '';

  document.getElementById('checkout-msg').textContent = '✅ Encomenda concluída!';
});



// Login
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const fd = new FormData(e.target);

  const res = await fetch(API('/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') }),
  });

  const j = await res.json().catch(() => ({}));

  if (res.ok) {
    localStorage.setItem('mm_token', j.token);
    localStorage.setItem('mm_role', j.role);
    await syncFavorites();
// Preencher checkout com dados do utilizador (se autenticado)
syncMe().then(fillCheckoutUser);
fillCheckoutUser();
    updateCheckoutButtonState();

    if (j.role === 'admin') {
      window.location.href = '/admin.html';
      return;
    }

    document.getElementById('login-msg').textContent = '✅ Autenticado (cliente)';
  } else {
    document.getElementById('login-msg').textContent = '❌ ' + (j.error || 'Credenciais inválidas');
  }
});

// Registo (clientes)
$('#register-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const fd = new FormData(e.target);

  const res = await fetch(API('/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: fd.get('name'),
      email: fd.get('email'),
      password: fd.get('password'),
    }),
  });

  const j = await res.json().catch(() => ({}));

  if (res.ok) {
    document.getElementById('register-msg').textContent = '✅ Conta criada. Já podes fazer login.';
    e.target.reset();

    // Voltar para o ecrã de login automaticamente
    showAuthLogin();
  } else {
    document.getElementById('register-msg').textContent = '❌ ' + (j.error || 'Não foi possível criar conta');
  }
});

// Alternar entre "Entrar" e "Criar conta" (UI)
const __authLoginView = document.getElementById('auth-login-view');
const __authRegisterView = document.getElementById('auth-register-view');

function showAuthLogin() {
  __authLoginView?.classList.remove('auth-hidden');
  __authRegisterView?.classList.add('auth-hidden');

  // limpar msgs do registo quando voltas ao login
  const rm = document.getElementById('register-msg');
  if (rm) rm.textContent = '';
}

function showAuthRegister() {
  __authRegisterView?.classList.remove('auth-hidden');
  __authLoginView?.classList.add('auth-hidden');

  // limpar msgs do login quando vais para registo
  const lm = document.getElementById('login-msg');
  if (lm) lm.textContent = '';
}

document.getElementById('to-register')?.addEventListener('click', showAuthRegister);
document.getElementById('to-login')?.addEventListener('click', showAuthLogin);

renderCart();
updateCheckoutButtonState();
loadProducts();
