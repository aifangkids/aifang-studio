const API_URL = "https://script.google.com/macros/s/AKfycbxnlAwKJucHmCKcJwv67TWuKV0X74Daag9X9I4NG7DOESREuYdU7BtWBPcEHyoJphoEfg/exec"; 

document.addEventListener('DOMContentLoaded', () => {
    initCheckout();
});

function initCheckout() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        alert("購物車是空的，為您返回首頁");
        window.location.href = "index.html";
        return;
    }
    handlePaymentChange();
}

function handlePaymentChange() {
    const payMethodEl = document.querySelector('input[name="pay_method"]:checked');
    if (!payMethodEl) return;

    const payMethod = payMethodEl.value;
    const shipContainer = document.getElementById('ship-method-container');
    const addrLabel = document.getElementById('address-label');
    
    let html = '';
    if (payMethod === 'transfer') {
        html = `
            <label class="radio-item"><input type="radio" name="ship_method" value="home" checked onchange="updateSummary()"> 宅配到府</label>
            <label class="radio-item"><input type="radio" name="ship_method" value="store" onchange="updateSummary()"> 7-11 超商取貨</label>
        `;
        addrLabel.innerText = "收件地址 / 門市名稱";
    } else {
        // 貨付
        html = `
            <label class="radio-item"><input type="radio" name="ship_method" value="store" checked onchange="updateSummary()"> 7-11 超商取貨</label>
        `;
        addrLabel.innerText = "7-11 門市名稱及店號";
    }
    shipContainer.innerHTML = html;
    updateSummary();
}

function updateSummary() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const payMethodEl = document.querySelector('input[name="pay_method"]:checked');
    if (!payMethodEl) return;

    const payMethod = payMethodEl.value;
    const discountRate = (payMethod === 'transfer') ? 0.8 : 0.9;
    const discountedSubtotal = Math.round(subtotal * discountRate);
    const discountAmount = subtotal - discountedSubtotal;

    let shippingFee = (payMethod === 'transfer') ? 0 : (discountedSubtotal >= 1500 ? 0 : 60);
    const finalTotal = discountedSubtotal + shippingFee;

    document.getElementById('show-subtotal').innerText = `NT$ ${subtotal.toLocaleString()}`;
    document.getElementById('show-discount').innerText = `- NT$ ${discountAmount.toLocaleString()}`;
    document.getElementById('show-shipping').innerText = (shippingFee === 0) ? "免運" : `NT$ ${shippingFee.toLocaleString()}`;
    document.getElementById('show-total').innerText = `NT$ ${finalTotal.toLocaleString()}`;

    window.finalOrderCalc = { subtotal, discountAmount, shippingFee, finalTotal };
}

// --- 修正報錯的核心位置 ---
async function submitOrder() {
    const cart = JSON.parse(localStorage.getItem('cart'));
    const calc = window.finalOrderCalc;

    // 加入安全性檢查，避免讀取不到 checked 元素
    const payMethodEl = document.querySelector('input[name="pay_method"]:checked');
    const shipMethodEl = document.querySelector('input[name="ship_method"]:checked');
    
    if (!payMethodEl || !shipMethodEl) {
        alert("請選擇付款與運送方式");
        return;
    }

    const payMethod = payMethodEl.value;
    const shipMethod = shipMethodEl.value;
    
    const name = document.getElementById('cust_name').value.trim();
    const phone = document.getElementById('cust_phone').value.trim();
    const email = document.getElementById('cust_email').value.trim();
    const address = document.getElementById('cust_address').value.trim();

    if (!name || !phone || !address) {
        alert("請填寫完整收件資訊");
        return;
    }

    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerText = "PROCESSING...";

    // 格式化 LINE 訊息
    let lineMsg = `📦 【AIFANG KIDS 訂單確認】\n`;
    lineMsg += `━━━━━━━━━━━━━━━\n`;
    lineMsg += `👤 收件人：${name}\n`;
    lineMsg += `📞 電話：${phone}\n`;
    lineMsg += `💳 方式：${payMethod === 'transfer' ? '銀行匯款(8折)' : '貨到付款(9折)'}\n`;
    lineMsg += `📍 地址：${address}\n`;
    lineMsg += `━━━━━━━━━━━━━━━\n`;
    lineMsg += `🛍️ 內容：\n`;
    cart.forEach((item, i) => {
        lineMsg += `${i+1}. ${item.name} (${item.color}/${item.size}) x${item.quantity}\n`;
    });
    lineMsg += `━━━━━━━━━━━━━━━\n`;
    lineMsg += `⭐ 應付金額：NT$ ${calc.finalTotal.toLocaleString()}\n`;

    const order_payload = {
        mode: "createOrder",
        order_data: {
            customer_name: name,
            customer_phone: phone,
            customer_email: email,
            shipping_address: address,
            payment_method: payMethod,
            shipping_method: shipMethod,
            subtotal: calc.subtotal,
            discount: calc.discountAmount,
            shipping_fee: calc.shippingFee,
            total_amount: calc.finalTotal
        },
        items: cart
    };

try {
    await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(order_payload)
    });

    // 1. 先存入資料
    localStorage.setItem('last_order_info', JSON.stringify({
        id: "AF" + new Date().getTime().toString().slice(-6),
        customer_name: name,
        customer_phone: phone,
        customer_email: email,
        customer_address: address,
        total_amount: calc.finalTotal,
        pay_method_text: payMethod === 'transfer' ? '銀行匯款(8折)' : '貨到付款(9折)',
        line_msg: lineMsg, // 這裡最重要！
        items: cart.map(item => ({
            product_name: item.name,
            color: item.color,
            size: item.size,
            unit_price: item.price,
            quantity: item.quantity
        }))
    }));

    // 2. 清空購物車
    localStorage.removeItem('cart');

    // 3. 延遲 100 毫秒再跳轉，確保手機快取寫入成功
    setTimeout(() => {
        window.location.href = "order_success.html";
    }, 100);

} catch (e) {
    // ...錯誤處理
}