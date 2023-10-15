import React from 'react';
import PropTypes from 'prop-types';
import './Avatar.scss';

import { twemojify } from '../../../util/twemojify';

import Text from '../text/Text';
import RawIcon from '../system-icons/RawIcon';

import ImageBrokenSVG from '../../../../public/res/svg/image-broken.svg';
import { avatarInitials } from '../../../util/common';
import settings from '../../../client/state/settings';

const Avatar = React.forwardRef(
  (
    {
      text,
      bgColor,
      iconSrc,
      iconColor,
      imageSrc,
      size,
    }: {
      text?: string;
      bgColor?: string;
      iconSrc?: string;
      iconColor?: string;
      imageSrc?: string;
      size?: 'large' | 'medium' | 'normal' | 'small' | 'extra-small';
    },
    ref: React.Ref<HTMLDivElement>,
  ) => {
    let textSize = 's1';
    if (size === 'large') textSize = 'h1';
    if (size === 'small') textSize = 'b1';
    if (size === 'extra-small') textSize = 'b3';

    // matrix (or at least synapse) lets us replace .gif with .png in the url to make it static
    const pausedImageSrc = imageSrc?.replace(/\.gif\b/, '.png') ?? null;
    const { onlyAnimateOnHover } = settings;

    const [activeImageSrc, setActiveImageSrc] = React.useState(
      onlyAnimateOnHover ? pausedImageSrc : imageSrc,
    );

    // also update when imageSrc changes
    React.useEffect(() => {
      setActiveImageSrc(onlyAnimateOnHover ? pausedImageSrc : imageSrc);
    }, [imageSrc, onlyAnimateOnHover, pausedImageSrc]);

    return (
      <div ref={ref} className={`avatar-container avatar-container__${size} noselect`}>
        {activeImageSrc !== null ? (
          <img
            draggable="false"
            src={activeImageSrc}
            onLoad={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.backgroundColor = 'transparent';
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = ImageBrokenSVG;
            }}
            onMouseEnter={() => {
              if (onlyAnimateOnHover) {
                setActiveImageSrc(imageSrc);
              }
            }}
            onMouseLeave={() => {
              if (onlyAnimateOnHover) {
                setActiveImageSrc(pausedImageSrc);
              }
            }}
            alt=""
          />
        ) : (
          <span
            style={{ backgroundColor: iconSrc === null ? bgColor : 'transparent' }}
            className={`avatar__border${iconSrc !== null ? '--active' : ''}`}
          >
            {iconSrc !== null ? (
              <RawIcon size={size} src={iconSrc} color={iconColor} />
            ) : (
              text !== null && (
                <Text variant={textSize} primary>
                  {twemojify(avatarInitials(text))}
                </Text>
              )
            )}
          </span>
        )}
      </div>
    );
  },
);

Avatar.defaultProps = {
  text: null,
  bgColor: 'transparent',
  iconSrc: null,
  iconColor: null,
  imageSrc: null,
  size: 'normal',
};

Avatar.propTypes = {
  text: PropTypes.string,
  bgColor: PropTypes.string,
  iconSrc: PropTypes.string,
  iconColor: PropTypes.string,
  imageSrc: PropTypes.string,
  size: PropTypes.oneOf(['large', 'medium', 'normal', 'small', 'extra-small']),
};

export default Avatar;
