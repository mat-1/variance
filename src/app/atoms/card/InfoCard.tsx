import React from 'react';
import PropTypes from 'prop-types';
import './InfoCard.scss';

import Text from '../text/Text';
import RawIcon from '../system-icons/RawIcon';
import IconButton from '../button/IconButton';

import CrossIC from '../../../../public/res/ic/outlined/cross.svg';

// {
//   className: null,
//   style: null,
//   variant: 'surface',
//   iconSrc: null,
//   content: null,
//   rounded: false,
//   requestClose: null,
// }

function InfoCard({
  className = null,
  style = null,
  variant = 'surface',
  iconSrc = null,
  title,
  content = null,
  rounded = false,
  requestClose = null,
}) {
  const classes = [`info-card info-card--${variant}`];
  if (rounded) classes.push('info-card--rounded');
  if (className) classes.push(className);
  return (
    <div className={classes.join(' ')} style={style}>
      {iconSrc && (
        <div className="info-card__icon">
          <RawIcon color={`var(--ic-${variant}-high)`} src={iconSrc} />
        </div>
      )}
      <div className="info-card__content">
        <Text>{title}</Text>
        {content}
      </div>
      {requestClose && <IconButton src={CrossIC} variant={variant} onClick={requestClose} />}
    </div>
  );
}

InfoCard.propTypes = {
  className: PropTypes.string,
  style: PropTypes.shape({}),
  variant: PropTypes.oneOf(['surface', 'primary', 'positive', 'caution', 'danger']),
  iconSrc: PropTypes.string,
  title: PropTypes.string.isRequired,
  content: PropTypes.node,
  rounded: PropTypes.bool,
  requestClose: PropTypes.func,
};

export default InfoCard;
