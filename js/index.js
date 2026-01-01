import { fetchProducts } from "./js/api.js";

/* =========================
   狀態
========================= */
let allProducts = [];
let activeCategories = new Set();
let activeBrands = new Set();

/* =========================
   初始化
========================= */
init();

async function init() {
  allProducts = (await fetchProducts())
    .filter(p => p.status === "ACTIVE");

  renderCategoryMenu();
  renderProducts();
}

/* =========================
   左側分類 / 品牌
========================= */
function renderCategoryMenu() {
  const container = document.getElementById("categoryMenu");
  container.innerHTML = "";

  const categories = [...new Set(allProducts.map(p => p.category))];

  categories.forEach(cat => {
    const catBlock = document.createElement("div");
    catBlock.className = "category-block";

    const catTitle = document.createElement("div");
    catTitle.className = "category-title";
    catTitle.textContent = cat;
    catTitle.onclick = () => toggleCategory(cat);

    const brandList = document.createElement("div");
    brandList.className = "brand-list";

    const brands = [...new Set(
      allProducts.filter(p => p.category === cat).map(p => p.brand)
    )];

    brands.forEach(brand => {
      const label = document.createElement("label");
      label.innerHTML = `
        <input type="checkbox" data-brand="${brand}">
        ${brand}
      `;
      label.querySelector("input").onchange = e => {
        e.target.checked
          ? activeBrands.add(brand)
          : activeBrands.delete(brand);
        renderProducts();
      };
      brandList.appendChild(label);
    });

    catBlock.append(catTitle, brandList);
    container.appendChild(catBlock);
  });
}

function toggleCategory(cat) {
  activeCategories.has(cat)
    ? activeCategories.delete(cat)
    : activeCategories.add(cat);
  renderProducts();
}

/* =========================
   商品渲染
========================= */
function renderProducts() {
  const newBox = document.getElementById("newProducts");
  const colBox = document.getElementById("collectionProducts");
  newBox.innerHTML = "";
  colBox.innerHTML = "";

  getFilteredProducts().forEach(p => {
    const card = createProductCard(p);
    p.collection === "NEW"
      ? newBox.appendChild(card)
      : colBox.appendChild(card);
  });
}

function getFilteredProducts() {
  return allProducts.filter(p => {
    if (activeCategories.size && !activeCategories.has(p.category)) return false;
    if (activeBrands.size && !activeBrands.has(p.brand)) return false;
    return true;
  });
}

/* =========================
   商品卡
========================= */
function createProductCard(p) {
  const soldOut = isSoldOut(p);

  const card = document.createElement("a");
  card.className = "product-card";
  card.href = `./detail.html?code=${p.code}`;

  card.innerHTML = `
    <div class="img-wrap">
      ${soldOut ? `<span class="soldout">SOLD OUT</span>` : ""}
      <span class="brand-tag">${p.brand}</span>
      <img src="${p.image_main}" alt="${p.name}">
    </div>

    <h4>${p.name}</h4>

    ${renderPrice(p)}

    <div class="colors">
      ${renderColors(p)}
    </div>
  `;
  return card;
}

function isSoldOut(p) {
  return !p.price_baby && !p.price_kid && !p.price_junior;
}

function renderPrice(p) {
  if (p.price_baby_10off) {
    return `
      <div class="price">
        <del>${p.currency}${p.price_baby}</del>
        <span class="sale">${p.currency}${p.price_baby_10off}</span>
        <span class="off">-10%OFF</span>
      </div>
    `;
  }
  return `<div class="price">${p.currency}${p.price_baby}</div>`;
}

function renderColors(p) {
  let html = "";
  if (p.color_code)
    html += `<span class="dot" style="background:${p.color_code}"></span>`;
  if (p.color_pattern)
    html += `<span class="dot pattern"></span>`;
  return html;
}
