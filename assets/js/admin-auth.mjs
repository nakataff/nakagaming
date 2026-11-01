import {setPersistence, browserSessionPersistence, signInWithEmailAndPassword, signOut, onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js';
import {auth} from './firebase-client.mjs?v=20261101-news';
import {ADMIN_EMAIL, assertAdmin, safeAdminPath} from './admin-auth-policy.mjs?v=20261101-news';
import {verifyAuthAccess} from './admin-auth-access.mjs?v=20261101-news';
import {firebaseConfig} from './firebase-config.mjs?v=20261101-news';
let persistence;
function prepare() { return persistence ||= setPersistence(auth, browserSessionPersistence); }
export function checkAccess() { return verifyAuthAccess(fetch, firebaseConfig.apiKey); }
export async function currentAdmin() {
  await prepare();
  return new Promise((resolve, reject) => {
    let unsubscribe = () => {};
    unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      try { resolve(assertAdmin(user)); } catch (error) { reject(error); }
    }, reject);
  });
}
export async function login(password) {
  await prepare();
  const credential = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password);
  try { return assertAdmin(credential.user); }
  catch (error) { await signOut(auth); throw error; }
}
export function watchSession(handler) { return onAuthStateChanged(auth, handler); }
export function getCurrentAdmin() { return assertAdmin(auth.currentUser); }
export function logout() { return signOut(auth); }
export function goToLogin(next = window.location.pathname) {
  window.location.replace('/admin/login/?next=' + encodeURIComponent(safeAdminPath(next)));
}
