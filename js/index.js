/* ================== STEP 3 : CATEGORY + BRAND FILTER ================== */

let allProducts = [];      // 原始商品
let filteredProducts = []; // 篩選後商品

function initPage(products) {
  allProducts = products;
  filteredProducts = products;

  generateCategoryFilters(products);
  generateBrandFilters(products);

  renderProducts(filteredProducts); // 你原本的商品卡渲染函式
}

/* ---------- 產生分類 ---------- */
function generateCategoryFilters(products) {
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const ul = document.getElementById('filter-category');
  ul.innerHTML = '';

  categories.forEach(cat => {
    ul.innerHTML += `
      <li>
        <label>
          <input type="checkbox" value="${cat}" class="filter-category">
          ${cat}
        </label>
      </li>
    `;
  });
}

/* ---------- 產生品牌 ---------- */
function generateBrandFilters(products) {
  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];
  const ul = document.getElementById('filter-brand');
  ul.innerHTML = '';

  brands.forEach(brand => {
    ul.innerHTML += `
      <li>
        <label>
          <input type="checkbox" value="${brand}" class="filter-brand">
          ${brand}
        </label>
      </li>
    `;
  });
}

/* ---------- 綁定事件 ---------- */
document.addEventListener('change', e => {
  if (e.target.classList.contains('filter-category') ||
      e.target.classList.contains('filter-brand')) {
    applyFilters();
  }
});

function applyFilters() {
  const checkedCategories = [...document.querySelectorAll('.filter-category:checked')]
    .map(cb => cb.value);

  const checkedBrands = [...document.querySelectorAll('.filter-brand:checked')]
    .map(cb => cb.value);

  filteredProducts = allProducts.filter(p => {
    const matchCategory =
      checkedCategories.length === 0 || checkedCategories.includes(p.category);

    const matchBrand =
      checkedBrands.length === 0 || checkedBrands.includes(p.brand);

    return matchCategory && matchBrand;
  });

  renderProducts(filteredProducts);
}
