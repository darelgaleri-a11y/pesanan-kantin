import jsPDF from "jspdf";
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

  const date = new Date(
    `${dateString}T00:00:00`
  );

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


function formatOrderItem(item) {
  const nama =
    String(
      item.namaMenu || ""
    ).trim();

  const varian =
    String(
      item.varian || ""
    ).trim();

  const ukuran =
    String(
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

  return `${bagian.join(
    " - "
  )} ×${jumlah}`;
}


function buildDistributionRows(
  orders = []
) {
  const rows = [];

  let nomor = 1;

  for (const order of orders) {
    const items =
      Array.isArray(order.items)
        ? order.items
        : [];

    if (!items.length) {
      continue;
    }

    const pesanan =
      items
        .map(formatOrderItem)
        .filter(Boolean);

    if (!pesanan.length) {
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

      pesanan
    });

    nomor++;
  }

  return rows;
}


/*
|--------------------------------------------------------------------------
| WRAP TEXT
|--------------------------------------------------------------------------
*/

function wrapText(
  doc,
  text,
  maxWidth
) {
  return doc.splitTextToSize(
    String(text || ""),
    maxWidth
  );
}


/*
|--------------------------------------------------------------------------
| EXPORT PDF
|--------------------------------------------------------------------------
*/

export async function exportToPDF(
  data
) {
  /*
   * Ambil pengaturan aplikasi.
   *
   * Data berasal dari:
   * settings/app
   */
  const settings =
    await getSettings();


  const orders =
    Array.isArray(
      data.rawOrders
    )
      ? data.rawOrders
      : [];


  const rows =
    buildDistributionRows(
      orders
    );


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
   |--------------------------------------------------------------------------
   | KAMAR
   |--------------------------------------------------------------------------
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
   | TANGGAL
   |--------------------------------------------------------------------------
   */

  let tanggalText =
    formatDateIndonesia(
      tanggal
    );


  if (
    sampai &&
    tanggal &&
    sampai !== tanggal
  ) {
    tanggalText =
      `${formatDateIndonesia(
        tanggal
      )} s/d ${formatDateIndonesia(
        sampai
      )}`;
  }


  /*
   |--------------------------------------------------------------------------
   | A4 LANDSCAPE
   |--------------------------------------------------------------------------
   */

  const doc =
    new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });


  const pageWidth =
    doc.internal.pageSize.getWidth();


  const pageHeight =
    doc.internal.pageSize.getHeight();


  const margin = 8;


  const tableWidth =
    pageWidth -
    margin * 2;


  /*
   |--------------------------------------------------------------------------
   | LEBAR KOLOM
   |--------------------------------------------------------------------------
   */

  const colNo = 12;
  const colNama = 50;
  const colKelas = 25;
  const colPesanan = 100;

  const colTtd =
    tableWidth -
    colNo -
    colNama -
    colKelas -
    colPesanan;


  /*
   |--------------------------------------------------------------------------
   | FUNGSI HEADER HALAMAN
   |--------------------------------------------------------------------------
   */

  function drawPageHeader(
    includeTableHeader = true
  ) {
    /*
     * Judul
     */
    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(14);

    doc.text(
      settings.judulLaporan ||
        "BUKU KIRIMAN MAKANAN",
      pageWidth / 2,
      9,
      {
        align: "center"
      }
    );


    /*
     * Nama kantin
     */
    let headerY = 14;

    if (settings.namaKantin) {
      doc.setFontSize(9);

      doc.text(
        settings.namaKantin,
        pageWidth / 2,
        headerY,
        {
          align: "center"
        }
      );

      headerY += 4;
    }


    /*
     * Nama pesantren
     */
    if (settings.namaPesantren) {
      doc.setFontSize(9);

      doc.text(
        settings.namaPesantren,
        pageWidth / 2,
        headerY,
        {
          align: "center"
        }
      );

      headerY += 4;
    }


    /*
     * Alamat
     */
    if (settings.alamat) {
      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(7.5);

      doc.text(
        settings.alamat,
        pageWidth / 2,
        headerY,
        {
          align: "center"
        }
      );

      headerY += 4;
    }


    /*
     * Informasi kamar dan tanggal
     */
    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(8);

    doc.text(
      `KAMAR : ${kamarText}`,
      margin,
      headerY + 2
    );

    doc.text(
      `TANGGAL : ${tanggalText}`,
      pageWidth - margin,
      headerY + 2,
      {
        align: "right"
      }
    );


    /*
     * Jika tidak perlu header tabel,
     * cukup kembalikan posisi setelah
     * informasi laporan.
     */
    if (!includeTableHeader) {
      return headerY + 8;
    }


    /*
     * Posisi tabel
     */
    let y =
      headerY + 6;


    /*
     * Header tabel
     */
    const headerHeight = 8;


    const drawCell =
      (
        x,
        cellY,
        width,
        height
      ) => {
        doc.rect(
          x,
          cellY,
          width,
          height
        );
      };


    const headers = [
      {
        text: "No",
        width: colNo
      },

      {
        text: "NAMA",
        width: colNama
      },

      {
        text: "KELAS",
        width: colKelas
      },

      {
        text: "PESANAN",
        width: colPesanan
      },

      {
        text: "TTD",
        width: colTtd
      }
    ];


    let x =
      margin;


    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(8);


    for (
      const header
      of headers
    ) {
      drawCell(
        x,
        y,
        header.width,
        headerHeight
      );

      doc.text(
        header.text,
        x +
          header.width / 2,
        y + 5.2,
        {
          align: "center"
        }
      );

      x +=
        header.width;
    }


    return y +
      headerHeight;
  }


  /*
   |--------------------------------------------------------------------------
   | GAMBAR HEADER HALAMAN PERTAMA
   |--------------------------------------------------------------------------
   */

  let y =
    drawPageHeader(
      true
    );


  /*
   |--------------------------------------------------------------------------
   | DATA
   |--------------------------------------------------------------------------
   */

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(7.5);


  /*
   * Fungsi menggambar baris
   */
  function drawDataRow(row) {
    /*
     * Buat setiap item menjadi
     * baris visual.
     */
    const pesananLines = [];

    for (
      const item
      of row.pesanan
    ) {
      const wrapped =
        wrapText(
          doc,
          item,
          colPesanan - 5
        );

      pesananLines.push(
        ...wrapped
      );
    }


    /*
     * Tinggi baris.
     */
    const lineHeight =
      4.2;

    const rowHeight =
      Math.max(
        10,
        pesananLines.length *
          lineHeight +
          4
      );


    /*
     * Kotak
     */
    let x =
      margin;

    const widths = [
      colNo,
      colNama,
      colKelas,
      colPesanan,
      colTtd
    ];


    for (
      const width
      of widths
    ) {
      doc.rect(
        x,
        y,
        width,
        rowHeight
      );

      x += width;
    }


    /*
     * No
     */
    doc.text(
      String(row.nomor),
      margin +
        colNo / 2,
      y + 6,
      {
        align: "center"
      }
    );


    /*
     * Nama
     */
    doc.text(
      wrapText(
        doc,
        row.nama,
        colNama - 5
      ),
      margin +
        colNo +
        2,
      y + 5
    );


    /*
     * Kelas
     */
    doc.text(
      String(
        row.kelas
      ),
      margin +
        colNo +
        colNama +
        colKelas / 2,
      y + 6,
      {
        align: "center"
      }
    );


    /*
     * Pesanan
     */
    const pesananX =
      margin +
      colNo +
      colNama +
      colKelas;


    doc.text(
      pesananLines,
      pesananX + 2,
      y + 5
    );


    y +=
      rowHeight;
  }


  /*
   |--------------------------------------------------------------------------
   | JIKA TIDAK ADA DATA
   |--------------------------------------------------------------------------
   */

  if (!rows.length) {
    const emptyHeight = 12;

    let x =
      margin;

    const emptyCells = [
      colNo,
      colNama,
      colKelas,
      colPesanan,
      colTtd
    ];


    for (
      const width
      of emptyCells
    ) {
      doc.rect(
        x,
        y,
        width,
        emptyHeight
      );

      x += width;
    }


    doc.text(
      "Tidak ada pesanan",
      margin +
        colNo +
        colNama +
        colKelas +
        3,
      y + 7
    );


    y +=
      emptyHeight;
  } else {
    /*
     |--------------------------------------------------------------------------
     | LOOP DATA
     |--------------------------------------------------------------------------
     */

    for (
      const row
      of rows
    ) {
      /*
       * Hitung tinggi baris
       * sebelum menggambar.
       */
      const pesananLines = [];

      for (
        const item
        of row.pesanan
      ) {
        const wrapped =
          wrapText(
            doc,
            item,
            colPesanan - 5
          );

        pesananLines.push(
          ...wrapped
        );
      }


      const lineHeight =
        4.2;

      const rowHeight =
        Math.max(
          10,
          pesananLines.length *
            lineHeight +
            4
        );


      /*
       * Kalau hampir mentok halaman,
       * buat halaman baru.
       */
      if (
        y +
          rowHeight >
        pageHeight - 12
      ) {
        doc.addPage(
          "a4",
          "landscape"
        );


        /*
         * Header laporan dan
         * header tabel di halaman baru.
         */
        y =
          drawPageHeader(
            true
          );


        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.setFontSize(7.5);
      }


      /*
       * Gambar baris secara langsung.
       */
      let x =
        margin;


      const widths = [
        colNo,
        colNama,
        colKelas,
        colPesanan,
        colTtd
      ];


      for (
        const width
        of widths
      ) {
        doc.rect(
          x,
          y,
          width,
          rowHeight
        );

        x += width;
      }


      /*
       * No
       */
      doc.text(
        String(row.nomor),
        margin +
          colNo / 2,
        y + 6,
        {
          align: "center"
        }
      );


      /*
       * Nama
       */
      doc.text(
        wrapText(
          doc,
          row.nama,
          colNama - 5
        ),
        margin +
          colNo +
          2,
        y + 5
      );


      /*
       * Kelas
       */
      doc.text(
        String(
          row.kelas
        ),
        margin +
          colNo +
          colNama +
          colKelas / 2,
        y + 6,
        {
          align: "center"
        }
      );


      /*
       * Pesanan
       */
      const pesananX =
        margin +
        colNo +
        colNama +
        colKelas;


      doc.text(
        pesananLines,
        pesananX + 2,
        y + 5
      );


      /*
       * TTD dibiarkan kosong
       * untuk tanda tangan manual.
       */

      y +=
        rowHeight;
    }
  }


  /*
   |--------------------------------------------------------------------------
   | FOOTER DI SETIAP HALAMAN
   |--------------------------------------------------------------------------
   */

  if (
    settings.footerLaporan
  ) {
    const pageCount =
      doc.getNumberOfPages();


    for (
      let page = 1;
      page <= pageCount;
      page++
    ) {
      doc.setPage(page);

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(7);

      doc.text(
        settings.footerLaporan,
        pageWidth / 2,
        pageHeight - 4,
        {
          align: "center"
        }
      );
    }
  }


  /*
   |--------------------------------------------------------------------------
   | FILE
   |--------------------------------------------------------------------------
   */

  const fileName =
    `${safeFileName(
      settings.judulLaporan ||
        "Buku-Kiriman-Makanan"
    )}-${safeFileName(
      tanggal ||
        "pesanan"
    )}.pdf`;


  const blob =
    doc.output(
      "blob"
    );


  saveAs(
    blob,
    fileName
  );
}