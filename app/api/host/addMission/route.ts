import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getAdmin } from "../../../../lib/fb";
import { generateID, QID } from "../../../../lib/util";
import { Mission, Quest, User } from "../../../../lib/models";

const adminAuth = getAuth(getAdmin)

/*
  ADD MISSION
    Endpoint: /api/host/addMission
    Headers : {
      'X-Token' : Firebase IDToken
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

    const { levelTitle, missionTitle, context, hint, type, showInQuest, timeout, availablePoints, maxTeamAllowable } = await req.json()

    if(!missionTitle || !levelTitle || !context) return NextResponse.json({ msg: 'Missing required arguments.' }, { status: 400 });

    const mid = generateID(10)
    const mission = new Mission()

    mission.set({
      qid: QID,
      id: mid,
      maxTeamAllowable: maxTeamAllowable,
      availablePoints: availablePoints,
      missionTitle: missionTitle,
      timeout: timeout,
      showInQuest: (typeof showInQuest == "undefined") ? true : showInQuest
    })
    
    mission.levels.push({ id: "init", next:"end", type: type, input: type=="text"? "text": "qr", title: levelTitle, context: context, hint: hint })
    mission.levels.push({ id: "end", type: "end", })

    mission.save();

    return NextResponse.json({'msg': "Mission Added", 'mid': mid})
}
