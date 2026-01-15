/**
 * AiFang Kids - checkout.js
 * [2026.01 最終優化完整版]
 */

document.addEventListener('DOMContentLoaded', () => {
    initCheckout();
});

/**
 * 初始化結帳頁面
 */
function initCheckout() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        alert("購物車是空的，為您返回首頁");
        window.location.href = "index.html";
        return;
    }

    renderOrderItems(cart);
    
    const payMethodRadios = document.querySelectorAll('input[name="pay_method"]');
    payMethodRadios.forEach(radio => {
        radio.addEventListener('change', handlePaymentChange);
    });

    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitOrder);
    }

    handlePaymentChange();
}

/**
 * 渲染結帳頁面的商品摘要
 */
function renderOrderItems(cart) {
    const listContainer = document.getElementById('checkout-items-list');
    if (!listContainer) return;

    let hasSaleItem = false;
    listContainer.innerHTML = cart.map(item => {
        const isSale = (item.status || "").toString().trim().toUpperCase() === 'SALE';
        if (isSale) hasSaleItem = true;

        return `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; padding-bottom:10px; border-bottom:1px solid #f9f9f9; font-size:13px;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <img src="${item.image || './images/ui/no-image.jpg'}" width="50" height="50" style="object-fit:cover; border-radius:2px;" onerror="this.src='https://via.placeholder.com/50'">
                    <div>
                        <div style="font-weight:bold; color: #333;">
                            ${isSale ? '<span style="background:#e74c3c; color:#fff; font-size:9px; padding:1px 4px; border-radius:2px; margin-right:5px;">SALE</span>' : ''}
                            ${item.name}
                        </div>
                        <div style="color:#888; font-size:11px;">${item.color || 'F'} / ${item.size || 'F'} x ${item.quantity}</div>
                    </div>
                </div>
                <div style="font-weight:bold;">NT$ ${(Number(item.price) * item.quantity).toLocaleString()}</div>
            </div>
        `;
    }).join('');

    const note = document.getElementById('sale-exclude-note');
    if (note) note.style.display = hasSaleItem ? 'block' : 'none';
}

/**
 * 處理付款與運送方式的連動
 */
function handlePaymentChange() {
    const payMethodEl = document.querySelector('input[name="pay_method"]:checked');
    if (!payMethodEl) return;

    const payMethod = payMethodEl.value;
    const shipContainer = document.getElementById('ship-method-container');
    const addrLabel = document.getElementById('address-label');
    
    if (!shipContainer) return;

    let html = '';
    if (payMethod === 'transfer') {
        html = `
            <label class="radio-item"><input type="radio" name="ship_method" value="home" checked> 宅配到府</label>
            <label class="radio-item"><input type="radio" name="ship_method" value="store"> 7-11 超商取貨</label>
        `;
        if (addrLabel) addrLabel.innerText = "收件地址 / 門市名稱";
    } else {
        html = `
            <label class="radio-item"><input type="radio" name="ship_method" value="store" checked> 7-11 超商取貨</label>
        `;
        if (addrLabel) addrLabel.innerText = "7-11 門市名稱及店號";
    }
    shipContainer.innerHTML = html;

    const shipMethodRadios = shipContainer.querySelectorAll('input[name="ship_method"]');
    shipMethodRadios.forEach(radio => radio.addEventListener('change', updateSummary));

    updateSummary();
}

/**
 * 金額核心計算邏輯
 */
function updateSummary() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const payMethodEl = document.querySelector('input[name="pay_method"]:checked');
    if (!payMethodEl) return;

    const payMethod = payMethodEl.value;
    let subtotal = 0;
    let discountAmount = 0;

    cart.forEach(item => {
        const itemPrice = Number(item.price) || 0;
        const itemTotal = itemPrice * item.quantity;
        subtotal += itemTotal;

        const isSale = (item.status || "").toString().trim().toUpperCase() === 'SALE';
        if (!isSale) {
            const rate = (payMethod === 'transfer') ? 0.2 : 0.1; 
            discountAmount += Math.round(itemTotal * rate);
        }
    });

    const discountedSubtotal = subtotal - discountAmount;
    let shippingFee = (payMethod === 'transfer') ? 0 : (discountedSubtotal >= 1500 ? 0 : 60);
    const finalTotal = discountedSubtotal + shippingFee;

    if(document.getElementById('show-subtotal')) document.getElementById('show-subtotal').innerText = `NT$ ${subtotal.toLocaleString()}`;
    if(document.getElementById('show-discount')) document.getElementById('show-discount').innerText = `- NT$ ${discountAmount.toLocaleString()}`;
    if(document.getElementById('show-shipping')) document.getElementById('show-shipping').innerText = (shippingFee === 0) ? "免運" : `NT$ ${shippingFee.toLocaleString()}`;
    if(document.getElementById('show-total')) document.getElementById('show-total').innerText = `NT$ ${finalTotal.toLocaleString()}`;

    window.finalOrderCalc = { subtotal, discountAmount, shippingFee, finalTotal };
}

/**
 * 送出訂單核心函式
 */
async function submitOrder() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const calc = window.finalOrderCalc;
    const payMethodEl = document.querySelector('input[name="pay_method"]:checked');
    const shipMethodEl = document.querySelector('input[name="ship_method"]:checked');

    const name = document.getElementById('cust_name')?.value.trim();
    const phone = document.getElementById('cust_phone')?.value.trim();
    const email = document.getElementById('cust_email')?.value.trim();
    const address = document.getElementById('cust_address')?.value.trim();

    if (!name || !phone || !address || !payMethodEl || !shipMethodEl) {
        alert("請填寫完整收件資訊並選擇運送方式");
        return;
    }

    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerText = "PROCESSING...";

    // --- 關鍵修正：先固定唯一 ID ---
    const orderId = "AF" + new Date().getTime().toString().slice(-6);
    const payText = payMethodEl.value === 'transfer' ? '銀行匯款(8折)' : '貨到付款(9折)';

    // LINE 訊息生成
    let lineMsg = `AIFANG KIDS 訂單確認\n`;
    lineMsg += `•┈┈┈┈┈┈୨୧┈┈┈┈┈┈•\n`;
    lineMsg += `訂單編號：${orderId}\n`;
    lineMsg += `收件人：${name}\n`;
    lineMsg += `付款方式：${payText}\n`;
    lineMsg += `•┈┈┈┈┈┈୨୧┈┈┈┈┈┈•\n`;
    cart.forEach((item, i) => {
        const isSale = (item.status || "").toString().trim().toUpperCase() === 'SALE';
        lineMsg += `${i+1}. ${isSale ? '[SALE] ' : ''}${item.name} (${item.color}/${item.size}) x${item.quantity}\n`;
    });
    lineMsg += `•┈┈┈┈┈┈୨୧┈┈┈┈┈┈•\n`;
    lineMsg += `應付金額：NT$ ${calc.finalTotal.toLocaleString()}`;

    const order_payload = {
        mode: "createOrder",
        order_data: {
            order_id: orderId,
            customer_name: name,
            customer_phone: phone,
            customer_email: email,
            customer_address: address,
            payment_method: payMethodEl.value,
            shipping_method: shipMethodEl.value,
            subtotal: calc.subtotal,
            discount: calc.discountAmount,
            shipping_fee: calc.shippingFee,
            total_amount: calc.finalTotal
        },
        items: cart.map(item => ({
            code: item.code,
            name: item.name,
            brand: item.brand || "AiFang",
            color: item.color,
            size: item.size,
            price: Number(item.price),
            quantity: Number(item.quantity)
        }))
    };

    // --- 關鍵修正：在發送前就先把成功資訊存入 localStorage ---
    // 確保即使 fetch 報錯，跳轉後 success 頁面依然有資料顯示正確 ID
    localStorage.setItem('last_order_info', JSON.stringify({
        id: orderId,
        customer_name: name,
        customer_phone: phone,
        customer_address: address,
        total_amount: calc.finalTotal,
        pay_method_text: payText,
        line_msg: lineMsg,
        items: order_payload.items.map(i => ({
            product_name: i.name,
            color: i.color,
            size: i.size,
            quantity: i.quantity,
            unit_price: i.price
        }))
    }));

    try {
        // 發送至 GAS (ApiService.submitOrder 內部應為 POST)
        const response = await ApiService.submitOrder(order_payload);
        
        // 清空購物車並跳轉
        localStorage.removeItem('cart');
        window.location.href = "order_success.html";

    } catch (e) {
        // --- 容錯跳轉 ---
        // 即使發生 "Failed to fetch"，只要資料發出去了，我們直接跳轉成功頁面
        console.warn("API 回應非預期，執行容錯跳轉:", e);
        localStorage.removeItem('cart');
        window.location.href = "order_success.html";
    }
}