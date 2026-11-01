import { renderLayout } from "../components/layout.js";
import {
  getClasses,
  createClass,
  updateClass,
  deleteClass
} from "../services/classes.service.js";

const state = {
  classes: [],
  loading: true,
  editingId: null
};

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getRoot() {
  return (
    document.querySelector("#page-content") ||
    document.querySelector("[data-page-content]") ||
    document.querySelector("main") ||
    document.querySelector("#app")
  );
}

function render() {
  const root = getRoot();

  if (!root) return;

  root.innerHTML = `
    <div class="min-h-full bg-slate-50 p-4 md:p-6 lg:p-8">
      <div class="mx-auto max-w-6xl">

        <div class="mb-6">
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Data Master
          </p>

          <h1 class="mt-1 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
            Master Kelas
          </h1>

          <p class="mt-2 text-sm text-slate-500">
            Kelola daftar kelas yang digunakan pada data pesanan santri.
          </p>
        </div>

        <div class="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">

          <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="mb-5">
              <h2 class="font-bold text-slate-800">
                ${state.editingId ? "Edit Kelas" : "Tambah Kelas"}
              </h2>

              <p class="mt-1 text-xs text-slate-500">
                Isi data kelas kemudian simpan.
              </p>
            </div>

            <form id="class-form" class="space-y-4">

              <label class="block">
                <span class="mb-1.5 block text-xs font-semibold text-slate-600">
                  Nama Kelas *
                </span>

                <input
                  name="nama"
                  type="text"
                  required
                  placeholder="Contoh: 1A"
                  class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <label class="block">
                <span class="mb-1.5 block text-xs font-semibold text-slate-600">
                  Tingkat
                </span>

                <input
                  name="tingkat"
                  type="text"
                  placeholder="Contoh: Kelas 1"
                  class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <label class="block">
                <span class="mb-1.5 block text-xs font-semibold text-slate-600">
                  Keterangan
                </span>

                <textarea
                  name="keterangan"
                  rows="3"
                  placeholder="Keterangan tambahan..."
                  class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                ></textarea>
              </label>

              <label class="flex cursor-pointer items-center gap-3 rounded-lg bg-slate-50 p-3">
                <input
                  name="aktif"
                  type="checkbox"
                  checked
                  class="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                />

                <span>
                  <span class="block text-sm font-semibold text-slate-700">
                    Kelas Aktif
                  </span>

                  <span class="block text-xs text-slate-500">
                    Kelas aktif akan muncul di dropdown pesanan.
                  </span>
                </span>
              </label>

              <div class="flex gap-2">
                <button
                  type="submit"
                  class="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:opacity-90"
                >
                  ${state.editingId ? "Simpan Perubahan" : "Tambah Kelas"}
                </button>

                ${
                  state.editingId
                    ? `
                      <button
                        type="button"
                        id="cancel-edit"
                        class="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Batal
                      </button>
                    `
                    : ""
                }
              </div>
            </form>
          </section>

          <section class="rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div class="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 class="font-bold text-slate-800">
                  Daftar Kelas
                </h2>

                <p class="mt-1 text-xs text-slate-500">
                  ${state.classes.length} kelas
                </p>
              </div>
            </div>

            ${
              state.loading
                ? `
                  <div class="px-5 py-12 text-center text-sm text-slate-500">
                    Memuat data...
                  </div>
                `
                : state.classes.length
                ? `
                  <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm">
                      <thead class="border-b border-slate-200 bg-slate-50">
                        <tr>
                          <th class="px-5 py-3 text-xs font-bold text-slate-500">
                            #
                          </th>
                          <th class="px-5 py-3 text-xs font-bold text-slate-500">
                            Kelas
                          </th>
                          <th class="px-5 py-3 text-xs font-bold text-slate-500">
                            Tingkat
                          </th>
                          <th class="px-5 py-3 text-xs font-bold text-slate-500">
                            Status
                          </th>
                          <th class="px-5 py-3 text-right text-xs font-bold text-slate-500">
                            Aksi
                          </th>
                        </tr>
                      </thead>

                      <tbody class="divide-y divide-slate-100">
                        ${state.classes
                          .map(
                            (item, index) => `
                              <tr class="hover:bg-slate-50">
                                <td class="px-5 py-3 text-slate-400">
                                  ${index + 1}
                                </td>

                                <td class="px-5 py-3 font-semibold text-slate-800">
                                  ${escapeHtml(item.nama)}
                                </td>

                                <td class="px-5 py-3 text-slate-600">
                                  ${escapeHtml(item.tingkat || "-")}
                                </td>

                                <td class="px-5 py-3">
                                  ${
                                    item.aktif !== false
                                      ? `
                                        <span class="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                          Aktif
                                        </span>
                                      `
                                      : `
                                        <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                                          Nonaktif
                                        </span>
                                      `
                                  }
                                </td>

                                <td class="px-5 py-3">
                                  <div class="flex justify-end gap-2">
                                    <button
                                      type="button"
                                      data-action="edit"
                                      data-id="${item.id}"
                                      class="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                    >
                                      Edit
                                    </button>

                                    <button
                                      type="button"
                                      data-action="delete"
                                      data-id="${item.id}"
                                      class="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                                    >
                                      Hapus
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            `
                          )
                          .join("")}
                      </tbody>
                    </table>
                  </div>
                `
                : `
                  <div class="px-5 py-12 text-center">
                    <p class="font-semibold text-slate-700">
                      Belum ada kelas
                    </p>

                    <p class="mt-1 text-sm text-slate-500">
                      Tambahkan kelas pertama menggunakan form di sebelah kiri.
                    </p>
                  </div>
                `
            }
          </section>

        </div>
      </div>
    </div>
  `;

  bindEvents();
}

function bindEvents() {
  const root = getRoot();

  if (!root) return;

  const form = root.querySelector("#class-form");

  if (form) {
    form.onsubmit = handleSubmit;
  }

  const cancelButton = root.querySelector("#cancel-edit");

  if (cancelButton) {
    cancelButton.onclick = () => {
      state.editingId = null;
      render();
    };
  }

  root.querySelectorAll('[data-action="edit"]').forEach((button) => {
    button.onclick = () => {
      startEdit(button.dataset.id);
    };
  });

  root.querySelectorAll('[data-action="delete"]').forEach((button) => {
    button.onclick = () => {
      handleDelete(button.dataset.id);
    };
  });

  if (state.editingId) {
    const item = state.classes.find(
      (classItem) => classItem.id === state.editingId
    );

    if (item) {
      form.nama.value = item.nama || "";
      form.tingkat.value = item.tingkat || "";
      form.keterangan.value = item.keterangan || "";
      form.aktif.checked = item.aktif !== false;
    }
  }
}

async function handleSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;

  const nama = form.nama.value.trim();

  if (!nama) {
    alert("Nama kelas wajib diisi.");
    return;
  }

  const data = {
    nama,
    tingkat: form.tingkat.value.trim(),
    keterangan: form.keterangan.value.trim(),
    aktif: form.aktif.checked
  };

  try {
    if (state.editingId) {
      await updateClass(state.editingId, data);
      state.editingId = null;
    } else {
      await createClass(data);
    }

    await loadClasses();
  } catch (error) {
    console.error(error);
    alert(`Gagal menyimpan kelas: ${error.message}`);
  }
}

function startEdit(id) {
  state.editingId = id;
  render();
}

async function handleDelete(id) {
  const item = state.classes.find(
    (classItem) => classItem.id === id
  );

  if (!item) return;

  const confirmed = confirm(
    `Hapus kelas "${item.nama}"?`
  );

  if (!confirmed) return;

  try {
    await deleteClass(id);

    if (state.editingId === id) {
      state.editingId = null;
    }

    await loadClasses();
  } catch (error) {
    console.error(error);
    alert(`Gagal menghapus kelas: ${error.message}`);
  }
}

async function loadClasses() {
  state.loading = true;
  render();

  try {
    state.classes = await getClasses();
  } catch (error) {
    console.error(error);
    alert(`Gagal memuat kelas: ${error.message}`);
  } finally {
    state.loading = false;
    render();
  }
}

export async function renderClasses() {
  renderLayout({ pageTitle: "Master Kelas", pageSubtitle: "Kelola daftar kelas santri." });

  state.editingId = null;
  await loadClasses();
}