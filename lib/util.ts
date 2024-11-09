import crypto from 'node:crypto'
import type { Command } from "./models";
import { Buffer } from "node:buffer";


export function encodeToken({qid, type, data}: Command, evntSecretKey: string) {
    const c = crypto.createCipheriv('aes-192-cbc', Buffer.from(evntSecretKey), Buffer.alloc(16, 0))
    return qid + "." + c.update(JSON.stringify([type, data]),'utf-8','base64').toString() + c.final('base64').toString();
  }
  
  export function decodeToken(token: string, evntSecretKey: string) {
    const [qid, cData] = token.split(".")
    const d = crypto.createDecipheriv('aes-192-cbc', Buffer.from(evntSecretKey), Buffer.alloc(16, 0))
    const [type, data] = JSON.parse(d.update(cData, 'base64', 'utf-8').toString() + d.final('utf-8').toString())
    return { qid, type, data }
  }
  
