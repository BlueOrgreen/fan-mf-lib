import React from 'react'
import './RemoteButton.css'

export interface RemoteButtonProps {
  onClick?: () => void
  children?: React.ReactNode
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

export function RemoteButton({
  onClick,
  children = 'Remote Button',
  variant = 'primary',
  disabled = false
}: RemoteButtonProps) {
  return (
    <button
      className={`remote-button ${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

export default RemoteButton
