import {
  getOrders,
  updateItemDistributionStatus
} from "../services/orders.service.js";
import { getClasses } from "../services/classes.service.js";
import { getRooms } from "../services/rooms.service.js";
import { renderLayout } from "../components/layout.js";

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

function formatDate(dateString) {
  if (!dateString) return "-";

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
| FILTER
|--------------------------------------------------------------------------
*/

function getFilteredOrders() {
  return state.orders
    .filter((order) => {

      if (
        !isDateInRange(
          order.tanggal,
          state.filters.dari,
          state.filters.sampai
        )
      ) {
        return false;
      }

      if (
        state.filters.kamar &&
        normalizeText(order.kamar) !==
          normalizeText(state.filters.kamar)
      ) {
        return false;
      }

      if (
        state.filters.kelas &&
        normalizeText(order.kelas) !==
          normalizeText(state.filters.kelas)
      ) {
        return false;
      }

      if (state.filters.nama) {

        const keyword =
          normalizeText(
            state.filters.nama
          );

        const nama =
          normalizeText(
            order.nama || ""
          );

        if (!nama.includes(keyword)) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {

      const kamarCompare =
        normalizeText(
          a.kamar || ""
        ).localeCompare(
          normalizeText(
            b.kamar || ""
          ),
          "id"
        );

      if (kamarCompare !== 0) {
        return kamarCompare;
      }

      return normalizeText(
        a.nama || ""
      ).localeCompare(
        normalizeText(
          b.nama || ""
        ),
        "id"
      );
    });
}

/*
|--------------------------------------------------------------------------
| PESANAN
|--------------------------------------------------------------------------
*/

function formatItem(item) {

  const nama =
    String(
      item.namaMenu || "-"
    ).trim();

  const varian =
    String(
      item.varian || ""
    ).trim();

  const ukuran =
    String(
      item.ukuran || ""
    ).trim();

  const jumlah =
    Number(item.jumlah) || 0;

  let label = nama;

  if (varian) {
    label += ` — ${varian}`;
  }

  if (ukuran) {
    label += ` — ${ukuran}`;
  }

  return `${label} × ${jumlah}`;
}

function getOrderItemsText(order) {
  const items =
    Array.isArray(order.items)
      ? order.items
      : [];

  if (!items.length) {
    return "-";
  }

  return items
    .map(formatItem)
    .join("\n");
}

/*
|--------------------------------------------------------------------------
| GROUP BY KAMAR
|--------------------------------------------------------------------------
*/

function getGroupedOrders() {

  const orders =
    getFilteredOrders();

  const groups =
    new Map();

  for (const order of orders) {

    const kamar =
      String(
        order.kamar || "Tanpa Kamar"
      ).trim();

    const key =
      normalizeText(kamar);

    if (!groups.has(key)) {

      groups.set(
        key,
        {
          kamar,
          orders: []
        }
      );
    }

    groups
      .get(key)
      .orders
      .push(order);
  }

  return Array.from(
    groups.values()
  );
}

/*
|--------------------------------------------------------------------------
| FILTER UI
|--------------------------------------------------------------------------
*/

function renderFilters() {

  return `
    <section class="no-print rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div class="mb-4">

        <h2 class="font-bold text-slate-800">
          Filter Rekap Pembagian
        </h2>

        <p class="mt-1 text-xs text-slate-500">
          Gunakan rentang tanggal dan filter lainnya secara bersamaan.
        </p>

      </div>


      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">

        <label class="block">

          <span class="mb-1.5 block text-xs font-semibold text-slate-600">
            Dari
          </span>

          <input
            type="date"
            data-filter="dari"
            value="${escapeHtml(
              state.filters.dari
            )}"
            class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />

        </label>


        <label class="block">

          <span class="mb-1.5 block text-xs font-semibold text-slate-600">
            Sampai
          </span>

          <input
            type="date"
            data-filter="sampai"
            value="${escapeHtml(
              state.filters.sampai
            )}"
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
            data-filter="nama"
            value="${escapeHtml(
              state.filters.nama
            )}"
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
          data-action="reset"
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

        <button
          type="button"
          data-action="print"
          class="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          <span class="material-symbols-outlined text-[17px]">
            print
          </span>
          Cetak
        </button>

      </div>

    </section>
  `;
}

/*
|--------------------------------------------------------------------------
| HEADER PRINT
|--------------------------------------------------------------------------
*/

function renderPrintHeader(kamar) {

  return `
    <div class="distribution-print-header">

      <h1>
        BUKU KIRIMAN MAKANAN
      </h1>

      <h2>
        PONPES DARUL ILMI
      </h2>

      <div class="print-meta">

        <span>
          KAMAR :
          <strong>
            ${escapeHtml(kamar)}
          </strong>
        </span>

        <span>
          TANGGAL :
          <strong>
            ${escapeHtml(
              formatDateRange(
                state.filters.dari,
                state.filters.sampai
              )
            )}
          </strong>
        </span>

      </div>

    </div>
  `;
}

/*
|--------------------------------------------------------------------------
| TABEL PER KAMAR
|--------------------------------------------------------------------------
*/

function renderRoomTable(
  group,
  roomIndex
) {

  return `
    <section class="distribution-sheet">

      ${renderPrintHeader(
        group.kamar
      )}

      <table class="distribution-table">

        <thead>

          <tr>

            <th class="col-no">
              No
            </th>

            <th class="col-name">
              NAMA
            </th>

            <th class="col-class">
              KELAS
            </th>

            <th class="col-order">
              PESANAN
            </th>

            <th class="col-sign">
              TTD
            </th>

          </tr>

        </thead>

        <tbody>

          ${group.orders
            .map(
              (order, index) => {

                const items =
                  Array.isArray(order.items)
                    ? order.items
                    : [];

                return `
                  <tr>

                    <td class="text-center">
                      ${index + 1}
                    </td>

                    <td class="name-cell">
                      ${escapeHtml(
                        order.nama || "-"
                      )}
                    </td>

                    <td class="text-center">
                      ${escapeHtml(
                        order.kelas || "-"
                      )}
                    </td>

                    <td class="order-cell">

                      ${
                        items.length
                          ? items
                              .map(
                                (item) => `
                                  <div class="distribution-item-line">
                                    ${escapeHtml(
                                      formatItem(item)
                                    )}
                                  </div>
                                `
                              )
                              .join("")
                          : "-"
                      }

                    </td>

                    <td class="sign-cell">

                      ${
                        items.length
                          ? items
                              .map(
                                (item, itemIndex) => `
                                  <div
                                    class="distribution-check-line"
                                  >

                                    <input
                                      type="checkbox"
                                      class="distribution-checkbox"
                                      data-order-id="${escapeHtml(
                                        order.id
                                      )}"
                                      data-item-index="${itemIndex}"
                                      ${
                                        item.dibagikan === true
                                          ? "checked"
                                          : ""
                                      }
                                      aria-label="Tandai ${escapeHtml(
                                        item.namaMenu || "pesanan"
                                      )} sudah dibagikan"
                                    />

                                  </div>
                                `
                              )
                              .join("")
                          : ""
                      }

                    </td>

                  </tr>
                `;
              }
            )
            .join("")}

        </tbody>

      </table>

      <div class="distribution-page-number">
        Halaman ${roomIndex + 1}
      </div>

    </section>
  `;
}

/*
|--------------------------------------------------------------------------
| CONTENT
|--------------------------------------------------------------------------
*/

function renderContent() {

  const groups =
    getGroupedOrders();

  if (!groups.length) {

    return `
      <section class="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">

        <span class="material-symbols-outlined text-5xl text-slate-300">
          menu_book
        </span>

        <p class="mt-3 text-sm font-bold text-slate-600">
          Tidak ada pesanan
        </p>

        <p class="mt-1 text-xs text-slate-400">
          Tidak ada data yang sesuai dengan filter.
        </p>

      </section>
    `;
  }

  return `
    <div class="distribution-print-area">

      ${groups
        .map(
          (group, index) =>
            renderRoomTable(
              group,
              index
            )
        )
        .join("")}

    </div>
  `;
}

/*
|--------------------------------------------------------------------------
| EVENTS
|--------------------------------------------------------------------------
*/

function bindEvents() {

  const root =
    getRoot();

  if (!root) return;
  root
    .querySelectorAll(
      ".distribution-checkbox"
    )
    .forEach(
      (checkbox) => {

        checkbox.addEventListener(
          "change",
          async () => {

            const orderId =
              checkbox.dataset.orderId;

            const itemIndex =
              Number(
                checkbox.dataset.itemIndex
              );

            const dibagikan =
              checkbox.checked;


            checkbox.disabled = true;


            try {

              await updateItemDistributionStatus(
                orderId,
                itemIndex,
                dibagikan
              );

              /*
               * Update data lokal agar
               * checkbox tetap sesuai
               * tanpa harus mengambil
               * seluruh data ulang.
               */
              const order =
                state.orders.find(
                  (item) =>
                    item.id === orderId
                );


              if (
                order &&
                Array.isArray(order.items) &&
                order.items[itemIndex]
              ) {

                order.items[itemIndex].dibagikan =
                  dibagikan;

              }


              /*
               * Hitung status pesanan.
               */
              if (order) {

                const items =
                  Array.isArray(order.items)
                    ? order.items
                    : [];

                const total =
                  items.length;

                const distributed =
                  items.filter(
                    (item) =>
                      item.dibagikan === true
                  ).length;


                if (distributed === 0) {

                  order.status =
                    "belum_dibagikan";

                } else if (
                  distributed === total
                ) {

                  order.status =
                    "sudah_dibagikan";

                } else {

                  order.status =
                    "sebagian";

                }

              }

            } catch (error) {

              console.error(
                "Gagal memperbarui status pembagian:",
                error
              );

              /*
               * Kalau gagal menyimpan,
               * kembalikan checkbox
               * ke keadaan sebelumnya.
               */
              checkbox.checked =
                !dibagikan;

              alert(
                "Gagal menyimpan status pembagian. Silakan coba lagi."
              );

            } finally {

              checkbox.disabled =
                false;

            }

          }
        );

      }
    );

  root
    .querySelectorAll(
      "[data-filter]"
    )
    .forEach(
      (element) => {

        const name =
          element.dataset.filter;

        element.onchange =
          () => {

            state.filters[name] =
              element.value;

            render();
          };


        if (name === "nama") {

          element.oninput =
            () => {

              state.filters.nama =
                element.value;

              /*
               * Hanya refresh hasil,
               * bukan seluruh halaman.
               * Cursor tetap aman.
               */
              const content =
                root.querySelector(
                  ".distribution-print-area"
                );

              if (content) {
                content.outerHTML =
                  renderContent();
              }
            };
        }
      }
    );


  const today =
    root.querySelector(
      '[data-action="today"]'
    );

  if (today) {

    today.onclick = () => {

      const value =
        getTodayDate();

      state.filters.dari =
        value;

      state.filters.sampai =
        value;

      render();
    };
  }


  const reset =
    root.querySelector(
      '[data-action="reset"]'
    );

  if (reset) {

    reset.onclick = () => {

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


  const refresh =
    root.querySelector(
      '[data-action="refresh"]'
    );

  if (refresh) {

    refresh.onclick =
      async () => {
        await loadData();
      };
  }


  const print =
    root.querySelector(
      '[data-action="print"]'
    );

  if (print) {

    print.onclick = () => {
      window.print();
    };
  }
}

/*
|--------------------------------------------------------------------------
| RENDER
|--------------------------------------------------------------------------
*/

function render() {

  const root =
    getRoot();

  if (!root) return;


  if (state.loading) {

    root.innerHTML = `
      <div class="min-h-full bg-slate-50 p-6">

        <div class="mx-auto max-w-6xl">

          <div class="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">

            <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-primary"></div>

            <p class="mt-3 text-sm text-slate-500">
              Memuat Rekap Pembagian...
            </p>

          </div>

        </div>

      </div>
    `;

    return;
  }


  root.innerHTML = `
    <div class="min-h-full bg-slate-50 p-4 md:p-6 lg:p-8">

      <div class="mx-auto max-w-7xl">

        <div class="no-print mb-6">

          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Rekap & Cetak
          </p>

          <h1 class="mt-1 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
            Rekap Pembagian
          </h1>

          <p class="mt-2 text-sm text-slate-500">
            Format buku kiriman makanan berdasarkan kamar.
          </p>

        </div>


        ${renderFilters()}

        <div class="mt-5">
          ${renderContent()}
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
      classes,
      rooms
    ] = await Promise.all([
      getOrders(),
      getClasses(),
      getRooms()
    ]);

    state.orders =
      Array.isArray(orders)
        ? orders
        : [];

    state.classes =
      Array.isArray(classes)
        ? classes
        : [];

    state.rooms =
      Array.isArray(rooms)
        ? rooms
        : [];

  } catch (error) {

    console.error(
      "Gagal memuat Rekap Pembagian:",
      error
    );

    const root =
      getRoot();

    if (root) {

      root.innerHTML = `
        <div class="p-6">

          <div class="rounded-2xl border border-red-200 bg-red-50 p-5">

            <h2 class="font-bold text-red-800">
              Gagal memuat Rekap Pembagian
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

export async function renderDistribution() {

  state.filters = {
    ...createDateRange(),
    kamar: "",
    kelas: "",
    nama: ""
  };

  renderLayout({
    pageTitle: "Rekap Pembagian",
    pageSubtitle: "Format buku kiriman makanan berdasarkan kamar.",
    content: `
      <div id="page-content"></div>
    `
  });

  await loadData();
}
