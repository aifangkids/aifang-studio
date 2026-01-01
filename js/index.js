/* ================= API ================= */
const API_URL = 'https://script.google.com/macros/s/AKfycbxnlAwKJucHmCKcJwv67TWuKV0X74Daag9X9I4NG7DOESREuYdU7BtWBPcEHyoJphoEfg/exec'; // ← 그대로 붙여

/* ================= STATE ================= */
let allProducts = [];

/* ================= INIT ================= */
document.addEventListener('DOMContentLoaded', () => {
  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      allProducts = data.products || data;
      initFilters();
      renderAll();
    })
    .catch(err => {
      console.error('API error', err);
    });
});

/* ================= FILTER ================= */
function initFilters() {
  const categorySet = new Set();
  const brandSet = new Set();

  allProducts.forEach(p => {
    if (p.category) categorySet.add(p.category);
    if (p.brand) brandSet.add(p.brand);
  });

  document.getElementById('category-list').innerHTML =
    [...categorySet].map(c => `<li>${c}</li>`).join('');

  document.getElementById('brand-list').innerHTML =
    [...brandSet].map(b => `<li>${b}</li>`).join('');
}

/* ================= RENDER ================= */
function renderAll() {
  const newBox = document.getElementById('new-products');
  const colBox = document.getElementById('collection-products');

  newBox.innerHTML = '';
  colBox.innerHTML = '';

  allProducts.forEach(p => {
    const card = createCard(p);
    if (p.collection === 'NEW') {
      newBox.appendChild(card);
    } else if (p.collection === 'COLLECTION') {
      colBox.appendChild(card);
    }
  });
}

function createCard(p) {
  const div = document.createElement('div');
  div.className = 'product-card';
  div.innerHTML = `
    <div class="product-brand">${p.brand || ''}</div>
    <img src="${p.image || ''}" alt="">
    <div class="product-name">${p.name || ''}</div>
  `;
  div.onclick = () => {
    location.href = `detail.html?code=${p.code}`;
  };
  return div;
}
