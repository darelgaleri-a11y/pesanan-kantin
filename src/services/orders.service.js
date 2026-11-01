import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp
} from "firebase/firestore";

import { db } from "../firebase.js";


/*
|--------------------------------------------------------------------------
| COLLECTION
|--------------------------------------------------------------------------
*/

const ordersCollection =
  collection(
    db,
    "orders"
  );


/*
|--------------------------------------------------------------------------
| STATUS PESANAN
|--------------------------------------------------------------------------
|
| belum_dibagikan
| sebagian
| sudah_dibagikan
|
|--------------------------------------------------------------------------
*/

export function calculateOrderStatus(
  items = []
) {

  if (!Array.isArray(items) || items.length === 0) {

    return "belum_dibagikan";

  }


  const totalItems =
    items.length;


  const distributedItems =
    items.filter(
      (item) =>
        item?.dibagikan === true
    ).length;


  if (distributedItems === 0) {

    return "belum_dibagikan";

  }


  if (
    distributedItems ===
    totalItems
  ) {

    return "sudah_dibagikan";

  }


  return "sebagian";
}


/*
|--------------------------------------------------------------------------
| NORMALIZE PRICE
|--------------------------------------------------------------------------
|
| null = transaksi belum mempunyai harga.
|
| Penting:
| Pesanan lama yang belum memiliki harga
| tidak boleh otomatis mengambil harga
| terbaru dari Master Menu.
|
|--------------------------------------------------------------------------
*/

function normalizePrice(
  value
) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {

    return null;

  }


  const number =
    Number(value);


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
| NORMALIZE ORDER ITEM
|--------------------------------------------------------------------------
*/

export function normalizeOrderItem(
  item = {},
  preserveDistribution = false
) {

  const jumlah =
    Number(item.jumlah);


  const normalizedJumlah =
    Number.isInteger(jumlah) &&
    jumlah > 0
      ? jumlah
      : 1;


  /*
   * Harga satuan adalah snapshot harga
   * ketika transaksi dibuat.
   */

  const hargaSatuan =
    normalizePrice(
      item.hargaSatuan
    );


  /*
   * Subtotal dihitung ulang dari
   * harga snapshot × jumlah.
   *
   * Jika harga belum tersedia,
   * subtotal tetap null.
   */

  const subtotal =
    hargaSatuan !== null
      ? hargaSatuan *
        normalizedJumlah
      : null;


  return {

    menuId:
      String(
        item.menuId || ""
      ),

    namaMenu:
      String(
        item.namaMenu || ""
      ).trim(),

    kategori:
      String(
        item.kategori ||
        "Lainnya"
      ).trim(),

    varian:
      String(
        item.varian || ""
      ).trim(),

    ukuran:
      String(
        item.ukuran || ""
      ).trim(),

    jumlah:
      normalizedJumlah,

    /*
     * Snapshot harga transaksi.
     */

    hargaSatuan,

    subtotal,

    /*
     * Status distribusi.
     *
     * preserveDistribution digunakan
     * ketika data lama sedang diedit.
     */

    dibagikan:
      preserveDistribution
        ? item.dibagikan === true
        : false

  };
}


/*
|--------------------------------------------------------------------------
| CREATE ORDER
|--------------------------------------------------------------------------
*/

export async function createOrder(
  orderData
) {

  if (
    !orderData ||
    typeof orderData !== "object"
  ) {

    throw new Error(
      "Data pesanan tidak valid."
    );

  }


  const rawItems =
    Array.isArray(
      orderData.items
    )
      ? orderData.items
      : [];


  if (rawItems.length === 0) {

    throw new Error(
      "Minimal harus ada satu item pesanan."
    );

  }


  const items =
    rawItems.map(
      (item) =>
        normalizeOrderItem(
          item,
          false
        )
    );


  const status =
    calculateOrderStatus(
      items
    );


  const data = {

    tanggal:
      String(
        orderData.tanggal || ""
      ).trim(),

    nama:
      String(
        orderData.nama || ""
      ).trim(),

    kelas:
      String(
        orderData.kelas || ""
      ).trim(),

    kamar:
      String(
        orderData.kamar || ""
      ).trim(),

    catatan:
      String(
        orderData.catatan || ""
      ).trim(),

    status,

    items,

    createdAt:
      serverTimestamp(),

    updatedAt:
      serverTimestamp()

  };


  const docRef =
    await addDoc(
      ordersCollection,
      data
    );


  return {

    id:
      docRef.id,

    ...data

  };
}


/*
|--------------------------------------------------------------------------
| GET ALL ORDERS
|--------------------------------------------------------------------------
*/

export async function getOrders() {

  const q =
    query(
      ordersCollection,
      orderBy(
        "tanggal",
        "desc"
      )
    );


  const snapshot =
    await getDocs(q);


  return snapshot.docs.map(
    (docItem) => ({

      id:
        docItem.id,

      ...docItem.data()

    })
  );
}


/*
|--------------------------------------------------------------------------
| GET ORDER BY ID
|--------------------------------------------------------------------------
*/

export async function getOrderById(
  orderId
) {

  if (!orderId) {

    return null;

  }


  const docRef =
    doc(
      db,
      "orders",
      orderId
    );


  const snapshot =
    await getDoc(
      docRef
    );


  if (!snapshot.exists()) {

    return null;

  }


  return {

    id:
      snapshot.id,

    ...snapshot.data()

  };
}


/*
|--------------------------------------------------------------------------
| GET ORDERS BY DATE
|--------------------------------------------------------------------------
*/

export async function getOrdersByDate(
  tanggal
) {

  if (!tanggal) {

    return [];

  }


  const q =
    query(
      ordersCollection,
      where(
        "tanggal",
        "==",
        tanggal
      ),
      orderBy(
        "nama",
        "asc"
      )
    );


  const snapshot =
    await getDocs(q);


  return snapshot.docs.map(
    (docItem) => ({

      id:
        docItem.id,

      ...docItem.data()

    })
  );
}


/*
|--------------------------------------------------------------------------
| UPDATE ORDER
|--------------------------------------------------------------------------
|
| Aturan penting:
|
| 1. Item lama + menu sama
|    → harga lama dipertahankan.
|
| 2. Item lama + menu diganti
|    → gunakan harga yang dikirim
|      dari form berdasarkan Master Menu.
|
| 3. Item baru
|    → gunakan harga yang dikirim
|      dari form.
|
| 4. Legacy order tanpa harga
|    → tetap tanpa harga.
|
| 5. Status dibagikan dipertahankan
|    hanya jika menu masih sama.
|
|--------------------------------------------------------------------------
*/

export async function updateOrder(
  orderId,
  orderData
) {

  if (!orderId) {

    throw new Error(
      "ID pesanan tidak ditemukan."
    );

  }


  if (
    !orderData ||
    typeof orderData !== "object"
  ) {

    throw new Error(
      "Data pesanan tidak valid."
    );

  }


  const existingOrder =
    await getOrderById(
      orderId
    );


  if (!existingOrder) {

    throw new Error(
      "Pesanan tidak ditemukan."
    );

  }


  const oldItems =
    Array.isArray(
      existingOrder.items
    )
      ? existingOrder.items
      : [];


  const rawItems =
    Array.isArray(
      orderData.items
    )
      ? orderData.items
      : [];


  if (rawItems.length === 0) {

    throw new Error(
      "Minimal harus ada satu item pesanan."
    );

  }


  const items =
    rawItems.map(
      (item, index) => {

        const oldItem =
          oldItems[index] ||
          null;


        /*
         * Hanya dianggap item lama
         * jika menuId masih sama.
         */

        const sameMenu =
          oldItem &&
          oldItem.menuId ===
            item.menuId;


        /*
         * Buat item normal terlebih dahulu.
         *
         * preserveDistribution false karena
         * kita tentukan sendiri di bawah.
         */

        const normalized =
          normalizeOrderItem(
            item,
            false
          );


        /*
         * Jika menu masih sama,
         * pertahankan status pembagian lama.
         */

        if (sameMenu) {

          normalized.dibagikan =
            oldItem.dibagikan === true;

        } else {

          /*
           * Kalau menu diganti,
           * item dianggap sebagai item baru.
           */

          normalized.dibagikan =
            false;

        }


        /*
         * Untuk keamanan harga:
         *
         * Jika item lama dan menu sama,
         * tetapi data yang dikirim tidak
         * mempunyai harga, jangan mengambil
         * harga baru dari Master Menu.
         *
         * Pertahankan harga lama jika memang ada.
         */

        if (
          sameMenu &&
          normalized.hargaSatuan === null
        ) {

          const oldPrice =
            normalizePrice(
              oldItem.hargaSatuan
            );


          normalized.hargaSatuan =
            oldPrice;


          normalized.subtotal =
            oldPrice !== null
              ? oldPrice *
                normalized.jumlah
              : null;

        }


        /*
         * Pastikan subtotal selalu sesuai
         * dengan harga snapshot.
         */

        if (
          normalized.hargaSatuan !==
          null
        ) {

          normalized.subtotal =
            normalized.hargaSatuan *
            normalized.jumlah;

        } else {

          normalized.subtotal =
            null;

        }


        return normalized;

      }
    );


  const status =
    calculateOrderStatus(
      items
    );


  const updateData = {

    tanggal:
      String(
        orderData.tanggal || ""
      ).trim(),

    nama:
      String(
        orderData.nama || ""
      ).trim(),

    kelas:
      String(
        orderData.kelas || ""
      ).trim(),

    kamar:
      String(
        orderData.kamar || ""
      ).trim(),

    catatan:
      String(
        orderData.catatan || ""
      ).trim(),

    status,

    items,

    updatedAt:
      serverTimestamp()

  };


  const docRef =
    doc(
      db,
      "orders",
      orderId
    );


  await updateDoc(
    docRef,
    updateData
  );


  return {

    id:
      orderId,

    ...existingOrder,

    ...updateData

  };
}


/*
|--------------------------------------------------------------------------
| DELETE ORDER
|--------------------------------------------------------------------------
*/

export async function deleteOrder(
  orderId
) {

  if (!orderId) {

    throw new Error(
      "ID pesanan tidak ditemukan."
    );

  }


  const docRef =
    doc(
      db,
      "orders",
      orderId
    );


  await deleteDoc(
    docRef
  );


  return true;
}


/*
|--------------------------------------------------------------------------
| UPDATE ITEM DISTRIBUTION STATUS
|--------------------------------------------------------------------------
|
| Digunakan oleh Rekap Pembagian.
|
| Contoh:
|
| updateItemDistributionStatus(
|   orderId,
|   0,
|   true
| );
|
|--------------------------------------------------------------------------
*/

export async function updateItemDistributionStatus(
  orderId,
  itemIndex,
  dibagikan
) {

  if (!orderId) {

    throw new Error(
      "ID pesanan tidak ditemukan."
    );

  }


  if (
    !Number.isInteger(
      itemIndex
    ) ||
    itemIndex < 0
  ) {

    throw new Error(
      "Index item tidak valid."
    );

  }


  const order =
    await getOrderById(
      orderId
    );


  if (!order) {

    throw new Error(
      "Pesanan tidak ditemukan."
    );

  }


  const items =
    Array.isArray(
      order.items
    )
      ? order.items.map(
          (item) => ({
            ...item
          })
        )
      : [];


  if (
    itemIndex >=
    items.length
  ) {

    throw new Error(
      "Item pesanan tidak ditemukan."
    );

  }


  /*
   * Update checkbox item.
   */

  items[itemIndex].dibagikan =
    dibagikan === true;


  /*
   * Pastikan item yang diubah
   * tetap memiliki struktur harga
   * yang konsisten.
   */

  const hargaSatuan =
    normalizePrice(
      items[itemIndex].hargaSatuan
    );


  items[itemIndex].hargaSatuan =
    hargaSatuan;


  items[itemIndex].subtotal =
    hargaSatuan !== null
      ? hargaSatuan *
        (
          Number(
            items[itemIndex].jumlah
          ) || 0
        )
      : null;


  /*
   * Hitung ulang status seluruh pesanan.
   */

  const status =
    calculateOrderStatus(
      items
    );


  const docRef =
    doc(
      db,
      "orders",
      orderId
    );


  await updateDoc(
    docRef,
    {

      items,

      status,

      updatedAt:
        serverTimestamp()

    }
  );


  return {

    id:
      orderId,

    items,

    status

  };
}