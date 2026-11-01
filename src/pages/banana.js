import { renderLayout } from "../components/layout.js";
import { getOrders } from "../services/orders.service.js";
import { getMenus } from "../services/menus.service.js";
import { getClasses } from "../services/classes.service.js";
import { getRooms } from "../services/rooms.service.js";

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
    dari: getTodayDate(),
    sampai: getTodayDate(),
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

function getTodayDate() {
  const now = new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      now.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

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
    .replace(/[×x]/g, " ")
    .replace(/\+/g, " + ")
    .replace(/[^\p{L}\p{N}\s+]/gu, " ")
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

function formatDateRange(
  dari,
  sampai
) {
  if (!dari && !sampai) {
    return "Semua tanggal";
  }

  if (
    dari &&
    sampai &&
    dari === sampai
  ) {
    return formatDate(dari);
  }

  if (dari && sampai) {
    return `${formatDate(dari)} - ${formatDate(sampai)}`;
  }

  if (dari) {
    return `Mulai ${formatDate(dari)}`;
  }

  return `Sampai ${formatDate(sampai)}`;
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
| UKURAN
|--------------------------------------------------------------------------
*/

function normalizeSize(value = "") {
  const text = normalizeText(value);

  if (
    text.includes("jumbo") ||
    text.includes("jmb")
  ) {
    return "Jumbo";
  }

  if (
    text.includes("reguler") ||
    text.includes("regular") ||
    text.includes("reg")
  ) {
    return "Reguler";
  }

  return "";
}

/*
|--------------------------------------------------------------------------
| MASTER MENU
|--------------------------------------------------------------------------
*/

function isBananaMenu(menu) {
  if (!menu) {
    return false;
  }

  const kategori = normalizeText(
    menu.kategori || ""
  );

  const nama = normalizeText(
    menu.nama || ""
  );

  return (
    kategori === "pisang keju" ||
    kategori.includes("pisang keju") ||
    nama === "pisang keju" ||
    nama.includes("pisang keju")
  );
}

function normalizeVariation(
  value = ""
) {
  return String(value)
    .replace(/\s+/g, " ")
    .replace(/\s*\+\s*/g, " + ")
    .trim();
}

/*
|--------------------------------------------------------------------------
| URUTAN VARIASI
|--------------------------------------------------------------------------
*/

const FLAVOR_ORDER = [
  "keju",
  "coklat",
  "tiramisu",
  "stroberi",
  "greentea"
];

function getFlavorRank(flavor) {
  const normalized =
    normalizeText(flavor);

  const index =
    FLAVOR_ORDER.indexOf(
      normalized
    );

  if (index !== -1) {
    return index;
  }

  return 99;
}

function getVariationSortKey(
  variation
) {
  const parts =
    normalizeText(variation)
      .split(" + ")
      .map(
        (part) => part.trim()
      )
      .filter(Boolean);

  const ranks =
    parts.map(
      getFlavorRank
    );

  const firstRank =
    ranks.length > 0
      ? ranks[0]
      : 99;

  const secondRank =
    ranks.length > 1
      ? ranks[1]
      : -1;

  const combination =
    parts.length > 1
      ? 1
      : 0;

  return [
    firstRank,
    combination,
    secondRank,
    normalizeText(variation)
  ];
}

function compareVariations(
  a,
  b
) {
  const keyA =
    getVariationSortKey(a);

  const keyB =
    getVariationSortKey(b);

  for (
    let i = 0;
    i < keyA.length;
    i++
  ) {
    if (
      keyA[i] <
      keyB[i]
    ) {
      return -1;
    }

    if (
      keyA[i] >
      keyB[i]
    ) {
      return 1;
    }
  }

  return 0;
}

/*
|--------------------------------------------------------------------------
| VARIASI DARI MASTER MENU
|--------------------------------------------------------------------------
*/

function getBananaVariations() {
  const variationMap =
    new Map();

  for (
    const menu of state.menus
  ) {
    if (
      menu.aktif === false
    ) {
      continue;
    }

    if (
      !isBananaMenu(menu)
    ) {
      continue;
    }

    const variation =
      normalizeVariation(
        menu.varian || ""
      );

    if (!variation) {
      continue;
    }

    const key =
      normalizeText(
        variation
      );

    if (
      !variationMap.has(key)
    ) {
      variationMap.set(
        key,
        variation
      );
    }
  }

  return Array.from(
    variationMap.values()
  ).sort(
    compareVariations
  );
}

/*
|--------------------------------------------------------------------------
| MENCARI MASTER MENU UNTUK ITEM PESANAN
|--------------------------------------------------------------------------
*/

function findMasterMenu(item) {
  if (!item) {
    return null;
  }

  /*
   * 1. menuId
   */
  if (item.menuId) {
    const byId =
      state.menus.find(
        (menu) =>
          menu.id === item.menuId
      );

    if (byId) {
      return byId;
    }
  }

  const itemName =
    normalizeText(
      item.namaMenu || ""
    );

  const itemVariant =
    normalizeVariation(
      item.varian || ""
    );

  const itemSize =
    normalizeSize(
      item.ukuran || ""
    );

  /*
   * 2. Nama + varian + ukuran
   */
  let result =
    state.menus.find(
      (menu) => {

        if (
          !isBananaMenu(menu)
        ) {
          return false;
        }

        const menuName =
          normalizeText(
            menu.nama || ""
          );

        const menuVariant =
          normalizeVariation(
            menu.varian || ""
          );

        const menuSize =
          normalizeSize(
            menu.ukuran || ""
          );

        return (
          menuName === itemName &&
          normalizeText(
            menuVariant
          ) ===
            normalizeText(
              itemVariant
            ) &&
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

        if (
          !isBananaMenu(menu)
        ) {
          return false;
        }

        const menuName =
          normalizeText(
            menu.nama || ""
          );

        const menuVariant =
          normalizeVariation(
            menu.varian || ""
          );

        return (
          menuName === itemName &&
          normalizeText(
            menuVariant
          ) ===
            normalizeText(
              itemVariant
            )
        );
      }
    );

  if (result) {
    return result;
  }

  /*
   * 4. Varian + ukuran
   */
  if (itemVariant) {
    result =
      state.menus.find(
        (menu) => {

          if (
            !isBananaMenu(menu)
          ) {
            return false;
          }

          const menuVariant =
            normalizeVariation(
              menu.varian || ""
            );

          const menuSize =
            normalizeSize(
              menu.ukuran || ""
            );

          return (
            normalizeText(
              menuVariant
            ) ===
              normalizeText(
                itemVariant
              ) &&
            (
              !itemSize ||
              menuSize === itemSize
            )
          );
        }
      );

    if (result) {
      return result;
    }
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
       * FILTER DARI
       */
      if (
        state.filters.dari &&
        order.tanggal <
          state.filters.dari
      ) {
        return false;
      }

      /*
       * FILTER SAMPAI
       */
      if (
        state.filters.sampai &&
        order.tanggal >
          state.filters.sampai
      ) {
        return false;
      }

      /*
       * FILTER KAMAR
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
       * FILTER KELAS
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
       * FILTER NAMA
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
          !nama.includes(
            keyword
          )
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
| AMBIL ITEM PISANG KEJU
|--------------------------------------------------------------------------
*/

function getBananaItems() {
  const bananaItems = [];

  const filteredOrders =
    getFilteredOrders();

  for (
    const order of filteredOrders
  ) {

    for (
      const item of order.items || []
    ) {

      const menu =
        findMasterMenu(item);

      if (!menu) {
        continue;
      }

      if (
        !isBananaMenu(menu)
      ) {
        continue;
      }

      const variasi =
        normalizeVariation(
          menu.varian || ""
        );

      const ukuran =
        normalizeSize(
          menu.ukuran || ""
        );

      const jumlah =
        Number(item.jumlah) || 0;

      if (!variasi) {
        continue;
      }

      if (
        ukuran !== "Reguler" &&
        ukuran !== "Jumbo"
      ) {
        continue;
      }

      if (jumlah <= 0) {
        continue;
      }

      bananaItems.push({
        order,
        item,
        menu,
        variasi,
        ukuran,
        jumlah
      });
    }
  }

  return bananaItems;
}

/*
|--------------------------------------------------------------------------
| HITUNG REKAP
|--------------------------------------------------------------------------
*/

function getBananaReport() {
  const variations =
    getBananaVariations();

  const rows =
    variations.map(
      (variasi) => ({
        variasi,
        Reguler: 0,
        Jumbo: 0
      })
    );

  const rowMap =
    new Map(
      rows.map(
        (row) => [
          normalizeText(
            row.variasi
          ),
          row
        ]
      )
    );

  const bananaItems =
    getBananaItems();

  for (
    const item of bananaItems
  ) {

    const key =
      normalizeText(
        item.variasi
      );

    const row =
      rowMap.get(key);

    if (!row) {
      continue;
    }

    if (
      item.ukuran ===
      "Reguler"
    ) {
      row.Reguler +=
        item.jumlah;
    }

    if (
      item.ukuran ===
      "Jumbo"
    ) {
      row.Jumbo +=
        item.jumlah;
    }
  }

  const totalReguler =
    rows.reduce(
      (sum, row) =>
        sum + row.Reguler,
      0
    );

  const totalJumbo =
    rows.reduce(
      (sum, row) =>
        sum + row.Jumbo,
      0
    );

  return {
    rows,
    totalReguler,
    totalJumbo
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
          Filter Rekap Pisang Keju
        </h2>

        <p class="mt-1 text-xs text-slate-500">
          Semua filter dapat digunakan bersamaan.
        </p>

      </div>


      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">

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
| STATISTIK
|--------------------------------------------------------------------------
*/

function renderStats(report) {
  return `
    <div class="grid gap-4 sm:grid-cols-2">

      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <p class="text-xs font-semibold text-slate-500">
          Total Reguler
        </p>

        <p class="mt-2 text-3xl font-black text-slate-900">
          ${report.totalReguler}
        </p>

        <p class="mt-1 text-xs text-slate-400">
          porsi
        </p>

      </div>


      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <p class="text-xs font-semibold text-slate-500">
          Total Jumbo
        </p>

        <p class="mt-2 text-3xl font-black text-slate-900">
          ${report.totalJumbo}
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
| TABEL REGULER
|--------------------------------------------------------------------------
*/

function renderRegularTable(report) {
  return `
    <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      <div class="border-b border-slate-200 px-5 py-4">

        <h2 class="font-bold text-slate-800">
          Pisang Keju — Reguler
        </h2>

        <p class="mt-1 text-xs text-slate-500">
          Jumlah pesanan ukuran reguler.
        </p>

      </div>


      <div class="overflow-x-auto">

        <table class="w-full min-w-[500px] text-left">

          <thead class="bg-slate-50">

            <tr>

              <th class="w-16 px-5 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">
                No
              </th>

              <th class="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Variasi
              </th>

              <th class="w-40 px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Reguler
              </th>

            </tr>

          </thead>


          <tbody class="divide-y divide-slate-100">

            ${
              report.rows.length
                ? report.rows
                    .map(
                      (row, index) => `
                        <tr class="hover:bg-slate-50">

                          <td class="px-5 py-4 text-center text-sm text-slate-400">
                            ${index + 1}
                          </td>

                          <td class="px-5 py-4 font-semibold text-slate-800">
                            ${escapeHtml(
                              row.variasi
                            )}
                          </td>

                          <td class="px-5 py-4 text-right text-lg font-black text-slate-900">
                            ${row.Reguler || 0}
                          </td>

                        </tr>
                      `
                    )
                    .join("")
                : `
                    <tr>

                      <td
                        colspan="3"
                        class="px-5 py-10 text-center text-sm text-slate-400"
                      >
                        Belum ada variasi Pisang Keju di Master Menu.
                      </td>

                    </tr>
                  `
            }

          </tbody>

        </table>

      </div>

    </section>
  `;
}

/*
|--------------------------------------------------------------------------
| TABEL JUMBO
|--------------------------------------------------------------------------
*/

function renderJumboTable(report) {
  return `
    <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      <div class="border-b border-slate-200 px-5 py-4">

        <h2 class="font-bold text-slate-800">
          Pisang Keju — Jumbo
        </h2>

        <p class="mt-1 text-xs text-slate-500">
          Jumlah pesanan ukuran jumbo.
        </p>

      </div>


      <div class="overflow-x-auto">

        <table class="w-full min-w-[500px] text-left">

          <thead class="bg-slate-50">

            <tr>

              <th class="w-16 px-5 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">
                No
              </th>

              <th class="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Variasi
              </th>

              <th class="w-40 px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Jumbo
              </th>

            </tr>

          </thead>


          <tbody class="divide-y divide-slate-100">

            ${
              report.rows.length
                ? report.rows
                    .map(
                      (row, index) => `
                        <tr class="hover:bg-slate-50">

                          <td class="px-5 py-4 text-center text-sm text-slate-400">
                            ${index + 1}
                          </td>

                          <td class="px-5 py-4 font-semibold text-slate-800">
                            ${escapeHtml(
                              row.variasi
                            )}
                          </td>

                          <td class="px-5 py-4 text-right text-lg font-black text-slate-900">
                            ${row.Jumbo || 0}
                          </td>

                        </tr>
                      `
                    )
                    .join("")
                : `
                    <tr>

                      <td
                        colspan="3"
                        class="px-5 py-10 text-center text-sm text-slate-400"
                      >
                        Belum ada variasi Pisang Keju di Master Menu.
                      </td>

                    </tr>
                  `
            }

          </tbody>

        </table>

      </div>

    </section>
  `;
}

/*
|--------------------------------------------------------------------------
| HASIL
|--------------------------------------------------------------------------
*/

function renderResults() {
  const root = getRoot();

  if (!root) {
    return;
  }

  const container =
    root.querySelector(
      "#banana-results"
    );

  if (!container) {
    return;
  }

  const report =
    getBananaReport();

  container.innerHTML = `
    ${renderStats(report)}

    ${renderRegularTable(
      report
    )}

    ${renderJumboTable(
      report
    )}
  `;

  bindResultEvents();
}

/*
|--------------------------------------------------------------------------
| EVENT HASIL
|--------------------------------------------------------------------------
*/

function bindResultEvents() {
  const root = getRoot();

  if (!root) {
    return;
  }

  const printButton =
    root.querySelector(
      '[data-action="print"]'
    );

  if (printButton) {
    printButton.onclick = () => {
      window.print();
    };
  }
}

/*
|--------------------------------------------------------------------------
| EVENT FILTER
|--------------------------------------------------------------------------
*/

function bindEvents() {
  const root = getRoot();

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

        element.onchange = () => {

          const value =
            element.value;

          /*
           * Validasi rentang tanggal.
           */
          if (
            filterName === "dari" ||
            filterName === "sampai"
          ) {

            const dari =
              filterName === "dari"
                ? value
                : state.filters.dari;

            const sampai =
              filterName === "sampai"
                ? value
                : state.filters.sampai;

            /*
             * Kalau kedua tanggal terisi
             * dan Dari > Sampai,
             * jangan menerapkan filter.
             */
            if (
              dari &&
              sampai &&
              dari > sampai
            ) {

              window.alert(
                "Tanggal Dari tidak boleh lebih besar dari tanggal Sampai."
              );

              element.value =
                state.filters[
                  filterName
                ];

              return;
            }
          }

          state.filters[
            filterName
          ] = value;

          renderResults();
        };


        /*
         * Nama menggunakan oninput
         * supaya cursor tidak hilang.
         */
        if (
          filterName === "nama"
        ) {

          element.oninput = () => {

            state.filters.nama =
              element.value;

            renderResults();
          };
        }
      }
    );


  /*
   * Hari ini
   */
  const todayButton =
    root.querySelector(
      '[data-action="today"]'
    );

  if (todayButton) {

    todayButton.onclick = () => {

      const today =
        getTodayDate();

      state.filters.dari =
        today;

      state.filters.sampai =
        today;

      render();
    };
  }


  /*
   * Reset Filter
   */
  const clearButton =
    root.querySelector(
      '[data-action="clear-filter"]'
    );

  if (clearButton) {

    clearButton.onclick = () => {

      const today =
        getTodayDate();

      state.filters = {
        dari: today,
        sampai: today,
        kamar: "",
        kelas: "",
        nama: ""
      };

      render();
    };
  }


  /*
   * Refresh
   */
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
  const root = getRoot();

  if (!root) {
    return;
  }

  const report =
    getBananaReport();

  root.innerHTML = `
    <div class="min-h-full bg-slate-50 p-4 md:p-6 lg:p-8">

      <div class="mx-auto max-w-6xl">

        <div class="mb-6">

          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Rekap Pisang Keju
          </p>


          <div class="mt-1 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <h1 class="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
                Rekap Pisang Keju
              </h1>

              <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Rekap variasi Pisang Keju berdasarkan ukuran Reguler dan Jumbo.
              </p>

            </div>


            <div class="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">

              <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Periode
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


        ${
          state.loading
            ? `
              <div class="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">

                <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-primary"></div>

                <p class="mt-3 text-sm text-slate-500">
                  Memuat Rekap Pisang Keju...
                </p>

              </div>
            `
            : `
              <div class="space-y-5">

                ${renderFilters()}


                <div
                  id="banana-results"
                  class="space-y-5"
                >

                  ${renderStats(
                    report
                  )}

                  ${renderRegularTable(
                    report
                  )}

                  ${renderJumboTable(
                    report
                  )}

                </div>

              </div>
            `
        }

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
      "Rekap Pisang Keju:",
      {
        jumlahOrders:
          state.orders.length,

        jumlahMenus:
          state.menus.length,

        jumlahMenuPisangKeju:
          state.menus.filter(
            isBananaMenu
          ).length,

        variasi:
          getBananaVariations()
      }
    );

  } catch (error) {

    console.error(
      "Gagal memuat Rekap Pisang Keju:",
      error
    );

    const root =
      getRoot();

    if (root) {

      root.innerHTML = `
        <div class="p-6">

          <div class="rounded-2xl border border-red-200 bg-red-50 p-5">

            <h2 class="font-bold text-red-800">
              Gagal memuat Rekap Pisang Keju
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

export async function renderBanana() {
  renderLayout({ pageTitle: "Rekap Pisang Keju", pageSubtitle: "Rekap pesanan pisang keju." });


  const today =
    getTodayDate();

  state.filters = {
    dari: today,
    sampai: today,
    kamar: "",
    kelas: "",
    nama: ""
  };

  await loadData();
}