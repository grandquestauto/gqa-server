"use client";

import Loading from "@/app/loading";
import NotFound from "@/app/not-found";
import { useQuestContext } from "@/components/context/quest";
import { app } from "@/components/fb/config";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Navbar } from "@/components/ui/navbar";
import { genericConverter, QuestMetadata } from "@/lib/models";
import { User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getFirestore,
  query,
  where,
} from "firebase/firestore";
import { url } from "inspector";
import { useEffect, useState } from "react";
import { Pixelify_Sans } from "next/font/google";
import { Separator } from "@/components/ui/separator";
import { ShowQRDialog } from "@/components/dialog/showQR";
import { ShowCreateTeamDialog } from "@/components/dialog/createTeam";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { title } from "process";

const font = Pixelify_Sans({ subsets: ["latin"], weight: ["400"] });

export default function Home({ params }: { params: { questId: string } }) {
  const [open, setOpen] = useState(false);
  const qid = params.questId;
  const q = useQuestContext();
  const user = q.user;
  const quest = q.quest;

  useEffect(() => {
    console.log(user?.getIdToken());
  }, []);

  const cards = [
    {
      title: "Create Team",
      description: "Create a new team to particiapte in Grand Quest Auto",
      img: "/img/create_team.png",
      onClick: () => setOpen(true),
    },
    {
      title: "Missions",
      description: "Manage and list the entire missions in the quest",
      img: "/img/mission.png",
      onClick: () => {
        location.href = "/host/missions";
      },
    },
    {
      title: "Leaderboard",
      description: "See the real time points of each team in the quest",
      img: "/img/leaderboard.png",
      onClick: () => {
        location.href = "/host/leaderboard";
      },
    },
    {
      title: "Where is the Team?",
      description: "Find the realtime location each team in the quest",
      img: "/img/location.png",
      onClick: () => {
        location.href = "/host/stats";
      },
    },
    {
      title: "Realtime Stream",
      description: "Watch the realtime videos of each team in the quest",
      img: "/img/stream.png",
      onClick: () => {
        location.href = "/host/stream";
      },
    },
  ];
  return (
    quest && (
      <div className="flex w-full  flex-col bg-gray-900">
        <ShowCreateTeamDialog open={open} setOpen={setOpen} />
        <Navbar qName={quest?.name} />
        <main className="flex flex-col items-center justify-center">
          <>
            <Card className="w-full m-4">
              <CardHeader
                style={{
                  background: `url("/img/quest_bg.jpg")`,
                }}
                className="flex-row justify-between"
              >
                <CardTitle className={`${font.className} text-xl text-white`}>
                  {" "}
                  {quest.name}{" "}
                </CardTitle>
                {quest.active ? (
                  <div
                    className={`${font.className} text-black bg-white rounded-md pl-2 pr-2 flex items-center gap-2`}
                  >
                    {" "}
                    <span className="text-green-600 text-2xl">●</span> Live
                  </div>
                ) : (
                  <div
                    className={`${font.className} text-black bg-white rounded-md pl-2 pr-2 flex items-center gap-2`}
                  >
                    {" "}
                    <span className="text-red-600 text-2xl">●</span> Inactive
                  </div>
                )}
              </CardHeader>
              <CardContent className="mt-3">
                <Card className="text-slate-400">
                  <span className="p-4">Description</span>
                  <Separator orientation="horizontal" />
                  <div className="p-3">{quest.desc}</div>
                </Card>
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5 ">
              {cards.map((card, i) => (
                <div key={i}  className="w-[20rem] h-[22rem] rounded-md border bg-transparent hover:scale-105">
                  <div
                    className="cursor-pointer flex flex-col items-center py-2 "
                    onClick={() => card.onClick()}
                  >
                    <Image
                      src={card.img}
                      alt=""
                      width={300}
                      height={300}
                      className="rounded-lg"
                    />
                    <h1 className="title text-3xl mt-5">{card.title}</h1>
                    <p className="text-center text-sm px-5 py-3">
                      {card.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        </main>
      </div>
    )
  );
}
