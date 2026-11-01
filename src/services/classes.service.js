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

const classesCollection = collection(db, "classes");

export async function getClasses() {
  const q = query(classesCollection, orderBy("nama", "asc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data()
  }));
}

export async function getClassById(classId) {
  const classRef = doc(db, "classes", classId);
  const snapshot = await getDoc(classRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data()
  };
}

export async function createClass(classData) {
  const data = {
    nama: classData.nama.trim(),
    tingkat: classData.tingkat?.trim() || "",
    keterangan: classData.keterangan?.trim() || "",
    aktif: classData.aktif !== false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const docRef = await addDoc(classesCollection, data);

  return {
    id: docRef.id,
    ...data
  };
}

export async function updateClass(classId, classData) {
  const classRef = doc(db, "classes", classId);

  await updateDoc(classRef, {
    nama: classData.nama.trim(),
    tingkat: classData.tingkat?.trim() || "",
    keterangan: classData.keterangan?.trim() || "",
    aktif: classData.aktif !== false,
    updatedAt: serverTimestamp()
  });
}

export async function deleteClass(classId) {
  const classRef = doc(db, "classes", classId);

  await deleteDoc(classRef);
}