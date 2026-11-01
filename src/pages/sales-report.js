import { renderLayout } from "../components/layout.js";

import {
  getOrders
} from "../services/orders.service.js";

import {
  buildSalesReportData,
  exportSalesToExcel,
  exportSalesToText,
  formatRupiah
} from "../services/sales-export.service.js";


/*
|---------------------------------------------------------------------------
| DATA GLOBAL
|---------------------------------------------------------------------------
*/

let allOrders = [];


/*
|---------------------------------------------------------------------------
| RENDER HALAMAN
|---------------------------------------------------------------------------
*/

export async function renderSalesReport() {

  renderLayout({

    pageTitle:
      "Rekap Penjualan",

    pageSubtitle:
      "Rekap omzet penjualan kantin",

    content: `

      <div
        class="
          space-y-5
          max-w-7xl
          mx-auto
        "
      >

        <!-- =====================================================
             HEADER
        ====================================================== -->

        <section>

          <div
            class="
              flex
              flex-col
              lg:flex-row
              lg:items-end
              lg:justify-between
              gap-4
            "
          >

            <div>

              <div
                class="
                  text-xs
                  font-semibold
                  text-primary
                  uppercase
                  tracking-wider
                "
              >
                REKAP & CETAK
              </div>

              <h1
                class="
                  text-2xl
                  sm:text-3xl
                  font-bold
                  text-slate-900
                  mt-1
                "
              >
                Rekap Penjualan
              </h1>

              <p
                class="
                  text-sm
                  text-slate-500
                  mt-1
                "
              >
                Hitung total omzet berdasarkan
                harga jual pada saat transaksi.
              </p>

            </div>


            <!-- EXPORT SENDIRI -->

            <div
              class="
                flex
                flex-col
                sm:flex-row
                gap-2
              "
            >

              <button
                id="sales-export-excel"
                type="button"
                class="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  px-4
                  py-2.5
                  rounded-lg
                  bg-primary
                  text-white
                  text-sm
                  font-semibold
                  hover:opacity-90
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >

                <span
                  class="
                    material-symbols-outlined
                    text-[19px]
                  "
                >
                  table_view
                </span>

                Export Excel

              </button>


              <button
                id="sales-export-text"
                type="button"
                class="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  px-4
                  py-2.5
                  rounded-lg
                  border
                  border-slate-300
                  bg-white
                  text-slate-700
                  text-sm
                  font-semibold
                  hover:bg-slate-50
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >

                <span
                  class="
                    material-symbols-outlined
                    text-[19px]
                  "
                >
                  description
                </span>

                Export Text

              </button>

            </div>

          </div>

        </section>


        <!-- =====================================================
             FILTER
        ====================================================== -->

        <section
          class="
            bg-white
            border
            border-slate-200
            rounded-xl
            p-5
          "
        >

          <div
            class="
              flex
              flex-col
              sm:flex-row
              sm:items-center
              sm:justify-between
              gap-3
              mb-4
            "
          >

            <div>

              <h2
                class="
                  text-sm
                  font-bold
                  text-slate-900
                "
              >
                Filter Laporan
              </h2>

              <p
                class="
                  text-xs
                  text-slate-500
                  mt-0.5
                "
              >
                Gunakan beberapa filter sekaligus.
              </p>

            </div>


            <button
              id="sales-filter-reset"
              type="button"
              class="
                inline-flex
                items-center
                justify-center
                gap-1.5
                px-3
                py-2
                rounded-lg
                border
                border-slate-300
                bg-white
                text-slate-700
                text-xs
                font-semibold
                hover:bg-slate-50
              "
            >

              <span
                class="
                  material-symbols-outlined
                  text-[17px]
                "
              >
                restart_alt
              </span>

              Reset

            </button>

          </div>


          <div
            class="
              grid
              grid-cols-1
              sm:grid-cols-2
              lg:grid-cols-5
              gap-4
            "
          >

            <!-- TANGGAL DARI -->

            <div>

              <label
                for="sales-date-from"
                class="
                  block
                  text-xs
                  font-semibold
                  text-slate-600
                  mb-1.5
                "
              >
                Dari Tanggal
              </label>

              <input
                id="sales-date-from"
                type="date"
                class="
                  w-full
                  h-10
                  px-3
                  rounded-lg
                  border
                  border-slate-300
                  text-sm
                  outline-none
                  focus:border-primary
                  focus:ring-2
                  focus:ring-primary/20
                "
              />

            </div>


            <!-- TANGGAL SAMPAI -->

            <div>

              <label
                for="sales-date-to"
                class="
                  block
                  text-xs
                  font-semibold
                  text-slate-600
                  mb-1.5
                "
              >
                Sampai Tanggal
              </label>

              <input
                id="sales-date-to"
                type="date"
                class="
                  w-full
                  h-10
                  px-3
                  rounded-lg
                  border
                  border-slate-300
                  text-sm
                  outline-none
                  focus:border-primary
                  focus:ring-2
                  focus:ring-primary/20
                "
              />

            </div>


            <!-- KAMAR -->

            <div>

              <label
                for="sales-room"
                class="
                  block
                  text-xs
                  font-semibold
                  text-slate-600
                  mb-1.5
                "
              >
                Kamar / Asrama
              </label>

              <select
                id="sales-room"
                class="
                  w-full
                  h-10
                  px-3
                  rounded-lg
                  border
                  border-slate-300
                  bg-white
                  text-sm
                  outline-none
                  focus:border-primary
                  focus:ring-2
                  focus:ring-primary/20
                "
              >

                <option value="">
                  Semua Kamar
                </option>

              </select>

            </div>


            <!-- KELAS -->

            <div>

              <label
                for="sales-class"
                class="
                  block
                  text-xs
                  font-semibold
                  text-slate-600
                  mb-1.5
                "
              >
                Kelas
              </label>

              <select
                id="sales-class"
                class="
                  w-full
                  h-10
                  px-3
                  rounded-lg
                  border
                  border-slate-300
                  bg-white
                  text-sm
                  outline-none
                  focus:border-primary
                  focus:ring-2
                  focus:ring-primary/20
                "
              >

                <option value="">
                  Semua Kelas
                </option>

              </select>

            </div>


            <!-- NAMA -->

            <div>

              <label
                for="sales-name"
                class="
                  block
                  text-xs
                  font-semibold
                  text-slate-600
                  mb-1.5
                "
              >
                Nama Santri
              </label>

              <input
                id="sales-name"
                type="text"
                placeholder="Cari nama..."
                autocomplete="off"
                class="
                  w-full
                  h-10
                  px-3
                  rounded-lg
                  border
                  border-slate-300
                  text-sm
                  outline-none
                  focus:border-primary
                  focus:ring-2
                  focus:ring-primary/20
                "
              />

            </div>

          </div>

        </section>


        <!-- =====================================================
             SUMMARY
        ====================================================== -->

        <section
          id="sales-summary"
          class="
            grid
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-4
            gap-4
          "
        ></section>


        <!-- =====================================================
             REKAP PER MENU
        ====================================================== -->

        <section
          class="
            bg-white
            border
            border-slate-200
            rounded-xl
            overflow-hidden
          "
        >

          <div
            class="
              px-5
              py-4
              border-b
              border-slate-200
              bg-slate-50
            "
          >

            <h2
              class="
                text-sm
                font-bold
                text-slate-900
              "
            >
              Rekap Penjualan per Menu
            </h2>

            <p
              class="
                text-xs
                text-slate-500
                mt-0.5
              "
            >
              Omzet dihitung menggunakan harga
              yang tersimpan pada transaksi.
            </p>

          </div>


          <div
            id="sales-table-wrapper"
            class="overflow-x-auto"
          ></div>

        </section>


        <!-- =====================================================
             ITEM TANPA HARGA
        ====================================================== -->

        <section
          id="sales-missing-section"
          class="
            bg-white
            border
            border-amber-200
            rounded-xl
            overflow-hidden
          "
        >

          <div
            class="
              px-5
              py-4
              bg-amber-50
              border-b
              border-amber-200
            "
          >

            <div
              class="
                flex
                items-start
                gap-3
              "
            >

              <span
                class="
                  material-symbols-outlined
                  text-amber-600
                "
              >
                warning
              </span>

              <div>

                <h2
                  class="
                    text-sm
                    font-bold
                    text-slate-900
                  "
                >
                  Item Belum Memiliki Harga
                </h2>

                <p
                  class="
                    text-xs
                    text-slate-600
                    mt-0.5
                  "
                >
                  Item ini tidak dihitung ke dalam
                  total omzet sampai memiliki harga transaksi.
                </p>

              </div>

            </div>

          </div>


          <div
            id="sales-missing-wrapper"
            class="overflow-x-auto"
          ></div>

        </section>


        <!-- =====================================================
             LOADING
        ====================================================== -->

        <div
          id="sales-loading"
          class="
            hidden
            fixed
            inset-0
            z-[100]
            bg-slate-900/20
            backdrop-blur-[1px]
            items-center
            justify-center
          "
        >

          <div
            class="
              bg-white
              rounded-xl
              shadow-xl
              border
              border-slate-200
              px-5
              py-4
              flex
              items-center
              gap-3
            "
          >

            <span
              class="
                material-symbols-outlined
                animate-spin
                text-primary
              "
            >
              progress_activity
            </span>

            <span
              class="
                text-sm
                font-semibold
                text-slate-700
              "
            >
              Memproses...
            </span>

          </div>

        </div>

      </div>

    `

  });


  try {

    showLoading();

    allOrders =
      await getOrders();

    populateFilterOptions();

    setupSalesEvents();

    renderSalesResult();

  } catch (error) {

    console.error(
      "Gagal memuat rekap penjualan:",
      error
    );

    showError(
      error.message
    );

  } finally {

    hideLoading();

  }

}


/*
|---------------------------------------------------------------------------
| SETUP FILTER
|---------------------------------------------------------------------------
*/

function populateFilterOptions() {

  const roomSelect =
    document.querySelector(
      "#sales-room"
    );

  const classSelect =
    document.querySelector(
      "#sales-class"
    );

  if (
    !roomSelect ||
    !classSelect
  ) {
    return;
  }


  const rooms =
    new Set();

  const classes =
    new Set();


  allOrders.forEach(
    (order) => {

      const kamar =
        normalizeText(
          order?.kamar
        );

      const kelas =
        normalizeText(
          order?.kelas
        );

      if (kamar) {
        rooms.add(kamar);
      }

      if (kelas) {
        classes.add(kelas);
      }

    }
  );


  const sortedRooms =
    [...rooms].sort(
      compareIndonesian
    );

  const sortedClasses =
    [...classes].sort(
      compareIndonesian
    );


  roomSelect.innerHTML = `
    <option value="">
      Semua Kamar
    </option>

    ${sortedRooms
      .map(
        (item) => `
          <option value="${escapeAttribute(
            item
          )}">
            ${escapeHtml(
              item
            )}
          </option>
        `
      )
      .join("")}
  `;


  classSelect.innerHTML = `
    <option value="">
      Semua Kelas
    </option>

    ${sortedClasses
      .map(
        (item) => `
          <option value="${escapeAttribute(
            item
          )}">
            ${escapeHtml(
              item
            )}
          </option>
        `
      )
      .join("")}
  `;
}


/*
|---------------------------------------------------------------------------
| EVENT
|---------------------------------------------------------------------------
*/

function setupSalesEvents() {

  const ids = [
    "sales-date-from",
    "sales-date-to",
    "sales-room",
    "sales-class",
    "sales-name"
  ];

  ids.forEach(
    (id) => {

      const element =
        document.querySelector(
          `#${id}`
        );

      if (!element) {
        return;
      }

      element.addEventListener(
        element.tagName === "INPUT" &&
        element.type === "text"
          ? "input"
          : "change",
        renderSalesResult
      );

    }
  );


  const resetButton =
    document.querySelector(
      "#sales-filter-reset"
    );

  if (resetButton) {

    resetButton.addEventListener(
      "click",
      resetSalesFilters
    );

  }


  const excelButton =
    document.querySelector(
      "#sales-export-excel"
    );

  if (excelButton) {

    excelButton.addEventListener(
      "click",
      handleExportExcel
    );

  }


  const textButton =
    document.querySelector(
      "#sales-export-text"
    );

  if (textButton) {

    textButton.addEventListener(
      "click",
      handleExportText
    );

  }

}


/*
|---------------------------------------------------------------------------
| FILTER SAAT INI
|---------------------------------------------------------------------------
*/

function getCurrentSalesFilters() {

  return {

    tanggalDari:
      document.querySelector(
        "#sales-date-from"
      )?.value || "",

    tanggalSampai:
      document.querySelector(
        "#sales-date-to"
      )?.value || "",

    kamar:
      document.querySelector(
        "#sales-room"
      )?.value || "",

    kelas:
      document.querySelector(
        "#sales-class"
      )?.value || "",

    nama:
      document.querySelector(
        "#sales-name"
      )?.value || ""

  };

}


/*
|---------------------------------------------------------------------------
| RENDER HASIL
|---------------------------------------------------------------------------
*/

function renderSalesResult() {

  const filters =
    getCurrentSalesFilters();

  const report =
    buildSalesReportData(
      allOrders,
      filters
    );


  renderSummary(
    report
  );

  renderMenuTable(
    report
  );

  renderMissingPriceTable(
    report
  );


  updateExportButtons(
    report
  );

}


/*
|---------------------------------------------------------------------------
| SUMMARY
|---------------------------------------------------------------------------
*/

function renderSummary(
  report
) {

  const wrapper =
    document.querySelector(
      "#sales-summary"
    );

  if (!wrapper) {
    return;
  }


  wrapper.innerHTML = `

    ${summaryCard(
      "payments",
      "Total Omzet",
      formatRupiah(
        report.totalOmzet
      ),
      "Omzet dari item yang sudah memiliki harga.",
      "primary"
    )}

    ${summaryCard(
      "receipt_long",
      "Transaksi",
      report.transactionCount,
      "Jumlah pesanan santri yang masuk filter.",
      "slate"
    )}

    ${summaryCard(
      "shopping_cart",
      "Item Terjual",
      report.totalItems,
      "Jumlah seluruh item berdasarkan kuantitas.",
      "slate"
    )}

    ${summaryCard(
      "warning",
      "Belum Ada Harga",
      report.missingPriceCount,
      report.missingPriceCount > 0
        ? `${report.missingPriceQuantity} qty belum dihitung ke omzet.`
        : "Semua item sudah memiliki harga.",
      report.missingPriceCount > 0
        ? "warning"
        : "success"
    )}

  `;

}


/*
|---------------------------------------------------------------------------
| SUMMARY CARD
|---------------------------------------------------------------------------
*/

function summaryCard(
  icon,
  label,
  value,
  description,
  type
) {

  const iconClass =
    type === "warning"
      ? "text-amber-600 bg-amber-50"
      : type === "success"
        ? "text-emerald-600 bg-emerald-50"
        : type === "primary"
          ? "text-primary bg-emerald-50"
          : "text-slate-600 bg-slate-50";


  return `

    <div
      class="
        bg-white
        border
        border-slate-200
        rounded-xl
        p-5
      "
    >

      <div
        class="
          flex
          items-start
          justify-between
          gap-3
        "
      >

        <div>

          <div
            class="
              text-xs
              font-semibold
              text-slate-500
            "
          >
            ${escapeHtml(
              label
            )}
          </div>

          <div
            class="
              text-xl
              sm:text-2xl
              font-bold
              text-slate-900
              mt-1
            "
          >
            ${escapeHtml(
              String(value)
            )}
          </div>

          <div
            class="
              text-[11px]
              text-slate-400
              mt-1
            "
          >
            ${escapeHtml(
              description
            )}
          </div>

        </div>


        <div
          class="
            w-10
            h-10
            rounded-lg
            flex
            items-center
            justify-center
            shrink-0
            ${iconClass}
          "
        >

          <span
            class="
              material-symbols-outlined
            "
          >
            ${icon}
          </span>

        </div>

      </div>

    </div>

  `;

}


/*
|---------------------------------------------------------------------------
| TABLE MENU
|---------------------------------------------------------------------------
*/

function renderMenuTable(
  report
) {

  const wrapper =
    document.querySelector(
      "#sales-table-wrapper"
    );

  if (!wrapper) {
    return;
  }


  if (
    report.menuSummary.length === 0
  ) {

    wrapper.innerHTML = `

      <div
        class="
          p-8
          text-center
          text-sm
          text-slate-500
        "
      >

        <span
          class="
            material-symbols-outlined
            text-4xl
            text-slate-300
          "
        >
          receipt_long
        </span>

        <div
          class="
            font-semibold
            text-slate-700
            mt-2
          "
        >
          Belum ada data penjualan
        </div>

        <div
          class="
            text-xs
            text-slate-400
            mt-1
          "
        >
          Belum ada transaksi yang sesuai filter.
        </div>

      </div>

    `;

    return;
  }


  wrapper.innerHTML = `

    <table
      class="
        min-w-full
        text-sm
      "
    >

      <thead>

        <tr
          class="
            border-b
            border-slate-200
            bg-slate-50
          "
        >

          <th
            class="
              px-5
              py-3
              text-left
              text-xs
              font-bold
              text-slate-500
            "
          >
            No
          </th>

          <th
            class="
              px-5
              py-3
              text-left
              text-xs
              font-bold
              text-slate-500
            "
          >
            Menu
          </th>

          <th
            class="
              px-5
              py-3
              text-right
              text-xs
              font-bold
              text-slate-500
            "
          >
            Jumlah Terjual
          </th>

          <th
            class="
              px-5
              py-3
              text-right
              text-xs
              font-bold
              text-slate-500
            "
          >
            Omzet
          </th>

        </tr>

      </thead>


      <tbody>

        ${report.menuSummary
          .map(
            (
              item,
              index
            ) => `

              <tr
                class="
                  border-b
                  border-slate-100
                  last:border-b-0
                  hover:bg-slate-50
                "
              >

                <td
                  class="
                    px-5
                    py-3
                    text-slate-500
                  "
                >
                  ${index + 1}
                </td>

                <td
                  class="
                    px-5
                    py-3
                    font-medium
                    text-slate-800
                  "
                >
                  ${escapeHtml(
                    item.namaMenu
                  )}
                </td>

                <td
                  class="
                    px-5
                    py-3
                    text-right
                    text-slate-700
                  "
                >
                  ${item.jumlah}
                </td>

                <td
                  class="
                    px-5
                    py-3
                    text-right
                    font-semibold
                    text-slate-900
                  "
                >
                  ${escapeHtml(
                    formatRupiah(
                      item.omzet
                    )
                  )}
                </td>

              </tr>

            `
          )
          .join("")}

      </tbody>


      <tfoot>

        <tr
          class="
            bg-slate-50
            border-t
            border-slate-200
          "
        >

          <td
            colspan="2"
            class="
              px-5
              py-3
              text-left
              font-bold
              text-slate-800
            "
          >
            TOTAL
          </td>

          <td
            class="
              px-5
              py-3
              text-right
              font-bold
              text-slate-800
            "
          >
            ${report.totalItems}
          </td>

          <td
            class="
              px-5
              py-3
              text-right
              font-bold
              text-primary
            "
          >
            ${escapeHtml(
              formatRupiah(
                report.totalOmzet
              )
            )}
          </td>

        </tr>

      </tfoot>

    </table>

  `;

}


/*
|---------------------------------------------------------------------------
| TABLE ITEM TANPA HARGA
|---------------------------------------------------------------------------
*/

function renderMissingPriceTable(
  report
) {

  const section =
    document.querySelector(
      "#sales-missing-section"
    );

  const wrapper =
    document.querySelector(
      "#sales-missing-wrapper"
    );

  if (
    !section ||
    !wrapper
  ) {
    return;
  }


  if (
    report.missingPriceItems.length === 0
  ) {

    wrapper.innerHTML = `

      <div
        class="
          p-5
          text-sm
          text-emerald-700
          bg-emerald-50
        "
      >

        Semua item pada filter ini
        sudah memiliki harga.

      </div>

    `;

    return;
  }


  wrapper.innerHTML = `

    <table
      class="
        min-w-full
        text-sm
      "
    >

      <thead>

        <tr
          class="
            border-b
            border-amber-200
            bg-amber-50
          "
        >

          <th
            class="
              px-5
              py-3
              text-left
              text-xs
              font-bold
              text-slate-500
            "
          >
            No
          </th>

          <th
            class="
              px-5
              py-3
              text-left
              text-xs
              font-bold
              text-slate-500
            "
          >
            Tanggal
          </th>

          <th
            class="
              px-5
              py-3
              text-left
              text-xs
              font-bold
              text-slate-500
            "
          >
            Nama
          </th>

          <th
            class="
              px-5
              py-3
              text-left
              text-xs
              font-bold
              text-slate-500
            "
          >
            Kamar
          </th>

          <th
            class="
              px-5
              py-3
              text-left
              text-xs
              font-bold
              text-slate-500
            "
          >
            Kelas
          </th>

          <th
            class="
              px-5
              py-3
              text-left
              text-xs
              font-bold
              text-slate-500
            "
          >
            Menu
          </th>

          <th
            class="
              px-5
              py-3
              text-right
              text-xs
              font-bold
              text-slate-500
            "
          >
            Jumlah
          </th>

        </tr>

      </thead>


      <tbody>

        ${report.missingPriceItems
          .map(
            (
              item,
              index
            ) => `

              <tr
                class="
                  border-b
                  border-amber-100
                  last:border-b-0
                "
              >

                <td
                  class="
                    px-5
                    py-3
                    text-slate-500
                  "
                >
                  ${index + 1}
                </td>

                <td
                  class="
                    px-5
                    py-3
                    text-slate-700
                  "
                >
                  ${escapeHtml(
                    item.tanggal
                  )}
                </td>

                <td
                  class="
                    px-5
                    py-3
                    font-medium
                    text-slate-800
                  "
                >
                  ${escapeHtml(
                    item.nama
                  )}
                </td>

                <td
                  class="
                    px-5
                    py-3
                    text-slate-700
                  "
                >
                  ${escapeHtml(
                    item.kamar
                  )}
                </td>

                <td
                  class="
                    px-5
                    py-3
                    text-slate-700
                  "
                >
                  ${escapeHtml(
                    item.kelas
                  )}
                </td>

                <td
                  class="
                    px-5
                    py-3
                    font-medium
                    text-slate-800
                  "
                >
                  ${escapeHtml(
                    item.menu
                  )}
                </td>

                <td
                  class="
                    px-5
                    py-3
                    text-right
                    text-slate-700
                  "
                >
                  ${item.jumlah}
                </td>

              </tr>

            `
          )
          .join("")}

      </tbody>

    </table>

  `;

}


/*
|---------------------------------------------------------------------------
| EXPORT
|---------------------------------------------------------------------------
*/

function handleExportExcel() {

  try {

    const filters =
      getCurrentSalesFilters();

    const report =
      buildSalesReportData(
        allOrders,
        filters
      );

    if (
      report.orders.length === 0
    ) {
      alert(
        "Tidak ada data pesanan yang sesuai dengan filter."
      );

      return;
    }

    exportSalesToExcel({
      orders: allOrders,
      filters
    });

  } catch (error) {

    console.error(
      "Gagal export Excel penjualan:",
      error
    );

    alert(
      `Export Excel gagal: ${
        error.message
      }`
    );

  }

}


function handleExportText() {

  try {

    const filters =
      getCurrentSalesFilters();

    const report =
      buildSalesReportData(
        allOrders,
        filters
      );

    if (
      report.orders.length === 0
    ) {
      alert(
        "Tidak ada data pesanan yang sesuai dengan filter."
      );

      return;
    }

    exportSalesToText({
      orders: allOrders,
      filters
    });

  } catch (error) {

    console.error(
      "Gagal export Text penjualan:",
      error
    );

    alert(
      `Export Text gagal: ${
        error.message
      }`
    );

  }

}


/*
|---------------------------------------------------------------------------
| RESET
|---------------------------------------------------------------------------
*/

function resetSalesFilters() {

  const dateFrom =
    document.querySelector(
      "#sales-date-from"
    );

  const dateTo =
    document.querySelector(
      "#sales-date-to"
    );

  const room =
    document.querySelector(
      "#sales-room"
    );

  const classSelect =
    document.querySelector(
      "#sales-class"
    );

  const name =
    document.querySelector(
      "#sales-name"
    );


  if (dateFrom) {
    dateFrom.value = "";
  }

  if (dateTo) {
    dateTo.value = "";
  }

  if (room) {
    room.value = "";
  }

  if (classSelect) {
    classSelect.value = "";
  }

  if (name) {
    name.value = "";
  }


  renderSalesResult();

}


/*
|---------------------------------------------------------------------------
| EXPORT BUTTON STATE
|---------------------------------------------------------------------------
*/

function updateExportButtons(
  report
) {

  const excelButton =
    document.querySelector(
      "#sales-export-excel"
    );

  const textButton =
    document.querySelector(
      "#sales-export-text"
    );


  const disabled =
    report.orders.length === 0;


  if (excelButton) {
    excelButton.disabled =
      disabled;
  }

  if (textButton) {
    textButton.disabled =
      disabled;
  }

}


/*
|---------------------------------------------------------------------------
| LOADING
|---------------------------------------------------------------------------
*/

function showLoading() {

  const element =
    document.querySelector(
      "#sales-loading"
    );

  if (!element) {
    return;
  }

  element.classList.remove(
    "hidden"
  );

  element.classList.add(
    "flex"
  );

}


function hideLoading() {

  const element =
    document.querySelector(
      "#sales-loading"
    );

  if (!element) {
    return;
  }

  element.classList.remove(
    "flex"
  );

  element.classList.add(
    "hidden"
  );

}


/*
|---------------------------------------------------------------------------
| ERROR
|---------------------------------------------------------------------------
*/

function showError(
  message
) {

  const wrapper =
    document.querySelector(
      ".page-container"
    );

  if (!wrapper) {
    return;
  }


  wrapper.innerHTML = `

    <div
      class="
        bg-white
        border
        border-red-200
        rounded-xl
        p-6
      "
    >

      <div
        class="
          flex
          items-start
          gap-3
          text-red-600
        "
      >

        <span
          class="
            material-symbols-outlined
          "
        >
          error
        </span>

        <div>

          <div
            class="
              font-bold
            "
          >
            Rekap penjualan gagal dimuat.
          </div>

          <div
            class="
              text-sm
              text-slate-500
              mt-1
            "
          >
            Periksa koneksi Firebase
            dan data pesanan.
          </div>

          <div
            class="
              text-xs
              text-red-500
              mt-2
            "
          >
            ${escapeHtml(
              message
            )}
          </div>

        </div>

      </div>

    </div>

  `;

}


/*
|---------------------------------------------------------------------------
| UTILITAS
|---------------------------------------------------------------------------
*/

function normalizeText(
  value
) {
  return String(
    value ?? ""
  ).trim();
}


function compareIndonesian(
  a,
  b
) {
  return String(a).localeCompare(
    String(b),
    "id-ID",
    {
      sensitivity:
        "base"
    }
  );
}


function escapeHtml(
  value
) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


function escapeAttribute(
  value
) {
  return escapeHtml(
    value
  );
}