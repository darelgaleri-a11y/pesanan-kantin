import { saveAs } from "file-saver";

import { getSettings } from "../services/settings.service.js";


/*
|--------------------------------------------------------------------------
| UTILITAS
|--------------------------------------------------------------------------
*/

function safeFileName(value) {
  return String(value || "pesanan")
    .replace(/[<>:"/\\|?*]+/g, "-")
    .replace(/\s+/g, "-")
    .trim();
}


function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}


function parseDate(dateString) {
  if (!dateString) {
    return null;
  }

  const date = new Date(
    `${dateString}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}


function getMonthName(monthIndex) {
  const months = [
    "JANUARI",
    "FEBRUARI",
    "MARET",
    "APRIL",
    "MEI",
    "JUNI",
    "JULI",
    "AGUSTUS",
    "SEPTEMBER",
    "OKTOBER",
    "NOVEMBER",
    "DESEMBER"
  ];

  return months[monthIndex];
}


function getDayName(dateString) {
  const date =
    parseDate(dateString);

  if (!date) {
    return "";
  }

  const days = [
    "MINGGU",
    "SENIN",
    "SELASA",
    "RABU",
    "KAMIS",
    "JUM'AT",
    "SABTU"
  ];

  return days[date.getDay()];
}


function formatDateTitle(dateString) {
  const date =
    parseDate(dateString);

  if (!date) {
    return dateString || "";
  }

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${day} ${getMonthName(
    date.getMonth()
  )} ${date.getFullYear()}`;
}


/*
|--------------------------------------------------------------------------
| JUDUL
|--------------------------------------------------------------------------
*/

function createTitle(data) {
  const dari =
    data.filters?.dari || "";

  const sampai =
    data.filters?.sampai ||
    dari;

  if (
    dari &&
    sampai &&
    dari === sampai
  ) {
    return `PESANAN ${getDayName(
      dari
    )}, ${formatDateTitle(
      dari
    )} (SANTRI KELAS 1-6)`;
  }

  if (dari && sampai) {
    return `PESANAN ${formatDateTitle(
      dari
    )} - ${formatDateTitle(
      sampai
    )} (SANTRI KELAS 1-6)`;
  }

  return "PESANAN KANTIN";
}


/*
|--------------------------------------------------------------------------
| HEADER LAPORAN DARI PENGATURAN
|--------------------------------------------------------------------------
*/

function createReportHeaderLines(
  data
) {
  const settings =
    data.settings || {};

  const lines = [];

  /*
   * Judul laporan.
   *
   * Jika belum ada judul di
   * Pengaturan, gunakan judul
   * berdasarkan tanggal seperti
   * format TXT lama.
   */
  lines.push(
    settings.judulLaporan ||
      createTitle(data)
  );


  /*
   * Nama kantin
   */
  if (
    settings.namaKantin
  ) {
    lines.push(
      settings.namaKantin
    );
  }


  /*
   * Nama pesantren
   */
  if (
    settings.namaPesantren
  ) {
    lines.push(
      settings.namaPesantren
    );
  }


  /*
   * Alamat
   */
  if (
    settings.alamat
  ) {
    lines.push(
      settings.alamat
    );
  }


  return lines;
}


/*
|--------------------------------------------------------------------------
| FOOTER LAPORAN
|--------------------------------------------------------------------------
*/

function appendFooter(
  lines,
  data
) {
  const footer =
    data.settings?.footerLaporan ||
    "";

  if (!footer) {
    return;
  }

  lines.push("");

  lines.push(
    footer
  );
}


/*
|--------------------------------------------------------------------------
| NAMA MENU MAKANAN / MINUMAN
|--------------------------------------------------------------------------
*/

function getStandardMenuName(item) {
  const nama =
    normalizeText(
      item.namaMenu || ""
    );


  if (
    nama.includes(
      "ayam utuh"
    ) &&
    (
      nama.includes("kentaki") ||
      nama.includes("kentaky") ||
      nama.includes("kentucky")
    )
  ) {
    return "ayam utuh kentaki";
  }


  if (
    nama.includes("kentaki") ||
    nama.includes("kentaky") ||
    nama.includes("kentucky")
  ) {
    if (
      nama.includes("nasi")
    ) {
      return "Kentaki nasi";
    }

    return "Kentaki";
  }


  if (
    nama.includes("geprek")
  ) {
    if (
      nama.includes("nasi")
    ) {
      return "Geprek nasi";
    }

    return "Geprek";
  }


  if (
    nama.includes("ayam bakar")
  ) {
    if (
      nama.includes("nasi")
    ) {
      return "Ayam bakar nasi";
    }

    return "Ayam bakar";
  }


  if (
    nama.includes(
      "ayam lalapan"
    )
  ) {
    if (
      nama.includes("nasi")
    ) {
      return "Ayam lalapan nasi";
    }

    return "Ayam lalapan";
  }


  if (
    nama.includes(
      "nasi goreng"
    ) ||
    nama.includes(
      "nasgor"
    )
  ) {
    return "Nasi goreng";
  }


  if (
    nama.includes("teh") &&
    nama.includes("jumbo")
  ) {
    return "Es teh jumbo";
  }


  if (
    nama === "teh" ||
    nama.includes("es teh")
  ) {
    return "Es teh";
  }


  if (
    nama.includes("jeruk")
  ) {
    return "Es jeruk";
  }


  if (
    nama.includes("melon")
  ) {
    return "Es melon";
  }


  if (
    nama.includes("sirup")
  ) {
    return "Es sirup";
  }


  if (
    nama.includes("leci")
  ) {
    return "Es leci";
  }


  if (
    nama.includes(
      "rice bowl"
    ) ||
    nama.includes(
      "ricebowl"
    )
  ) {
    return "Rice bowl";
  }


  return String(
    item.namaMenu || "-"
  ).trim();
}


/*
|--------------------------------------------------------------------------
| REKAP MAKANAN / MINUMAN
|--------------------------------------------------------------------------
*/

function buildNormalSummary(
  orders,
  allowedCategory
) {
  const totals =
    new Map();


  for (
    const order
    of orders || []
  ) {

    for (
      const item
      of order.items || []
    ) {

      const kategori =
        normalizeText(
          item.kategori || ""
        );


      if (
        kategori !==
        normalizeText(
          allowedCategory
        )
      ) {
        continue;
      }


      const jumlah =
        Number(
          item.jumlah
        ) || 0;


      if (!jumlah) {
        continue;
      }


      const nama =
        getStandardMenuName(
          item
        );


      const key =
        normalizeText(
          nama
        );


      if (
        !totals.has(key)
      ) {
        totals.set(
          key,
          {
            nama,
            jumlah: 0
          }
        );
      }


      totals.get(
        key
      ).jumlah += jumlah;
    }
  }


  return Array.from(
    totals.values()
  );
}


/*
|--------------------------------------------------------------------------
| REKAP PISANG KEJU
|--------------------------------------------------------------------------
|
| Variasi mengikuti Master Menu.
| Tidak dibuat daftar variasi hard-code.
|
| Ukuran:
| - Reguler
| - Jumbo
|
|--------------------------------------------------------------------------
*/

function buildBananaSummary(
  orders
) {
  const map =
    new Map();


  for (
    const order
    of orders || []
  ) {

    for (
      const item
      of order.items || []
    ) {

      if (
        normalizeText(
          item.kategori || ""
        ) !==
        "pisang keju"
      ) {
        continue;
      }


      const variasi =
        String(
          item.varian ||
          item.namaMenu ||
          "Tanpa Variasi"
        ).trim();


      const ukuran =
        String(
          item.ukuran ||
          "Tanpa Ukuran"
        ).trim();


      const key =
        `${normalizeText(
          variasi
        )}|${normalizeText(
          ukuran
        )}`;


      if (
        !map.has(key)
      ) {
        map.set(
          key,
          {
            variasi,
            ukuran,
            jumlah: 0
          }
        );
      }


      map.get(
        key
      ).jumlah +=
        Number(
          item.jumlah
        ) || 0;
    }
  }


  return Array.from(
    map.values()
  );
}


/*
|--------------------------------------------------------------------------
| TXT PISANG KEJU
|--------------------------------------------------------------------------
*/

function createBananaText(
  data
) {
  const rows =
    buildBananaSummary(
      data.rawOrders
    );


  const reguler =
    rows.filter(
      (row) =>
        normalizeText(
          row.ukuran
        ) === "reguler"
    );


  const jumbo =
    rows.filter(
      (row) =>
        normalizeText(
          row.ukuran
        ) === "jumbo"
    );


  const lines = [];


  /*
   * Header Pengaturan
   */
  lines.push(
    ...createReportHeaderLines(
      data
    )
  );


  lines.push("");


  lines.push(
    "PISANG KEJU - REGULER"
  );


  lines.push("");


  for (
    const row
    of reguler
  ) {
    lines.push(
      `🍄${row.variasi} : ${row.jumlah}`
    );
  }


  if (
    !reguler.length
  ) {
    lines.push(
      "🍄Belum ada pesanan"
    );
  }


  lines.push("");


  lines.push(
    "PISANG KEJU - JUMBO"
  );


  lines.push("");


  for (
    const row
    of jumbo
  ) {
    lines.push(
      `🍄${row.variasi} : ${row.jumlah}`
    );
  }


  if (
    !jumbo.length
  ) {
    lines.push(
      "🍄Belum ada pesanan"
    );
  }


  appendFooter(
    lines,
    data
  );


  return lines.join(
    "\n"
  );
}


/*
|--------------------------------------------------------------------------
| TXT MAKANAN
|--------------------------------------------------------------------------
*/

function createFoodText(
  data
) {
  const rows =
    buildNormalSummary(
      data.rawOrders,
      "Makanan"
    );


  const preferredOrder = [
    "ayam utuh kentaki",
    "Kentaki",
    "Geprek",
    "Kentaki nasi",
    "Geprek nasi",
    "Ayam bakar",
    "Ayam lalapan",
    "Ayam bakar nasi",
    "Ayam lalapan nasi",
    "Nasi goreng",
    "Rice bowl"
  ];


  const sorted = [];


  for (
    const name
    of preferredOrder
  ) {

    const found =
      rows.find(
        (row) =>
          normalizeText(
            row.nama
          ) ===
          normalizeText(
            name
          )
      );


    if (found) {
      sorted.push(found);
    }
  }


  for (
    const row
    of rows
  ) {
    if (
      !sorted.includes(row)
    ) {
      sorted.push(row);
    }
  }


  const lines = [];


  /*
   * Header Pengaturan
   */
  lines.push(
    ...createReportHeaderLines(
      data
    )
  );


  lines.push("");


  for (
    const row
    of sorted
  ) {
    lines.push(
      `🍄${row.nama} : ${row.jumlah}`
    );
  }


  if (
    !sorted.length
  ) {
    lines.push(
      "🍄Belum ada pesanan"
    );
  }


  appendFooter(
    lines,
    data
  );


  return lines.join(
    "\n"
  );
}


/*
|--------------------------------------------------------------------------
| TXT MINUMAN
|--------------------------------------------------------------------------
*/

function createDrinkText(
  data
) {
  const orders =
    data.rawOrders || [];


  /*
   * Struktur:
   *
   * Cappuccino
   *   Original
   *   Boba
   *   Cincau
   *
   * Matcha
   *   Original
   *   Boba
   *   Cincau
   *
   * dst.
   */

  const drinkMap =
    new Map();


  /*
   * Urutan minuman utama.
   */
  const preferredDrinks = [
    {
      key: "cappuccino",
      nama: "es cappucino",
      icon: "🧋"
    },

    {
      key: "matcha",
      nama: "es matcha",
      icon: "🍵"
    },

    {
      key: "thai tea",
      nama: "es thaitea",
      icon: "🍺"
    },

    {
      key: "coklat",
      nama: "es coklat",
      icon: "🧉"
    }
  ];


  /*
   * Variasi utama.
   */
  const preferredVariants = [
    "Original",
    "Boba",
    "Cincau"
  ];


  /*
   * Baca semua order.
   */
  for (
    const order
    of orders
  ) {

    for (
      const item
      of order.items || []
    ) {

      if (
        normalizeText(
          item.kategori || ""
        ) !==
        "minuman"
      ) {
        continue;
      }


      const rawNama =
        String(
          item.namaMenu || ""
        ).trim();


      const rawVarian =
        String(
          item.varian || ""
        ).trim();


      if (!rawNama) {
        continue;
      }


      /*
       * Nama minuman.
       */
      const namaNormalized =
        normalizeText(
          rawNama
        );


      /*
       * Tentukan nama kelompok.
       */
      let drink = null;


      if (
        namaNormalized.includes(
          "cappuccino"
        ) ||
        namaNormalized.includes(
          "cappucino"
        )
      ) {

        drink = {
          key: "cappuccino",
          nama: "es cappucino",
          icon: "🧋"
        };

      } else if (
        namaNormalized.includes(
          "matcha"
        )
      ) {

        drink = {
          key: "matcha",
          nama: "es matcha",
          icon: "🍵"
        };

      } else if (
        namaNormalized.includes(
          "thai tea"
        ) ||
        namaNormalized.includes(
          "thaitea"
        )
      ) {

        drink = {
          key: "thai tea",
          nama: "es thaitea",
          icon: "🍺"
        };

      } else if (
        namaNormalized.includes(
          "coklat"
        ) ||
        namaNormalized.includes(
          "chocolate"
        )
      ) {

        drink = {
          key: "coklat",
          nama: "es coklat",
          icon: "🧉"
        };

      } else {

        /*
         * Minuman lain tetap ditampilkan.
         */
        drink = {
          key: namaNormalized,
          nama: rawNama,
          icon: "🥤"
        };
      }


      if (
        !drinkMap.has(
          drink.key
        )
      ) {
        drinkMap.set(
          drink.key,
          {
            ...drink,
            variants:
              new Map()
          }
        );
      }


      /*
       * Normalisasi varian.
       */
      let variant =
        normalizeText(
          rawVarian
        );


      if (
        variant ===
        "original"
      ) {
        variant =
          "Original";

      } else if (
        variant ===
        "ori"
      ) {
        variant =
          "Original";

      } else if (
        variant ===
        "boba"
      ) {
        variant =
          "Boba";

      } else if (
        variant ===
        "cincau"
      ) {
        variant =
          "Cincau";

      } else if (
        !variant
      ) {
        variant =
          "Original";

      } else {

        /*
         * Varian tambahan yang
         * mungkin nanti dibuat di
         * Master Menu.
         */
        variant =
          rawVarian;
      }


      const jumlah =
        Number(
          item.jumlah
        ) || 0;


      const drinkData =
        drinkMap.get(
          drink.key
        );


      const variantKey =
        normalizeText(
          variant
        );


      if (
        !drinkData.variants.has(
          variantKey
        )
      ) {
        drinkData.variants.set(
          variantKey,
          {
            nama: variant,
            jumlah: 0
          }
        );
      }


      drinkData.variants.get(
        variantKey
      ).jumlah += jumlah;
    }
  }


  /*
   * Susun minuman berdasarkan
   * urutan yang diinginkan.
   */
  const sortedDrinks = [];


  for (
    const preferred
    of preferredDrinks
  ) {

    const found =
      drinkMap.get(
        preferred.key
      );


    if (found) {
      sortedDrinks.push(
        found
      );

      drinkMap.delete(
        preferred.key
      );
    }
  }


  /*
   * Minuman tambahan dari
   * Master Menu tetap masuk.
   */
  const additionalDrinks =
    Array.from(
      drinkMap.values()
    ).sort(
      (a, b) =>
        a.nama.localeCompare(
          b.nama,
          "id"
        )
    );


  sortedDrinks.push(
    ...additionalDrinks
  );


  /*
   * Buat TXT.
   */
  const lines = [];


  /*
   * Header Pengaturan.
   */
  lines.push(
    ...createReportHeaderLines(
      data
    )
  );


  lines.push("");


  lines.push(
    "3. Kategori Minuman"
  );


  lines.push("");


  if (
    sortedDrinks.length === 0
  ) {

    lines.push(
      "Belum ada pesanan minuman."
    );

  } else {

    for (
      const drink
      of sortedDrinks
    ) {

      lines.push(
        `${drink.icon}${drink.nama}`
      );


      /*
       * Tampilkan 3 variasi utama:
       *
       * Original
       * Boba
       * Cincau
       */
      for (
        const variantName
        of preferredVariants
      ) {

        const key =
          normalizeText(
            variantName
          );


        const variant =
          drink.variants.get(
            key
          );


        const jumlah =
          variant
            ? variant.jumlah
            : 0;


        lines.push(
          `${variantName} : ${jumlah}`
        );
      }


      /*
       * Varian tambahan dari
       * Master Menu.
       */
      const additionalVariants =
        Array.from(
          drink.variants.values()
        ).filter(
          (variant) =>
            !preferredVariants.some(
              (preferred) =>
                normalizeText(
                  preferred
                ) ===
                normalizeText(
                  variant.nama
                )
            )
        );


      for (
        const variant
        of additionalVariants
      ) {
        lines.push(
          `${variant.nama} : ${variant.jumlah}`
        );
      }


      lines.push("");
    }
  }


  appendFooter(
    lines,
    data
  );


  return lines.join(
    "\n"
  );
}


/*
|--------------------------------------------------------------------------
| TXT PEMBAGIAN
|--------------------------------------------------------------------------
*/

function createDistributionText(
  data
) {
  const lines = [];


  /*
   * Header Pengaturan.
   */
  lines.push(
    ...createReportHeaderLines(
      data
    )
  );


  lines.push("");


  /*
   * Tanggal.
   */
  if (
    data.filters?.dari
  ) {

    lines.push(
      `Tanggal : ${data.filters.dari}${
        data.filters.sampai &&
        data.filters.sampai !==
          data.filters.dari
          ? ` s/d ${data.filters.sampai}`
          : ""
      }`
    );
  }


  lines.push("");


  /*
   * Data pembagian.
   */
  for (
    const row
    of data.rows || []
  ) {

    lines.push(
      `${row.no}. ${row.nama} | Kelas ${row.kelas}`
    );


    lines.push(
      `   Kamar : ${row.kamar}`
    );


    lines.push(
      `   Pesanan : ${String(
        row.pesanan || ""
      ).replace(
        /\n/g,
        ", "
      )}`
    );


    lines.push("");
  }


  appendFooter(
    lines,
    data
  );


  return lines.join(
    "\n"
  );
}


/*
|--------------------------------------------------------------------------
| MAIN EXPORT
|--------------------------------------------------------------------------
*/

export async function exportToTXT(
  data
) {
  /*
   * Ambil Pengaturan aplikasi.
   *
   * Karena getSettings()
   * membaca Firestore, fungsi
   * export menjadi async.
   */
  const settings =
    await getSettings();


  /*
   * Gabungkan settings dengan
   * data export yang sudah ada.
   */
  const exportData = {
    ...data,
    settings
  };


  let text = "";


  /*
   * TXT mengikuti laporan
   * yang dipilih di halaman Export.
   */
  switch (
    exportData.reportType
  ) {

    case "banana":
      text =
        createBananaText(
          exportData
        );
      break;


    case "food":
      text =
        createFoodText(
          exportData
        );
      break;


    case "drinks":
      text =
        createDrinkText(
          exportData
        );
      break;


    case "distribution":
      text =
        createDistributionText(
          exportData
        );
      break;


    default:
      text =
        createFoodText(
          exportData
        );
      break;
  }


  /*
   |--------------------------------------------------------------------------
   | FILE
   |--------------------------------------------------------------------------
   */

  const blob =
    new Blob(
      [text],
      {
        type:
          "text/plain;charset=utf-8"
      }
    );


  const fileName =
    `${safeFileName(
      settings.judulLaporan ||
        data.title ||
        "Pesanan-Kantin"
    )}.txt`;


  saveAs(
    blob,
    fileName
  );
}