// assets/js/detail.js

document.addEventListener('DOMContentLoaded', async () => {
    // 1. 從網址取得參數 ?code=xxx
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (!code) {
        alert('找不到商品代碼');
        window.location.href = 'index.html';
        return;
    }

    const container = document.querySelector('.product-detail-container'); // 需在 HTML 建立此容器

    // 2. 呼叫 api.js 取得資料
    try {
        const product = await fetchDetailByCode(code);
        
        if (!product) {
            container.innerHTML = '<p>找不到此商品資料</p>';
            return;
        }

        // 3. 渲染商品詳情 HTML (動態產生輪播圖結構)
        renderProductDetail(product);

        // 4. 初始化輪播圖功能 (資料產生後才能綁定事件)
        initCarousel();

        // 5. 綁定加入購物車按鈕
        initAddToCart(product);

    } catch (err) {
        console.error('商品載入失敗:', err);
    }
});

function renderProductDetail(p) {
    // 取得價格 (假設你的 API 結構有 p.price 或 p.sizes)
    // 這裡做一個防呆，根據你的 API 回傳結構調整
    const displayPrice = p.sizes?.baby?.salePrice || p.sizes?.baby?.price || p.price || 0;
    
    const html = `
        <div class="detail-grid">
            <div class="carousel-container">
                <div class="carousel-wrapper">
                    ${p.carousel.map((img, index) => `
                        <div class="carousel-slide" style="display: ${index === 0 ? 'block' : 'none'}">
                            <img src="${img}" alt="${p.name}">
                        </div>
                    `).join('')}
                </div>
                ${p.carousel.length > 1 ? `
                    <button class="carousel-prev">❮</button>
                    <button class="carousel-next">❯</button>
                    <div class="carousel-dots"></div>
                ` : ''}
            </div>

            <div class="product-info">
                <h1>${p.name}</h1>
                <p class="brand">${p.brand || '品牌'}</p>
                <div class="price">NT$ ${displayPrice}</div>
                
                <div class="description">
                    ${p.description || '暫無商品描述'}
                </div>

                <button id="add-to-cart-btn" class="btn btn-primary">加入購物車</button>
            </div>
        </div>
    `;

    // 假設 HTML 有一個 id="main-content" 或直接插入 body
    // 建議在 detail.html 裡面放一個 <div id="product-detail-app"></div>
    const app = document.getElementById('product-detail-app');
    if (app) app.innerHTML = html;
}

// 輪播圖邏輯 (與你原本的相似，但包裝成 function)
function initCarousel() {
    const slides = document.querySelectorAll('.carousel-slide');
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');
    const dotsContainer = document.querySelector('.carousel-dots');
    
    if (slides.length === 0) return;

    let currentIndex = 0;

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.style.display = i === index ? 'block' : 'none';
        });
        updateDots(index);
    }

    function updateDots(index) {
        if(!dotsContainer) return;
        dotsContainer.innerHTML = '';
        slides.forEach((_, i) => {
            const dot = document.createElement('span');
            dot.className = `dot ${i === index ? 'active' : ''}`;
            dot.onclick = () => { currentIndex = i; showSlide(currentIndex); };
            dotsContainer.appendChild(dot);
        });
    }

    if (prevBtn) prevBtn.onclick = () => {
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        showSlide(currentIndex);
    };
    if (nextBtn) nextBtn.onclick = () => {
        currentIndex = (currentIndex + 1) % slides.length;
        showSlide(currentIndex);
    };

    updateDots(0);
}

// 加入購物車功能
function initAddToCart(product) {
    const btn = document.getElementById('add-to-cart-btn');
    if(!btn) return;

    btn.addEventListener('click', () => {
        // 呼叫 cart.js 中的 addToCart 全域函式
        // 注意：這裡需要整理一下傳給購物車的資料格式
        const cartItem = {
            id: product.code, // 使用 code 當作 ID
            name: product.name,
            price: product.sizes?.baby?.salePrice || 0,
            quantity: 1,
            image: product.mainImage
        };
        
        if(typeof addToCart === 'function') {
            addToCart(cartItem);
            alert('已加入購物車！');
            // 更新 Header 的數字 (如果 load-snippets 有暴露 updateCartIcon 最好，或是重整)
            if(typeof updateCartIcon === 'function') updateCartIcon();
        } else {
            console.error('找不到 addToCart 函式，請確認 cart.js 是否載入');
        }
    });
}