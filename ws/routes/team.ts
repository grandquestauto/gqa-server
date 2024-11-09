// TEAM
import type { Server, Socket } from "socket.io";

export default (server: Server, socket: Socket) => {
  const getTeam = (orderId, callback) => {
    // ...
  }

  const assignRoles = (orderId, callback) => {
    // ...
  }

  const addMembers = (orderId, callback) => {
    // ...
  }

  const createTeam = (args: string[], callback) => {

    if(socket.handshake.auth.user.c_team != "") {
      return callback({ status: 409, message: "User already joined a team." });
    }
    
  }

  socket.on("team:get", getTeam);
  socket.on("team:assignRole", assignRoles);
  socket.on("team:addMember", addMembers);
}