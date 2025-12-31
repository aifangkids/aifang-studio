import { fetchProducts } from "./api.js";

document.addEventListener("DOMContentLoaded", init);

async function init() {
  const products = await fetchProducts();

  // 只顯示 ACTIVE
  const activeProducts = products.filter(p => p.status === "ACTIVE");

  const newArrivals = activeProducts
    .filter(p => p.is_new === true)
    .slice(0, 2);

  const collections = activeProducts.filter(p => !p.is_new);

  renderProducts("new-arrivals", newArrivals);
  renderProducts("collection", collections);
}

function renderProducts(containerId, list) {
  const box = document.getElementById(containerId);
  box.innerHTML = "";

  list.forEach(p => {
    const card = document.createElement("div");
    card.className = "p-card";
    card.dataset.code = p.code;

    card.innerHTML = `
      <div class="p-img-box">
        <img class="p-img-main" src="${p.image_main}">
        ${p.image_hover ? `<img class="p-img-hover" src="${p.image_hover}">` : ""}
        ${p.is_new ? `<span class="tag-new">NEW</span>` : ""}
      </div>

      <div class="p-info">
        <div class="p-name">${p.name}</div>
        <div class="p-price">
          ${getDisplayPrice(p)}
        </div>
        <div class="p-colors">
          ${renderColor(p)}
        </div>
      </div>
    `;

    card.onclick = () => {
      location.href = `detail.html?code=${p.code}`;
    };

    box.appendChild(card);
  });
}

/* ===============================
   價格顯示引擎（index 專用）
================================ */

function getDisplayPrice(p) {
  const order = ["baby", "kid", "junior", "adult"];

  for (const size of order) {
    const price = p[`price_${size}`];
    const off = p[`price_${size}_10off`];

    if (price) {
      if (off) {
        return `
          <span class="price-origin">${p.currency} ${price}</span>
          <span class="price-sale">${p.currency} ${off}</span>
        `;
      }
      return `<span class="price-normal">${p.currency} ${price}</span>`;
    }
  }
  return "";
}

/* ===============================
   顏色顯示
================================ */

function renderColor(p) {
  if (p.color_pattern) {
    return `<img class="color-pattern" src="${p.color_pattern}">`;
  }
  if (p.color_code) {
    return `<span class="color-dot" style="background:${p.color_code}"></span>`;
  }
  return "";
}
