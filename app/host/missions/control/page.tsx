"use client";

import { useQuestContext } from "@/components/context/quest";
import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import { ScanQRDialog } from "@/components/dialog/scanQR";
import { app } from "@/components/fb/config";
import { Button } from "@/components/ui/button";
import {
Dialog,
DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/ui/navbar";
import { Textarea } from "@/components/ui/textarea";
import { toast, useToast } from "@/components/ui/use-toast";
import { GenericConverter, Level, Mission, Team } from "@/lib/models";

import {
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { Check, Loader, ScanLine } from "lucide-react";
import { AwaitedReactNode, ClassAttributes, HTMLAttributes, JSX, JSXElementConstructor, LegacyRef, ReactElement, ReactNode, ReactPortal, TdHTMLAttributes, use, useEffect, useState } from "react";
import { set } from "react-hook-form";
import { cn, timeConversion } from "@/lib/utils";
import { createMissionSchedule } from "@/lib/missionScheduler";

export default function Home({ params }: { params: { questId: string } }) {
  const [open, setOpen] = useState(false);
  const [levels, setLevels] = useState<{ [key: string]: any }>({});
  const [isScanQRDialogOpen, setScanQRDialogOpen] = useState<boolean>(false);
  const [missionId, setMissionId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [clock, setClock] = useState<number>(0);
  
  
  const [teams, setTeams] = useState<Team[]>();
  const [missions, setMissions] = useState<Mission[]>();
  const [missionLogs, setMissionLogs] = useState<{[tid:string]: Team['missionLog']}>({});
  const [missionSchedule, setMissionSchedule] = useState<{ [key: Team['id']]: (Mission | null)[] }>({})
  const [currentMissionIndex, setCurrentMissionIndex] = useState<{ [key: Team['id']]: number }>({});
  
  const q = useQuestContext();
  const toast = useToast();
  const quest = q.quest;

  useEffect(() => {
    // Fetch All Teams
    onSnapshot(query(collection(getFirestore(app), "quest", "gqa", "teams")), async (snap) => {
        setTeams(snap.docs.map((t) => {
          setCurrentMissionIndex((prev) => ({...prev, [t.id]: -1}));
          return t.data() as Team
        }));
    });

    // Fetch All Missions
    getDocs(query(collection(getFirestore(app), "quest", "gqa", "missions")))
    .then((snap) => {
      let mns: Mission[] = []
      snap.docs.forEach((t)=>{
        mns.push(t.data() as Mission)
      })
      setMissions(mns);
    });

    // Fetch All Mission Logs
    onSnapshot(collectionGroup(getFirestore(app), "missionLog"), async (snap) => {
      let logs: {[tid:string]: Team['missionLog']} = {};
      snap.docs.forEach((t) => {
        if(!t.ref.parent.parent?.id) return;
        if(!logs[t.ref.parent.parent.id]) logs[t.ref.parent.parent.id] = {} as Team['missionLog'];
        //@ts-ignore
        logs[t.ref.parent.parent.id][t.id] = t.data() as Team['missionLog'];
      });
      setMissionLogs(logs);
    })
  }, []);


useEffect(() => {
  if(teams && missions && missionLogs){
    const schedule = createMissionSchedule(teams, missions, 100 ,missionLogs);
    setMissionSchedule(schedule);
    setLoading(false);
  }
}, [teams, missions, missionLogs]);

  useEffect(() => {
    const interval = setInterval(() => {
      setClock(new Date().getTime());
    }, 1000);
    return () => clearInterval(interval);
  });

  useEffect(() => {
    if (clock && missionLogs) {
      Object.keys(missionLogs).forEach((teamId) => {
        // @ts-ignore
        Object.keys(missionLogs[teamId]).forEach(async (missionId) => {
          // @ts-ignore
          const missionLog = missionLogs[teamId][missionId];
          if (missionLog.status === "init" && clock - missionLog.startTime.toMillis() > 20 * 60 * 1000) {
            await updateDoc(doc(getFirestore(app), "quest", "gqa", "missions", missionId), { crnt: {'startTime':0, team: "", level:"" }})
            await updateDoc(doc(getFirestore(app), "quest", "gqa", "teams", teamId), { currentMission: "" })
            await updateDoc(doc(getFirestore(app), "quest", "gqa", "teams", teamId, "missionLog", missionId), { endTime: Timestamp.fromDate(new Date()), status: "exited"})
          
            const missionLevelsRef = collection(getFirestore(app), "quest", "gqa", "missions", missionId, "level");
            const missionLevelsSnapshot = await getDocs(missionLevelsRef);
            missionLevelsSnapshot.forEach(async (doc) => {
              await updateDoc(doc.ref, { usedHint: false });
            });
          }
        });
      });
    }
  }, [clock, missionLogs]);

  useEffect(() => {
    const fetchLevels = async () => {
      const levelPromises: any = teams?.map(async (data) => {
        const docRef = doc(
          getFirestore(app),
          "quest",
          "gqa",
          "missions",
          data.id,
          "level",
          "init"
        );
        const levelDoc = await getDoc(docRef);
        return { id: data.id, level: levelDoc.data() };
      });

      const levelsData = await Promise.all(levelPromises);
      const levelsMap: { [key: string]: any } = levelsData.reduce(
        (acc, { id, level }) => {
          acc[id] = level;
          return acc;
        },
        {} as { [key: string]: any }
      );

      setLevels(levelsMap);
    };

    // fetchLevels();
  }, [teams]);

  function getMissionTileColor(teamId: string, missionId: string, index: number) {
    const status = missionLogs?.[teamId]?.[missionId]?.status;
  
    if (status === "completed") return "bg-green-600";
    else if (status === "timeout") return "bg-orange-600";
    else if (status === "exited") return "bg-red-600";
    else if (status) {
      return "bg-yellow-600 animate-pulse";
    } else {
      return "bg-slate-700";
    }
  }

  function endQuest() {
  teams?.forEach(async (team) => {
    const teamRef = doc(getFirestore(app), "quest", "gqa", "teams", team.id);
    await updateDoc(teamRef, { currentMission: "finish" });
  });
  toast.toast({ title: "Quest Ended Successfully.", variant: "default" });
  }

  async function addExtraMinutes(tid: string) {
    const missionId = missionSchedule[tid][currentMissionIndex[tid]]?.id;
    
    if (!missionId) {
      console.error("Mission ID is undefined");
      return;
    }
  
    const missionLogRef = doc(getFirestore(app), "quest", "gqa", "teams", tid, "missionLog", missionId);
    
    const currentMissionLog = missionLogs[tid]?.[missionId]
    if (!currentMissionLog || !currentMissionLog.startTime) {
      console.error("Mission log or start time is undefined");
      return;
    }
  
    try {
      await updateDoc(missionLogRef, {
        startTime: Timestamp.fromMillis(currentMissionLog.startTime.toMillis() + 10 * 60 * 1000),
      });
  
      console.log("Document successfully updated");
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  }
  
  function assignMission(teamId: string, missionId: string) {
    const missionRef = doc(
      getFirestore(app),
      "quest",
      "gqa",
      "teams",
      teamId
    );

    updateDoc(missionRef, {
      currentMission: missionId + ".none",
    } as Team);

    toast.toast({title:"Mission Assigned Successfully." , variant:"default"});
  }


  return (
    quest && (
      <div className="flex w-full h-[100rem] bg-black flex-col">
        <Navbar qName={quest?.name} />
        <ScanQRDialog
          open={isScanQRDialogOpen}
          setOpen={setScanQRDialogOpen}
          scanFor="assignMission"
          id={missionId}
        />
        <div className="heading flex justify-center items-center text-5xl">
          Missions
        </div>
        <div className="flex justify-center mt-4">
          <Button onClick={endQuest} className="bg-red-600 text-white" variant={"destructive"}>
            End Quest
          </Button>
        </div>
        <main className="flex items-center justify-center p-10">
      {!loading ? (
          teams?.map((team, teamIndex) => (
            <div
          key={team.id}
          className="flex flex-col"
            >
          <div className="w-48 border-b-2 flex items-center justify-center border flex-col text-yellow-400 bg-slate-900">
            {team.name}
            <span className="heading text-2xl">{team.questPoints.toString()}</span>
          </div>

          <div className="flex flex-col mb-3 w-48 h-16 border text-sm items-center justify-center bg-slate-900">
          {/* @ts-ignore */}
          <Button
            onClick={async () => {
              const currentMissionId = team.currentMission!.split(".")[0];
              if (currentMissionId) {
                await updateDoc(doc(getFirestore(app), "quest", "gqa", "missions", currentMissionId), { crnt: { startTime: 0, team: "", level: "" } });
                await updateDoc(doc(getFirestore(app), "quest", "gqa", "teams", team.id), { currentMission: "" });
                await updateDoc(doc(getFirestore(app), "quest", "gqa", "teams", team.id, "missionLog", currentMissionId), { endTime: Timestamp.fromDate(new Date()), status: "exited" });
                toast.toast({ title: "Mission Stopped Successfully.", variant: "default" });
              }
            }}
            className="w-32 h-8 bg-red-600 text-white"
            variant={"outline"}
          >
            Stop Mission
          </Button>
            {team.currentMission != "finish" ? team.currentMission : "Finish"} 
          </div>
          {missions?.map((mission, index) => {
              // @ts-ignore
               if(missionLogs && missionLogs[team.id] && missionLogs[team.id][mission?.id]){
            // @ts-ignore
             if(missionLogs[team.id][mission?.id].status != "" && currentMissionIndex[team.id] < index){
                setCurrentMissionIndex((prev) => ({...prev, [team.id]: index}));
              }
            }
            return <div
            onClick={()=>assignMission(team.id, mission.id)}
              key={`${mission?.id}-${index}`}
              className={cn("w-48 h-16 border cursor-pointer flex text-sm items-center justify-center", getMissionTileColor(team.id, mission?.id || "", index))}
            >
              {mission?.missionTitle}
            </div>
          })}
            </div>
          ))
      ) : (
        <div className="h-full w-full flex items-center justify-center">
          <Loader className="animate-spin" size={30} />
        </div>
      )}
    </main>
      </div>
    )
  );
}
