import { renderLayout } from "../components/layout.js";
import { getOrders } from "../services/orders.service.js";
import { getMenus } from "../services/menus.service.js";
import { getClasses } from "../services/classes.service.js";
import { getRooms } from "../services/rooms.service.js";

import {
  createDateRange,
  getTodayDate,
  isDateInRange,
  formatDateRange
} from "../utils/date-range.js";

/*
|--------------------------------------------------------------------------
| STATE
|--------------------------------------------------------------------------
*/

const state = {
  orders: [],
  menus: [],
  classes: [],
  rooms: [],

  loading: true,

 filters: {
  ...createDateRange(),
  kamar: "",
  kelas: "",
  nama: ""
}
};

/*
|--------------------------------------------------------------------------
| UTILITAS
|--------------------------------------------------------------------------
*/



function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeValue(value = "") {
  return String(value)
    .replace(/\s+/g, " ")
    .trim();
}

function formatDate(dateString) {
  if (!dateString) {
    return "-";
  }

  const date = new Date(
    `${dateString}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString(
    "id-ID",
    {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }
  );
}

function getRoot() {
  return (
    document.querySelector("#page-content") ||
    document.querySelector("[data-page-content]") ||
    document.querySelector("main") ||
    document.querySelector("#app")
  );
}

/*
|--------------------------------------------------------------------------
| MASTER MENU — MAKANAN
|--------------------------------------------------------------------------
*/

function isFoodMenu(menu) {
  if (!menu) {
    return false;
  }

  const kategori =
    normalizeText(
      menu.kategori || ""
    );

  return (
    kategori === "makanan"
  );
}

function getFoodMenus() {
  return state.menus.filter(
    (menu) =>
      menu.aktif !== false &&
      isFoodMenu(menu)
  );
}

/*
|--------------------------------------------------------------------------
| CARI MASTER MENU
|--------------------------------------------------------------------------
|
| Prioritas:
| 1. menuId
| 2. nama + varian + ukuran
| 3. nama + varian
| 4. nama
|
*/

function findMasterFoodMenu(item) {
  if (!item) {
    return null;
  }

  /*
   * 1. menuId
   */
  if (item.menuId) {
    const menuById =
      state.menus.find(
        (menu) =>
          menu.id === item.menuId
      );

    if (menuById) {
      return menuById;
    }
  }

  const itemName =
    normalizeText(
      item.namaMenu || ""
    );

  const itemVariant =
    normalizeText(
      item.varian || ""
    );

  const itemSize =
    normalizeText(
      item.ukuran || ""
    );

  /*
   * 2. Nama + varian + ukuran
   */
  let result =
    state.menus.find(
      (menu) => {

        if (!isFoodMenu(menu)) {
          return false;
        }

        const menuName =
          normalizeText(
            menu.nama || ""
          );

        const menuVariant =
          normalizeText(
            menu.varian || ""
          );

        const menuSize =
          normalizeText(
            menu.ukuran || ""
          );

        return (
          menuName === itemName &&
          menuVariant === itemVariant &&
          menuSize === itemSize
        );
      }
    );

  if (result) {
    return result;
  }

  /*
   * 3. Nama + varian
   */
  result =
    state.menus.find(
      (menu) => {

        if (!isFoodMenu(menu)) {
          return false;
        }

        const menuName =
          normalizeText(
            menu.nama || ""
          );

        const menuVariant =
          normalizeText(
            menu.varian || ""
          );

        return (
          menuName === itemName &&
          menuVariant === itemVariant
        );
      }
    );

  if (result) {
    return result;
  }

  /*
   * 4. Nama saja
   */
  result =
    state.menus.find(
      (menu) => {

        if (!isFoodMenu(menu)) {
          return false;
        }

        return (
          normalizeText(
            menu.nama || ""
          ) === itemName
        );
      }
    );

  if (result) {
    return result;
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| FILTER PESANAN
|--------------------------------------------------------------------------
*/

function getFilteredOrders() {
  return state.orders.filter(
    (order) => {

      /*
       * Tanggal
       */
   if (
  !isDateInRange(
    order.tanggal,
    state.filters.dari,
    state.filters.sampai
  )
) {
  return false;
}

      /*
       * Kamar
       */
      if (
        state.filters.kamar &&
        String(
          order.kamar || ""
        ) !==
          state.filters.kamar
      ) {
        return false;
      }

      /*
       * Kelas
       */
      if (
        state.filters.kelas &&
        String(
          order.kelas || ""
        ) !==
          state.filters.kelas
      ) {
        return false;
      }

      /*
       * Nama
       */
      if (state.filters.nama) {

        const keyword =
          normalizeText(
            state.filters.nama
          );

        const nama =
          normalizeText(
            order.nama || ""
          );

        if (
          !nama.includes(keyword)
        ) {
          return false;
        }
      }

      return true;
    }
  );
}

/*
|--------------------------------------------------------------------------
| AMBIL ITEM MAKANAN
|--------------------------------------------------------------------------
*/

function getFoodItems() {
  const result = [];

  for (
    const order of getFilteredOrders()
  ) {

    for (
      const item of order.items || []
    ) {

      /*
       * Coba cari Master Menu
       * berdasarkan menuId / data menu.
       */
      const menu =
        findMasterFoodMenu(
          item
        );

      /*
       * Kalau Master Menu ditemukan,
       * pastikan memang kategori Makanan.
       */
      if (menu) {

        if (!isFoodMenu(menu)) {
          continue;
        }

        const nama =
          normalizeValue(
            menu.nama || ""
          );

        const varian =
          normalizeValue(
            menu.varian || ""
          );

        const jumlah =
          Number(item.jumlah) || 0;

        if (!nama) {
          continue;
        }

        if (jumlah <= 0) {
          continue;
        }

        result.push({
          nama,
          varian,
          jumlah
        });

        continue;
      }

      /*
       * FALLBACK DATA LAMA
       *
       * Kalau menuId tidak ditemukan
       * dan item masih menyimpan kategori
       * "Makanan", tetap masukkan.
       */
      const kategoriItem =
        normalizeText(
          item.kategori || ""
        );

      if (
        kategoriItem !==
        "makanan"
      ) {
        continue;
      }

      const namaLama =
        normalizeValue(
          item.namaMenu || ""
        );

      const varianLama =
        normalizeValue(
          item.varian || ""
        );

      const jumlahLama =
        Number(item.jumlah) || 0;

      if (!namaLama) {
        continue;
      }

      if (jumlahLama <= 0) {
        continue;
      }

      result.push({
        nama: namaLama,
        varian: varianLama,
        jumlah: jumlahLama
      });
    }
  }

  return result;
}

/*
|--------------------------------------------------------------------------
| NAMA MENU UNTUK REKAP
|--------------------------------------------------------------------------
|
| Jika Master Menu mempunyai:
|
| Nama  : Ayam Bakar
| Varian: Pedas
|
| maka label:
|
| Ayam Bakar — Pedas
|
| Jika tidak mempunyai varian:
|
| Ayam Bakar
|
*/

function getFoodDisplayName(item) {
  if (
    item.varian &&
    item.varian.trim()
  ) {
    return `${item.nama} — ${item.varian}`;
  }

  return item.nama;
}

/*
|--------------------------------------------------------------------------
| REKAP MAKANAN
|--------------------------------------------------------------------------
*/

function getKitchenReport() {
  const map = new Map();

  const items =
    getFoodItems();

  for (
    const item of items
  ) {

    const displayName =
      getFoodDisplayName(
        item
      );

    const key =
      normalizeText(
        displayName
      );

    if (!map.has(key)) {

      map.set(
        key,
        {
          nama: displayName,
          jumlah: 0
        }
      );
    }

    map.get(key).jumlah +=
      item.jumlah;
  }

  const rows =
    Array.from(
      map.values()
    ).sort(
      (a, b) =>
        a.nama.localeCompare(
          b.nama,
          "id"
        )
    );

  const total =
    rows.reduce(
      (sum, row) =>
        sum + row.jumlah,
      0
    );

  return {
    rows,
    total
  };
}

/*
|--------------------------------------------------------------------------
| FILTER UI
|--------------------------------------------------------------------------
*/

function renderFilters() {
  return `
    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div class="mb-4">

        <h2 class="font-bold text-slate-800">
          Filter Rekap Makanan
        </h2>

        <p class="mt-1 text-xs text-slate-500">
          Semua filter dapat digunakan bersamaan.
        </p>

      </div>


      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

        <label class="block">

  <span class="mb-1.5 block text-xs font-semibold text-slate-600">
    Dari
  </span>

  <input
    type="date"
    value="${escapeHtml(
      state.filters.dari
    )}"
    data-filter="dari"
    class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
  />

</label>


<label class="block">

  <span class="mb-1.5 block text-xs font-semibold text-slate-600">
    Sampai
  </span>

  <input
    type="date"
    value="${escapeHtml(
      state.filters.sampai
    )}"
    data-filter="sampai"
    class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
  />

</label>

        <label class="block">

          <span class="mb-1.5 block text-xs font-semibold text-slate-600">
            Kamar / Asrama
          </span>

          <select
            data-filter="kamar"
            class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >

            <option value="">
              Semua Kamar
            </option>

            ${state.rooms
              .filter(
                (room) =>
                  room.aktif !== false
              )
              .map(
                (room) => `
                  <option
                    value="${escapeHtml(
                      room.nama
                    )}"
                    ${
                      state.filters.kamar ===
                      room.nama
                        ? "selected"
                        : ""
                    }
                  >
                    ${escapeHtml(
                      room.nama
                    )}
                  </option>
                `
              )
              .join("")}

          </select>

        </label>


        <label class="block">

          <span class="mb-1.5 block text-xs font-semibold text-slate-600">
            Kelas
          </span>

          <select
            data-filter="kelas"
            class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >

            <option value="">
              Semua Kelas
            </option>

            ${state.classes
              .filter(
                (item) =>
                  item.aktif !== false
              )
              .map(
                (item) => `
                  <option
                    value="${escapeHtml(
                      item.nama
                    )}"
                    ${
                      state.filters.kelas ===
                      item.nama
                        ? "selected"
                        : ""
                    }
                  >
                    ${escapeHtml(
                      item.nama
                    )}
                  </option>
                `
              )
              .join("")}

          </select>

        </label>


        <label class="block">

          <span class="mb-1.5 block text-xs font-semibold text-slate-600">
            Nama Santri
          </span>

          <input
            type="search"
            value="${escapeHtml(
              state.filters.nama
            )}"
            data-filter="nama"
            placeholder="Cari nama..."
            class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />

        </label>

      </div>


      <div class="mt-4 flex flex-wrap gap-2">

        <button
          type="button"
          data-action="today"
          class="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Hari Ini
        </button>

        <button
          type="button"
          data-action="clear-filter"
          class="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
        >
          Reset Filter
        </button>

        <button
          type="button"
          data-action="refresh"
          class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >

          <span class="material-symbols-outlined text-[17px]">
            refresh
          </span>

          Refresh

        </button>

      </div>

    </section>
  `;
}

/*
|--------------------------------------------------------------------------
| HEADER REKAP
|--------------------------------------------------------------------------
*/

function renderHeader() {
  return `
    <div class="mb-6">

      <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
        Rekap Makanan
      </p>

      <div class="mt-1 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">

        <div>

          <h1 class="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
            Rekap Makanan
          </h1>

          <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Rekap jumlah seluruh makanan berdasarkan pesanan santri.
          </p>

        </div>


        <div class="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">

          <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Tanggal
          </p>

          <p class="mt-1 text-sm font-bold text-slate-800">
            ${escapeHtml(
              formatDateRange(
  state.filters.dari,
  state.filters.sampai
)
            )}
          </p>

        </div>

      </div>

    </div>
  `;
}

/*
|--------------------------------------------------------------------------
| STATISTIK
|--------------------------------------------------------------------------
*/

function renderStats(report) {
  return `
    <div class="grid gap-4 sm:grid-cols-2">

      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <p class="text-xs font-semibold text-slate-500">
          Total Jenis Makanan
        </p>

        <p class="mt-2 text-3xl font-black text-slate-900">
          ${report.rows.length}
        </p>

        <p class="mt-1 text-xs text-slate-400">
          menu
        </p>

      </div>


      <div class="rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-sm">

        <p class="text-xs font-semibold text-primary">
          Total Porsi Makanan
        </p>

        <p class="mt-2 text-3xl font-black text-slate-900">
          ${report.total}
        </p>

        <p class="mt-1 text-xs text-slate-400">
          porsi
        </p>

      </div>

    </div>
  `;
}

/*
|--------------------------------------------------------------------------
| TABEL
|--------------------------------------------------------------------------
*/

function renderTable(report) {
  return `
    <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      <div class="border-b border-slate-200 px-5 py-4">

        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <h2 class="font-bold text-slate-800">
              Rekap Makanan
            </h2>

            <p class="mt-1 text-xs text-slate-500">
              ${escapeHtml(
                formatDateRange(
  state.filters.dari,
  state.filters.sampai
)
              )}
            </p>

          </div>


          <button
            type="button"
            data-action="print"
            class="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >

            <span class="material-symbols-outlined text-[17px]">
              print
            </span>

            Cetak

          </button>

        </div>

      </div>


      ${
        report.rows.length
          ? `
            <div class="overflow-x-auto">

              <table class="w-full min-w-[500px] text-left">

                <thead class="bg-slate-50">

                  <tr>

                    <th class="w-20 px-5 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      No
                    </th>

                    <th class="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      Menu
                    </th>

                    <th class="w-40 px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      Jumlah
                    </th>

                  </tr>

                </thead>


                <tbody class="divide-y divide-slate-100">

                  ${report.rows
                    .map(
                      (row, index) => `
                        <tr class="hover:bg-slate-50">

                          <td class="px-5 py-4 text-center text-sm text-slate-400">
                            ${index + 1}
                          </td>

                          <td class="px-5 py-4 text-sm font-semibold text-slate-800">
                            ${escapeHtml(
                              row.nama
                            )}
                          </td>

                          <td class="px-5 py-4 text-right text-lg font-black text-slate-900">
                            ${row.jumlah}
                          </td>

                        </tr>
                      `
                    )
                    .join("")}

                </tbody>


                <tfoot class="border-t-2 border-slate-200 bg-slate-50">

                  <tr>

                    <td
                      colspan="2"
                      class="px-5 py-4 text-right text-sm font-black text-slate-700"
                    >
                      TOTAL
                    </td>

                    <td class="px-5 py-4 text-right text-lg font-black text-primary">
                      ${report.total}
                    </td>

                  </tr>

                </tfoot>

              </table>

            </div>
          `
          : `
            <div class="px-6 py-14 text-center">

              <span class="material-symbols-outlined text-5xl text-slate-300">
                restaurant
              </span>

              <p class="mt-3 text-sm font-semibold text-slate-600">
                Belum ada pesanan makanan
              </p>

              <p class="mt-1 text-xs text-slate-400">
                Tidak ada makanan untuk filter yang dipilih.
              </p>

            </div>
          `
      }

    </section>
  `;
}

/*
|--------------------------------------------------------------------------
| HASIL
|--------------------------------------------------------------------------
*/

function renderResults() {
  const root =
    getRoot();

  if (!root) {
    return;
  }

  const container =
    root.querySelector(
      "#kitchen-results"
    );

  if (!container) {
    return;
  }

  const report =
    getKitchenReport();

  container.innerHTML = `
    ${renderStats(report)}

    ${renderTable(report)}
  `;

  bindResultEvents();
}

/*
|--------------------------------------------------------------------------
| EVENT TABEL
|--------------------------------------------------------------------------
*/

function bindResultEvents() {
  const root =
    getRoot();

  if (!root) {
    return;
  }

  const printButton =
    root.querySelector(
      '[data-action="print"]'
    );

  if (printButton) {

    printButton.onclick =
      () => {
        window.print();
      };
  }
}

/*
|--------------------------------------------------------------------------
| EVENTS
|--------------------------------------------------------------------------
*/

function bindEvents() {
  const root =
    getRoot();

  if (!root) {
    return;
  }

  root
    .querySelectorAll(
      "[data-filter]"
    )
    .forEach(
      (element) => {

        const filterName =
          element.dataset.filter;

        element.onchange =
          () => {

            state.filters[
              filterName
            ] =
              element.value;

            renderResults();
          };

        /*
         * Nama tidak membuat seluruh
         * halaman dirender ulang.
         *
         * Ini mencegah cursor/fokus
         * hilang setiap mengetik huruf.
         */
        if (
          filterName === "nama"
        ) {

          element.oninput =
            () => {

              state.filters.nama =
                element.value;

              renderResults();
            };
        }
      }
    );


  const todayButton =
    root.querySelector(
      '[data-action="today"]'
    );

  if (todayButton) {

    todayButton.onclick =
      () => {

        const today =
  getTodayDate();

state.filters.dari =
  today;

state.filters.sampai =
  today;

        render();
      };
  }


  const clearButton =
    root.querySelector(
      '[data-action="clear-filter"]'
    );

  if (clearButton) {

    clearButton.onclick =
      () => {

        state.filters = {
  dari: "",
  sampai: "",
  kamar: "",
  kelas: "",
  nama: ""
};

        render();
      };
  }


  const refreshButton =
    root.querySelector(
      '[data-action="refresh"]'
    );

  if (refreshButton) {

    refreshButton.onclick =
      async () => {
        await loadData();
      };
  }

  bindResultEvents();
}

/*
|--------------------------------------------------------------------------
| RENDER UTAMA
|--------------------------------------------------------------------------
*/

function render() {
  const root =
    getRoot();

  if (!root) {
    return;
  }

  if (state.loading) {

    root.innerHTML = `
      <div class="min-h-full bg-slate-50 p-4 md:p-6 lg:p-8">

        <div class="mx-auto max-w-6xl">

          <div class="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">

            <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-primary"></div>

            <p class="mt-3 text-sm text-slate-500">
              Memuat Rekap Makanan...
            </p>

          </div>

        </div>

      </div>
    `;

    return;
  }

  const report =
    getKitchenReport();

  root.innerHTML = `
    <div class="min-h-full bg-slate-50 p-4 md:p-6 lg:p-8">

      <div class="mx-auto max-w-6xl">

        ${renderHeader()}

        <div class="space-y-5">

          ${renderFilters()}

          <div
            id="kitchen-results"
            class="space-y-5"
          >

            ${renderStats(report)}

            ${renderTable(report)}

          </div>

        </div>

      </div>

    </div>
  `;

  bindEvents();
}

/*
|--------------------------------------------------------------------------
| LOAD DATA
|--------------------------------------------------------------------------
*/

async function loadData() {
  state.loading = true;

  render();

  try {

    const [
      orders,
      menus,
      classes,
      rooms
    ] = await Promise.all([
      getOrders(),
      getMenus(),
      getClasses(),
      getRooms()
    ]);

    state.orders =
      Array.isArray(orders)
        ? orders
        : [];

    state.menus =
      Array.isArray(menus)
        ? menus
        : [];

    state.classes =
      Array.isArray(classes)
        ? classes
        : [];

    state.rooms =
      Array.isArray(rooms)
        ? rooms
        : [];

    console.log(
      "Rekap Makanan:",
      {
        jumlahOrders:
          state.orders.length,

        jumlahMenus:
          state.menus.length,

        jumlahMenuMakanan:
          getFoodMenus().length,

        report:
          getKitchenReport()
      }
    );

  } catch (error) {

    console.error(
      "Gagal memuat Rekap Makanan:",
      error
    );

    const root =
      getRoot();

    if (root) {

      root.innerHTML = `
        <div class="p-6">

          <div class="rounded-2xl border border-red-200 bg-red-50 p-5">

            <h2 class="font-bold text-red-800">
              Gagal memuat Rekap Makanan
            </h2>

            <p class="mt-2 text-sm text-red-700">
              ${escapeHtml(
                error.message
              )}
            </p>

          </div>

        </div>
      `;
    }

    return;

  } finally {

    state.loading = false;

    render();
  }
}

/*
|--------------------------------------------------------------------------
| ROUTE
|--------------------------------------------------------------------------
*/

export async function renderKitchen() {
  renderLayout({ pageTitle: "Rekap Makanan", pageSubtitle: "Rekap jumlah seluruh makanan berdasarkan pesanan santri." });


  state.filters = {
  ...createDateRange(),
  kamar: "",
  kelas: "",
  nama: ""
};

  await loadData();
}