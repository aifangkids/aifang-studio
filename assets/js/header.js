// 自動載入 header.html
function loadHeader() {
  const headerDiv = document.getElementById('header');
  if (!headerDiv) return;

  fetch('/partials/header.html')
    .then(response => response.text())
    .then(html => {
      headerDiv.innerHTML = html;
      updateCartIcon(); // 載入完後更新購物車圖示
      attachCartListeners(); // 綁定購物車事件
    })
    .catch(err => console.error('Header load error:', err));
}

// 購物車圖示更新
function updateCartIcon() {
  const cart = JSON.parse(localStorage.getItem('cart') || '{}');
  const count = Object.values(cart).reduce((sum, item) => sum + (item.qty || 0), 0);

  const cartIcon = document.getElementById('cartIcon');
  const cartCount = document.getElementById('cartCount');

  if(cartIcon && cartCount){
    if(count >= 1){
      cartIcon.src = "https://raw.githubusercontent.com/aifangkids/aifang-studio/main/images/cart3.png";
      cartCount.textContent = count;
      cartCount.style.display = "flex";
    } else {
      cartIcon.src = "https://raw.githubusercontent.com/aifangkids/aifang-studio/main/images/cart2.png";
      cartCount.style.display = "none";
    }
  }
}

// 可延伸：綁定購物車點擊事件
function attachCartListeners() {
  const cartContainer = document.querySelector('.cart-container');
  if(cartContainer){
    cartContainer.addEventListener('click', () => {
      window.location.href = 'cart.html';
    });
  }
}

// DOMContentLoaded 時自動載入 Header
document.addEventListener('DOMContentLoaded', loadHeader);
