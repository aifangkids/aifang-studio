// ================================
// index.js (正式版)
// ================================

// --- 左側分類 / 品牌 ---
function generateCategories(products) {
  const categoryList = document.getElementById('category-list');
  const categories = [...new Set(products.map(p => p.category))].sort();
  categoryList.innerHTML = '';
  categories.forEach(cat => {
    const li = document.createElement('li');
    li.textContent = cat;
    li.addEventListener('click', () => filterByCategory(cat));
    categoryList.appendChild(li);
  });
}

// --- 商品卡片生成 ---
function generateProducts(products) {
  const newContainer = document.getElementById('new-products');
  const colContainer = document.getElementById('collection-products');

  newContainer.innerHTML = '';
  colContainer.innerHTML = '';

  products.forEach(p => {
    if(p.status !== 'ACTIVE') return; // 不顯示 HIDDEN
    const container = p.collection === 'NEW' ? newContainer : colContainer;

    const card = document.createElement('div');
    card.className = 'p-card';
    card.onclick = () => location.href = `detail.html?code=${p.code}`;

    const img = document.createElement('img');
    img.src = p.image_main;
    card.appendChild(img);

    const info = document.createElement('div');
    info.className = 'p-info';

    const name = document.createElement('div');
    name.className = 'p-name';
    name.textContent = p.brand + ' / ' + p.name;
    info.appendChild(name);

    const price = document.createElement('div');
    price.className = 'p-price';
    if(p.price_baby_10off) {
      price.innerHTML = `<s>${p.currency}${p.price_baby}</s> <span style="color:red;">${p.currency}${p.price_baby_10off} -10%OFF</span>`;
    } else {
      price.textContent = `${p.currency}${p.price_baby}`;
    }
    info.appendChild(price);

    // color dots
    const colors = document.createElement('div');
    const colorCodes = p.color_code.split(',');
    colorCodes.forEach(c => {
      const dot = document.createElement('span');
      dot.className = 'color-dot';
      dot.style.background = c;
      colors.appendChild(dot);
    });
    info.appendChild(colors);

    card.appendChild(info);
    container.appendChild(card);
  });
}

// --- 左側分類篩選 ---
function filterByCategory(cat) {
  fetchProducts().then(products => {
    const filtered = products.filter(p => p.category === cat);
    generateProducts(filtered);
  });
}

// --- 右側購物車 ---
function updateCart(cartItems) {
  const container = document.getElementById('cart-items');
  container.innerHTML = '';
  cartItems.forEach(item => {
    const div = document.createElement('div');
    div.textContent = `${item.name} / ${item.size} ${item.currency}${item.price}`;
    container.appendChild(div);
  });
}

// --- API 抓取 ---
function fetchProducts() {
  return fetch('./js/api.js')
    .then(res => res.json())
    .catch(err => console.error('API fetch error:', err));
}

// --- Popup ---
const popupImages = './images/popup/popup_01.jpg,./images/popup/popup_02.jpg,./images/popup/popup_03.jpg'.split(',');
let currentPopup = 0;
function showPopup() {
  const overlay = document.getElementById('popup-overlay');
  overlay.style.display = 'block';
  const slider = document.getElementById('popup-slider');
  slider.innerHTML = `<img src="${popupImages[currentPopup]}">`;
}
function closePopup() { document.getElementById('popup-overlay').style.display = 'none'; }
function prevPopup() { currentPopup = (currentPopup - 1 + popupImages.length) % popupImages.length; showPopup(); }
function nextPopup() { currentPopup = (currentPopup + 1) % popupImages.length; showPopup(); }

// --- 左側 / 右側 Sidebar ---
function toggleLeftMenu() { document.getElementById('left-menu').classList.toggle('active'); }
function toggleRightCart() { document.getElementById('right-cart').classList.toggle('active'); }

// --- 初始化 ---
document.addEventListener('DOMContentLoaded', () => {
  fetchProducts().then(products => {
    generateCategories(products);
    generateProducts(products);
  });
  showPopup(); // 頁面載入顯示 popup
});
