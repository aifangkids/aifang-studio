import { fetchProducts } from "./api.js";

let ALL_PRODUCTS = [];
let currentCategory = "ALL";
let currentBrand = "ALL";

document.addEventListener("DOMContentLoaded", init);

async function init() {
  const products = await fetchProducts();
  ALL_PRODUCTS = products;

  renderCategory(products);
  renderProducts(products);
  document.getElementById("mainContent").classList.add("loaded");
}

/* =========================
   分類 / 品牌
========================= */

function renderCategory(products) {
  const menu = document.getElementById("categoryMenu");
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  menu.innerHTML = `<li class="active" data-cat="ALL">ALL</li>` +
    categories.map(c => `<li data-cat="${c}">${c}</li>`).join("");

  menu.querySelectorAll("li").forEach(li => {
    li.addEventListener("click", () => {
      menu.querySelectorAll("li").forEach(x => x.classList.remove("active"));
      li.classList.add("active");

      currentCategory = li.dataset.cat;
      currentBrand = "ALL";
      renderBrand(products);
      applyFilter();
    });
  });
}

function renderBrand(products) {
  const panel = document.getElementById("brandPanel");

  if (currentCategory === "ALL") {
    panel.classList.remove("open");
    panel.innerHTML = "";
    return;
  }

  const brands = [...new Set(
    products
      .filter(p => p.category === currentCategory)
      .map(p => p.brand)
      .filter(Boolean)
  )];

  panel.innerHTML = brands
    .map(b => `<span class="brand-item" data-brand="${b}">${b}</span>`)
    .join("");

  panel.classList.add("open");

  panel.querySelectorAll(".brand-item").forEach(el => {
    el.addEventListener("click", () => {
      panel.querySelectorAll(".brand-item").forEach(x => x.classList.remove("selected"));
      el.classList.add("selected");

      currentBrand = el.dataset.brand;
      applyFilter();
    });
  });
}

function applyFilter() {
  let list = [...ALL_PRODUCTS];

  if (currentCategory !== "ALL") {
    list = list.filter(p => p.category === currentCategory);
  }
  if (currentBrand !== "ALL") {
    list = list.filter(p => p.brand === currentBrand);
  }

  renderProducts(list);
}

/* =========================
   商品卡
========================= */

function renderProducts(items) {
  const grid = document.getElementById("productGrid");
  grid.innerHTML = "";

  items.forEach(p => {
    const hoverImg = p.image_extra?.[0] || p.image;
    const colors = p.images_by_color || [];

    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <div class="img-wrap"
           style="background-image:url('${p.image}')"
           data-main="${p.image}"
           data-hover="${hoverImg}">
        ${p.is_new ? `<div class="status-badge badge-NEW">NEW</div>` : ""}
      </div>

      <div class="p-name">${p.name}</div>

      ${renderColors(colors)}

      <div class="p-price">$${p.price_min}</div>
    `;

    const imgWrap = card.querySelector(".img-wrap");
    imgWrap.addEventListener("mouseenter", () => {
      imgWrap.style.backgroundImage = `url('${imgWrap.dataset.hover}')`;
    });
    imgWrap.addEventListener("mouseleave", () => {
      imgWrap.style.backgroundImage = `url('${imgWrap.dataset.main}')`;
    });

    grid.appendChild(card);
  });
}

function renderColors(colors) {
  if (!colors.length) return "";

  const dots = colors.map(c => {
    const [name] = c.split("|");
    return `<span class="color-dot" style="background:${name}"></span>`;
  }).join("");

  return `<div class="color-row">${dots}</div>`;
}
