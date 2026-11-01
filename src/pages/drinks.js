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
| IDENTIFIKASI MASTER MENU MINUMAN
|--------------------------------------------------------------------------
*/

function isDrinkMenu(menu) {
  if (!menu) {
    return false;
  }

  const kategori =
    normalizeText(
      menu.kategori || ""
    );

  return (
    kategori === "minuman" ||
    kategori.includes("minuman")
  );
}

/*
|--------------------------------------------------------------------------
| MASTER MENU MINUMAN
|--------------------------------------------------------------------------
*/

function getDrinkMenus() {
  return state.menus.filter(
    (menu) =>
      menu.aktif !== false &&
      isDrinkMenu(menu)
  );
}

/*
|--------------------------------------------------------------------------
| CARI MASTER MENU DARI ITEM PESANAN
|--------------------------------------------------------------------------
*/

function findMasterDrinkMenu(item) {
  if (!item) {
    return null;
  }

  /*
   * Prioritas pertama:
   * menuId.
   */
  if (item.menuId) {
    const menuById =
      state.menus.find(
        (menu) =>
          menu.id === item.menuId
      );

    if (
      menuById &&
      isDrinkMenu(menuById)
    ) {
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
   * Fallback:
   * nama + varian + ukuran
   */
  let result =
    state.menus.find(
      (menu) => {

        if (!isDrinkMenu(menu)) {
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
   * Fallback:
   * nama + varian
   */
  result =
    state.menus.find(
      (menu) => {

        if (!isDrinkMenu(menu)) {
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
   * Fallback:
   * nama saja.
   *
   * Hanya digunakan jika item
   * tidak mempunyai varian.
   */
  if (!itemVariant) {
    result =
      state.menus.find(
        (menu) => {

          if (!isDrinkMenu(menu)) {
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
| AMBIL ITEM MINUMAN
|--------------------------------------------------------------------------
*/

function getDrinkItems() {
  const result = [];

  for (
    const order of getFilteredOrders()
  ) {

    for (
      const item of order.items || []
    ) {

      const menu =
        findMasterDrinkMenu(
          item
        );

      if (!menu) {
        continue;
      }

      if (!isDrinkMenu(menu)) {
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

      const ukuran =
        normalizeValue(
          menu.ukuran || ""
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
        order,
        item,
        menu,
        nama,
        varian,
        ukuran,
        jumlah
      });
    }
  }

  return result;
}

/*
|--------------------------------------------------------------------------
| DAFTAR JENIS MINUMAN
|--------------------------------------------------------------------------
*/

function getDrinkTypes() {
  const map = new Map();

  for (
    const menu of getDrinkMenus()
  ) {

    const nama =
      normalizeValue(
        menu.nama || ""
      );

    if (!nama) {
      continue;
    }

    const key =
      normalizeText(nama);

    if (!map.has(key)) {
      map.set(
        key,
        nama
      );
    }
  }

  return Array.from(
    map.values()
  );
}

/*
|--------------------------------------------------------------------------
| DAFTAR VARIASI
|--------------------------------------------------------------------------
*/

function getDrinkVariants() {
  const map = new Map();

  for (
    const menu of getDrinkMenus()
  ) {

    const varian =
      normalizeValue(
        menu.varian || ""
      );

    /*
     * Menu tanpa varian tidak
     * dimasukkan sebagai kolom.
     */
    if (!varian) {
      continue;
    }

    const key =
      normalizeText(varian);

    if (!map.has(key)) {
      map.set(
        key,
        varian
      );
    }
  }

  /*
   * Urutan utama.
   *
   * Original -> Boba -> Cincau
   *
   * Variasi lain dari Master Menu
   * tetap otomatis ditambahkan
   * setelah variasi utama.
   */
  const preferredOrder = [
    "original",
    "ori",
    "boba",
    "cincau"
  ];

  return Array.from(
    map.values()
  ).sort(
    (a, b) => {

      const aKey =
        normalizeText(a);

      const bKey =
        normalizeText(b);

      const aIndex =
        preferredOrder.indexOf(
          aKey
        );

      const bIndex =
        preferredOrder.indexOf(
          bKey
        );

      if (
        aIndex !== -1 &&
        bIndex !== -1
      ) {
        return aIndex - bIndex;
      }

      if (aIndex !== -1) {
        return -1;
      }

      if (bIndex !== -1) {
        return 1;
      }

      return a.localeCompare(
        b,
        "id"
      );
    }
  );
}

/*
|--------------------------------------------------------------------------
| REKAP
|--------------------------------------------------------------------------
*/

function getDrinkReport() {
  const drinkTypes =
    getDrinkTypes();

  const variants =
    getDrinkVariants();

  const rows =
    drinkTypes.map(
      (nama) => {

        const row = {
          nama,
          total: 0
        };

        for (
          const variant of variants
        ) {

          row[
            normalizeText(
              variant
            )
          ] = 0;
        }

        return row;
      }
    );

  const rowMap =
    new Map(
      rows.map(
        (row) => [
          normalizeText(
            row.nama
          ),
          row
        ]
      )
    );

  const items =
    getDrinkItems();

  for (
    const item of items
  ) {

    const row =
      rowMap.get(
        normalizeText(
          item.nama
        )
      );

    if (!row) {
      continue;
    }

    /*
     * Jika mempunyai varian,
     * masukkan ke kolom varian.
     */
    if (item.varian) {

      const variantKey =
        normalizeText(
          item.varian
        );

      /*
       * Jika varian belum ada di
       * daftar kolom, buat otomatis.
       */
      if (
        !Object.prototype.hasOwnProperty.call(
          row,
          variantKey
        )
      ) {
        row[variantKey] = 0;
      }

      row[variantKey] +=
        item.jumlah;

      row.total +=
        item.jumlah;

      continue;
    }

    /*
     * Menu tanpa varian.
     *
     * Contoh:
     * Teh
     * Teh Jumbo
     */
    row.total +=
      item.jumlah;
  }

  const total =
    rows.reduce(
      (sum, row) =>
        sum + row.total,
      0
    );

  return {
    rows,
    variants,
    total
  };
}

/*
|--------------------------------------------------------------------------
| FILTER
|--------------------------------------------------------------------------
*/

function renderFilters() {
  return `
    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div class="mb-4">

        <h2 class="font-bold text-slate-800">
          Filter Rekap Minuman
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
    <div class="grid gap-4">

      <div class="rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-sm">

        <p class="text-xs font-semibold text-primary">
          Total Minuman
        </p>

        <p class="mt-2 text-3xl font-black text-slate-900">
          ${report.total}
        </p>

        <p class="mt-1 text-xs text-slate-400">
          semua jenis minuman
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

  if (!report.rows.length) {
    return `
      <section class="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">

        <p class="font-semibold text-slate-700">
          Belum ada menu minuman di Master Menu.
        </p>

        <p class="mt-1 text-xs text-slate-500">
          Tambahkan menu dengan kategori Minuman terlebih dahulu.
        </p>

      </section>
    `;
  }

  const hasVariants =
    report.variants.length > 0;

  return `
    <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      <div class="border-b border-slate-200 px-5 py-4">

        <h2 class="font-bold text-slate-800">
          Rekap Minuman
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


      <div class="overflow-x-auto">

        <table class="w-full min-w-[700px] text-left">

          <thead class="bg-slate-50">

            <tr>

              <th class="w-16 px-5 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">
                No
              </th>

              <th class="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Minuman
              </th>

              ${
                hasVariants
                  ? report.variants
                      .map(
                        (variant) => `
                          <th class="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-500">
                            ${escapeHtml(
                              variant
                            )}
                          </th>
                        `
                      )
                      .join("")
                  : ""
              }

              <th class="w-32 px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Total
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

                    <td class="px-5 py-4 font-semibold text-slate-800">
                      ${escapeHtml(
                        row.nama
                      )}
                    </td>

                    ${
                      hasVariants
                        ? report.variants
                            .map(
                              (variant) => `
                                <td class="px-5 py-4 text-right text-lg font-black text-slate-900">
                                  ${
                                    row[
                                      normalizeText(
                                        variant
                                      )
                                    ] || 0
                                  }
                                </td>
                              `
                            )
                            .join("")
                        : ""
                    }

                    <td class="px-5 py-4 text-right text-lg font-black text-primary">
                      ${row.total || 0}
                    </td>

                  </tr>
                `
              )
              .join("")}

          </tbody>


          <tfoot class="border-t-2 border-slate-200 bg-slate-50">

            <tr>

              <td
                colspan="${
                  2 +
                  (hasVariants
                    ? report.variants.length
                    : 0)
                }"
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
      "#drinks-results"
    );

  if (!container) {
    return;
  }

  const report =
    getDrinkReport();

  container.innerHTML = `
    ${renderStats(report)}

    ${renderTable(report)}
  `;
}

/*
|--------------------------------------------------------------------------
| EVENTS
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
         * agar cursor tidak hilang.
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
   * Hari Ini
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
}

/*
|--------------------------------------------------------------------------
| RENDER
|--------------------------------------------------------------------------
*/

function render() {
  const root = getRoot();

  if (!root) {
    return;
  }

  const report =
    getDrinkReport();

  root.innerHTML = `
    <div class="min-h-full bg-slate-50 p-4 md:p-6 lg:p-8">

      <div class="mx-auto max-w-6xl">

        <div class="mb-6">

          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Rekap Minuman
          </p>

          <div class="mt-1 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <h1 class="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
                Rekap Minuman
              </h1>

              <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Rekap otomatis berdasarkan Master Menu dan variasi minuman.
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
                  Memuat Rekap Minuman...
                </p>

              </div>
            `
            : `
              <div class="space-y-5">

                ${renderFilters()}

                <div
                  id="drinks-results"
                  class="space-y-5"
                >

                  ${renderStats(
                    report
                  )}

                  ${renderTable(
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
      "Rekap Minuman:",
      {
        jumlahOrders:
          state.orders.length,

        jumlahMenus:
          state.menus.length,

        jumlahMenuMinuman:
          getDrinkMenus().length,

        jenisMinuman:
          getDrinkTypes(),

        variasi:
          getDrinkVariants()
      }
    );

  } catch (error) {

    console.error(
      "Gagal memuat Rekap Minuman:",
      error
    );

    const root =
      getRoot();

    if (root) {

      root.innerHTML = `
        <div class="p-6">

          <div class="rounded-2xl border border-red-200 bg-red-50 p-5">

            <h2 class="font-bold text-red-800">
              Gagal memuat Rekap Minuman
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

export async function renderDrinks() {
  renderLayout({ pageTitle: "Rekap Minuman", pageSubtitle: "Rekap seluruh pesanan minuman." });


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