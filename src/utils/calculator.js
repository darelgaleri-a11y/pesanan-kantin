/**
 * Menghitung total setiap jenis menu
 * berdasarkan daftar item pesanan.
 *
 * Input:
 * [
 *   { namaMenu: "Kentucky", jumlah: 1 },
 *   { namaMenu: "Kentucky", jumlah: 1 },
 *   { namaMenu: "Geprek", jumlah: 2 }
 * ]
 *
 * Output:
 * {
 *   Kentucky: 2,
 *   Geprek: 2
 * }
 */

export function calculateMenuTotals(orderItems) {
  const totals = {};

  for (const item of orderItems) {
    const name = item.namaMenu;
    const quantity = Number(item.jumlah) || 0;

    if (!totals[name]) {
      totals[name] = 0;
    }

    totals[name] += quantity;
  }

  return totals;
}