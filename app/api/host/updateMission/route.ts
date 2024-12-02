import { NextRequest, NextResponse } from "next/server";
import { Mission, User } from "../../../../lib/models";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getAdmin } from "../../../../lib/fb";
import { generateID } from "../../../../lib/util";
import { QID } from "../../../../lib/util";


const adminAuth = getAuth(getAdmin)


/*
  UPDATE MISSION:
  Endpoint: /api/quest/[qid]/host/updateMission
  Headers : {
    'X-Token' : Firebase IDToken
    'X-MID': Mission ID
  }
  Method: POST
*/
export async function POST(req: Request) {

  const token = req.headers.get("X-Token")
  let decodedToken;

  if (!token) return NextResponse.json(
    { msg: 'Missing required arguments.' },
    { status: 400 }
  );
  
  try{
    decodedToken = await adminAuth.verifyIdToken(token)
  }catch{
    return NextResponse.json(
      { msg: "Unauthenticated: Invalid IDToken." },
      { status: 401 }
    )
  }

  await User.findOne({ uid: decodedToken.uid }).then((user) => {
    if (!user) return NextResponse.json(
      { msg: 'User not found.' },
      { status: 404 }
    );
    if (!user.host || user.host != QID ) return NextResponse.json(
      { msg: 'Unauthorized.' },
      { status: 401 }
    );
  });

    const { mid, levelTitle, missionTitle, context, hint, type, showInQuest, timeout, availablePoints, maxTeamAllowable } = await req.json()

    if(!mid ) return NextResponse.json({ msg: 'Missing required arguments.' }, { status: 400 });

    const mission = await Mission.findOne({ qid: QID, id: mid })
    if(!mission) return NextResponse.json({ msg: 'Mission not found.' }, { status: 404 });

    mission.updateOne({ $set: { qid: QID, id: mid, maxTeamAllowable, availablePoints, missionTitle, timeout, showInQuest: (typeof showInQuest == "undefined") ? true : showInQuest }})
    mission.levels.find(l => l.id == "init")?.updateOne({ $set: { type, input: type=="text"? "text": "qr", title: levelTitle, context, hint }})
    mission.save();

    return NextResponse.json({'msg': "Mission Added", 'mid': mid})
}

