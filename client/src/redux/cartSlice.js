import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit'
import { selectCurrentUser } from './authSlice.js'
import { pushToast } from './uiSlice.js'
import * as commerce from '../services/commerce.service.js'

const initialState = {
  items: [],
  status: 'idle',
  error: null,
}

const applyCart = (state, action) => {
  state.items = action.payload.items || []
  state.status = 'succeeded'
  state.error = null
}

export const fetchCart = createAsyncThunk('cart/fetch', () => commerce.getCart())

export const addCartItemAsync = createAsyncThunk('cart/addItem', (payload) =>
  commerce.addCartItem(payload.productId, payload.quantity),
)

export const updateCartItemAsync = createAsyncThunk('cart/updateItem', (payload) =>
  commerce.updateCartItem(payload.productId, payload.quantity),
)

export const removeCartItemAsync = createAsyncThunk('cart/removeItem', (productId) =>
  commerce.removeCartItem(productId),
)

export const clearCartAsync = createAsyncThunk('cart/clear', () =>
  commerce.clearCartItems(),
)

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCart(state, action) {
      applyCart(state, { payload: action.payload })
    },
    addToCartLocal: {
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
    updateCartQuantityLocal(state, action) {
      const { productId, quantity } = action.payload
      const item = state.items.find((entry) => entry.product.id === productId)
      if (!item) return
      item.quantity = Math.max(
        1,
        Math.min(Number(quantity) || 1, item.product.stock || 99),
      )
    },
    removeFromCartLocal(state, action) {
      state.items = state.items.filter(
        (item) => item.product.id !== action.payload,
      )
    },
    clearCartLocal(state) {
      state.items = []
    },
  },
  extraReducers: (builder) => {
    for (const thunk of [
      fetchCart,
      addCartItemAsync,
      updateCartItemAsync,
      removeCartItemAsync,
      clearCartAsync,
    ]) {
      builder
        .addCase(thunk.pending, (state) => {
          state.status = 'loading'
          state.error = null
        })
        .addCase(thunk.fulfilled, applyCart)
        .addCase(thunk.rejected, (state, action) => {
          state.status = 'failed'
          state.error = action.error.message || 'Could not update your cart.'
        })
    }
  },
})

export const {
  setCart,
  addToCartLocal,
  updateCartQuantityLocal,
  removeFromCartLocal,
  clearCartLocal,
} = cartSlice.actions

const isCustomer = (state) => {
  const user = selectCurrentUser(state)
  return Boolean(user && user.role === 'customer')
}

const notifyCartError = (dispatch, error) => {
  dispatch(
    pushToast({
      type: 'error',
      title: 'Cart update failed',
      message: error?.message || 'Please try again.',
    }),
  )
}

export const addToCart = (product, quantity = 1) => async (dispatch, getState) => {
  try {
    if (!isCustomer(getState())) {
      return dispatch(addToCartLocal(product, quantity))
    }

    return await dispatch(
      addCartItemAsync({ productId: product.id, quantity }),
    ).unwrap()
  } catch (error) {
    notifyCartError(dispatch, error)
    return null
  }
}

export const updateCartQuantity = (payload) => async (dispatch, getState) => {
  try {
    if (!isCustomer(getState())) {
      return dispatch(updateCartQuantityLocal(payload))
    }

    return await dispatch(updateCartItemAsync(payload)).unwrap()
  } catch (error) {
    notifyCartError(dispatch, error)
    return null
  }
}

export const removeFromCart = (productId) => async (dispatch, getState) => {
  try {
    if (!isCustomer(getState())) {
      return dispatch(removeFromCartLocal(productId))
    }

    return await dispatch(removeCartItemAsync(productId)).unwrap()
  } catch (error) {
    notifyCartError(dispatch, error)
    return null
  }
}

export const clearCart = () => async (dispatch, getState) => {
  try {
    if (!isCustomer(getState())) {
      return dispatch(clearCartLocal())
    }

    return await dispatch(clearCartAsync()).unwrap()
  } catch (error) {
    notifyCartError(dispatch, error)
    return null
  }
}

export const syncGuestCart = () => async (dispatch, getState) => {
  try {
    if (!isCustomer(getState())) return

    const guestItems = [...getState().cart.items]

    for (const item of guestItems) {
      if (item.product?.id) {
        await commerce.addCartItem(item.product.id, item.quantity)
      }
    }
    const cart = await commerce.getCart()
    dispatch(setCart(cart))
  } catch (error) {
    notifyCartError(dispatch, error)
  }
}

export const selectCartItems = (state) => state.cart.items
export const selectCartStatus = (state) => state.cart.status
export const selectCartError = (state) => state.cart.error

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
