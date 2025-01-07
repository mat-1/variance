import React from 'react';
import PropTypes from 'prop-types';
import './RoomIntro.scss';

import Text from '../../atoms/text/Text';
import Avatar from '../../atoms/avatar/Avatar';
import { backgroundColorMXID } from '../../../util/colorMXID';

function RoomIntro({
  roomId,
  avatarSrc = null,
  name,
  heading,
  desc,
  time = null,
}: {
  roomId: string;
  avatarSrc: string | boolean | null;
  name: string;
  heading: React.ReactNode;
  desc: React.ReactNode;
  time: React.ReactNode;
}) {
  return (
    <div className="room-intro">
      <Avatar imageSrc={avatarSrc} text={name} bgColor={backgroundColorMXID(roomId)} size="large" />
      <div className="room-intro__content">
        <Text className="room-intro__name" variant="h1" weight="medium" primary>
          {heading}
        </Text>
        <Text className="room-intro__desc" variant="b1">
          {desc}
        </Text>
        {time !== null && (
          <Text className="room-intro__time" variant="b3">
            {time}
          </Text>
        )}
      </div>
    </div>
  );
}

RoomIntro.propTypes = {
  roomId: PropTypes.string.isRequired,
  avatarSrc: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  name: PropTypes.string.isRequired,
  heading: PropTypes.node.isRequired,
  desc: PropTypes.node.isRequired,
  time: PropTypes.node,
};

export default RoomIntro;
