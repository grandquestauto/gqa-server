// USER
import type { Server, Socket } from "socket.io";
import { Quest, User } from "../../lib/models";
import { UserInfo } from "@firebase/auth";

export default (io: Server, socket: Socket) => {

  const createUser = (userInfo: UserInfo, callback) => {

    User.findOne({uid: userInfo.uid}).then((user) => {
      if(user) {
        callback({status: 409, message: "User already exists."});
      } else {
        if(!userInfo) {
          callback({status: 400, message: "Missing Required Fields."});
          return;
        }
        User.create({
          _id: userInfo.uid,
          uid: userInfo.uid,
          email: userInfo.email,
          name: userInfo.displayName,
          dp: userInfo.photoURL,
          phno: userInfo.phoneNumber,
          c_quest: "",
          c_team: ""
        }).then((user) => {
          callback({status: 201, message: "User created.", data: user});
        }).catch((error) => {
          const err = new Error("500");
          err.message = "Internal Error: " + error.message;
          
          callback(err);
        });
      }
    }).catch((error) => {
      const err = new Error("500");
      err.message = "Internal Error: " + error.message;
      
      callback(err);
    });
  }

  const getUser = (args: string[], callback) => {
    console.log(args);
      callback(socket.handshake.auth.user);
  }

  socket.on("user:get", getUser);
  socket.on("user:create", createUser);
}