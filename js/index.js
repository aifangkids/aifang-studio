/**
 * AiFang Kids - index.js
 * [2026.02 最終優化版 - 配合 api.js 預處理價格顯示]
 */

let allData = [];
let activeCat = 'All';
let activeBrands = new Set();

/**
 * 1. 初始化頁面
 */
async function init() {
    showRandomPopup(); 
    bindPopupEvents(); 
    
    try {
        console.log("🚀 [Index] 正在初始化商品資料...");
        // 調用 api.js 封裝好的 ApiService
        // 注意：這裡拿到的資料已經過 api.js 的 _processPrices 處理
        allData = await ApiService.fetchProducts();
        
        if (allData && allData.length > 0) {
            render(allData);
            document.getElementById('main-content').classList.add('loaded');
        } else {
            throw new Error("無商品資料");
        }
    } catch (e) {
        console.error("載入失敗:", e);
        const container = document.getElementById('product-list');
        if (container) container.innerHTML = "<p style='grid-column: 1/-1; text-align:center; padding: 50px;'>系統維護中，請稍後再試。</p>";
    }
}

/**
 * 2. 渲染商品列表 (配合 api.js 欄位顯示)
 */
function render(items) {
    const container = document.getElementById('product-list');
    if (!container) return;
    
    container.innerHTML = "";
    
    if (items.length === 0) {
        container.innerHTML = "<p style='grid-column: 1/-1; text-align:center; padding: 50px; color:#999;'>Coming Soon...</p>";
        return;
    }

    items.forEach(item => {
        const status = (String(item.status) || "").toUpperCase();
        const isSale = status === "SALE";
        const badgeHtml = status ? `<span class="status-badge badge-${status}">${status}</span>` : "";
        
        // --- 價格顯示邏輯：直接取用 api.js 算好的欄位 ---
        let priceHtml = "";

        if (isSale) {
            // SALE 商品：只顯示最終價 (紅字)
            priceHtml = `
                <div class="p-price-wrapper on-sale">
                    <div class="p-price-final">NT$ ${item.price_final.toLocaleString()}</div>
                </div>`;
        } else {
            // 一般商品：顯示原價 (刪除線) + 9折價
            priceHtml = `
                <div class="p-price-wrapper">
                    <div class="p-price-original">NT$ ${item.price_original.toLocaleString()}</div>
                    <div class="p-price-final">NT$ ${item.price_final.toLocaleString()}</div>
                </div>`;
        }

        // 處理顏色圓點與花色 (Pattern)
        const names = String(item.color || "").split(',').filter(Boolean);
        const codes = String(item.color_code || "").split(',').filter(Boolean);
        const patterns = String(item.color_pattern || "").split(',').filter(Boolean);

        let colorHtml = '<div class="color-row">';
        names.forEach((name, index) => {
            const hex = (codes[index] || "").trim();
            const patternImg = (patterns[index] || "").trim();
            let style = "";
            
            if (patternImg) {
                style = `background-image: url('${patternImg}'); background-size: cover;`;
            } else if (hex.startsWith('#')) {
                style = `background-color: ${hex};`;
            }
            
            if (style) {
                colorHtml += `<div class="color-dot" title="${name.trim()}" style="${style}"></div>`;
            }
        });
        colorHtml += '</div>';

        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => {
            if(item.code) location.href = `detail.html?code=${item.code}`;
        };
        
        card.innerHTML = `
            <div class="img-wrap" style="background-image: url('${item.image_main}')">${badgeHtml}</div>
            <div class="info-wrap">
                <p class="p-name">${item.name || '未命名商品'}</p>
                ${colorHtml}
                ${priceHtml}
            </div>`;
        container.appendChild(card);
    });
}

/**
 * 3. 搜尋與篩選邏輯 (保持不變)
 */
function handleSearch(query) {
    const q = query.toLowerCase().trim();
    if (!q) {
        filterByCat(activeCat);
        return;
    }
    const filtered = allData.filter(p => 
        (String(p.code).toLowerCase().includes(q)) || 
        (String(p.name).toLowerCase().includes(q))
    );
    render(filtered);
}

function filterByCat(cat) {
    activeCat = cat; 
    activeBrands.clear(); 
    
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = ""; 

    document.querySelectorAll('.category-menu li').forEach(li => {
        const liText = li.innerText.replace(' ITEMS', '').trim();
        li.classList.toggle('active', liText.toUpperCase() === cat.toUpperCase());
    });

    const filtered = cat === 'All' ? allData : allData.filter(p => p.category === cat);
    
    const area = document.getElementById('brand-area');
    const brandList = document.getElementById('brand-list');
    
    if (cat === 'All' || filtered.length === 0) { 
        if (area) area.classList.remove('open'); 
    } else {
        if (area) area.classList.add('open');
        const brands = [...new Set(filtered.map(p => p.brand))].filter(Boolean);
        if (brandList) {
            brandList.innerHTML = brands.map(b => 
                `<div class="brand-item" onclick="toggleBrand(event, '${b}')" id="b-${b}">${b}</div>`
            ).join('');
        }
    }
    
    render(filtered);
    if (window.innerWidth <= 900) closeMenu();
}

function toggleBrand(e, b) {
    if (e) e.stopPropagation();
    const el = document.getElementById(`b-${b}`);
    
    if (activeBrands.has(b)) { 
        activeBrands.delete(b); 
        if (el) el.classList.remove('selected'); 
    } else { 
        activeBrands.add(b); 
        if (el) el.classList.add('selected'); 
    }

    let final = allData.filter(p => p.category === activeCat);
    if (activeBrands.size > 0) {
        final = final.filter(p => activeBrands.has(p.brand));
    }
    render(final);
}

/**
 * 4. UI 互動 (保持不變)
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
    const cartData = JSON.parse(localStorage.getItem('cart')) || [];
    const container = document.getElementById('mini-cart-body');
    const totalEl = document.getElementById('mini-cart-total');
    let total = 0;

    if (!container || !totalEl) return;

    if (cartData.length === 0) {
        container.innerHTML = "<p style='text-align:center; padding:40px; color:#bbb; font-size:12px;'>Bag is empty</p>";
        totalEl.innerText = `NT$ 0`;
        return;
    }

    container.innerHTML = cartData.map(item => {
        // 注意：這裡應使用 item.price，因為加入購物車時應已存入 price_final
        total += item.price * item.quantity;
        return `
            <div style="display:flex; gap:15px; margin-bottom:20px; font-size:12px; align-items:center;">
                <img src="${item.image}" width="60" style="border-radius:2px; aspect-ratio:1/1; object-fit:cover;">
                <div style="flex:1;">
                    <p style="font-weight:700; margin-bottom:3px;">${item.name}</p>
                    <p style="color:#888;">${item.color} / ${item.size}</p>
                    <p style="margin-top:2px;">${item.quantity} x NT$ ${item.price.toLocaleString()}</p>
                </div>
            </div>`;
    }).join('');
    totalEl.innerText = `NT$ ${total.toLocaleString()}`;
}

function toggleMenu() { 
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if(sidebar && overlay) {
        sidebar.classList.add('open'); 
        overlay.classList.add('active'); 
    }
}
function closeMenu() { 
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if(sidebar && overlay) {
        sidebar.classList.remove('open'); 
        overlay.classList.remove('active'); 
    }
}

/**
 * 5. 彈窗邏輯 (保持不變)
 */
function showRandomPopup() {
    const pops = ['./images/popup/popup_01.jpg','./images/popup/popup_02.jpg','./images/popup/popup_03.jpg']; 
    const randomPop = pops[Math.floor(Math.random() * pops.length)];
    const popImg = document.getElementById('popup-img');
    const overlay = document.getElementById('popup-overlay');
    
    if (popImg && overlay) {
        popImg.src = randomPop;
        overlay.style.display = 'flex';
    }
}

function bindPopupEvents() {
    const overlay = document.getElementById('popup-overlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closePopup();
        });
    }
}

function closePopup() { 
    const overlay = document.getElementById('popup-overlay');
    if (overlay) overlay.style.display = 'none'; 
}

// 啟動
window.addEventListener('load', init);