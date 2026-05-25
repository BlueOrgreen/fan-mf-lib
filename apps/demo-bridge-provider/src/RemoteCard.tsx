import React from 'react'
import './RemoteCard.css'

export interface RemoteCardProps {
  title?: string
  children?: React.ReactNode
  footer?: React.ReactNode
}

export function RemoteCard({
  title = 'Remote Card',
  children,
  footer
}: RemoteCardProps) {
  return (
    <div className="remote-card">
      {title && (
        <div className="remote-card-header">
          <h3>{title}</h3>
        </div>
      )}
      <div className="remote-card-body">
        {children}
      </div>
      {footer && (
        <div className="remote-card-footer">
          {footer}
        </div>
      )}
    </div>
  )
}

export default RemoteCard
