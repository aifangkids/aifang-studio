/**
 * AiFang Kids - index.js
 * [2026.02 優化版]
 */

let allData = [];
let activeCat = 'All';
let activeBrands = new Set();

/**
 * 1. 初始化頁面
 */
async function init() {
    // 綁定事件與彈窗
    bindPopupEvents(); 
    showRandomPopup(); 
    
    try {
        console.log("🚀 [Index] 正在從 ApiService 初始化資料...");
        // 獲取已由 api.js 預處理過價格的商品資料
        allData = await ApiService.fetchProducts();
        
        if (allData && allData.length > 0) {
            render(allData);
            // 觸發漸顯動畫
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
 * 2. 渲染商品列表
 */
function render(items) {
    const container = document.getElementById('product-list');
    if (!container) return;
    
    container.innerHTML = "";
    
    if (items.length === 0) {
        container.innerHTML = "<p style='grid-column: 1/-1; text-align:center; padding: 100px 0; color:#bbb; letter-spacing:2px;'>COMING SOON...</p>";
        return;
    }

    items.forEach(item => {
        const status = (String(item.status || "")).toUpperCase();
        const isSale = status === "SALE";
        const badgeHtml = status ? `<span class="status-badge badge-${status}">${status}</span>` : "";
        
        // 價格顯示：配合 CSS 的 .on-sale 控制大小與顏色
        let priceHtml = "";
        if (isSale) {
            priceHtml = `
                <div class="p-price-wrapper on-sale">
                    <div class="p-price-final">NT$ ${item.price_final.toLocaleString()}</div>
                </div>`;
        } else {
            priceHtml = `
                <div class="p-price-wrapper">
                    <div class="p-price-original">NT$ ${item.price_original.toLocaleString()}</div>
                    <div class="p-price-final">NT$ ${item.price_final.toLocaleString()}</div>
                </div>`;
        }

        // 顏色圓點處理 (支援 Hex 與 Pattern)
        const names = String(item.color || "").split(',').filter(Boolean);
        const codes = String(item.color_code || "").split(',').filter(Boolean);
        const patterns = String(item.color_pattern || "").split(',').filter(Boolean);

        let colorHtml = '<div class="color-row">';
        names.forEach((name, index) => {
            const hex = (codes[index] || "").trim();
            const patternImg = (patterns[index] || "").trim();
            let dotStyle = "";
            
            if (patternImg) {
                dotStyle = `background-image: url('${patternImg}');`;
            } else if (hex.startsWith('#')) {
                dotStyle = `background-color: ${hex};`;
            }
            
            if (dotStyle) {
                colorHtml += `<div class="color-dot" title="${name.trim()}" style="${dotStyle}"></div>`;
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
                <p class="p-name">${item.name || 'Untitled'}</p>
                ${colorHtml}
                ${priceHtml}
            </div>`;
        container.appendChild(card);
    });
}

/**
 * 3. 搜尋與篩選
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
    
    // UI 反饋：選單啟動
    document.querySelectorAll('.category-menu li').forEach(li => {
        const liText = li.innerText.replace(' ITEMS', '').trim();
        li.classList.toggle('active', liText.toUpperCase() === cat.toUpperCase());
    });

    const filtered = cat === 'All' ? allData : allData.filter(p => p.category === cat);
    
    // 處理品牌面板
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
    const cartData = JSON.parse(localStorage.getItem('cart')) || [];
    const container = document.getElementById('mini-cart-body');
    const totalEl = document.getElementById('mini-cart-total');
    let total = 0;

    if (!container || !totalEl) return;

    if (cartData.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:80px 0; color:#ccc;">
                <p style="font-size:11px; letter-spacing:1px;">YOUR BAG IS EMPTY</p>
            </div>`;
        totalEl.innerText = `NT$ 0`;
        return;
    }

    container.innerHTML = cartData.map(item => {
        total += (item.price * item.quantity);
        return `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-info" style="flex:1; font-size:12px;">
                    <p style="font-weight:700; margin-bottom:2px;">${item.name}</p>
                    <p style="color:#888; font-size:11px; margin-bottom:4px;">${item.color} / ${item.size}</p>
                    <p style="font-weight:500;">${item.quantity} x NT$ ${item.price.toLocaleString()}</p>
                </div>
            </div>`;
    }).join('');
    
    totalEl.innerText = `NT$ ${total.toLocaleString()}`;
}

/**
 * 5. 側欄選單控制
 */
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
 * 6. 彈窗邏輯
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

// 啟動初始化
window.addEventListener('DOMContentLoaded', init);