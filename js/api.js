/**
 * AiFang Kids - api.js
 * [2026.01 效能優化最終版]
 */

const ApiService = {
    // --- 配置資訊 ---
    API_URL: "https://script.google.com/macros/s/AKfycbxnlAwKJucHmCKcJwv67TWuKV0X74Daag9X9I4NG7DOESREuYdU7BtWBPcEHyoJphoEfg/exec",
    CACHE_KEY: "AIFANG_PROD_DATA",
    CACHE_EXPIRY: 10 * 60 * 1000, // 10分鐘快取

    /**
     * 1. 獲取所有產品列表 (首頁使用)
     */
    async fetchProducts() {
        const cached = sessionStorage.getItem(this.CACHE_KEY);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                const isExpired = (Date.now() - parsed.timestamp) > this.CACHE_EXPIRY;
                if (!isExpired) {
                    console.log("⚡ [ApiService] 資料來自瀏覽器快取 (Cache Hit)");
                    return parsed.data;
                }
            } catch (e) {
                console.error("快取解析失敗", e);
            }
        }

        try {
            console.log("🌐 [ApiService] 正在連線至 GAS 獲取最新資料...");
            const response = await fetch(this.API_URL);
            if (!response.ok) throw new Error("網路請求失敗");
            
            const result = await response.json();
            const products = result.products || [];

            // 更新快取
            sessionStorage.setItem(this.CACHE_KEY, JSON.stringify({
                data: products,
                timestamp: Date.now()
            }));

            return products;
        } catch (error) {
            console.error("❌ [ApiService] 商品讀取失敗:", error);
            return cached ? JSON.parse(cached).data : null;
        }
    },

    /**
     * 2. 獲取單一產品 (Detail.js 使用)
     * 優化：優先從「全品項快取」中過濾，找不到才單獨請求 API
     */
    async getProductByCode(code) {
        // 先嘗試從全品項快取中尋找
        const allProducts = await this.fetchProducts(); 
        if (allProducts) {
            const found = allProducts.find(p => String(p.code) === String(code));
            if (found) {
                console.log(`⚡ [ApiService] 商品 ${code} 已從快取秒開`);
                return found;
            }
        }

        // 若快取內找不到 (例如直接貼網址進來)，則單獨向 API 請求
        console.log(`🌐 [ApiService] 快取無此商品，單獨請求 API: ${code}`);
        try {
            const response = await fetch(`${this.API_URL}?code=${code}`);
            const result = await response.json();
            return result.products ? result.products.find(p => String(p.code) === String(code)) : (Array.isArray(result) ? result[0] : result);
        } catch (e) {
            console.error("單一商品讀取失敗", e);
            return null;
        }
    },

    /**
     * 3. 送出訂單 (POST)
     */
    async submitOrder(orderPayload) {
        try {
            console.log("📤 [ApiService] 正在送出訂單...", orderPayload);
            const response = await fetch(this.API_URL, {
                method: "POST",
                mode: "no-cors", 
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify(orderPayload)
            });
            // GAS no-cors 模式下回傳透明，我們直接回傳成功
            return { success: true };
        } catch (error) {
            console.error("❌ [ApiService] 訂單送出異常:", error);
            return { success: false, error: error.toString() };
        }
    },

    /**
     * 4. 查詢單一訂單 (order_query.html)
     */
    async queryOrder(orderId) {
        try {
            const queryUrl = `${this.API_URL}?mode=order_query&orderId=${encodeURIComponent(orderId)}`;
            const response = await fetch(queryUrl);
            return await response.json();
        } catch (error) {
            console.error("❌ [ApiService] 查詢失敗:", error);
            return { success: false, message: "查詢錯誤" };
        }
    }
};