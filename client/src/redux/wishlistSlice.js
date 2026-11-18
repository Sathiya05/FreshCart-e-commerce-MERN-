import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  productIds: [],
}

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    toggleWishlist(state, action) {
      const productId = action.payload
      state.productIds = state.productIds.includes(productId)
        ? state.productIds.filter((id) => id !== productId)
        : [productId, ...state.productIds]
    },
    removeFromWishlist(state, action) {
      state.productIds = state.productIds.filter((id) => id !== action.payload)
    },
    clearWishlist(state) {
      state.productIds = []
    },
  },
})

export const { toggleWishlist, removeFromWishlist, clearWishlist } =
  wishlistSlice.actions

export const selectWishlistIds = (state) => state.wishlist.productIds

export const selectIsWishlisted = (productId) => (state) =>
  state.wishlist.productIds.includes(productId)

export default wishlistSlice.reducer
