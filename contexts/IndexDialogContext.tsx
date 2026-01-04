'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface IndexDialogContextType {
  isOpen: boolean
  openDialog: () => void
  closeDialog: () => void
}

const IndexDialogContext = createContext<IndexDialogContextType | undefined>(undefined)

export function IndexDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const openDialog = () => setIsOpen(true)
  const closeDialog = () => setIsOpen(false)

  return (
    <IndexDialogContext.Provider value={{ isOpen, openDialog, closeDialog }}>
      {children}
    </IndexDialogContext.Provider>
  )
}

export function useIndexDialog() {
  const context = useContext(IndexDialogContext)
  if (context === undefined) {
    throw new Error('useIndexDialog must be used within IndexDialogProvider')
  }
  return context
}
