import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

import { db } from "../firebase.js";

const SETTINGS_DOC_ID = "app";

const settingsRef = doc(
  db,
  "settings",
  SETTINGS_DOC_ID
);

const DEFAULT_SETTINGS = {
  namaKantin: "",
  namaPesantren: "",
  alamat: "",
  judulLaporan: "Laporan Pesanan Kantin",
  footerLaporan: ""
};

function normalizeString(value, fallback = "") {
  if (
    value === undefined ||
    value === null
  ) {
    return fallback;
  }

  return String(value).trim();
}

function normalizeSettings(data = {}) {
  return {
    namaKantin: normalizeString(data.namaKantin),
    namaPesantren: normalizeString(data.namaPesantren),
    alamat: normalizeString(data.alamat),

    judulLaporan: normalizeString(
      data.judulLaporan,
      DEFAULT_SETTINGS.judulLaporan
    ) || DEFAULT_SETTINGS.judulLaporan,

    footerLaporan: normalizeString(
      data.footerLaporan
    )
  };
}

export async function getSettings() {
  const snapshot = await getDoc(settingsRef);

  if (!snapshot.exists()) {
    return {
      ...DEFAULT_SETTINGS
    };
  }

  return {
    ...DEFAULT_SETTINGS,
    ...normalizeSettings(snapshot.data())
  };
}

export async function saveSettings(settingsData = {}) {
  const normalized = normalizeSettings(settingsData);

  await setDoc(
    settingsRef,
    {
      ...normalized,
      updatedAt: serverTimestamp()
    },
    {
      merge: true
    }
  );

  return normalized;
}

export { DEFAULT_SETTINGS };