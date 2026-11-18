import { createSlice } from '@reduxjs/toolkit'

/** Demo-only auth state. Real JWT auth is implemented in Phase 3. */
const initialState = {
  user: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    signInDemo(state, action) {
      state.user = {
        id: action.payload.id || 'demo-user',
        name: action.payload.name || 'FreshCart Shopper',
        email: action.payload.email || 'shopper@freshcart.demo',
        role: action.payload.role || 'customer',
        isDemo: true,
      }
    },
    signOut(state) {
      state.user = null
    },
  },
})

export const { signInDemo, signOut } = authSlice.actions

export const selectCurrentUser = (state) => state.auth.user
export const selectIsAdmin = (state) => state.auth.user?.role === 'admin'

export default authSlice.reducer
