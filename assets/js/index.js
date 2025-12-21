// assets/js/index.js

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("product-list");

  // 顯示 Skeleton
  container.innerHTML = `<div class="skeleton-grid">
    ${Array(6).fill(0).map(() => `
      <div class="skeleton-card">
        <div class="skeleton-img"></div>
        <div class="skeleton-text"></div>
        <div class="skeleton-text short"></div>
      </div>`).join('')}
  </div>`;

  // 取得商品資料
  const products = await fetchProducts();

  // 渲染商品卡片
  container.innerHTML = products.map(p => {
    return `
      <div class="product-card">
        <a href="detail.html?code=${p.code}">
          <img src="${p.mainImage}" alt="${p.name}">
        </a>
        <h3>${p.name}</h3>
        <p>${p.brand}</p>
        <p>${p.category}</p>
        <div class="price">NT$${p.sizes.baby?.salePrice || p.sizes.baby?.price || 0}</div>
        <div class="color-swatch">
          ${p.colors.map(c => {
            if (c.type === "hex") return `<span class="swatch" style="background:${c.value}"></span>`;
            if (c.type === "image") return `<img class="swatch" src="${c.value}" alt="">`;
            return "";
          }).join('')}
        </div>
      </div>
    `;
  }).join('');
});
