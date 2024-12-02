"use client";

import { useQuestContext } from "@/components/context/quest";
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
import { toast } from "@/components/ui/use-toast";
import { Level, Mission, Team } from "@/lib/models";

import {
  DocumentData,
  QueryDocumentSnapshot,
  collection,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { Check, ScanLine } from "lucide-react";
import { useEffect, useState } from "react";
import { set } from "react-hook-form";

export default function Home({ params }: { params: { questId: string } }) {
  const [open, setOpen] = useState(false);
  const [levels, setLevels] = useState<{ [key: string]: any }>({});
  const [isScanQRDialogOpen, setScanQRDialogOpen] = useState<boolean>(false);
  const [missionId, setMissionId] = useState<string>("");

  const [teamData, setTeamData] =
    useState<QueryDocumentSnapshot<DocumentData, DocumentData>[]>();

  const q = useQuestContext();
  const user = q.user;
  const quest = q.quest;

  useEffect(() => {
    // get leaderboard data from Firestore based on questPoints
    const q = query(collection(getFirestore(app), "quest", "gqa", "missions"));
    onSnapshot(q, (snap) => {
      setTeamData(snap.docs);
    });
  }, []);
  useEffect(() => {
    const fetchLevels = async () => {
      const levelPromises: any = teamData?.map(async (doccd) => {
        const data = doccd.data();
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
        return { id: doccd.id, level: levelDoc.data() };
      });

      const levelsData = await Promise.all(levelPromises ?? []);
      const levelsMap: { [key: string]: any } = levelsData.reduce(
        (acc, { id, level }) => {
          acc[id] = level;
          return acc;
        },
        {} as { [key: string]: any }
      );

      setLevels(levelsMap);
    };

    fetchLevels();
  }, [teamData]);

  const [formData, setFormData] = useState({
    missionTitle: "",
    levelTitle: "",
    context: "",
    hint: "",
    availablePoints: "",
    timeout: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData({
      ...formData,
      [id]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetch(`/api/${q.quest?.id}/host/addMission`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Token": (await q.user?.getIdToken()) || "",
      },
      body: JSON.stringify(formData),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 403) {
          toast({ title: "Server Error", variant: "destructive" });
          return;
        } else {
          toast({ title: "Mission Added", variant: "default" });
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const handleScanner = (id: any) => {
    setScanQRDialogOpen(true);
    setMissionId(id);
  };

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
        <div className="flex gap-4 w-full justify-end p-10">
          <div className="flex justify-around items-center">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Add Mission</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add Mission</DialogTitle>
                  <DialogDescription>
                    Add the details carefully
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="flex flex-col gap-4">
                      <Label htmlFor="missionTitle" className="text-left">
                        Mission title
                      </Label>
                      <Input
                        id="missionTitle"
                        value={formData.missionTitle}
                        onChange={handleChange}
                        placeholder="Bank Heist"
                        className="col-span-3"
                      />
                    </div>
                    <div className="flex flex-col gap-4">
                      <Label htmlFor="levelTitle" className="text-left">
                        Level title
                      </Label>
                      <Input
                        id="levelTitle"
                        value={formData.levelTitle}
                        onChange={handleChange}
                        placeholder="Part-1"
                        className="col-span-3"
                      />
                    </div>
                    <div className="flex flex-col gap-4">
                      <Label htmlFor="context" className="text-left">
                        Mission Context
                      </Label>
                      <Textarea
                        id="context"
                        value={formData.context}
                        onChange={handleChange}
                        placeholder="blah blah blah"
                        className="col-span-3"
                      />
                    </div>
                    <div className="flex flex-col gap-4">
                      <Label htmlFor="hint" className="text-left">
                        Hint
                      </Label>
                      <Input
                        id="hint"
                        value={formData.hint}
                        onChange={handleChange}
                        placeholder="value"
                        className="col-span-3"
                      />
                    </div>
                    <div className="flex flex-col gap-4">
                      <div className="">
                        <Label htmlFor="availablePoints" className="text-left">
                          Points
                        </Label>
                        <Input
                          id="availablePoints"
                          value={formData.availablePoints}
                          onChange={handleChange}
                          placeholder="867"
                          className="col-span-6"
                        />
                      </div>
                      <div className="">
                        <Label htmlFor="timeout" className="text-left">
                          Duration in minutes
                        </Label>
                        <Input
                          id="timeout"
                          value={formData.timeout}
                          onChange={handleChange}
                          placeholder="7"
                          className="col-span-3"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Save changes</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <main className="flex items-center justify-center p-10">
          <table className="table">
            <thead className="table-header-group">
              <tr className="text-yellow-600">
                <th>No</th>
                <th>Mission Name</th>
                <th>Hint</th>
                <th>Context</th>
                <th>Duration</th>
                <th>QuestPoints</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {teamData?.map((doccd, idx) => {
                const data = doccd.data() as Mission;
                const level = levels[doccd.id] || {};

                return (
                  <tr key={doccd.id} className="table-row">
                    <td>{idx+1}</td>
                    <td>
                      <p>{data.missionTitle}</p>
                      <p>{level.levelTitle}</p>
                    </td>
                    <td>{level.hint}</td>

                    <td>
                      <p>{level.context}</p>
                    </td>
                    <td>
                      <p>{data.timeout.toString()}</p>
                    </td>
                    <td>{data.availablePoints.toString()}</td>
                    <td>
                      {data.crnt?.team == ""
                        ? "No Mission Assigned."
                        : data.crnt?.team}
                    </td>
                    <td>
                      <div className="flex justify-around items-center ">
                        {level?.value ? (
                          <Check />
                        ) : (
                          <ScanLine className="cursor-pointer" onClick={() => handleScanner(data?.id)} />
                        )}
                      </div>
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
