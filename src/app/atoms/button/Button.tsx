import React from 'react';
import PropTypes from 'prop-types';
import './Button.scss';

import Text from '../text/Text';
import RawIcon from '../system-icons/RawIcon';
import { blurOnBubbling } from './script';

const Button = React.forwardRef(
  (
    {
      id = '',
      className,
      variant = 'surface',
      iconSrc,
      type = 'button',
      onClick,
      children,
      disabled = false,
      leftAligned,
    }: {
      id?: string;
      className?: string;
      variant?: string;
      iconSrc?: string;
      type?: 'button' | 'submit' | 'reset';
      onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
      children: React.ReactNode;
      disabled?: boolean;
      leftAligned?: boolean;
    },
    ref: React.Ref<HTMLButtonElement>,
  ) => {
    const iconClass = iconSrc === undefined ? '' : `btn-${variant}--icon`;
    return (
      <button
        ref={ref}
        id={id === '' ? undefined : id}
        className={`${className ? `${className} ` : ''}btn-${variant} ${iconClass} ${
          leftAligned ? 'btn-left-aligned ' : ''
        }noselect`}
        onMouseUp={(e) => blurOnBubbling(e, `.btn-${variant}`)}
        onClick={onClick}
        // eslint-disable-next-line react/button-has-type
        type={type}
        disabled={disabled}
      >
        {iconSrc && <RawIcon size="small" src={iconSrc} />}
        {typeof children === 'string' && <Text variant="b1">{children}</Text>}
        {typeof children !== 'string' && children}
      </button>
    );
  },
);

Button.propTypes = {
  id: PropTypes.string,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['surface', 'primary', 'positive', 'caution', 'danger']),
  iconSrc: PropTypes.string,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  onClick: PropTypes.func,
  children: PropTypes.node.isRequired,
  disabled: PropTypes.bool,
};

export default Button;
