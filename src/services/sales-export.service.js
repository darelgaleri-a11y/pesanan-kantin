import * as XLSX from "xlsx";
import { getSettings } from "./settings.service.js";

/*
|--------------------------------------------------------------------------
| NORMALISASI
|--------------------------------------------------------------------------
*/

function normalizeString(value) {
  return String(value ?? "").trim();
}

function normalizeNumber(value, fallback = 0) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return number;
}

function normalizeQuantity(value) {
  const quantity = normalizeNumber(value, 0);

  if (quantity <= 0) {
    return 0;
  }

  return quantity;
}

function normalizePrice(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const price = Number(value);

  if (!Number.isFinite(price) || price < 0) {
    return null;
  }

  return price;
}


/*
|--------------------------------------------------------------------------
| FORMAT RUPIAH
|--------------------------------------------------------------------------
*/

export function formatRupiah(value) {
  const number = normalizeNumber(value, 0);

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(number);
}


/*
|--------------------------------------------------------------------------
| FILTER
|--------------------------------------------------------------------------
*/

export function normalizeSalesFilters(filters = {}) {
  return {
    tanggalDari: normalizeString(filters.tanggalDari),
    tanggalSampai: normalizeString(filters.tanggalSampai),
    kamar: normalizeString(filters.kamar),
    kelas: normalizeString(filters.kelas),
    nama: normalizeString(filters.nama)
  };
}

export function filterSalesOrders(
  orders = [],
  filters = {}
) {
  const normalizedFilters =
    normalizeSalesFilters(filters);

  const {
    tanggalDari,
    tanggalSampai,
    kamar,
    kelas,
    nama
  } = normalizedFilters;

  return (
    Array.isArray(orders)
      ? orders
      : []
  ).filter((order) => {
    const orderTanggal =
      normalizeString(order?.tanggal);

    const orderKamar =
      normalizeString(order?.kamar);

    const orderKelas =
      normalizeString(order?.kelas);

    const orderNama =
      normalizeString(order?.nama);

    if (
      tanggalDari &&
      orderTanggal < tanggalDari
    ) {
      return false;
    }

    if (
      tanggalSampai &&
      orderTanggal > tanggalSampai
    ) {
      return false;
    }

    if (
      kamar &&
      orderKamar !== kamar
    ) {
      return false;
    }

    if (
      kelas &&
      orderKelas !== kelas
    ) {
      return false;
    }

    if (
      nama &&
      !orderNama
        .toLowerCase()
        .includes(nama.toLowerCase())
    ) {
      return false;
    }

    return true;
  });
}


/*
|--------------------------------------------------------------------------
| HITUNG REKAP PENJUALAN
|--------------------------------------------------------------------------
*/

export function buildSalesReportData(
  orders = [],
  filters = {}
) {
  const filteredOrders =
    filterSalesOrders(
      orders,
      filters
    );

  const menuMap = new Map();

  const missingPriceItems = [];

  let totalOmzet = 0;
  let totalItems = 0;
  let missingPriceCount = 0;
  let missingPriceQuantity = 0;

  for (const order of filteredOrders) {
    const items =
      Array.isArray(order?.items)
        ? order.items
        : [];

    for (
      let itemIndex = 0;
      itemIndex < items.length;
      itemIndex += 1
    ) {
      const item = items[itemIndex];

      const namaMenu =
        normalizeString(item?.namaMenu) ||
        "Menu Tidak Bernama";

      const jumlah =
        normalizeQuantity(item?.jumlah);

      totalItems += jumlah;

      const hargaSatuan =
        normalizePrice(item?.hargaSatuan);

      /*
       * Item tanpa harga tetap tercatat
       * sebagai item, tetapi tidak masuk
       * ke perhitungan omzet.
       */
      if (hargaSatuan === null) {
        missingPriceCount += 1;
        missingPriceQuantity += jumlah;

        missingPriceItems.push({
          tanggal: normalizeString(order?.tanggal),
          nama: normalizeString(order?.nama),
          kamar: normalizeString(order?.kamar),
          kelas: normalizeString(order?.kelas),
          menu: namaMenu,
          jumlah,
          itemIndex
        });

        continue;
      }

      const subtotal =
        hargaSatuan * jumlah;

      totalOmzet += subtotal;

      if (!menuMap.has(namaMenu)) {
        menuMap.set(namaMenu, {
          namaMenu,
          jumlah: 0,
          omzet: 0
        });
      }

      const menuSummary =
        menuMap.get(namaMenu);

      menuSummary.jumlah += jumlah;
      menuSummary.omzet += subtotal;
    }
  }

  const menuSummary =
    [...menuMap.values()]
      .sort((a, b) => {
        if (b.omzet !== a.omzet) {
          return b.omzet - a.omzet;
        }

        return a.namaMenu.localeCompare(
          b.namaMenu,
          "id-ID"
        );
      });

  return {
    filters:
      normalizeSalesFilters(filters),

    orders: filteredOrders,

    menuSummary,

    missingPriceItems,

    totalOmzet,

    transactionCount:
      filteredOrders.length,

    totalItems,

    missingPriceCount,

    missingPriceQuantity
  };
}


/*
|--------------------------------------------------------------------------
| LABEL FILTER
|--------------------------------------------------------------------------
*/

function formatFilterValue(
  value,
  fallback = "Semua"
) {
  const normalized =
    normalizeString(value);

  return normalized || fallback;
}


/*
|--------------------------------------------------------------------------
| NAMA FILE
|--------------------------------------------------------------------------
*/

function sanitizeFilenamePart(value) {
  return normalizeString(value)
    .replace(
      /[^a-zA-Z0-9-_]/g,
      "-"
    )
    .replace(
      /-+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    )
    .toLowerCase();
}

function buildFilenameBase(
  filters,
  settings = {}
) {
  const normalized =
    normalizeSalesFilters(filters);

  const from =
    sanitizeFilenamePart(
      normalized.tanggalDari
    ) || "awal";

  const to =
    sanitizeFilenamePart(
      normalized.tanggalSampai
    ) || "akhir";

  const reportTitle =
    sanitizeFilenamePart(
      settings.judulLaporan
    );

  if (reportTitle) {
    return `${reportTitle}-penjualan-${from}-${to}`;
  }

  return `rekap-penjualan-${from}-${to}`;
}


/*
|--------------------------------------------------------------------------
| HEADER PENGATURAN
|--------------------------------------------------------------------------
*/

function createReportHeaderRows(
  settings,
  activeFilters
) {
  const rows = [];

  rows.push([
    settings.judulLaporan ||
      "Rekap Penjualan"
  ]);

  if (settings.namaKantin) {
    rows.push([
      settings.namaKantin
    ]);
  }

  if (settings.namaPesantren) {
    rows.push([
      settings.namaPesantren
    ]);
  }

  if (settings.alamat) {
    rows.push([
      settings.alamat
    ]);
  }

  rows.push([
    "Periode",
    `${formatFilterValue(
      activeFilters.tanggalDari,
      "Semua"
    )} s/d ${formatFilterValue(
      activeFilters.tanggalSampai,
      "Semua"
    )}`
  ]);

  rows.push([
    "Kamar / Asrama",
    formatFilterValue(
      activeFilters.kamar
    )
  ]);

  rows.push([
    "Kelas",
    formatFilterValue(
      activeFilters.kelas
    )
  ]);

  rows.push([
    "Nama Santri",
    formatFilterValue(
      activeFilters.nama
    )
  ]);

  return rows;
}


/*
|--------------------------------------------------------------------------
| DOWNLOAD BLOB
|--------------------------------------------------------------------------
*/

function downloadBlob(
  blob,
  filename
) {
  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);

  link.click();

  link.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}


/*
|--------------------------------------------------------------------------
| EXPORT EXCEL
|--------------------------------------------------------------------------
*/

export async function exportSalesToExcel({
  orders = [],
  filters = {}
} = {}) {
  const settings =
    await getSettings();

  const report =
    buildSalesReportData(
      orders,
      filters
    );

  const {
    filters: activeFilters,
    menuSummary,
    missingPriceItems,
    totalOmzet,
    transactionCount,
    totalItems,
    missingPriceCount,
    missingPriceQuantity
  } = report;

  const rows = [];

  /*
   * HEADER
   */

  const headerRows =
    createReportHeaderRows(
      settings,
      activeFilters
    );

  headerRows.forEach((row) => {
    rows.push(row);
  });

  rows.push([]);

  /*
   * RINGKASAN
   */

  rows.push([
    "RINGKASAN"
  ]);

  rows.push([
    "Total Omzet",
    totalOmzet
  ]);

  rows.push([
    "Jumlah Transaksi",
    transactionCount
  ]);

  rows.push([
    "Jumlah Item Terjual",
    totalItems
  ]);

  rows.push([
    "Item Tanpa Harga",
    missingPriceCount
  ]);

  rows.push([
    "Jumlah Qty Tanpa Harga",
    missingPriceQuantity
  ]);

  rows.push([]);

  /*
   * REKAP PER MENU
   */

  rows.push([
    "REKAP PENJUALAN PER MENU"
  ]);

  rows.push([
    "No",
    "Menu",
    "Jumlah Terjual",
    "Omzet"
  ]);

  menuSummary.forEach(
    (item, index) => {
      rows.push([
        index + 1,
        item.namaMenu,
        item.jumlah,
        item.omzet
      ]);
    }
  );

  rows.push([
    "",
    "TOTAL",
    totalItems,
    totalOmzet
  ]);

  rows.push([]);

  /*
   * ITEM BELUM MEMILIKI HARGA
   */

  rows.push([
    "ITEM BELUM MEMILIKI HARGA"
  ]);

  rows.push([
    "No",
    "Tanggal",
    "Nama",
    "Kamar",
    "Kelas",
    "Menu",
    "Jumlah"
  ]);

  missingPriceItems.forEach(
    (item, index) => {
      rows.push([
        index + 1,
        item.tanggal,
        item.nama,
        item.kamar,
        item.kelas,
        item.menu,
        item.jumlah
      ]);
    }
  );

  if (missingPriceItems.length === 0) {
    rows.push([
      "-",
      "-",
      "-",
      "-",
      "-",
      "Tidak ada",
      0
    ]);
  }

  /*
   * FOOTER
   */

  if (settings.footerLaporan) {
    rows.push([]);
    rows.push([
      settings.footerLaporan
    ]);
  }

  const worksheet =
    XLSX.utils.aoa_to_sheet(rows);

  worksheet["!cols"] = [
    { wch: 7 },
    { wch: 30 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 32 },
    { wch: 14 }
  ];

  /*
   * MERGE HEADER
   */

  const mergeCount =
    headerRows.length;

  worksheet["!merges"] = [];

  for (
    let row = 0;
    row < mergeCount;
    row += 1
  ) {
    worksheet["!merges"].push({
      s: {
        r: row,
        c: 0
      },
      e: {
        r: row,
        c: 3
      }
    });
  }

  /*
   * FORMAT ANGKA
   */

  const range =
    XLSX.utils.decode_range(
      worksheet["!ref"]
    );

  for (
    let row = range.s.r;
    row <= range.e.r;
    row += 1
  ) {
    const secondCell =
      worksheet[
        XLSX.utils.encode_cell({
          r: row,
          c: 1
        })
      ];

    if (
      secondCell &&
      typeof secondCell.v === "number"
    ) {
      secondCell.z = "#,##0";
    }
  }

  Object.keys(worksheet).forEach(
    (cellAddress) => {
      if (cellAddress[0] === "!") {
        return;
      }

      const cell =
        worksheet[cellAddress];

      if (
        typeof cell?.v !== "number"
      ) {
        return;
      }

      const column =
        cellAddress.replace(
          /[0-9]/g,
          ""
        );

      if (column === "D") {
        cell.z = '"Rp" #,##0';
      } else {
        cell.z = "#,##0";
      }
    }
  );

  /*
   * WORKBOOK
   */

  const workbook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Rekap Penjualan"
  );

  /*
   * SHEET DETAIL TANPA HARGA
   */

  const missingRows = [
    [
      "Tanggal",
      "Nama",
      "Kamar",
      "Kelas",
      "Menu",
      "Jumlah"
    ]
  ];

  missingPriceItems.forEach(
    (item) => {
      missingRows.push([
        item.tanggal,
        item.nama,
        item.kamar,
        item.kelas,
        item.menu,
        item.jumlah
      ]);
    }
  );

  if (missingPriceItems.length === 0) {
    missingRows.push([
      "",
      "",
      "",
      "",
      "Tidak ada item tanpa harga",
      0
    ]);
  }

  const missingWorksheet =
    XLSX.utils.aoa_to_sheet(
      missingRows
    );

  missingWorksheet["!cols"] = [
    { wch: 14 },
    { wch: 24 },
    { wch: 20 },
    { wch: 12 },
    { wch: 32 },
    { wch: 12 }
  ];

  XLSX.utils.book_append_sheet(
    workbook,
    missingWorksheet,
    "Tanpa Harga"
  );

  const filename =
    `${buildFilenameBase(
      activeFilters,
      settings
    )}.xlsx`;

  XLSX.writeFile(
    workbook,
    filename
  );
}


/*
|--------------------------------------------------------------------------
| EXPORT TEXT
|--------------------------------------------------------------------------
*/

export async function exportSalesToText({
  orders = [],
  filters = {}
} = {}) {
  const settings =
    await getSettings();

  const report =
    buildSalesReportData(
      orders,
      filters
    );

  const {
    filters: activeFilters,
    menuSummary,
    missingPriceItems,
    totalOmzet,
    transactionCount,
    totalItems,
    missingPriceCount,
    missingPriceQuantity
  } = report;

  const lines = [];

  /*
   * HEADER
   */

  lines.push(
    "========================================"
  );

  lines.push(
    settings.judulLaporan ||
      "REKAP PENJUALAN"
  );

  if (settings.namaKantin) {
    lines.push(
      settings.namaKantin
    );
  }

  if (settings.namaPesantren) {
    lines.push(
      settings.namaPesantren
    );
  }

  if (settings.alamat) {
    lines.push(
      settings.alamat
    );
  }

  lines.push(
    "========================================"
  );

  lines.push(
    `Periode        : ${formatFilterValue(
      activeFilters.tanggalDari,
      "Semua"
    )} s/d ${formatFilterValue(
      activeFilters.tanggalSampai,
      "Semua"
    )}`
  );

  lines.push(
    `Kamar / Asrama : ${formatFilterValue(
      activeFilters.kamar
    )}`
  );

  lines.push(
    `Kelas          : ${formatFilterValue(
      activeFilters.kelas
    )}`
  );

  lines.push(
    `Nama Santri    : ${formatFilterValue(
      activeFilters.nama
    )}`
  );

  lines.push("");

  /*
   * RINGKASAN
   */

  lines.push(
    "RINGKASAN"
  );

  lines.push(
    "----------------------------------------"
  );

  lines.push(
    `Total Omzet       : ${formatRupiah(
      totalOmzet
    )}`
  );

  lines.push(
    `Jumlah Transaksi  : ${transactionCount}`
  );

  lines.push(
    `Jumlah Item       : ${totalItems}`
  );

  lines.push(
    `Item Tanpa Harga  : ${missingPriceCount}`
  );

  lines.push(
    `Qty Tanpa Harga   : ${missingPriceQuantity}`
  );

  lines.push("");

  /*
   * REKAP PER MENU
   */

  lines.push(
    "REKAP PENJUALAN PER MENU"
  );

  lines.push(
    "----------------------------------------"
  );

  if (menuSummary.length === 0) {
    lines.push(
      "Belum ada data penjualan."
    );
  } else {
    menuSummary.forEach(
      (item, index) => {
        lines.push(
          `${index + 1}. ${item.namaMenu}`
        );

        lines.push(
          `   Jumlah : ${item.jumlah}`
        );

        lines.push(
          `   Omzet  : ${formatRupiah(
            item.omzet
          )}`
        );

        lines.push("");
      }
    );
  }

  lines.push(
    "----------------------------------------"
  );

  lines.push(
    `TOTAL OMZET : ${formatRupiah(
      totalOmzet
    )}`
  );

  lines.push("");

  /*
   * ITEM BELUM MEMILIKI HARGA
   */

  lines.push(
    "ITEM BELUM MEMILIKI HARGA"
  );

  lines.push(
    "----------------------------------------"
  );

  if (missingPriceItems.length === 0) {
    lines.push(
      "Tidak ada item tanpa harga."
    );
  } else {
    missingPriceItems.forEach(
      (item, index) => {
        lines.push(
          `${index + 1}. ${item.menu}`
        );

        lines.push(
          `   Tanggal : ${item.tanggal}`
        );

        lines.push(
          `   Nama    : ${item.nama}`
        );

        lines.push(
          `   Kamar   : ${item.kamar}`
        );

        lines.push(
          `   Kelas   : ${item.kelas}`
        );

        lines.push(
          `   Jumlah  : ${item.jumlah}`
        );

        lines.push("");
      }
    );
  }

  /*
   * FOOTER
   */

  if (settings.footerLaporan) {
    lines.push("");
    lines.push(
      settings.footerLaporan
    );
  }

  lines.push(
    "========================================"
  );

  const text =
    lines.join("\r\n");

  const blob =
    new Blob(
      [text],
      {
        type:
          "text/plain;charset=utf-8"
      }
    );

  const filename =
    `${buildFilenameBase(
      activeFilters,
      settings
    )}.txt`;

  downloadBlob(
    blob,
    filename
  );
}