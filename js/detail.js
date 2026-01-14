/**
 * AiFang Kids - detail.js 2026 最終版本 (優化更新版)
 * 保留快取、背景韓文、金額鎖死，並強化手機版投影框與 SALE 標籤顯示
 */

const urlParams = new URLSearchParams(window.location.search);
const productCode = urlParams.get('code');

let currentProduct = null;
let selectedColor = { name: "", hex: "", krColor: "", image: "" }; // 背景儲存韓文與當前圖片
let selectedItems = []; 
let colorImageMap = {}; 

/**
 * 1. 初始化頁面 (包含快取讀取邏輯)
 */
async function init() {
    updateCartCount();
    if (!productCode) return;
    
    try {
        // ApiService 內部實作快取邏輯
        const product = await ApiService.getProductByCode(productCode);
        
        if (!product) throw new Error("找不到商品");
        currentProduct = product;
        render(currentProduct);
    } catch (e) {
        console.error("載入失敗:", e);
        const titleEl = document.getElementById('p-title');
        if (titleEl) titleEl.innerText = "商品載入失敗";
    }
}

/**
 * 2. 渲染商品資料
 */
function render(p) {
    // UI 純中文顯示
    document.getElementById('p-title').innerText = p.name;
    document.getElementById('p-brand').innerText = p.brand || "AIFANG SELECT";
    document.getElementById('p-id').innerText = `CODE: ${p.code}`;
    document.getElementById('styling-note').innerText = p.styling_note || "";
    
    // 設定主圖
    const primaryImg = document.getElementById('primary-img');
    if (primaryImg) primaryImg.src = p.image_main;

    // 解析顏色映射物件
    if (p.images_by_color) {
        try { 
            colorImageMap = typeof p.images_by_color === 'string' ? JSON.parse(p.images_by_color) : p.images_by_color; 
        } catch (e) { 
            console.warn("顏色對應圖解析失敗"); 
        }
    }

    // 渲染額外細節圖
    const imgArea = document.getElementById('image-main-area');
    if (p.image_extra && imgArea) {
        const existingExtras = imgArea.querySelectorAll('img:not(#primary-img)');
        existingExtras.forEach(el => el.remove());

        String(p.image_extra).split(',').forEach(url => {
            const cleanUrl = url.trim();
            if(cleanUrl) {
                const img = document.createElement('img');
                img.src = cleanUrl;
                imgArea.appendChild(img);
            }
        });
    }

    // 渲染顏色選項 (隱藏韓文顯示)
    const swatchGroup = document.getElementById('swatch-group');
    if (swatchGroup) {
        swatchGroup.innerHTML = ""; 
        const colorNames = String(p.color || "").split(',').map(s => s.trim());
        const colorCodes = String(p.color_code || "").split(',').map(s => s.trim());
        const colorPatterns = String(p.color_pattern || "").split(',').map(s => s.trim());
        const krColors = String(p.korean_color || "").split(',').map(s => s.trim());

        colorNames.forEach((name, i) => {
            if (!name) return;
            const hex = colorCodes[i] || '#eee';
            const pattern = colorPatterns[i] || "";
            const krColor = krColors[i] || ""; 

            const item = document.createElement('div');
            item.className = "swatch-item";
            let innerStyle = pattern ? `background-image: url('${pattern}'); background-size: cover;` : `background: ${hex};`;

            item.innerHTML = `
                <div class="swatch-circle" style="${innerStyle}"></div>
                <span class="swatch-name">${name}</span>
            `;

            item.onclick = () => {
                const targetImg = colorImageMap[name] || p.image_main;
                selectColor(name, hex, krColor, item, targetImg);
                if (primaryImg) primaryImg.src = targetImg;
            };

            swatchGroup.appendChild(item);
            if (i === 0) item.click(); // 自動選取第一個
        });
    }

    // 渲染尺寸價格 (鎖死 SALE 標籤邏輯)
    const sizeArea = document.getElementById('size-area');
    if (sizeArea) {
        sizeArea.innerHTML = ""; 
        const isSale = p.status === 'SALE';
        const saleHtml = isSale ? `<span class="sale-badge" style="background:#d9534f; color:#fff; font-size:10px; padding:2px 6px; border-radius:2px; margin-left:8px;">SALE</span>` : '';

        const categories = [
            { key: 'baby', label: 'BABY' }, 
            { key: 'kid', label: 'KIDS' }, 
            { key: 'junior', label: 'JUNIOR' }, 
            { key: 'adult', label: 'ADULT' }
        ];

        categories.forEach(cat => {
            const rawSizes = p[`sizes_${cat.key}`];
            const price = p[`price_${cat.key}`];
            
            if (rawSizes && rawSizes !== "" && price && price !== "FREE") {
                const box = document.createElement('div');
                box.className = 'size-group';
                box.innerHTML = `
                    <div class="group-header">
                        <span>${cat.label} ${saleHtml}</span>
                        <span class="price-tag">NT$ ${Number(price).toLocaleString()}</span>
                    </div>
                    <div class="s-btn-wrap">
                        ${String(rawSizes).split(',').map(s => `
                            <button class="s-btn" onclick="addToList('${s.trim()}', ${price})">${s.trim()}</button>
                        `).join('')}
                    </div>`;
                sizeArea.appendChild(box);
            }
        });
    }
}

/**
 * 3. 顏色選取 (UI 純中文 + 手機投影框同步)
 */
function selectColor(name, hex, krColor, el, imageUrl) {
    selectedColor = { name, hex, krColor, image: imageUrl }; 
    document.querySelectorAll('.swatch-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');

    // 同步手機版投影框圖片與文字
    const mobileImg = document.getElementById('mobile-color-preview-img');
    const mobileText = document.getElementById('mobile-color-preview-name');
    if (mobileImg) {
        mobileImg.src = imageUrl;
        mobileImg.style.opacity = "1";
    }
    if (mobileText) mobileText.innerText = name; 
}

/**
 * 4. 購物暫存清單
 */
function addToList(sizeName, price) {
    if (!selectedColor.name) {
        showToast("請先選擇顏色");
        return;
    }
    const key = `${selectedColor.name}-${sizeName}`;
    const existing = selectedItems.find(i => i.key === key);
    if (existing) {
        existing.quantity += 1;
    } else {
        selectedItems.push({ 
            key, 
            color: selectedColor.name, 
            krColor: selectedColor.krColor,
            size: sizeName, 
            price, 
            quantity: 1,
            image: selectedColor.image // 鎖定選取時的顏色圖
        });
    }
    renderSelectedList();
}

function renderSelectedList() {
    const listArea = document.getElementById('selected-list');
    if (!listArea) return;
    listArea.innerHTML = selectedItems.map((item, index) => `
        <div class="selected-item">
            <img src="./images/ui/btn_close.jpg" class="sel-close" onclick="removeFromList(${index})">
            <div class="sel-info">${item.color} / ${item.size}</div>
            <div class="sel-bottom">
                <div class="qty-box">
                    <button class="qty-btn" onclick="updateListQty(${index}, -1)">-</button>
                    <input type="text" class="qty-input" value="${item.quantity}" readonly>
                    <button class="qty-btn" onclick="updateListQty(${index}, 1)">+</button>
                </div>
                <div class="sel-price">NT$ ${(item.price * item.quantity).toLocaleString()}</div>
            </div>
        </div>`).join('');
}

/**
 * 5. 加入購物車 (傳遞背景韓文與 SALE 狀態)
 */
function addAllToCart() {
    if (selectedItems.length === 0) { 
        showToast("請先選擇顏色與尺寸"); 
        return; 
    }
    
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    selectedItems.forEach(item => {
        const cartItem = { 
            code: currentProduct.code, 
            name: currentProduct.name, 
            brand: currentProduct.brand, 
            color: item.color, 
            size: item.size, 
            price: item.price, 
            quantity: item.quantity, 
            image: item.image,
            status: currentProduct.status, // 結帳打折判定用 (SALE 鎖死)
            korean_name: currentProduct.korean_name || "", 
            korean_color: item.krColor 
        };
        
        const idx = cart.findIndex(i => i.code === cartItem.code && i.size === cartItem.size && i.color === cartItem.color);
        if (idx > -1) {
            cart[idx].quantity += cartItem.quantity;
            cart[idx].status = currentProduct.status;
        } else {
            cart.push(cartItem);
        }
    });
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    selectedItems = [];
    renderSelectedList();
    showToast("商品已加入購物車");
}

/**
 * 通用工具
 */
function updateListQty(index, delta) {
    if (selectedItems[index].quantity + delta > 0) {
        selectedItems[index].quantity += delta;
        renderSelectedList();
    }
}

function removeFromList(index) {
    selectedItems.splice(index, 1);
    renderSelectedList();
}

function showToast(msg) {
    const toast = document.getElementById('custom-toast');
    if (toast) {
        toast.innerText = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const countEl = document.getElementById('cart-count');
    if (countEl) countEl.innerText = cart.reduce((sum, item) => sum + item.quantity, 0);
}

// 監聽載入
window.addEventListener('load', init);