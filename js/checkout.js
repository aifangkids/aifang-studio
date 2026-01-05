import { calculateOrder } from './cart.js';

const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbxnlAwKJucHmCKcJwv67TWuKV0X74Daag9X9I4NG7DOESREuYdU7BtWBPcEHyoJphoEfg/exec';

const checkoutForm = document.getElementById('checkout-form');

if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. 取得購物車
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        if (cart.length === 0) {
            alert("購物車是空的，無法結帳");
            return;
        }

        // 2. 獲取表單元素 (增加安全檢查)
        const consigneeEl = document.getElementById('consignee');
        const phoneEl = document.getElementById('phone');
        const addressEl = document.getElementById('address');
        const paymentEl = document.querySelector('input[name="payment"]:checked');

        if (!consigneeEl || !phoneEl || !addressEl || !paymentEl) {
            alert("表單欄位不完整，請檢查 HTML 結構");
            return;
        }

        const paymentMethod = paymentEl.value;

        // 3. 執行折扣計算
        const calculation = calculateOrder(cart, paymentMethod);

        // 4. 打包資料
        const payload = {
            consignee: consigneeEl.value,
            phone: phoneEl.value,
            address: addressEl.value,
            payment: paymentMethod,
            items: cart,
            total_amount: calculation.total,
            discount_detail: calculation,
            timestamp: new Date().toLocaleString()
        };

        // 5. 送出資料
        try {
            const btn = document.getElementById('submit-btn');
            btn.innerText = "提交中...";
            btn.disabled = true;

            await fetch(GAS_API_URL, {
                method: 'POST',
                mode: 'no-cors', // 配合 GAS
                body: JSON.stringify(payload)
            });

            alert("訂單已成功送出！");
            localStorage.removeItem('cart');
            window.location.href = 'index.html';
        } catch (error) {
            console.error("提交失敗", error);
            alert("提交失敗，請檢查網路連線");
        }
    });
}