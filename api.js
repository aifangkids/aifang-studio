/**
 * api.js
 * 專門用來跟你的 GAS API 互動
 * - fetchProducts()
 * - fetchOrders()  (後台)
 * - postOrderAction() (訂單狀態操作)
 */

const GAS_API_BASE = "https://script.google.com/macros/s/AKfycbxGx5-DLVsOyEgFsCnASkCbikJk9qBNTWcO3hWNdWqYiYcyv9QS2eg4ugFEEZ_IFiHWEA/exec";
const API_KEY = "300689";

/**
 * 取得所有產品資料
 * @returns {Promise<Array>} products
 */
export async function fetchProducts() {
  const url = `${GAS_API_BASE}?mode=products`;
  const res = await fetch(url);
  if (!res.ok)
    throw new Error(`fetchProducts 失敗: ${res.status}`);
  const json = await res.json();
  return json.products || [];
}

/**
 * 取得 Orders（後台）
 * @returns {Promise<Array>} orders
 */
export async function fetchOrders() {
  const url = `${GAS_API_BASE}?mode=orders&api_key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok)
    throw new Error(`fetchOrders 失敗: ${res.status}`);
  const json = await res.json();
  return json.orders || [];
}

/**
 * POST 訂單狀態操作（confirmPayment / shipOrder / cancelOrder / refundOrder）
 * @param {string} action
 * @param {string} order_id
 * @returns {Promise<Object>}
 */
export async function postOrderAction(action, order_id) {
  const form = new URLSearchParams();
  form.append("api_key", API_KEY);
  form.append("action", action);
  form.append("order_id", order_id);

  const res = await fetch(GAS_API_BASE, {
    method: "POST",
    body: form
  });

  if (!res.ok)
    throw new Error(`postOrderAction 失敗: ${res.status}`);

  return res.json();
}
