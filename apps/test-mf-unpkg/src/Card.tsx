import React from 'react';

export interface CardProps {
  /** Card 标题 */
  title?: string;
  /** Card 副标题 */
  subtitle?: string;
  /** Card 内容 */
  children?: React.ReactNode;
  /** 是否显示边框 */
  bordered?: boolean;
  /** 是否显示阴影 */
  elevated?: boolean;
  /** Card 宽度 */
  width?: string | number;
  /** 额外样式类名 */
  className?: string;
  /** 点击事件处理器 */
  onClick?: () => void;
}

// 内联样式对象
const cardStyles: Record<string, React.CSSProperties> = {
  base: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    overflow: 'hidden',
    boxSizing: 'border-box',
    transition: 'box-shadow 0.2s ease',
  },
  bordered: { border: '1px solid #e5e7eb' },
  elevated: { boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' },
  clickable: { cursor: 'pointer' },
  title: {
    padding: '16px 16px 8px',
    fontSize: '18px',
    fontWeight: 600,
    color: '#1f2937',
    margin: 0,
  },
  subtitle: {
    padding: '0 16px 12px',
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  content: {
    padding: '16px',
    color: '#374151',
    lineHeight: 1.6,
  },
};

export default function Card({
  title,
  subtitle,
  children,
  bordered = true,
  elevated = false,
  width = '100%',
  className = '',
  onClick,
}: CardProps) {
  const handleClick = React.useCallback(() => {
    if (onClick) {
      onClick();
    }
  }, [onClick]);

  const style: React.CSSProperties = {
    ...cardStyles.base,
    ...(bordered ? cardStyles.bordered : {}),
    ...(elevated ? cardStyles.elevated : {}),
    ...(bordered && elevated ? { border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' } : {}),
    width,
    ...(onClick ? cardStyles.clickable : {}),
  };

  return (
    <div
      style={style}
      className={className}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); } : undefined}
    >
      {title && <div style={cardStyles.title}>{title}</div>}
      {subtitle && <div style={cardStyles.subtitle}>{subtitle}</div>}
      {children && <div style={cardStyles.content}>{children}</div>}
      这是Test远程Card组件
    </div>
  );
}
