import { calculateOrder } from './cart.js'; // 沿用全站唯一計算函式 [cite: 45, 94]

const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbxnlAwKJucHmCKcJwv67TWuKV0X74Daag9X9I4NG7DOESREuYdU7BtWBPcEHyoJphoEfg/exec';

document.getElementById('checkout-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. 取得購物車內容
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        alert("您的購物車是空的");
        return;
    }

    // 2. 取得使用者選擇的付款與運送資訊 [cite: 21, 99]
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    const shippingMethod = document.getElementById('shipping-method').value;
    
    // 3. 執行折扣計算 (1+1 -> 付款折扣 -> 運費) [cite: 30-33, 86-93]
    const finalOrder = calculateOrder(cart, paymentMethod);

    // 4. 封裝傳送至 GAS 的資料庫格式 [cite: 22]
    const payload = {
        action: 'submitOrder',
        order_info: {
            consignee: document.getElementById('consignee').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            payment: paymentMethod,
            shipping: shippingMethod,
            store_id: document.getElementById('store-id')?.value || ''
        },
        items: cart, // 包含 code, size, color, quantity
        calculation: finalOrder, // 包含 subtotal, bundleDiscount, shipping, total
        timestamp: new Date().toISOString()
    };

    try {
        // 使用 POST 傳送到您的 GAS [cite: 22, 48]
        const response = await fetch(GAS_API_URL, {
            method: 'POST',
            mode: 'no-cors', // 處理 GAS 的跨域限制
            body: JSON.stringify(payload)
        });

        // 5. 成功後的後續處理 [cite: 23]
        alert("訂單已提交！我們將盡快與您聯繫。");
        localStorage.removeItem('cart'); // 清空購物車
        window.location.href = 'index.html'; // 返回首頁
    } catch (error) {
        console.error("Order Submission Error:", error);
        alert("提交訂單時發生錯誤，請稍後再試。");
    }
});