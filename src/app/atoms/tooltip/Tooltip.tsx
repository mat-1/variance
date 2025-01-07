import React from 'react';
import PropTypes from 'prop-types';
import './Tooltip.scss';
import Tippy from '@tippyjs/react';

function Tooltip({ className = '', placement = 'top', content, delay = [200, 0], children }) {
  return (
    <Tippy
      content={content}
      className={`tooltip ${className}`}
      touch="hold"
      arrow={false}
      maxWidth={250}
      placement={placement}
      delay={delay}
      duration={[100, 0]}
    >
      {children}
    </Tippy>
  );
}

Tooltip.propTypes = {
  className: PropTypes.string,
  placement: PropTypes.string,
  content: PropTypes.node.isRequired,
  delay: PropTypes.arrayOf(PropTypes.number),
  children: PropTypes.node.isRequired,
};

export default Tooltip;
