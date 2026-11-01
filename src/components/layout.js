
export function renderLayout({
  pageTitle,
  pageSubtitle = "",
  content = ""
}) {

  const app =
    document.querySelector("#app");


  if (!app) {
    return;
  }


  app.innerHTML = `

    <div class="app-shell">

      ${renderHeader(
        pageTitle,
        pageSubtitle
      )}

      ${renderSidebar()}

      <main class="app-main">

        <div id="page-content" class="page-container">

          ${content}

        </div>

      </main>

    </div>

  `;


  setupNavigation();
  setupAppGuide();

}


/*
|--------------------------------------------------------------------------
| HEADER
|--------------------------------------------------------------------------
*/

function renderHeader(
  pageTitle,
  pageSubtitle
) {

  return `

    <header
      class="
        fixed
        top-0
        left-0
        right-0
        z-40
        h-16
        bg-white/95
        backdrop-blur
        border-b
        border-slate-200
      "
    >

      <div
        class="
          h-full
          px-4
          lg:px-6
          flex
          items-center
          justify-between
        "
      >


        <div
          class="
            flex
            items-center
            gap-3
            min-w-0
          "
        >

          <button
            id="mobile-menu-button"
            type="button"
            class="
              lg:hidden
              w-10
              h-10
              flex
              items-center
              justify-center
              rounded-lg
              hover:bg-slate-100
            "
            aria-label="Buka menu"
          >

            <span
              class="
                material-symbols-outlined
              "
            >
              menu
            </span>

          </button>


          <div
            class="min-w-0"
          >

            <div
              class="
                text-sm
                sm:text-base
                font-bold
                text-primary
                truncate
              "
            >
              PESANAN KANTIN
            </div>


            <div
              class="
                text-xs
                text-slate-500
                truncate
              "
            >
              ${escapeHtml(
                pageSubtitle ||
                pageTitle
              )}
            </div>

          </div>

        </div>


        <div
          class="
            flex
            items-center
            gap-2
          "
        >

          <button
            id="app-guide-button"
            type="button"
            class="h-9 px-3 flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold"
            title="Buka panduan penggunaan aplikasi"
          >
            <span class="material-symbols-outlined text-[18px]">help</span>
            <span class="hidden sm:inline">Panduan</span>
          </button>

          <button
            type="button"
            class="
              w-10
              h-10
              flex
              items-center
              justify-center
              rounded-lg
              text-slate-500
              hover:bg-slate-100
            "
            title="Notifikasi"
          >

            <span
              class="
                material-symbols-outlined
              "
            >
              notifications
            </span>

          </button>



        </div>

      </div>

    </header>

  `;

}


/*
|--------------------------------------------------------------------------
| SIDEBAR
|--------------------------------------------------------------------------
*/

function renderSidebar() {

  return `

    <!-- =========================================================
         DESKTOP SIDEBAR
    ========================================================== -->

    <aside
      id="app-sidebar"
      class="
        fixed
        top-0
        bottom-0
        left-0
        z-50
        w-[260px]
        bg-white
        border-r
        border-slate-200
        hidden
        lg:flex
        flex-col
      "
    >


      <!-- HEADER SIDEBAR -->

      <div
        class="
          h-16
          min-h-16
          px-5
          flex
          items-center
          border-b
          border-slate-200
        "
      >

        <div>

          <div
            class="
              font-bold
              text-primary
            "
          >
            PESANAN KANTIN
          </div>


          <div
            class="
              text-[11px]
              text-slate-500
            "
          >
            Manajemen Pesantren
          </div>

        </div>

      </div>


      <!-- NAVIGATION DESKTOP -->

      <div
        class="
          flex-1
          min-h-0
          overflow-y-auto
          overflow-x-hidden
          p-3
          sidebar-scroll
        "
      >

        ${renderDesktopNavigation()}

      </div>


      <!-- FOOTER SIDEBAR -->

      <div
        class="
          shrink-0
          p-3
          border-t
          border-slate-200
          bg-white
        "
      >

        <div
          class="
            rounded-lg
            bg-slate-50
            border
            border-slate-200
            p-3
          "
        >

          <div
            class="
              text-xs
              font-semibold
              text-slate-700
            "
          >
            Sistem Pesanan Kantin
          </div>


          <div
            class="
              text-[11px]
              text-slate-500
              mt-1
            "
          >
            v1.0
          </div>

        </div>

      </div>

    </aside>



    <!-- =========================================================
         MOBILE BACKDROP
    ========================================================== -->

    <div
      id="mobile-sidebar-backdrop"
      class="
        fixed
        inset-0
        bg-slate-900/40
        z-40
        hidden
        lg:hidden
      "
    ></div>



    <!-- =========================================================
         MOBILE SIDEBAR
    ========================================================== -->

    <aside
      id="mobile-sidebar"
      class="
        fixed
        top-0
        bottom-0
        left-0
        z-50
        w-[280px]
        bg-white
        shadow-xl
        -translate-x-full
        transition-transform
        lg:hidden
        flex
        flex-col
      "
    >


      <!-- MOBILE HEADER -->

      <div
        class="
          h-16
          min-h-16
          px-5
          flex
          items-center
          justify-between
          border-b
          border-slate-200
        "
      >

        <div>

          <div
            class="
              font-bold
              text-primary
            "
          >
            PESANAN KANTIN
          </div>


          <div
            class="
              text-[11px]
              text-slate-500
            "
          >
            Manajemen Pesantren
          </div>

        </div>


        <button
          id="mobile-sidebar-close"
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
          aria-label="Tutup menu"
        >

          <span
            class="
              material-symbols-outlined
            "
          >
            close
          </span>

        </button>

      </div>


      <!-- MOBILE NAV -->

      <div
        class="
          flex-1
          min-h-0
          overflow-y-auto
          overflow-x-hidden
          p-3
          sidebar-scroll
        "
      >

        ${renderMobileNavigation()}

      </div>


      <!-- MOBILE FOOTER -->

      <div
        class="
          shrink-0
          p-3
          border-t
          border-slate-200
          bg-white
        "
      >

        <div
          class="
            rounded-lg
            bg-slate-50
            border
            border-slate-200
            p-3
          "
        >

          <div
            class="
              text-xs
              font-semibold
              text-slate-700
            "
          >
            Sistem Pesanan Kantin
          </div>


          <div
            class="
              text-[11px]
              text-slate-500
              mt-1
            "
          >
            v1.0
          </div>

        </div>

      </div>

    </aside>

  `;

}


/*
|--------------------------------------------------------------------------
| DESKTOP NAVIGATION
|--------------------------------------------------------------------------
*/

function renderDesktopNavigation() {

  return `

    ${navSection(
      "UTAMA",
      [

        [
          "/",
          "dashboard",
          "Dashboard"
        ],

        [
          "/pesanan",
          "receipt_long",
          "Semua Pesanan"
        ],

        [
          "/tambah-pesanan",
          "add_shopping_cart",
          "Tambah Pesanan"
        ],

        [
          "/import-pesanan",
          "upload_file",
          "Import Pesanan"
        ]

      ]
    )}


    ${navSection(
  "REKAP & CETAK",
  [

    [
      "/rekap-pembagian",
      "how_to_reg",
      "Rekap Pembagian"
    ],

    [
      "/rekap-dapur",
      "restaurant",
      "Rekap Dapur"
    ],

    [
      "/rekap-pisang",
      "bakery_dining",
      "Rekap Pisang Keju"
    ],

    [
      "/rekap-minuman",
      "local_drink",
      "Rekap Minuman"
    ],

    [
      "/rekap-penjualan",
      "payments",
      "Rekap Penjualan"
    ],

    [
      "/export",
      "download",
      "Export"
    ]

  ]
)}


    ${navSection(
      "DATA MASTER",
      [

        [
          "/menu",
          "restaurant_menu",
          "Menu"
        ],

        [
          "/kelas",
          "school",
          "Kelas"
        ],

        [
          "/kamar",
          "meeting_room",
          "Asrama / Kamar"
        ]

      ]
    )}


    ${navSection(
      "SISTEM",
      [

        [
          "/pengaturan",
          "settings",
          "Pengaturan"
        ]

      ]
    )}

  `;

}


/*
|--------------------------------------------------------------------------
| MOBILE NAVIGATION
|--------------------------------------------------------------------------
*/

function renderMobileNavigation() {

  return `

    ${navSection(
      "UTAMA",
      [

        [
          "/",
          "dashboard",
          "Dashboard"
        ],

        [
          "/pesanan",
          "receipt_long",
          "Semua Pesanan"
        ],

        [
          "/tambah-pesanan",
          "add_shopping_cart",
          "Tambah Pesanan"
        ],

        [
          "/import-pesanan",
          "upload_file",
          "Import Pesanan"
        ]

      ]
    )}


${navSection(
  "REKAP & CETAK",
  [

    [
      "/rekap-pembagian",
      "how_to_reg",
      "Rekap Pembagian"
    ],

    [
      "/rekap-dapur",
      "restaurant",
      "Rekap Dapur"
    ],

    [
      "/rekap-pisang",
      "bakery_dining",
      "Rekap Pisang Keju"
    ],

    [
      "/rekap-minuman",
      "local_drink",
      "Rekap Minuman"
    ],

    [
      "/rekap-penjualan",
      "payments",
      "Rekap Penjualan"
    ],

    [
      "/export",
      "download",
      "Export"
    ]

  ]
)}


    ${navSection(
      "DATA MASTER",
      [

        [
          "/menu",
          "restaurant_menu",
          "Menu"
        ],

        [
          "/kelas",
          "school",
          "Kelas"
        ],

        [
          "/kamar",
          "meeting_room",
          "Asrama / Kamar"
        ]

      ]
    )}


    ${navSection(
      "SISTEM",
      [

        [
          "/pengaturan",
          "settings",
          "Pengaturan"
        ]

      ]
    )}

  `;

}


/*
|--------------------------------------------------------------------------
| NAV SECTION
|--------------------------------------------------------------------------
*/

function navSection(
  title,
  items
) {

  return `

    <div
      class="
        mb-5
        last:mb-2
      "
    >

      <div
        class="
          px-3
          mb-2
          text-[10px]
          font-bold
          tracking-wider
          text-slate-400
        "
      >
        ${escapeHtml(title)}
      </div>


      <div
        class="
          space-y-1
        "
      >

        ${items
          .map(
            ([
              path,
              icon,
              label
            ]) => `

              <a
                href="#${path}"
                data-route="${path}"
                class="
                  nav-link
                  flex
                  items-center
                  gap-3
                  px-3
                  py-2.5
                  rounded-lg
                  text-sm
                  text-slate-700
                  hover:bg-slate-100
                  transition-colors
                "
              >

                <span
                  class="
                    material-symbols-outlined
                    text-[20px]
                    shrink-0
                  "
                >
                  ${icon}
                </span>


                <span
                  class="
                    truncate
                  "
                >
                  ${escapeHtml(label)}
                </span>

              </a>

            `
          )
          .join("")}

      </div>

    </div>

  `;

}


/*
|--------------------------------------------------------------------------
| NAVIGATION EVENTS
|--------------------------------------------------------------------------
*/


const APP_GUIDE_STEPS = [
  ["Selamat datang di Pesanan Kantin", "Panduan ini membantu pengguna baru memahami alur kerja aplikasi. Tekan Berikutnya untuk membaca langkah-langkahnya."],
  ["1. Dashboard", "Dashboard adalah halaman ringkasan untuk melihat gambaran pesanan dan aktivitas kantin. Mulailah dari sini untuk memantau kegiatan hari ini."],
  ["2. Master Menu", "Pastikan daftar menu dan harga sudah benar sebelum menerima pesanan. Menu yang belum terdaftar dapat diajukan dari proses Import WhatsApp dan perlu disetujui admin."],
  ["3. Pesanan manual", "Gunakan menu Pesanan atau Tambah Pesanan untuk mencatat pesanan satu per satu. Periksa nama pemesan, kelas, asrama, item, jumlah, dan tanggal sebelum menyimpan."],
  ["4. Import WhatsApp", "Buka Import Pesanan, tempel satu atau beberapa chat WhatsApp, lalu tekan Parse Pesanan. Periksa hasil pembacaan dan koreksi nama, menu, atau jumlah yang keliru sebelum menyimpan."],
  ["5. Usulan Master Data", "Jika sistem menemukan menu, kelas, atau asrama baru, usulannya akan ditampilkan untuk diperiksa admin. Koreksi nama dan isi harga jika berupa menu. Data baru hanya masuk Master Data setelah disetujui admin."],
  ["6. Dapur, Distribusi, dan Laporan", "Gunakan halaman Dapur dan Distribusi untuk membantu proses operasional. Gunakan Laporan dan Ekspor untuk melihat atau mengunduh rekap pesanan."],
  ["Selesai — mulai bekerja", "Panduan ini dapat dibuka kapan saja melalui tombol Panduan di bagian atas aplikasi. Selalu periksa data sebelum menyimpan pesanan."]
];

function setupAppGuide() {
  const button = document.querySelector("#app-guide-button");
  if (!button) return;
  button.addEventListener("click", () => showAppGuide());
  try {
    if (!localStorage.getItem("pesananKantinGuideSeen")) showAppGuide();
  } catch (error) { /* Panduan tetap tersedia melalui tombol. */ }
}

function showAppGuide() {
  document.querySelector("#app-guide-modal")?.remove();
  let index = 0;
  const modal = document.createElement("div");
  modal.id = "app-guide-modal";
  modal.className = "fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.innerHTML = `
    <section class="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
      <header class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div><div class="text-xs font-semibold uppercase tracking-wide text-emerald-700">Panduan pengguna</div><div id="guide-count" class="mt-1 text-sm text-slate-500"></div></div>
        <button id="guide-close" class="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Tutup"><span class="material-symbols-outlined">close</span></button>
      </header>
      <div class="p-6 sm:p-7">
        <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><span class="material-symbols-outlined text-2xl">school</span></div>
        <h2 id="guide-title" class="text-xl font-bold text-slate-900"></h2>
        <p id="guide-body" class="mt-3 text-sm leading-7 text-slate-600"></p>
        <div class="mt-6 h-1.5 overflow-hidden rounded-full bg-slate-100"><div id="guide-bar" class="h-full rounded-full bg-emerald-600 transition-all"></div></div>
      </div>
      <footer class="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4">
        <button id="guide-prev" class="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200">Sebelumnya</button>
        <div class="flex gap-2"><button id="guide-skip" class="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-200">Lewati</button><button id="guide-next" class="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">Berikutnya</button></div>
      </footer>
    </section>`;
  document.body.appendChild(modal);
  const close = () => {
    try { localStorage.setItem("pesananKantinGuideSeen", "1"); } catch (error) {}
    modal.remove();
  };
  const render = () => {
    const [title, body] = APP_GUIDE_STEPS[index];
    modal.querySelector("#guide-title").textContent = title;
    modal.querySelector("#guide-body").textContent = body;
    modal.querySelector("#guide-count").textContent = `Langkah ${index + 1} dari ${APP_GUIDE_STEPS.length}`;
    modal.querySelector("#guide-bar").style.width = `${(index + 1) / APP_GUIDE_STEPS.length * 100}%`;
    modal.querySelector("#guide-prev").disabled = index === 0;
    modal.querySelector("#guide-prev").classList.toggle("opacity-40", index === 0);
    modal.querySelector("#guide-next").textContent = index === APP_GUIDE_STEPS.length - 1 ? "Selesai" : "Berikutnya";
  };
  modal.querySelector("#guide-close").addEventListener("click", close);
  modal.querySelector("#guide-skip").addEventListener("click", close);
  modal.querySelector("#guide-prev").addEventListener("click", () => { if (index > 0) { index--; render(); } });
  modal.querySelector("#guide-next").addEventListener("click", () => { if (index < APP_GUIDE_STEPS.length - 1) { index++; render(); } else close(); });
  modal.addEventListener("click", event => { if (event.target === modal) close(); });
  render();
}

function setupNavigation() {

  document
    .querySelectorAll(
      "[data-route]"
    )
    .forEach(
      (link) => {

        link.addEventListener(
          "click",
          () => {

            closeMobileSidebar();

            // Update warna menu segera setelah diklik.
            setTimeout(() => {
              updateActiveNavigation();
            }, 0);

          }
        );

      }
    );


  const openButton =
    document.querySelector(
      "#mobile-menu-button"
    );


  const closeButton =
    document.querySelector(
      "#mobile-sidebar-close"
    );


  const backdrop =
    document.querySelector(
      "#mobile-sidebar-backdrop"
    );


  openButton?.addEventListener(
    "click",
    openMobileSidebar
  );


  closeButton?.addEventListener(
    "click",
    closeMobileSidebar
  );


  backdrop?.addEventListener(
    "click",
    closeMobileSidebar
  );


  updateActiveNavigation();


  /*
   * Pastikan highlight sidebar ikut berubah
   * ketika URL/hash berubah.
   *
   * Listener dibuat satu kali saja agar
   * tidak menumpuk setiap render layout.
   */
if (!window.__pesananKantinNavListener) {

  window.addEventListener(
    "hashchange",
    () => {
      updateActiveNavigation();
    }
  );

  window.addEventListener(
    "popstate",
    () => {
      updateActiveNavigation();
    }
  );

  window.addEventListener(
    "routechange",
    () => {
      updateActiveNavigation();
    }
  );

  window.__pesananKantinNavListener = true;
}



}


/*
|--------------------------------------------------------------------------
| ACTIVE NAVIGATION
|--------------------------------------------------------------------------
*/

function updateActiveNavigation() {

  const hash =
    window.location.hash
      .replace(/^#/, "");

  const current =
    (
      hash.split("?")[0] ||
      "/"
    );

  document
    .querySelectorAll(".nav-link")
    .forEach((link) => {

      const route =
        link.dataset.route;

      const isActive =
        route === current;

      if (isActive) {

        link.classList.add(
          "bg-emerald-50",
          "text-primary",
          "font-semibold"
        );

        link.classList.remove(
          "text-slate-700"
        );

      } else {

        link.classList.remove(
          "bg-emerald-50",
          "text-primary",
          "font-semibold"
        );

        link.classList.add(
          "text-slate-700"
        );

      }

    });

}


/*
|--------------------------------------------------------------------------
| MOBILE SIDEBAR OPEN
|--------------------------------------------------------------------------
*/

function openMobileSidebar() {

  document
    .querySelector(
      "#mobile-sidebar"
    )
    ?.classList.remove(
      "-translate-x-full"
    );


  document
    .querySelector(
      "#mobile-sidebar-backdrop"
    )
    ?.classList.remove(
      "hidden"
    );

}


/*
|--------------------------------------------------------------------------
| MOBILE SIDEBAR CLOSE
|--------------------------------------------------------------------------
*/

function closeMobileSidebar() {

  document
    .querySelector(
      "#mobile-sidebar"
    )
    ?.classList.add(
      "-translate-x-full"
    );


  document
    .querySelector(
      "#mobile-sidebar-backdrop"
    )
    ?.classList.add(
      "hidden"
    );

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