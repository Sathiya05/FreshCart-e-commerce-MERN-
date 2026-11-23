import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit'
import { logoutUser, selectCurrentUser, signOut } from './authSlice.js'
import { pushToast } from './uiSlice.js'
import * as commerce from '../services/commerce.service.js'
import { getDeliveryFee } from '../utils/commerce.js'

export const AUTH_REQUIRED = 'AUTH_REQUIRED'

const initialState = {
  items: [],
  summary: null,
  status: 'idle',
  error: null,
}

const computeSubtotal = (items = []) =>
  items.reduce(
    (total, item) =>
      total + (item.product?.discountPrice || item.product?.price || 0) * item.quantity,
    0,
  )

const applyCart = (state, action) => {
  state.items = action.payload.items || []
  const subtotal =
    action.payload.subtotal !== undefined
      ? Number(action.payload.subtotal)
      : computeSubtotal(state.items)
  const deliveryFee =
    action.payload.deliveryFee !== undefined
      ? Number(action.payload.deliveryFee)
      : getDeliveryFee(subtotal)
  state.summary = {
    subtotal,
    deliveryFee,
    totalAmount:
      action.payload.totalAmount !== undefined
        ? Number(action.payload.totalAmount)
        : subtotal + deliveryFee,
  }
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
    clearCartLocal(state) {
      state.items = []
      state.summary = null
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

    // A cart belongs to the signed-in customer. Never leave one user's cart in
    // memory after they sign out.
    builder
      .addCase(logoutUser.fulfilled, () => initialState)
      .addCase(signOut, () => initialState)
  },
})

export const { setCart, clearCartLocal } = cartSlice.actions

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

const requireLogin = (dispatch) => {
  dispatch(
    pushToast({
      type: 'info',
      title: 'Sign in to continue',
      message: 'Please sign in to add items, save your cart and place an order.',
    }),
  )
  return AUTH_REQUIRED
}

export const addToCart = (product, quantity = 1) => async (dispatch, getState) => {
  if (!isCustomer(getState())) return requireLogin(dispatch)

  try {
    return await dispatch(
      addCartItemAsync({ productId: product.id, quantity }),
    ).unwrap()
  } catch (error) {
    notifyCartError(dispatch, error)
    return null
  }
}

export const updateCartQuantity = (payload) => async (dispatch, getState) => {
  if (!isCustomer(getState())) return requireLogin(dispatch)

  try {
    return await dispatch(updateCartItemAsync(payload)).unwrap()
  } catch (error) {
    notifyCartError(dispatch, error)
    return null
  }
}

export const removeFromCart = (productId) => async (dispatch, getState) => {
  if (!isCustomer(getState())) return requireLogin(dispatch)

  try {
    return await dispatch(removeCartItemAsync(productId)).unwrap()
  } catch (error) {
    notifyCartError(dispatch, error)
    return null
  }
}

export const clearCart = () => async (dispatch, getState) => {
  if (!isCustomer(getState())) return requireLogin(dispatch)

  try {
    return await dispatch(clearCartAsync()).unwrap()
  } catch (error) {
    notifyCartError(dispatch, error)
    return null
  }
}

/** MongoDB is the single source of truth for a signed-in customer's cart. */
export const fetchCustomerCart = () => async (dispatch, getState) => {
  if (!isCustomer(getState())) {
    dispatch(clearCartLocal())
    return null
  }

  try {
    const cart = await commerce.getCart()
    dispatch(setCart(cart))
    return cart
  } catch (error) {
    notifyCartError(dispatch, error)
    return null
  }
}

export const selectCartItems = (state) => state.cart.items
export const selectCartSummary = (state) => state.cart.summary
export const selectCartStatus = (state) => state.cart.status
export const selectCartError = (state) => state.cart.error

export const selectCartCount = createSelector([selectCartItems], (items) =>
  items.reduce((total, item) => total + item.quantity, 0),
)

export const selectCartSubtotal = createSelector(
  [selectCartItems, selectCartSummary],
  (items, summary) =>
    summary?.subtotal !== undefined && summary?.subtotal !== null
      ? Number(summary.subtotal)
      : computeSubtotal(items),
)

export const selectCartDeliveryFee = createSelector(
  [selectCartSubtotal, selectCartSummary],
  (subtotal, summary) =>
    summary?.deliveryFee !== undefined && summary?.deliveryFee !== null
      ? Number(summary.deliveryFee)
      : getDeliveryFee(subtotal),
)

export const selectCartTotal = createSelector(
  [selectCartSubtotal, selectCartDeliveryFee, selectCartSummary],
  (subtotal, deliveryFee, summary) =>
    summary?.totalAmount !== undefined && summary?.totalAmount !== null
      ? Number(summary.totalAmount)
      : subtotal + deliveryFee,
)

export default cartSlice.reducer
