import { fetchProducts } from './api.js';

// ===== DOM Elements =====
const newGrid = document.getElementById('new-grid');
const collectionGrid = document.getElementById('collection-grid');
const categoryList = document.getElementById('category-list');
const rightCart = document.getElementById('right-cart');
const overlay = document.getElementById('overlay');

// ===== 商品分類/品牌資料 =====
let categories = {};
let selectedCategory = null;
let selectedBrands = [];

// ===== 初始化 =====
async function init() {
    const products = await fetchProducts();
    renderCategories(products);
    renderProducts(products);
}

// ===== Render Products =====
function renderProducts(products) {
    newGrid.innerHTML = '';
    collectionGrid.innerHTML = '';

    products.forEach(p => {
        if (p.status !== 'ACTIVE') return;

        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => location.href = `detail.html?code=${p.code}`;
        card.innerHTML = `
            <div class="brand-tag">${p.brand}</div>
            ${isSoldOut(p) ? '<div class="sold-out">SOLD OUT</div>' : ''}
            <img class="main-img" src="${p.image_main}" alt="${p.name}">
            <div class="product-name">${p.name}</div>
            <div class="product-price">${getPriceHTML(p)}</div>
            <div class="color-dots">${getColorDots(p)}</div>
        `;

        if (p.collection === 'NEW') newGrid.appendChild(card);
        else if (p.collection === 'COLLECTION') collectionGrid.appendChild(card);
    });
}

// ===== 判斷是否售罄 =====
function isSoldOut(p) {
    return [p.price_baby, p.price_kid, p.price_junior, p.price_adult]
        .every(price => !price || price === '');
}

// ===== 生成價格 HTML =====
function getPriceHTML(p) {
    let html = '';
    if (p.price_baby_10off) html += `<span class="price-old">NT$ ${p.price_baby}</span> <span class="price-discount">NT$ ${p.price_baby_10off} -10%OFF</span>`;
    else if (p.price_baby) html += `NT$ ${p.price_baby}`;
    return html;
}

// ===== 生成顏色圓點 =====
function getColorDots(p) {
    const codes = p.color_code?.split(',') || [];
    const patterns = p.color_pattern?.split(',') || [];
    let html = '';
    for (let i = 0; i < codes.length; i++) {
        html += `<span class="color-dot" style="background:${codes[i]};" title="${patterns[i] || ''}"></span>`;
    }
    return html;
}

// ===== Render Categories / Brands =====
function renderCategories(products) {
    categories = {};
    products.forEach(p => {
        if (!categories[p.category]) categories[p.category] = new Set();
        categories[p.category].add(p.brand);
    });

    categoryList.innerHTML = '';
    for (const cat in categories) {
        const div = document.createElement('div');
        div.className = 'category-item';
        div.innerHTML = `<strong>${cat}</strong>`;
        const brandList = document.createElement('div');
        brandList.className = 'brand-list';
        categories[cat].forEach(brand => {
            const brandDiv = document.createElement('div');
            brandDiv.className = 'brand-item';
            brandDiv.innerHTML = `<input type="checkbox" value="${brand}"> ${brand}`;
            brandList.appendChild(brandDiv);
        });
        div.appendChild(brandList);
        categoryList.appendChild(div);
    }
}

// ===== Overlay / Side Nav =====
function toggleMenu(open) {
    document.getElementById('left-menu').style.left = open ? '0' : '-320px';
    overlay.style.display = open ? 'block' : 'none';
}

function toggleCart() {
    rightCart.style.right = rightCart.style.right === '0px' ? '-320px' : '0px';
    overlay.style.display = rightCart.style.right === '0px' ? 'block' : 'none';
}

function closeAll() {
    toggleMenu(false);
    rightCart.style.right = '-320px';
    overlay.style.display = 'none';
}

init();
