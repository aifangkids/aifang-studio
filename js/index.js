import { fetchProducts } from "./api.js"; // 永遠不用改 api.js

const heroBanner = document.getElementById("hero-banner");
const newArrivals = document.getElementById("new-arrivals");
const collection = document.getElementById("collection");

const SIZES = ["baby","kids","junior","adult"];

// 初始化
async function init() {
    try {
        const products = await fetchProducts();
        const activeProducts = products.filter(p => p.status === "ACTIVE");

        renderHero(activeProducts);
        renderNewArrivals(activeProducts);
        renderCollection(activeProducts);
    } catch(err) {
        console.error("初始化失敗", err);
    }
}

// 取得顯示價格
function getDisplayPrice(product, sizeKey) {
    const price = product[`price_${sizeKey}`];
    const priceOff = product[`price_${sizeKey}_10off`] || product[`price_${sizeKey}_sale`];
    const label = product[`price_${sizeKey}_label`] || "";

    if(!price) return "";
    if(priceOff) return `<del>${price}</del> <span style="color:#d9534f;">${priceOff} ${label}</span>`;
    return `${price} ${product.currency || "NT$"}`;
}

// 生成尺寸按鈕區塊
function renderSizeButtons(product, sizeKey) {
    const sizes = product[`sizes_${sizeKey}`];
    if(!sizes || sizes.length === 0) return "";
    const priceHTML = getDisplayPrice(product, sizeKey);

    return `
    <div class="size-category">
        <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:10px;">
            ${sizeKey.toUpperCase()} <strong>${priceHTML}</strong>
        </div>
        <div style="display:flex; gap:10px;">
            ${sizes.map(sz => `<button class="s-btn s-btn-${sizeKey}">${sz}</button>`).join("")}
        </div>
    </div>
    `;
}

// 商品卡
function renderProductCard(product) {
    // hover 圖片僅存在才加入
    const hoverImg = product.image_hover ? `<img class="p-img-hover" src="${product.image_hover}">` : "";
    
    // 判斷使用哪個尺寸做首頁顯示價格，優先 baby > kids > junior > adult
    let displaySize = SIZES.find(s => product[`price_${s}`]);
    const priceHTML = displaySize ? getDisplayPrice(product, displaySize) : "";

    return `
    <div class="p-card">
        <div class="p-img-box">
            <img class="p-img-main" src="${product.image_main}">
            ${hoverImg}
        </div>
        <div class="p-info">
            <div class="p-name">${product.name}</div>
            <div class="p-price">${priceHTML}</div>
        </div>
    </div>
    `;
}

// Hero Banner: 取 collection 欄位第一個
function renderHero(products) {
    const hero = products.find(p => p.collection);
    if(hero) heroBanner.style.backgroundImage = `url(${hero.image_main})`;
}

// NEW ARRIVALS: is_new === true
function renderNewArrivals(products) {
    const newProducts = products.filter(p => p.is_new);
    newArrivals.innerHTML = newProducts.map(renderProductCard).join("");
}

// COLLECTION: 前 8 個商品
function renderCollection(products) {
    const collProducts = products.slice(0, 8);
    collection.innerHTML = collProducts.map(renderProductCard).join("");
}

init();
