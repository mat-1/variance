import React from 'react';
import PropTypes from 'prop-types';
import './Text.scss';

export type TextVariant = 'h1' | 'h2' | 's1' | 'b1' | 'b2' | 'b3' | 'b4';

function Text({
  className,
  style,
  variant = 'b1',
  weight = 'normal',
  primary = false,
  span = false,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  variant?: TextVariant;
  weight?: 'light' | 'normal' | 'medium' | 'bold';
  primary?: boolean;
  span?: boolean;
  children?: React.ReactNode;
}) {
  const classes = [];
  if (className) classes.push(className);

  classes.push(`text text-${variant} text-${weight}`);
  if (primary) classes.push('font-primary');

  const textClass = classes.join(' ');
  if (span)
    return (
      <span className={textClass} style={style}>
        {children}
      </span>
    );
  if (variant === 'h1')
    return (
      <h1 className={textClass} style={style}>
        {children}
      </h1>
    );
  if (variant === 'h2')
    return (
      <h2 className={textClass} style={style}>
        {children}
      </h2>
    );
  if (variant === 's1')
    return (
      <h4 className={textClass} style={style}>
        {children}
      </h4>
    );
  return (
    <p className={textClass} style={style}>
      {children}
    </p>
  );
}

Text.propTypes = {
  className: PropTypes.string,
  style: PropTypes.shape({}),
  variant: PropTypes.oneOf(['h1', 'h2', 's1', 'b1', 'b2', 'b3']),
  weight: PropTypes.oneOf(['light', 'normal', 'medium', 'bold']),
  primary: PropTypes.bool,
  span: PropTypes.bool,
  children: PropTypes.node,
};

export default Text;
