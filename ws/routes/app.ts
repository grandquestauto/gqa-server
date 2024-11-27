// APP
import type { Server, Socket } from "socket.io";
import { decodeToken } from "../../lib/util";
import process from "node:process";
import { QP, Team, User } from "../../lib/models";
import team from "./team";

export default (_io: Server, socket: Socket) => {
  const scan = async (token: string, callback) => {
    console.log(token);

    try { 
      const cmd = decodeToken(token, process.env.ENC_SECRET || "")
      
      const user = socket.handshake.auth.user;
      const quest = socket.handshake.auth.quest;
      
      
      if(cmd.type == 'createTeam'){
        console.log(user.c_team);
        if(user.c_team != "") { callback({ status: 404, message: "User already in a team" }); return; }
        
        try{
          // Creating a Team
          const team = new Team({ 
            id: cmd.data,
            lead: user.uid});

            team.members.push({uid: user.uid, role: "boss", name: user.name, dp: user.dp});

            await team.save();
        } catch(err) {
          // Check if team already exists
            console.log(err);
            if(err.code == 11000) { callback({ status: 409, msg: "Team already exists" }); return; }
            callback({ status: 500, msg: "Error creating team" });
            return;
        } 

          user.c_team = cmd.data;
          user.c_quest = "gqa";
          user.boss = true;
          user.save();

          callback({
            status: 200,
            type: "createTeam",
            msg: "You have successfully created a team.",
            data:{
              tid: cmd.data
            }
          });

      } else if(cmd.type == "joinTeam"){

        if(user.c_team != "") { callback({ status: 404, message: "User already in a team" }); return; }
        
        try{
          const team = await Team.findOne({ id: cmd.data });
          if(team == null) { callback({ status: 404, message: "Team not found" }); return; }

          if(team.members.length >= 5) { callback({ status: 409, message: "Team is full" }); return; }
          
          team.members.push({uid: user.uid, name: user.name, dp: user.dp});
          await team.save();

          socket.emit(`${team.id}:update`, { status: 200, type:"newMember", data: team });
        }catch(err) {
          console.log(err);
          callback({ status: 500, message: "Error joining team" });
          return;
        }

        user.c_team = cmd.data;
        user.c_quest = "gqa";
        user.save();

        callback({
          status: 200,
          type: "joinTeam",
          msg: "You have successfully joined a team.",
          data:{
            tid: cmd.data
          }
        });
          
      } else if(cmd.type =='awardQP'){
          const qp = await QP.findOne({ _id: cmd.data });
          if(qp == null) { callback({ status: 404, message: "QP not found" }); return; }

          
      
      }
      
      } catch(err)  {
        console.log(err);
        callback({ status: 500, message: "Error processing command" });
    }
  }

  const phone = (orderId: any, callback: any) => {
    // ...
  }

  const map = (orderId: any, callback: any) => {
    // ...
  }

  socket.on("app:scan", scan);
  socket.on("app:phone", phone);
  socket.on("app:map", map);
}