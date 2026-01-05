import { calculateOrder } from './cart.js';

const cartList = document.getElementById('cart-list');
const summaryDiv = document.getElementById('order-summary');

function renderCart() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (cart.length === 0) {
        cartList.innerHTML = "<p>購物車是空的</p>";
        return;
    }

    // 渲染商品清單
    cartList.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <img src="${item.image}" width="80">
            <div class="item-info">
                <p>${item.name}</p>
                <p>Size: ${item.size} / Color: ${item.color}</p>
                <p>NT$ ${item.price} x ${item.quantity}</p>
            </div>
            <button onclick="removeItem(${index})">REMOVE</button>
        </div>
    `).join('');

    updateTotal();
}

// 監聽付款方式切換
document.querySelectorAll('input[name="payment"]').forEach(input => {
    input.addEventListener('change', updateTotal);
});

function updateTotal() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const payment = document.querySelector('input[name="payment"]:checked').value;
    
    // 呼叫核心計算邏輯
    const result = calculateOrder(cart, payment);

    summaryDiv.innerHTML = `
        <div class="summary-line"><span>Subtotal:</span> <span>NT$ ${result.subtotal}</span></div>
        <div class="summary-line highlight"><span>1+1 Bundle Discount:</span> <span>- NT$ ${result.bundleDiscount}</span></div>
        <div class="summary-line"><span>Payment Discount:</span> <span>- NT$ ${result.paymentDiscount}</span></div>
        <div class="summary-line"><span>Shipping:</span> <span>NT$ ${result.shipping}</span></div>
        <hr>
        <div class="summary-line total"><span>TOTAL:</span> <span>NT$ ${result.total}</span></div>
    `;
}

// 刪除商品
window.removeItem = (index) => {
    let cart = JSON.parse(localStorage.getItem('cart'));
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
};

document.getElementById('go-to-checkout')?.addEventListener('click', () => {
    window.location.href = 'checkout.html';
});

renderCart();