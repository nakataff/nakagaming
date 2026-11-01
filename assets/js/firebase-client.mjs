import {initializeApp, getApps} from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js';
import {getAuth} from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js';
import {getDatabase} from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js';
import {firebaseConfig} from './firebase-config.mjs?v=20261101-news';
const NAME = 'naka-gaming-admin';
export const app = getApps().find((item) => item.name === NAME) || initializeApp(firebaseConfig, NAME);
export const auth = getAuth(app);
export const database = getDatabase(app);
