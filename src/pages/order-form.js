import { renderLayout } from "../components/layout.js";

import {
  createOrder,
  getOrderById,
  updateOrder
} from "../services/orders.service.js";

import {
  getMenus
} from "../services/menus.service.js";

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

let availableMenus = [];
let availableClasses = [];
let availableRooms = [];

let existingOrderData = null;


/*
|--------------------------------------------------------------------------
| MAIN
|--------------------------------------------------------------------------
*/

export async function renderOrderForm() {

  const params =
    new URLSearchParams(
      window.location.hash.split("?")[1] || ""
    );

  const orderId =
    params.get("id");

  const isEdit =
    Boolean(orderId);


  try {

    /*
     * Ambil semua Master Data
     * secara bersamaan.
     */

    const [
      menus,
      classes,
      rooms
    ] = await Promise.all([
      getMenus(),
      getClasses(),
      getRooms()
    ]);


    /*
     * Hanya menu aktif yang
     * tersedia untuk pesanan baru.
     */

    availableMenus =
      Array.isArray(menus)
        ? menus.filter(
            (menu) =>
              menu.aktif !== false
          )
        : [];


    /*
     * Hanya kelas aktif yang
     * tersedia sebagai pilihan baru.
     */

    availableClasses =
      Array.isArray(classes)
        ? classes.filter(
            (item) =>
              item.aktif !== false
          )
        : [];


    /*
     * Hanya kamar aktif yang
     * tersedia sebagai pilihan baru.
     */

    availableRooms =
      Array.isArray(rooms)
        ? rooms.filter(
            (item) =>
              item.aktif !== false
          )
        : [];


    /*
     * Kalau mode edit,
     * ambil pesanan lama.
     */

    if (isEdit) {

      existingOrderData =
        await getOrderById(
          orderId
        );


      if (!existingOrderData) {

        alert(
          "Pesanan tidak ditemukan."
        );

        window.location.hash =
          "#/pesanan";

        return;
      }

    } else {

      existingOrderData =
        null;
    }


    /*
     * Render halaman.
     */

    renderLayout({

      pageTitle:
        isEdit
          ? "Edit Pesanan"
          : "Tambah Pesanan",

      pageSubtitle:
        isEdit
          ? "Mengubah data pesanan santri"
          : "Menambahkan pesanan baru",

      content:
        renderForm(
          existingOrderData
        )

    });


    setupForm(
      existingOrderData
    );


  } catch (error) {

    console.error(
      "Gagal memuat form pesanan:",
      error
    );


    renderLayout({

      pageTitle:
        isEdit
          ? "Edit Pesanan"
          : "Tambah Pesanan",

      pageSubtitle:
        "Data pesanan",

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
              items-center
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
                class="font-bold"
              >
                Form pesanan gagal dimuat.
              </div>

              <div
                class="
                  text-sm
                  text-slate-500
                  mt-1
                "
              >
                Pastikan Firebase, Master Menu,
                Master Kelas, dan Master Kamar
                dapat diakses.
              </div>

              <div
                class="
                  text-xs
                  text-red-500
                  mt-2
                "
              >
                ${escapeHtml(
                  error.message
                )}
              </div>

            </div>

          </div>

        </div>

      `

    });

  }

}


/*
|-------------------------------------------------------------------------- 
| FORM HTML
|--------------------------------------------------------------------------
*/

function renderForm(
  order
) {

  let items =
    order?.items?.length
      ? order.items
      : [
          {
            menuId: "",
            namaMenu: "",
            kategori: "Makanan",
            varian: "",
            ukuran: "",
            jumlah: 1,
            hargaSatuan: null,
            subtotal: null,
            dibagikan: false
          }
        ];


  return `

    <div
      class="
        max-w-5xl
        mx-auto
        space-y-5
      "
    >


      <!-- =====================================
           HEADER
      ====================================== -->

      <section>

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
          ${
            order
              ? "Edit Pesanan"
              : "Tambah Pesanan Baru"
          }
        </h1>


        <p
          class="
            text-sm
            text-slate-500
            mt-1
          "
        >
          Masukkan data santri dan daftar pesanannya.
        </p>

      </section>



      <form
        id="order-form"
        class="space-y-5"
      >


        <!-- =====================================
             DATA SANTRI
        ====================================== -->

        <section
          class="
            bg-white
            border
            border-slate-200
            rounded-xl
            p-5
          "
        >

          <h2
            class="
              text-sm
              font-bold
              text-slate-900
              mb-4
            "
          >
            Data Santri
          </h2>


          <div
            class="
              grid
              grid-cols-1
              sm:grid-cols-2
              gap-4
            "
          >


            <!-- TANGGAL -->

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
                Tanggal *
              </label>


              <input
                id="order-tanggal"
                type="date"
                required
                value="${
                  escapeAttribute(
                    order?.tanggal ||
                    getToday()
                  )
                }"
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
                Nama Santri *
              </label>


              <input
                id="order-nama"
                type="text"
                required
                autocomplete="off"
                placeholder="Nama lengkap"
                value="${
                  escapeAttribute(
                    order?.nama || ""
                  )
                }"
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
                Kelas *
              </label>


              <select
                id="order-kelas"
                required
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

                ${renderClassOptions(
                  order?.kelas || ""
                )}

              </select>


              <p
                class="
                  mt-1
                  text-[11px]
                  text-slate-400
                "
              >
                Pilih dari Master Kelas.
              </p>

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
                Asrama / Kamar *
              </label>


              <select
                id="order-kamar"
                required
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

                ${renderRoomOptions(
                  order?.kamar || ""
                )}

              </select>


              <p
                class="
                  mt-1
                  text-[11px]
                  text-slate-400
                "
              >
                Pilih dari Master Kamar / Asrama.
              </p>

            </div>

          </div>



          <!-- CATATAN -->

          <div class="mt-4">

            <label
              class="
                block
                text-xs
                font-semibold
                text-slate-600
                mb-1.5
              "
            >
              Catatan
            </label>


            <textarea
              id="order-catatan"
              rows="3"
              placeholder="Catatan tambahan jika ada..."
              class="
                w-full
                px-3
                py-2.5
                rounded-lg
                border
                border-slate-300
                text-sm
                outline-none
                focus:border-primary
                focus:ring-2
                focus:ring-primary/20
                resize-y
              "
            >${
              escapeHtml(
                order?.catatan || ""
              )
            }</textarea>

          </div>

        </section>



        <!-- =====================================
             DAFTAR PESANAN
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
              px-5
              py-4
              bg-slate-50
              border-b
              border-slate-200
              flex
              items-center
              justify-between
              gap-3
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
                class="
                  text-xs
                  text-slate-500
                  mt-0.5
                "
              >
                Pilih menu dari Data Master Menu.
              </p>

            </div>


            <button
              id="add-item"
              type="button"
              class="
                inline-flex
                items-center
                gap-1.5
                px-3
                py-2
                rounded-lg
                bg-primary
                text-white
                text-xs
                font-semibold
                hover:opacity-90
              "
            >

              <span
                class="
                  material-symbols-outlined
                  text-[18px]
                "
              >
                add
              </span>

              Tambah Item

            </button>

          </div>



          <div
            id="order-items"
            class="
              p-5
              space-y-3
            "
          >

            ${
              items
                .map(
                  (item, index) =>
                    renderItemRow(
                      item,
                      index
                    )
                )
                .join("")
            }

          </div>

        </section>



        <!-- =====================================
             ACTION
        ====================================== -->

        <section
          class="
            flex
            flex-col-reverse
            sm:flex-row
            sm:justify-end
            gap-2
          "
        >

          <a
            href="#/pesanan"
            class="
              inline-flex
              items-center
              justify-center
              px-5
              py-2.5
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
            Batal
          </a>


          <button
            type="submit"
            id="save-order"
            class="
              inline-flex
              items-center
              justify-center
              gap-2
              px-5
              py-2.5
              rounded-lg
              bg-primary
              text-white
              text-sm
              font-semibold
              hover:opacity-90
            "
          >

            <span
              class="
                material-symbols-outlined
                text-[19px]
              "
            >
              save
            </span>

            ${
              order
                ? "Simpan Perubahan"
                : "Simpan Pesanan"
            }

          </button>

        </section>


      </form>

    </div>

  `;
}


/*
|--------------------------------------------------------------------------
| OPTION MASTER KELAS
|--------------------------------------------------------------------------
*/

function renderClassOptions(
  selectedValue = ""
) {

  const normalizedSelected =
    String(
      selectedValue
    ).trim();


  const activeClasses =
    [...availableClasses];


  /*
   * Kalau sedang edit dan kelas
   * lama sudah dinonaktifkan,
   * tetap tampilkan agar data lama
   * tidak hilang.
   */

  const selectedInactive =
    normalizedSelected &&
    !activeClasses.some(
      (item) =>
        String(
          item.nama || ""
        ).trim() ===
        normalizedSelected
    );


  let options = "";


  if (selectedInactive) {

    options += `
      <option
        value="${escapeAttribute(
          normalizedSelected
        )}"
        selected
      >
        ${escapeHtml(
          normalizedSelected
        )} (Nonaktif)
      </option>
    `;
  }


  options += `
    <option
      value=""
      ${
        !normalizedSelected
          ? "selected"
          : ""
      }
    >
      -- Pilih Kelas --
    </option>
  `;


  options +=
    activeClasses
      .map(
        (item) => {

          const nama =
            String(
              item.nama || ""
            ).trim();

          if (!nama) {
            return "";
          }

          return `
            <option
              value="${escapeAttribute(
                nama
              )}"
              ${
                nama ===
                normalizedSelected
                  ? "selected"
                  : ""
              }
            >
              ${escapeHtml(
                nama
              )}
            </option>
          `;
        }
      )
      .join("");


  return options;
}


/*
|--------------------------------------------------------------------------
| OPTION MASTER KAMAR
|--------------------------------------------------------------------------
*/

function renderRoomOptions(
  selectedValue = ""
) {

  const normalizedSelected =
    String(
      selectedValue
    ).trim();


  const activeRooms =
    [...availableRooms];


  /*
   * Kalau sedang edit dan kamar
   * lama sudah dinonaktifkan,
   * tetap tampilkan agar data lama
   * tidak hilang.
   */

  const selectedInactive =
    normalizedSelected &&
    !activeRooms.some(
      (item) =>
        String(
          item.nama || ""
        ).trim() ===
        normalizedSelected
    );


  let options = "";


  if (selectedInactive) {

    options += `
      <option
        value="${escapeAttribute(
          normalizedSelected
        )}"
        selected
      >
        ${escapeHtml(
          normalizedSelected
        )} (Nonaktif)
      </option>
    `;
  }


  options += `
    <option
      value=""
      ${
        !normalizedSelected
          ? "selected"
          : ""
      }
    >
      -- Pilih Asrama / Kamar --
    </option>
  `;


  options +=
    activeRooms
      .map(
        (item) => {

          const nama =
            String(
              item.nama || ""
            ).trim();

          if (!nama) {
            return "";
          }

          return `
            <option
              value="${escapeAttribute(
                nama
              )}"
              ${
                nama ===
                normalizedSelected
                  ? "selected"
                  : ""
              }
            >
              ${escapeHtml(
                nama
              )}
            </option>
          `;
        }
      )
      .join("");


  return options;
}


/*
|--------------------------------------------------------------------------
| ITEM ROW
|--------------------------------------------------------------------------
*/

function renderItemRow(
  item,
  originalIndex
) {

  const menu =
    availableMenus.find(
      (menuItem) =>
        menuItem.id ===
        item.menuId
    );


  const storedHargaSatuan =
  getValidPrice(
    item.hargaSatuan
  );

const hargaSatuan =
  storedHargaSatuan !== null
    ? storedHargaSatuan
    : getMenuPrice(menu);


  const subtotal =
    getValidPrice(
      item.subtotal
    );


  return `

    <div
      class="
        order-item
        p-3
        rounded-lg
        border
        border-slate-200
        bg-slate-50
      "
      data-item-index="${originalIndex}"
      data-menu-id="${escapeAttribute(
        item.menuId || ""
      )}"
    >


      <div
        class="
          grid
          grid-cols-1
          sm:grid-cols-[minmax(0,1fr)_110px_auto]
          gap-3
          items-end
        "
      >


        <!-- MENU -->

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
            Menu *
          </label>


          <select
            class="
              item-menu
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
            required
          >

            <option value="">
              -- Pilih Menu --
            </option>

            ${
              availableMenus
                .map(
                  (menuItem) => `
                    <option
                      value="${escapeAttribute(
                        menuItem.id
                      )}"
                      ${
                        menuItem.id ===
                        item.menuId
                          ? "selected"
                          : ""
                      }
                    >
                      ${escapeHtml(
                        getMenuDisplayName(
                          menuItem
                        )
                      )}
                    </option>
                  `
                )
                .join("")
            }

          </select>


          ${
            menu
              ? `
                <div
                  class="
                    item-menu-info
                    text-[11px]
                    text-slate-500
                    mt-1
                  "
                >
                  ${escapeHtml(
                    menu.kategori ||
                    ""
                  )}

                  ${
                    menu.varian
                      ? ` · ${escapeHtml(
                          menu.varian
                        )}`
                      : ""
                  }

                  ${
                    menu.ukuran
                      ? ` · ${escapeHtml(
                          menu.ukuran
                        )}`
                      : ""
                  }
                </div>

                <div
                  class="
                    item-price-info
                    text-[11px]
                    text-primary
                    font-semibold
                    mt-0.5
                  "
                >
                  Harga:
                  ${formatRupiah(
                    getValidPrice(
                      menu.hargaJual
                    )
                  )}
                </div>
              `
              : `
                <div
                  class="
                    item-menu-info
                    text-[11px]
                    text-slate-400
                    mt-1
                  "
                >
                  Pilih menu
                </div>

                <div
                  class="
                    item-price-info
                    text-[11px]
                    text-slate-400
                    mt-0.5
                  "
                >
                  Harga belum dipilih
                </div>
              `
          }

        </div>



        <!-- JUMLAH -->

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
            Jumlah *
          </label>


          <input
            type="number"
            min="1"
            step="1"
            class="
              item-quantity
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
            required
            value="${
              Number(
                item.jumlah
              ) || 1
            }"
          />

        </div>



        <!-- DELETE -->

        <button
          type="button"
          class="
            remove-item
            h-10
            px-3
            rounded-lg
            border
            border-red-200
            bg-white
            text-red-600
            hover:bg-red-50
          "
          title="Hapus item"
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


      ${
        hargaSatuan !== null
          ? `
            <div
              class="
                item-subtotal-info
                mt-2
                pt-2
                border-t
                border-slate-200
                text-xs
                text-slate-500
                flex
                items-center
                justify-between
                gap-2
              "
            >

              <span>
                Harga transaksi:
                <strong class="text-slate-700">
                  ${formatRupiah(
                    hargaSatuan
                  )}
                </strong>
              </span>

              ${
                subtotal !== null
                  ? `
                    <span>
                      Subtotal:
                      <strong class="text-primary">
                        ${formatRupiah(
                          subtotal
                        )}
                      </strong>
                    </span>
                  `
                  : ""
              }

            </div>
          `
          : ""
      }

    </div>

  `;
}


/*
|--------------------------------------------------------------------------
| FORM EVENTS
|--------------------------------------------------------------------------
*/

function setupForm(
  existingOrder
) {

  const form =
    document.querySelector(
      "#order-form"
    );

  const itemsContainer =
    document.querySelector(
      "#order-items"
    );


  if (!form || !itemsContainer) {
    return;
  }


  /*
   * Tambah item
   */

  document
    .querySelector(
      "#add-item"
    )
    ?.addEventListener(
      "click",
      () => {

        /*
         * Item baru diberi index -1.
         *
         * Artinya item ini tidak memiliki
         * data lama saat mode edit.
         */

        itemsContainer.insertAdjacentHTML(
          "beforeend",

          renderItemRow(
            {
              menuId: "",
              namaMenu: "",
              kategori: "Makanan",
              varian: "",
              ukuran: "",
              jumlah: 1,
              hargaSatuan: null,
              subtotal: null,
              dibagikan: false
            },
            -1
          )
        );


        setupItemEvents();
        setupRemoveButtons();

      }
    );


  setupItemEvents();
  setupRemoveButtons();


  /*
   * Submit
   */

  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      await saveForm(
        existingOrder
      );

    }
  );
}


/*
|--------------------------------------------------------------------------
| ITEM EVENTS
|--------------------------------------------------------------------------
*/

function setupItemEvents() {

  document
    .querySelectorAll(".item-menu")
    .forEach((select) => {

      /*
       * Hindari memasang handler
       * berkali-kali.
       */
      if (select.dataset.bound !== "true") {

        select.dataset.bound = "true";

        select.addEventListener(
          "change",
          () => {

            const row =
              select.closest(".order-item");

            if (!row) {
              return;
            }

            const menuId =
              select.value;

            const menu =
              availableMenus.find(
                (item) =>
                  item.id === menuId
              );

            /*
             * Kalau menu dikosongkan.
             */
            if (!menu) {

              const info =
                row.querySelector(
                  ".item-menu-info"
                );

              const priceInfo =
                row.querySelector(
                  ".item-price-info"
                );

              if (info) {
                info.textContent =
                  "Pilih menu";
              }

              if (priceInfo) {
                priceInfo.textContent =
                  "Harga belum dipilih";
              }

              row.dataset.menuId = "";
              row.dataset.menuName = "";
              row.dataset.category = "";
              row.dataset.variant = "";
              row.dataset.size = "";

              updateRowSubtotal(
                row,
                null
              );

              return;
            }

            /*
             * Simpan metadata menu
             * di DOM.
             */
            row.dataset.menuId =
              menu.id;

            row.dataset.menuName =
              menu.nama || "";

            row.dataset.category =
              menu.kategori || "Lainnya";

            row.dataset.variant =
              menu.varian || "";

            row.dataset.size =
              menu.ukuran || "";

            /*
             * Ambil harga dari Master Menu.
             */
            const hargaSatuan =
              getMenuPrice(menu);

            /*
             * Informasi menu.
             */
            const info =
              row.querySelector(
                ".item-menu-info"
              );

            if (info) {

              info.textContent = [
                menu.kategori,
                menu.varian,
                menu.ukuran
              ]
                .filter(
                  (value) =>
                    value &&
                    String(value).trim()
                )
                .join(" · ");
            }

            /*
             * Tampilkan harga.
             */
            const priceInfo =
              row.querySelector(
                ".item-price-info"
              );

            if (priceInfo) {

              priceInfo.textContent =
                hargaSatuan !== null
                  ? `Harga: ${formatRupiah(
                      hargaSatuan
                    )}`
                  : "Harga belum diatur";
            }

            /*
             * Hitung subtotal.
             */
            updateRowSubtotal(
              row,
              hargaSatuan
            );
          }
        );
      }
    });


  /*
   * Event jumlah.
   *
   * Kalau jumlah berubah,
   * subtotal langsung dihitung ulang.
   */
  document
    .querySelectorAll(".item-quantity")
    .forEach((input) => {

      if (
        input.dataset.boundQuantity ===
        "true"
      ) {
        return;
      }

      input.dataset.boundQuantity =
        "true";

      input.addEventListener(
        "input",
        () => {

          const row =
            input.closest(
              ".order-item"
            );

          if (!row) {
            return;
          }

          const menuId =
            row.dataset.menuId;

          const menu =
            availableMenus.find(
              (item) =>
                item.id === menuId
            );

          if (!menu) {
            return;
          }

          const hargaSatuan =
            getMenuPrice(menu);

          updateRowSubtotal(
            row,
            hargaSatuan
          );
        }
      );
    });
}


/*
|--------------------------------------------------------------------------
| UPDATE SUBTOTAL BARIS
|--------------------------------------------------------------------------
*/

function updateRowSubtotal(
  row,
  hargaSatuan
) {

  if (!row) {
    return;
  }


  const quantityInput =
    row.querySelector(
      ".item-quantity"
    );


  const jumlah =
    Number(
      quantityInput?.value
    ) || 0;


  const subtotal =
    hargaSatuan !== null &&
    Number.isFinite(
      Number(hargaSatuan)
    )
      ? Number(hargaSatuan) * jumlah
      : null;


  let subtotalInfo =
    row.querySelector(
      ".item-subtotal-info"
    );


  if (
    hargaSatuan === null ||
    subtotal === null
  ) {

    subtotalInfo?.remove();

    return;
  }


  if (!subtotalInfo) {

    subtotalInfo =
      document.createElement(
        "div"
      );

    subtotalInfo.className =
      `
        item-subtotal-info
        mt-2
        pt-2
        border-t
        border-slate-200
        text-xs
        text-slate-500
        flex
        items-center
        justify-between
        gap-2
      `;

    row.appendChild(
      subtotalInfo
    );
  }


  subtotalInfo.innerHTML = `

    <span>
      Harga transaksi:
      <strong class="text-slate-700">
        ${formatRupiah(
          hargaSatuan
        )}
      </strong>
    </span>

    <span>
      Subtotal:
      <strong class="text-primary">
        ${formatRupiah(
          subtotal
        )}
      </strong>
    </span>

  `;
}


/*
|--------------------------------------------------------------------------
| REMOVE ITEM
|--------------------------------------------------------------------------
*/

function setupRemoveButtons() {

  document
    .querySelectorAll(
      ".remove-item"
    )
    .forEach(
      (button) => {

        if (
          button.dataset.bound ===
          "true"
        ) {
          return;
        }

        button.dataset.bound =
          "true";


        button.onclick = () => {

          const rows =
            document.querySelectorAll(
              ".order-item"
            );


          if (rows.length <= 1) {

            alert(
              "Minimal harus ada satu item pesanan."
            );

            return;
          }


          button
            .closest(
              ".order-item"
            )
            ?.remove();

        };

      }
    );
}


/*
|--------------------------------------------------------------------------
| SAVE
|--------------------------------------------------------------------------
*/

async function saveForm(
  existingOrder
) {

  const saveButton =
    document.querySelector(
      "#save-order"
    );


  const rows =
    [
      ...document.querySelectorAll(
        ".order-item"
      )
    ];


  const items = [];


  for (
    const row of rows
  ) {

    const menuSelect =
      row.querySelector(
        ".item-menu"
      );

    const quantityInput =
      row.querySelector(
        ".item-quantity"
      );


    if (
      !menuSelect ||
      !quantityInput
    ) {
      continue;
    }


    const menuId =
      menuSelect.value;


    const menu =
      availableMenus.find(
        (item) =>
          item.id ===
          menuId
      );


    if (!menu) {

      alert(
        "Semua item harus memilih menu."
      );

      menuSelect.focus();

      return;
    }


    const jumlah =
      Number(
        quantityInput.value
      );


    if (
      !Number.isInteger(
        jumlah
      ) ||
      jumlah < 1
    ) {

      alert(
        "Jumlah pesanan harus berupa angka minimal 1."
      );

      quantityInput.focus();

      return;
    }


    /*
     * Kalau edit, pertahankan
     * status distribusi item lama.
     */

    const oldIndex =
      Number(
        row.dataset.itemIndex
      );


    const oldItem =
      oldIndex >= 0
        ? existingOrder
            ?.items?.[
              oldIndex
            ]
        : null;


    /*
     * ==========================================================
     * LOGIKA SNAPSHOT HARGA
     * ==========================================================
     *
     * 1. Edit + menu sama:
     *    gunakan harga lama.
     *
     * 2. Edit + menu berubah:
     *    gunakan harga Master Menu sekarang.
     *
     * 3. Item baru:
     *    gunakan harga Master Menu sekarang.
     *
     * 4. Pesanan lama belum punya harga:
     *    tetap null.
     *
     * Dengan demikian perubahan harga Master Menu
     * tidak mengubah transaksi lama.
     */

    const sameExistingMenu =
      oldItem &&
      oldItem.menuId ===
        menu.id;


    let hargaSatuan = null;


    if (sameExistingMenu) {

      hargaSatuan =
        getValidPrice(
          oldItem.hargaSatuan
        );

    } else {

      hargaSatuan =
        getValidPrice(
          menu.hargaJual
        );

    }


    const subtotal =
      hargaSatuan !== null
        ? hargaSatuan * jumlah
        : null;


    items.push({

      menuId:
        menu.id,

      namaMenu:
        menu.nama,

      kategori:
        menu.kategori ||
        "Lainnya",

      varian:
        menu.varian ||
        "",

      ukuran:
        menu.ukuran ||
        "",

      jumlah,

      /*
       * Harga snapshot transaksi.
       */

      hargaSatuan,

      subtotal,

      dibagikan:
        oldItem?.dibagikan === true

    });

  }


  const tanggal =
    document
      .querySelector(
        "#order-tanggal"
      )
      ?.value || "";


  const nama =
    document
      .querySelector(
        "#order-nama"
      )
      ?.value
      .trim() || "";


  const kelas =
    document
      .querySelector(
        "#order-kelas"
      )
      ?.value
      .trim() || "";


  const kamar =
    document
      .querySelector(
        "#order-kamar"
      )
      ?.value
      .trim() || "";


  const catatan =
    document
      .querySelector(
        "#order-catatan"
      )
      ?.value
      .trim() || "";


  const data = {

    tanggal,

    nama,

    kelas,

    kamar,

    catatan,

    items

  };


  if (
    !data.tanggal ||
    !data.nama ||
    !data.kelas ||
    !data.kamar
  ) {

    alert(
      "Tanggal, nama, kelas, dan kamar wajib dipilih/diisi."
    );

    return;
  }


  if (!items.length) {

    alert(
      "Minimal harus ada satu item pesanan."
    );

    return;
  }


  try {

    saveButton.disabled =
      true;


    saveButton.innerHTML = `

      <span
        class="
          material-symbols-outlined
          animate-spin
          text-[19px]
        "
      >
        progress_activity
      </span>

      Menyimpan...

    `;


    if (existingOrder) {

      await updateOrder(
        existingOrder.id,
        data
      );

    } else {

      await createOrder(
        data
      );

    }


    alert(
      existingOrder
        ? "Pesanan berhasil diperbarui."
        : "Pesanan berhasil disimpan."
    );


    window.location.hash =
      "#/pesanan";


  } catch (error) {

    console.error(
      "Gagal menyimpan pesanan:",
      error
    );


    alert(
      `Pesanan gagal disimpan.\n\n${error.message}`
    );


  } finally {

    saveButton.disabled =
      false;

    saveButton.innerHTML = `

      <span
        class="
          material-symbols-outlined
          text-[19px]
        "
      >
        save
      </span>

      ${
        existingOrder
          ? "Simpan Perubahan"
          : "Simpan Pesanan"
      }

    `;

  }
}


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Mengambil harga yang valid.
 *
 * Kalau field harga belum ada,
 * hasilnya null agar transaksi lama
 * tidak dianggap memiliki harga.
 */
function getValidPrice(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  // Kalau sudah berupa angka
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0) {
      return null;
    }

    return value;
  }

  let text = String(value).trim();

  if (!text) {
    return null;
  }

  // Hapus tulisan Rupiah dan spasi
  text = text
    .replace(/rp/gi, "")
    .replace(/\s/g, "");

  /*
   * Menangani beberapa format:
   *
   * 15000
   * 15.000
   * 15,000
   * 15.000,50
   * 15,000.50
   */

  if (
    text.includes(".") &&
    text.includes(",")
  ) {
    const lastDot = text.lastIndexOf(".");
    const lastComma = text.lastIndexOf(",");

    if (lastComma > lastDot) {
      // Format Indonesia:
      // 15.000,50
      text = text
        .replace(/\./g, "")
        .replace(",", ".");
    } else {
      // Format internasional:
      // 15,000.50
      text = text
        .replace(/,/g, "");
    }
  } else if (text.includes(",")) {
    const parts = text.split(",");

    if (
      parts.length === 2 &&
      parts[1].length <= 2
    ) {
      // Contoh 15000,50
      text = text.replace(",", ".");
    } else {
      // Contoh 15,000
      text = text.replace(/,/g, "");
    }
  } else if (text.includes(".")) {
    const parts = text.split(".");

    if (
      parts.length > 2 ||
      (
        parts.length === 2 &&
        parts[1].length === 3
      )
    ) {
      // Contoh:
      // 15.000
      // 1.500.000
      text = text.replace(/\./g, "");
    }
  }

  const number = Number(text);

  if (
    !Number.isFinite(number) ||
    number < 0
  ) {
    return null;
  }

  return number;
}

function getMenuPrice(menu) {
  if (!menu) {
    return null;
  }

  /*
   * Field utama:
   * hargaJual
   *
   * Field harga juga didukung sebagai
   * fallback agar lebih aman terhadap
   * data Master Menu lama.
   */
  return getValidPrice(
    menu.hargaJual ??
    menu.harga ??
    null
  );
}

/**
 * Format Rupiah
 */
function formatRupiah(
  value
) {

  const number =
    getValidPrice(value);


  if (number === null) {

    return "Belum ada harga";
  }


  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }
  ).format(number);
}


function getToday() {

  const now =
    new Date();

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


function escapeAttribute(
  value
) {

  return escapeHtml(
    value
  );

}


function getMenuDisplayName(
  menu
) {

  const parts = [
    menu.nama,
    menu.varian,
    menu.ukuran
  ]
    .filter(
      (value) =>
        value &&
        String(value).trim()
    )
    .map(
      (value) =>
        String(
          value
        ).trim()
    );


  return parts.join(
    " — "
  );
}