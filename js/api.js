/**
 * AiFang Kids - api.js 核心系統 (2026.02 終極優化版)
 * 鎖定 GAS 網址：https://script.google.com/macros/s/AKfycbxnlAwKJucHmCKcJwv67TWuKV0X74Daag9X9I4NG7DOESREuYdU7BtWBPcEHyoJphoEfg/exec
 */

const ApiService = {
    // --- 固定配置資訊 ---
    API_URL: "https://script.google.com/macros/s/AKfycbxnlAwKJucHmCKcJwv67TWuKV0X74Daag9X9I4NG7DOESREuYdU7BtWBPcEHyoJphoEfg/exec",
    CACHE_KEY: "AIFANG_PROD_DATA",
    CACHE_EXPIRY: 10 * 60 * 1000, // 10 分鐘快取

    /**
     * 內部工具：價格與折扣邏輯注入
     * 處理規則：一般商品 9 折，標註為 SALE 之商品維持原價
     */
    _processPrices(products) {
        if (!Array.isArray(products)) return products;
        return products.map(item => {
            // 這裡抓取 price_kid 做為基準價格，您也可以根據需要增加 baby/junior 的判定
            const original = Number(item.price_kid || 0);
            const isSale = (String(item.status) || "").toUpperCase() === "SALE";
            
            return {
                ...item,
                // price_original: 原始價格 (試算表原價)
                price_original: original,
                // price_final: 最終顯示價格 (如果是 SALE 不動，一般商品打 9 折)
                price_final: isSale ? original : Math.round(original * 0.9)
            };
        });
    },

    /**
     * 1. 獲取所有產品列表 (含自動折扣處理)
     */
    async fetchProducts() {
        const cached = sessionStorage.getItem(this.CACHE_KEY);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                const isExpired = (Date.now() - parsed.timestamp) > this.CACHE_EXPIRY;
                if (!isExpired) {
                    console.log("⚡ [ApiService] 快取命中 (數據已含 9 折預處理)");
                    return parsed.data;
                }
            } catch (e) {
                console.error("快取解析失敗", e);
            }
        }

        try {
            console.log("🌐 [ApiService] 正在連線至 GAS 並同步折扣邏輯...");
            const response = await fetch(`${this.API_URL}?mode=getProducts`);
            if (!response.ok) throw new Error("網路請求失敗");
            
            const result = await response.json();
            // 在存入快取前，直接將 9 折數據注入
            const processedProducts = this._processPrices(result.products || []);

            sessionStorage.setItem(this.CACHE_KEY, JSON.stringify({
                data: processedProducts,
                timestamp: Date.now()
            }));

            return processedProducts;
        } catch (error) {
            console.error("❌ [ApiService] 商品讀取失敗:", error);
            return cached ? JSON.parse(cached).data : null;
        }
    },

    /**
     * 2. 獲取單一產品 (優先從快取查找，確保價格一致)
     */
    async getProductByCode(code) {
        const allProducts = await this.fetchProducts(); 
        if (allProducts) {
            const found = allProducts.find(p => String(p.code) === String(code));
            if (found) return found;
        }

        // 若快取無此商品，單獨請求
        try {
            const response = await fetch(`${this.API_URL}?mode=getProducts`); // 重新抓取完整列表
            const result = await response.json();
            const rawItem = (result.products || []).find(p => String(p.code) === String(code));
            
            return rawItem ? this._processPrices([rawItem])[0] : null;
        } catch (e) {
            console.error("單一商品讀取失敗", e);
            return null;
        }
    },

    /**
     * 3. 送出訂單 (將前端計算結果寫入試算表)
     * 會寫入分頁 2 (order) 與 分頁 3 (orderitems)
     */
    async submitOrder(orderPayload) {
        try {
            console.log("📤 [ApiService] 正在傳送訂單至試算表...", orderPayload);
            const response = await fetch(this.API_URL, {
                method: "POST",
                mode: "no-cors", 
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify(orderPayload)
            });
            // 由於 no-cors 無法讀取 response，我們假設發送成功
            return { success: true };
        } catch (error) {
            console.error("❌ [ApiService] 訂單發送異常:", error);
            return { success: false, error: error.toString() };
        }
    },

    /**
     * 4. 查詢訂單 (order_query.html 使用)
     */
    async queryOrder(orderId) {
        try {
            const queryUrl = `${this.API_URL}?mode=order_query&orderId=${encodeURIComponent(orderId)}`;
            const response = await fetch(queryUrl);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("❌ [ApiService] 查詢失敗:", error);
            return { success: false, message: "連線錯誤，請稍後再試" };
        }
    }
};