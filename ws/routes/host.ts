// QUEST
import type { Server, Socket } from "socket.io";
import { Mission, MissionLog, Quest, Team, User } from "../../lib/models";
import { QID } from "../../lib/util";

export default (server: Server, socket: Socket) => {

  const sendAnnouncement = (message, callback) => {
    if(!(socket.handshake.auth.user.host && socket.handshake.auth.user.host == "gqa")) return callback({status: 403, message: "You are not the host."}); 
    server.emit("quest:announcement", {message: message, type: "info"});
  }

  const createQuest = (qid, callback) => {

    if(!socket.handshake.auth.user || !socket.handshake.auth.user.uid) return callback({status: 403, message: "Unauthenticated."});

    Quest.create( {
      id: qid,
      name: "GrandQuestAuto",
      desc: "A GTA themed techno Treasure Hunt.",
      host: socket.handshake.auth.user.uid,
      teams: [],
      missions: [],
      qToken: "",

      CAN_ASSIGN_ROLES: true,
      TOTAL_ALLOWED_MEMBERS: 4,
      MAX_BONUS: 30,
      status: "inactive",
    }).then((quest) => callback({status: 201, message: "Quest created.", data: quest})
    ).catch((error) => {
      const err = new Error("500");
      err.message = "Internal Error: " + error.message;
      callback(err);
    });
  }

  // MISSION
  const assignMission = async ({mid, tid}, callback) => {
    if(!(socket.handshake.auth.user.host && socket.handshake.auth.user.host == "gqa")) return callback({status: 403, message: "You are not the host."}); 


    const [team, missionLog] = await Promise.all([
      Team.findOne({ id: tid, qid: QID }),
      MissionLog.findOne({ mid: mid, tid: tid, qid: QID })
    ]);

    if(!team) return callback({status: 404, message: "Team not found."});
    if(missionLog) return callback({status: 403, message: "Mission already assigned."});
    if(team.currentMission != "none") return callback({status: 403, message: "Team is already on a mission."});
    
    team.currentMission = mid + ".none";
    
    await Promise.all([
      team.save(),
      MissionLog.create({
        mid: mid,
        level: "none",
        tid: tid,
        qid: QID,
        status: "init",
        startTime: new Date(),
        endTime: null,
        points: 0
      })
    ]);

    socket.to(tid).emit('team:update', {"type": "missionUpdate", "data": team});
    socket.to("host").emit("host:missionUpdate", {tid: tid, mid: mid});
    callback({status: 200, message: "Mission assigned."});
  }

    socket.on("host:create", createQuest);
    socket.on("host:assignMission", assignMission);
    socket.on("host:announcement", sendAnnouncement);


}