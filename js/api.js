/**
 * AiFang Kids - api.js
 * [2026.02 價格邏輯優化版 - 全站統一 9 折預處理]
 */

const ApiService = {
    // --- 配置資訊 ---
    API_URL: "https://script.google.com/macros/s/AKfycbxnlAwKJucHmCKcJwv67TWuKV0X74Daag9X9I4NG7DOESREuYdU7BtWBPcEHyoJphoEfg/exec",
    CACHE_KEY: "AIFANG_PROD_DATA",
    CACHE_EXPIRY: 10 * 60 * 1000, // 10分鐘快取

    /**
     * 內部工具：處理價格邏輯
     * 這裡統一全站折扣邏輯，方便未來一鍵修改
     */
    _processPrices(products) {
        if (!Array.isArray(products)) return products;
        return products.map(item => {
            const original = Number(item.price_kid || 0);
            const isSale = (String(item.status) || "").toUpperCase() === "SALE";
            
            return {
                ...item,
                // 新增兩個標準欄位供全站調用
                price_original: original,
                // 如果是 SALE 維持原價；如果是一般商品，無腦 9 折
                price_final: isSale ? original : Math.round(original * 0.9)
            };
        });
    },

    /**
     * 1. 獲取所有產品列表
     */
    async fetchProducts() {
        const cached = sessionStorage.getItem(this.CACHE_KEY);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                const isExpired = (Date.now() - parsed.timestamp) > this.CACHE_EXPIRY;
                if (!isExpired) {
                    console.log("⚡ [ApiService] 快取命中 (數據已含折扣處理)");
                    return parsed.data;
                }
            } catch (e) {
                console.error("快取解析失敗", e);
            }
        }

        try {
            console.log("🌐 [ApiService] 正在連線至 GAS 並注入折扣邏輯...");
            const response = await fetch(this.API_URL);
            if (!response.ok) throw new Error("網路請求失敗");
            
            const result = await response.json();
            // --- 核心優化：在這裡直接注入折扣數據 ---
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
     * 2. 獲取單一產品
     */
    async getProductByCode(code) {
        const allProducts = await this.fetchProducts(); 
        if (allProducts) {
            const found = allProducts.find(p => String(p.code) === String(code));
            if (found) return found;
        }

        console.log(`🌐 [ApiService] 快取無此商品，單獨請求並處理價格: ${code}`);
        try {
            const response = await fetch(`${this.API_URL}?code=${code}`);
            const result = await response.json();
            const rawItem = result.products ? result.products.find(p => String(p.code) === String(code)) : (Array.isArray(result) ? result[0] : result);
            
            // 單一商品也過一遍價格處理
            return rawItem ? this._processPrices([rawItem])[0] : null;
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
            return { success: true };
        } catch (error) {
            console.error("❌ [ApiService] 訂單送出異常:", error);
            return { success: false, error: error.toString() };
        }
    },

    /**
     * 4. 查詢單一訂單
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