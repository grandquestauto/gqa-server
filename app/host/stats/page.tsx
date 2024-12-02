"use client";

import { useQuestContext } from "@/components/context/quest";
import { app } from "@/components/fb/config";
import { Navbar } from "@/components/ui/navbar";
import GoogleMapReact, { Maps } from "google-map-react";
import {
  DocumentData,
  QueryDocumentSnapshot,
  collection,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { useEffect, useState } from "react";

export default function Home({ params }: { params: { questId: string } }) {
  const [open, setOpen] = useState(false);
  const [teamData, setTeamData] =
    useState<QueryDocumentSnapshot<DocumentData, DocumentData>[]>();

  const qid = params.questId;
  const q = useQuestContext();
  const user = q.user;
  const quest = q.quest;

  useEffect(() => {
    // get leaderboard data from Firestore based on questPoints
    const q = query(
      collection(getFirestore(app), "quest", "gqa", "teams"),
      orderBy("questPoints", "desc")
    );
    onSnapshot(q, (snap) => {
      setTeamData(snap.docs);
    });
  }, []);

  return (
    quest && (
      <div className="flex w-full h-full flex-col">
        <Navbar qName={quest?.name} />
        <div className="heading flex justify-center items-center text-5xl">
          Map
        </div>
        <main className="flex items-center justify-center p-10">
          <div style={{ height: "100vh", width: "100%" }}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d1786.43370263492!2d76.88571421624707!3d8.564302704121758!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sin!4v1719990994316!5m2!1sen!2sin"
              width="600"
              height="450"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </main>
      </div>
    )
  );
}
