import { initializeApp as initAdmin, cert, getApps, getApp } from 'firebase-admin/app';
import "dotenv/config"

export const getAdmin = !getApps().length ? initAdmin({credential: cert(JSON.parse(process.env.CREDS || ""))}) : getApp();
