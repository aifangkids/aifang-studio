import { fetchProducts } from "./api.js";

let allProducts = [];
let activeCategory = "ALL";
let activeBrands = new Set();

/* =============================
   初始化
============================= */
window.addEventListener("DOMContentLoaded", async () => {
  allProducts = await fetchProducts();
  buildCategories(allProducts);
  renderProducts(allProducts);
  document.getElementById("main-content").classList.add("loaded");
});

/* =============================
   Render 商品卡
============================= */
function renderProducts(items) {
  const container = document.getElementById("product-list");
  container.innerHTML = "";

  items.forEach(p => {
    const badge =
      p.is_new ? `<span class="status-badge badge-NEW">NEW</span>` : "";

    const colors = (p.color_code || "")
      .split(",")
      .map(c => c.trim())
      .filter(c => c.startsWith("#"));

    const colorHtml = `
      <div class="color-row">
        ${colors.map(c => `<div class="color-dot" style="background:${c}"></div>`).join("")}
      </div>
    `;

    const price =
      p.price_baby_sale ||
      p.price_kid_sale ||
      p.price_junior_sale ||
      p.price_adult_sale ||
      p.price_baby ||
      p.price_kid ||
      p.price_junior ||
      p.price_adult ||
      0;

    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <div class="img-wrap"
        style="background-image:url('${p.image_main}')"
        onmouseenter="this.style.backgroundImage='url(${p.image_hover || p.image_main})'"
        onmouseleave="this.style.backgroundImage='url(${p.image_main})'">
        ${badge}
      </div>
      <p class="p-name">${p.name}</p>
      ${colorHtml}
      <p class="p-price">NT$ ${price.toLocaleString()}</p>
    `;
    container.appendChild(card);
  });
}

/* =============================
   Category / Brand
============================= */
function buildCategories(products) {
  const menu = document.getElementById("category-menu");
  const cats = ["ALL", ...new Set(products.map(p => p.category).filter(Boolean))];

  menu.innerHTML = cats
    .map(c => `<li onclick="filterCategory('${c}')">${c}</li>`)
    .join("");
}

window.filterCategory = function (cat) {
  activeCategory = cat;
  activeBrands.clear();

  let filtered =
    cat === "ALL" ? allProducts : allProducts.filter(p => p.category === cat);

  buildBrands(filtered);
  renderProducts(filtered);
};

function buildBrands(items) {
  const area = document.getElementById("brand-area");
  const list = document.getElementById("brand-list");

  const brands = [...new Set(items.map(p => p.brand).filter(Boolean))];
  if (brands.length === 0) {
    area.classList.remove("open");
    return;
  }

  area.classList.add("open");
  list.innerHTML = brands
    .map(
      b =>
        `<div class="brand-item" onclick="toggleBrand('${b}')">${b}</div>`
    )
    .join("");
}

window.toggleBrand = function (brand) {
  activeBrands.has(brand)
    ? activeBrands.delete(brand)
    : activeBrands.add(brand);

  let filtered = allProducts.filter(
    p =>
      (activeCategory === "ALL" || p.category === activeCategory) &&
      (activeBrands.size === 0 || activeBrands.has(p.brand))
  );

  renderProducts(filtered);
};

/* =============================
   UI
============================= */
window.toggleMenu = () =>
  document.getElementById("sidebar").classList.toggle("open");

window.closeMenu = () =>
  document.getElementById("sidebar").classList.remove("open");

window.toggleCart = () => alert("購物車即將推出");
