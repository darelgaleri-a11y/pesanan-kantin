import { renderLayout } from "../components/layout.js";
import { getMenus, createMenu } from "../services/menus.service.js";
import { getClasses, createClass } from "../services/classes.service.js";
import { getRooms, createRoom } from "../services/rooms.service.js";
import { createOrder } from "../services/orders.service.js";
import {
  parseWhatsAppOrders,
  menuLabel,
  getMatchStatus
} from "../utils/parser.js";

const state = {
  menus: [],
  classes: [],
  rooms: [],
  proposals: { menus: [], classes: [], rooms: [] },
  orders: [],
  rawText: "",
  tanggal: getTodayDate(),
  loadingMenus: true,
  parsing: false,
  saving: false,
  message: "",
  messageType: ""
};

function getTodayDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getContentRoot() {
  return (
    document.querySelector("#page-content") ||
    document.querySelector("[data-page-content]") ||
    document.querySelector("main") ||
    document.querySelector("#app")
  );
}

function setMessage(message, type = "info") {
  state.message = message;
  state.messageType = type;
}

function messageHtml() {
  if (!state.message) {
    return "";
  }

  const classes = {
    info: "bg-blue-50 text-blue-700 border-blue-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    error: "bg-red-50 text-red-700 border-red-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200"
  };

  return `
    <div class="mb-6 rounded-xl border px-4 py-3 text-sm ${
      classes[state.messageType] || classes.info
    }">
      ${escapeHtml(state.message)}
    </div>
  `;
}

function menuOptionsHtml(selectedId = "") {
  return `
    <option value="">Pilih menu...</option>
    ${state.menus
      .filter((menu) => menu.aktif !== false)
      .map((menu) => {
        const label = menuLabel(menu);

        return `
          <option
            value="${escapeHtml(menu.id)}"
            ${menu.id === selectedId ? "selected" : ""}
          >
            ${escapeHtml(label)}
          </option>
        `;
      })
      .join("")}
  `;
}

function renderItemRow(item, orderIndex, itemIndex) {
  const status = getMatchStatus(item);

  return `
    <div
      class="grid grid-cols-[1fr_90px_42px] gap-2 items-start rounded-xl border border-slate-200 bg-white p-3"
      data-item-row
      data-order-index="${orderIndex}"
      data-item-index="${itemIndex}"
    >
      <div class="min-w-0">
        <select
          class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          data-action="item-menu"
          data-order-index="${orderIndex}"
          data-item-index="${itemIndex}"
        >
          ${menuOptionsHtml(item.menuId)}
        </select>

        ${
          !item.menuId
            ? `
              <input
                type="text"
                class="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                value="${escapeHtml(item.namaMenu || item.rawName || "")}"
                placeholder="Nama menu manual"
                data-action="item-name"
                data-order-index="${orderIndex}"
                data-item-index="${itemIndex}"
              />
            `
            : `
              <div class="mt-2 flex items-center gap-2">
                <span class="inline-flex rounded-full border px-2 py-1 text-[11px] font-medium ${status.className}">
                  ${status.label}
                </span>
                ${
                  item.varian || item.ukuran
                    ? `
                      <span class="text-xs text-slate-500">
                        ${escapeHtml(
                          [item.varian, item.ukuran]
                            .filter(Boolean)
                            .join(" • ")
                        )}
                      </span>
                    `
                    : ""
                }
              </div>
            `
        }
      </div>

      <input
        type="number"
        min="1"
        step="1"
        value="${Number(item.jumlah) || 1}"
        class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-center outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        data-action="item-qty"
        data-order-index="${orderIndex}"
        data-item-index="${itemIndex}"
      />

      <button
        type="button"
        title="Hapus item"
        class="flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
        data-action="delete-item"
        data-order-index="${orderIndex}"
        data-item-index="${itemIndex}"
      >
        <span class="material-symbols-outlined text-[20px]">delete</span>
      </button>
    </div>
  `;
}

function renderOrderCard(order, orderIndex) {
  return `
    <section class="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-bold text-primary">
              ${orderIndex + 1}
            </span>
            <h3 class="font-bold text-slate-800">
              ${escapeHtml(order.nama || "Nama belum diisi")}
            </h3>
          </div>

          <p class="mt-1 text-xs text-slate-500">
            ${order.items.length} item
          </p>
        </div>

        <button
          type="button"
          class="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
          data-action="delete-order"
          data-order-index="${orderIndex}"
        >
          Hapus Pesanan
        </button>
      </div>

      <div class="p-5">
        <div class="grid gap-4 md:grid-cols-4">
          <label class="block">
            <span class="mb-1.5 block text-xs font-semibold text-slate-600">
              Nama
            </span>
            <input
              type="text"
              value="${escapeHtml(order.nama)}"
              class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              data-action="order-name"
              data-order-index="${orderIndex}"
            />
          </label>

          <label class="block">
            <span class="mb-1.5 block text-xs font-semibold text-slate-600">
              Kelas
            </span>
            <input
              type="text"
              value="${escapeHtml(order.kelas)}"
              class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              data-action="order-class"
              data-order-index="${orderIndex}"
            />
          </label>

          <label class="block">
            <span class="mb-1.5 block text-xs font-semibold text-slate-600">
              Kamar / Asrama
            </span>
            <input
              type="text"
              value="${escapeHtml(order.kamar)}"
              class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              data-action="order-room"
              data-order-index="${orderIndex}"
            />
          </label>

          <label class="block">
            <span class="mb-1.5 block text-xs font-semibold text-slate-600">
              Tanggal
            </span>
            <input
              type="date"
              value="${escapeHtml(order.tanggal || state.tanggal)}"
              class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              data-action="order-date"
              data-order-index="${orderIndex}"
            />
          </label>
        </div>

        <div class="mt-6">
          <div class="mb-3 flex items-center justify-between gap-3">
            <div>
              <h4 class="text-sm font-bold text-slate-800">
                Item Pesanan
              </h4>
              <p class="mt-0.5 text-xs text-slate-500">
                Pastikan item yang belum cocok sudah dipilih dari master menu.
              </p>
            </div>

            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              data-action="add-item"
              data-order-index="${orderIndex}"
            >
              <span class="material-symbols-outlined text-[18px]">add</span>
              Tambah Item
            </button>
          </div>

          <div class="space-y-2">
            ${
              order.items.length
                ? order.items
                    .map((item, itemIndex) =>
                      renderItemRow(item, orderIndex, itemIndex)
                    )
                    .join("")
                : `
                  <div class="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">
                    Belum ada item.
                  </div>
                `
            }
          </div>
        </div>

        <label class="mt-5 block">
          <span class="mb-1.5 block text-xs font-semibold text-slate-600">
            Catatan
          </span>
          <textarea
            rows="2"
            class="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Catatan tambahan..."
            data-action="order-note"
            data-order-index="${orderIndex}"
          >${escapeHtml(order.catatan)}</textarea>
        </label>
      </div>
    </section>
  `;
}

function renderProposals() {
  const groups = [
    { key: "menus", title: "Menu baru", rows: state.proposals.menus },
    { key: "classes", title: "Kelas baru", rows: state.proposals.classes },
    { key: "rooms", title: "Asrama / kamar baru", rows: state.proposals.rooms }
  ].filter((group) => group.rows.length);

  if (!groups.length) return "";

  return `
    <section class="mb-5 rounded-2xl border border-amber-300 bg-amber-50 p-4">
      <div class="flex items-start gap-3">
        <span class="material-symbols-outlined text-amber-700">fact_check</span>
        <div>
          <h3 class="font-bold text-amber-900">Usulan Data Baru — Menunggu Persetujuan Admin</h3>
          <p class="mt-1 text-xs leading-5 text-amber-800">Data di bawah belum dimasukkan ke Master Data. Periksa ejaan sebelum menyetujui.</p>
        </div>
      </div>
      ${groups.map((group) => `
        <div class="mt-4 rounded-xl border border-amber-200 bg-white p-3">
          <h4 class="mb-2 text-sm font-bold text-slate-800">${group.title}</h4>
          <div class="space-y-2">
            ${group.rows.map((row, index) => `
              <div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,160px)_auto] sm:items-center">
                <input class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value="${escapeHtml(row.nama)}" data-action="proposal-name" data-kind="${group.key}" data-index="${index}" aria-label="Nama ${group.title}" />
                ${group.key === "menus" ? `<input type="number" min="0" step="500" placeholder="Harga jual (Rp)" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value="${escapeHtml(row.hargaJual ?? "")}" data-action="proposal-price" data-index="${index}" aria-label="Harga menu" />` : `<span class="text-xs text-slate-500">Terdeteksi dari pesan</span>`}
                <button type="button" class="rounded-lg bg-amber-700 px-3 py-2 text-xs font-bold text-white hover:bg-amber-800" data-action="approve-proposal" data-kind="${group.key}" data-index="${index}">Setujui</button>
              </div>
            `).join("")}
          </div>
        </div>
      `).join("")}
      <p class="mt-3 text-xs text-amber-800">Menu baru wajib diberi harga. Kelas dan asrama hanya dibuat setelah admin menekan Setujui.</p>
    </section>
  `;
}

function collectProposals(orders) {
  const unique = (values, existing) => {
    const known = new Set(existing.map((item) => normalizeName(item.nama)));
    const seen = new Set();
    return values.map((nama) => String(nama || "").trim()).filter((nama) => {
      const key = normalizeName(nama);
      if (!key || known.has(key) || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map((nama) => ({ nama, hargaJual: "" }));
  };
  const normalizeName = (value) => String(value || "").toLocaleLowerCase("id-ID").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  state.proposals = {
    menus: unique(orders.flatMap((order) => order.items.filter((item) => !item.menuId).map((item) => item.rawName || item.namaMenu)), state.menus),
    classes: unique(orders.map((order) => order.kelas), state.classes),
    rooms: unique(orders.map((order) => order.kamar), state.rooms)
  };
}

function render() {
  const root = getContentRoot();

  if (!root) {
    return;
  }

  root.innerHTML = `
    <div class="min-h-full bg-slate-50 p-4 md:p-6 lg:p-8">
      <div class="mx-auto max-w-6xl">

        <div class="mb-6">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Import Pesanan
              </p>

              <h1 class="mt-1 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
                Import dari WhatsApp
              </h1>

              <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Tempel pesan WhatsApp di bawah. Sistem akan memisahkan data santri,
                membaca jumlah pesanan, lalu mencocokkannya dengan Master Menu.
              </p>
            </div>

            <label class="block w-full lg:w-52">
              <span class="mb-1.5 block text-xs font-semibold text-slate-600">
                Tanggal Default
              </span>
              <input
                type="date"
                value="${escapeHtml(state.tanggal)}"
                class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                data-action="default-date"
              />
            </label>
          </div>
        </div>

        ${messageHtml()}

        <section class="mb-6 rounded-2xl border border-sky-200 bg-sky-50 p-4 md:p-5" aria-labelledby="import-guide-title">
          <div class="flex items-start gap-3">
            <span class="material-symbols-outlined mt-0.5 text-2xl text-sky-700">help</span>
            <div class="min-w-0 flex-1">
              <h2 id="import-guide-title" class="font-bold text-sky-950">Panduan menggunakan Import WhatsApp</h2>
              <p class="mt-1 text-xs leading-5 text-sky-900">Ikuti langkah berikut setiap kali memasukkan pesanan dari grup atau chat WhatsApp.</p>
              <ol class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <li class="rounded-xl border border-sky-100 bg-white p-3">
                  <span class="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-800">1</span>
                  <p class="mt-2 text-sm font-bold text-slate-800">Salin pesan</p>
                  <p class="mt-1 text-xs leading-5 text-slate-600">Salin teks pesanan dari WhatsApp. Boleh satu pesan atau beberapa pesan sekaligus.</p>
                </li>
                <li class="rounded-xl border border-sky-100 bg-white p-3">
                  <span class="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-800">2</span>
                  <p class="mt-2 text-sm font-bold text-slate-800">Tempel & baca</p>
                  <p class="mt-1 text-xs leading-5 text-slate-600">Tempel ke kotak di sebelah kiri, pilih tanggal default, lalu tekan <b>Parse Pesanan</b>.</p>
                </li>
                <li class="rounded-xl border border-sky-100 bg-white p-3">
                  <span class="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-800">3</span>
                  <p class="mt-2 text-sm font-bold text-slate-800">Periksa hasil</p>
                  <p class="mt-1 text-xs leading-5 text-slate-600">Periksa nama, kelas, asrama, menu, jumlah, dan catatan. Koreksi bagian yang keliru sebelum menyimpan.</p>
                </li>
                <li class="rounded-xl border border-sky-100 bg-white p-3">
                  <span class="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-800">4</span>
                  <p class="mt-2 text-sm font-bold text-slate-800">Setujui & simpan</p>
                  <p class="mt-1 text-xs leading-5 text-slate-600">Setujui usulan Master Data baru jika benar. Isi harga untuk menu baru, lalu tekan <b>Simpan Semua ke Firestore</b>.</p>
                </li>
              </ol>
              <div class="mt-3 rounded-xl border border-sky-100 bg-white/90 p-3">
                <p class="text-xs font-bold text-sky-950">Penting untuk pengguna</p>
                <ul class="mt-1 list-disc space-y-1 pl-4 text-xs leading-5 text-slate-700">
                  <li>Format pesan tidak harus persis sama. Sistem mencoba membaca variasi penulisan, tetapi hasilnya tetap wajib diperiksa.</li>
                  <li>Jika muncul <b>Usulan Data Baru</b>, data tersebut belum masuk Master Data sampai admin menekan <b>Setujui</b>.</li>
                  <li>Jangan tekan simpan sebelum semua pesanan dan jumlahnya sudah benar.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <div class="grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">

          <section class="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div class="border-b border-slate-200 px-5 py-4">
              <h2 class="font-bold text-slate-800">
                1. Tempel Pesan WhatsApp
              </h2>
              <p class="mt-1 text-xs leading-5 text-slate-500">
                Bisa satu pesan atau beberapa pesan sekaligus.
              </p>
            </div>

            <div class="p-5">
              <textarea
                rows="22"
                class="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 font-mono text-sm leading-6 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Contoh:
Nama: Ahmad
Kelas : 1A
Asrama: Bilal 1
Pesanan :
* Ayam bakar +nasi 1
* Teh jumbo 1"
                data-action="raw-text"
              >${escapeHtml(state.rawText)}</textarea>

              <button
                type="button"
                class="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                data-action="parse"
                ${state.parsing ? "disabled" : ""}
              >
                <span class="material-symbols-outlined text-[20px]">
                  auto_fix_high
                </span>
                ${state.parsing ? "Membaca..." : "Parse Pesanan"}
              </button>

              <div class="mt-5 rounded-xl bg-slate-50 p-4">
                <p class="text-xs font-bold text-slate-700">
                  Catatan parser
                </p>
                <p class="mt-2 text-xs leading-5 text-slate-500">
                  Mendukung format <b>Nama:</b>, <b>Kelas:</b>,
                  <b>Asrama:</b>, <b>Kamar:</b>, dan item dengan jumlah
                  seperti <b>1</b>, <b>x2</b>, atau <b>: 3</b>.
                </p>
              </div>
            </div>
          </section>

          <section>
            <div class="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 class="font-bold text-slate-800">
                  2. Preview & Koreksi
                </h2>

                <p class="mt-1 text-xs text-slate-500">
                  ${
                    state.orders.length
                      ? `${state.orders.length} pesanan siap diperiksa.`
                      : "Belum ada hasil parse."
                  }
                </p>
              </div>

              <div class="flex flex-wrap gap-2">
                <span class="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  ${state.menus.length} master menu
                </span>

                ${
                  state.orders.length
                    ? `
                      <button
                        type="button"
                        class="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                        data-action="clear-preview"
                      >
                        <span class="material-symbols-outlined text-[17px]">
                          delete_sweep
                        </span>
                        Kosongkan
                      </button>
                    `
                    : ""
                }
              </div>
            </div>

            ${renderProposals()}

            ${
              state.loadingMenus
                ? `
                  <div class="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center shadow-sm">
                    <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-primary"></div>
                    <p class="mt-3 text-sm text-slate-500">
                      Memuat Master Menu...
                    </p>
                  </div>
                `
                : state.orders.length
                ? `
                  <div class="space-y-5">
                    ${state.orders
                      .map((order, index) =>
                        renderOrderCard(order, index)
                      )
                      .join("")}

                    <div class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
                      <button
                        type="button"
                        class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        data-action="add-order"
                      >
                        <span class="material-symbols-outlined text-[20px]">
                          person_add
                        </span>
                        Tambah Pesanan Manual
                      </button>
                    </div>

                    <div class="sticky bottom-4 rounded-2xl border border-primary/20 bg-white p-4 shadow-lg">
                      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p class="text-sm font-bold text-slate-800">
                            Siap simpan ${state.orders.length} pesanan
                          </p>
                          <p class="mt-1 text-xs text-slate-500">
                            Item yang belum cocok tetap bisa disimpan sebagai nama manual.
                          </p>
                        </div>

                        <button
                          type="button"
                          class="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                          data-action="save-all"
                          ${state.saving ? "disabled" : ""}
                        >
                          <span class="material-symbols-outlined text-[20px]">
                            cloud_upload
                          </span>
                          ${state.saving ? "Menyimpan..." : "Simpan Semua ke Firestore"}
                        </button>
                      </div>
                    </div>
                  </div>
                `
                : `
                  <div class="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
                    <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <span class="material-symbols-outlined text-[30px]">
                        content_paste
                      </span>
                    </div>

                    <h3 class="mt-4 text-base font-bold text-slate-800">
                      Preview akan muncul di sini
                    </h3>

                    <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                      Tempel pesan WhatsApp di sebelah kiri lalu tekan
                      <b>Parse Pesanan</b>.
                    </p>
                  </div>
                `
            }
          </section>

        </div>
      </div>
    </div>
  `;
}

function refresh() {
  render();
  bindEvents();
}

function bindEvents() {
  const root = getContentRoot();

  if (!root) return;

  root.querySelectorAll("[data-action]").forEach((element) => {
    const action = element.dataset.action;

    element.oninput = () => {
      handleInput(element, action);
    };

    element.onchange = () => {
      handleChange(element, action);
    };

    element.onclick = () => {
      handleClick(element, action);
    };
  });
}

function handleInput(element, action) {
  const orderIndex = Number(element.dataset.orderIndex);
  const itemIndex = Number(element.dataset.itemIndex);

  if (action === "proposal-name") {
    const kind = element.dataset.kind;
    const index = Number(element.dataset.index);
    if (state.proposals[kind]?.[index]) state.proposals[kind][index].nama = element.value;
    return;
  }

  if (action === "proposal-price") {
    const index = Number(element.dataset.index);
    if (state.proposals.menus[index]) state.proposals.menus[index].hargaJual = element.value;
    return;
  }

  if (action === "raw-text") {
    state.rawText = element.value;
    return;
  }

  if (action === "order-name") {
    state.orders[orderIndex].nama = element.value;
    return;
  }

  if (action === "order-class") {
    state.orders[orderIndex].kelas = element.value;
    return;
  }

  if (action === "order-room") {
    state.orders[orderIndex].kamar = element.value;
    return;
  }

  if (action === "order-note") {
    state.orders[orderIndex].catatan = element.value;
    return;
  }

  if (action === "item-name") {
    state.orders[orderIndex].items[itemIndex].namaMenu =
      element.value;

    state.orders[orderIndex].items[itemIndex].rawName =
      element.value;

    return;
  }

  if (action === "item-qty") {
    const quantity = Math.max(1, Number(element.value) || 1);

    state.orders[orderIndex].items[itemIndex].jumlah = quantity;
  }
}

function handleChange(element, action) {
  const orderIndex = Number(element.dataset.orderIndex);
  const itemIndex = Number(element.dataset.itemIndex);

  if (action === "default-date") {
    state.tanggal = element.value;

    for (const order of state.orders) {
      if (!order.tanggal) {
        order.tanggal = state.tanggal;
      }
    }

    return;
  }

  if (action === "order-date") {
    state.orders[orderIndex].tanggal =
      element.value || state.tanggal;
    return;
  }

  if (action === "item-menu") {
    const selectedId = element.value;
    const item = state.orders[orderIndex].items[itemIndex];

    const menu = state.menus.find(
      (menuItem) => menuItem.id === selectedId
    );

    if (!menu) {
      item.menuId = "";
      item.matched = false;
      item.namaMenu = item.rawName || "";
      item.kategori = "Lainnya";
      item.varian = "";
      item.ukuran = "";
      item.matchScore = 0;
      refresh();
      return;
    }

    item.menuId = menu.id;
    item.namaMenu = menu.nama;
    item.kategori = menu.kategori || "Lainnya";
    item.varian = menu.varian || "";
    item.ukuran = menu.ukuran || "";
    item.matched = true;
    item.matchScore = 1;

    refresh();
  }
}

async function handleClick(element, action) {
  if (action === "approve-proposal") {
    await approveProposal(element.dataset.kind, Number(element.dataset.index));
    return;
  }

  if (action === "parse") {
    await parseOrders();
    return;
  }

  if (action === "clear-preview") {
    state.orders = [];
    state.proposals = { menus: [], classes: [], rooms: [] };
    setMessage("Preview dikosongkan.", "info");
    refresh();
    return;
  }

  if (action === "delete-order") {
    const orderIndex = Number(element.dataset.orderIndex);

    state.orders.splice(orderIndex, 1);
    refresh();
    return;
  }

  if (action === "add-order") {
    state.orders.push({
      nama: "",
      kelas: "",
      kamar: "",
      tanggal: state.tanggal,
      catatan: "",
      items: [
        {
          rawName: "",
          namaMenu: "",
          menuId: "",
          kategori: "Lainnya",
          varian: "",
          ukuran: "",
          jumlah: 1,
          matched: false,
          matchScore: 0,
          dibagikan: false
        }
      ]
    });

    refresh();
    return;
  }

  if (action === "add-item") {
    const orderIndex = Number(element.dataset.orderIndex);

    state.orders[orderIndex].items.push({
      rawName: "",
      namaMenu: "",
      menuId: "",
      kategori: "Lainnya",
      varian: "",
      ukuran: "",
      jumlah: 1,
      matched: false,
      matchScore: 0,
      dibagikan: false
    });

    refresh();
    return;
  }

  if (action === "delete-item") {
    const orderIndex = Number(element.dataset.orderIndex);
    const itemIndex = Number(element.dataset.itemIndex);

    state.orders[orderIndex].items.splice(itemIndex, 1);
    refresh();
    return;
  }

  if (action === "save-all") {
    await saveAllOrders();
  }
}

async function loadMenus() {
  state.loadingMenus = true;
  refresh();

  try {
    const [menus, classes, rooms] = await Promise.all([getMenus(), getClasses(), getRooms()]);
    state.menus = menus;
    state.classes = classes;
    state.rooms = rooms;
  } catch (error) {
    console.error(error);

    setMessage(
      `Gagal memuat Master Menu: ${error.message}`,
      "error"
    );
  } finally {
    state.loadingMenus = false;
    refresh();
  }
}

async function approveProposal(kind, index) {
  const proposal = state.proposals[kind]?.[index];
  if (!proposal || !proposal.nama.trim()) {
    setMessage("Nama data wajib diisi.", "warning"); refresh(); return;
  }
  try {
    if (kind === "menus") {
      const price = Number(proposal.hargaJual);
      if (proposal.hargaJual === "" || !Number.isFinite(price) || price < 0) {
        setMessage("Isi harga jual menu sebelum menyetujui.", "warning"); refresh(); return;
      }
      const created = await createMenu({ nama: proposal.nama.trim(), kategori: "Lainnya", hargaJual: price, aktif: true });
      state.menus.push(created);
      // Hubungkan item yang namanya sama persis dengan menu yang baru disetujui.
      for (const order of state.orders) for (const item of order.items) {
        if (!item.menuId && item.namaMenu.trim().toLocaleLowerCase("id-ID") === proposal.nama.trim().toLocaleLowerCase("id-ID")) {
          item.menuId = created.id; item.namaMenu = created.nama; item.kategori = created.kategori || "Lainnya"; item.matched = true; item.matchScore = 1;
        }
      }
    } else if (kind === "classes") {
      const created = await createClass({ nama: proposal.nama.trim(), aktif: true });
      state.classes.push(created);
    } else if (kind === "rooms") {
      const created = await createRoom({ nama: proposal.nama.trim(), aktif: true });
      state.rooms.push(created);
    }
    state.proposals[kind].splice(index, 1);
    setMessage(`Data "${proposal.nama}" berhasil ditambahkan ke Master Data.`, "success");
  } catch (error) {
    console.error(error);
    setMessage(`Gagal menyetujui data: ${error.message}`, "error");
  }
  refresh();
}

async function parseOrders() {
  if (!state.rawText.trim()) {
    setMessage(
      "Tempel pesan WhatsApp terlebih dahulu.",
      "warning"
    );
    refresh();
    return;
  }

  state.parsing = true;
  setMessage("", "info");
  refresh();

  try {
    const parsed = parseWhatsAppOrders(
      state.rawText,
      state.menus
    );

    parsed.forEach((order) => {
      if (!order.tanggal) {
        order.tanggal = state.tanggal;
      }
    });

    state.orders = parsed;
    collectProposals(parsed);

    if (!parsed.length) {
      setMessage(
        "Tidak ada pesanan yang berhasil dibaca. Pastikan format memiliki baris Nama: dan item Pesanan.",
        "warning"
      );
    } else {
      const unmatched = parsed.reduce(
        (total, order) =>
          total +
          order.items.filter((item) => !item.matched).length,
        0
      );

      if (unmatched) {
        setMessage(
          `Berhasil membaca ${parsed.length} pesanan. Ada ${unmatched} item yang belum cocok dengan Master Menu dan perlu diperiksa.`,
          "warning"
        );
      } else {
        setMessage(
          `Berhasil membaca ${parsed.length} pesanan dan semua item cocok dengan Master Menu.`,
          "success"
        );
      }
    }
  } catch (error) {
    console.error(error);

    setMessage(
      `Gagal memproses teks: ${error.message}`,
      "error"
    );
  } finally {
    state.parsing = false;
    refresh();
  }
}

function validateOrders() {
  const errors = [];

  state.orders.forEach((order, orderIndex) => {
    const nomor = orderIndex + 1;

    if (!order.nama.trim()) {
      errors.push(`Pesanan ${nomor}: nama belum diisi.`);
    }

    if (!order.kelas.trim()) {
      errors.push(`Pesanan ${nomor}: kelas belum diisi.`);
    }

    if (!order.kamar.trim()) {
      errors.push(
        `Pesanan ${nomor}: kamar/asrama belum diisi.`
      );
    }

    if (!order.tanggal) {
      errors.push(
        `Pesanan ${nomor}: tanggal belum diisi.`
      );
    }

    if (!order.items.length) {
      errors.push(
        `Pesanan ${nomor}: belum memiliki item.`
      );
    }

    order.items.forEach((item, itemIndex) => {
      if (!item.menuId && !item.namaMenu.trim()) {
        errors.push(
          `Pesanan ${nomor}, item ${itemIndex + 1}: menu belum dipilih.`
        );
      }

      if (
        !Number.isFinite(Number(item.jumlah)) ||
        Number(item.jumlah) < 1
      ) {
        errors.push(
          `Pesanan ${nomor}, item ${itemIndex + 1}: jumlah tidak valid.`
        );
      }
    });
  });

  return errors;
}

async function saveAllOrders() {
  if (!state.orders.length) {
    setMessage(
      "Belum ada preview yang bisa disimpan.",
      "warning"
    );
    refresh();
    return;
  }

  const errors = validateOrders();

  if (errors.length) {
    setMessage(errors.slice(0, 5).join(" "), "error");
    refresh();
    return;
  }

  state.saving = true;
  setMessage(
    `Sedang menyimpan ${state.orders.length} pesanan...`,
    "info"
  );
  refresh();

  let successCount = 0;

  try {
    for (const order of state.orders) {
      await createOrder({
        tanggal: order.tanggal || state.tanggal,
        nama: order.nama,
        kelas: order.kelas,
        kamar: order.kamar,
        catatan: order.catatan,
        items: order.items.map((item) => ({
          menuId: item.menuId || "",
          namaMenu: item.namaMenu.trim(),
          kategori: item.kategori || "Lainnya",
          varian: item.varian || "",
          ukuran: item.ukuran || "",
          jumlah: Number(item.jumlah) || 1,
          dibagikan: false
        }))
      });

      successCount++;
    }

    state.orders = [];

    setMessage(
      `Berhasil menyimpan ${successCount} pesanan ke Firestore.`,
      "success"
    );
  } catch (error) {
    console.error(error);

    setMessage(
      `Penyimpanan berhenti setelah ${successCount} pesanan. Error: ${error.message}`,
      "error"
    );
  } finally {
    state.saving = false;
    refresh();
  }
}

export async function renderImportOrders() {
  renderLayout({ pageTitle: "Import Pesanan WhatsApp", pageSubtitle: "Impor pesanan dari pesan WhatsApp." });

  state.rawText = "";
  state.orders = [];
  state.proposals = { menus: [], classes: [], rooms: [] };
  state.tanggal = getTodayDate();
  state.message = "";
  state.messageType = "";

  render();
  bindEvents();

  await loadMenus();
}