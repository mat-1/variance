import React from 'react';
import PropTypes from 'prop-types';
import './Chip.scss';

import Text from '../text/Text';
import RawIcon from '../system-icons/RawIcon';

function Chip({
  iconSrc,
  iconColor,
  text,
  children,
  onClick,
}: {
  iconSrc?: string;
  iconColor?: string;
  text?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button className="chip" type="button" onClick={onClick}>
      {iconSrc && <RawIcon src={iconSrc} color={iconColor} size="extra-small" />}
      {text && text !== '' && <Text variant="b3">{text}</Text>}
      {children}
    </button>
  );
}

Chip.propTypes = {
  iconSrc: PropTypes.string,
  iconColor: PropTypes.string,
  text: PropTypes.string,
  children: PropTypes.element,
  onClick: PropTypes.func,
};

export default Chip;
