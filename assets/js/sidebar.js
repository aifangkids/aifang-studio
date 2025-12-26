/**
 * assets/js/sidebar.js (修正版)
 * 增加 [4.5] 品牌自動檢核隱藏功能
 */

const Sidebar = (function() {
    let selectedBrands = [];
    let currentCategory = 'all';

    async function init() {
        // [關鍵] 確保 API 數據已載入，才能進行 [4.5] 品牌檢核
        await API.init(); 
        
        renderCategories();
        renderBrands(); // 這裡現在具備防錯邏輯
        setupEventListeners();
    }

    /**
     * [1.4] 渲染階層 2：品牌清單
     * 包含 [4.5] 防錯邏輯：若品牌無商品則不顯示
     */
    function renderBrands() {
        const brandList = document.getElementById('brand-list');
        if (!brandList) return;

        // 1. 取得 API 目前所有的商品數據
        const allProducts = API.getAllProducts();
        
        // 2. 從商品數據中提取「確實存在」的品牌清單 (不重複)
        const activeBrandsInData = [...new Set(allProducts.map(p => p.brand))];

        // 3. 過濾 config 裡的品牌，只有在 activeBrandsInData 裡的才留下
        const availableBrands = CONFIG.NAVIGATION.BRANDS_FILTER.filter(brand => 
            activeBrandsInData.includes(brand)
        );

        // [4.5] 若完全沒有品牌有貨，直接隱藏整個品牌區域
        if (availableBrands.length === 0) {
            document.getElementById('brand-filter-area').style.display = 'none';
            return;
        }

        // 4. 渲染真正有商品的品牌
        brandList.innerHTML = availableBrands.map(brand => `
            <div class="brand-item" data-brand="${brand}">
                <div class="custom-checkbox"></div> 
                <span class="brand-name">${brand}</span>
            </div>
        `).join('');
    }

    // ... (其他 renderCategories 與 setupEventListeners 保持不變) ...

    return { init, toggle: (side) => {
        const el = document.getElementById(`sidebar-${side}`);
        if (el) el.classList.toggle('open');
    }};
})();

document.addEventListener('DOMContentLoaded', () => Sidebar.init());