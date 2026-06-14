const urlParams = new URLSearchParams(window.location.search);
const productCode = urlParams.get('code');

let currentProduct = null;
let selectedColor = { name: "", krColor: "" };
let selectedSize = "";
let selectedItems = []; 

function init() {
    updateCartCount();
    
    const addBtn = document.getElementById('add-cart-btn');
    if (addBtn) {
        addBtn.onclick = addAllToCart;
    }

    if (!productCode) {
        console.error("【錯誤】網址列缺少產品代碼 code");
        return;
    }
    
    try {
        if (typeof ApiService === 'undefined') {
            throw new Error("ApiService 未定義，請檢查 HTML 中 api.js 是否已正確載入");
        }

        ApiService.getProductByCode(productCode).then(product => {
            if (!product) throw new Error("試算表中找不到該商品代碼");
            
            currentProduct = product;
            renderProductPage(currentProduct);
        }).catch(e => {
            console.error("載入失敗:", e);
            const titleEl = document.getElementById('p-title');
            if (titleEl) titleEl.innerText = "商品選品載入失敗";
        });
    } catch (e) {
        console.error("系統初始化異常:", e);
    }
}

function renderProductPage(p) {
    if (document.getElementById('p-brand')) {
        document.getElementById('p-brand').innerText = p.brand || "AIFANG SELECT";
    }
    if (document.getElementById('p-title')) {
        document.getElementById('p-title').innerText = p.name || "未命名商品";
    }
    if (document.getElementById('p-id')) {
        document.getElementById('p-id').innerText = `商品編號: ${p.code || 'N/A'}`;
    }
    
    const priceVal = Number(p.price || 0);
    if (document.getElementById('p-price')) {
        document.getElementById('p-price').innerText = `NT$ ${priceVal.toLocaleString()}`;
    }

    const descEl = document.getElementById('p-desc');
    if (descEl) {
        descEl.innerText = p.stylingnote || "親膚舒適正韓選品。";
    }

    const imgArea = document.getElementById('image-main-area');
    if (imgArea) {
        imgArea.innerHTML = ""; 
        const imageSource = p.imageextra || p.image_extra || p.imagemain || p.image_main;
        
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

    renderColorSwatches(p);
    renderSizeGroup(p);
}

function renderColorSwatches(p) {
    const swatchGroup = document.getElementById('swatch-group');
    if (!swatchGroup) return;
    swatchGroup.innerHTML = "";

    const colorNames = String(p.color || "").split(',').map(s => s.trim());
    const krColors = String(p.koreancolor || p.korean_color || "").split(',').map(s => s.trim());

    colorNames.forEach((name, i) => {
        if (!name) return;
        const krColor = krColors[i] || ""; 

        const btn = document.createElement('button');
        btn.className = "color-btn"; 
        btn.innerText = name;

        btn.onclick = () => {
            selectedColor = { name, krColor };
            swatchGroup.querySelectorAll('.color-btn').forEach(el => el.classList.remove('active'));
            btn.classList.add('active');
        };

        swatchGroup.appendChild(btn);
        if (i === 0) btn.click(); 
    });
}

// 📐 渲染尺寸區塊與 SIZE GUIDE 按鈕（已套用 CSS Class 分離）
function renderSizeGroup(p) {
    const sizeWrap = document.getElementById('size-area'); 
    if (!sizeWrap) return;
    sizeWrap.innerHTML = "";

    const rawSizes = p.size;
    if (!rawSizes) return;

    const box = document.createElement('div');
    box.className = 'size-container-box';
    
    const sizeGuideUrl = p.sizeguide || "";
    let sizeGuideBtnHtml = "";
    
    if (sizeGuideUrl && sizeGuideUrl.trim() !== "") {
        sizeGuideBtnHtml = `
            <div class="sizeguide-btn-wrap">
                <button type="button" class="sizeguide-btn" onclick="openSizeGuidePopup('${sizeGuideUrl.trim()}')">
                    📐 SIZE GUIDE 尺寸指南
                </button>
            </div>
        `;
    }
    
    box.innerHTML = `
        <div class="group-header">
            <span class="group-label">SELECT SIZE</span>
        </div>
        <div class="size-group">
            ${String(rawSizes).split(',').map(s => `
                <button class="size-btn" onclick="selectSizeSize('${s.trim()}', this)">${s.trim()}</button>
            `).join('')}
        </div>
        ${sizeGuideBtnHtml}
    `;
        
    sizeWrap.appendChild(box);
}

// 📱 POPUP 全螢幕彈窗邏輯（已套用 CSS Class 分離）
window.openSizeGuidePopup = function(imgUrl) {
    const oldPopup = document.getElementById('sizeguide-popup-overlay');
    if (oldPopup) oldPopup.remove();

    // 建立外層遮罩
    const overlay = document.createElement('div');
    overlay.id = 'sizeguide-popup-overlay';

    // 填入乾淨的 HTML 結構，所有長相通通交給細節 CSS 控制
    overlay.innerHTML = `
        <div class="sizeguide-popup-content">
            <span id="sizeguide-close-x">✕</span>
            <img class="sizeguide-popup-img" src="${imgUrl}" onerror="this.onerror=null; this.src='./images/ui/no-image.jpg'; alert('無法順利讀取尺寸指南圖片，請確認後台試算表的圖片連結是否正確喔！');">
        </div>
    `;

    document.body.appendChild(overlay);

    // 觸發 CSS 的淡入效果
    setTimeout(() => { overlay.style.opacity = '1'; }, 20);

    const closePopup = () => {
        overlay.style.opacity = '0';
        setTimeout(() => { overlay.remove(); }, 300);
    };

    // 點擊圈圈叉叉關閉
    overlay.querySelector('#sizeguide-close-x').onclick = (e) => {
        e.stopPropagation();
        closePopup();
    };

    // 點擊任何黑色半透明空白處均可關閉
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            closePopup();
        }
    };
}

function selectSizeSize(sizeName, btnElement) {
    if (!selectedColor.name) {
        showToast("請先選取心儀的花色");
        return;
    }

    document.querySelectorAll('.size-btn').forEach(el => el.classList.remove('active'));
    if (btnElement) {
        btnElement.classList.add('active');
    }

    const priceVal = Number(currentProduct.price || 0);
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
            price: priceVal, 
            quantity: 1,
            image: currentProduct.imagemain || currentProduct.image_main || ""
        });
    }
    renderSelectedList();
}

function renderSelectedList() {
    const listArea = document.getElementById('selected-list');
    if (!listArea) return;
    
    if (selectedItems.length > 0) {
        listArea.style.display = "block";
    } else {
        listArea.style.display = "none";
        return;
    }

    listArea.innerHTML = selectedItems.map((item, index) => `
        <div class="selected-item" style="background:#fcfaf7; padding:12px; margin-top:10px; border:1px solid #e0e0e0; border-radius:4px; font-size:13px; position:relative;">
            <span style="position:absolute; top:8px; right:12px; cursor:pointer; color:#888;" onclick="removeFromList(${index})">✕</span>
            <div style="color:#333; font-weight:400;"><strong>${item.color} / ${item.size}</strong></div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
                <div class="qty-box" style="display:inline-flex; border:1px solid #5a4b41; background:#fff; border-radius:4px; overflow:hidden;">
                    <button class="qty-btn" style="width:26px; height:26px; border:none; background:none; cursor:pointer;" onclick="updateListQty(${index}, -1)">-</button>
                    <input type="text" class="qty-input" style="width:30px; text-align:center; border:none; font-weight:bold; background:transparent;" value="${item.quantity}" readonly>
                    <button class="qty-btn" style="width:26px; height:26px; border:none; background:none; cursor:pointer;" onclick="updateListQty(${index}, 1)">+</button>
                </div>
                <div style="font-weight:700; color:#5a4b41;">NT$ ${(item.price * item.quantity).toLocaleString()}</div>
            </div>
        </div>`).join('');
}

function addAllToCart() {
    if (selectedItems.length === 0) { 
        showToast("請先選取心儀的花色與尺寸規格");
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
            unitprice: Number(item.price), 
            quantity: Number(item.quantity), 
            image: item.image,
            koreanname: currentProduct.koreanname || "", 
            koreancolor: item.krColor || "" 
        };
       
        const idx = cart.findIndex(i => i.code === cartItem.code && i.size === cartItem.size && i.color === cartItem.color);
        if (idx > -1) {
            cart[idx].quantity += cartItem.quantity;
        } else {
            cart.push(cartItem);
        }
    });
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    
    selectedItems = [];
    renderSelectedList();
    showToast("✨ 商品已成功加入購物車");
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
        toast.className = 'show'; 
        setTimeout(() => toast.className = '', 2000);
    } else {
        alert(msg); 
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

document.addEventListener('DOMContentLoaded', init);