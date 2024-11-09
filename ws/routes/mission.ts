// MISSION
import type { Server, Socket } from "socket.io";

export default (_io: Server, socket: Socket) => {
  const getMission = (orderId, callback) => {
    // ...
  }

  const startMission = (orderId, callback) => {
    // ...
  }

  const exitMission = (orderId, callback) => {
    // ...
  }

  const validateMission = (orderId, callback) => {
    // ...
  }

  const finishMission = (orderId, callback) => {
    // ...
  }

  const getHint = (orderId, callback) => {
    // ...
  }

  socket.on("mission:get", getMission);
  socket.on("mission:start", startMission);
  socket.on("mission:exit", exitMission);
  socket.on("mission:validate", validateMission);
  socket.on("mission:finish", finishMission);
  socket.on("mission:getHint", getHint);
  
}