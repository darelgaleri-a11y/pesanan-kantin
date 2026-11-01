export function getTodayDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function createDateRange() {
  const today = getTodayDate();

  return {
    dari: today,
    sampai: today
  };
}

export function isDateInRange(
  tanggal,
  dari,
  sampai
) {
  if (!tanggal) {
    return false;
  }

  /*
   * Jika hanya satu sisi yang diisi,
   * gunakan tanggal tersebut sebagai
   * batas yang tersedia.
   */
  if (dari && !sampai) {
    return tanggal >= dari;
  }

  if (!dari && sampai) {
    return tanggal <= sampai;
  }

  if (!dari && !sampai) {
    return true;
  }

  return (
    tanggal >= dari &&
    tanggal <= sampai
  );
}

export function formatDateRange(
  dari,
  sampai
) {
  if (!dari && !sampai) {
    return "Semua tanggal";
  }

  if (dari && !sampai) {
    return `Mulai ${formatDate(dari)}`;
  }

  if (!dari && sampai) {
    return `Sampai ${formatDate(sampai)}`;
  }

  if (dari === sampai) {
    return formatDate(dari);
  }

  return `${formatDate(dari)} - ${formatDate(
    sampai
  )}`;
}

export function formatDate(
  dateString
) {
  if (!dateString) {
    return "-";
  }

  const date = new Date(
    `${dateString}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString(
    "id-ID",
    {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }
  );
}