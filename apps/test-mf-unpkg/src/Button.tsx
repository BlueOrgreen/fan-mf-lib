import React from 'react';

export interface ButtonProps {
  /** Button 文本内容 */
  children?: React.ReactNode;
  /** 按钮变体：主要按钮、文本按钮 */
  variant?: 'primary' | 'secondary' | 'text';
  /** 按钮尺寸 */
  size?: 'small' | 'medium' | 'large';
  /** 是否禁用 */
  disabled?: boolean;
  /** 点击事件处理器 */
  onClick?: () => void;
  /** 额外样式类名 */
  className?: string;
  /** 按钮类型 */
  type?: 'button' | 'submit' | 'reset';
}

// 内联样式对象
const buttonStyles: Record<string, React.CSSProperties> = {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },
  small: { padding: '6px 12px', fontSize: '13px' },
  medium: { padding: '10px 20px', fontSize: '14px' },
  large: { padding: '14px 28px', fontSize: '16px' },
  primary: { backgroundColor: '#3b82f6', color: '#ffffff' },
  secondary: { backgroundColor: '#f3f4f6', color: '#1f2937', border: '1px solid #d1d5db' },
  text: { backgroundColor: 'transparent', color: '#3b82f6' },
  disabled: { opacity: 0.5, cursor: 'not-allowed' },
};

export default function Button({
  children = 'Button From Remote',
  variant = 'primary',
  size = 'medium',
  disabled = false,
  onClick,
  className = '',
  type = 'button',
}: ButtonProps) {
  const handleClick = React.useCallback(() => {
    if (!disabled && onClick) {
      onClick();
    }
  }, [disabled, onClick]);

  const style: React.CSSProperties = {
    ...buttonStyles.base,
    ...buttonStyles[size],
    ...buttonStyles[variant],
    ...(disabled ? buttonStyles.disabled : {}),
  };

  return (
    <button
      type={type}
      style={style}
      disabled={disabled}
      onClick={handleClick}
      className={className}
    >
      {children}
    </button>
  );
}
