/**
 * assets/js/api.js
 * AiFang Studio 2.0 - 數據靈魂與通訊中心
 * 職責：負責與 Google Apps Script (GAS) 進行雙向通訊
 * 依賴：必須先載入 assets/js/config.js
 */

const API = (function() {
    // 內部狀態儲存 (單一資料來源)
    const _state = {
        products: [], // 存放所有商品簡介
        details: [],  // 存放詳細資料
        isLoaded: false,
        lastFetchTime: 0
    };

    /**
     * [核心功能] 初始化數據
     * 對應檢核項目：[2.2], [2.3], [2.4], [3.x]
     * 說明：只在第一次載入時 fetch，之後切換頁面直接讀快取
     */
    async function init() {
        if (_state.isLoaded) return true;

        try {
            console.log("🚀 API: 開始載入商品數據...");
            const response = await fetch(CONFIG.API_URL); // 使用 config.js 的網址
            
            if (!response.ok) throw new Error("網路連線失敗");

            const data = await response.json();
            
            // 資料寫入內部狀態
            _state.products = data.products || [];
            _state.details = data.details || [];
            _state.isLoaded = true;
            _state.lastFetchTime = Date.now();

            console.log(`✅ API: 數據載入完成 (商品數: ${_state.products.length})`);
            return true;
        } catch (error) {
            console.error("❌ API Init Error:", error);
            alert("系統維護中，無法載入商品數據，請稍後再試。");
            return false;
        }
    }

    /**
     * [4.2] Order API 串接 - 提交訂單
     * @param {Object} orderData - 包含收件人、購物車內容、總金額的物件
     */
    async function submitOrder(orderData) {
        console.log("🚀 API: 準備發送訂單...", orderData);

        // [4.5] 防錯邏輯：簡單檢查
        if (!orderData || !orderData.cartItems || orderData.cartItems.length === 0) {
            console.error("❌ 訂單內容為空");
            return { success: false, message: "訂單內容為空" };
        }

        try {
            // 使用 text/plain 避免 CORS preflight (GAS 專用技巧)
            const response = await fetch(CONFIG.API_URL, {
                method: "POST",
                mode: "no-cors", 
                headers: {
                    "Content-Type": "text/plain"
                },
                body: JSON.stringify(orderData)
            });

            // 注意：mode: 'no-cors' 不會回傳標準 JSON response
            // 只要沒有拋出錯誤 (catch)，我們就視為 GAS 成功接收
            console.log("✅ API: 訂單發送指令已送出 (no-cors mode)");
            return { success: true };

        } catch (error) {
            console.error("❌ API Submit Error:", error);
            return { success: false, message: "網路傳輸失敗，請截圖聯繫客服。" };
        }
    }

    // ============================================
    // 資料讀取器 (Getters) - 供 index.js / detail.js 使用
    // ============================================

    // 取得所有商品 (用於 Index [2.2], [2.3])
    function getAllProducts() {
        return _state.products;
    }

    // 取得單一商品完整資料 (用於 Detail [3.x])
    // 自動合併 products (基本) 與 details (詳細) 兩張表的資料
    function getProductByCode(code) {
        const basic = _state.products.find(p => p.code === code);
        const detail = _state.details.find(d => d.code === code);
        
        if (!basic) return null;
        
        // 合併回傳，若 detail 沒資料則給空物件避免報錯
        return { ...basic, ...(detail || {}) };
    }

    // 根據分類取得商品 (用於 Sidebar [1.4] 點擊後)
    function getProductsByCategory(categoryKey) {
        if (categoryKey === 'all') return _state.products;
        return _state.products.filter(p => p.category === categoryKey);
    }
    
    // 根據品牌篩選 (用於 Sidebar [1.4] 品牌勾選)
    function getProductsByBrand(brandName) {
         return _state.products.filter(p => p.brand === brandName);
    }

    // 公開給外部呼叫的方法
    return {
        init,
        submitOrder,
        getAllProducts,
        getProductByCode,
        getProductsByCategory,
        getProductsByBrand
    };
})();