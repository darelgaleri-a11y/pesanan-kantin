import { renderLayout } from "../components/layout.js";
import {
  getSettings,
  saveSettings
} from "../services/settings.service.js";
import { getCurrentUser } from "../services/auth.service.js";

let currentSettings = null;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getInputValue(id) {
  return document.querySelector(id)?.value?.trim() || "";
}

function renderSettingsContent() {
  const user = getCurrentUser();

  return `
    <form id="settings-form" class="space-y-6">

      <!-- INFORMASI KANTIN -->
      <section class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

        <div class="px-5 py-4 border-b border-slate-200">
          <div class="flex items-start gap-3">

            <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined">
                store
              </span>
            </div>

            <div>
              <h2 class="text-base font-bold text-slate-900">
                Informasi Kantin
              </h2>

              <p class="text-sm text-slate-500 mt-0.5">
                Informasi identitas utama kantin.
              </p>
            </div>

          </div>
        </div>

        <div class="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">

          <div>
            <label
              for="setting-nama-kantin"
              class="block text-sm font-medium text-slate-700 mb-2"
            >
              Nama Kantin
            </label>

            <input
              id="setting-nama-kantin"
              type="text"
              value="${escapeHtml(currentSettings?.namaKantin)}"
              placeholder="Contoh: Kantin Pesantren"
              class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label
              for="setting-nama-pesantren"
              class="block text-sm font-medium text-slate-700 mb-2"
            >
              Nama Pesantren
            </label>

            <input
              id="setting-nama-pesantren"
              type="text"
              value="${escapeHtml(currentSettings?.namaPesantren)}"
              placeholder="Contoh: Pondok Pesantren ..."
              class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div class="md:col-span-2">
            <label
              for="setting-alamat"
              class="block text-sm font-medium text-slate-700 mb-2"
            >
              Alamat / Keterangan
            </label>

            <textarea
              id="setting-alamat"
              rows="3"
              placeholder="Alamat atau keterangan tambahan..."
              class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition resize-y focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >${escapeHtml(currentSettings?.alamat)}</textarea>
          </div>

        </div>
      </section>

      <!-- PENGATURAN LAPORAN -->
      <section class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

        <div class="px-5 py-4 border-b border-slate-200">
          <div class="flex items-start gap-3">

            <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined">
                description
              </span>
            </div>

            <div>
              <h2 class="text-base font-bold text-slate-900">
                Pengaturan Laporan
              </h2>

              <p class="text-sm text-slate-500 mt-0.5">
                Informasi yang dapat digunakan pada laporan dan hasil cetak.
              </p>
            </div>

          </div>
        </div>

        <div class="p-5 space-y-5">

          <div>
            <label
              for="setting-judul-laporan"
              class="block text-sm font-medium text-slate-700 mb-2"
            >
              Judul Laporan
            </label>

            <input
              id="setting-judul-laporan"
              type="text"
              value="${escapeHtml(currentSettings?.judulLaporan)}"
              placeholder="Laporan Pesanan Kantin"
              class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />

            <p class="mt-2 text-xs text-slate-500">
              Judul default yang dapat digunakan pada laporan.
            </p>
          </div>

          <div>
            <label
              for="setting-footer-laporan"
              class="block text-sm font-medium text-slate-700 mb-2"
            >
              Footer Laporan
            </label>

            <textarea
              id="setting-footer-laporan"
              rows="3"
              placeholder="Contoh: Dicetak oleh Admin Kantin"
              class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition resize-y focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >${escapeHtml(currentSettings?.footerLaporan)}</textarea>

            <p class="mt-2 text-xs text-slate-500">
              Keterangan tambahan yang nantinya dapat ditampilkan di bagian bawah laporan.
            </p>
          </div>

        </div>
      </section>

      <!-- INFORMASI SISTEM -->
      <section class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

        <div class="px-5 py-4 border-b border-slate-200">
          <div class="flex items-start gap-3">

            <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined">
                admin_panel_settings
              </span>
            </div>

            <div>
              <h2 class="text-base font-bold text-slate-900">
                Informasi Sistem
              </h2>

              <p class="text-sm text-slate-500 mt-0.5">
                Informasi akun administrator yang sedang digunakan.
              </p>
            </div>

          </div>
        </div>

        <div class="p-5">

          <div class="rounded-xl bg-slate-50 border border-slate-200 p-4">

            <div class="text-xs font-medium text-slate-500 mb-1">
              Admin Aktif
            </div>

            <div class="text-sm font-semibold text-slate-900 break-all">
              ${escapeHtml(user?.email || "-")}
            </div>

          </div>

        </div>
      </section>

      <!-- TOMBOL SIMPAN -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-8">

        <div
          id="settings-message"
          class="text-sm min-h-[20px]"
          aria-live="polite"
        ></div>

        <button
          id="settings-save-button"
          type="submit"
          class="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span class="material-symbols-outlined text-[20px]">
            save
          </span>

          Simpan Pengaturan
        </button>

      </div>

    </form>
  `;
}

function showMessage(message, type = "success") {
  const element = document.querySelector("#settings-message");

  if (!element) return;

  if (!message) {
    element.textContent = "";
    element.className = "text-sm min-h-[20px]";
    return;
  }

  if (type === "error") {
    element.className =
      "text-sm min-h-[20px] text-red-600";
  } else {
    element.className =
      "text-sm min-h-[20px] text-emerald-600";
  }

  element.textContent = message;
}

function setSavingState(isSaving) {
  const button = document.querySelector("#settings-save-button");

  if (!button) return;

  button.disabled = isSaving;

  if (isSaving) {
    button.innerHTML = `
      <span class="material-symbols-outlined text-[20px] animate-spin">
        progress_activity
      </span>
      Menyimpan...
    `;
  } else {
    button.innerHTML = `
      <span class="material-symbols-outlined text-[20px]">
        save
      </span>
      Simpan Pengaturan
    `;
  }
}

function setupSettingsForm() {
  const form = document.querySelector("#settings-form");

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    showMessage("");
    setSavingState(true);

    try {
      const data = {
        namaKantin: getInputValue("#setting-nama-kantin"),
        namaPesantren: getInputValue("#setting-nama-pesantren"),
        alamat: getInputValue("#setting-alamat"),
        judulLaporan: getInputValue("#setting-judul-laporan"),
        footerLaporan: getInputValue("#setting-footer-laporan")
      };

      currentSettings = await saveSettings(data);

      showMessage(
        "Pengaturan berhasil disimpan.",
        "success"
      );

    } catch (error) {
      console.error(
        "Gagal menyimpan pengaturan:",
        error
      );

      showMessage(
        error?.message ||
          "Gagal menyimpan pengaturan.",
        "error"
      );
    } finally {
      setSavingState(false);
    }
  });
}

export async function renderSettings() {
  const app = document.querySelector("#app");

  if (!app) return;

  try {
    currentSettings = await getSettings();

    renderLayout({
      pageTitle: "Pengaturan",
      pageSubtitle: "Pengaturan Sistem",
      content: renderSettingsContent()
    });

    setupSettingsForm();

  } catch (error) {
    console.error(
      "Gagal memuat pengaturan:",
      error
    );

    renderLayout({
      pageTitle: "Pengaturan",
      pageSubtitle: "Pengaturan Sistem",
      content: `
        <div class="bg-white border border-red-200 rounded-2xl p-6 shadow-sm">

          <div class="flex items-start gap-3">

            <span class="material-symbols-outlined text-red-600">
              error
            </span>

            <div>
              <h2 class="font-bold text-slate-900">
                Gagal Memuat Pengaturan
              </h2>

              <p class="text-sm text-slate-600 mt-1">
                ${escapeHtml(
                  error?.message ||
                    "Terjadi kesalahan saat memuat pengaturan."
                )}
              </p>
            </div>

          </div>

        </div>
      `
    });
  }
}