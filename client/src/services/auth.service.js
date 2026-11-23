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

export const getCurrentUser = () => api.get('/auth/me').then(getData)

export const updateCurrentUser = (payload) =>
  api.patch('/auth/me', payload).then(getData)
