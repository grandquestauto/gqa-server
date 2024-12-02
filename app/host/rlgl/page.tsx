"use client";

import { useQuestContext } from "@/components/context/quest";
import { app } from "@/components/fb/config";
import { Navbar } from "@/components/ui/navbar";
import {
  DocumentData,
  QueryDocumentSnapshot,
  collection,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { useEffect, useState } from "react";

export default function Home({ params }: { params: { questId: string } }) {
  const db = getFirestore(app);

  const fetchCollectionData = async (collectionPath: string) => {
    const collectionRef = collection(db, collectionPath);
    const querySnapshot = await getDocs(collectionRef);
    const data: { [key: string]: any } = {};

    for (const doc of querySnapshot.docs) {
      data[doc.id] = doc.data();
      
      // Fetch known subcollections
      if (collectionPath === 'quest') {
        data[doc.id]['missions'] = await fetchCollectionData(`${collectionPath}/${doc.id}/missions`);
        data[doc.id]['teams'] = await fetchCollectionData(`${collectionPath}/${doc.id}/teams`);
      } else if (collectionPath.includes('/missions')) {
        data[doc.id]['level'] = await fetchCollectionData(`${collectionPath}/${doc.id}/level`);
      } else if (collectionPath.includes('/teams')) {
        data[doc.id]['members'] = await fetchCollectionData(`${collectionPath}/${doc.id}/members`);
        data[doc.id]['missionLog'] = await fetchCollectionData(`${collectionPath}/${doc.id}/missionLog`);
      }
    }

    return data;
  };

  const downloadDatabase = async () => {
    try {
      const data: { [key: string]: any } = {};
      
      // Start with the 'quest' collection
      data['quest'] = await fetchCollectionData('quest');

      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'firestore-database.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading database:", error);
    }
  };

  return (
    <div>
      <Navbar />
      <button onClick={downloadDatabase}>Download Entire Database</button>
    </div>
  );
}