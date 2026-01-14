/**
 * AiFang Kids - cart.js
 * [2026.01 終極資料同步版]
 * 負責：渲染購物車、即時計算金額、對接試算表欄位並送出訂單
 */

document.addEventListener('DOMContentLoaded', () => {
    renderCart();

    // 監聽結帳按鈕 (請確保 HTML ID 為 checkout-btn)
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }
});

/**
 * 1. 核心計算邏輯
 * 確保預估金額與最終送出金額一致
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
 * 2. 渲染購物車 Table
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
 * 3. 處理結帳送出 (對接 GAS 欄位)
 */
async function handleCheckout() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) return alert("購物車是空的！");

    // 取得 HTML 表單資料 (對應你的試算表欄位名稱)
    const customer_name = document.getElementById('order-name')?.value;
    const customer_phone = document.getElementById('order-phone')?.value;
    const customer_email = document.getElementById('order-email')?.value;
    const customer_address = document.getElementById('order-address')?.value;
    const payment_method = document.querySelector('input[name="payment"]:checked')?.value || 'transfer';
    const shipping_method = document.querySelector('input[name="shipping"]:checked')?.value || '7-11';


    const result = calculateOrder(cart);

    // 構建 Payload：這裡的 Key 必須讓 GAS 的 doPost 能夠正確解析
    const orderPayload = {
        order_data: {
            customer_name,
            customer_phone,
            customer_email,
            customer_address,
            payment_method,
            shipping_method,
            subtotal: result.subtotal,
            shipping_fee: result.shipping,
            discount: result.discount,
            total_amount: result.total
        },
        // 這裡的 items 會進入 GAS 的 Order_Items 分頁
        items: cart.map(item => ({
            code: item.code,          // 對應 GAS 的 product_code
            name: item.name,          // 對應 GAS 的 product_name
            brand: item.brand || "AiFang",
            color: item.color,
            size: item.size,
            price: item.price,        // 對應 GAS 的 unit_price
            quantity: item.quantity
        }))
    };

    const checkoutBtn = document.getElementById('checkout-btn');
    checkoutBtn.innerText = "訂單處理中...";
    checkoutBtn.disabled = true;

    try {
        // 使用 api.js 的 ApiService 送出
        const response = await ApiService.submitOrder(orderPayload);
        
        if (response.success) {
            alert("訂單已成功送出！請至 Email 查看確認信。");
            localStorage.removeItem('cart');
            window.location.href = "order_success.html";
        } else {
            throw new Error(response.error || "傳輸失敗");
        }
    } catch (err) {
        alert("結帳發生錯誤: " + err.message);
        checkoutBtn.innerText = "重新送出結帳";
        checkoutBtn.disabled = false;
    }
}

/**
 * 4. 輔助 UI 功能
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