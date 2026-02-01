/**
 * AiFang Kids - order_success.js
 * [2026.02 效能優化版]
 * 負責：訂單結果展示、LINE 訊息自動複製與跳轉、狀態清理
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. 取得 checkout.js 存入的資料
    const orderData = JSON.parse(localStorage.getItem('last_order_info'));

    // 異常處理：若直接開啟此頁面而無訂單資料，則導回首頁
    if (!orderData) {
        console.warn("No order data found, redirecting...");
        window.location.href = 'index.html';
        return;
    }

    // 2. 渲染頁面資訊
    renderOrderInfo(orderData);

    // 成功渲染後，清理購物車，避免重複結帳
    localStorage.removeItem('cart');
    localStorage.removeItem('temp_order_summary');

    // 3. 處理 LINE 複製與跳轉邏輯
    initLineAction(orderData);
    
    // 平滑滾動至頂部，確保看到成功訊息
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

/**
 * 渲染訂單主要資訊
 */
function renderOrderInfo(data) {
    const safeSetText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    };

    safeSetText('display-order-id', data.id);
    safeSetText('display-name', data.customer_name);
    safeSetText('display-phone', data.customer_phone);
    safeSetText('display-address', data.customer_address);
    safeSetText('display-pay-method', data.pay_method_text);
    safeSetText('display-total', `NT$ ${data.total_amount.toLocaleString()}`);

    // 渲染商品清單摘要
    const listContainer = document.getElementById('display-item-list');
    if (listContainer && data.items && data.items.length > 0) {
        listContainer.innerHTML = data.items.map(item => `
            <div class="item-mini" style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:8px; color:#555;">
                <span>${item.product_name} <small style="color:#999;">(${item.color}/${item.size})</small> x${item.quantity}</span>
                <span style="font-weight:bold; color:#111;">NT$ ${(item.unit_price * item.quantity).toLocaleString()}</span>
            </div>
        `).join('');
    }
}

/**
 * 初始化 LINE 跳轉按鈕
 */
function initLineAction(orderData) {
    const lineBtn = document.getElementById('line-link');
    const copyHelper = document.getElementById('copy-helper');
    if (!lineBtn || !copyHelper) return;

    lineBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const msg = orderData.line_msg || "";
        copyHelper.value = msg;

        // 視覺即時反饋
        const originalContent = lineBtn.innerHTML;
        lineBtn.innerHTML = "<span>✅ 訂單已複製！正在開啟 LINE...</span>";
        lineBtn.style.opacity = "0.8";

        try {
            // 優先執行複製動作
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(msg);
            } else {
                copyHelper.select();
                copyHelper.setSelectionRange(0, 99999); // 針對移動端優化
                document.execCommand('copy');
            }

            // 延遲跳轉，確保複製行為在瀏覽器執行緒中完成
            setTimeout(() => {
                const encodedMsg = encodeURIComponent(msg);
                // 使用 LINE 官方帳號訊息格式
                const lineUrl = `https://line.me/R/oaMessage/@844bwwjl/?${encodedMsg}`;
                
                // 執行跳轉
                window.location.href = lineUrl;

                // 備援：若 location.href 被阻擋，嘗試在新分頁開啟
                setTimeout(() => {
                    lineBtn.innerHTML = originalContent;
                    lineBtn.style.opacity = "1";
                }, 2000);
            }, 800);

        } catch (err) {
            console.error("Action error:", err);
            alert("複製失敗，請手動截圖此頁面，並透過 LINE 傳送給客服人員。");
            lineBtn.innerHTML = originalContent;
            lineBtn.style.opacity = "1";
        }
    });
}