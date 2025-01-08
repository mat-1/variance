import React from 'react';
import PropTypes from 'prop-types';
import './Divider.scss';

import Text from '../text/Text';

function Divider({
  text = undefined,
  variant = 'surface',
  align = 'center',
}: {
  text?: string;
  variant?: 'surface' | 'primary' | 'positive' | 'caution' | 'danger';
  align?: 'left' | 'center' | 'right';
}) {
  const dividerClass = ` divider--${variant} divider--${align}`;
  return (
    <div className={`divider${dividerClass}`}>
      {text && (
        <Text className="divider__text" variant="b3" weight="bold">
          {text}
        </Text>
      )}
    </div>
  );
}

Divider.propTypes = {
  text: PropTypes.string,
  variant: PropTypes.oneOf(['surface', 'primary', 'positive', 'caution', 'danger']),
  align: PropTypes.oneOf(['left', 'center', 'right']),
};

export default Divider;
