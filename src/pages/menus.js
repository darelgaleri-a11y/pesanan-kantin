import { renderLayout } from "../components/layout.js";

import {
  getMenus,
  createMenu,
  updateMenu,
  deleteMenu
} from "../services/menus.service.js";


let currentMenus = [];
let editingMenuId = null;


/*
|--------------------------------------------------------------------------
| RENDER HALAMAN
|--------------------------------------------------------------------------
*/

export async function renderMenus() {

  renderLayout({

    pageTitle: "Data Master Menu",

    pageSubtitle:
      "Kelola daftar menu kantin",

    content: `

      <div class="space-y-5">

        <!-- HEADER -->

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
                DATA MASTER
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
                Menu Kantin
              </h1>


              <p
                class="
                  text-sm
                  text-slate-500
                  mt-1
                "
              >
                Tambahkan dan kelola menu yang tersedia untuk pesanan santri.
              </p>

            </div>


            <button
              id="add-menu-button"
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

              Tambah Menu

            </button>

          </div>

        </section>



        <!-- FORM -->

        <section
          id="menu-form-section"
          class="
            hidden
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
              items-center
              justify-between
              mb-4
            "
          >

            <div>

              <h2
                id="menu-form-title"
                class="
                  text-sm
                  font-bold
                  text-slate-900
                "
              >
                Tambah Menu
              </h2>


              <p
                class="
                  text-xs
                  text-slate-500
                  mt-1
                "
              >
                Data menu akan digunakan pada form pesanan.
              </p>

            </div>


            <button
              id="cancel-menu-form"
              type="button"
              class="
                w-9
                h-9
                rounded-lg
                hover:bg-slate-100
                flex
                items-center
                justify-center
              "
            >

              <span
                class="
                  material-symbols-outlined
                  text-[20px]
                "
              >
                close
              </span>

            </button>

          </div>



          <form id="menu-form">

            <div
              class="
                grid
                grid-cols-1
                sm:grid-cols-2
                lg:grid-cols-4
                gap-4
              "
            >

              <!-- NAMA -->

              <div class="sm:col-span-2">

                <label
                  class="
                    block
                    text-xs
                    font-semibold
                    text-slate-600
                    mb-1.5
                  "
                >
                  Nama Menu *
                </label>


                <input
                  id="menu-name"
                  type="text"
                  required
                  placeholder="Contoh: Ayam Bakar + Nasi"
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
                  "
                />

              </div>



              <!-- KATEGORI -->

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
                  Kategori *
                </label>


                <select
                  id="menu-category"
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
                  "
                >

                  <option value="Makanan">
                    Makanan
                  </option>

                  <option value="Minuman">
                    Minuman
                  </option>

                  <option value="Pisang Keju">
                    Pisang Keju
                  </option>

                  <option value="Lainnya">
                    Lainnya
                  </option>

                </select>

              </div>



              <!-- STATUS -->

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
                  Status
                </label>


                <select
                  id="menu-active"
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
                  "
                >

                  <option value="true">
                    Aktif
                  </option>

                  <option value="false">
                    Tidak Aktif
                  </option>

                </select>

              </div>



              <!-- VARIAN -->

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
                  Varian
                </label>


                <input
                  id="menu-variant"
                  type="text"
                  placeholder="Contoh: Coklat"
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
                  "
                />

              </div>



              <!-- UKURAN -->

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
                  Ukuran
                </label>


                <input
                  id="menu-size"
                  type="text"
                  placeholder="Contoh: Jumbo / Reguler"
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
                  "
                />

              </div>



              <!-- HARGA JUAL -->

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
                  Harga Jual (Rp) *
                </label>


                <input
                  id="menu-price"
                  type="number"
                  min="0"
                  step="1"
                  required
                  inputmode="numeric"
                  placeholder="Contoh: 15000"
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
                  "
                />


                <p
                  class="
                    text-[11px]
                    text-slate-400
                    mt-1
                  "
                >
                  Masukkan harga per item.
                </p>

              </div>

            </div>



            <!-- ACTION -->

            <div
              class="
                flex
                justify-end
                gap-2
                mt-5
              "
            >

              <button
                id="cancel-menu-form-bottom"
                type="button"
                class="
                  px-4
                  py-2.5
                  rounded-lg
                  border
                  border-slate-300
                  bg-white
                  text-sm
                  font-semibold
                  text-slate-700
                "
              >
                Batal
              </button>


              <button
                id="save-menu-button"
                type="submit"
                class="
                  inline-flex
                  items-center
                  gap-2
                  px-4
                  py-2.5
                  rounded-lg
                  bg-primary
                  text-white
                  text-sm
                  font-semibold
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

                Simpan Menu

              </button>

            </div>

          </form>

        </section>



        <!-- TABLE -->

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
                Daftar Menu
              </h2>


              <p
                id="menu-count"
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
              id="refresh-menus"
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



          <div class="overflow-x-auto">

            <table class="w-full text-sm">

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
                    Nama Menu
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
                    Kategori
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
                    Varian
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
                    Ukuran
                  </th>


                  <th
                    class="
                      px-4
                      py-3
                      text-right
                      text-xs
                      font-bold
                      text-slate-500
                    "
                  >
                    Harga Jual
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



              <tbody id="menus-table-body">

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
                    Memuat menu...
                  </td>

                </tr>

              </tbody>

            </table>

          </div>

        </section>

      </div>

    `
  });


  await loadMenus();

  setupMenuEvents();
}



/*
|--------------------------------------------------------------------------
| LOAD MENU
|--------------------------------------------------------------------------
*/

async function loadMenus() {

  const tbody =
    document.querySelector(
      "#menus-table-body"
    );

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

            Memuat menu...

          </div>

        </td>

      </tr>

    `;


    currentMenus =
      await getMenus();


    renderMenuTable();

  } catch (error) {

    console.error(
      "Gagal mengambil menu:",
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
          Gagal mengambil data menu dari Firebase.
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

function renderMenuTable() {

  const tbody =
    document.querySelector(
      "#menus-table-body"
    );

  const count =
    document.querySelector(
      "#menu-count"
    );


  count.textContent =
    `${currentMenus.length} menu`;


  if (
    currentMenus.length === 0
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
              restaurant_menu
            </span>


            <div
              class="
                mt-2
                font-semibold
                text-slate-600
              "
            >
              Belum ada menu
            </div>


            <div class="text-xs mt-1">
              Tambahkan menu pertama.
            </div>

          </div>

        </td>

      </tr>

    `;

    return;
  }



  tbody.innerHTML =

    currentMenus
      .map(
        (menu, index) => {

          const harga =
            getValidPrice(
              menu.hargaJual
            );


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
                  text-slate-500
                "
              >
                ${index + 1}
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
                  menu.nama
                )}
              </td>


              <td class="px-4 py-3">
                ${escapeHtml(
                  menu.kategori || "-"
                )}
              </td>


              <td class="px-4 py-3">
                ${escapeHtml(
                  menu.varian || "-"
                )}
              </td>


              <td class="px-4 py-3">
                ${escapeHtml(
                  menu.ukuran || "-"
                )}
              </td>


              <td
                class="
                  px-4
                  py-3
                  text-right
                  font-semibold
                  text-slate-700
                "
              >
                ${
                  harga !== null
                    ? formatRupiah(harga)
                    : "Belum ada harga"
                }
              </td>


              <td
                class="
                  px-4
                  py-3
                  text-center
                "
              >
                ${menuStatus(
                  menu.aktif
                )}
              </td>


              <td class="px-4 py-3">

                <div
                  class="
                    flex
                    items-center
                    justify-center
                    gap-1
                  "
                >

                  <button
                    type="button"
                    data-edit-menu="${escapeAttribute(
                      menu.id
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

                  </button>


                  <button
                    type="button"
                    data-delete-menu="${escapeAttribute(
                      menu.id
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


  setupEditButtons();

  setupDeleteButtons();
}



/*
|--------------------------------------------------------------------------
| EVENT HALAMAN
|--------------------------------------------------------------------------
*/

function setupMenuEvents() {

  document
    .querySelector(
      "#add-menu-button"
    )
    ?.addEventListener(
      "click",
      () => openMenuForm()
    );


  document
    .querySelector(
      "#cancel-menu-form"
    )
    ?.addEventListener(
      "click",
      closeMenuForm
    );


  document
    .querySelector(
      "#cancel-menu-form-bottom"
    )
    ?.addEventListener(
      "click",
      closeMenuForm
    );


  document
    .querySelector(
      "#menu-form"
    )
    ?.addEventListener(
      "submit",
      handleMenuSubmit
    );


  document
    .querySelector(
      "#refresh-menus"
    )
    ?.addEventListener(
      "click",
      loadMenus
    );
}



/*
|--------------------------------------------------------------------------
| BUKA FORM
|--------------------------------------------------------------------------
*/

function openMenuForm(
  menu = null
) {

  const section =
    document.querySelector(
      "#menu-form-section"
    );

  const title =
    document.querySelector(
      "#menu-form-title"
    );


  editingMenuId =
    menu?.id || null;


  title.textContent =
    menu
      ? "Edit Menu"
      : "Tambah Menu";


  document.querySelector(
    "#menu-name"
  ).value =
    menu?.nama || "";


  document.querySelector(
    "#menu-category"
  ).value =
    menu?.kategori || "Makanan";


  document.querySelector(
    "#menu-variant"
  ).value =
    menu?.varian || "";


  document.querySelector(
    "#menu-size"
  ).value =
    menu?.ukuran || "";


  document.querySelector(
    "#menu-active"
  ).value =
    menu?.aktif === false
      ? "false"
      : "true";


  /*
   * Ambil harga yang tersimpan.
   */
  document.querySelector(
    "#menu-price"
  ).value =
    getValidPrice(
      menu?.hargaJual
    ) ?? "";


  section.classList.remove(
    "hidden"
  );


  document
    .querySelector(
      "#menu-name"
    )
    ?.focus();
}



/*
|--------------------------------------------------------------------------
| TUTUP FORM
|--------------------------------------------------------------------------
*/

function closeMenuForm() {

  editingMenuId = null;


  document
    .querySelector(
      "#menu-form-section"
    )
    ?.classList.add(
      "hidden"
    );


  document
    .querySelector(
      "#menu-form"
    )
    ?.reset();


  document.querySelector(
    "#menu-category"
  ).value =
    "Makanan";


  document.querySelector(
    "#menu-active"
  ).value =
    "true";


  document.querySelector(
    "#menu-price"
  ).value =
    "";

}



/*
|--------------------------------------------------------------------------
| SIMPAN MENU
|--------------------------------------------------------------------------
*/

async function handleMenuSubmit(
  event
) {

  event.preventDefault();


  const saveButton =
    document.querySelector(
      "#save-menu-button"
    );


  /*
   * Ambil nilai harga langsung
   * dari input.
   */
  const rawPrice =
    document.querySelector(
      "#menu-price"
    )?.value;


  const hargaJual =
    getValidPrice(
      rawPrice
    );


  const data = {

    nama:
      document
        .querySelector(
          "#menu-name"
        )
        .value
        .trim(),

    kategori:
      document
        .querySelector(
          "#menu-category"
        )
        .value,

    varian:
      document
        .querySelector(
          "#menu-variant"
        )
        .value
        .trim(),

    ukuran:
      document
        .querySelector(
          "#menu-size"
        )
        .value
        .trim(),

    aktif:
      document
        .querySelector(
          "#menu-active"
        )
        .value === "true",

    /*
     * PENTING:
     * Harga disimpan sebagai NUMBER,
     * bukan string dan bukan 0 otomatis.
     */
    hargaJual:
      hargaJual !== null
        ? hargaJual
        : 0

  };


  /*
   * Validasi nama.
   */

  if (!data.nama) {

    alert(
      "Nama menu wajib diisi."
    );

    return;
  }


  /*
   * Validasi harga.
   */

  if (
    hargaJual === null
  ) {

    alert(
      "Harga jual wajib diisi dengan angka yang valid."
    );

    document
      .querySelector(
        "#menu-price"
      )
      ?.focus();

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


    console.log(
      "Data menu yang disimpan:",
      data
    );


    if (
      editingMenuId
    ) {

      await updateMenu(
        editingMenuId,
        data
      );

    } else {

      await createMenu(
        data
      );

    }


    closeMenuForm();


    await loadMenus();

  } catch (error) {

    console.error(
      "Gagal menyimpan menu:",
      error
    );


    alert(
      `Menu gagal disimpan.\n\n${error.message}`
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

      Simpan Menu

    `;

  }
}



/*
|--------------------------------------------------------------------------
| EDIT
|--------------------------------------------------------------------------
*/

function setupEditButtons() {

  document
    .querySelectorAll(
      "[data-edit-menu]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const menuId =
              button.dataset.editMenu;


            const menu =
              currentMenus.find(
                (item) =>
                  item.id === menuId
              );


            if (menu) {

              openMenuForm(
                menu
              );

            }

          }
        );

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
      "[data-delete-menu]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          async () => {

            const menuId =
              button.dataset.deleteMenu;


            const menu =
              currentMenus.find(
                (item) =>
                  item.id === menuId
              );


            if (!menu) {
              return;
            }


            const confirmed =
              window.confirm(
                `Yakin ingin menghapus menu "${menu.nama}"?`
              );


            if (!confirmed) {
              return;
            }


            try {

              button.disabled =
                true;


              await deleteMenu(
                menuId
              );


              await loadMenus();

            } catch (error) {

              console.error(
                error
              );


              alert(
                `Menu gagal dihapus.\n\n${error.message}`
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
| STATUS
|--------------------------------------------------------------------------
*/

function menuStatus(
  aktif
) {

  if (
    aktif === false
  ) {

    return `

      <span
        class="
          inline-flex
          px-2
          py-1
          rounded-full
          bg-slate-100
          text-slate-500
          text-[11px]
          font-semibold
        "
      >
        Tidak Aktif
      </span>

    `;

  }


  return `

    <span
      class="
        inline-flex
        px-2
        py-1
        rounded-full
        bg-emerald-50
        text-primary
        text-[11px]
        font-semibold
      "
    >
      Aktif
    </span>

  `;

}



/*
|--------------------------------------------------------------------------
| HARGA
|--------------------------------------------------------------------------
*/

/**
 * Membaca harga dengan aman.
 *
 * Mendukung:
 *
 * 16000
 * "16000"
 * "16.000"
 * "Rp16.000"
 * "Rp 16.000"
 */
function getValidPrice(
  value
) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {

    return null;

  }


  if (
    typeof value === "number"
  ) {

    if (
      !Number.isFinite(value) ||
      value < 0
    ) {

      return null;

    }

    return value;

  }


  let text =
    String(value)
      .trim();


  if (!text) {
    return null;
  }


  text =
    text
      .replace(
        /rp/gi,
        ""
      )
      .replace(
        /\s/g,
        ""
      );


  /*
   * 16.000,50
   */
  if (
    text.includes(".") &&
    text.includes(",")
  ) {

    const lastDot =
      text.lastIndexOf(".");


    const lastComma =
      text.lastIndexOf(",");


    if (
      lastComma > lastDot
    ) {

      text =
        text
          .replace(
            /\./g,
            ""
          )
          .replace(
            ",",
            "."
          );

    } else {

      text =
        text.replace(
          /,/g,
          ""
        );

    }

  }

  /*
   * 16,000
   */
  else if (
    text.includes(",")
  ) {

    const parts =
      text.split(",");


    if (
      parts.length === 2 &&
      parts[1].length <= 2
    ) {

      text =
        text.replace(
          ",",
          "."
        );

    } else {

      text =
        text.replace(
          /,/g,
          ""
        );

    }

  }

  /*
   * 16.000
   */
  else if (
    text.includes(".")
  ) {

    const parts =
      text.split(".");


    if (
      parts.length > 2 ||
      (
        parts.length === 2 &&
        parts[1].length === 3
      )
    ) {

      text =
        text.replace(
          /\./g,
          ""
        );

    }

  }


  const number =
    Number(text);


  if (
    !Number.isFinite(number) ||
    number < 0
  ) {

    return null;

  }


  return number;

}



/*
|--------------------------------------------------------------------------
| FORMAT RUPIAH
|--------------------------------------------------------------------------
*/

function formatRupiah(
  value
) {

  const number =
    getValidPrice(
      value
    );


  if (
    number === null
  ) {

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



/*
|--------------------------------------------------------------------------
| ESCAPE
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


function escapeAttribute(
  value
) {

  return escapeHtml(
    value
  );

}