import { renderLayout } from "../components/layout.js";
import { getOrders } from "../services/orders.service.js";
import { getMenus } from "../services/menus.service.js";
import { getClasses } from "../services/classes.service.js";
import { getRooms } from "../services/rooms.service.js";

import {
  createDateRange,
  isDateInRange,
  getTodayDate,
  formatDateRange
} from "../utils/date-range.js";

import {
  exportToExcel,
  exportToWord,
  exportToPDF,
  exportToTXT
} from "../exports/index.js";

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
  },

  report: "distribution"
};

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

function getRoot() {
  return (
    document.querySelector("#page-content") ||
    document.querySelector("[data-page-content]") ||
    document.querySelector("main") ||
    document.querySelector("#app")
  );
}

function getFilteredOrders() {
  return state.orders.filter(
    (order) => {

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
          normalizeText(
            state.filters.kamar
          )
      ) {
        return false;
      }

      if (
        state.filters.kelas &&
        normalizeText(order.kelas) !==
          normalizeText(
            state.filters.kelas
          )
      ) {
        return false;
      }

      if (state.filters.nama) {

        if (
          !normalizeText(
            order.nama || ""
          ).includes(
            normalizeText(
              state.filters.nama
            )
          )
        ) {
          return false;
        }
      }

      return true;
    }
  );
}

function getItemLabel(item) {

  let label =
    String(
      item.namaMenu || "-"
    ).trim();

  if (item.varian) {
    label += ` — ${item.varian}`;
  }

  if (item.ukuran) {
    label += ` — ${item.ukuran}`;
  }

  return label;
}

function getDistributionRows() {

  return getFilteredOrders()
    .sort(
      (a, b) =>
        normalizeText(
          a.nama || ""
        ).localeCompare(
          normalizeText(
            b.nama || ""
          ),
          "id"
        )
    )
    .map(
      (order, index) => ({
        no: index + 1,
        nama: order.nama || "-",
        kamar: order.kamar || "-",
        kelas: order.kelas || "-",
        pesanan:
          (order.items || [])
            .map(
              (item) =>
                `${getItemLabel(
                  item
                )} × ${
                  Number(
                    item.jumlah
                  ) || 0
                }`
            )
            .join("\n"),
        ttd: ""
      })
    );
}

function getFoodRows() {

  const map = new Map();

  for (
    const order of getFilteredOrders()
  ) {

    for (
      const item of order.items || []
    ) {

      const kategori =
        normalizeText(
          item.kategori || ""
        );

      if (
        kategori !== "makanan"
      ) {
        continue;
      }

      let nama =
        String(
          item.namaMenu || "-"
        ).trim();

      if (item.varian) {
        nama += ` — ${item.varian}`;
      }

      const key =
        normalizeText(nama);

      if (!map.has(key)) {
        map.set(
          key,
          {
            nama,
            jumlah: 0
          }
        );
      }

      map.get(key).jumlah +=
        Number(item.jumlah) || 0;
    }
  }

  return Array.from(
    map.values()
  )
    .sort(
      (a, b) =>
        a.nama.localeCompare(
          b.nama,
          "id"
        )
    )
    .map(
      (row, index) => ({
        no: index + 1,
        menu: row.nama,
        jumlah: row.jumlah
      })
    );
}

function getBananaRows() {

  const map = new Map();

  for (
    const order of getFilteredOrders()
  ) {

    for (
      const item of order.items || []
    ) {

      if (
        normalizeText(
          item.kategori || ""
        ) !==
        "pisang keju"
      ) {
        continue;
      }

      const varian =
        String(
          item.varian || "Tanpa Variasi"
        ).trim();

      const ukuran =
        String(
          item.ukuran || "Tanpa Ukuran"
        ).trim();

      const key =
        `${normalizeText(
          varian
        )}|${normalizeText(
          ukuran
        )}`;

      if (!map.has(key)) {
        map.set(
          key,
          {
            variasi: varian,
            ukuran,
            jumlah: 0
          }
        );
      }

      map.get(key).jumlah +=
        Number(item.jumlah) || 0;
    }
  }

  return Array.from(
    map.values()
  )
    .sort((a, b) => {

      const ukuran =
        normalizeText(
          a.ukuran
        ).localeCompare(
          normalizeText(
            b.ukuran
          ),
          "id"
        );

      if (ukuran !== 0) {
        return ukuran;
      }

      return a.variasi.localeCompare(
        b.variasi,
        "id"
      );
    })
    .map(
      (row, index) => ({
        no: index + 1,
        variasi: row.variasi,
        ukuran: row.ukuran,
        jumlah: row.jumlah
      })
    );
}

function getDrinkRows() {

  const map = new Map();

  for (
    const order of getFilteredOrders()
  ) {

    for (
      const item of order.items || []
    ) {

      if (
        normalizeText(
          item.kategori || ""
        ) !==
        "minuman"
      ) {
        continue;
      }

      const nama =
        String(
          item.namaMenu || "-"
        ).trim();

      const varian =
        String(
          item.varian || ""
        ).trim();

      const key =
        `${normalizeText(
          nama
        )}|${normalizeText(
          varian
        )}`;

      if (!map.has(key)) {
        map.set(
          key,
          {
            nama,
            varian,
            jumlah: 0
          }
        );
      }

      map.get(key).jumlah +=
        Number(item.jumlah) || 0;
    }
  }

  return Array.from(
    map.values()
  )
    .sort((a, b) =>
      `${a.nama} ${a.varian}`.localeCompare(
        `${b.nama} ${b.varian}`,
        "id"
      )
    )
    .map(
      (row, index) => ({
        no: index + 1,
        minuman:
          row.varian
            ? `${row.nama} — ${row.varian}`
            : row.nama,
        jumlah: row.jumlah
      })
    );
}

function getExportData() {

  if (
    state.report ===
    "distribution"
  ) {

    return {
      title:
        "BUKU KIRIMAN MAKANAN",
      subtitle:
        "PONPES DARUL ILMI",
      rows:
        getDistributionRows(),
      columns: [
        "No",
        "Nama",
        "Kamar",
        "Kelas",
        "Pesanan",
        "TTD"
      ]
    };
  }

  if (
    state.report === "food"
  ) {

    return {
      title:
        "REKAP MAKANAN",
      subtitle:
        formatDateRange(
          state.filters.dari,
          state.filters.sampai
        ),
      rows:
        getFoodRows(),
      columns: [
        "No",
        "Menu",
        "Jumlah"
      ]
    };
  }

  if (
    state.report === "banana"
  ) {

    return {
      title:
        "REKAP PISANG KEJU",
      subtitle:
        formatDateRange(
          state.filters.dari,
          state.filters.sampai
        ),
      rows:
        getBananaRows(),
      columns: [
        "No",
        "Variasi",
        "Ukuran",
        "Jumlah"
      ]
    };
  }

  return {
    title:
      "REKAP MINUMAN",
    subtitle:
      formatDateRange(
        state.filters.dari,
        state.filters.sampai
      ),
    rows:
      getDrinkRows(),
    columns: [
      "No",
      "Minuman",
      "Jumlah"
    ]
  };
}

function render() {

  const root =
    getRoot();

  if (!root) return;

  if (state.loading) {

    root.innerHTML = `
      <div class="min-h-full bg-slate-50 p-6">

        <div class="mx-auto max-w-5xl">

          <div class="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">

            <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-primary"></div>

            <p class="mt-3 text-sm text-slate-500">
              Memuat Export...
            </p>

          </div>

        </div>

      </div>
    `;

    return;
  }

  root.innerHTML = `
    <div class="min-h-full bg-slate-50 p-4 md:p-6 lg:p-8">

      <div class="mx-auto max-w-5xl">

        <div class="mb-6">

          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Export
          </p>

          <h1 class="mt-1 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
            Export Laporan
          </h1>

          <p class="mt-2 text-sm text-slate-500">
            Pilih laporan, filter data, kemudian pilih format file.
          </p>

        </div>


        <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div class="grid gap-5 md:grid-cols-2">

            <label>

              <span class="mb-1.5 block text-xs font-semibold text-slate-600">
                Jenis Laporan
              </span>

              <select
                id="export-report"
                class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >

                <option
                  value="distribution"
                  ${
                    state.report ===
                    "distribution"
                      ? "selected"
                      : ""
                  }
                >
                  Rekap Pembagian
                </option>

                <option
                  value="food"
                  ${
                    state.report ===
                    "food"
                      ? "selected"
                      : ""
                  }
                >
                  Rekap Makanan
                </option>

                <option
                  value="banana"
                  ${
                    state.report ===
                    "banana"
                      ? "selected"
                      : ""
                  }
                >
                  Rekap Pisang Keju
                </option>

                <option
                  value="drinks"
                  ${
                    state.report ===
                    "drinks"
                      ? "selected"
                      : ""
                  }
                >
                  Rekap Minuman
                </option>

              </select>

            </label>


            <div>

              <span class="mb-1.5 block text-xs font-semibold text-slate-600">
                Rentang Tanggal
              </span>

              <p class="rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                ${escapeHtml(
                  formatDateRange(
                    state.filters.dari,
                    state.filters.sampai
                  )
                )}
              </p>

            </div>

          </div>


          <div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">

            <label>

              <span class="mb-1.5 block text-xs font-semibold text-slate-600">
                Dari
              </span>

              <input
                type="date"
                data-filter="dari"
                value="${escapeHtml(
                  state.filters.dari
                )}"
                class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
              />

            </label>


            <label>

              <span class="mb-1.5 block text-xs font-semibold text-slate-600">
                Sampai
              </span>

              <input
                type="date"
                data-filter="sampai"
                value="${escapeHtml(
                  state.filters.sampai
                )}"
                class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
              />

            </label>


            <label>

              <span class="mb-1.5 block text-xs font-semibold text-slate-600">
                Kamar / Asrama
              </span>

              <select
                data-filter="kamar"
                class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
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
                          state.filters
                            .kamar ===
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


            <label>

              <span class="mb-1.5 block text-xs font-semibold text-slate-600">
                Kelas
              </span>

              <select
                data-filter="kelas"
                class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
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
                          state.filters
                            .kelas ===
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


            <label>

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
                class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
              />

            </label>

          </div>


          <div class="mt-6 border-t border-slate-100 pt-5">

            <p class="mb-3 text-xs font-semibold text-slate-600">
              Format Export
            </p>

            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

              <button
                type="button"
                data-export="xlsx"
                class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-left hover:bg-emerald-100"
              >
                <span class="material-symbols-outlined text-emerald-700">
                  table_view
                </span>
                <p class="mt-2 text-sm font-bold text-slate-800">
                  Excel
                </p>
                <p class="mt-1 text-xs text-slate-500">
                  .xlsx
                </p>
              </button>


              <button
                type="button"
                data-export="docx"
                class="rounded-xl border border-blue-200 bg-blue-50 px-4 py-4 text-left hover:bg-blue-100"
              >
                <span class="material-symbols-outlined text-blue-700">
                  description
                </span>
                <p class="mt-2 text-sm font-bold text-slate-800">
                  Word
                </p>
                <p class="mt-1 text-xs text-slate-500">
                  .docx
                </p>
              </button>


              <button
                type="button"
                data-export="pdf"
                class="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-left hover:bg-red-100"
              >
                <span class="material-symbols-outlined text-red-700">
                  picture_as_pdf
                </span>
                <p class="mt-2 text-sm font-bold text-slate-800">
                  PDF
                </p>
                <p class="mt-1 text-xs text-slate-500">
                  .pdf
                </p>
              </button>


              <button
                type="button"
                data-export="txt"
                class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-left hover:bg-slate-100"
              >
                <span class="material-symbols-outlined text-slate-700">
                  article
                </span>
                <p class="mt-2 text-sm font-bold text-slate-800">
                  Text
                </p>
                <p class="mt-1 text-xs text-slate-500">
                  .txt
                </p>
              </button>

            </div>

          </div>

        </section>


        <section class="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div class="flex items-center justify-between">

            <div>

              <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Preview
              </p>

              <h2 class="mt-1 font-bold text-slate-800">
                ${escapeHtml(
                  getExportData().title
                )}
              </h2>

            </div>

            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              ${
                getExportData()
                  .rows.length
              } data
            </span>

          </div>


          <div class="mt-4 overflow-x-auto">

            <table class="w-full min-w-[600px] border-collapse text-sm">

              <thead>

                <tr class="border-b border-slate-200 bg-slate-50">

                  ${getExportData()
                    .columns
                    .map(
                      (column) => `
                        <th class="px-3 py-3 text-left text-xs font-bold text-slate-500">
                          ${escapeHtml(
                            column
                          )}
                        </th>
                      `
                    )
                    .join("")}

                </tr>

              </thead>


              <tbody class="divide-y divide-slate-100">

                ${getPreviewRows()}

              </tbody>

            </table>

          </div>

        </section>

      </div>

    </div>
  `;

  bindEvents();
}

function getPreviewRows() {

  const data =
    getExportData();


  /*
   * Preview menampilkan SEMUA data
   * yang lolos filter.
   *
   * Sebelumnya menggunakan:
   *
   * data.rows.slice(0, 10)
   *
   * sehingga jika ada 14 data,
   * preview hanya menampilkan 10.
   */

  return data.rows
    .map(
      (row) => {

        const values =
          Object.values(row);


        return `
          <tr>

            ${
              values
                .map(
                  (value) => `
                    <td
                      class="
                        px-3
                        py-3
                        text-slate-700
                      "
                    >
                      ${escapeHtml(
                        String(
                          value ?? ""
                        )
                      ).replace(
                        /\n/g,
                        "<br>"
                      )}
                    </td>
                  `
                )
                .join("")
            }

          </tr>
        `;

      }
    )
    .join("");
}

function bindEvents() {

  const root =
    getRoot();

  if (!root) return;


  const report =
    root.querySelector(
      "#export-report"
    );

  if (report) {

    report.onchange =
      () => {

        state.report =
          report.value;

        render();
      };
  }


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
               * Render preview saja.
               * Input tidak diganti.
               */
              const preview =
                root.querySelector(
                  "section.mt-5"
                );

              if (preview) {

                const data =
                  getExportData();

                preview.querySelector(
                  "h2"
                ).textContent =
                  data.title;

                const badge =
                  preview.querySelector(
                    "span.rounded-full"
                  );

                if (badge) {
                  badge.textContent =
                    `${data.rows.length} data`;
                }

                const tbody =
                  preview.querySelector(
                    "tbody"
                  );

                if (tbody) {
                  tbody.innerHTML =
                    getPreviewRows();
                }
              }
            };
        }
      }
    );


  root
    .querySelectorAll(
      "[data-export]"
    )
    .forEach(
      (button) => {

        button.onclick =
          async () => {

            const format =
              button.dataset.export;

            const data =
              getExportData();

            if (!data.rows.length) {

              alert(
                "Tidak ada data untuk diexport."
              );

              return;
            }

            button.disabled =
              true;

            const oldText =
              button.innerHTML;

            button.innerHTML = `
              <span class="material-symbols-outlined animate-spin">
                progress_activity
              </span>

              <p class="mt-2 text-sm font-bold">
                Memproses...
              </p>
            `;

            try {

             const payload = {
  ...data,

  reportType:
    state.report,

  rawOrders:
    getFilteredOrders(),

  filters: {
    ...state.filters
  }
};

              if (
                format === "xlsx"
              ) {
                await exportToExcel(
                  payload
                );
              }

              if (
                format === "docx"
              ) {
                await exportToWord(
                  payload
                );
              }

              if (
                format === "pdf"
              ) {
                await exportToPDF(
                  payload
                );
              }

              if (
                format === "txt"
              ) {
                await exportToTXT(
                  payload
                );
              }

            } catch (error) {

              console.error(
                "Export gagal:",
                error
              );

              alert(
                `Export gagal: ${error.message}`
              );

            } finally {

              button.disabled =
                false;

              button.innerHTML =
                oldText;
            }
          };
      }
    );
}

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

  } catch (error) {

    console.error(
      "Gagal memuat Export:",
      error
    );

  } finally {

    state.loading = false;

    render();
  }
}

export async function renderExport() {
  renderLayout({ pageTitle: "Export Laporan", pageSubtitle: "Unduh laporan pesanan dan rekap." });


  state.filters = {
    ...createDateRange(),
    kamar: "",
    kelas: "",
    nama: ""
  };

  state.report =
    "distribution";

  await loadData();
}