/**
 * AiFang Kids - detail.js 2026 最終修正版
 */

// 確保這些變數在最上方正確宣告
const urlParams = new URLSearchParams(window.location.search);
const productCode = urlParams.get('code');

let currentProduct = null;
let selectedColor = { name: "", hex: "", krColor: "", image: "" };
let selectedItems = [];
let colorImageMap = {}; 

/**
 * 1. 初始化頁面
 */
async function init() {
    updateCartCount();
    
    // 自動綁定按鈕事件
    const addBtn = document.getElementById('add-cart-btn');
    if (addBtn) {
        addBtn.onclick = addAllToCart;
    }

    if (!productCode) {
        console.error("缺少產品代碼");
        return;
    }
    
    try {
        // 確保 ApiService 已由 api.js 載入
        if (typeof ApiService === 'undefined') {
            throw new Error("ApiService 未定義，請檢查 api.js 是否正確載入");
        }

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
    // 填充文字資訊
    document.getElementById('p-title').innerText = p.name || "未命名商品";
    document.getElementById('p-brand').innerText = p.brand || "AIFANG SELECT";
    document.getElementById('p-id').innerText = `CODE: ${p.code || 'N/A'}`;
    
    const noteEl = document.getElementById('styling-note');
    if (noteEl) noteEl.innerText = p.styling_note || "";

    // --- 渲染 image_extra 多圖展示 ---
    const imgArea = document.getElementById('image-main-area');
    if (imgArea) {
        imgArea.innerHTML = ""; 

        // 優先讀取 image_extra，若無則讀取 image_main
        const imageSource = p.image_extra || p.image_main;
        
        if (imageSource) {
            String(imageSource).split(/[\n,]+/).forEach(url => {
                const cleanUrl = url.trim();
                if (cleanUrl) {
                    const img = document.createElement('img');
                    img.src = cleanUrl;
                    img.className = 'extra-img'; 
                    img.loading = 'lazy';
                    imgArea.appendChild(img);
                }
            });
        }
    }

    // 解析顏色圖片映射
    if (p.images_by_color) {
        try { 
            colorImageMap = typeof p.images_by_color === 'string' ? JSON.parse(p.images_by_color) : p.images_by_color;
        } catch (e) { 
            colorImageMap = {};
        }
    }

    renderColorSwatches(p);
    renderSizeGroups(p);
}

/**
 * 3. 渲染尺寸與價格
 */
function renderSizeGroups(p) {
    const sizeArea = document.getElementById('size-area');
    if (!sizeArea) return;
    sizeArea.innerHTML = "";

    const status = (String(p.status || "")).toUpperCase();
    const isSale = status === 'SALE';
    
    const groups = [
        { key: 'baby', label: 'BABY', colorClass: 'btn-baby' }, 
        { key: 'kid', label: 'KIDS', colorClass: 'btn-kid' }, 
        { key: 'junior', label: 'JUNIOR', colorClass: 'btn-junior' }, 
        { key: 'adult', label: 'ADULT', colorClass: 'btn-adult' }
    ];

    groups.forEach(group => {
        const rawSizes = p[`sizes_${group.key}`];
        const originalPrice = Number(p[`price_${group.key}`] || 0);
        
        if (rawSizes && originalPrice > 0) {
            const finalPrice = isSale ? originalPrice : Math.round(originalPrice * 0.9);
            const box = document.createElement('div');
            box.className = 'size-group';
            
            let priceDisplay = isSale 
                ? `<span class="price-final sale-red">NT$ ${originalPrice.toLocaleString()}</span> <span class="badge-sale-mini">SALE</span>`
                : `<span class="price-original">NT$ ${originalPrice.toLocaleString()}</span><span class="price-final sale-red">NT$ ${finalPrice.toLocaleString()}</span>`;

            box.innerHTML = `
                <div class="group-header">
                    <span class="group-label">${group.label}</span>
                    <div class="price-tag-wrap">${priceDisplay}</div>
                </div>
                <div class="s-btn-wrap">
                    ${String(rawSizes).split(',').map(s => `
                        <button class="s-btn ${group.colorClass}" onclick="addToList('${s.trim()}', ${finalPrice})">${s.trim()}</button>
                    `).join('')}
                </div>`;
            sizeArea.appendChild(box);
        }
    });
}

/**
 * 4. 顏色選取與渲染
 */
function renderColorSwatches(p) {
    const swatchGroup = document.getElementById('swatch-group');
    if (!swatchGroup) return;
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
        
        let innerStyle = pattern 
            ? `background-image: url('${pattern}'); background-size: cover;` 
            : `background: ${hex}; border:1px solid #eee;`;

        item.innerHTML = `
            <div class="swatch-circle" style="${innerStyle}"></div>
            <span class="swatch-name">${name}</span>
        `;

        item.onclick = () => {
            const targetImg = colorImageMap[name] || p.image_main;
            selectedColor = { name, hex, krColor, image: targetImg };
            
            document.querySelectorAll('.swatch-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            
            // 選色後同步更新手機版預覽區
            const mobileImg = document.getElementById('mobile-color-preview-img');
            const mobileText = document.getElementById('mobile-color-preview-name');
            if (mobileImg) mobileImg.src = targetImg;
            if (mobileText) mobileText.innerText = name;
        };

        swatchGroup.appendChild(item);
        if (i === 0) item.click();
    });
}

/**
 * 5. 購物清單與購物車邏輯
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
            price: price, 
            quantity: 1,
            image: selectedColor.image 
        });
    }
    renderSelectedList();
}

function renderSelectedList() {
    const listArea = document.getElementById('selected-list');
    if (!listArea) return;
    listArea.innerHTML = selectedItems.map((item, index) => `
        <div class="selected-item">
            <img src="./images/ui/btn_close.jpg" class="sel-close" onclick="removeFromList(${index})" alt="close">
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
            price: Number(item.price), 
            quantity: Number(item.quantity), 
            image: item.image,
            status: (currentProduct.status || "").toUpperCase(),
            korean_name: currentProduct.korean_name || "", 
            korean_color: item.krColor || "" 
        };
       
        const idx = cart.findIndex(i => i.code === cartItem.code && i.size === cartItem.size && i.color === cartItem.color);
        if (idx > -1) {
            cart[idx].quantity += cartItem.quantity;
            cart[idx].korean_name = cartItem.korean_name;
            cart[idx].korean_color = cartItem.korean_color;
        } else {
            cart.push(cartItem);
        }
    });
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    selectedItems = [];
    renderSelectedList();
    showToast("商品已成功加入購物車");
}

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
    if (countEl) {
        const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
        countEl.innerText = totalQty;
    }
}

// 最後啟動
window.onload = init;