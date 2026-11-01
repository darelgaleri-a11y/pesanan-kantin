import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from "firebase/firestore";

import { db } from "../firebase.js";

const roomsCollection = collection(db, "rooms");

export async function getRooms() {
  const q = query(roomsCollection, orderBy("nama", "asc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data()
  }));
}

export async function getRoomById(roomId) {
  const roomRef = doc(db, "rooms", roomId);
  const snapshot = await getDoc(roomRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data()
  };
}

export async function createRoom(roomData) {
  const data = {
    nama: roomData.nama.trim(),
    lokasi: roomData.lokasi?.trim() || "",
    keterangan: roomData.keterangan?.trim() || "",
    aktif: roomData.aktif !== false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const docRef = await addDoc(roomsCollection, data);

  return {
    id: docRef.id,
    ...data
  };
}

export async function updateRoom(roomId, roomData) {
  const roomRef = doc(db, "rooms", roomId);

  await updateDoc(roomRef, {
    nama: roomData.nama.trim(),
    lokasi: roomData.lokasi?.trim() || "",
    keterangan: roomData.keterangan?.trim() || "",
    aktif: roomData.aktif !== false,
    updatedAt: serverTimestamp()
  });
}

export async function deleteRoom(roomId) {
  const roomRef = doc(db, "rooms", roomId);

  await deleteDoc(roomRef);
}