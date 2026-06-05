let allData = [];
let filteredData = []; // 存放目前篩選條件下的所有商品
let activeCat = 'All';
let activeBrands = new Set();
let displayCount = 50; // 配合約 50 個品項，預設可全數顯示

/**
 * 1. 初始化頁面
 */
async function init() {
    initSearchUI(); 
    
    try {
        console.log("🚀 [Index] 正在從 ApiService 初始化資料...");
        const res = await ApiService.getProducts();
        
        // 確保讀取 JSON 中的 products 陣列
        allData = res.products || res; 
        filteredData = allData;
        
        if (allData && allData.length > 0) {
            render(filteredData);
        } else {
            throw new Error("目前沒有可顯示的商品");
        }
    } catch (e) {
        console.error("載入失敗:", e);
        const container = document.getElementById('product-list');
        if (container) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; padding: 100px 0; color: var(--text-muted);">
                    <p style="font-size: 14px; letter-spacing: 1px;">SYSTEM MAINTENANCE</p>
                    <p style="font-size: 11px; margin-top: 10px;">請稍後再試或聯繫客服</p>
                </div>`;
        }
    }
}

/**
 * 1.1 首頁滿版 Banner 
 */
function enterShop() {
    document.body.classList.add('shop-active');
}

/**
 * 1.2 搜尋功能
 */
function initSearchUI() {
    const searchInput = document.getElementById('search-input'); 
    if (searchInput) {
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
    if (!container) return;
    
    container.innerHTML = "";
    
    if (items.length === 0) {
        container.innerHTML = "<p style='grid-column: 1/-1; text-align:center; padding: 100px 0; color: var(--text-muted); letter-spacing:2px;'>COMING SOON...</p>";
        return;
    }

    const itemsToRender = items.slice(0, displayCount);

    itemsToRender.forEach(item => {
        const originalPrice = Number(item.price) || 0;
        let priceHtml = "";
        
        if (originalPrice === 0) {
            priceHtml = `<div class="p-price-final">COMING SOON</div>`;
        } else {
            priceHtml = `<div class="p-price-final">NT$ ${originalPrice.toLocaleString()}</div>`;
        }

        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => { if(item.code) location.href = `detail.html?code=${item.code}`; };
        
        // ✨ 欄位已完美對齊 code.gs：直接使用 item.imagemain、item.name
        card.innerHTML = `
            <div class="img-wrap">
                <img src="${item.imagemain || ''}" alt="${item.name || ''}">
            </div>
            <div class="product-info">
                <p class="p-name">${item.name || 'Untitled'}</p>
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
    displayCount = 50; 
    if (!q) {
        filterByCat(activeCat);
        return;
    }
    filteredData = allData.filter(p => 
        (String(p.code).toLowerCase().includes(q)) || (String(p.name).toLowerCase().includes(q))
    );
    render(filteredData);
}

/** 主分類篩選 */
function filterByCat(cat) {
    activeCat = cat; 
    activeBrands.clear(); 
    displayCount = 50; 
    
    document.querySelectorAll('.category-list li a, .category-menu li').forEach(el => {
        if (cat === 'All' && (el.innerText.includes('ALL') || el.innerText.includes('所有'))) {
            el.classList.add('active');
        } else if (el.innerText.toUpperCase().includes(cat.toUpperCase())) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });

    // ✨ 欄位對齊：String(p.category) 完全對齊 JSON 中的 "category": "TOP"
    filteredData = cat === 'All' ? allData : allData.filter(p => String(p.category).toUpperCase() === cat.toUpperCase());
    
    const brandList = document.querySelector('.brand-list') || document.getElementById('brand-list');
    if (brandList) {
        if (cat === 'All' || filteredData.length === 0) { 
            // ✨ 欄位對齊：p.brand 完全對齊 JSON 中的 "brand": "MOMOANN"
            const allBrands = [...new Set(allData.map(p => p.brand))].filter(Boolean);
            brandList.innerHTML = allBrands.map(b => 
                `<li><a href="#" onclick="toggleBrand(event, '${b}')" id="b-${b}">${b}</a></li>`
            ).join('');
        } else {
            const brands = [...new Set(filteredData.map(p => p.brand))].filter(Boolean);
            brandList.innerHTML = brands.map(b => 
                `<li><a href="#" onclick="toggleBrand(event, '${b}')" id="b-${b}">${b}</a></li>`
            ).join('');
        }
    }
    
    render(filteredData);
    if (window.innerWidth <= 900) closeMenu();
}

/** 次分類品牌複選篩選 */
function toggleBrand(e, b) {
    if (e) e.preventDefault();
    displayCount = 50; 
    const el = document.getElementById(`b-${b}`);
    
    if (activeBrands.has(b)) { 
        activeBrands.delete(b); 
        if (el) el.classList.remove('active'); 
    } else { 
        activeBrands.add(b); 
        if (el) el.classList.add('active'); 
    }

    let final = activeCat === 'All' ? allData : allData.filter(p => String(p.category).toUpperCase() === activeCat.toUpperCase());
    if (activeBrands.size > 0) final = final.filter(p => activeBrands.has(p.brand));
    filteredData = final;
    render(filteredData);
}

/**
 * 4. 側欄選單手機版控制
 */
function toggleMenu() { 
    const sidebar = document.querySelector('.sidebar') || document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay') || document.getElementById('overlay');
    if(sidebar && overlay) { sidebar.classList.add('open'); overlay.classList.add('active'); }
}
function closeMenu() { 
    const sidebar = document.querySelector('.sidebar') || document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay') || document.getElementById('overlay');
    if(sidebar && overlay) { sidebar.classList.remove('open'); overlay.classList.remove('active'); }
}

window.addEventListener('DOMContentLoaded', init);