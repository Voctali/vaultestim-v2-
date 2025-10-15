import { createContext, useContext, useState } from 'react'

const ToastContext = createContext()

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = ({ title, description, variant = 'default', duration = 3000 }) => {
    const id = Date.now()
    const newToast = { id, title, description, variant }

    setToasts(prev => [...prev, newToast])

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toast, toasts, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

function Toast({ toast, onClose }) {
  const variantStyles = {
    default: 'bg-background border-border',
    success: 'bg-green-500 border-green-600 text-white',
    error: 'bg-red-500 border-red-600 text-white',
    warning: 'bg-yellow-500 border-yellow-600 text-white'
  }

  return (
    <div
      className={`
        pointer-events-auto
        min-w-[300px] max-w-md
        p-4 rounded-lg border shadow-lg
        animate-in slide-in-from-bottom-5
        ${variantStyles[toast.variant] || variantStyles.default}
      `}
      onClick={onClose}
    >
      {toast.title && (
        <div className="font-semibold mb-1">{toast.title}</div>
      )}
      {toast.description && (
        <div className="text-sm opacity-90">{toast.description}</div>
      )}
    </div>
  )
}
