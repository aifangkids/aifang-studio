// ----------------- POPUP -----------------
const popup = document.getElementById('popup');
const popupSlides = document.getElementById('popup-slides');
const popupClose = document.getElementById('popup-close');
let currentSlide = 0;
let popupImages = [];

// 載入 POPUP 圖片 (可放 popup.json 或手動陣列)
async function loadPopupImages() {
    try {
        // JSON 方式 (可維護)
        const res = await fetch('./images/popup/popup.json');
        const files = await res.json();
        return files.map(f => `./images/popup/${f}`);
    } catch(e) {
        console.warn("JSON 載入失敗，使用手動陣列", e);
        // 手動陣列備援
        return [
            "./images/popup/popup_01.jpg",
            "./images/popup/popup_02.jpg",
            "./images/popup/popup_03.jpg"
        ];
    }
}

function initPopup(images) {
    popupImages = images;
    if (!popupImages || popupImages.length === 0) return;

    popupSlides.innerHTML = '';
    popupImages.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        popupSlides.appendChild(img);
    });

    showSlide(currentSlide);

    if (!localStorage.getItem('popupClosed')) {
        popup.style.display = 'flex';
    }
}

function showSlide(index) {
    const slides = popupSlides.querySelectorAll('img');
    slides.forEach(s => s.style.display = 'none');
    slides[index].style.display = 'block';
}

// 自動輪播
setInterval(() => {
    if (!popup || popup.style.display === 'none') return;
    currentSlide = (currentSlide + 1) % popupImages.length;
    showSlide(currentSlide);
}, 3000);

// 關閉 POPUP
popupClose.addEventListener('click', () => {
    popup.style.display = 'none';
    localStorage.setItem('popupClosed', 'true');
});

// ----------------- 商品 & 側欄 -----------------
const productsContainer = document.getElementById('products');
const categoryList = document.getElementById('category-list');
const brandList = document.getElementById('brand-list');
const viewMoreBtn = document.getElementById('view-more');

let allProducts = [];
let loadedCount = 0;
const LOAD_STEP = 8;

// VIEW MORE 滾動
viewMoreBtn.addEventListener('click', () => {
    document.getElementById('product-section').scrollIntoView({ behavior: 'smooth' });
});

// 初始化
async function init() {
    const popupImgs = await loadPopupImages();
    initPopup(popupImgs);

    // 載入商品
    const res = await fetch(API_URL);
    const data = await res.json();
    allProducts = data.products || [];

    populateFilters();
    loadProducts();

    window.addEventListener('scroll', handleScrollTopLine);
}

// 加載商品
function loadProducts() {
    const slice = allProducts.slice(loadedCount, loadedCount + LOAD_STEP);
    slice.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${p.image_main}" alt="${p.name}">
            <h4>${p.name}</h4>
            <div class="color-swatch">
                ${p.color_code ? p.color_code.map(c=>`<div style="background:${c}"></div>`).join('') : ''}
            </div>
        `;
        productsContainer.appendChild(card);
    });
    loadedCount += slice.length;
}

// 分類 / 品牌
function populateFilters() {
    const categories = [...new Set(allProducts.map(p => p.category))];
    const brands = [...new Set(allProducts.map(p => p.brand))];
    categoryList.innerHTML = categories.map(c => `<li>${c}</li>`).join('');
    brandList.innerHTML = brands.map(b => `<li>${b}</li>`).join('');
}

// TOP / LINE 按鈕滾動顯示
function handleScrollTopLine() {
    const topLine = document.getElementById('top-line');
    const productsTop = document.getElementById('product-section').offsetTop;
    if (window.scrollY + window.innerHeight / 2 >= productsTop) {
        topLine.style.display = 'flex';
    } else {
        topLine.style.display = 'none';
    }
}

document.getElementById('btn-top').addEventListener('click', ()=>window.scrollTo({top:0, behavior:'smooth'}));

init();
