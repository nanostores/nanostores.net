import { atom, computed } from 'nanostores'
type Session = { name: string } | null

// #region show
export const $session = atom<Session>(null)
export const $signedIn = computed($session, (session) => !!session)
export async function signOut() {
  await api.signOut()
  $session.set(null)
}
// #endregion
