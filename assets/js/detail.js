/**
 * assets/js/detail.js
 * 整合項目：[3.2]資訊渲染 [3.3]三色鈕(BEBE/KIDS/JUNIOR) [3.4]價格切換 
 * [3.5]數量增減 [3.6]Styling Tips [3.7]詳細圖文 [4.4]參數解析
 */

const ProductDetail = (function() {
    let currentProduct = null;
    let selectedSize = null;
    let selectedQty = 1;

    /**
     * [4.4] 初始化：解析 URL 參數並索取 API 資料
     */
    async function init() {
        const params = new URLSearchParams(window.location.search);
        const productId = params.get('id'); // 取得 ?id=vividi01

        if (!productId) {
            location.href = 'index.html';
            return;
        }

        // [5.1] 此處可呼叫渲染 Skeleton 骨架屏
        
        await API.init();
        currentProduct = API.getProductByCode(productId);

        if (!currentProduct) {
            alert("此商品不存在或已下架");
            location.href = 'index.html';
            return;
        }

        renderBasicInfo();     // [3.2]
        renderSizeSelector();  // [3.3]
        renderDetailedInfo();  // [3.7]
        setupEventListeners(); // [3.5][3.6]
    }

    /**
     * [3.2] 基礎資訊渲染 & [3.4] 初始價格
     */
    function renderBasicInfo() {
        document.getElementById('detail-main-img').src = currentProduct.img_main;
        document.getElementById('detail-brand').innerText = currentProduct.brand;
        document.getElementById('detail-name').innerText = currentProduct.name;
        document.getElementById('detail-code').innerText = currentProduct.code;
        
        // [3.4] 價格邏輯
        updatePriceDisplay();
    }

    /**
     * [3.4] 價格即時顯示邏輯
     */
    function updatePriceDisplay() {
        const priceArea = document.getElementById('detail-price-area');
        const isSale = currentProduct.sale_price && currentProduct.sale_price < currentProduct.price;
        
        if (isSale) {
            priceArea.innerHTML = `
                <span class="old-price">NT$${currentProduct.price}</span>
                <span class="sale-price">NT$${currentProduct.sale_price}</span>
            `;
        } else {
            priceArea.innerHTML = `<span class="normal-price">NT$${currentProduct.price}</span>`;
        }
    }

    /**
     * [3.3] 三色(尺寸)鈕邏輯：BEBE / KIDS / JUNIOR
     */
    function renderSizeSelector() {
        const sizeContainer = document.getElementById('size-options');
        if (!sizeContainer) return;

        // 定義對應 stock_S, M, L 的專屬命名
        const sizeConfigs = [
            { label: 'BEBE', stock: parseInt(currentProduct.stock_S || 0) },
            { label: 'KIDS', stock: parseInt(currentProduct.stock_M || 0) },
            { label: 'JUNIOR', stock: parseInt(currentProduct.stock_L || 0) }
        ];

        sizeContainer.innerHTML = sizeConfigs.map(s => {
            const isOut = s.stock === 0;
            return `
                <button class="size-btn ${isOut ? 'out-of-stock' : ''}" 
                        data-size="${s.label}" 
                        data-stock="${s.stock}"
                        ${isOut ? 'disabled' : ''}>
                    ${s.label} ${isOut ? '(SOLD OUT)' : ''}
                </button>
            `;
        }).join('');
    }

    /**
     * [3.7] 詳細說明區 (解析 API description/more_images)
     */
    function renderDetailedInfo() {
        const descText = document.getElementById('detail-full-desc');
        const imageGrid = document.getElementById('detail-more-images');

        if (descText) descText.innerText = currentProduct.description || "";

        // 解析多圖網址 (假設逗號分隔)
        if (imageGrid && currentProduct.more_images) {
            const imgs = currentProduct.more_images.split(',');
            imageGrid.innerHTML = imgs.map(url => `
                <img src="${url.trim()}" alt="Detail Image" class="more-img" loading="lazy">
            `).join('');
        }
    }

    /**
     * 事件監聽中心
     */
    function setupEventListeners() {
        // [3.3] 尺寸選擇事件
        const sizeOptions = document.getElementById('size-options');
        sizeOptions.addEventListener('click', (e) => {
            const btn = e.target.closest('.size-btn');
            if (!btn || btn.disabled) return;

            document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            selectedSize = btn.dataset.size;
            
            // [3.5] 重置數量上限為該尺寸剩餘庫存
            resetQty(parseInt(btn.dataset.stock));

            // [3.6] 顯示 1+1 Styling Tips
            triggerStylingTips();
        });

        // [3.5] 數量增減控制
        document.getElementById('qty-minus').onclick = () => changeQty(-1);
        document.getElementById('qty-plus').onclick = () => changeQty(1);

        // 加入購物車觸發
        document.getElementById('add-to-cart-btn').onclick = () => {
            if (!selectedSize) {
                alert("請先選擇尺寸 (BEBE / KIDS / JUNIOR)");
                return;
            }
            // 呼叫 Cart.js 模組
            Cart.addItem(currentProduct, selectedSize, selectedQty);
            // 觸發反饋動畫
            showAddFeedback();
        };
    }

    /**
     * [3.5] 數量邏輯
     */
    function resetQty(max) {
        selectedQty = 1;
        const input = document.getElementById('qty-input');
        input.value = 1;
        input.max = max;
    }

    function changeQty(delta) {
        const input = document.getElementById('qty-input');
        const max = parseInt(input.max || 99);
        let newVal = selectedQty + delta;

        if (newVal < 1) newVal = 1;
        if (newVal > max) {
            newVal = max;
            alert(`目前尺寸庫存僅剩 ${max} 件`);
        }

        selectedQty = newVal;
        input.value = newVal;
    }

    /**
     * [3.6] Styling Tips 預覽框 ($100 組合優惠)
     */
    function triggerStylingTips() {
        // 僅在上衣、下身或套裝顯示 1+1 提示
        const eligible = ['Top', 'Bottoms', 'Set'].includes(currentProduct.category);
        const tipBox = document.getElementById('styling-tip-box');
        
        if (tipBox && eligible) {
            tipBox.innerHTML = `
                <div class="tip-card">
                    <p>✨ <b>Styling Tips:</b> 搭配指定上/下身商品，即享 <b>1+1 組合現折 $100</b> 優惠！</p>
                </div>
            `;
            tipBox.classList.add('active');
        }
    }

    function showAddFeedback() {
        const btn = document.getElementById('add-to-cart-btn');
        const originalText = btn.innerText;
        btn.innerText = "SUCCESSFULLY ADDED!";
        btn.classList.add('added');
        setTimeout(() => {
            btn.innerText = originalText;
            btn.classList.remove('added');
        }, 2000);
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', ProductDetail.init);