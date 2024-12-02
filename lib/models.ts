import mongoose from 'mongoose';
import mission from '../ws/routes/mission';
import { unique } from 'next/dist/build/utils';
const { Schema, model } = mongoose;


const userSchema = new Schema({
    phno: String,
    uid: String,
    name: String,
    email: String,
    dp: String,
    c_quest: String,
    c_team: String,
    fcmToken: String,
    host: {
        type: String,
        required: false
    },
    boss: Boolean
});

userSchema.index({ uid: 1 }, { unique: true });
export const User = model('User', userSchema);


const levelSchema = new Schema({
    id: String,
    type: {
        type: String,
        enum: ['text', 'video', 'audio', 'image', 'location', 'end'],
        default: 'text'
    },
    input: {
        type: String,
        enum: ['none', 'text', 'qr'],
        default: 'none'
    },
    value: String,
    context: String,
    title: String,
    hint: String,
    next: String
});

const missionSchema = new Schema({
    id: {
        type: String,
        required: true
    },
    missionTitle: String,
    qid: {
        type: String,
        requied: true
    },
    showInQuest: Boolean,
    availablePoints: {
        type: Number,
        default: 0,
        required: true
    },
    timeout: Number,
    maxTeamAllowable: {
        type: Number,
        default: 1
    },
    levels: {
        type: [levelSchema],
        default: []
    }
});
missionSchema.index({ id: 1 }, { unique: true });

missionSchema.methods.toJSON = function () {
    const mission = this.toObject();
    delete mission.levels;
    mission.level = null;
    return mission;
}

export const Mission = model('Mission', missionSchema);

const playerSchema = new Schema({
    uid: String,
    name: String,
    dp: String,
    role: {
        type: String,
        enum: ['boss', 'shadow', 'nomad', 'thug', 'spectre', 'unassigned'],
        default: 'unassigned'
    }
});
playerSchema.index({ uid: 1 }, { unique: true });


const hintSchema = {
    mid: String,
    level: String,
    claimed: Boolean
}
const missionLogSchema = new Schema({
    mid: String,
    tid: String,
    startTime: Date,
    endTime: Date,
    level: String,
    addedTime: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['completed', 'timeout', 'exited', 'init', 'started'],
        default: 'init'
    },
    points: {
        type: Number,
        default: 0
    },
    hints: {
        type: [hintSchema],
        default: []
    }
});

// missionLogSchema.index({ teamId: 1, missionId: 1 }, { unique: true });
export const MissionLog = model('MissionLog', missionLogSchema);

const teamSchema = new Schema({
    id: String,
    name: {
        type: String,
        default: ''
    },
    lead: String,
    questPoints: {
        required: true,
        type: Number,
        default: 0
    },
    currentMission: String,
    videoLink: String,
    members: [playerSchema]
});

teamSchema.index({ id: 1 }, { unique: true });
export const Team = model('Team', teamSchema);


const questSchema = new Schema({
    id: String,
    name: String,
    desc: String,
    host: String,
    img: String,
    status: {
        type: String,
        enum: ['inactive', 'active', 'completed'],
        default: 'inactive'
    },
    startTime: Date,
    endTime: Date,

    TOTAL_ALLOWED_MEMBERS: {
        type: Number,
        default: 4
    },
    CAN_ASSIGN_ROLES: {
        type: Boolean,
        default: true
    },
    MAX_BONUS: {
        type: Number,
        default: 30
    },

    qToken: String,
});

questSchema.index({ id: 1 }, { unique: true });
export const Quest = model('Quest', questSchema);

const qpSchema = new Schema({
    missionId: String,
    qpid: String,
    value: Number,
    type: {
        type: String,
        enum: ['quest', 'bonus'],
        default: 'quest'
    },
    refStr :String,
});

qpSchema.index({ qpid: 1 }, { unique: true });
export const QP = model('QuestPoints', qpSchema);

/*
    Data Interface for `Command Messages`
*/
export interface Command {
    type: "createTeam" | "joinTeam" | "awardQP" ;
    qid: string;
    data: string;
}

export interface Player {
    uid:string;
    name:string;
    dp:string;
    role : 'boss' | 'shadow' | 'nomad' | 'thug' | 'unassigned'
}

export interface QuestPoints {
    name?: string;
    qpid: string;
    value: number;
    type: 'quest' | 'bonus';
    tm?: string | number
}
