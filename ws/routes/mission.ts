// MISSION
import type { Server, Socket } from "socket.io";
import { Mission, MissionLog, Team } from "../../lib/models";

export default (_io: Server, socket: Socket) => {

  /*
  * Method : "mission:get"
  * Get the current mission assigned to the team
  */
  const getMission = async (callback) => {
    const tid = socket.handshake.auth.user.c_team;

    if(!socket.handshake.auth.user.currentMission) return callback({status: 401, message: "No mission assigned."});
    const [mid, lvlId] =  socket.handshake.auth.user.currentMission.split(".");

    if(mid == "none") return callback({status: 401, message: "No mission assigned."});
    if(lvlId == "end") return callback({status: 401, message: "Mission finished."});

    const [mission, missionLog] = await Promise.all([
      Mission.findOne({id: mid}),
      MissionLog.findOne({tid, mid})
    ]);

    if(!mission) return callback({status: 404, message: "Mission not found."});
    if(!missionLog) return callback({status: 401, message: "Mission not assigned."});

    if(lvlId == "init") return callback({status: 200, message: "Mission found.", data: {...mission, level: null}});

    const level = mission.levels.find(lvl => lvl.id == lvlId);
    if(!level) return callback({status: 404, message: "Level not found."});

    // Deleting sensitive fields
    delete level.value, level.next, level._id;
    missionLog.hints.find(hint => hint.level == lvlId && hint.mid == mid)?.claimed ? null : level.hint = null;

    callback({status: 200, message: "Yes.", data: {...mission, level: level}});
  }

  /*
  * Method : "mission:start"
  * Start the current mission assigned to the team
  */
  const startMission = async (callback) => {
    const tid = socket.handshake.auth.user.c_team;

    if(!socket.handshake.auth.user.currentMission) return callback({status: 401, message: "No mission assigned."});
    const [mid, lvlid] = socket.handshake.auth.user.currentMission.split(".");

    if(lvlid != "none") return callback({status: 401, message: "Mission already started."});

    // Get the Team, Mission
    const [team, mission, missionLog] = await Promise.all ([
        Team.findOne({id: tid}),
        Mission.findOne({id: mid}),
        MissionLog.findOne({tid, mid})
    ]);
    
    // Check if team, mission, missionLog exists
    if(!team) return callback({status: 404, message: "Team not found."});
    if(!mission) return callback({status: 404, message: "Mission not found."});
    if(!missionLog) return callback({status: 401, message: "Mission not assigned."});
    
    if(!mission.showInQuest) return callback({status: 401, message: "Mission not available."});
    if(missionLog?.status != "init") return callback({status: 401, message: "Invalid mission status."});

    // Assiging MissionLog & Team currentMission
    missionLog.status = "started";
    missionLog.startTime = new Date();
    missionLog.level = mission.levels[0].id;

    team.currentMission = mid + "." + mission.levels[0].id;
    socket.handshake.auth.user.currentMission = mid + "." + mission.levels[0].id;

    // Save the changes
    await Promise.all([team.save(), missionLog.save()]);

    //sent mission:update to all team members
    socket.to(tid).emit('team:update', {"type": "missionUpdate", "data": team});

    const levelData= mission.levels[0].toObject()
    delete levelData.value, levelData.next, levelData._id;
    levelData.hint = null;

    return callback({status: 200, message: "Mission started.", data: {...mission, level: levelData}});
}

  /*
  * Method : "mission:exit"
  * Exit the current mission assigned to the team
  */
  const exitMission = async (callback) => {
    const tid = socket.handshake.auth.user.c_team;

    if(!socket.handshake.auth.user.currentMission) return callback({status: 401, message: "No mission assigned."});
    const [mid, lvlid] = socket.handshake.auth.user.currentMission.split(".");

    if(lvlid == "none") return callback({status: 401, message: "Mission not started."});

    // Get the Team, Mission
    const [team, mission, missionLog] = await Promise.all ([
        Team.findOne({id: tid}),
        Mission.findOne({id: mid}),
        MissionLog.findOne({tid, mid})
    ]);
    
    // Check if team, mission, missionLog exists
    if(!team) return callback({status: 404, message: "Team not found."});
    if(!mission) return callback({status: 404, message: "Mission not found."});
    if(!missionLog) return callback({status: 401, message: "Mission not assigned."});
    
    if(missionLog?.status != "started") return callback({status: 401, message: "Invalid mission status."});

    // Assiging MissionLog & Team currentMission
    missionLog.status = "exited";
    missionLog.endTime = new Date();

    team.currentMission = "none";
    socket.handshake.auth.user.currentMission = "none";

    // Save the changes
    await Promise.all([team.save(), missionLog.save()]);

    //sent mission:update to all team members
    socket.to(tid).emit('team:update', {"type": "missionUpdate", "data": team});

    return callback({status: 200, message: "Mission excited."});
  }

  const validateMission = async (value:string, callback) => {
    const tid = socket.handshake.auth.user.c_team;

    if(!socket.handshake.auth.user.currentMission) return callback({status: 401, message: "No mission assigned."});
    const [mid, lvlid] = socket.handshake.auth.user.currentMission.split(".");

    if(lvlid == "none") return callback({status: 401, message: "Mission not started."});
    if(lvlid == "end") return callback({status: 401, message: "Mission finished."});
    if(tid == "") return callback({status: 404, message: "Team not found."});

    // Get the Team, Mission
    const [team, mission, missionLog] = await Promise.all ([
        Team.findOne({id: tid}),
        Mission.findOne({id: mid}),
        MissionLog.findOne({tid, mid})
    ]);
    
    // Check if team, mission, missionLog exists
    if(!team) return callback({status: 404, message: "Team not found."});
    if(!mission) return callback({status: 404, message: "Mission not found."});
    if(!missionLog) return callback({status: 401, message: "Mission not assigned."});
    if(missionLog?.status != "started") return callback({status: 401, message: "Invalid mission status."});

    const level = mission.levels.find(lvl => lvl.id == lvlid);
    if(!level) return callback({status: 404, message: "Level not found."});
    if(level.type != "text") return callback({status: 401, message: "Invalid input type."});

    // !: Answer validation is NOT case sensitive
    if(level.value?.toLowerCase() != value.toLowerCase()) return callback({status: 418 , message: "That's not it. Try again."});

    // Incrementing the level and points
    missionLog.level = level.next;
    missionLog.points += mission.availablePoints;
    team.questPoints += mission.availablePoints;
    team.currentMission = mid + "." + level.next;
    socket.handshake.auth.user.currentMission = mid + "." + level.next;

    // Save the changes
    await Promise.all([team.save(), missionLog.save()]);

    //sent mission:update to all team members
    socket.to(tid).emit('team:update', {"type": "missionUpdate", "data": team});
    socket.to(tid).emit('mission:update', {"type": "missionUpdate", "data": mission});

    return callback({status: 200, message: "Level completed."});
  }

  /*
  * Method : "mission:finish"
  * Finish the current mission assigned to the team
  */
  const finishMission = async (callback) => {
    const tid = socket.handshake.auth.user.c_team;

    if(!socket.handshake.auth.user.currentMission) return callback({status: 401, message: "No mission assigned."});
    const [mid, lvlid] = socket.handshake.auth.user.currentMission.split(".");

    if(lvlid != "end") return callback({status: 401, message: "Mission not finished."});

    // Get the Team, Mission
    const [team, mission, missionLog] = await Promise.all ([
        Team.findOne({id: tid}),
        Mission.findOne({id: mid}),
        MissionLog.findOne({tid, mid})
    ]);
    
    // Check if team, mission, missionLog exists
    if(!team) return callback({status: 404, message: "Team not found."});
    if(!mission) return callback({status: 404, message: "Mission not found."});
    if(!missionLog) return callback({status: 401, message: "Mission not assigned."});
    
    if(missionLog?.status != "started") return callback({status: 401, message: "Invalid mission status."});

    // Assiging MissionLog & Team currentMission
    missionLog.status = "completed";
    missionLog.endTime = new Date();

    team.currentMission = "none";
    socket.handshake.auth.user.currentMission = "none";

    // Save the changes
    await Promise.all([team.save(), missionLog.save()]);

    //sent mission:update to all team members
    socket.to(tid).emit('team:update', {"type": "missionUpdate", "data": team});


    callback({status: 200, message: "Mission finished."});
  }

  /*
  * Method : "mission:getHint"
  * Get the hint for the current mission assigned to the team
  */
  const getHint = async (callback) => {
    const tid = socket.handshake.auth.user.c_team;
    if(!socket.handshake.auth.user.currentMission) return callback({status: 401, message: "No mission assigned."});
    const [mid, lvlid] = socket.handshake.auth.user.currentMission.split(".");

    if(lvlid == "none") return callback({status: 401, message: "Mission not started."});

    // Get the Mission, MissionLog
    const [mission, missionLog, team] = await Promise.all ([
        Mission.findOne({id: mid}, {hints: 0}),
        MissionLog.findOne({tid, mid}),
        Team.findOne({tid: tid})
    ]);
    
    // Check if mission, missionLog exists
    if(!team) return callback({status: 404, message: "Team not found."});
    if(!mission) return callback({status: 404, message: "Mission not found."});
    if(!missionLog) return callback({status: 401, message: "Mission not assigned."});
    
    if(missionLog?.status != "started") return callback({status: 401, message: "Invalid mission status."});

    // Check if hint is already claimed
    const hint = missionLog.hints.find(hint => hint.level == lvlid);
    if(hint?.claimed) return callback({status: 401, message: "Hint already claimed."});

    missionLog.hints.push({level: lvlid, claimed: true, mid: mission.id}); // Claim the hint
    team.questPoints -= 20;
    missionLog.points -= 20;

    await Promise.all([team.save(), missionLog.save()]); // Save the changes

    let levelData= mission.levels.find((lvl) => lvl.id == lvlid)?.toObject();
    if(levelData) delete levelData.value, levelData.next, levelData._id;
    //sent mission:update to all team members
    socket.to(tid).emit(`mission:update`, {"type": "hintUpdated", "data": {...mission, level: levelData}});

    callback({status: 200, message: "Hint Claimed.", data: {...mission, level: levelData}});

  }

  socket.on("mission:get", getMission);
  socket.on("mission:start", startMission);
  socket.on("mission:exit", exitMission);
  socket.on("mission:validate", validateMission);
  socket.on("mission:finish", finishMission);
  socket.on("mission:getHint", getHint);
  
}