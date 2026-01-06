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
    // 初始執行一次物流切換與金額計算
    handlePaymentChange();
}

// 處理付款方式切換：變更運送選項與計算
function handlePaymentChange() {
    const payMethod = document.querySelector('input[name="pay_method"]:checked').value;
    const shipContainer = document.getElementById('ship-method-container');
    const addrLabel = document.getElementById('address-label');
    
    let html = '';
    if (payMethod === 'transfer') {
        // 匯款：可選宅配、超取
        html = `
            <label class="radio-item"><input type="radio" name="ship_method" value="home" checked onchange="updateSummary()"> 宅配到府</label>
            <label class="radio-item"><input type="radio" name="ship_method" value="store" onchange="updateSummary()"> 7-11 超商取貨</label>
        `;
        addrLabel.innerText = "收件地址 / 門市名稱";
    } else {
        // 貨付：強制超取
        html = `
            <label class="radio-item"><input type="radio" name="ship_method" value="store" checked onchange="updateSummary()"> 7-11 超商取貨</label>
        `;
        addrLabel.innerText = "7-11 門市名稱及店號";
    }
    shipContainer.innerHTML = html;
    updateSummary();
}

// 核心計算功能
function updateSummary() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // 1. 計算原始總價 (單價 * 數量)
    const subtotal = cart.reduce((sum, item) => {
        const price = parseFloat(item.price) || 0;
        const qty = parseInt(item.quantity) || 0;
        return sum + (price * qty);
    }, 0);

    const payMethod = document.querySelector('input[name="pay_method"]:checked').value;

    // 2. 折扣邏輯
    const discountRate = (payMethod === 'transfer') ? 0.8 : 0.9;
    const discountedSubtotal = Math.round(subtotal * discountRate);
    const discountAmount = subtotal - discountedSubtotal;

    // 3. 運費邏輯
    let shippingFee = 0;
    if (payMethod === 'transfer') {
        shippingFee = 0; // 匯款免運
    } else {
        shippingFee = (discountedSubtotal >= 1500) ? 0 : 60; // 貨付滿1500免運，否則60
    }

    const finalTotal = discountedSubtotal + shippingFee;

    // 4. 更新 UI (確保 ID 與 HTML 完全一致)
    document.getElementById('show-subtotal').innerText = `NT$ ${subtotal.toLocaleString()}`;
    document.getElementById('show-discount').innerText = `- NT$ ${discountAmount.toLocaleString()}`;
    document.getElementById('show-shipping').innerText = (shippingFee === 0) ? "免運" : `NT$ ${shippingFee.toLocaleString()}`;
    document.getElementById('show-total').innerText = `NT$ ${finalTotal.toLocaleString()}`;

    // 暫存資料
    window.finalOrderCalc = { subtotal, discountAmount, shippingFee, finalTotal };
}

async function submitOrder() {
    const cart = JSON.parse(localStorage.getItem('cart'));
    const calc = window.finalOrderCalc;
    const payMethod = document.querySelector('input[name="pay_method"]:checked').value;
    const shipMethod = document.querySelector('input[name="ship_method"]:checked').value;
    
    const name = document.getElementById('cust_name').value.trim();
    const phone = document.getElementById('cust_phone').value.trim();
    const email = document.getElementById('cust_email').value.trim();
    const address = document.getElementById('cust_address').value.trim();

    if (!name || !phone || !address) {
        alert("請填寫收件人姓名、電話及地址/門市資訊");
        return;
    }

    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerText = "PROCESSING...";

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
        // 使用 no-cors 模式確保即使跨域也能發送
        await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(order_payload)
        });

        // 成功發送後直接導向成功頁面
        localStorage.setItem('last_order_info', JSON.stringify({
            id: "AF" + new Date().getTime().toString().slice(-6),
            name: name,
            pay: (payMethod === 'transfer' ? "銀行匯款(8折)" : "貨到付款(9折)"),
            total: calc.finalTotal,
            items: cart
        }));

        localStorage.removeItem('cart');
        window.location.href = "order_success.html";

    } catch (e) {
        console.error(e);
        alert("訂單送出發生問題，請聯繫官方 LINE 客服");
        submitBtn.disabled = false;
        submitBtn.innerText = "PLACE ORDER";
    }
}