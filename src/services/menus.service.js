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
  serverTimestamp
} from "firebase/firestore";

import { db } from "../firebase.js";

const menusCollection = collection(db, "menus");


/**
 * =========================================================
 * NORMALIZE HARGA JUAL
 * =========================================================
 *
 * Harga disimpan sebagai Number.
 *
 * Contoh:
 * "15000"  -> 15000
 * 15000    -> 15000
 * ""       -> 0
 * null     -> 0
 */
function normalizeHargaJual(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  const harga = Number(value);

  if (!Number.isFinite(harga) || harga < 0) {
    return 0;
  }

  return harga;
}


/**
 * =========================================================
 * MENGAMBIL SEMUA MENU
 * =========================================================
 */
export async function getMenus() {
  const q = query(
    menusCollection,
    orderBy("nama", "asc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data(),

    // Pastikan menu lama yang belum mempunyai
    // hargaJual tetap aman digunakan.
    hargaJual: normalizeHargaJual(
      docItem.data().hargaJual
    )
  }));
}


/**
 * =========================================================
 * MENGAMBIL MENU BERDASARKAN ID
 * =========================================================
 */
export async function getMenuById(menuId) {
  if (!menuId) {
    return null;
  }

  const menuRef = doc(
    db,
    "menus",
    menuId
  );

  const snapshot = await getDoc(menuRef);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();

  return {
    id: snapshot.id,
    ...data,

    hargaJual: normalizeHargaJual(
      data.hargaJual
    )
  };
}


/**
 * =========================================================
 * MEMBUAT MENU BARU
 * =========================================================
 */
export async function createMenu(menuData) {
  if (!menuData) {
    throw new Error(
      "Data menu tidak ditemukan."
    );
  }

  const data = {
    nama: String(
      menuData.nama || ""
    ).trim(),

    kategori:
      menuData.kategori ||
      "Lainnya",

    varian:
      String(
        menuData.varian || ""
      ).trim(),

    ukuran:
      String(
        menuData.ukuran || ""
      ).trim(),

    aktif:
      menuData.aktif !== false,

    // ==========================================
    // HARGA JUAL
    // ==========================================
    hargaJual:
      normalizeHargaJual(
        menuData.hargaJual
      ),

    createdAt:
      serverTimestamp(),

    updatedAt:
      serverTimestamp()
  };

  if (!data.nama) {
    throw new Error(
      "Nama menu wajib diisi."
    );
  }

  const docRef = await addDoc(
    menusCollection,
    data
  );

  return {
    id: docRef.id,
    ...data
  };
}


/**
 * =========================================================
 * MENGUBAH MENU
 * =========================================================
 */
export async function updateMenu(
  menuId,
  menuData
) {
  if (!menuId) {
    throw new Error(
      "ID menu tidak ditemukan."
    );
  }

  if (!menuData) {
    throw new Error(
      "Data menu tidak ditemukan."
    );
  }

  const menuRef = doc(
    db,
    "menus",
    menuId
  );

  const updateData = {
    nama: String(
      menuData.nama || ""
    ).trim(),

    kategori:
      menuData.kategori ||
      "Lainnya",

    varian:
      String(
        menuData.varian || ""
      ).trim(),

    ukuran:
      String(
        menuData.ukuran || ""
      ).trim(),

    aktif:
      menuData.aktif !== false,

    // ==========================================
    // HARGA JUAL
    // ==========================================
    hargaJual:
      normalizeHargaJual(
        menuData.hargaJual
      ),

    updatedAt:
      serverTimestamp()
  };

  if (!updateData.nama) {
    throw new Error(
      "Nama menu wajib diisi."
    );
  }

  await updateDoc(
    menuRef,
    updateData
  );

  return {
    id: menuId,
    ...updateData
  };
}


/**
 * =========================================================
 * MENGHAPUS MENU
 * =========================================================
 */
export async function deleteMenu(
  menuId
) {
  if (!menuId) {
    throw new Error(
      "ID menu tidak ditemukan."
    );
  }

  const menuRef = doc(
    db,
    "menus",
    menuId
  );

  await deleteDoc(
    menuRef
  );

  return true;
}