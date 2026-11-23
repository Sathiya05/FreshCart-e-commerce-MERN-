// Kept in sync with server/constants/delivery.js. The server recalculates and
// validates these values before an order is created.
export const FREE_DELIVERY_THRESHOLD = 499
export const DELIVERY_FEE = 30

export const getDeliveryFee = (subtotal = 0) =>
  Number(subtotal) > 0 && Number(subtotal) < FREE_DELIVERY_THRESHOLD
    ? DELIVERY_FEE
    : 0
