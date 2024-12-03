// QUEST
import type { Server, Socket } from "socket.io";
import { Quest, User } from "../../lib/models";

export default (server: Server, socket: Socket) => {

  const getQuest = (callback) => {

    const qid = socket.handshake.auth.user.c_quest

    if(qid == "") {
      callback({status: 400, message: "User not in any quest."});
      return;
    }

    Quest.findOne({id: qid}, {missions: 0, qToken: 0, host: 0, teams: 0}).then((quest) => {
      if(quest) {
        callback({status: 200, message: "Yes.", data: quest});
      } else {
        callback({status: 404, message: "Quest not found."});
      }
    }).catch((error) => {
      const err = new Error("500");
      err.message = "Internal Error: " + error.message;
      
      callback(err);
    });
  }

  const getAnnouncements = (message, callback) => {
    console.log(message);
    server.emit("announcement", message);
  }

  const exitQuest = (orderId, callback) => {
    // ...
  }

  const createQuest = (qid, callback) => {
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


  socket.on("quest:create", createQuest);
  socket.on("quest:get", getQuest);
  socket.on("quest:exit", exitQuest);
}