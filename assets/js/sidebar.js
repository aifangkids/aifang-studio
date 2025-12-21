// assets/js/sidebar.js

document.addEventListener("DOMContentLoaded", async () => {
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebarToggle");

  // 手機 / 平板彈入 / 彈出
  toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  // 取得商品資料
  const products = await fetchProducts();

  // 取得所有分類
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))].sort();

  // 建立 HTML
  sidebar.innerHTML = `
    <ul class="category-list">
      ${categories.map(cat => {
        const brands = [...new Set(products.filter(p => p.category === cat).map(p => p.brand).filter(Boolean))].sort();
        return `
          <li class="category-item">
            <span class="category-name">${cat}</span>
            <ul class="brand-list">
              ${brands.map(b => `<li class="brand-item">${b}</li>`).join('')}
            </ul>
          </li>
        `;
      }).join('')}
    </ul>
  `;

  // Hover 顯示品牌
  const categoryItems = sidebar.querySelectorAll(".category-item");
  categoryItems.forEach(item => {
    item.addEventListener("mouseenter", () => {
      const brandList = item.querySelector(".brand-list");
      if(brandList) brandList.style.display = "block";
    });
    item.addEventListener("mouseleave", () => {
      const brandList = item.querySelector(".brand-list");
      if(brandList) brandList.style.display = "none";
    });
  });
});
