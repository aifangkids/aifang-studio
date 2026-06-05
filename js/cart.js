document.addEventListener('DOMContentLoaded', () => {
    renderCart();
    updateShippingNotice();

    const shippingSelect = document.getElementById('shipping-method');
    if (shippingSelect) {
        shippingSelect.addEventListener('change', () => { renderCart(); });
    }

    const submitBtn = document.getElementById('submit-order-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitOrder);
    }
});

/**
 * 核心金額計算：具備全自動防錯、欄位對齊相容機制
 */
function calculateOrder(cart) {
    // 防線一：如果後台 ApiService 正常運作，優先用後台的
    if (typeof ApiService !== 'undefined' && typeof ApiService.calculateCart === 'function') {
        try {
            const summary = ApiService.calculateCart(cart);
            if (summary && summary.processedItems) {
                return {
                    total: summary.total_amount || 0,
                    processedItems: summary.processedItems
                };
            }
        } catch (e) {
            console.error("ApiService 內部有錯，啟動前台自救計算:", e);
        }
    }
    
    // 防線二：萬一後台當掉或欄位對不上，前台自己算，確保絕對不卡死
    let total = 0;
    const processedItems = cart.map(item => {
        // 自動相容 unitprice 或 price
        const price = Number(item.unitprice || item.price || 0);
        const qty = Number(item.quantity || 1);
        total += price * qty;
        return {
            name: item.name || '未命名商品',
            color: item.color || '預設',
            size: item.size || 'F',
            image: item.image || item.img || './images/ui/no-image.jpg',
            unitprice: price,
            quantity: qty
        };
    });

    return { total, processedItems };
}

function generateShortOrderId() {
    return `AF${Math.floor(100000 + Math.random() * 900000)}`;
}

function getTaipeiTimeString() {
    return new Intl.DateTimeFormat('zh-TW', {
        timeZone: 'Asia/Taipei',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
    }).format(new Date()).replace(/\//g, '/');
}

/**
 * 渲染購物車
 */
function renderCart() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const container = document.getElementById('cart-items-preview');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `<div class="empty-cart-text">購物車是空的</div>`;
        updateUI(0);
        return;
    }

    const result = calculateOrder(cart);

    container.innerHTML = result.processedItems.map((item, index) => {
        return `
            <div class="cart-item-mini">
                <img src="${item.image}" class="item-img-mini" onerror="this.src='./images/ui/no-image.jpg'">
                <div class="item-info-mini">
                    <div class="item-name-mini">${item.name}</div>
                    <div class="item-spec-mini">${item.color} / ${item.size}</div>
                    <div class="item-bottom-row">
                        <div class="item-price-mini">NT$ ${(item.unitprice * item.quantity).toLocaleString()}</div>
                        <div class="qty-control">
                            <button class="qty-btn" onclick="changeQty(${index}, -1)">-</button>
                            <input type="text" class="qty-val" value="${item.quantity}" readonly>
                            <button class="qty-btn" onclick="changeQty(${index}, 1)">+</button>
                        </div>
                    </div>
                </div>
                <button onclick="deleteItem(${index})" class="delete-btn">&times;</button>
            </div>`;
    }).join('');

    updateUI(result.total);
}

/**
 * 送出訂單
 */
async function submitOrder() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const name = document.getElementById('cust-name').value.trim();
    const email = document.getElementById('cust-email').value.trim();
    const shipping = document.getElementById('shipping-method').value;

    if (cart.length === 0) return showToast("購物車內沒有商品");
    if (!name || !email) return showToast("請填寫訂購資訊");

    const summary = calculateOrder(cart);
    
    const cartSummaryForApi = {
        processedItems: summary.processedItems,
        subtotal: summary.total,
        discount_total: 0,
        total_amount: summary.total
    };

    const customerInfo = {
        order_id: generateShortOrderId(),
        order_date: getTaipeiTimeString(),
        name: name,
        email: email,
        shipping_method: shipping
    };

    try {
        const btn = document.getElementById('submit-order-btn');
        btn.innerText = "訂單處理中...";
        btn.disabled = true;

        const response = await ApiService.submitOrder(customerInfo, cartSummaryForApi);
        
        if (response && response.success) { 
            const finalOrderInfo = {
                order_id: customerInfo.order_id,
                order_date: customerInfo.order_date,
                customer: { name: customerInfo.name, email: customerInfo.email, shipping_method: customerInfo.shipping_method },
                summary: { subtotal: summary.total, discount_total: 0, total_payable: summary.total },
                items: summary.processedItems
            };
            localStorage.setItem('last_order_info', JSON.stringify(finalOrderInfo));
            localStorage.removeItem('cart');
            window.location.href = "order_success.html"; 
        } else {
            throw new Error((response && response.error) || "提交失敗");
        }
    } catch (err) {
        console.error("Submit Error:", err);
        showToast("提交失敗，請檢查網路連線");
        const btn = document.getElementById('submit-order-btn');
        btn.innerText = "提交訂單並結帳";
        btn.disabled = false;
    }
}

function updateUI(total) {
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    if (subtotalEl) subtotalEl.innerText = `NT$ ${total.toLocaleString()}`;
    if (totalEl) totalEl.innerText = `NT$ ${total.toLocaleString()}`;
}

function updateShippingNotice() {
    const noticeEl = document.getElementById('shipping-notice');
    if (!noticeEl) return;
    noticeEl.innerHTML = `
        <div class="notice-box">
            <p>※ 預購商品沒有貨到付款，成立訂單 2 天內需要完成付款(匯款)，逾時則不成立訂單。</p>
        </div>`;
}

function showToast(msg) {
    const toast = document.getElementById('custom-toast');
    if (toast) { 
        toast.innerText = msg; 
        toast.classList.add('show'); 
        setTimeout(() => toast.classList.remove('show'), 2000);
    }
}

window.changeQty = function(index, delta) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart[index] && cart[index].quantity + delta > 0) {
        cart[index].quantity += delta;
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart(); 
    }
};

window.deleteItem = function(index) {
    if(!confirm("確定移除商品？")) return;
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
    showToast("已移除商品");
};