// assets/js/detail.js

document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productCode = urlParams.get('code');
    const container = document.getElementById("product-detail-app");

    if (!productCode || !container) {
        if (container) container.innerHTML = "<p>找不到商品編號，請返回首頁。</p>";
        return;
    }

    // 顯示載入中
    container.innerHTML = `<div class="loading-spinner">載入中...</div>`;

    try {
        // 1. 取得資料 (api.js 已寫好，會從 details 分頁找)
        const product = await fetchDetailByCode(productCode);

        if (!product) {
            container.innerHTML = "<h2>抱歉，找不到該商品詳情。</h2>";
            return;
        }

        // 2. 渲染完整畫面
        renderDetailPage(container, product);

    } catch (error) {
        console.error("❌ 詳情頁載入失敗:", error);
        container.innerHTML = "<p>載入失敗，請稍後再試。</p>";
    }
});

/**
 * 渲染詳情頁 HTML 結構
 */
function renderDetailPage(container, p) {
    // 處理輪播圖 HTML
    const carouselHTML = p.carousel && p.carousel.length > 0 
        ? p.carousel.map((img, i) => `<img src="${img}" class="slide ${i === 0 ? 'active' : ''}" data-index="${i}">`).join('')
        : `<img src="${p.mainImage}" class="slide active">`;

    // 處理顏色 HTML
    const colorsHTML = p.colorswatch && p.colorswatch.length > 0
        ? p.colorswatch.map((val, i) => {
            const isUrl = String(val).startsWith('http');
            const style = isUrl ? `background-image:url('${val}')` : `background-color:${val}`;
            return `<div class="color-dot" style="${style}" title="${p.colors[i] || ''}"></div>`;
        }).join('')
        : '';

    // 處理細節圖 HTML
    const detailImgsHTML = p.detailImages && p.detailImages.length > 0
        ? p.detailImages.map(img => `<img src="${img}" class="detail-img" loading="lazy">`).join('')
        : '';

    container.innerHTML = `
        <div class="product-detail-layout">
            <div class="detail-visual">
                <div class="carousel-main" id="carousel-main">
                    ${carouselHTML}
                    <button class="prev" onclick="moveSlide(-1)">❮</button>
                    <button class="next" onclick="moveSlide(1)">❯</button>
                </div>
            </div>

            <div class="detail-info">
                <div class="brand-label">${p.brand}</div>
                <h1 class="product-title">${p.name}</h1>
                <p class="product-code">商品編號: ${p.code}</p>
                
                <div class="info-section">
                    <h4>選擇顏色</h4>
                    <div class="color-selector">${colorsHTML}</div>
                </div>

                <div class="info-divider"></div>

                <div class="info-section">
                    <h4>商品描述</h4>
                    <p class="desc-text">${p.description || '暫無描述'}</p>
                </div>

                <div class="info-section">
                    <h4>材質說明</h4>
                    <p class="desc-text">${p.material || '詳見標籤'}</p>
                </div>

                <button class="add-to-cart-btn" onclick="handleAddToCart('${p.code}')">
                    加入購物車
                </button>
            </div>
        </div>

        <div class="detail-images-section">
            <h3 class="section-title">Product Details</h3>
            <div class="detail-images-grid">
                ${detailImgsHTML}
            </div>
        </div>
    `;
}

/**
 * 簡易輪播邏輯
 */
let currentSlide = 0;
window.moveSlide = function(step) {
    const slides = document.querySelectorAll('.slide');
    if (slides.length <= 1) return;

    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + step + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
};

/**
 * 加入購物車動作 (串接 cart.js)
 */
window.handleAddToCart = function(code) {
    if (typeof addToCart === 'function') {
        addToCart(code);
        alert('已成功加入購物車！');
    } else {
        console.error("找不到 cart.js 中的 addToCart 函式");
    }
};
