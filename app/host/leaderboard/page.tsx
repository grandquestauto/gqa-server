"use client";

import { useQuestContext } from "@/components/context/quest";
import { app } from "@/components/fb/config";
import { Navbar } from "@/components/ui/navbar";
import { Team } from "@/lib/models";
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
          Leaderboard
        </div>
        <main className="flex items-center justify-center p-10">
          <table className="table">
            <thead className="table-header-group">
              <tr>
                <th>Team Name</th>
                <th>QuestPoints</th>
                <th>Current Mission</th>
              </tr>
            </thead>
            <tbody>
              {teamData?.map((doc) => {
                const data = doc.data() as Team;
                return (
                  <tr key={doc.id} className="table-row">
                    <td>{data.name}</td>
                    <td>{data.questPoints.toString()}</td>
                    <td>
                      {data.currentMission == ""
                        ? "No Mission Assigned."
                        : data.currentMission}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </main>
      </div>
    )
  );
}
