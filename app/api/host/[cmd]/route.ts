import { NextRequest, NextResponse } from "next/server";
import { Command, QP, Team, User } from "../../../../lib/models";
import { getAuth } from "firebase-admin/auth";
import { getAdmin } from "../../../../lib/fb"; 
import { decodeToken, encodeToken, generateID, QID } from '../../../../lib/util';

const adminAuth = getAuth(getAdmin)


/*
  HOST API [EXTENDED]
    Endpoint: /api/quest/[qid]/host/[cmd]
    Headers : {
      'X-Token' : Firebase IDToken
    }
    Method: POST
*/
export async function POST(req: Request, {params} :{ params:{ cmd: Command['type'] | "generateQP" | "addQP" | "addMission", qid: string }}) {

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


  /*
  CREATE TEAM:
    Endpoint: /api/quest/[qid]/host/createTeam
    Headers : {
      'X-Token' : Firebase IDToken
    }
    Method: POST
    Returns: A JWT Token with 'createTeam' command.
*/
  if(params.cmd == "createTeam"){
    return await createTeam();
  }
  
/*
  ADD QPs TO THE QUEST:
  Endpoint: /api/host/addQP
  Headers : {
    'X-Token' : Firebase IDToken
  }
  Method: POST
  Returns: A JWT Token with 'addQP' command.
*/
  else if(params.cmd == "addQP"){
    const { token, qpName, qp_type, qp_value, mid } = await req.json()

    if(!token || !qpName || !qp_value || !qp_type || !mid) return NextResponse.json({ msg: 'Missing required arguments.' }, { status: 400 });

    try{
      const cmd = decodeToken(token, process.env.ENC_SECRET || "") as Command

      // Check if the given token is a QuestPoint
      if(cmd.type != "awardQP") return NextResponse.json({ msg: 'Given Token is not a QuestPoint QR.' }, { status: 409 });
    
      await QP.create({
        refStr: qpName,
        missionId: mid,
        qpid: cmd.data,
        value: qp_value,
        type: qp_type
      })

      return NextResponse.json({'msg':"Success.", qpid: cmd.data})

    }catch{
      return NextResponse.json(
        { msg: 'Invalid Token.' },
        { status: 403 }
      );
    }
  }
}

async function createTeam() {
  const tid:string = generateID(10)
  // Checks if tid already exists (TIDs must be unique) and recursively call the function again if true 
  if((await Team.findOne({tid})) != null) return createTeam()

  return NextResponse.json(
      { token: encodeToken({
        qid: QID,
        data: tid,
        type: "createTeam"
      }, process.env.ENC_SECRET || ""), tid: tid }
    );
  
}