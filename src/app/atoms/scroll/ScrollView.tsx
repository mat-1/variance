import React, { ReactNode } from 'react';
import PropTypes from 'prop-types';
import './ScrollView.scss';

const ScrollView = React.forwardRef(
  (
    {
      horizontal,
      vertical,
      autoHide,
      invisible,
      onScroll,
      children,
    }: {
      horizontal?: boolean;
      vertical?: boolean;
      autoHide?: boolean;
      invisible?: boolean;
      onScroll?: (e: React.UIEvent<HTMLDivElement, UIEvent>) => void;
      children: ReactNode;
    },
    ref: React.Ref<HTMLDivElement>,
  ) => {
    let scrollbarClasses = '';
    if (horizontal) scrollbarClasses += ' scrollbar__h';
    if (vertical) scrollbarClasses += ' scrollbar__v';
    if (autoHide) scrollbarClasses += ' scrollbar--auto-hide';
    if (invisible) scrollbarClasses += ' scrollbar--invisible';
    return (
      <div onScroll={onScroll} ref={ref} className={`scrollbar${scrollbarClasses}`}>
        {children}
      </div>
    );
  },
);

ScrollView.defaultProps = {
  horizontal: false,
  vertical: true,
  autoHide: false,
  invisible: false,
};

ScrollView.propTypes = {
  horizontal: PropTypes.bool,
  vertical: PropTypes.bool,
  autoHide: PropTypes.bool,
  invisible: PropTypes.bool,
  onScroll: PropTypes.func,
  children: PropTypes.node.isRequired,
};

export default ScrollView;
