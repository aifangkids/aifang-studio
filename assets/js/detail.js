// assets/js/detail.js

document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productCode = urlParams.get('code');
    const container = document.getElementById("product-detail-app");

    if (!productCode || !container) return;

    try {
        // 從 api.js 取得 details 分頁的資料
        const product = await fetchDetailByCode(productCode);

        if (!product) {
            container.innerHTML = "<h2>找不到商品詳情，請返回首頁。</h2>";
            return;
        }

        renderDetailedPage(container, product);
    } catch (error) {
        console.error("❌ 詳情頁載入錯誤:", error);
    }
});

function renderDetailedPage(container, p) {
    // 1. 處理顏色 (colors 為中文名, colorswatch 為圖片網址)
    const colorOptionsHTML = p.colors.map((name, i) => {
        const imgUrl = p.colorswatch[i] || '';
        return `
            <div class="color-item" onclick="changeMainImage('${imgUrl}', ${i})">
                <div class="color-dot" style="background-image: url('${imgUrl}');" title="${name}"></div>
                <span class="color-name">${name}</span>
            </div>
        `;
    }).join('');

    // 2. 處理尺寸與金額 (baby, kids, elementary)
    const sizes = p.sizes || {};
    const sizeGroupsHTML = ['baby', 'kids', 'elementary'].map(key => {
        const s = sizes[key];
        if (!s || !s.options || s.options.length === 0) return '';
        
        const isSale = s.salePrice && Number(s.salePrice) < Number(s.price);
        return `
            <div class="size-group">
                <div class="size-header">
                    <span class="size-label-tag">${s.label}</span>
                    <span class="price-tag">
                        ${isSale ? `<del>NT$${s.price}</del> <span class="sale">NT$${s.salePrice}</span>` : `NT$${s.price}`}
                    </span>
                </div>
                <div class="size-options">
                    ${s.options.map(opt => `<button class="size-btn">${opt}</button>`).join('')}
                </div>
            </div>
        `;
    }).join('');

    // 3. 組合完整 HTML (包含 stylingtips 與 sizechartinfo)
    container.innerHTML = `
        <div class="detail-wrapper">
            <div class="detail-gallery">
                <div class="main-image-container">
                    <img id="main-display-img" src="${p.carousel[0] || p.mainImage}" alt="${p.name}">
                </div>
                <div class="carousel-nav">
                    ${p.carousel.map((img, i) => `<img src="${img}" onclick="changeMainImage('${img}', ${i})">`).join('')}
                </div>
            </div>

            <div class="detail-content">
                <span class="brand-tag">${p.brand}</span>
                <h1 class="product-title">${p.name}</h1>
                <p class="product-code">編號：${p.code}</p>

                <div class="section">
                    <h4>選擇顏色</h4>
                    <div class="color-selector-grid">${colorOptionsHTML}</div>
                </div>

                <div class="section">
                    <h4>選擇尺寸</h4>
                    ${sizeGroupsHTML}
                </div>

                <div class="section info-box">
                    <h4>本集造型 (Styling Tips)</h4>
                    <p>${p.stylingtips || '暫無建議'}</p>
                </div>

                <div class="section info-box">
                    <h4>尺寸說明 (Size Chart Info)</h4>
                    <p>${p.sizechartinfo || '請參考一般標準尺寸'}</p>
                </div>

                <div class="section info-box">
                    <h4>商品描述</h4>
                    <p>${p.description || '暫無描述'}</p>
                </div>
            </div>
        </div>

        <div class="bottom-details">
            <h3>Product Details</h3>
            <div class="detail-images-list">
                ${p.detailImages.map(img => `<img src="${img}" loading="lazy">`).join('')}
            </div>
        </div>
    `;
}

// 點擊顏色或縮圖切換大圖的功能
window.changeMainImage = function(url, index) {
    const mainImg = document.getElementById('main-display-img');
    if (mainImg && url) {
        mainImg.src = url;
    }
};
