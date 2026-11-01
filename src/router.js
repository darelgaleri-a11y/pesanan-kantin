const routes = new Map();


/*
|--------------------------------------------------------------------------
| REGISTER ROUTE
|--------------------------------------------------------------------------
*/

export function registerRoute(
  path,
  renderFunction
) {

  routes.set(
    normalizePath(path),
    renderFunction
  );

}


/*
|--------------------------------------------------------------------------
| NAVIGATE
|--------------------------------------------------------------------------
*/

export async function navigate(
  path
) {

  const cleanPath =
    normalizePath(path);

  window.history.pushState(
    {},
    "",
    `#${cleanPath}`
  );

  await renderCurrentRoute();

}


/*
|--------------------------------------------------------------------------
| RENDER CURRENT ROUTE
|--------------------------------------------------------------------------
*/


export async function renderCurrentRoute() {

  const path =
    getCurrentPath();

  const renderFunction =
    routes.get(path) ||
    routes.get("/");

  if (!renderFunction) {

    console.error(
      `Route tidak ditemukan: ${path}`
    );

    return;
  }

  try {

    await renderFunction();

    // Beri tahu layout bahwa route sudah berubah.
    // Ini diperlukan karena navigate() menggunakan pushState(),
    // yang tidak memicu event hashchange.
    window.dispatchEvent(
      new CustomEvent("routechange", {
        detail: {
          path
        }
      })
    );

  } catch (error) {

    console.error(
      "Gagal merender halaman:",
      error
    );

    const app =
      document.querySelector(
        "#app"
      );

    if (app) {

      app.innerHTML = `
        <div
          class="
            min-h-screen
            flex
            items-center
            justify-center
            p-6
          "
        >

          <div
            class="
              bg-white
              border
              border-red-200
              rounded-xl
              p-6
              max-w-lg
              w-full
            "
          >

            <h1
              class="
                text-xl
                font-bold
                text-red-700
                mb-2
              "
            >
              Terjadi Kesalahan
            </h1>

            <p
              class="
                text-sm
                text-slate-600
              "
            >
              Halaman gagal dimuat.
              Silakan periksa console browser.
            </p>

          </div>

        </div>
      `;

    }

  }

}

/*
|--------------------------------------------------------------------------
| GET CURRENT PATH
|--------------------------------------------------------------------------
*/

export function getCurrentPath() {

  const hash =
    window.location.hash;


  if (
    !hash ||
    hash === "#"
  ) {

    return "/";

  }


  /*
   * Ambil isi setelah tanda #.
   *
   * Contoh:
   *
   * #/tambah-pesanan?id=abc123
   *
   * menjadi:
   *
   * /tambah-pesanan?id=abc123
   */

  const hashValue =
    hash.substring(1);


  /*
   * Buang query string.
   *
   * /tambah-pesanan?id=abc123
   *
   * menjadi:
   *
   * /tambah-pesanan
   */

  const pathOnly =
    hashValue.split("?")[0];


  return normalizePath(
    pathOnly
  );

}


/*
|--------------------------------------------------------------------------
| GET QUERY PARAMS
|--------------------------------------------------------------------------
|
| Contoh:
|
| #/tambah-pesanan?id=abc123
|
| hasil:
|
| params.get("id")
| → abc123
|
*/

export function getQueryParams() {

  const hash =
    window.location.hash;


  if (
    !hash ||
    hash === "#"
  ) {

    return new URLSearchParams();

  }


  const hashValue =
    hash.substring(1);


  const queryIndex =
    hashValue.indexOf("?");


  if (
    queryIndex === -1
  ) {

    return new URLSearchParams();

  }


  const queryString =
    hashValue.substring(
      queryIndex + 1
    );


  return new URLSearchParams(
    queryString
  );

}


/*
|--------------------------------------------------------------------------
| GET QUERY PARAM
|--------------------------------------------------------------------------
*/

export function getQueryParam(
  name
) {

  const params =
    getQueryParams();


  return params.get(
    name
  );

}


/*
|--------------------------------------------------------------------------
| NORMALIZE PATH
|--------------------------------------------------------------------------
*/

function normalizePath(
  path
) {

  if (
    !path ||
    path === "/"
  ) {

    return "/";

  }


  /*
   * Kalau ada query string,
   * buang terlebih dahulu.
   */
  const pathOnly =
    String(path)
      .split("?")[0];


  const value =
    pathOnly.startsWith("/")
      ? pathOnly
      : `/${pathOnly}`;


  /*
   * Hilangkan slash di akhir.
   *
   * /pesanan/
   * menjadi:
   * /pesanan
   */
  return value.replace(
    /\/+$/,
    ""
  ) || "/";
}


/*
|--------------------------------------------------------------------------
| INIT ROUTER
|--------------------------------------------------------------------------
*/

export function initRouter() {

  window.addEventListener(
    "hashchange",
    renderCurrentRoute
  );


  window.addEventListener(
    "popstate",
    renderCurrentRoute
  );

}