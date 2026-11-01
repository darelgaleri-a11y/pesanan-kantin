function normalizeText(value = "") {
  return value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " dan ")
    .replace(/\+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeToken(token = "") {
  const aliases = {
    kentaky: "kentucky",
    kentaki: "kentucky",
    kentuki: "kentucky",
    kenthucky: "kentucky",
    kenthaki: "kentucky",

    geprk: "geprek",
    geprek: "geprek",

    bakr: "bakar",

    strobery: "stroberi",
    strawberry: "stroberi",

    greantea: "greentea",
    grentea: "greentea",
    grean: "greentea",

    cok: "coklat",

    nasgor: "nasi goreng",

    es: "es"
  };

  return aliases[token] || token;
}

function normalizeForMatch(value = "") {
  return normalizeText(value)
    .split(" ")
    .map(normalizeToken)
    .join(" ");
}

function levenshtein(a = "", b = "") {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix = Array.from({ length: b.length + 1 }, () =>
    Array(a.length + 1).fill(0)
  );

  for (let i = 0; i <= b.length; i++) {
    matrix[i][0] = i;
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;

      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[b.length][a.length];
}

function similarity(a = "", b = "") {
  const aa = normalizeForMatch(a);
  const bb = normalizeForMatch(b);

  if (!aa || !bb) return 0;
  if (aa === bb) return 1;

  const maxLength = Math.max(aa.length, bb.length);
  if (!maxLength) return 1;

  const distance = levenshtein(aa, bb);
  return 1 - distance / maxLength;
}

function tokenSimilarity(input = "", candidate = "") {
  const inputTokens = normalizeForMatch(input)
    .split(" ")
    .filter(Boolean);

  const candidateTokens = normalizeForMatch(candidate)
    .split(" ")
    .filter(Boolean);

  if (!inputTokens.length || !candidateTokens.length) {
    return 0;
  }

  let matched = 0;

  for (const inputToken of inputTokens) {
    let best = 0;

    for (const candidateToken of candidateTokens) {
      const score = similarity(inputToken, candidateToken);
      if (score > best) best = score;
    }

    matched += best;
  }

  return matched / inputTokens.length;
}

function menuLabel(menu) {
  return [
    menu?.nama || "",
    menu?.varian || "",
    menu?.ukuran || ""
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function getMenuCandidates(menu) {
  const values = new Set();

  const nama = menu?.nama || "";
  const varian = menu?.varian || "";
  const ukuran = menu?.ukuran || "";

  if (nama) values.add(nama);
  if (varian) values.add(varian);
  if (ukuran) values.add(ukuran);

  if (varian && ukuran) {
    values.add(`${varian} ${ukuran}`);
  }

  if (nama && varian) {
    values.add(`${nama} ${varian}`);
  }

  if (nama && ukuran) {
    values.add(`${nama} ${ukuran}`);
  }

  if (nama && varian && ukuran) {
    values.add(`${nama} ${varian} ${ukuran}`);
  }

  return [...values];
}

export function matchMenu(rawName, menus = []) {
  if (!rawName || !menus.length) {
    return null;
  }

  const input = normalizeForMatch(rawName);

  if (!input) {
    return null;
  }

  let bestMenu = null;
  let bestScore = 0;

  for (const menu of menus) {
    const candidates = getMenuCandidates(menu);

    for (const candidate of candidates) {
      const normalizedCandidate = normalizeForMatch(candidate);

      let score = 0;

      if (input === normalizedCandidate) {
        score = 1;
      } else {
        const direct = similarity(input, candidate);
        const tokens = tokenSimilarity(input, candidate);

        score = Math.max(direct, tokens);

        const inputTokenCount = input.split(" ").length;
        const candidateTokenCount = normalizedCandidate.split(" ").length;

        if (
          inputTokenCount < candidateTokenCount &&
          inputTokenCount >= 1
        ) {
          score -= 0.08;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMenu = menu;
      }
    }
  }

  // Batas agar item yang jelas berbeda tidak otomatis salah masuk menu.
  if (bestScore < 0.68) {
    return null;
  }

  return {
    menu: bestMenu,
    score: bestScore
  };
}

function cleanItemLine(line = "") {
  return line
    .replace(/^\s*[•●▪◦]\s*/u, "")
    .replace(/^\s*[-*]\s+/u, "")
    .replace(/^\s*\+\s+/u, "")
    .trim();
}

function parseItemLine(line = "") {
  let value = cleanItemLine(line);

  if (!value) {
    return null;
  }

  // Format: "Ayam bakar : 2"
  let match = value.match(/^(.*?)\s*[:=]\s*(\d+)\s*$/);

  if (match) {
    return {
      rawName: match[1].trim(),
      jumlah: Math.max(1, Number(match[2]))
    };
  }

  // Format: "Ayam bakar x2"
  match = value.match(/^(.*?)\s+[x×]\s*(\d+)\s*$/i);

  if (match) {
    return {
      rawName: match[1].trim(),
      jumlah: Math.max(1, Number(match[2]))
    };
  }

  // Format: "2 x ayam bakar"
  match = value.match(/^\s*(\d+)\s*[x×]\s+(.*?)\s*$/i);

  if (match) {
    return {
      rawName: match[2].trim(),
      jumlah: Math.max(1, Number(match[1]))
    };
  }

  // Format paling umum: "Ayam bakar 2"
  match = value.match(/^(.*?)\s+(\d+)\s*$/);

  if (match) {
    const possibleName = match[1].trim();

    if (possibleName) {
      return {
        rawName: possibleName,
        jumlah: Math.max(1, Number(match[2]))
      };
    }
  }

  return {
    rawName: value,
    jumlah: 1
  };
}

function isFieldLine(line, fieldName) {
  const regex = new RegExp(
    `^\\s*${fieldName}\\s*:\\s*(.*?)\\s*$`,
    "i"
  );

  return line.match(regex);
}

function parseDateFromText(text) {
  const match = text.match(
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/
  );

  if (!match) {
    return null;
  }

  const day = match[1].padStart(2, "0");
  const month = match[2].padStart(2, "0");
  const year = match[3];

  return `${year}-${month}-${day}`;
}

function addParsedItem(current, parsedItem, menus) {
  if (!parsedItem?.rawName) return;
  const matched = matchMenu(parsedItem.rawName, menus);
  current.items.push({
    rawName: parsedItem.rawName,
    namaMenu: matched?.menu?.nama || parsedItem.rawName,
    menuId: matched?.menu?.id || "",
    kategori: matched?.menu?.kategori || "Lainnya",
    varian: matched?.menu?.varian || "",
    ukuran: matched?.menu?.ukuran || "",
    jumlah: parsedItem.jumlah || 1,
    catatan: parsedItem.catatan || "",
    matched: Boolean(matched),
    matchScore: matched?.score || 0,
    dibagikan: false
  });
}

function parseFreeFormItems(line, menus = []) {
  // Tokenisasi mempertahankan teks menu, tetapi menyamakan tanda + dan tanda baca.
  const tokens = normalizeText(line).split(" ").filter(Boolean);
  const candidates = [];

  for (const menu of menus) {
    for (const label of getMenuCandidates(menu)) {
      const words = normalizeForMatch(label).split(" ").filter(Boolean);
      if (words.length) candidates.push({ menu, label, words });
    }
  }
  candidates.sort((a, b) => b.words.length - a.words.length);

  const found = [];
  let i = 0;
  let trailingNote = [];
  while (i < tokens.length) {
    let best = null;
    for (const candidate of candidates) {
      const min = Math.max(1, candidate.words.length - 1);
      const max = Math.min(tokens.length - i, candidate.words.length + 1);
      for (let size = min; size <= max; size++) {
        const phrase = tokens.slice(i, i + size).join(" ");
        const score = similarity(phrase, candidate.words.join(" "));
        if (!best || score > best.score) best = { ...candidate, size, score };
      }
    }

    if (best && best.score >= 0.70) {
      const previous = found[found.length - 1];
      if (previous && trailingNote.length) {
        previous.catatan = [previous.catatan, trailingNote.join(" ")].filter(Boolean).join(" ");
        trailingNote = [];
      }
      let next = i + best.size;
      let jumlah = 1;
      if (/^\d+$/.test(tokens[next] || "")) {
        jumlah = Math.max(1, Number(tokens[next]));
        next++;
      }
      found.push({ rawName: best.label, jumlah, menu: best.menu, catatan: "" });
      i = next;
    } else {
      // Kata-kata setelah item terakhir biasanya merupakan catatan, misalnya "gak pedes".
      trailingNote.push(tokens[i]);
      i++;
    }
  }

  if (found.length) {
    if (trailingNote.length) {
      const last = found[found.length - 1];
      last.catatan = trailingNote.join(" ");
    }
    return found.map((item) => ({
      rawName: item.rawName,
      jumlah: item.jumlah,
      catatan: item.catatan,
      matchedMenu: item.menu
    }));
  }

  return [];
}

export function parseWhatsAppOrders(text = "", menus = []) {
  const cleanText = text
    .replace(/\u200e/g, "")
    .replace(/\u202f/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  if (!cleanText) return [];

  const globalDate = parseDateFromText(cleanText);
  const lines = cleanText.split("\n").map((line) => line.trim()).filter(Boolean);
  const result = [];
  let current = null;
  let readingItems = false;

  function startOrder() {
    current = { nama: "", kelas: "", kamar: "", tanggal: globalDate || "", catatan: "", items: [] };
    readingItems = false;
  }
  function finishOrder() {
    if (!current) return;
    if (current.nama || current.kelas || current.kamar || current.items.length) result.push(current);
    current = null;
    readingItems = false;
  }

  for (const originalLine of lines) {
    let line = originalLine.trim();
    // Format bebas: "Pesanan atas nama Budi kelas 1 B, Abu Ubaidah 2".
    const header = line.match(/^pesanan\s+atas\s+nama\s+(.+?)\s+kelas\s+([^,]+)(?:\s*,\s*(.+))?$/i);
    if (header) {
      if (current) finishOrder();
      startOrder();
      current.nama = header[1].trim();
      current.kelas = header[2].trim();
      current.kamar = (header[3] || "").trim();
      readingItems = true;
      continue;
    }

    const namaMatch = isFieldLine(line, "nama");
    const kelasMatch = isFieldLine(line, "kelas");
    const asramaMatch = isFieldLine(line, "asrama");
    const kamarMatch = isFieldLine(line, "kamar");
    const tanggalMatch = isFieldLine(line, "tanggal");
    const catatanMatch = isFieldLine(line, "catatan");
    const pesananMatch = line.match(/^pesanan\s*:?\s*$/i);

    if (namaMatch) {
      if (current) finishOrder();
      startOrder();
      current.nama = namaMatch[1].trim();
      continue;
    }

    // Izinkan satu pesan dimulai dengan format "Nama: ..." maupun format bebas.
    if (!current && /^(nama|kelas|asrama|kamar)\s*:/i.test(line)) startOrder();
    if (!current) continue;

    if (kelasMatch) { current.kelas = kelasMatch[1].trim(); continue; }
    if (asramaMatch) { current.kamar = asramaMatch[1].trim(); continue; }
    if (kamarMatch) { current.kamar = kamarMatch[1].trim(); continue; }
    if (tanggalMatch) {
      const dateValue = parseDateFromText(tanggalMatch[1]);
      if (dateValue) current.tanggal = dateValue;
      continue;
    }
    if (catatanMatch) { current.catatan = catatanMatch[1].trim(); continue; }
    if (pesananMatch) { readingItems = true; continue; }

    // Baris setelah metadata atau baris yang diawali kata "pesanan" dianggap item.
    if (/^pesanan\s+/i.test(line)) {
      line = line.replace(/^pesanan\s+/i, "");
      readingItems = true;
    }

    if (readingItems || /\d+\s*$/.test(line) || /^[•●▪◦*-]\s*/.test(line)) {
      const freeItems = parseFreeFormItems(line, menus);
      if (freeItems.length) {
        for (const item of freeItems) {
          const matched = item.matchedMenu ? { menu: item.matchedMenu, score: 1 } : matchMenu(item.rawName, menus);
          current.items.push({
            rawName: item.rawName,
            namaMenu: matched?.menu?.nama || item.rawName,
            menuId: matched?.menu?.id || "",
            kategori: matched?.menu?.kategori || "Lainnya",
            varian: matched?.menu?.varian || "",
            ukuran: matched?.menu?.ukuran || "",
            jumlah: item.jumlah,
            catatan: item.catatan || "",
            matched: Boolean(matched),
            matchScore: matched?.score || 0,
            dibagikan: false
          });
        }
      } else {
        const parsedItem = parseItemLine(line);
        addParsedItem(current, parsedItem, menus);
      }
    }
  }

  finishOrder();
  return result;
}

export function getMatchStatus(item) {
  if (item?.matched) {
    return {
      label: "Cocok",
      className:
        "bg-emerald-50 text-emerald-700 border-emerald-200"
    };
  }

  return {
    label: "Belum cocok",
    className:
      "bg-amber-50 text-amber-700 border-amber-200"
  };
}

export { menuLabel, normalizeForMatch };