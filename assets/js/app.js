/* =============================================
   ESENCIA NATURAL — app.js v2
   ============================================= */
'use strict';

const WA_NUM = '5491171076550'; // ← REEMPLAZAR por número real sin + ni espacios
const WA_MSG = 'Hola Esencia Natural! Me gustaría consultar sobre sus productos 🌿';

function waLink(msg) {
  return `https://wa.me/${WA_NUM}?text=${encodeURIComponent(msg || WA_MSG)}`;
}

// ---- Preloader ----
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('preloader')?.classList.add('oculto');
  }, 300);
});

// ---- Navbar scroll ----
const navbar = document.getElementById('navbar');
const onScroll = () => navbar?.classList.toggle('scrolled', window.scrollY > 60);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll(); // Ejecutar al cargar para estado inicial correcto

// ---- Menú móvil ----
const navMenu  = document.querySelector('.nav-menu');
const navPanel = document.querySelector('.nav-panel');

function cerrarMenu() {
  navMenu?.classList.remove('abierto');
  navPanel?.classList.remove('abierto');
  document.body.style.overflow = '';
}

navMenu?.addEventListener('click', () => {
  const estaAbierto = navPanel?.classList.contains('abierto');
  if (estaAbierto) {
    cerrarMenu();
  } else {
    navMenu.classList.add('abierto');
    navPanel?.classList.add('abierto');
    // Bloquear scroll de fondo mientras el menú está abierto
    document.body.style.overflow = 'hidden';
  }
});

// Cerrar al hacer clic en un link del panel
navPanel?.querySelectorAll('a').forEach(a => a.addEventListener('click', cerrarMenu));

// Cerrar al hacer clic fuera del menú
document.addEventListener('click', e => {
  if (navPanel?.classList.contains('abierto') &&
      !navPanel.contains(e.target) &&
      !navMenu.contains(e.target)) {
    cerrarMenu();
  }
});

// ---- Smooth scroll ----
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); window.scrollTo({ top: t.getBoundingClientRect().top + pageYOffset - 78, behavior: 'smooth' }); }
  });
});

// ---- Scroll Reveal ----
const revObs = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) {
      const d = +(en.target.dataset.delay || 0);
      setTimeout(() => en.target.classList.add('visible'), d);
      revObs.unobserve(en.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

document.querySelectorAll('[data-rev]').forEach(el => revObs.observe(el));

// ---- WhatsApp links ----
document.querySelectorAll('[data-wa]').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    window.open(waLink(el.dataset.wa || ''), '_blank');
  });
});

// ---- Fallback de imágenes: jpg → png → emoji ----
function imgFallback(img) {
  const base = img.dataset.base;
  if (!base) { showEmoji(img); return; }

  if (img.src.endsWith('.jpg')) {
    // Intentar con .png
    img.onerror = () => showEmoji(img);
    img.src = base + '.png';
  } else {
    showEmoji(img);
  }
}

function showEmoji(img) {
  img.style.display = 'none';
  const emoji = img.nextElementSibling;
  if (emoji && emoji.classList.contains('prod-emoji-fallback')) {
    emoji.style.display = 'flex';
  }
}


let todos = [], catActiva = 'all', busqueda = '';

// Categorías con emoji y orden definido
const CATEGORIAS = [
  { id: 'all',                  label: 'Todos',               emoji: '🌿' },
  { id: 'mix-frutos-secos',     label: 'Mix Frutos Secos',    emoji: '🥜' },
  { id: 'frutos-secos',         label: 'Frutos Secos',        emoji: '🌰' },
  { id: 'frutas-deshidratadas', label: 'Frutas Deshidratadas',emoji: '🍇' },
  { id: 'granolas-cereales',    label: 'Granolas y Cereales', emoji: '🌾' },
  { id: 'aceites',              label: 'Aceites',             emoji: '🫒' },
  { id: 'leches-vegetales',     label: 'Leches Vegetales',    emoji: '🥛' },
  { id: 'harinas-legumbres',    label: 'Harinas y Legumbres', emoji: '🌽' },
  { id: 'especias-condimentos', label: 'Especias',            emoji: '🌶️' },
  { id: 'semillas',             label: 'Semillas',            emoji: '🌻' },
  { id: 'sin-tacc',             label: 'Sin TACC',            emoji: '🍞' },
  { id: 'conservas',            label: 'Conservas',           emoji: '🧄' },
  { id: 'galletitas',           label: 'Galletitas',          emoji: '🍪' },
  { id: 'yerbas',               label: 'Yerbas',              emoji: '🧉' },
];

async function cargarProductos() {
  try {
    const r = await fetch('products.json');
    todos = await r.json();
    construirCategorias();
    renderizarProductos();
  } catch (err) {
    const g = document.getElementById('productos-grid');
    if (g) g.innerHTML = `<div class="sin-resultados" style="display:block"><div class="sr-ico">🌿</div><p>Estamos actualizando el catálogo. Volvé pronto!</p></div>`;
  }
}

function construirCategorias() {
  const cont = document.getElementById('cat-grid');
  if (!cont) return;

  cont.innerHTML = CATEGORIAS.map(c => {
    const n = c.id === 'all' ? todos.length : todos.filter(p => p.categoria === c.id).length;
    if (c.id !== 'all' && n === 0) return '';
    return `
      <div class="cat-card ${c.id === 'all' ? 'activa' : ''}" data-cat="${c.id}" role="button" tabindex="0">
        <span class="cat-emoji">${c.emoji}</span>
        <div class="cat-nombre">${c.label}</div>
        <span class="cat-count">${n} productos</span>
      </div>`;
  }).join('');

  cont.querySelectorAll('.cat-card').forEach(card => {
    const activate = () => {
      cont.querySelectorAll('.cat-card').forEach(c => c.classList.remove('activa'));
      card.classList.add('activa');
      catActiva = card.dataset.cat;
      renderizarProductos();
      // Scroll suave al catálogo si es móvil
      const catalogoEl = document.getElementById('catalogo');
      if (catalogoEl && window.innerWidth < 768) {
        setTimeout(() => catalogoEl.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      }
    };
    card.addEventListener('click', activate);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') activate(); });
  });
}

function renderizarProductos() {
  const grid = document.getElementById('productos-grid');
  const noRes = document.getElementById('sin-resultados');
  if (!grid) return;

  const q = busqueda.toLowerCase().trim();
  const filtrados = todos.filter(p => {
    const matchCat = catActiva === 'all' || p.categoria === catActiva;
    const matchBusq = !q ||
      p.nombre.toLowerCase().includes(q) ||
      p.descripcion.toLowerCase().includes(q) ||
      (p.categoriaLabel || '').toLowerCase().includes(q);
    return matchCat && matchBusq;
  });

  if (filtrados.length === 0) {
    grid.innerHTML = '';
    if (noRes) noRes.style.display = 'block';
    return;
  }
  if (noRes) noRes.style.display = 'none';

  grid.innerHTML = filtrados.map((p, i) => `
    <div class="prod-card cat-${p.categoria}" style="animation-delay:${Math.min(i * 35, 350)}ms">
      <div class="prod-header">
        <div class="prod-bg-pattern"></div>
        <img
          class="prod-img"
          src="${p.imagen}"
          alt="${p.nombre}"
          loading="lazy"
          data-base="${p.imagen_base || ''}"
          onerror="imgFallback(this)">
        <div class="prod-emoji-wrap prod-emoji-fallback" style="display:none">${p.emoji}</div>
        <span class="prod-cat-badge">${p.categoriaLabel}</span>
      </div>
      <div class="prod-body">
        <h3 class="prod-nombre">${p.nombre}</h3>
        <p class="prod-desc">${p.descripcion}</p>
        <div class="prod-pie">
          <span class="prod-peso">⚖️ ${p.peso}</span>
          <a href="${waLink('Hola! Me interesa el producto: ' + p.nombre + ' (' + p.peso + '). ¿Pueden darme más información?')}"
             class="prod-consultar" target="_blank" rel="noopener">
            <i class="fab fa-whatsapp"></i> Consultar
          </a>
        </div>
      </div>
    </div>
  `).join('');
}

document.getElementById('buscador')?.addEventListener('input', e => {
  busqueda = e.target.value;
  renderizarProductos();
});

// ---- Formulario ----
document.getElementById('form-contacto')?.addEventListener('submit', e => {
  e.preventDefault();
  const d = new FormData(e.target);
  const nombre = d.get('nombre') || '';
  const producto = d.get('producto') || '';
  const msg = d.get('mensaje') || '';
  const texto = `Hola! Soy ${nombre}.${producto ? ' Me interesa consultar sobre: ' + producto + '.' : ''} ${msg}`.trim();
  window.open(waLink(texto), '_blank');
  e.target.style.display = 'none';
  document.getElementById('form-ok')?.style.setProperty('display', 'block');
});

// ---- Init ----
document.addEventListener('DOMContentLoaded', cargarProductos);
