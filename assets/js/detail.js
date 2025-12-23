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

    const app = document.getElementById('product-detail-app');

    // 顯示載入中（流沙效果）
    app.innerHTML = `<div class="skeleton-detail"></div>`;

    // 2. 呼叫 api.js 取得資料
    try {
        const product = await fetchDetailByCode(code);
        
        if (!product) {
            app.innerHTML = '<div class="error-msg">找不到此商品資料</div>';
            return;
        }

        // 3. 渲染商品詳情 HTML
        renderProductDetail(product);

        // 4. 初始化輪播圖功能
        initCarousel();

        // 5. 綁定加入購物車與相關互動
        initDetailInteractions(product);

    } catch (err) {
        console.error('商品載入失敗:', err);
        app.innerHTML = '<div class="error-msg">系統忙碌中，請稍後再試。</div>';
    }
});

function renderProductDetail(p) {
    // 取得預設顯示價格 (優先找 bebe/baby)
    const s = p.sizes || {};
    const defaultPrice = s.baby?.salePrice || s.baby?.price || 0;
    
    const html = `
        <div class="detail-layout">
            <div class="detail-visual">
                <div class="carousel-container">
                    <div class="carousel-wrapper" id="carousel-wrapper">
                        ${p.carousel.map((img, index) => `
                            <div class="carousel-slide ${index === 0 ? 'active' : ''}">
                                <img src="${img}" alt="${p.name}" onerror="this.src='https://placehold.co/600x600?text=No+Image'">
                            </div>
                        `).join('')}
                    </div>
                    ${p.carousel.length > 1 ? `
                        <button class="carousel-nav prev">❮</button>
                        <button class="carousel-nav next">❯</button>
                        <div class="carousel-dots"></div>
                    ` : ''}
                </div>
            </div>

            <div class="detail-info">
                <div class="info-header">
                    <span class="detail-brand">${p.brand || 'AiFang'}</span>
                    <h1 class="product-title">${p.name}</h1>
                    <div class="detail-price">
                        <span id="display-price">NT$ ${defaultPrice}</span>
                    </div>
                </div>

                <div class="detail-selector">
                    <div class="select-group">
                        <label>尺寸 (Size)</label>
                        <div class="size-options">
                            ${Object.keys(s).map(key => s[key] ? `
                                <button class="option-btn" data-type="${key}" data-price="${s[key].salePrice || s[key].price}">
                                    ${key === 'baby' ? 'bebe' : key}
                                </button>
                            ` : '').join('')}
                        </div>
                    </div>

                    <div class="select-group">
                        <label>顏色 (Color)</label>
                        <div class="color-options">
                            ${(p.colorswatch || []).map((val, i) => {
                                const isUrl = val.startsWith('http');
                                const style = isUrl ? `background-image:url('${val}')` : `background-color:${val}`;
                                return `<div class="swatch-item" style="${style}" title="${p.colors[i] || ''}"></div>`;
                            }).join('')}
                        </div>
                    </div>
                </div>

                <div class="detail-action">
                    <div class="qty-selector">
                        <button class="qty-btn minus">-</button>
                        <input type="number" value="1" id="order-qty" min="1">
                        <button class="qty-btn plus">+</button>
                    </div>
                    <button id="add-to-cart-btn" class="buy-btn">加入購物車</button>
                </div>

                <div class="detail-description">
                    <h3>商品描述</h3>
                    <p>${p.description || '暫無描述'}</p>
                    ${p.material ? `<p><strong>材質：</strong>${p.material}</p>` : ''}
                </div>
            </div>
        </div>

        <div class="detail-images">
            ${(p.detailImages || []).map(img => `
                <img src="${img}" loading="lazy" onerror="this.style.display='none'">
            `).join('')}
        </div>
    `;

    document.getElementById('product-detail-app').innerHTML = html;
}

function initCarousel() {
    const wrapper = document.getElementById('carousel-wrapper');
    if (!wrapper) return;
    const slides = wrapper.querySelectorAll('.carousel-slide');
    const dotsContainer = document.querySelector('.carousel-dots');
    const prev = document.querySelector('.carousel-nav.prev');
    const next = document.querySelector('.carousel-nav.next');
    let current = 0;

    function showSlide(idx) {
        slides.forEach((s, i) => s.classList.toggle('active', i === idx));
        if(dotsContainer) {
            const dots = dotsContainer.querySelectorAll('.dot');
            dots.forEach((d, i) => d.classList.toggle('active', i === idx));
        }
    }

    if(dotsContainer) {
        slides.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.className = `dot ${i === 0 ? 'active' : ''}`;
            dot.onclick = () => { current = i; showSlide(current); };
            dotsContainer.appendChild(dot);
        });
    }

    if(prev) prev.onclick = () => { current = (current - 1 + slides.length) % slides.length; showSlide(current); };
    if(next) next.onclick = () => { current = (current + 1) % slides.length; showSlide(current); };
}

function initDetailInteractions(product) {
    const qtyInput = document.getElementById('order-qty');
    const priceDisplay = document.getElementById('display-price');
    const sizeBtns = document.querySelectorAll('.option-btn');

    // 1. 數量增減
    document.querySelector('.qty-btn.plus')?.addEventListener('click', () => qtyInput.value++);
    document.querySelector('.qty-btn.minus')?.addEventListener('click', () => { if(qtyInput.value > 1) qtyInput.value--; });

    // 2. 尺寸切換價格
    sizeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            sizeBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            priceDisplay.innerText = `NT$ ${btn.dataset.price}`;
        });
    });

    // 3. 加入購物車
    document.getElementById('add-to-cart-btn')?.addEventListener('click', () => {
        const selectedSize = document.querySelector('.option-btn.selected')?.innerText || 'bebe';
        const cartItem = {
            id: `${product.code}-${selectedSize}`,
            name: product.name,
            size: selectedSize,
            price: parseInt(priceDisplay.innerText.replace('NT$', '')),
            quantity: parseInt(qtyInput.value),
            image: product.mainImage
        };
        
        if(typeof addToCart === 'function') {
            addToCart(cartItem);
            alert('已成功加入購物車！');
            if(typeof updateCartIcon === 'function') updateCartIcon();
        }
    });
}
