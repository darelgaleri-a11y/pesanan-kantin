import "./styles/stitch.css";
import "./styles/app.css";

import { registerRoute, initRouter, renderCurrentRoute } from "./router.js";
import { ensureAnonymousSession } from "./services/auth.service.js";

import { renderDashboard } from "./pages/dashboard.js";
import { renderOrders } from "./pages/orders.js";
import { renderOrderForm } from "./pages/order-form.js";
import { renderMenus } from "./pages/menus.js";
import { renderImportOrders } from "./pages/import-orders.js";
import { renderClasses } from "./pages/classes.js";
import { renderRooms } from "./pages/rooms.js";
import { renderDistribution } from "./pages/distribution.js";
import { renderKitchen } from "./pages/kitchen.js";
import { renderBanana } from "./pages/banana.js";
import { renderDrinks } from "./pages/drinks.js";
import { renderExport } from "./pages/export.js";
import { renderSalesReport } from "./pages/sales-report.js";
import { renderSettings } from "./pages/settings.js";

// Semua halaman memakai sesi Firebase anonim di belakang layar.
// Pengguna tidak perlu login; Firestore tetap menerima request.auth.
async function openPage(renderPage) {
  try {
    await ensureAnonymousSession();
    await renderPage();
  } catch (error) {
    console.error("Gagal menyiapkan sesi aplikasi:", error);
    const app = document.querySelector("#app");
    if (app) {
      app.innerHTML = `
        <main class="min-h-screen flex items-center justify-center p-6">
          <section class="max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
            <h1 class="text-lg font-bold text-slate-800">Aplikasi belum dapat terhubung</h1>
            <p class="mt-2 text-sm text-slate-600">Periksa koneksi internet dan pastikan metode Anonymous diaktifkan pada Firebase Authentication.</p>
            <button class="mt-4 rounded-lg bg-primary px-4 py-2 text-white" onclick="location.reload()">Coba lagi</button>
          </section>
        </main>`;
    }
  }
}

registerRoute("/", () => openPage(renderDashboard));
registerRoute("/pesanan", () => openPage(renderOrders));
registerRoute("/tambah-pesanan", () => openPage(renderOrderForm));
registerRoute("/menu", () => openPage(renderMenus));
registerRoute("/import-pesanan", () => openPage(renderImportOrders));
registerRoute("/import-orders", () => openPage(renderImportOrders));
registerRoute("/kelas", () => openPage(renderClasses));
registerRoute("/kamar", () => openPage(renderRooms));
registerRoute("/rekap-pembagian", () => openPage(renderDistribution));
registerRoute("/rekap-dapur", () => openPage(renderKitchen));
registerRoute("/rekap-pisang", () => openPage(renderBanana));
registerRoute("/rekap-minuman", () => openPage(renderDrinks));
registerRoute("/rekap-penjualan", () => openPage(renderSalesReport));
registerRoute("/pengaturan", () => openPage(renderSettings));
registerRoute("/export", () => openPage(renderExport));

initRouter();
renderCurrentRoute();

// Tes GitDoc kedua