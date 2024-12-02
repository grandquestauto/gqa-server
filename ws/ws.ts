import { Socket, Server } from "socket.io";
import app from "./routes/app";
import mission from "./routes/mission";
import quest from "./routes/quest";
import team from "./routes/team";
import {getAuth} from "firebase-admin/auth"
import { getAdmin } from "../lib/fb";
import { Team, User } from "../lib/models";
import user from "./routes/user";
import "dotenv/config";

const auth = getAuth(getAdmin);
let uid = "";

export default function ws(server: Server) {

  server.on("connection", (socket) => {
    console.log(`${socket.id}-> User connected`);

    app(server, socket);
    mission(server, socket);
    quest(server, socket);
    team(server, socket);
    user(server, socket);
  });

  server.on('disconnect', (socket) => {
    console.log(`${socket.id}-> User disconnected`);
  });

  server.use((socket, next) => {
    const token = socket.handshake.auth.token;

    auth.verifyIdToken(token).then((decodedToken) => {
      uid = decodedToken.uid;

      User.findOne({uid: uid}).then((user) => {
        if(user) {
          // Improper practise to add user to handshake.auth
          socket.handshake.auth.user = user;

          if(user.c_team == "") return next();
          Team.findOne({id: user.c_team}).then((team) => {
            if(team) {
              if(!team.members.find((member) => member.uid == uid)) return next(new Error("403"));
              
              // Improper practise to add team to handshake.auth
              socket.handshake.auth.user.currentMission = team.currentMission;
              socket.join(team.id);
              next();
            }else {
              next(new Error("404"));
            }
          });
        } else {
          User.create({
            uid: uid, 
            dp: decodedToken.picture ? decodedToken.picture : "",
            name: decodedToken.name ? decodedToken.name : "",
            email: decodedToken.email ? decodedToken.email : "",
            phno : decodedToken.phone_number ? decodedToken.phone_number : "",
            c_team : "",
            c_quest: "gqa"
          }).then((user) => {
            socket.handshake.auth.user = user;
            next();
          })
        }
      }).catch((error) => {
        const err = new Error("500");
        err.message = "Internal Error: " + error.message;

        next(err);
      });

    }).catch((error) => {
      const err = new Error("401");
      // @ts-ignore
      err.code = "auth/401";
      err.message = "Unauthorized User.";

      next(err);
    });
  });
}