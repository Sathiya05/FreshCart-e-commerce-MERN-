import * as cartService from '../services/cart.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const getCart = asyncHandler(async (req, res) => {
  const data = await cartService.getCart(req.user.id)
  res.json({ success: true, data })
})

export const addCartItem = asyncHandler(async (req, res) => {
  const data = await cartService.addCartItem(
    req.user.id,
    req.body.productId,
    req.body.quantity,
  )
  res.json({ success: true, data })
})

export const updateCartItem = asyncHandler(async (req, res) => {
  const data = await cartService.updateCartItem(
    req.user.id,
    req.params.id,
    req.body.quantity,
  )
  res.json({ success: true, data })
})

export const removeCartItem = asyncHandler(async (req, res) => {
  const data = await cartService.removeCartItem(req.user.id, req.params.id)
  res.json({ success: true, data })
})

export const clearCart = asyncHandler(async (req, res) => {
  const data = await cartService.clearCart(req.user.id)
  res.json({ success: true, data })
})
