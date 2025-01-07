import React from 'react';
import PropTypes from 'prop-types';
import './RawIcon.scss';

export type IconSize = 'large' | 'normal' | 'small' | 'extra-small' | 'ultra-small';

function RawIcon({
  color = undefined,
  size = 'normal',
  src,
  isImage = false,
}: {
  color?: string;
  size?: IconSize;
  src: string;
  isImage?: boolean;
}) {
  const style: React.CSSProperties = {};
  if (color) style.backgroundColor = color;
  if (isImage) {
    style.backgroundColor = 'transparent';
    style.backgroundImage = `url("${src}")`;
  } else {
    style.WebkitMaskImage = `url("${src}")`;
    style.maskImage = `url("${src}")`;
  }

  return <span className={`ic-raw ic-raw-${size}`} style={style} />;
}

RawIcon.propTypes = {
  color: PropTypes.string,
  size: PropTypes.oneOf(['large', 'normal', 'small', 'extra-small', 'ultra-small']),
  src: PropTypes.string.isRequired,
  isImage: PropTypes.bool,
};

export default RawIcon;
