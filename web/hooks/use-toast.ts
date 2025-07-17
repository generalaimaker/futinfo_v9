import { useState, useEffect } from 'react'

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

interface ToastState {
  toasts: Toast[]
}

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 5000

let toastCount = 0

function genId() {
  toastCount = (toastCount + 1) % Number.MAX_VALUE
  return toastCount.toString()
}

const toastState: ToastState = {
  toasts: [],
}

const listeners: Array<(state: ToastState) => void> = []

function dispatch(action: any) {
  switch (action.type) {
    case 'ADD_TOAST':
      toastState.toasts = [action.toast, ...toastState.toasts].slice(0, TOAST_LIMIT)
      break
    case 'REMOVE_TOAST':
      toastState.toasts = toastState.toasts.filter(t => t.id !== action.toastId)
      break
    case 'UPDATE_TOAST':
      toastState.toasts = toastState.toasts.map(t =>
        t.id === action.toast.id ? { ...t, ...action.toast } : t
      )
      break
  }
  
  listeners.forEach(listener => {
    listener(toastState)
  })
}

export function toast({ ...props }: Omit<Toast, 'id'>) {
  const id = genId()
  const newToast = { ...props, id }
  
  dispatch({
    type: 'ADD_TOAST',
    toast: newToast,
  })
  
  setTimeout(() => {
    dispatch({ type: 'REMOVE_TOAST', toastId: id })
  }, TOAST_REMOVE_DELAY)
  
  return {
    id,
    dismiss: () => dispatch({ type: 'REMOVE_TOAST', toastId: id }),
    update: (props: Partial<Toast>) => dispatch({ type: 'UPDATE_TOAST', toast: { ...props, id } }),
  }
}

export function useToast() {
  const [state, setState] = useState<ToastState>(toastState)

  useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    toast,
    toasts: state.toasts,
  }
}