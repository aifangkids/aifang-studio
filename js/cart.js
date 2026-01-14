/**
 * AiFang Kids - cart.js
 * [2026.01 效能優化版]
 * 負責：渲染購物車、即時計算金額、儲存狀態並跳轉至結帳頁
 */

document.addEventListener('DOMContentLoaded', () => {
    renderCart();

    // 監聽結帳按鈕 (負責跳轉，不送出 Order)
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }
});

/**
 * 1. 核心計算邏輯
 * 確保預估金額正確
 */
function calculateOrder(cart) {
    let subtotal = 0;
    let totalQuantity = 0;

    cart.forEach(item => {
        subtotal += Number(item.price) * Number(item.quantity);
        totalQuantity += Number(item.quantity);
    });

    // 運費規則：滿 1500 免運，否則 60
    const shipping = (subtotal >= 1500) ? 0 : 60;
    const total = subtotal + shipping;

    return {
        subtotal,
        shipping,
        total,
        totalQuantity,
        discount: 0 // 預留折扣位
    };
}

/**
 * 2. 渲染購物車 Table (保持原有 CSS 與結構)
 */
function renderCart() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const tbody = document.getElementById('cart-tbody');
    if (!tbody) return;

    if (cart.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="padding:100px 0; color:#999; text-align:center;">您的購物車是空的</td></tr>';
        updateUI(0, 0, 0);
        updateHeaderCartCount(0);
        return;
    }

    const result = calculateOrder(cart);

    tbody.innerHTML = cart.map((item, index) => {
        const itemTotal = Number(item.price) * Number(item.quantity);
        const displayImg = item.image ? item.image : './images/ui/no-image.jpg';

        return `
            <tr>
                <td>
                    <div class="product-item">
                        <img src="${displayImg}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/90x110?text=No+Image'">
                        <div>
                            <span class="product-name">${item.name}</span>
                            <span class="product-option">[規格: ${item.brand || 'AiFang'} / ${item.color || 'F'} / ${item.size || 'F'}]</span>
                        </div>
                    </div>
                </td>
                <td>NT$ ${Number(item.price).toLocaleString()}</td>
                <td>
                    <div class="qty-box">
                        <button onclick="changeQty(${index}, -1)">-</button>
                        <input type="text" value="${item.quantity}" readonly>
                        <button onclick="changeQty(${index}, 1)">+</button>
                    </div>
                </td>
                <td><strong>NT$ ${itemTotal.toLocaleString()}</strong></td>
                <td>
                    <button onclick="deleteItem(${index})" style="background:none; border:none; cursor:pointer; color:#bbb; font-size:18px;">&times;</button>
                </td>
            </tr>
        `;
    }).join('');

    updateHeaderCartCount(result.totalQuantity);
    updateUI(result.subtotal, result.shipping, result.total);
}

/**
 * 3. 處理結帳按鈕點擊 (優化重點：只傳遞資料，不呼叫 API)
 */
function handleCheckout() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) return alert("購物車是空的！");

    // 計算最後金額並存入 localStorage，讓 checkout.html 讀取
    const result = calculateOrder(cart);
    localStorage.setItem('temp_order_summary', JSON.stringify(result));

    // 立即跳轉至結帳頁面，這就是「變快」的原因
    window.location.href = "checkout.html";
}

/**
 * 4. 輔助 UI 功能 (保持原有邏輯)
 */
window.changeQty = function(index, delta) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart[index] && cart[index].quantity + delta > 0) {
        cart[index].quantity += delta;
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
    }
};

window.deleteItem = function(index) {
    if(!confirm("確定要刪除這項商品嗎？")) return;
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
};

function updateUI(subtotal, shipping, total) {
    const subtotalEl = document.getElementById('cart-subtotal');
    const shippingEl = document.getElementById('cart-shipping');
    const totalEl = document.getElementById('cart-total');

    if (subtotalEl) subtotalEl.innerText = `NT$ ${subtotal.toLocaleString()}`;
    if (shippingEl) shippingEl.innerText = `NT$ ${shipping.toLocaleString()}`;
    if (totalEl) totalEl.innerText = `NT$ ${(total || subtotal + shipping).toLocaleString()}`;
}

function updateHeaderCartCount(count) {
    const countEl = document.getElementById('cart-count');
    if (countEl) countEl.innerText = count;
}