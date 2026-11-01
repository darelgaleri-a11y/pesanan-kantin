import { navigate } from "../router.js";
import {
  loginAdmin,
  waitForAuthReady
} from "../services/auth.service.js";

export async function renderLogin() {
  const app = document.getElementById("app");

  const existingUser = await waitForAuthReady();

  // Kalau memang sudah login, jangan tampilkan login.
  if (existingUser) {
    await navigate("/");
    return;
  }

  app.innerHTML = `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div class="w-full max-w-md">
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">

          <div class="text-center mb-8">
            <div class="mx-auto mb-4 w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <span class="material-symbols-outlined text-emerald-600 text-3xl">
                restaurant
              </span>
            </div>

            <h1 class="text-2xl font-bold text-slate-800">
              Pesanan Kantin
            </h1>

            <p class="text-sm text-slate-500 mt-2">
              Login Administrator
            </p>
          </div>

          <form id="login-form" class="space-y-5">

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>

              <input
                id="login-email"
                type="email"
                autocomplete="email"
                placeholder="admin@example.com"
                class="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                required
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>

              <div class="relative">
                <input
                  id="login-password"
                  type="password"
                  autocomplete="current-password"
                  placeholder="Masukkan password"
                  class="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  required
                />

                <button
                  type="button"
                  id="toggle-password"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                >
                  <span class="material-symbols-outlined">
                    visibility
                  </span>
                </button>
              </div>
            </div>

            <div
              id="login-error"
              class="hidden rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3"
            ></div>

            <button
              id="login-submit"
              type="submit"
              class="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 transition"
            >
              Masuk
            </button>

          </form>
        </div>
      </div>
    </div>
  `;

  setupLoginEvents();
}

function setupLoginEvents() {
  const form = document.getElementById("login-form");
  const emailInput = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");
  const submitButton = document.getElementById("login-submit");
  const errorBox = document.getElementById("login-error");
  const togglePassword = document.getElementById("toggle-password");

  togglePassword.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";

    passwordInput.type = isPassword ? "text" : "password";

    togglePassword.innerHTML = `
      <span class="material-symbols-outlined">
        ${isPassword ? "visibility_off" : "visibility"}
      </span>
    `;
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    errorBox.classList.add("hidden");
    errorBox.textContent = "";

    submitButton.disabled = true;
    submitButton.textContent = "Memproses...";

    try {
      await loginAdmin(
        emailInput.value,
        passwordInput.value
      );

      // Setelah Firebase berhasil login,
      // langsung render Dashboard.
      await navigate("/");
    } catch (error) {
      console.error("Login error:", error);

      let message = "Login gagal. Silakan coba lagi.";

      if (error.code === "auth/invalid-credential") {
        message = "Email atau password salah.";
      } else if (error.code === "auth/user-not-found") {
        message = "Akun tidak ditemukan.";
      } else if (error.code === "auth/wrong-password") {
        message = "Password salah.";
      } else if (error.code === "auth/invalid-email") {
        message = "Format email tidak valid.";
      } else if (error.code === "auth/too-many-requests") {
        message = "Terlalu banyak percobaan. Silakan coba beberapa saat lagi.";
      }

      errorBox.textContent = message;
      errorBox.classList.remove("hidden");

      submitButton.disabled = false;
      submitButton.textContent = "Masuk";
    }
  });
}