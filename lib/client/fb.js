// 管理者ログイン用(門弟アプリと同じFirebase)。生徒は使わないので、必要な時だけ読み込む
const CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyArfZ_vCwOTugIibk1N5BakUxUqWohKjII',
  authDomain: 'ksvox-montei.firebaseapp.com',
  projectId: 'ksvox-montei',
};

let cache = null;
async function load() {
  if (!cache) {
    const [{ initializeApp, getApps }, authMod] = await Promise.all([import('firebase/app'), import('firebase/auth')]);
    if (!getApps().length) initializeApp(CONFIG);
    cache = { auth: authMod.getAuth(), mod: authMod };
  }
  return cache;
}

// ログイン中の管理者がいれば、その証明(IDトークン)を返す
export async function currentToken() {
  try {
    const { auth, mod } = await load();
    const user = await new Promise((res) => {
      const timer = setTimeout(() => res(null), 3000);
      const un = mod.onAuthStateChanged(auth, (u) => {
        clearTimeout(timer);
        un();
        res(u);
      });
    });
    return user ? await user.getIdToken() : null;
  } catch {
    return null;
  }
}

export async function login(email, password) {
  const { auth, mod } = await load();
  const cred = await mod.signInWithEmailAndPassword(auth, email, password);
  return cred.user.getIdToken();
}
