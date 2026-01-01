// index.js (ES Module)
import { fetchProducts } from './api.js';

document.addEventListener('DOMContentLoaded', initPage);

async function initPage() {
  try {
    const products = await fetchProducts();

    if (!Array.isArray(products)) {
      console.error('API products 不是陣列', products);
      return;
    }

    renderProducts(products);
  } catch (err) {
    console.error('初始化頁面錯誤', err);
  }
}

function renderProducts(products) {
  const newGrid = document.getElementById('newGrid');
  const collectionGrid = document.getElementById('collectionGrid');

  newGrid.innerHTML = '';
  collectionGrid.innerHTML = '';

  products
    .filter(p => p.status === 'ACTIVE')
    .forEach(p => {
      const card = createProductCard(p);

      if (p.collection === 'NEW') {
        newGrid.appendChild(card);
      } else if (p.collection === 'COLLECTION') {
        collectionGrid.appendChild(card);
      }
    });
}

function createProductCard(p) {
  const div = document.createElement('div');
  div.className = 'product-card';

  div.innerHTML = `
    <div class="img-box">
      <img src="${p.image_main}" alt="${p.name}">
    </div>
    <div class="info">
      <div class="brand">${p.brand}</div>
      <div class="name">${p.name}</div>
      <div class="price">
        ${renderPrice(p)}
      </div>
    </div>
  `;

  div.addEventListener('click', () => {
    location.href = `detail.html?code=${p.code}`;
  });

  return div;
}

function renderPrice(p) {
  // index 頁只顯示「最低價區間」
  const prices = [
    p.price_baby_10off || p.price_baby,
    p.price_kid_10off || p.price_kid,
    p.price_junior_10off || p.price_junior,
    p.price_adult_10off || p.price_adult
  ].filter(Boolean);

  if (!prices.length) return '<span class="soldout">SOLD OUT</span>';

  const min = Math.min(...prices);
  return `${p.currency || 'NT$'} ${min}`;
}
