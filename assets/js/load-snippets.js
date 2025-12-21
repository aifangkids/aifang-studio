// load-snippets.js
// 功能：載入 HTML snippet，並支援購物車更新與事件綁定

async function loadSnippet(fileName, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`loadSnippet 防呆：容器 #${containerId} 不存在`);
        return;
    }

    const snippetPath = `assets/snippets/${fileName}.html`; // 相對路徑

    try {
        const response = await fetch(snippetPath);
        if (!response.ok) {
            console.warn(`載入失敗：${snippetPath} (${response.status})`);
            container.innerHTML = `<p style="color:red;">⚠️ 無法載入 ${fileName}</p>`;
            return;
        }
        const html = await response.text();
        container.innerHTML = html;

        // 如果載入的是 header，執行購物車相關功能
        if (fileName === 'header') {
            updateCartIcon();
            attachCartListeners();
        }

    } catch (err) {
        console.error(`載入 ${snippetPath} 時發生錯誤:`, err);
        container.innerHTML = `<p style="color:red;">⚠️ 載入 ${fileName} 發生錯誤</p>`;
    }
}

// 一次載入多個 snippet
async function loadAllSnippets(snippets) {
    if (!Array.isArray(snippets) || snippets.length === 0) return;
    const promises = snippets.map(s => loadSnippet(s.fileName, s.containerId));
    await Promise.all(promises);
}

// 購物車圖示更新
function updateCartIcon() {
    const cart = JSON.parse(localStorage.getItem('cart') || '{}');
    const count = Object.values(cart).reduce((sum, item) => sum + (item.qty || 0), 0);

    const cartIcon = document.getElementById('cartIcon');
    const cartCount = document.getElementById('cartCount');

    if (cartIcon && cartCount) {
        if (count >= 1) {
            cartIcon.src = "https://raw.githubusercontent.com/aifangkids/aifang-studio/main/images/cart3.png";
            cartCount.textContent = count;
            cartCount.style.display = "flex";
        } else {
            cartIcon.src = "https://raw.githubusercontent.com/aifangkids/aifang-studio/main/images/cart2.png";
            cartCount.style.display = "none";
        }
    }
}

// 綁定購物車點擊事件
function attachCartListeners() {
    const cartContainer = document.querySelector('.cart-container');
    if (cartContainer) {
        cartContainer.addEventListener('click', () => {
            window.location.href = 'cart.html';
        });
    }
}

// DOMContentLoaded 時自動載入 snippets
document.addEventListener('DOMContentLoaded', () => {
    const snippetsToLoad = [
        { fileName: 'header', containerId: 'header-container' },
        { fileName: 'footer', containerId: 'footer-container' },
        { fileName: 'sidebar', containerId: 'sidebar-container' }
    ];
    loadAllSnippets(snippetsToLoad);
});
