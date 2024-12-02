// QUEST
import type { Server, Socket } from "socket.io";
import { Quest, User } from "../../lib/models";

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
  const assignMission = (mission, callback) => {
    // ...
  }


  // TEAM
    const createTeam = (team, callback) => {
        // ...
    }


    socket.on("host:create", createQuest);
    socket.on("host:announcement", sendAnnouncement);


}