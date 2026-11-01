import { renderLayout } from "../components/layout.js";

import {
  getOrders,
  deleteOrder
} from "../services/orders.service.js";

import {
  getClasses
} from "../services/classes.service.js";

import {
  getRooms
} from "../services/rooms.service.js";


/*
|--------------------------------------------------------------------------
| DATA GLOBAL
|--------------------------------------------------------------------------
*/

let currentOrders = [];

let masterClasses = [];

let masterRooms = [];


/*
|--------------------------------------------------------------------------
| MAIN
|--------------------------------------------------------------------------
*/

export async function renderOrders() {

  try {

    /*
     * Ambil data pesanan dan Master Data
     * secara bersamaan.
     */
    const [
      orders,
      classes,
      rooms
    ] = await Promise.all([

      getOrders(),

      getClasses(),

      getRooms()

    ]);


    currentOrders =
      Array.isArray(orders)
        ? orders
        : [];


    masterClasses =
      Array.isArray(classes)
        ? classes
        : [];


    masterRooms =
      Array.isArray(rooms)
        ? rooms
        : [];


    renderLayout({

      pageTitle:
        "Semua Pesanan",

      pageSubtitle:
        "Daftar seluruh pesanan santri",

      content: renderPage()

    });


    renderOrdersTable();

    setupOrderEvents();


  } catch (error) {

    console.error(
      "Gagal memuat halaman pesanan:",
      error
    );


    renderLayout({

      pageTitle:
        "Semua Pesanan",

      pageSubtitle:
        "Daftar seluruh pesanan santri",

      content: `

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
            "
          >

            <span
              class="
                material-symbols-outlined
                text-red-600
              "
            >
              error
            </span>

            <div>

              <h2
                class="
                  font-bold
                  text-red-700
                "
              >
                Gagal memuat data pesanan
              </h2>

              <p
                class="
                  text-sm
                  text-slate-500
                  mt-1
                "
              >
                Periksa koneksi Firebase kemudian
                coba refresh halaman.
              </p>

              <p
                class="
                  text-xs
                  text-red-500
                  mt-2
                "
              >
                ${escapeHtml(
                  error.message
                )}
              </p>

            </div>

          </div>

        </div>

      `

    });

  }

}


/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

function renderPage() {

  return `

    <div
      class="
        space-y-5
      "
    >


      <!-- =====================================
           HEADER
      ====================================== -->

      <section>

        <div
          class="
            flex
            flex-col
            sm:flex-row
            sm:items-end
            sm:justify-between
            gap-3
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
              DATA PESANAN
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
              Semua Pesanan
            </h1>


            <p
              class="
                text-sm
                text-slate-500
                mt-1
              "
            >
              Kelola seluruh pesanan santri.
            </p>

          </div>


          <a
            href="#/tambah-pesanan"
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
              hover:bg-[#084229]
            "
          >

            <span
              class="
                material-symbols-outlined
                text-[20px]
              "
            >
              add
            </span>

            Tambah Pesanan

          </a>

        </div>

      </section>



      <!-- =====================================
           FILTER
      ====================================== -->

      <section
        class="
          bg-white
          border
          border-slate-200
          rounded-xl
          p-4
        "
      >

        <div
          class="
            grid
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-4
            gap-3
          "
        >


          <!-- DARI -->

          <div>

            <label
              class="
                block
                text-xs
                font-semibold
                text-slate-600
                mb-1.5
              "
            >
              Dari
            </label>


            <input
              id="filter-date-from"
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



          <!-- SAMPAI -->

          <div>

            <label
              class="
                block
                text-xs
                font-semibold
                text-slate-600
                mb-1.5
              "
            >
              Sampai
            </label>


            <input
              id="filter-date-to"
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



          <!-- NAMA -->

          <div>

            <label
              class="
                block
                text-xs
                font-semibold
                text-slate-600
                mb-1.5
              "
            >
              Nama
            </label>


            <input
              id="filter-name"
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



          <!-- KELAS -->

          <div>

            <label
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
              id="filter-class"
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

              ${renderClassFilterOptions()}

            </select>

          </div>



          <!-- KAMAR -->

          <div>

            <label
              class="
                block
                text-xs
                font-semibold
                text-slate-600
                mb-1.5
              "
            >
              Kamar
            </label>


            <select
              id="filter-room"
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

              ${renderRoomFilterOptions()}

            </select>

          </div>



          <!-- RESET -->

          <div
            class="
              flex
              items-end
            "
          >

            <button
              id="reset-filter"
              type="button"
              class="
                w-full
                h-10
                rounded-lg
                border
                border-slate-300
                bg-white
                text-sm
                font-semibold
                text-slate-700
                hover:bg-slate-50
              "
            >
              Reset Filter
            </button>

          </div>


        </div>


        <!-- ERROR RANGE -->

        <div
          id="filter-range-error"
          class="
            hidden
            mt-3
            px-3
            py-2
            rounded-lg
            bg-red-50
            border
            border-red-200
            text-xs
            font-semibold
            text-red-600
          "
        >
          Tanggal "Dari" tidak boleh lebih besar
          dari tanggal "Sampai".
        </div>


      </section>



      <!-- =====================================
           TABLE
      ====================================== -->

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
            px-4
            py-3
            bg-slate-50
            border-b
            border-slate-200
            flex
            items-center
            justify-between
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
              Daftar Pesanan
            </h2>


            <p
              id="orders-count"
              class="
                text-xs
                text-slate-500
                mt-0.5
              "
            >
              Memuat data...
            </p>

          </div>


          <button
            id="refresh-orders"
            type="button"
            class="
              w-9
              h-9
              rounded-lg
              hover:bg-white
              flex
              items-center
              justify-center
            "
            title="Refresh"
          >

            <span
              class="
                material-symbols-outlined
                text-[20px]
              "
            >
              refresh
            </span>

          </button>

        </div>



        <div
          class="
            overflow-x-auto
          "
        >

          <table
            class="
              w-full
              text-sm
            "
          >

            <thead>

              <tr
                class="
                  border-b
                  border-slate-200
                  bg-slate-50/50
                "
              >

                <th
                  class="
                    px-4
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
                    px-4
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
                    px-4
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
                    px-4
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
                    px-4
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
                    px-4
                    py-3
                    text-left
                    text-xs
                    font-bold
                    text-slate-500
                  "
                >
                  Pesanan
                </th>


                <th
                  class="
                    px-4
                    py-3
                    text-center
                    text-xs
                    font-bold
                    text-slate-500
                  "
                >
                  Status
                </th>


                <th
                  class="
                    px-4
                    py-3
                    text-center
                    text-xs
                    font-bold
                    text-slate-500
                  "
                >
                  Aksi
                </th>

              </tr>

            </thead>


            <tbody
              id="orders-table-body"
            >

              <tr>

                <td
                  colspan="8"
                  class="
                    px-4
                    py-12
                    text-center
                    text-slate-400
                  "
                >
                  Memuat pesanan...
                </td>

              </tr>

            </tbody>

          </table>

        </div>

      </section>


    </div>

  `;
}


/*
|--------------------------------------------------------------------------
| LOAD ORDERS
|--------------------------------------------------------------------------
*/

async function loadOrders() {

  const tbody =
    document.querySelector(
      "#orders-table-body"
    );


  if (!tbody) {
    return;
  }


  try {

    tbody.innerHTML = `

      <tr>

        <td
          colspan="8"
          class="
            px-4
            py-12
            text-center
            text-slate-400
          "
        >

          <div
            class="
              flex
              flex-col
              items-center
              gap-2
            "
          >

            <span
              class="
                material-symbols-outlined
                animate-spin
              "
            >
              progress_activity
            </span>

            Memuat pesanan...

          </div>

        </td>

      </tr>

    `;


    currentOrders =
      await getOrders();


    if (
      !Array.isArray(
        currentOrders
      )
    ) {

      currentOrders = [];

    }


    renderOrdersTable();


  } catch (error) {

    console.error(
      "Gagal mengambil pesanan:",
      error
    );


    tbody.innerHTML = `

      <tr>

        <td
          colspan="8"
          class="
            px-4
            py-12
            text-center
            text-red-500
          "
        >
          Gagal mengambil data dari Firebase.
        </td>

      </tr>

    `;

  }

}


/*
|--------------------------------------------------------------------------
| RENDER TABLE
|--------------------------------------------------------------------------
*/

function renderOrdersTable() {

  const tbody =
    document.querySelector(
      "#orders-table-body"
    );


  const count =
    document.querySelector(
      "#orders-count"
    );


  if (!tbody) {
    return;
  }


  const filteredOrders =
    getFilteredOrders();


  if (count) {

    count.textContent =
      `${filteredOrders.length} pesanan`;

  }


  if (
    filteredOrders.length ===
    0
  ) {

    tbody.innerHTML = `

      <tr>

        <td
          colspan="8"
          class="
            px-4
            py-12
            text-center
            text-slate-400
          "
        >

          <div
            class="
              flex
              flex-col
              items-center
            "
          >

            <span
              class="
                material-symbols-outlined
                text-[42px]
                text-slate-300
              "
            >
              receipt_long
            </span>


            <div
              class="
                mt-2
                font-semibold
                text-slate-600
              "
            >
              Belum ada pesanan
            </div>


            <div
              class="
                text-xs
                mt-1
              "
            >
              Tidak ada pesanan yang
              sesuai dengan filter.
            </div>

          </div>

        </td>

      </tr>

    `;

    return;

  }


  tbody.innerHTML =
    filteredOrders
      .map(
        (
          order,
          index
        ) => {

          const items =
            Array.isArray(
              order.items
            )
              ? order.items
              : [];


          const itemText =
            items
              .map(
                (item) => {

                  const nama =
                    escapeHtml(
                      item.namaMenu ||
                      "-"
                    );


                  const jumlah =
                    Number(
                      item.jumlah
                    ) || 0;


                  return `
                    ${nama}
                    × ${jumlah}
                  `;

                }
              )
              .join("<br>");


          return `

            <tr
              class="
                border-b
                border-slate-100
                hover:bg-slate-50
              "
            >

              <td
                class="
                  px-4
                  py-3
                  font-tnum
                  text-slate-500
                "
              >
                ${index + 1}
              </td>


              <td
                class="
                  px-4
                  py-3
                  whitespace-nowrap
                "
              >
                ${formatDate(
                  order.tanggal
                )}
              </td>


              <td
                class="
                  px-4
                  py-3
                  font-semibold
                  text-slate-900
                "
              >
                ${escapeHtml(
                  order.nama
                )}
              </td>


              <td
                class="
                  px-4
                  py-3
                "
              >
                ${escapeHtml(
                  order.kamar
                )}
              </td>


              <td
                class="
                  px-4
                  py-3
                "
              >
                ${escapeHtml(
                  order.kelas
                )}
              </td>


              <td
                class="
                  px-4
                  py-3
                "
              >

                <div
                  class="
                    leading-6
                  "
                >
                  ${itemText || "-"}
                </div>

              </td>


              <td
                class="
                  px-4
                  py-3
                  text-center
                "
              >
                ${statusBadge(
                  order.status
                )}
              </td>


              <td
                class="
                  px-4
                  py-3
                "
              >

                <div
                  class="
                    flex
                    items-center
                    justify-center
                    gap-1
                  "
                >

                  <a
                    href="#/tambah-pesanan?id=${encodeURIComponent(
                      order.id
                    )}"
                    class="
                      w-8
                      h-8
                      rounded-lg
                      hover:bg-blue-50
                      text-blue-600
                      flex
                      items-center
                      justify-center
                    "
                    title="Edit"
                  >

                    <span
                      class="
                        material-symbols-outlined
                        text-[19px]
                      "
                    >
                      edit
                    </span>

                  </a>


                  <button
                    type="button"
                    data-delete-order="${escapeAttribute(
                      order.id
                    )}"
                    class="
                      w-8
                      h-8
                      rounded-lg
                      hover:bg-red-50
                      text-red-600
                      flex
                      items-center
                      justify-center
                    "
                    title="Hapus"
                  >

                    <span
                      class="
                        material-symbols-outlined
                        text-[19px]
                      "
                    >
                      delete
                    </span>

                  </button>

                </div>

              </td>

            </tr>

          `;

        }
      )
      .join("");


  setupDeleteButtons();

}


/*
|--------------------------------------------------------------------------
| FILTER
|--------------------------------------------------------------------------
*/

function getFilteredOrders() {

  const from =
    document
      .querySelector(
        "#filter-date-from"
      )
      ?.value || "";


  const to =
    document
      .querySelector(
        "#filter-date-to"
      )
      ?.value || "";


  const name =
    document
      .querySelector(
        "#filter-name"
      )
      ?.value
      .trim()
      .toLowerCase() || "";


  const kelas =
    document
      .querySelector(
        "#filter-class"
      )
      ?.value
      .trim()
      .toLowerCase() || "";


  const kamar =
    document
      .querySelector(
        "#filter-room"
      )
      ?.value
      .trim()
      .toLowerCase() || "";


  /*
   * Validasi range tanggal.
   */

  const rangeError =
    document.querySelector(
      "#filter-range-error"
    );


  if (
    from &&
    to &&
    from > to
  ) {

    if (rangeError) {
      rangeError.classList.remove(
        "hidden"
      );
    }


    return [];

  }


  if (rangeError) {
    rangeError.classList.add(
      "hidden"
    );
  }


  return currentOrders.filter(
    (order) => {

      const orderDate =
        String(
          order.tanggal || ""
        );


      /*
       * Filter Dari.
       */
      if (
        from &&
        orderDate < from
      ) {

        return false;

      }


      /*
       * Filter Sampai.
       */
      if (
        to &&
        orderDate > to
      ) {

        return false;

      }


      /*
       * Filter Nama.
       */
      if (
        name &&
        !String(
          order.nama || ""
        )
          .toLowerCase()
          .includes(name)
      ) {

        return false;

      }


      /*
       * Filter Kelas.
       */
      if (
        kelas &&
        String(
          order.kelas || ""
        )
          .toLowerCase() !==
        kelas
      ) {

        return false;

      }


      /*
       * Filter Kamar.
       */
      if (
        kamar &&
        String(
          order.kamar || ""
        )
          .toLowerCase() !==
        kamar
      ) {

        return false;

      }


      return true;

    }
  );

}


/*
|--------------------------------------------------------------------------
| CLASS FILTER OPTIONS
|--------------------------------------------------------------------------
*/

function renderClassFilterOptions() {

  const names =
    collectMasterAndOrderValues(
      masterClasses,
      "kelas"
    );


  return `

    <option value="">
      Semua kelas
    </option>

    ${
      names
        .map(
          (item) => {

            return `
              <option
                value="${escapeAttribute(
                  item.nama
                )}"
              >
                ${escapeHtml(
                  item.label
                )}
              </option>
            `;

          }
        )
        .join("")
    }

  `;

}


/*
|--------------------------------------------------------------------------
| ROOM FILTER OPTIONS
|--------------------------------------------------------------------------
*/

function renderRoomFilterOptions() {

  const names =
    collectMasterAndOrderValues(
      masterRooms,
      "kamar"
    );


  return `

    <option value="">
      Semua kamar
    </option>

    ${
      names
        .map(
          (item) => {

            return `
              <option
                value="${escapeAttribute(
                  item.nama
                )}"
              >
                ${escapeHtml(
                  item.label
                )}
              </option>
            `;

          }
        )
        .join("")
    }

  `;

}


/*
|--------------------------------------------------------------------------
| MASTER VALUE HELPER
|--------------------------------------------------------------------------
*/

function collectMasterAndOrderValues(
  masterItems,
  orderField
) {

  const map =
    new Map();


  /*
   * Masukkan Master Data.
   */
  masterItems.forEach(
    (item) => {

      const nama =
        String(
          item.nama || ""
        ).trim();


      if (!nama) {
        return;
      }


      map.set(
        nama.toLowerCase(),
        {
          nama,
          label:
            item.aktif === false
              ? `${nama} (Nonaktif)`
              : nama
        }
      );

    }
  );


  /*
   * Tambahkan nilai dari pesanan lama
   * apabila belum ada di Master Data.
   *
   * Ini menjaga kompatibilitas data lama.
   */
  currentOrders.forEach(
    (order) => {

      const nama =
        String(
          order?.[orderField] ||
          ""
        ).trim();


      if (!nama) {
        return;
      }


      const key =
        nama.toLowerCase();


      if (!map.has(key)) {

        map.set(
          key,
          {
            nama,
            label: nama
          }
        );

      }

    }
  );


  return [
    ...map.values()
  ].sort(
    (a, b) =>
      a.nama.localeCompare(
        b.nama,
        "id",
        {
          numeric: true,
          sensitivity: "base"
        }
      )
  );

}


/*
|--------------------------------------------------------------------------
| EVENTS
|--------------------------------------------------------------------------
*/

function setupOrderEvents() {

  const filterSelectors = [

    "#filter-date-from",

    "#filter-date-to",

    "#filter-name",

    "#filter-class",

    "#filter-room"

  ];


  filterSelectors.forEach(
    (selector) => {

      const element =
        document.querySelector(
          selector
        );


      if (!element) {
        return;
      }


      element.addEventListener(
        "input",
        renderOrdersTable
      );


      element.addEventListener(
        "change",
        renderOrdersTable
      );

    }
  );


  /*
   * Reset.
   */

  document
    .querySelector(
      "#reset-filter"
    )
    ?.addEventListener(
      "click",
      () => {

        document.querySelector(
          "#filter-date-from"
        ).value = "";


        document.querySelector(
          "#filter-date-to"
        ).value = "";


        document.querySelector(
          "#filter-name"
        ).value = "";


        document.querySelector(
          "#filter-class"
        ).value = "";


        document.querySelector(
          "#filter-room"
        ).value = "";


        renderOrdersTable();

      }
    );


  /*
   * Refresh.
   */

  document
    .querySelector(
      "#refresh-orders"
    )
    ?.addEventListener(
      "click",
      async () => {

        await loadOrders();

      }
    );

}


/*
|--------------------------------------------------------------------------
| DELETE
|--------------------------------------------------------------------------
*/

function setupDeleteButtons() {

  document
    .querySelectorAll(
      "[data-delete-order]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          async () => {

            const orderId =
              button.dataset.deleteOrder;


            const confirmed =
              window.confirm(
                "Yakin ingin menghapus pesanan ini?"
              );


            if (!confirmed) {
              return;
            }


            try {

              button.disabled =
                true;


              await deleteOrder(
                orderId
              );


              await loadOrders();


            } catch (error) {

              console.error(
                "Gagal menghapus pesanan:",
                error
              );


              alert(
                "Pesanan gagal dihapus. Periksa koneksi Firebase."
              );


              button.disabled =
                false;

            }

          }
        );

      }
    );

}


/*
|--------------------------------------------------------------------------
| STATUS BADGE
|--------------------------------------------------------------------------
*/

function statusBadge(
  status
) {

  if (
    status ===
    "sudah_dibagikan"
  ) {

    return `

      <span
        class="
          inline-flex
          items-center
          gap-1
          px-2
          py-1
          rounded-full
          bg-emerald-50
          text-primary
          text-[11px]
          font-semibold
        "
      >

        <span
          class="
            material-symbols-outlined
            text-[15px]
          "
        >
          check_circle
        </span>

        Selesai

      </span>

    `;

  }


  if (
    status ===
    "sebagian"
  ) {

    return `

      <span
        class="
          inline-flex
          items-center
          gap-1
          px-2
          py-1
          rounded-full
          bg-amber-50
          text-amber-700
          text-[11px]
          font-semibold
        "
      >
        Sebagian
      </span>

    `;

  }


  return `

    <span
      class="
        inline-flex
        items-center
        gap-1
        px-2
        py-1
        rounded-full
        bg-slate-100
        text-slate-600
        text-[11px]
        font-semibold
      "
    >
      Belum Dibagikan
    </span>

  `;

}


/*
|--------------------------------------------------------------------------
| DATE FORMAT
|--------------------------------------------------------------------------
*/

function formatDate(
  value
) {

  if (!value) {
    return "-";
  }


  const parts =
    String(value).split(
      "-"
    );


  if (
    parts.length !== 3
  ) {

    return value;

  }


  return `${parts[2]}/${parts[1]}/${parts[0]}`;

}


/*
|--------------------------------------------------------------------------
| ESCAPE HTML
|--------------------------------------------------------------------------
*/

function escapeHtml(
  value
) {

  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}


/*
|--------------------------------------------------------------------------
| ESCAPE ATTRIBUTE
|--------------------------------------------------------------------------
*/

function escapeAttribute(
  value
) {

  return escapeHtml(
    value
  );

}