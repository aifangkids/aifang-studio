/**
 * AiFang Kids - detail.js 2026 最終優化完整版
 * 修正重點：
 * 1. 補強韓文欄位 (korean_name, korean_color) 寫入 LocalStorage。
 * 2. 增加手機版/電腦版按鈕 (add-cart-btn) 自動事件綁定。
 * 3. 確保資料在存入購物車前維持正確型別與完整度。
 */

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
    
    // --- 自動綁定點擊事件 (防止手機版按鈕失效) ---
    const addBtn = document.getElementById('add-cart-btn');
    if (addBtn) addBtn.onclick = addAllToCart;

    if (!productCode) return;
    
    try {
        console.log("🚀 [Detail] 正在獲取商品資料:", productCode);
        // 呼叫 api.js 中的 ApiService
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
    document.getElementById('p-title').innerText = p.name;
    document.getElementById('p-brand').innerText = p.brand || "AIFANG SELECT";
    document.getElementById('p-id').innerText = `CODE: ${p.code}`;
    
    // 渲染 Styling Note
    const noteEl = document.getElementById('styling-note');
    if (noteEl) noteEl.innerText = p.styling_note || "";
    
    // 主圖
    const primaryImg = document.getElementById('primary-img');
    if (primaryImg) primaryImg.src = p.image_main;

    // 解析顏色圖片映射 (JSON 格式)
    if (p.images_by_color) {
        try { 
            colorImageMap = typeof p.images_by_color === 'string' ? JSON.parse(p.images_by_color) : p.images_by_color; 
        } catch (e) { 
            console.warn("顏色對應圖解析失敗"); 
        }
    }

    // 渲染下方細節圖 (image_extra 以逗號分隔)
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

    // 渲染選項與尺寸
    renderColorSwatches(p);
    renderSizeGroups(p);
}

/**
 * 3. 渲染尺寸分組與價格 (對接四色按鈕)
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
        
        // --- 修正處：強制轉字串再進行檢查 ---
        const sizeStr = String(rawSizes || "").trim();
        
        if (sizeStr !== "" && originalPrice > 0) {
            const finalPrice = isSale ? originalPrice : Math.round(originalPrice * 0.9);

            const box = document.createElement('div');
            box.className = 'size-group';
            
            let priceDisplay = "";
            if (isSale) {
                priceDisplay = `<span class="price-final sale-red">NT$ ${originalPrice.toLocaleString()}</span> <span class="badge-sale-mini">SALE</span>`;
            } else {
                priceDisplay = `
                    <span class="price-original">NT$ ${originalPrice.toLocaleString()}</span>
                    <span class="price-final sale-red">NT$ ${finalPrice.toLocaleString()}</span>
                `;
            }

            box.innerHTML = `
                <div class="group-header">
                    <span class="group-label">${group.label}</span>
                    <div class="price-tag-wrap">${priceDisplay}</div>
                </div>
                <div class="s-btn-wrap">
                    ${sizeStr.split(',').map(s => `
                        <button class="s-btn ${group.colorClass}" onclick="addToList('${s.trim()}', ${finalPrice})">${s.trim()}</button>
                    `).join('')}
                </div>`;
            sizeArea.appendChild(box);
        }
    });
}

/**
 * 4. 顏色選取與渲染 (Swatch)
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
            
            const primaryImg = document.getElementById('primary-img');
            if (primaryImg) primaryImg.src = targetImg;
            
            // 手機版同步預覽
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
 * 5. 購物清單邏輯 (下單前預覽)
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

/**
 * 6. 加入購物車 (存入 LocalStorage)
 * 修正點：確保韓文名稱與韓文顏色被完整寫入
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
            price: Number(item.price), 
            quantity: Number(item.quantity), 
            image: item.image,
            status: (currentProduct.status || "").toUpperCase(),
            // 核心修正：存入韓文資訊
            korean_name: currentProduct.korean_name || "", 
            korean_color: item.krColor || "" 
        };
        
        const idx = cart.findIndex(i => 
            i.code === cartItem.code && 
            i.size === cartItem.size && 
            i.color === cartItem.color
        );
        
        if (idx > -1) {
            cart[idx].quantity += cartItem.quantity;
            // 同步補齊韓文資訊（針對舊資料更新）
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

/**
 * 工具函數
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
    if (countEl) {
        const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
        countEl.innerText = totalQty;
    }
}

// 頁面加載完成後初始化
window.addEventListener('load', init);