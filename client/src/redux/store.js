import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice.js'
import cartReducer from './cartSlice.js'
import uiReducer from './uiSlice.js'
import wishlistReducer from './wishlistSlice.js'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
    ui: uiReducer,
  },
})
