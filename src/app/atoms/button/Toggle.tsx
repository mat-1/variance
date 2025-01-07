import React from 'react';
import PropTypes from 'prop-types';
import './Toggle.scss';

function Toggle({ isActive = false, onToggle = null, disabled = false }) {
  const className = `toggle${isActive ? ' toggle--active' : ''}`;
  if (onToggle === null) return <span className={className} />;
  return (
    // eslint-disable-next-line jsx-a11y/control-has-associated-label
    <button
      onClick={() => onToggle(!isActive)}
      className={className}
      type="button"
      disabled={disabled}
    />
  );
}

Toggle.propTypes = {
  isActive: PropTypes.bool,
  onToggle: PropTypes.func,
  disabled: PropTypes.bool,
};

export default Toggle;
