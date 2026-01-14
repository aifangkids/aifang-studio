document.addEventListener('DOMContentLoaded', () => {
    // 1. 取得 checkout.js 存入的資料 (對接 last_order_info 鍵值)
    const orderData = JSON.parse(localStorage.getItem('last_order_info'));

    // 異常處理：若直接開啟此頁面而無訂單資料，則導回首頁
    if (!orderData) {
        alert("找不到訂單資訊，將為您導回首頁。");
        window.location.href = 'index.html';
        return;
    }

    // 2. 渲染頁面資訊 (將資料填入對應的 HTML ID)
    document.getElementById('display-order-id').innerText = orderData.id;
    document.getElementById('display-name').innerText = orderData.customer_name;
    document.getElementById('display-phone').innerText = orderData.customer_phone;
    document.getElementById('display-address').innerText = orderData.customer_address;
    document.getElementById('display-pay-method').innerText = orderData.pay_method_text;
    document.getElementById('display-total').innerText = `NT$ ${orderData.total_amount.toLocaleString()}`;

    // 渲染商品清單摘要
    const listContainer = document.getElementById('display-item-list');
    if (orderData.items && orderData.items.length > 0) {
        listContainer.innerHTML = orderData.items.map(item => `
            <div class="item-mini">
                <span>${item.product_name} (${item.color}/${item.size}) x${item.quantity}</span>
                <span>NT$ ${(item.unit_price * item.quantity).toLocaleString()}</span>
            </div>
        `).join('');
    }

    // 3. 處理 LINE 複製與跳轉邏輯
    const lineBtn = document.getElementById('line-link');
    const copyHelper = document.getElementById('copy-helper'); // 隱藏的 textarea 輔助複製
    
    lineBtn.addEventListener('click', async () => {
        const msg = orderData.line_msg || "";
        copyHelper.value = msg;

        try {
            // 優先使用新版瀏覽器 Clipboard API
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(msg);
            } else {
                // 傳統備援方案
                copyHelper.select();
                document.execCommand('copy');
            }
            
            // UI 反饋：讓使用者知道已複製
            const originalContent = lineBtn.innerHTML;
            lineBtn.innerHTML = "✅ 訂單已複製！正在開啟 LINE...";
            lineBtn.style.background = "#333";

            // 延遲跳轉，確保使用者看到反饋並讓系統完成複製行為
            setTimeout(() => {
                const encodedMsg = encodeURIComponent(msg);
                // 導向 LINE 官方帳號並帶入預填訊息
                const lineUrl = "https://line.me/R/oaMessage/@844bwwjl/?" + encodedMsg;
                window.location.href = lineUrl;
                
                // 3秒後恢復按鈕狀態（預防使用者跳轉後又按回上一頁）
                setTimeout(() => {
                    lineBtn.innerHTML = originalContent;
                    lineBtn.style.background = "var(--accent)";
                }, 3000);
            }, 1000);

        } catch (err) {
            console.error("複製失敗:", err);
            alert("複製失敗，請手動截圖此頁面並透過 LINE 傳送給客服人員。");
        }
    });
});