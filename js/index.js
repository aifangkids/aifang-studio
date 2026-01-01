const API_URL = "https://script.google.com/macros/s/AKfycbwdGXe894aMoE9Hwedj-bfqHdzpOLYk72c2jVWRipFq07cLGiSRRHZaEcIYhvGWD7qx/exec";

let allData = [];
let activeCat = 'All';
let activeBrands = new Set();

async function fetchData() {
  showRandomPopup();
  try {
    const res = await fetch(API_URL);
    allData = await res.json();
    render(allData);
    document.getElementById('main-content').classList.add('loaded');
  } catch (e) {
    console.error(e);
  }
}

function render(items) {
  const container = document.getElementById('product-list');
  container.innerHTML = "";

  items.forEach(item => {
    const s = (item.status || item.Status || "").toString().trim().toUpperCase();
    const badgeHtml = s ? `<span class="status-badge badge-${s}">${s}</span>` : "";

    const rawColors = (item.color_code || item.Color_code || "").toString();
    const colors = rawColors ? rawColors.split(',') : [];
    let colorHtml = '<div class="color-row">';
    colors.forEach(c => {
      const hex = c.trim();
      if (hex.startsWith('#')) {
        colorHtml += `<div class="color-dot" style="background:${hex}"></div>`;
      }
    });
    colorHtml += '</div>';

    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="img-wrap" style="background-image:url('${item.image_url}')">
        ${badgeHtml}
      </div>
      <div class="info-wrap">
        <p class="p-name">${item.name}</p>
        ${colorHtml}
        <p class="p-price">NT$ ${Number(item.price).toLocaleString()}</p>
      </div>
    `;
    container.appendChild(card);
  });
}

function toggleMenu() {
  if (window.innerWidth <= 900) {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('overlay').classList.add('active');
  } else {
    const sb = document.getElementById('sidebar');
    const mc = document.getElementById('main-content');
    if (sb.style.transform === 'translateX(-100%)') {
      sb.style.transform = 'translateX(0)';
      mc.style.paddingLeft = 'calc(var(--sidebar-width) + 40px)';
    } else {
      sb.style.transform = 'translateX(-100%)';
      mc.style.paddingLeft = '40px';
    }
  }
}

function closeMenu() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('active');
}

function toggleCart() {
  alert("購物車預覽即將推出");
}

function filterByCat(cat) {
  activeCat = cat;
  activeBrands.clear();

  document.querySelectorAll('.category-menu li')
    .forEach(li => li.classList.toggle('active', li.innerText === cat));

  const filtered = cat === 'All'
    ? allData
    : allData.filter(p => p.category === cat);

  const area = document.getElementById('brand-area');
  if (cat === 'All') {
    area.classList.remove('open');
  } else {
    area.classList.add('open');
    const brands = [...new Set(filtered.map(p => p.brand))].filter(Boolean);
    document.getElementById('brand-list').innerHTML =
      brands.map(b =>
        `<div class="brand-item" onclick="toggleBrand('${b}')" id="b-${b}">${b}</div>`
      ).join('');
  }

  render(filtered);
}

function toggleBrand(b) {
  const el = document.getElementById(`b-${b}`);
  if (activeBrands.has(b)) {
    activeBrands.delete(b);
    el.classList.remove('selected');
  } else {
    activeBrands.add(b);
    el.classList.add('selected');
  }

  let final = allData.filter(p => p.category === activeCat);
  if (activeBrands.size > 0) {
    final = final.filter(p => activeBrands.has(p.brand));
  }
  render(final);
}

function showRandomPopup() {
  const pops = [
    './images/popup/popup_01.jpg',
    './images/popup/popup_02.jpg',
    './images/popup/popup_03.jpg'
  ];
  document.getElementById('popup-img').src =
    pops[Math.floor(Math.random() * pops.length)];
  document.getElementById('popup-overlay').style.display = 'flex';
}

function closePopup() {
  document.getElementById('popup-overlay').style.display = 'none';
}

window.onload = fetchData;
