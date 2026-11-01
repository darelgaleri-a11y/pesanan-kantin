function normalizeName(value = "") {
  return value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function flattenOrderItems(orders = []) {
  const result = [];

  orders.forEach((order) => {
    (order.items || []).forEach((item, itemIndex) => {
      result.push({
        orderId: order.id,
        itemIndex,

        tanggal: order.tanggal || "",
        nama: order.nama || "",
        kelas: order.kelas || "",
        kamar: order.kamar || "",

        menuId: item.menuId || "",
        namaMenu: item.namaMenu || "",
        kategori: item.kategori || "Lainnya",
        varian: item.varian || "",
        ukuran: item.ukuran || "",
        jumlah: Number(item.jumlah) || 0,

        dibagikan: Boolean(item.dibagikan)
      });
    });
  });

  return result;
}

function makeAggregationKey(item) {
  if (item.menuId) {
    return [
      "menu",
      item.menuId,
      normalizeName(item.varian),
      normalizeName(item.ukuran)
    ].join("|");
  }

  return [
    "nama",
    normalizeName(item.namaMenu),
    normalizeName(item.varian),
    normalizeName(item.ukuran)
  ].join("|");
}

export function aggregateKitchenOrders(
  orders = [],
  options = {}
) {
  const {
    category = "",
    menuKeyword = ""
  } = options;

  const items = flattenOrderItems(orders);

  const filteredItems = items.filter((item) => {
    if (category && item.kategori !== category) {
      return false;
    }

    if (menuKeyword) {
      const keyword = normalizeName(menuKeyword);

      const searchable = normalizeName(
        [
          item.namaMenu,
          item.varian,
          item.ukuran
        ]
          .filter(Boolean)
          .join(" ")
      );

      if (!searchable.includes(keyword)) {
        return false;
      }
    }

    return true;
  });

  const grouped = new Map();

  filteredItems.forEach((item) => {
    const key = makeAggregationKey(item);

    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        menuId: item.menuId || "",
        namaMenu: item.namaMenu || "",
        kategori: item.kategori || "Lainnya",
        varian: item.varian || "",
        ukuran: item.ukuran || "",
        jumlah: 0,
        jumlahJenisItem: 0,
        jumlahSudahDibagikan: 0,
        jumlahBelumDibagikan: 0
      });
    }

    const group = grouped.get(key);

    group.jumlah += item.jumlah;
    group.jumlahJenisItem += 1;

    if (item.dibagikan) {
      group.jumlahSudahDibagikan += item.jumlah;
    } else {
      group.jumlahBelumDibagikan += item.jumlah;
    }
  });

  return [...grouped.values()].sort((a, b) => {
    const categoryCompare = String(a.kategori).localeCompare(
      String(b.kategori),
      "id"
    );

    if (categoryCompare !== 0) {
      return categoryCompare;
    }

    return String(a.namaMenu).localeCompare(
      String(b.namaMenu),
      "id"
    );
  });
}

export function getKitchenTotals(rows = []) {
  return rows.reduce(
    (result, row) => {
      result.total += row.jumlah;
      result.sudahDibagikan += row.jumlahSudahDibagikan;
      result.belumDibagikan += row.jumlahBelumDibagikan;

      return result;
    },
    {
      total: 0,
      sudahDibagikan: 0,
      belumDibagikan: 0
    }
  );
}

export function getKitchenCategoryTotals(rows = []) {
  const grouped = new Map();

  rows.forEach((row) => {
    const category = row.kategori || "Lainnya";

    if (!grouped.has(category)) {
      grouped.set(category, 0);
    }

    grouped.set(
      category,
      grouped.get(category) + row.jumlah
    );
  });

  return [...grouped.entries()]
    .map(([kategori, jumlah]) => ({
      kategori,
      jumlah
    }))
    .sort((a, b) =>
      a.kategori.localeCompare(b.kategori, "id")
    );
}
const BANANA_FLAVORS = [
  {
    key: "coklat",
    label: "Coklat",
    aliases: ["coklat", "cok"]
  },
  {
    key: "keju",
    label: "Keju",
    aliases: ["keju"]
  },
  {
    key: "tiramisu",
    label: "Tiramisu",
    aliases: ["tiramisu"]
  },
  {
    key: "stroberi",
    label: "Stroberi",
    aliases: [
      "stroberi",
      "strobery",
      "strawberry"
    ]
  },
  {
    key: "greentea",
    label: "Greentea",
    aliases: [
      "greentea",
      "green tea",
      "grentea",
      "grean tea"
    ]
  }
];

const BANANA_SIZE_ALIASES = {
  reguler: "reguler",
  regular: "reguler",
  reg: "reguler",

  jumbo: "jumbo"
};

function normalizeBananaText(value = "") {
  return value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\+/g, " ")
    .replace(/&/g, " dan ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectBananaSize(item) {
  const source = normalizeBananaText(
    [
      item.ukuran || "",
      item.varian || "",
      item.namaMenu || ""
    ]
      .filter(Boolean)
      .join(" ")
  );

  for (const [alias, normalized] of Object.entries(
    BANANA_SIZE_ALIASES
  )) {
    if (source.includes(alias)) {
      return normalized;
    }
  }

  return "";
}

function detectBananaFlavors(item) {
  const source = normalizeBananaText(
    [
      item.varian || "",
      item.namaMenu || ""
    ]
      .filter(Boolean)
      .join(" ")
  );

  const found = [];

  for (const flavor of BANANA_FLAVORS) {
    const matched = flavor.aliases.some((alias) => {
      return source.includes(
        normalizeBananaText(alias)
      );
    });

    if (matched) {
      found.push(flavor);
    }
  }

  return found;
}

function makeBananaCombinationKey(flavors) {
  return flavors
    .map((flavor) => flavor.key)
    .sort(
      (a, b) =>
        BANANA_FLAVORS.findIndex(
          (item) => item.key === a
        ) -
        BANANA_FLAVORS.findIndex(
          (item) => item.key === b
        )
    )
    .join("+");
}

function getBananaCombinationLabel(flavors) {
  return flavors
    .slice()
    .sort(
      (a, b) =>
        BANANA_FLAVORS.findIndex(
          (item) => item.key === a.key
        ) -
        BANANA_FLAVORS.findIndex(
          (item) => item.key === b.key
        )
    )
    .map((flavor) => flavor.label)
    .join(" + ");
}

export function aggregateBananaOrders(
  orders = [],
  options = {}
) {
  const {
    size = "",
    type = ""
  } = options;

  const items = flattenOrderItems(orders);

  const bananaItems = items.filter((item) => {
    const category = normalizeName(
      item.kategori || ""
    );

    const menuName = normalizeName(
      item.namaMenu || ""
    );

    const isBanana =
      category === "pisang keju" ||
      menuName.includes("pisang keju") ||
      menuName.includes("pisang");

    if (!isBanana) {
      return false;
    }

    const detectedSize = detectBananaSize(item);

    if (size && detectedSize !== size) {
      return false;
    }

    return true;
  });

  const grouped = new Map();

  bananaItems.forEach((item) => {
    const detectedSize = detectBananaSize(item);
    const flavors = detectBananaFlavors(item);

    if (!detectedSize || !flavors.length) {
      return;
    }

    const combinationType =
      flavors.length >= 2
        ? "2-rasa"
        : "1-rasa";

    if (type && combinationType !== type) {
      return;
    }

    const combinationKey =
      makeBananaCombinationKey(flavors);

    const key = [
      combinationType,
      combinationKey
    ].join("|");

    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        type: combinationType,
        combination: combinationKey,
        label: getBananaCombinationLabel(
          flavors
        ),
        reguler: 0,
        jumbo: 0,
        total: 0
      });
    }

    const row = grouped.get(key);

    const quantity = Number(item.jumlah) || 0;

    if (detectedSize === "reguler") {
      row.reguler += quantity;
    }

    if (detectedSize === "jumbo") {
      row.jumbo += quantity;
    }

    row.total += quantity;
  });

  const result = [...grouped.values()];

  return result.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "1-rasa" ? -1 : 1;
    }

    return a.label.localeCompare(
      b.label,
      "id"
    );
  });
}

export function getBananaFlavorRows(
  orders = []
) {
  return aggregateBananaOrders(orders, {
    type: "1-rasa"
  });
}

export function getBananaCombinationRows(
  orders = []
) {
  return aggregateBananaOrders(orders, {
    type: "2-rasa"
  });
}

export function getBananaTotals(
  orders = []
) {
  const rows = aggregateBananaOrders(orders);

  return rows.reduce(
    (result, row) => {
      result.reguler += row.reguler;
      result.jumbo += row.jumbo;
      result.total += row.total;

      return result;
    },
    {
      reguler: 0,
      jumbo: 0,
      total: 0
    }
  );
}