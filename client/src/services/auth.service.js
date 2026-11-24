import api from './api.js'

const getData = (response) => response.data.data

export const registerAccount = (payload) =>
  api.post('/auth/register', payload).then(getData)

export const loginAccount = (payload) =>
  api.post('/auth/login', payload).then(getData)

export const getGoogleAuthConfig = () =>
  api.get('/auth/google/config').then(getData)

export const googleSignInAccount = (credential) =>
  api.post('/auth/google', { credential }).then(getData)

export const logoutAccount = () => api.post('/auth/logout').then(getData)

export const refreshSession = () => api.post('/auth/refresh').then(getData)

// A 401 here simply means "no session yet". restoreSession handles it quietly;
// do not let the interceptor turn a normal first visit into a "session expired"
// toast by attempting a refresh first.
export const getCurrentUser = () => api.get('/auth/me', { skipAuthRefresh: true }).then(getData)

export const updateCurrentUser = (payload) =>
  api.patch('/auth/me', payload).then(getData)
