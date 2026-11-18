import { AlertTriangle } from 'lucide-react'
import Button from './Button.jsx'
import Modal from './Modal.jsx'

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = true,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600">
          <AlertTriangle size={20} aria-hidden="true" />
        </span>
        <p className="text-sm leading-6 text-text-secondary">{message}</p>
      </div>
    </Modal>
  )
}
