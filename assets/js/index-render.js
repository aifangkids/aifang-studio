/**
 * assets/js/index-render.js
 * 職責：首頁商品分區佈局 [2.2, 2.3]、標籤邏輯 [2.4]、複合色票判定
 */

const IndexRender = (function() {
    
    /**
     * 初始化首頁渲染
     */
    async function init() {
        // [5.1] 顯示骨架佔位 (Skeleton)
        showSkeleton();

        // [4.2] 確保 API 已初始化並抓到資料
        const isReady = await API.init();
        if (!isReady) {
            console.error("❌ 無法載入 API 資料");
            return;
        }

        const allProducts = API.getAllProducts();
        
        // 執行分區渲染 [2.2] [2.3]
        renderLayout(allProducts);
    }

    /**
     * [5.1] 骨架屏渲染邏輯
     */
    function showSkeleton() {
        const newContainer = document.getElementById('new-arrivals-container');
        const seriesContainer = document.getElementById('series-container');
        
        const skItem = `<div class="product-card skeleton"><div class="sk-img"></div><div class="sk-txt"></div></div>`;
        
        if (newContainer) newContainer.innerHTML = skItem.repeat(2);
        if (seriesContainer) seriesContainer.innerHTML = skItem.repeat(4);
    }

    /**
     * 佈局分區渲染 [2.2] [2.3]
     */
    function renderLayout(products) {
        if (!products || products.length === 0) return;

        // [2.2] 新品區：取前 2 筆
        const newArrivals = products.slice(0, 2);
        // [2.3] 系列區：取第 3 筆之後
        const seriesItems = products.slice(2);

        const newTarget = document.getElementById('new-arrivals-container');
        const seriesTarget = document.getElementById('series-container');

        if (newTarget) {
            newTarget.innerHTML = newArrivals.map(p => generateProductHTML(p)).join('');
        }

        if (seriesTarget) {
            seriesTarget.innerHTML = seriesItems.map(p => generateProductHTML(p)).join('');
        }
    }

    /**
     * 生成單一商品 HTML [2.4]
     */
    function generateProductHTML(product) {
        // 1. [2.4] 三碼售罄判定 (S, M, L 同時為 0)
        const s = parseInt(product.stock_S || 0);
        const m = parseInt(product.stock_M || 0);
        const l = parseInt(product.stock_L || 0);
        const isAllSoldOut = (s + m + l) === 0;

        // 2. 價格與折扣標籤計算
        const isOnSale = product.sale_price && product.sale_price < product.price;
        const currentPrice = isOnSale ? product.sale_price : product.price;

        // 3. [2.4] 複合色票邏輯 (colorswatches 欄位)
        let colorSwatchesHTML = '';
        if (product.colorswatches) {
            const swatchList = product.colorswatches.split(','); // 以逗號拆分
            colorSwatchesHTML = `<div class="color-swatches">
                ${swatchList.map(item => {
                    const val = item.trim();
                    // 關鍵：判定是圖片網址還是 HEX 色碼
                    const isImg = val.includes('http') || val.includes('images/');
                    const style = isImg 
                        ? `background-image: url('${val}'); background-size: cover;` 
                        : `background-color: ${val};`;
                    
                    return `<span class="dot" style="${style}"></span>`;
                }).join('')}
            </div>`;
        }

        // 4. 標籤與遮罩 HTML
        let overlayHTML = '';
        let badgeHTML = '';

        if (isAllSoldOut) {
            // [2.4] 半透明遮罩
            overlayHTML = `<div class="sold-out-overlay"><span class="sold-out-text">${CONFIG.LABELS.SOLD_OUT}</span></div>`;
        } else if (isOnSale) {
            badgeHTML = `<div class="badge discount-tag">${CONFIG.LABELS.DISCOUNT_TAG}</div>`;
        }

        // 5. 組合最終卡片
        // 點擊會導向詳情頁並帶上 ID [4.4]
        return `
            <div class="product-card fade-in" onclick="location.href='detail.html?id=${product.code}'">
                <div class="img-box ${isAllSoldOut ? 'is-sold-out' : ''}">
                    <img src="${product.img_main}" alt="${product.name}" loading="lazy">
                    ${overlayHTML}
                    ${badgeHTML}
                </div>
                <div class="info-box">
                    <p class="brand-tag">${product.brand}</p>
                    <h4 class="product-name">${product.name}</h4>
                    <div class="price-row">
                        ${isOnSale ? `<span class="old-price">NT$${product.price}</span>` : ''}
                        <span class="final-price ${isOnSale ? 'sale' : ''}">NT$${currentPrice}</span>
                    </div>
                    ${colorSwatchesHTML}
                </div>
            </div>
        `;
    }

    /**
     * [1.4] 供 sidebar.js 呼叫的篩選接口
     */
    function filterAndRender(category, selectedBrands) {
        let filtered = API.getAllProducts();

        if (category !== 'all') {
            filtered = filtered.filter(p => p.category === category);
        }

        if (selectedBrands && selectedBrands.length > 0) {
            filtered = filtered.filter(p => selectedBrands.includes(p.brand));
        }

        // 篩選後統一渲染至系列區，並清空新品區
        const newContainer = document.getElementById('new-arrivals-container');
        const seriesContainer = document.getElementById('series-container');
        
        if (newContainer) newContainer.innerHTML = '';
        if (seriesContainer) {
            seriesContainer.innerHTML = filtered.length > 0 
                ? filtered.map(p => generateProductHTML(p)).join('') 
                : '<p class="no-data">NO PRODUCTS FOUND.</p>';
        }
    }

    // 將篩選功能暴露給全域
    window.ProductRender = { filterAndRender };

    return { init };

})();

document.addEventListener('DOMContentLoaded', IndexRender.init);