import { auth, db } from '@/shared/services/firebase';
import { GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const provider = new GoogleAuthProvider();

interface SignInResult {
  user: User;
  isNewUser: boolean;
}

/**
 * Inicia o processo de login com o Google.
 * Verifica se o usuário é novo e cria um documento de perfil básico se necessário.
 * @returns Um objeto contendo as informações do usuário e um booleano indicando se é um novo usuário.
 */
export const signInWithGoogle = async (): Promise<SignInResult> => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Verifica se o usuário já existe no Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    let isNewUser = false;
    if (!userDoc.exists()) {
      // Se o usuário não existe, é um novo usuário.
      // Cria um documento básico para ele.
      isNewUser = true;
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        avatar: user.photoURL,
        createdAt: new Date().toISOString(),
      });
    }

    return { user, isNewUser };
  } catch (error) {
    console.error("Erro durante o login com o Google:", error);
    throw error;
  }
};

/**
 * Realiza o logout do usuário.
 */
export const signOut = (): Promise<void> => {
  return auth.signOut();
};
