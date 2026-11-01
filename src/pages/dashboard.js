import { renderLayout } from "../components/layout.js";
import { getOrders } from "../services/orders.service.js";


/*
|--------------------------------------------------------------------------
| UTILITAS
|--------------------------------------------------------------------------
*/

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function getTodayString() {
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


function formatTanggal(dateString) {
  if (!dateString) {
    return "";
  }

  const parts =
    String(dateString).split("-");

  if (parts.length !== 3) {
    return dateString;
  }

  const [
    year,
    month,
    day
  ] = parts;

  const bulan = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember"
  ];

  const monthIndex =
    Number(month) - 1;

  return `${Number(day)} ${
    bulan[monthIndex] || month
  } ${year}`;
}


/*
|--------------------------------------------------------------------------
| CEK RENTANG TANGGAL
|--------------------------------------------------------------------------
|
| Karena tanggal Firestore kita menggunakan
| format YYYY-MM-DD, perbandingan string
| aman digunakan.
|
|--------------------------------------------------------------------------
*/

function isDateInRange(
  tanggal,
  dari,
  sampai
) {
  if (!tanggal) {
    return false;
  }

  if (
    dari &&
    tanggal < dari
  ) {
    return false;
  }

  if (
    sampai &&
    tanggal > sampai
  ) {
    return false;
  }

  return true;
}


/*
|--------------------------------------------------------------------------
| HITUNG DASHBOARD
|--------------------------------------------------------------------------
*/

function calculateDashboard(
  orders,
  dari,
  sampai
) {
  const filteredOrders =
    orders.filter(
      (order) =>
        isDateInRange(
          order.tanggal,
          dari,
          sampai
        )
    );


  let totalPorsi = 0;

  let sudahDibagikan = 0;

  let belumDibagikan = 0;


  const kategoriMap =
    new Map();


  for (
    const order
    of filteredOrders
  ) {

    for (
      const item
      of order.items || []
    ) {

      const jumlah =
        Number(
          item.jumlah
        ) || 0;

      if (!jumlah) {
        continue;
      }


      totalPorsi +=
        jumlah;


      if (
        item.dibagikan === true
      ) {

        sudahDibagikan +=
          jumlah;

      } else {

        belumDibagikan +=
          jumlah;
      }


      const kategori =
        item.kategori ||
        "Lainnya";


      if (
        !kategoriMap.has(
          kategori
        )
      ) {
        kategoriMap.set(
          kategori,
          0
        );
      }


      kategoriMap.set(
        kategori,
        kategoriMap.get(
          kategori
        ) + jumlah
      );
    }
  }


  return {
    filteredOrders,

    totalPorsi,

    sudahDibagikan,

    belumDibagikan,

    kategoriMap
  };
}


/*
|--------------------------------------------------------------------------
| RENDER DASHBOARD
|--------------------------------------------------------------------------
*/

export async function renderDashboard() {

  const today =
    getTodayString();


  renderLayout({
    pageTitle:
      "Dashboard",

    pageSubtitle:
      "Ringkasan Pesanan Kantin",

    content: `
      <div
        id="dashboard-content"
        class="space-y-6"
      >

        <!-- HEADER -->

        <div
          class="
            flex
            flex-col
            lg:flex-row
            lg:items-center
            lg:justify-between
            gap-4
          "
        >

          <div>

            <div
              class="
                text-xs
                font-semibold
                uppercase
                tracking-wide
                text-slate-400
              "
            >
              Dashboard
            </div>

            <h1
              class="
                mt-1
                text-2xl
                font-bold
                text-slate-900
              "
            >
              Ringkasan Pesanan
            </h1>

            <p
              class="
                mt-1
                text-sm
                text-slate-500
              "
            >
              Pilih rentang tanggal untuk melihat
              ringkasan pesanan.
            </p>

          </div>


          <button
            id="dashboard-refresh"
            type="button"
            class="
              inline-flex
              items-center
              justify-center
              gap-2
              px-4
              py-2
              rounded-lg
              border
              border-slate-200
              bg-white
              text-sm
              font-medium
              text-slate-700
              hover:bg-slate-50
            "
          >

            <span
              class="
                material-symbols-outlined
                text-[18px]
              "
            >
              refresh
            </span>

            Refresh

          </button>

        </div>


        <!-- FILTER TANGGAL -->

        <section
          class="
            rounded-xl
            border
            border-slate-200
            bg-white
            p-5
          "
        >

          <div
            class="
              flex
              items-center
              gap-2
              mb-4
            "
          >

            <span
              class="
                material-symbols-outlined
                text-primary
              "
            >
              calendar_month
            </span>

            <div>

              <h2
                class="
                  font-semibold
                  text-slate-900
                "
              >
                Periode Dashboard
              </h2>

              <p
                class="
                  text-xs
                  text-slate-500
                  mt-1
                "
              >
                Pilih tanggal mulai dan tanggal akhir.
              </p>

            </div>

          </div>


          <div
            class="
              grid
              grid-cols-1
              md:grid-cols-[1fr_auto_1fr_auto]
              gap-3
              items-end
            "
          >

            <div>

              <label
                for="dashboard-dari"
                class="
                  block
                  mb-1.5
                  text-sm
                  font-medium
                  text-slate-700
                "
              >
                Dari
              </label>

              <input
                id="dashboard-dari"
                type="date"
                value="${today}"
                class="
                  w-full
                  h-11
                  rounded-lg
                  border
                  border-slate-300
                  bg-white
                  px-3
                  text-sm
                  text-slate-700
                  outline-none
                  focus:border-primary
                  focus:ring-2
                  focus:ring-primary/20
                "
              />

            </div>


            <div
              class="
                hidden
                md:block
                pb-3
                text-slate-400
              "
            >
              sampai
            </div>


            <div>

              <label
                for="dashboard-sampai"
                class="
                  block
                  mb-1.5
                  text-sm
                  font-medium
                  text-slate-700
                "
              >
                Sampai
              </label>

              <input
                id="dashboard-sampai"
                type="date"
                value="${today}"
                class="
                  w-full
                  h-11
                  rounded-lg
                  border
                  border-slate-300
                  bg-white
                  px-3
                  text-sm
                  text-slate-700
                  outline-none
                  focus:border-primary
                  focus:ring-2
                  focus:ring-primary/20
                "
              />

            </div>


            <div
              class="
                flex
                gap-2
              "
            >

              <button
                id="dashboard-apply"
                type="button"
                class="
                  h-11
                  px-5
                  rounded-lg
                  bg-primary
                  text-white
                  text-sm
                  font-semibold
                  hover:opacity-90
                  whitespace-nowrap
                "
              >
                Tampilkan
              </button>

              <button
                id="dashboard-reset"
                type="button"
                class="
                  h-11
                  px-4
                  rounded-lg
                  border
                  border-slate-300
                  bg-white
                  text-slate-700
                  text-sm
                  font-medium
                  hover:bg-slate-50
                "
              >
                Reset
              </button>

            </div>

          </div>


          <div
            id="dashboard-period-info"
            class="
              mt-4
              text-xs
              text-slate-500
            "
          ></div>

        </section>


        <!-- ERROR -->

        <div
          id="dashboard-error"
          class="hidden"
        ></div>


        <!-- LOADING -->

        <div
          id="dashboard-loading"
          class="
            rounded-xl
            border
            border-slate-200
            bg-white
            p-8
            text-center
            text-sm
            text-slate-500
          "
        >

          <span
            class="
              material-symbols-outlined
              animate-spin
              text-2xl
            "
          >
            progress_activity
          </span>

          <div class="mt-2">
            Memuat data...
          </div>

        </div>


        <!-- DATA -->

        <div
          id="dashboard-data"
          class="hidden space-y-6"
        >

          <!-- STATISTIK -->

          <div
            class="
              grid
              grid-cols-1
              sm:grid-cols-2
              xl:grid-cols-4
              gap-4
            "
          >

            <!-- TRANSAKSI -->

            <div
              class="
                rounded-xl
                border
                border-slate-200
                bg-white
                p-5
              "
            >

              <div
                class="
                  flex
                  items-center
                  justify-between
                "
              >

                <div
                  class="
                    text-sm
                    font-medium
                    text-slate-500
                  "
                >
                  Jumlah Pesanan
                </div>

                <span
                  class="
                    material-symbols-outlined
                    text-primary
                  "
                >
                  receipt_long
                </span>

              </div>

              <div
                id="stat-orders"
                class="
                  mt-3
                  text-3xl
                  font-bold
                  text-slate-900
                "
              >
                0
              </div>

              <div
                class="
                  mt-1
                  text-xs
                  text-slate-400
                "
              >
                transaksi
              </div>

            </div>


            <!-- PORSI -->

            <div
              class="
                rounded-xl
                border
                border-slate-200
                bg-white
                p-5
              "
            >

              <div
                class="
                  flex
                  items-center
                  justify-between
                "
              >

                <div
                  class="
                    text-sm
                    font-medium
                    text-slate-500
                  "
                >
                  Total Porsi
                </div>

                <span
                  class="
                    material-symbols-outlined
                    text-primary
                  "
                >
                  restaurant
                </span>

              </div>

              <div
                id="stat-portions"
                class="
                  mt-3
                  text-3xl
                  font-bold
                  text-slate-900
                "
              >
                0
              </div>

              <div
                class="
                  mt-1
                  text-xs
                  text-slate-400
                "
              >
                porsi
              </div>

            </div>


            <!-- BELUM -->

            <div
              class="
                rounded-xl
                border
                border-amber-200
                bg-amber-50
                p-5
              "
            >

              <div
                class="
                  flex
                  items-center
                  justify-between
                "
              >

                <div
                  class="
                    text-sm
                    font-medium
                    text-amber-700
                  "
                >
                  Belum Dibagikan
                </div>

                <span
                  class="
                    material-symbols-outlined
                    text-amber-600
                  "
                >
                  pending_actions
                </span>

              </div>

              <div
                id="stat-pending"
                class="
                  mt-3
                  text-3xl
                  font-bold
                  text-amber-800
                "
              >
                0
              </div>

              <div
                class="
                  mt-1
                  text-xs
                  text-amber-600
                "
              >
                porsi
              </div>

            </div>


            <!-- SUDAH -->

            <div
              class="
                rounded-xl
                border
                border-emerald-200
                bg-emerald-50
                p-5
              "
            >

              <div
                class="
                  flex
                  items-center
                  justify-between
                "
              >

                <div
                  class="
                    text-sm
                    font-medium
                    text-emerald-700
                  "
                >
                  Sudah Dibagikan
                </div>

                <span
                  class="
                    material-symbols-outlined
                    text-emerald-600
                  "
                >
                  task_alt
                </span>

              </div>

              <div
                id="stat-distributed"
                class="
                  mt-3
                  text-3xl
                  font-bold
                  text-emerald-800
                "
              >
                0
              </div>

              <div
                class="
                  mt-1
                  text-xs
                  text-emerald-600
                "
              >
                porsi
              </div>

            </div>

          </div>


          <!-- KATEGORI -->

          <section
            class="
              rounded-xl
              border
              border-slate-200
              bg-white
              overflow-hidden
            "
          >

            <div
              class="
                px-5
                py-4
                border-b
                border-slate-200
              "
            >

              <h2
                class="
                  font-semibold
                  text-slate-900
                "
              >
                Ringkasan Kategori
              </h2>

              <p
                class="
                  mt-1
                  text-xs
                  text-slate-500
                "
              >
                Total porsi berdasarkan kategori menu.
              </p>

            </div>


            <div
              id="dashboard-categories"
              class="
                p-5
                grid
                grid-cols-1
                sm:grid-cols-2
                lg:grid-cols-3
                gap-4
              "
            ></div>

          </section>


          <!-- PESANAN -->

          <section
            class="
              rounded-xl
              border
              border-slate-200
              bg-white
              overflow-hidden
            "
          >

            <div
              class="
                px-5
                py-4
                border-b
                border-slate-200
                flex
                flex-col
                sm:flex-row
                sm:items-center
                sm:justify-between
                gap-2
              "
            >

              <div>

                <h2
                  class="
                    font-semibold
                    text-slate-900
                  "
                >
                  Pesanan Periode Ini
                </h2>

                <p
                  id="dashboard-order-period"
                  class="
                    mt-1
                    text-xs
                    text-slate-500
                  "
                ></p>

              </div>

              <a
                href="#/pesanan"
                class="
                  text-sm
                  font-medium
                  text-primary
                  hover:underline
                "
              >
                Lihat Semua
              </a>

            </div>


            <div
              id="dashboard-orders"
              class="overflow-x-auto"
            ></div>

          </section>

        </div>

      </div>
    `
  });


  /*
   * Event filter
   */
  document
    .querySelector(
      "#dashboard-apply"
    )
    ?.addEventListener(
      "click",
      async () => {

        const dari =
          document.querySelector(
            "#dashboard-dari"
          )?.value || "";

        const sampai =
          document.querySelector(
            "#dashboard-sampai"
          )?.value || "";


        if (
          dari &&
          sampai &&
          dari > sampai
        ) {

          showDashboardError(
            "Tanggal Dari tidak boleh lebih besar dari tanggal Sampai."
          );

          return;
        }


        hideDashboardError();

        await loadDashboard(
          dari,
          sampai
        );
      }
    );


  /*
   * Reset
   */
  document
    .querySelector(
      "#dashboard-reset"
    )
    ?.addEventListener(
      "click",
      async () => {

        const today =
          getTodayString();


        const dariInput =
          document.querySelector(
            "#dashboard-dari"
          );

        const sampaiInput =
          document.querySelector(
            "#dashboard-sampai"
          );


        if (dariInput) {
          dariInput.value =
            today;
        }

        if (sampaiInput) {
          sampaiInput.value =
            today;
        }


        hideDashboardError();

        await loadDashboard(
          today,
          today
        );
      }
    );


  /*
   * Refresh
   */
  document
    .querySelector(
      "#dashboard-refresh"
    )
    ?.addEventListener(
      "click",
      async () => {

        const dari =
          document.querySelector(
            "#dashboard-dari"
          )?.value || "";

        const sampai =
          document.querySelector(
            "#dashboard-sampai"
          )?.value || "";


        await loadDashboard(
          dari,
          sampai
        );
      }
    );


  /*
   * Load pertama.
   */
  await loadDashboard(
    today,
    today
  );
}


/*
|--------------------------------------------------------------------------
| LOAD DASHBOARD
|--------------------------------------------------------------------------
*/

async function loadDashboard(
  dari,
  sampai
) {
  const loading =
    document.querySelector(
      "#dashboard-loading"
    );

  const content =
    document.querySelector(
      "#dashboard-data"
    );


  try {

    loading?.classList.remove(
      "hidden"
    );

    content?.classList.add(
      "hidden"
    );


    const orders =
      await getOrders();


    const result =
      calculateDashboard(
        orders,
        dari,
        sampai
      );


    renderStats(
      result
    );


    renderCategories(
      result.kategoriMap
    );


    renderOrders(
      result.filteredOrders
    );


    renderPeriodInfo(
      dari,
      sampai,
      result.filteredOrders.length
    );


    loading?.classList.add(
      "hidden"
    );

    content?.classList.remove(
      "hidden"
    );

  } catch (error) {

    console.error(
      "Dashboard error:",
      error
    );


    if (loading) {

      loading.innerHTML = `
        <div
          class="
            text-red-600
            font-medium
          "
        >
          Gagal memuat dashboard.
        </div>

        <div
          class="
            mt-2
            text-xs
            text-slate-500
          "
        >
          ${escapeHtml(
            error.message
          )}
        </div>
      `;
    }
  }
}


/*
|--------------------------------------------------------------------------
| INFO PERIODE
|--------------------------------------------------------------------------
*/

function renderPeriodInfo(
  dari,
  sampai,
  jumlahPesanan
) {
  const info =
    document.querySelector(
      "#dashboard-period-info"
    );

  const orderPeriod =
    document.querySelector(
      "#dashboard-order-period"
    );


  let text = "";


  if (
    dari &&
    sampai &&
    dari !== sampai
  ) {

    text =
      `Menampilkan data dari ${formatTanggal(
        dari
      )} sampai ${formatTanggal(
        sampai
      )}.`;

  } else if (dari) {

    text =
      `Menampilkan data tanggal ${formatTanggal(
        dari
      )}.`;
  }


  if (info) {
    info.textContent =
      `${text} ${jumlahPesanan} transaksi ditemukan.`;
  }


  if (orderPeriod) {
    orderPeriod.textContent =
      text;
  }
}


/*
|--------------------------------------------------------------------------
| STATISTIK
|--------------------------------------------------------------------------
*/

function renderStats(
  result
) {
  const orders =
    document.querySelector(
      "#stat-orders"
    );

  const portions =
    document.querySelector(
      "#stat-portions"
    );

  const pending =
    document.querySelector(
      "#stat-pending"
    );

  const distributed =
    document.querySelector(
      "#stat-distributed"
    );


  if (orders) {
    orders.textContent =
      result.filteredOrders.length;
  }


  if (portions) {
    portions.textContent =
      result.totalPorsi;
  }


  if (pending) {
    pending.textContent =
      result.belumDibagikan;
  }


  if (distributed) {
    distributed.textContent =
      result.sudahDibagikan;
  }
}


/*
|--------------------------------------------------------------------------
| KATEGORI
|--------------------------------------------------------------------------
*/

function renderCategories(
  kategoriMap
) {
  const container =
    document.querySelector(
      "#dashboard-categories"
    );


  if (!container) {
    return;
  }


  const preferredOrder = [
    "Makanan",
    "Minuman",
    "Pisang Keju",
    "Lainnya"
  ];


  const entries =
    Array.from(
      kategoriMap.entries()
    );


  entries.sort(
    (a, b) => {

      const ai =
        preferredOrder.indexOf(
          a[0]
        );

      const bi =
        preferredOrder.indexOf(
          b[0]
        );


      if (
        ai === -1 &&
        bi === -1
      ) {
        return a[0].localeCompare(
          b[0],
          "id"
        );
      }


      if (ai === -1) {
        return 1;
      }


      if (bi === -1) {
        return -1;
      }


      return ai - bi;
    }
  );


  if (!entries.length) {

    container.innerHTML = `
      <div
        class="
          col-span-full
          py-8
          text-center
          text-sm
          text-slate-400
        "
      >
        Belum ada pesanan pada periode ini.
      </div>
    `;

    return;
  }


  container.innerHTML =
    entries
      .map(
        ([kategori, jumlah]) => `
          <div
            class="
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              p-5
            "
          >

            <div
              class="
                text-sm
                font-medium
                text-slate-500
              "
            >
              ${escapeHtml(
                kategori
              )}
            </div>

            <div
              class="
                mt-2
                text-3xl
                font-bold
                text-slate-900
              "
            >
              ${jumlah}
            </div>

            <div
              class="
                mt-1
                text-xs
                text-slate-400
              "
            >
              porsi
            </div>

          </div>
        `
      )
      .join("");
}


/*
|--------------------------------------------------------------------------
| TABEL PESANAN
|--------------------------------------------------------------------------
*/

function renderOrders(
  orders
) {
  const container =
    document.querySelector(
      "#dashboard-orders"
    );


  if (!container) {
    return;
  }


  if (!orders.length) {

    container.innerHTML = `
      <div
        class="
          p-8
          text-center
          text-sm
          text-slate-400
        "
      >
        Belum ada pesanan pada periode ini.
      </div>
    `;

    return;
  }


  const sorted =
    [...orders]
      .sort(
        (a, b) => {

          const tanggalCompare =
            String(
              a.tanggal || ""
            ).localeCompare(
              String(
                b.tanggal || ""
              )
            );


          if (
            tanggalCompare !== 0
          ) {
            return tanggalCompare;
          }


          return String(
            a.nama || ""
          ).localeCompare(
            String(
              b.nama || ""
            ),
            "id"
          );
        }
      )
      .slice(0, 20);


  container.innerHTML = `
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
              font-semibold
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
              font-semibold
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
              font-semibold
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
              font-semibold
              text-slate-500
            "
          >
            Kelas
          </th>

          <th
            class="
              px-5
              py-3
              text-center
              text-xs
              font-semibold
              text-slate-500
            "
          >
            Porsi
          </th>

          <th
            class="
              px-5
              py-3
              text-center
              text-xs
              font-semibold
              text-slate-500
            "
          >
            Status
          </th>

        </tr>

      </thead>


      <tbody>

        ${sorted
          .map(
            (order) => {

              const total =
                (order.items || [])
                  .reduce(
                    (
                      sum,
                      item
                    ) =>
                      sum +
                      (
                        Number(
                          item.jumlah
                        ) || 0
                      ),
                    0
                  );


              const status =
                order.status ||
                "belum_dibagikan";


              let statusText =
                "Belum Dibagikan";

              let statusClass =
                "bg-amber-100 text-amber-700";


              if (
                status ===
                "sudah_dibagikan"
              ) {

                statusText =
                  "Sudah Dibagikan";

                statusClass =
                  "bg-emerald-100 text-emerald-700";

              } else if (
                status ===
                "sebagian"
              ) {

                statusText =
                  "Sebagian";

                statusClass =
                  "bg-blue-100 text-blue-700";
              }


              return `
                <tr
                  class="
                    border-b
                    border-slate-100
                    last:border-b-0
                  "
                >

                  <td
                    class="
                      px-5
                      py-3
                      text-slate-600
                      whitespace-nowrap
                    "
                  >
                    ${formatTanggal(
                      order.tanggal
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
                      order.nama
                    )}
                  </td>

                  <td
                    class="
                      px-5
                      py-3
                      text-slate-600
                    "
                  >
                    ${escapeHtml(
                      order.kamar
                    )}
                  </td>

                  <td
                    class="
                      px-5
                      py-3
                      text-slate-600
                    "
                  >
                    ${escapeHtml(
                      order.kelas
                    )}
                  </td>

                  <td
                    class="
                      px-5
                      py-3
                      text-center
                      font-semibold
                      text-slate-800
                    "
                  >
                    ${total}
                  </td>

                  <td
                    class="
                      px-5
                      py-3
                      text-center
                    "
                  >

                    <span
                      class="
                        inline-flex
                        rounded-full
                        px-3
                        py-1
                        text-xs
                        font-medium
                        ${statusClass}
                      "
                    >
                      ${statusText}
                    </span>

                  </td>

                </tr>
              `;
            }
          )
          .join("")}

      </tbody>

    </table>
  `;
}


/*
|--------------------------------------------------------------------------
| ERROR
|--------------------------------------------------------------------------
*/

function showDashboardError(
  message
) {
  const error =
    document.querySelector(
      "#dashboard-error"
    );


  if (!error) {
    return;
  }


  error.className = `
    rounded-lg
    border
    border-red-200
    bg-red-50
    px-4
    py-3
    text-sm
    text-red-700
  `;


  error.textContent =
    message;
}


function hideDashboardError() {
  const error =
    document.querySelector(
      "#dashboard-error"
    );


  if (!error) {
    return;
  }


  error.className =
    "hidden";

  error.textContent =
    "";
}