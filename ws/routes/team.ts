// TEAM
import type { Server, Socket } from "socket.io";
import { Team, User } from "../../lib/models";
import { encodeToken } from "../../lib/util";

export default (server: Server, socket: Socket) => {
  const getTeam = (callback) => {
    const tid = socket.handshake.auth.user.c_team;

    if(tid == "") {
      return callback({ status: 404, message: "User not in a team." });
    }

    Team.findOne({id: tid}).then((team) => {
      if(team) {
        return callback({ status: 200, message: "Yes.", data: team });
      } else {
        return callback({ status: 404, message: "Team not found." });
      }
    }).catch((error) => {
      const err = new Error("500");
      err.message = "Internal Error: " + error.message;
      return callback(err);
    });

  }

  const assignRoles = (orderId, callback) => {
    // ...
  }

  const addMembers = (callback) => {
    const user = socket.handshake.auth.user as User;

    if(!user.boss) return callback({ status: 403, message: "You are not the team lead." });
    if(user.c_team == "") return callback({ status: 404, message: "User not in a team." });
    
    if(!process.env.ENC_SECRET) return callback({ status: 500, message: "Internal Error." }); 

    callback({ status: 200, message: "Yes.", token: encodeToken({ qid: user.c_quest, type: "joinTeam", data: user.c_team }, process.env.ENC_SECRET) });
  }

  const createTeam = (args: string[], callback) => {

    if(socket.handshake.auth.user.c_team != "") {
      return callback({ status: 409, message: "User already joined a team." });
    }
    
  }


  const updateTeam = ({name}, callback) => {
    const user = socket.handshake.auth.user as User;

    if(!user.boss) return callback({ status: 403, message: "You are not the team lead." });
    if(user.c_team == "") return callback({ status: 404, message: "User not in a team." });


    Team.findOneAndUpdate({id: user.c_team}, { name: name }).then((team) => {
      if(team) {
        return callback({ status: 200, message: "Team updated." });
      } else {
        return callback({ status: 404, message: "Team not found." });
      }
    }).catch((error) => {
      const err = new Error("500");
      err.message = "Internal Error: " + error.message;
      return callback(err);
    });
  }

  socket.on("team:get", getTeam);
  socket.on("team:update", updateTeam);
  socket.on("team:assignRole", assignRoles);
  socket.on("team:addMember", addMembers);
}