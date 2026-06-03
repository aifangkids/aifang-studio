/**
 * AiFang Kids - index.js
 * [2026.06 最終整合版 - 已移除 9 折顯示]
 * 修正內容：
 * 1. 支援 price_baby, price_kid, price_junior, price_adult 多欄位金額判定。
 * 2. 修正 1+1 促銷在奇數商品時的顯示錯誤。
 * 3. 完整保留彈窗、搜尋與側欄功能。
 */

let allData = [];
let filteredData = []; // 存放目前篩選條件下的所有商品
let activeCat = 'All';
let activeBrands = new Set();
let displayCount = 20; // 初始顯示數量

/**
 * 1. 初始化頁面
 */
async function init() {
    bindPopupEvents(); 
    showRandomPopup(); 
    initSearchUI(); 
    
    try {
        console.log("🚀 [Index] 正在從 ApiService 初始化資料...");
        const res = await ApiService.getProducts();
        
        // 確保讀取 JSON 中的 products 陣列
        allData = res.products || res; 
        filteredData = allData;
        
        if (allData && allData.length > 0) {
            render(filteredData);
            const main = document.getElementById('main-content');
            if (main) main.classList.add('loaded');
        } else {
            throw new Error("目前沒有可顯示的商品");
        }
    } catch (e) {
        console.error("載入失敗:", e);
        const container = document.getElementById('product-list');
        if (container) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; padding: 100px 0; color:#888;">
                    <p style="font-size: 14px; letter-spacing: 1px;">SYSTEM MAINTENANCE</p>
                    <p style="font-size: 11px; margin-top: 10px;">請稍後再試或聯繫客服</p>
                </div>`;
        }
    }
}

/**
 * 1.1 搜尋功能優化
 */
function initSearchUI() {
    const searchBtn = document.querySelector('.search-icon-img'); 
    const searchInput = document.getElementById('search-input'); 
    const logo = document.querySelector('.site-logo');

    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            if (logo) logo.style.display = 'none';
            searchInput.style.display = 'block';
            searchInput.focus();
        });

        searchInput.addEventListener('blur', () => {
            if (searchInput.value.trim() === "") {
                if (logo) logo.style.display = 'block';
                searchInput.style.display = 'none';
            }
        });

        searchInput.addEventListener('input', (e) => {
            handleSearch(e.target.value);
        });
    }
}

/**
 * 2. 渲染商品列表
 */
function render(items) {
    const container = document.getElementById('product-list');
    const loadMoreContainer = document.getElementById('load-more-container');
    if (!container) return;
    
    container.innerHTML = "";
    
    if (items.length === 0) {
        container.innerHTML = "<p style='grid-column: 1/-1; text-align:center; padding: 100px 0; color:#bbb; letter-spacing:2px;'>COMING SOON...</p>";
        if (loadMoreContainer) loadMoreContainer.style.display = 'none';
        return;
    }

    const itemsToRender = items.slice(0, displayCount);

    itemsToRender.forEach(item => {
        const status = (String(item.status || "")).toUpperCase();
        const isSale = status === "SALE";
        const badgeHtml = status ? `<span class="status-badge badge-${status}">${status}</span>` : "";
        
        // --- 依序檢查四種尺寸價格，抓取第一個有值的金額作為列表顯示 ---
        const originalPrice = Number(
            item.price_baby || 
            item.price_kid || 
            item.price_junior || 
            item.price_adult || 
            item.price || 0
        );

        let priceHtml = "";
        if (originalPrice === 0) {
            priceHtml = `<div class="p-price-wrapper"><div class="p-price-final">COMING SOON</div></div>`;
        } else if (isSale) {
            // 特價商品維持紅色高亮醒目提示
            priceHtml = `
                <div class="p-price-wrapper on-sale">
                    <div class="p-price-final" style="color: #d9534f; font-weight: bold;">NT$ ${originalPrice.toLocaleString()}</div>
                </div>`;
        } else {
            // 已修正：一般商品與新品直接清爽顯示原價，不再顯示折價刪除線
            priceHtml = `
                <div class="p-price-wrapper">
                    <div class="p-price-final">NT$ ${originalPrice.toLocaleString()}</div>
                </div>`;
        }

        const names = String(item.color || "").split(',').filter(Boolean);
        const codes = String(item.color_code || "").split(',').filter(Boolean);
        const patterns = String(item.color_pattern || "").split(',').filter(Boolean);

        let colorHtml = '<div class="color-row">';
        names.forEach((name, index) => {
            const hex = (codes[index] || "").trim();
            const patternImg = (patterns[index] || "").trim();
            let dotStyle = patternImg ? `background-image: url('${patternImg}');` : (hex.startsWith('#') ? `background-color: ${hex};` : "");
            if (dotStyle) colorHtml += `<div class="color-dot" title="${name.trim()}" style="${dotStyle}"></div>`;
        });
        colorHtml += '</div>';

        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => { if(item.code) location.href = `detail.html?code=${item.code}`; };
        
        card.innerHTML = `
            <div class="img-wrap" style="background-image: url('${item.image_main}')">${badgeHtml}</div>
            <div class="info-wrap">
                <p class="p-name">${item.name || 'Untitled'}</p>
                ${colorHtml}
                ${priceHtml}
            </div>`;
        container.appendChild(card);
    });

    if (loadMoreContainer) {
        loadMoreContainer.style.display = (items.length > displayCount) ? 'block' : 'none';
    }
}

/** 顯示更多商品功能 */
function loadMoreProducts() {
    displayCount += 20;
    render(filteredData);
}

/**
 * 3. 搜尋與篩選
 */
function handleSearch(query) {
    const q = query.toLowerCase().trim();
    displayCount = 20; 
    if (!q) {
        filterByCat(activeCat);
        return;
    }
    filteredData = allData.filter(p => 
        (String(p.code).toLowerCase().includes(q)) || (String(p.name).toLowerCase().includes(q))
    );
    render(filteredData);
}

function filterByCat(cat) {
    activeCat = cat; 
    activeBrands.clear(); 
    displayCount = 20; 
    document.querySelectorAll('.category-menu li').forEach(li => {
        const liText = li.innerText.replace(' ITEMS', '').trim();
        li.classList.toggle('active', liText.toUpperCase() === cat.toUpperCase());
    });

    filteredData = cat === 'All' ? allData : allData.filter(p => p.category === cat);
    const area = document.getElementById('brand-area');
    const brandList = document.getElementById('brand-list');
    
    if (cat === 'All' || filteredData.length === 0) { 
        if (area) area.classList.remove('open'); 
    } else {
        if (area) area.classList.add('open');
        const brands = [...new Set(filteredData.map(p => p.brand))].filter(Boolean);
        if (brandList) {
            brandList.innerHTML = brands.map(b => 
                `<div class="brand-item" onclick="toggleBrand(event, '${b}')" id="b-${b}">${b}</div>`
            ).join('');
        }
    }
    render(filteredData);
    if (window.innerWidth <= 900) closeMenu();
}

function toggleBrand(e, b) {
    if (e) e.stopPropagation();
    displayCount = 20; 
    const el = document.getElementById(`b-${b}`);
    if (activeBrands.has(b)) { 
        activeBrands.delete(b); 
        if (el) el.classList.remove('selected'); 
    } else { 
        activeBrands.add(b); 
        if (el) el.classList.add('selected'); 
    }

    let final = allData.filter(p => p.category === activeCat);
    if (activeBrands.size > 0) final = final.filter(p => activeBrands.has(p.brand));
    filteredData = final;
    render(filteredData);
}

/**
 * 4. 購物車 UI 互動
 */
function toggleCart() {
    const cartSide = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    if (!cartSide || !overlay) return;
    const isOpen = cartSide.classList.toggle('open');
    overlay.style.display = isOpen ? 'block' : 'none';
    if (isOpen) renderMiniCart();
}

function renderMiniCart() {
    const rawCartData = JSON.parse(localStorage.getItem('cart')) || [];
    const container = document.getElementById('mini-cart-body');
    const subtotalEl = document.getElementById('mini-cart-subtotal');
    const discountEl = document.getElementById('mini-cart-discount');
    const totalEl = document.getElementById('mini-cart-total');

    if (!container) return;
    if (rawCartData.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:80px 0; color:#ccc;"><p style="font-size:11px; letter-spacing:1px;">YOUR BAG IS EMPTY</p></div>`;
        if(subtotalEl) subtotalEl.innerText = `NT$ 0`;
        if(discountEl) discountEl.innerText = `NT$ 0`;
        if(totalEl) totalEl.innerText = `NT$ 0`;
        return;
    }

    const summary = ApiService.calculateCart(rawCartData);
    
    // 1+1 精確邏輯：只針對成對的商品顯示標籤
    const newItemsTotal = summary.processedItems
        .filter(item => String(item.status).toUpperCase() === "NEW")
        .reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

    const pairsAvailable = Math.floor(newItemsTotal / 2);
    let pairsAssigned = 0; 

    container.innerHTML = summary.processedItems.map((item, index) => {
        const isNew = String(item.status).toUpperCase() === "NEW";
        let promoHtml = "";

        if (isNew) {
            let lineItemHasPromo = false;
            for (let i = 0; i < item.quantity; i++) {
                if (pairsAssigned < pairsAvailable * 2) {
                    lineItemHasPromo = true;
                    pairsAssigned++;
                }
            }
            if (lineItemHasPromo) promoHtml = `<p style="color:#d9534f; font-size:10px; margin-top:2px;">✨ 1+1 組合折抵中</p>`;
        }

        // 金額顯示優化（此處會自動同步讀取 api.js 計算後的無九折正確單價）
        const displayPrice = Number(item.unit_price || item.price || 0);

        return `
            <div class="cart-item" style="display:flex; align-items:center; margin-bottom:15px; position:relative;">
                <div class="cart-item-img-wrap">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="cart-item-info" style="flex:1; font-size:12px;">
                    <p style="font-weight:700; margin-bottom:2px;">${item.name}</p>
                    <p style="color:#888; font-size:11px; margin-bottom:4px;">${item.korean_color || item.color} / ${item.size}</p>
                    <p style="font-weight:500;">${item.quantity} x NT$ ${displayPrice.toLocaleString()}</p>
                    ${promoHtml}
                </div>
                <img src="./images/ui/btn_close.jpg" onclick="removeFromCart(${index})" style="width:15px; cursor:pointer; position:absolute; top:0; right:0;" alt="Remove">
            </div>`;
    }).join('');
    
    if(subtotalEl) subtotalEl.innerText = `NT$ ${(Number(summary.subtotal) || 0).toLocaleString()}`;
    if(discountEl) discountEl.innerText = `- NT$ ${(Number(summary.discount_total) || 0).toLocaleString()}`;
    if(totalEl) totalEl.innerText = `NT$ ${(Number(summary.total_amount) || 0).toLocaleString()}`;
}

function removeFromCart(index) {
    let cartData = JSON.parse(localStorage.getItem('cart')) || [];
    cartData.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cartData));
    renderMiniCart();
}

/**
 * 5. 側欄選單控制
 */
function toggleMenu() { 
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if(sidebar && overlay) { sidebar.classList.add('open'); overlay.classList.add('active'); }
}
function closeMenu() { 
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if(sidebar && overlay) { sidebar.classList.remove('open'); overlay.classList.remove('active'); }
}

/**
 * 6. 彈窗邏輯
 */
function showRandomPopup() {
    const pops = ['./images/popup/popup_01.jpg','./images/popup/popup_02.jpg','./images/popup/popup_03.jpg']; 
    const randomPop = pops[Math.floor(Math.random() * pops.length)];
    const popImg = document.getElementById('popup-img');
    const overlay = document.getElementById('popup-overlay');
    if (popImg && overlay) { popImg.src = randomPop; overlay.style.display = 'flex'; }
}
function bindPopupEvents() {
    const overlay = document.getElementById('popup-overlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closePopup(); });
    }
}
function closePopup() { 
    const overlay = document.getElementById('popup-overlay');
    if (overlay) overlay.style.display = 'none'; 
}

window.addEventListener('DOMContentLoaded', init);