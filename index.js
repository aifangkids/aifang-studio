import { fetchProducts } from "./api.js";

document.addEventListener("DOMContentLoaded", init);

async function init() {
  const grid = document.getElementById("productGrid");
  const main = document.getElementById("mainContent");

  if (!grid || !main) {
    console.error("主內容 DOM 不存在");
    return;
  }

  const products = await fetchProducts();
  renderProducts(products, grid);
  main.classList.add("loaded");
}

function renderProducts(items, grid) {
  grid.innerHTML = "";

  items.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <div class="img-wrap" style="background-image:url('${p.image || ""}')"></div>
      <div class="p-name">${p.name}</div>
      <div class="p-price">$${p.price}</div>
    `;

    grid.appendChild(card);
  });
}
