import { createSelector, createSlice } from '@reduxjs/toolkit'

const initialState = {
  items: [],
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: {
      reducer(state, action) {
        const { product, quantity } = action.payload
        const existing = state.items.find((item) => item.product.id === product.id)

        if (existing) {
          existing.quantity = Math.min(
            existing.quantity + quantity,
            product.stock || 99,
          )
          return
        }

        state.items.push({
          product,
          quantity: Math.min(quantity, product.stock || 99),
        })
      },
      prepare(product, quantity = 1) {
        return { payload: { product, quantity } }
      },
    },
    updateCartQuantity(state, action) {
      const { productId, quantity } = action.payload
      const item = state.items.find((entry) => entry.product.id === productId)
      if (!item) return
      item.quantity = Math.max(
        1,
        Math.min(Number(quantity) || 1, item.product.stock || 99),
      )
    },
    removeFromCart(state, action) {
      state.items = state.items.filter((item) => item.product.id !== action.payload)
    },
    clearCart(state) {
      state.items = []
    },
  },
})

export const { addToCart, updateCartQuantity, removeFromCart, clearCart } =
  cartSlice.actions

export const selectCartItems = (state) => state.cart.items

export const selectCartCount = createSelector([selectCartItems], (items) =>
  items.reduce((total, item) => total + item.quantity, 0),
)

export const selectCartSubtotal = createSelector([selectCartItems], (items) =>
  items.reduce(
    (total, item) =>
      total + (item.product.discountPrice || item.product.price) * item.quantity,
    0,
  ),
)

export default cartSlice.reducer
