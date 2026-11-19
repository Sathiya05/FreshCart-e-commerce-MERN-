import { Router } from 'express'
import {
  createAddress,
  deleteAddress,
  listAddresses,
  setDefaultAddress,
  updateAddress,
} from '../controllers/address.controller.js'
import { protect } from '../middleware/auth.js'
import { requireDatabase } from '../middleware/database.js'
import { validate } from '../middleware/validate.js'
import {
  addressIdValidator,
  createAddressValidator,
  updateAddressValidator,
} from '../validators/address.validator.js'

const router = Router()

router.use(requireDatabase)
router.use(protect)

router.get('/addresses', listAddresses)
router.post('/addresses', createAddressValidator, validate, createAddress)
router.patch(
  '/addresses/:id/default',
  addressIdValidator,
  validate,
  setDefaultAddress,
)
router.patch('/addresses/:id', updateAddressValidator, validate, updateAddress)
router.delete('/addresses/:id', addressIdValidator, validate, deleteAddress)

export default router
