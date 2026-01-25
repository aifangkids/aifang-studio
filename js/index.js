/**
 * AiFang Kids - index.js
 * [2026.01 最終檢查優化版]
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
 * 2. 渲染商品列表
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
        
        const displayPrice = Number(item.price_kid || 0);
        const priceClass = isSale ? "p-price on-sale" : "p-price";

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
        // 確保 code 存在才轉連結
        card.onclick = () => {
            if(item.code) location.href = `detail.html?code=${item.code}`;
        };
        
        card.innerHTML = `
            <div class="img-wrap" style="background-image: url('${item.image_main}')">${badgeHtml}</div>
            <div class="info-wrap">
                <p class="p-name">${item.name || '未命名商品'}</p>
                ${colorHtml}
                <div class="${priceClass}">NT$ ${displayPrice.toLocaleString()}</div>
            </div>`;
        container.appendChild(card);
    });
}

/**
 * 3. 搜尋與篩選邏輯
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

    // 修正：對應 HTML 的 li 選單激活狀態
    document.querySelectorAll('.category-menu li').forEach(li => {
        const liText = li.innerText.replace(' ITEMS', '').trim(); // 處理 "ALL ITEMS" -> "ALL"
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
 * 4. UI 互動（側欄、購物車）
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
 * 5. 彈窗邏輯
 */
function showRandomPopup() {
    const pops = ['./images/popup/popup_01.jpg','./images/popup/popup_02.jpg']; 
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
            // 只有點擊到遮罩本體（非內容框）才關閉
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