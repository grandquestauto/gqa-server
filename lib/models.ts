import mongoose from 'mongoose';
import mission from '../ws/routes/mission';
import { unique } from 'next/dist/build/utils';
const { Schema, model } = mongoose;


export type User =  {
    phno: string
    uid: string
    name: string
    email: string
    dp: string
    c_quest: string
    c_team: string
    token?: string
    fcmToken?: string
    boss?: boolean
}


const userSchema = new Schema({
    phno: String,
    uid: String,
    name: String,
    email: String,
    dp: String,
    c_quest: String,
    c_team: String,
    fcmToken: String,
    boss: Boolean
});

userSchema.index({ uid: 1 }, { unique: true });
export const User = model('User', userSchema);

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
    availablePoints: Number,
    timeout: Number,
    maxTeamAllowable: {
        type: Number,
        default: 1
    },
    crnt: {
        team: String,
        level: String,
        startTime: Date
    },
    level: Schema.Types.Mixed
});
missionSchema.index({ id: 1 }, { unique: true });

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

const missionLogSchema = new Schema({
    missionId: String,
    startTime: Date,
    endTime: Date,
    level: String,
    addedTime: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['completed', 'timeout', 'exited', 'init'],
        default: 'init'
    },
    points: {
        type: Number,
        default: 0
    },
    hints: [String]
});


const teamSchema = new Schema({
    id: String,
    name: {
        type: String,
        default: ''
    },
    lead: String,
    questPoints: Number,
    currentMission: String,
    videoLink: String,

    missionLog: {
        type: [missionLogSchema],
        default: [],
        unique: false,
        required: false
    },
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
/*
    Data Type for `QuestTask`
*/
export type Mission = {
    id: string
    missionTitle: string
    showInQuest: boolean

    availablePoints: number
    timeout: number
    maxTeamAllowable?: number

    crnt?: {
        team?: string
        level?: string
        startTime?: Date;
    }
    level?: Level | null
}

export type Level = {
    id: string
    type: "text" | "video" | "audio" | "image" | "location" | "end"
    input?: "none" | "text"
    usedHint?: boolean
    value?: string

    context?: string
    title?: string
    hint?: string
    next?: string
}

/*
    Data Type for `Team`
*/
export type Team = {
    id: string
    name?: string
    lead: string
    msId?: string
    members?: [Player]

    questPoints: number
    currentMission?: string
    videoLink?: string
    missionLog?: {
        [mid: string]: {
            toMillis(): unknown;
            endTime: Date
            level: string
            startTime: Date
            status: "completed" | "timeout" | "exited" | "init"
            points?: number
        }
    }
}
