import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import { getSettings } from "../services/settings.service.js";

/*
|--------------------------------------------------------------------------
| UTILITAS
|--------------------------------------------------------------------------
*/

function safeFileName(value) {
  return String(value || "pesanan-kantin")
    .replace(/[<>:"/\\|?*]+/g, "-")
    .replace(/\s+/g, "-")
    .trim();
}

function formatDateIndonesia(dateString) {
  if (!dateString) return "";

  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  const months = [
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

  return `${date.getDate()} ${
    months[date.getMonth()]
  } ${date.getFullYear()}`;
}


/*
|--------------------------------------------------------------------------
| FORMAT SATU ITEM
|--------------------------------------------------------------------------
*/

function formatOrderItem(item) {
  const nama = String(
    item.namaMenu || ""
  ).trim();

  const varian = String(
    item.varian || ""
  ).trim();

  const ukuran = String(
    item.ukuran || ""
  ).trim();

  const jumlah =
    Number(item.jumlah) || 0;

  const bagian = [];

  if (nama) {
    bagian.push(nama);
  }

  if (varian) {
    bagian.push(varian);
  }

  if (ukuran) {
    bagian.push(ukuran);
  }

  const namaLengkap =
    bagian.join(" - ");

  return `${namaLengkap} ×${jumlah}`;
}


/*
|--------------------------------------------------------------------------
| BUAT BARIS DISTRIBUSI
|--------------------------------------------------------------------------
|
| SATU SANTRI = SATU BARIS
|
| Semua item pesanan dimasukkan ke
| satu cell menggunakan line break.
|
|--------------------------------------------------------------------------
*/

function buildDistributionRows(
  orders = []
) {
  const rows = [];
  let nomor = 1;

  for (const order of orders) {
    const items = Array.isArray(
      order.items
    )
      ? order.items
      : [];

    if (!items.length) {
      continue;
    }

    /*
     * Setiap item dibuat sebagai
     * teks pada baris berbeda.
     */
    const pesananLines =
      items
        .map((item) =>
          formatOrderItem(item)
        )
        .filter(Boolean);

    if (!pesananLines.length) {
      continue;
    }

    rows.push({
      nomor,

      nama:
        order.nama || "",

      kamar:
        order.kamar || "",

      kelas:
        order.kelas || "",

      /*
       * PENTING:
       *
       * Gunakan \n
       * bukan " - ".
       */
      pesanan:
        pesananLines.join("\n"),

      /*
       * Jumlah baris pesanan.
       * Dipakai untuk menentukan
       * tinggi baris Excel.
       */
      jumlahBaris:
        pesananLines.length
    });

    nomor++;
  }

  return rows;
}


/*
|--------------------------------------------------------------------------
| STYLE
|--------------------------------------------------------------------------
*/

const borderStyle = {
  top: {
    style: "thin",
    color: {
      rgb: "000000"
    }
  },

  bottom: {
    style: "thin",
    color: {
      rgb: "000000"
    }
  },

  left: {
    style: "thin",
    color: {
      rgb: "000000"
    }
  },

  right: {
    style: "thin",
    color: {
      rgb: "000000"
    }
  }
};


const titleStyle = {
  font: {
    bold: true,
    sz: 16
  },

  alignment: {
    horizontal: "center",
    vertical: "center"
  }
};


const subtitleStyle = {
  font: {
    bold: true,
    sz: 11
  },

  alignment: {
    horizontal: "center",
    vertical: "center"
  }
};


const headerStyle = {
  font: {
    bold: true,
    sz: 10
  },

  alignment: {
    horizontal: "center",
    vertical: "center",
    wrapText: true
  },

  border: borderStyle
};


const bodyStyle = {
  font: {
    sz: 10
  },

  alignment: {
    vertical: "top",
    wrapText: true
  },

  border: borderStyle
};


const centerBodyStyle = {
  font: {
    sz: 10
  },

  alignment: {
    horizontal: "center",
    vertical: "top",
    wrapText: true
  },

  border: borderStyle
};


/*
|--------------------------------------------------------------------------
| APPLY STYLE
|--------------------------------------------------------------------------
*/

function applyStyle(worksheet) {
  const range =
    XLSX.utils.decode_range(
      worksheet["!ref"]
    );

  for (
    let row = range.s.r;
    row <= range.e.r;
    row++
  ) {
    for (
      let col = range.s.c;
      col <= range.e.c;
      col++
    ) {
      const address =
        XLSX.utils.encode_cell({
          r: row,
          c: col
        });

      const cell =
        worksheet[address];

      if (!cell) {
        continue;
      }

      /*
       * Judul
       */
      if (row === 0) {
        cell.s = titleStyle;
        continue;
      }

      /*
       * Subtitle / nama kantin
       */
      if (row === 1) {
        cell.s = subtitleStyle;
        continue;
      }

      /*
       * Header tabel.
       *
       * Karena sekarang terdapat
       * baris alamat tambahan,
       * header berada di row 6.
       */
      if (row === 6) {
        cell.s = headerStyle;
        continue;
      }

      /*
       * No, Kelas, TTD
       */
      if (
        col === 0 ||
        col === 2 ||
        col === 4
      ) {
        cell.s = centerBodyStyle;
      } else {
        cell.s = bodyStyle;
      }
    }
  }
}


/*
|--------------------------------------------------------------------------
| EXPORT EXCEL
|--------------------------------------------------------------------------
*/

export async function exportToExcel(
  data
) {
  /*
   * Ambil pengaturan aplikasi.
   *
   * Pengaturan berasal dari:
   * settings/app
   */
  const settings =
    await getSettings();

  /*
   * Ambil data order mentah.
   */
  const orders =
    Array.isArray(
      data.rawOrders
    )
      ? data.rawOrders
      : [];


  /*
   * Buat baris distribusi.
   *
   * SATU SANTRI = SATU BARIS
   */
  const rows =
    buildDistributionRows(
      orders
    );


  /*
   * Filter
   */
  const filters =
    data.filters || {};

  const tanggal =
    filters.dari ||
    data.tanggal ||
    "";

  const sampai =
    filters.sampai ||
    tanggal;


  /*
   * Tentukan kamar.
   */
  const kamarSet =
    new Set(
      orders
        .map(
          (order) =>
            String(
              order.kamar || ""
            ).trim()
        )
        .filter(Boolean)
    );


  let kamarText =
    "SEMUA KAMAR";

  if (
    kamarSet.size === 1
  ) {
    kamarText =
      Array.from(
        kamarSet
      )[0];
  }


  /*
  |--------------------------------------------------------------------------
  | SHEET DATA
  |--------------------------------------------------------------------------
  */

  const sheetData = [];


  /*
   * Judul laporan
   *
   * Dari Pengaturan.
   *
   * Jika kosong, gunakan judul
   * default.
   */
  sheetData.push([
    settings.judulLaporan ||
      "BUKU KIRIMAN MAKANAN"
  ]);


  /*
   * Nama kantin
   */
  sheetData.push([
    settings.namaKantin || ""
  ]);


  /*
   * Nama pesantren
   */
  sheetData.push([
    settings.namaPesantren || ""
  ]);


  /*
   * Alamat / keterangan
   */
  sheetData.push([
    settings.alamat || ""
  ]);


  /*
   * Informasi kamar dan tanggal
   */
  sheetData.push([
    `KAMAR : ${kamarText}`,
    "",
    "",
    "",
    `TANGGAL : ${formatDateIndonesia(
      tanggal
    )}`
  ]);


  /*
   * Rentang tanggal
   */
  if (
    sampai &&
    tanggal &&
    sampai !== tanggal
  ) {
    sheetData[4][4] =
      `TANGGAL : ${formatDateIndonesia(
        tanggal
      )} s/d ${formatDateIndonesia(
        sampai
      )}`;
  }


  /*
   * Baris kosong
   */
  sheetData.push([
    ""
  ]);


  /*
   * Header
   */
  sheetData.push([
    "No",
    "Nama",
    "Kelas",
    "Pesanan",
    "TTD"
  ]);


  /*
  |--------------------------------------------------------------------------
  | DATA
  |--------------------------------------------------------------------------
  |
  | Satu santri = satu row Excel.
  |
  | Contoh isi cell PESANAN:
  |
  | Teh Jumbo ×1
  | Pisang Keju - Coklat - Jumbo ×1
  | Pisang Keju - Keju - Jumbo ×1
  |
  */

  for (
    const row of rows
  ) {
    sheetData.push([
      row.nomor,
      row.nama,
      row.kelas,
      row.pesanan,
      ""
    ]);
  }


  /*
   * Kalau tidak ada pesanan
   */
  if (!rows.length) {
    sheetData.push([
      "",
      "",
      "",
      "Tidak ada pesanan",
      ""
    ]);
  }


  /*
  |--------------------------------------------------------------------------
  | WORKBOOK
  |--------------------------------------------------------------------------
  */

  const workbook =
    XLSX.utils.book_new();


  const worksheet =
    XLSX.utils.aoa_to_sheet(
      sheetData
    );


  /*
  |--------------------------------------------------------------------------
  | MERGE JUDUL
  |--------------------------------------------------------------------------
  */

  worksheet["!merges"] = [
    {
      s: {
        r: 0,
        c: 0
      },

      e: {
        r: 0,
        c: 4
      }
    },

    {
      s: {
        r: 1,
        c: 0
      },

      e: {
        r: 1,
        c: 4
      }
    },

    {
      s: {
        r: 2,
        c: 0
      },

      e: {
        r: 2,
        c: 4
      }
    },

    {
      s: {
        r: 3,
        c: 0
      },

      e: {
        r: 3,
        c: 4
      }
    }
  ];


  /*
  |--------------------------------------------------------------------------
  | LEBAR KOLOM
  |--------------------------------------------------------------------------
  */

  worksheet["!cols"] = [
    {
      wch: 7
    },

    {
      wch: 28
    },

    {
      wch: 12
    },

    {
      wch: 52
    },

    {
      wch: 14
    }
  ];


  /*
  |--------------------------------------------------------------------------
  | TINGGI BARIS
  |--------------------------------------------------------------------------
  */

  worksheet["!rows"] = [
    {
      hpt: 28
    },

    {
      hpt: 20
    },

    {
      hpt: 20
    },

    {
      hpt: 20
    },

    {
      hpt: 22
    },

    {
      hpt: 8
    },

    {
      hpt: 24
    }
  ];


  /*
   * Tinggi setiap baris berdasarkan
   * jumlah pesanan.
   *
   * 1 pesanan  = 30 pt
   * 2 pesanan  = 45 pt
   * 3 pesanan  = 60 pt
   * dst.
   */
  for (
    let i = 7;
    i < sheetData.length;
    i++
  ) {
    const rowData =
      rows[i - 7];

    if (!rowData) {
      worksheet["!rows"][i] = {
        hpt: 30
      };

      continue;
    }

    const jumlahBaris =
      rowData.jumlahBaris || 1;

    const tinggi =
      Math.max(
        30,
        18 +
          jumlahBaris * 16
      );

    worksheet["!rows"][i] = {
      hpt: tinggi
    };
  }


  /*
  |--------------------------------------------------------------------------
  | FREEZE HEADER
  |--------------------------------------------------------------------------
  */

  worksheet["!freeze"] = {
    xSplit: 0,
    ySplit: 7
  };


  /*
  |--------------------------------------------------------------------------
  | STYLE
  |--------------------------------------------------------------------------
  */

  applyStyle(
    worksheet
  );


  /*
  |--------------------------------------------------------------------------
  | PRINT SETTINGS
  |--------------------------------------------------------------------------
  */

  worksheet["!printOptions"] = {
    horizontalCentered: true,
    verticalCentered: false
  };


  /*
   * Page setup.
   *
   * Landscape lebih cocok
   * untuk buku kiriman.
   */
  worksheet["!pageSetup"] = {
    orientation: "landscape",
    paperSize: 9,
    fitToWidth: 1,
    fitToHeight: 0
  };


  /*
  |--------------------------------------------------------------------------
  | NAMA SHEET
  |--------------------------------------------------------------------------
  */

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Rekap Pembagian"
  );


  /*
  |--------------------------------------------------------------------------
  | NAMA FILE
  |--------------------------------------------------------------------------
  */

  const fileName =
    `${safeFileName(
      settings.judulLaporan ||
        "Buku-Kiriman-Makanan"
    )}-${safeFileName(
      tanggal || "pesanan"
    )}.xlsx`;


  /*
  |--------------------------------------------------------------------------
  | GENERATE FILE
  |--------------------------------------------------------------------------
  */

  const excelBuffer =
    XLSX.write(
      workbook,
      {
        bookType: "xlsx",
        type: "array"
      }
    );


  const blob =
    new Blob(
      [excelBuffer],
      {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }
    );


  saveAs(
    blob,
    fileName
  );
}