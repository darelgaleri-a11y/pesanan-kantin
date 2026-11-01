import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  VerticalAlign,
  BorderStyle,
  PageOrientation
} from "docx";

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


/*
|--------------------------------------------------------------------------
| FORMAT ITEM
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| SATU SANTRI = SATU BARIS
|--------------------------------------------------------------------------
*/

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
| CELL
|--------------------------------------------------------------------------
*/

function createCell(
  children,
  width,
  options = {}
) {
  return new TableCell({
    width: {
      size: width,
      type: WidthType.DXA
    },

    verticalAlign:
      options.verticalAlign ||
      VerticalAlign.TOP,

    margins: {
      top: 80,
      bottom: 80,
      left: 100,
      right: 100
    },

    children
  });
}


/*
|--------------------------------------------------------------------------
| PESANAN CELL
|--------------------------------------------------------------------------
*/

function createOrderCell(
  items
) {
  return new TableCell({
    width: {
      size: 6000,
      type: WidthType.DXA
    },

    verticalAlign:
      VerticalAlign.TOP,

    margins: {
      top: 80,
      bottom: 80,
      left: 100,
      right: 100
    },

    children:
      items.map(
        (item, index) =>
          new Paragraph({
            spacing: {
              after:
                index ===
                items.length - 1
                  ? 0
                  : 40
            },

            children: [
              new TextRun({
                text: item,
                size: 18
              })
            ]
          })
      )
  });
}


/*
|--------------------------------------------------------------------------
| EXPORT WORD
|--------------------------------------------------------------------------
*/

export async function exportToWord(
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
   * Tentukan kamar
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
   * Informasi tanggal
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
   | BORDER
   |--------------------------------------------------------------------------
   */

  const borders = {
    top: {
      style: BorderStyle.SINGLE,
      size: 4,
      color: "000000"
    },

    bottom: {
      style: BorderStyle.SINGLE,
      size: 4,
      color: "000000"
    },

    left: {
      style: BorderStyle.SINGLE,
      size: 4,
      color: "000000"
    },

    right: {
      style: BorderStyle.SINGLE,
      size: 4,
      color: "000000"
    }
  };


  /*
   |--------------------------------------------------------------------------
   | HEADER TABLE
   |--------------------------------------------------------------------------
   */

  const headerRow =
    new TableRow({
      tableHeader: true,

      children: [
        new TableCell({
          width: {
            size: 700,
            type: WidthType.DXA
          },

          verticalAlign:
            VerticalAlign.CENTER,

          borders,

          children: [
            new Paragraph({
              alignment:
                AlignmentType.CENTER,

              children: [
                new TextRun({
                  text: "No",
                  bold: true,
                  size: 18
                })
              ]
            })
          ]
        }),

        new TableCell({
          width: {
            size: 3000,
            type: WidthType.DXA
          },

          verticalAlign:
            VerticalAlign.CENTER,

          borders,

          children: [
            new Paragraph({
              alignment:
                AlignmentType.CENTER,

              children: [
                new TextRun({
                  text: "NAMA",
                  bold: true,
                  size: 18
                })
              ]
            })
          ]
        }),

        new TableCell({
          width: {
            size: 1200,
            type: WidthType.DXA
          },

          verticalAlign:
            VerticalAlign.CENTER,

          borders,

          children: [
            new Paragraph({
              alignment:
                AlignmentType.CENTER,

              children: [
                new TextRun({
                  text: "KELAS",
                  bold: true,
                  size: 18
                })
              ]
            })
          ]
        }),

        new TableCell({
          width: {
            size: 6000,
            type: WidthType.DXA
          },

          verticalAlign:
            VerticalAlign.CENTER,

          borders,

          children: [
            new Paragraph({
              alignment:
                AlignmentType.CENTER,

              children: [
                new TextRun({
                  text: "PESANAN",
                  bold: true,
                  size: 18
                })
              ]
            })
          ]
        }),

        new TableCell({
          width: {
            size: 1200,
            type: WidthType.DXA
          },

          verticalAlign:
            VerticalAlign.CENTER,

          borders,

          children: [
            new Paragraph({
              alignment:
                AlignmentType.CENTER,

              children: [
                new TextRun({
                  text: "TTD",
                  bold: true,
                  size: 18
                })
              ]
            })
          ]
        })
      ]
    });


  /*
   |--------------------------------------------------------------------------
   | DATA ROWS
   |--------------------------------------------------------------------------
   */

  const dataRows =
    rows.map(
      (row) =>
        new TableRow({
          children: [
            createCell(
              [
                new Paragraph({
                  alignment:
                    AlignmentType.CENTER,

                  children: [
                    new TextRun({
                      text:
                        String(
                          row.nomor
                        ),
                      size: 18
                    })
                  ]
                })
              ],
              700,
              {
                verticalAlign:
                  VerticalAlign.TOP
              }
            ),

            createCell(
              [
                new Paragraph({
                  children: [
                    new TextRun({
                      text:
                        row.nama,
                      size: 18
                    })
                  ]
                })
              ],
              3000
            ),

            createCell(
              [
                new Paragraph({
                  alignment:
                    AlignmentType.CENTER,

                  children: [
                    new TextRun({
                      text:
                        row.kelas,
                      size: 18
                    })
                  ]
                })
              ],
              1200
            ),

            createOrderCell(
              row.pesanan
            ),

            createCell(
              [
                new Paragraph({
                  alignment:
                    AlignmentType.CENTER,

                  children: [
                    new TextRun({
                      text: " ",
                      size: 18
                    })
                  ]
                })
              ],
              1200
            )
          ]
        })
    );


  /*
   * Jika kosong
   */
  if (!dataRows.length) {
    dataRows.push(
      new TableRow({
        children: [
          createCell(
            [
              new Paragraph("")
            ],
            700
          ),

          createCell(
            [
              new Paragraph("")
            ],
            3000
          ),

          createCell(
            [
              new Paragraph("")
            ],
            1200
          ),

          createCell(
            [
              new Paragraph({
                children: [
                  new TextRun({
                    text:
                      "Tidak ada pesanan",
                    size: 18
                  })
                ]
              })
            ],
            6000
          ),

          createCell(
            [
              new Paragraph("")
            ],
            1200
          )
        ]
      })
    );
  }


  /*
   |--------------------------------------------------------------------------
   | TABLE
   |--------------------------------------------------------------------------
   */

  const table =
    new Table({
      width: {
        size: 12100,
        type: WidthType.DXA
      },

      borders,

      rows: [
        headerRow,
        ...dataRows
      ]
    });


  /*
   |--------------------------------------------------------------------------
   | HEADER LAPORAN
   |--------------------------------------------------------------------------
   */

  const documentChildren = [];


  /*
   * Judul laporan
   */
  documentChildren.push(
    new Paragraph({
      alignment:
        AlignmentType.CENTER,

      spacing: {
        after: 60
      },

      children: [
        new TextRun({
          text:
            settings.judulLaporan ||
            "BUKU KIRIMAN MAKANAN",
          bold: true,
          size: 28
        })
      ]
    })
  );


  /*
   * Nama kantin
   */
  if (settings.namaKantin) {
    documentChildren.push(
      new Paragraph({
        alignment:
          AlignmentType.CENTER,

        spacing: {
          after: 40
        },

        children: [
          new TextRun({
            text:
              settings.namaKantin,
            bold: true,
            size: 20
          })
        ]
      })
    );
  }


  /*
   * Nama pesantren
   */
  if (settings.namaPesantren) {
    documentChildren.push(
      new Paragraph({
        alignment:
          AlignmentType.CENTER,

        spacing: {
          after: 40
        },

        children: [
          new TextRun({
            text:
              settings.namaPesantren,
            bold: true,
            size: 20
          })
        ]
      })
    );
  }


  /*
   * Alamat
   */
  if (settings.alamat) {
    documentChildren.push(
      new Paragraph({
        alignment:
          AlignmentType.CENTER,

        spacing: {
          after: 160
        },

        children: [
          new TextRun({
            text:
              settings.alamat,
            size: 18
          })
        ]
      })
    );
  } else {
    /*
     * Tetap beri jarak jika alamat
     * tidak diisi.
     */
    documentChildren.push(
      new Paragraph({
        spacing: {
          after: 100
        },

        children: [
          new TextRun({
            text: "",
            size: 18
          })
        ]
      })
    );
  }


  /*
   |--------------------------------------------------------------------------
   | INFORMASI KAMAR DAN TANGGAL
   |--------------------------------------------------------------------------
   */

  documentChildren.push(
    new Paragraph({
      spacing: {
        after: 100
      },

      children: [
        new TextRun({
          text:
            `KAMAR : ${kamarText}`,
          size: 18
        }),

        new TextRun({
          text:
            `\tTANGGAL : ${tanggalText}`,
          size: 18
        })
      ]
    })
  );


  /*
   |--------------------------------------------------------------------------
   | TABLE
   |--------------------------------------------------------------------------
   */

  documentChildren.push(
    table
  );


  /*
   |--------------------------------------------------------------------------
   | FOOTER LAPORAN
   |--------------------------------------------------------------------------
   */

  if (
    settings.footerLaporan
  ) {
    documentChildren.push(
      new Paragraph({
        alignment:
          AlignmentType.CENTER,

        spacing: {
          before: 160,
          after: 0
        },

        children: [
          new TextRun({
            text:
              settings.footerLaporan,
            size: 16
          })
        ]
      })
    );
  }


  /*
   |--------------------------------------------------------------------------
   | DOCUMENT
   |--------------------------------------------------------------------------
   */

  const document =
    new Document({
      sections: [
        {
          properties: {
            page: {
              size: {
                orientation:
                  PageOrientation.LANDSCAPE,

                width: 12240,
                height: 15840
              },

              margin: {
                top: 500,
                bottom: 500,
                left: 500,
                right: 500
              }
            }
          },

          children:
            documentChildren
        }
      ]
    });


  /*
   |--------------------------------------------------------------------------
   | GENERATE
   |--------------------------------------------------------------------------
   */

  const blob =
    await Packer.toBlob(
      document
    );


  const fileName =
    `${safeFileName(
      settings.judulLaporan ||
        "Buku-Kiriman-Makanan"
    )}-${safeFileName(
      tanggal ||
        "pesanan"
    )}.docx`;


  saveAs(
    blob,
    fileName
  );
}