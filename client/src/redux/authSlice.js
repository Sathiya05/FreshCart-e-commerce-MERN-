import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { setAccessToken } from '../services/api.js'
import {
  getCurrentUser,
  googleSignInAccount,
  loginAccount,
  logoutAccount,
  refreshSession,
  registerAccount,
  updateCurrentUser,
} from '../services/auth.service.js'

const getErrorMessage = (error, fallback) =>
  error.response?.data?.error?.message || error.message || fallback

export const restoreSession = createAsyncThunk(
  'auth/restore',
  async (_, { rejectWithValue }) => {
    try {
      return await getCurrentUser()
    } catch (error) {
      if (error.response?.status === 401) {
        try {
          const refreshed = await refreshSession()
          const token = refreshed?.accessToken
          if (token) setAccessToken(token)
          return refreshed?.user || null
        } catch {
          setAccessToken(null)
          return null
        }
      }
      return rejectWithValue(getErrorMessage(error, 'Could not restore your session.'))
    }
  },
)

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      return await loginAccount(credentials)
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Could not sign in.'))
    }
  },
)

export const googleSignInUser = createAsyncThunk(
  'auth/google',
  async (credential, { rejectWithValue }) => {
    try {
      return await googleSignInAccount(credential)
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Could not sign in with Google.'))
    }
  },
)

export const registerUser = createAsyncThunk(
  'auth/register',
  async (details, { rejectWithValue }) => {
    try {
      return await registerAccount(details)
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Could not create your account.'))
    }
  },
)

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try {
    return await logoutAccount()
  } catch {
    return null
  }
})

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (updates, { rejectWithValue }) => {
    try {
      return await updateCurrentUser(updates)
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Could not update your profile.'))
    }
  },
)

const initialState = {
  user: null,
  status: 'idle',
  initialized: false,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    signOut(state) {
      setAccessToken(null)
      state.user = null
      state.status = 'unauthenticated'
      state.error = null
      // A forced sign-out (expired session or slow restore) must never leave
      // the app stuck on its initial loading screen.
      state.initialized = true
    },
    clearAuthError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        const payload = action.payload
        const user = payload?.user ?? payload
        const token = payload?.accessToken
        if (token) setAccessToken(token)
        state.user = user
        state.status = user ? 'authenticated' : 'unauthenticated'
        state.initialized = true
      })
      .addCase(restoreSession.rejected, (state, action) => {
        setAccessToken(null)
        state.user = null
        state.status = 'unauthenticated'
        state.initialized = true
        state.error = action.payload
      })
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        if (action.payload?.accessToken) setAccessToken(action.payload.accessToken)
        state.user = action.payload.user
        state.status = 'authenticated'
        state.initialized = true
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'unauthenticated'
        state.error = action.payload
      })
      .addCase(googleSignInUser.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(googleSignInUser.fulfilled, (state, action) => {
        if (action.payload?.accessToken) setAccessToken(action.payload.accessToken)
        state.user = action.payload.user
        state.status = 'authenticated'
        state.initialized = true
      })
      .addCase(googleSignInUser.rejected, (state, action) => {
        state.status = 'unauthenticated'
        state.error = action.payload
      })
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        if (action.payload?.accessToken) setAccessToken(action.payload.accessToken)
        state.user = action.payload.user
        state.status = 'authenticated'
        state.initialized = true
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'unauthenticated'
        state.error = action.payload
      })
      .addCase(logoutUser.fulfilled, (state) => {
        setAccessToken(null)
        state.user = null
        state.status = 'unauthenticated'
        state.error = null
      })
      .addCase(updateProfile.pending, (state) => {
        state.error = null
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.error = action.payload
      })
  },
})

export const { signOut, clearAuthError } = authSlice.actions

export const selectCurrentUser = (state) => state.auth.user
export const selectIsAdmin = (state) => state.auth.user?.role === 'admin'
export const selectAuthStatus = (state) => state.auth.status
export const selectAuthInitialized = (state) => state.auth.initialized
export const selectAuthError = (state) => state.auth.error

export default authSlice.reducer
