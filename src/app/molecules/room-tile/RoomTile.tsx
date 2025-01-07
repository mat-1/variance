import React from 'react';
import PropTypes from 'prop-types';
import './RoomTile.scss';

import { twemojify } from '../../../util/twemojify';

import { backgroundColorMXID } from '../../../util/colorMXID';

import Text from '../../atoms/text/Text';
import Avatar from '../../atoms/avatar/Avatar';

function RoomTile({
  avatarSrc = null,
  name,
  id,
  inviterName = null,
  memberCount = null,
  desc = null,
  options = null,
}) {
  return (
    <div className="room-tile">
      <div className="room-tile__avatar">
        <Avatar imageSrc={avatarSrc} bgColor={backgroundColorMXID(id)} text={name} />
      </div>
      <div className="room-tile__content">
        <Text variant="s1">{twemojify(name)}</Text>
        <Text variant="b3">
          {inviterName !== null
            ? `Invited by ${inviterName} to ${id}${
                memberCount === null ? '' : ` • ${memberCount} members`
              }`
            : id + (memberCount === null ? '' : ` • ${memberCount} members`)}
        </Text>
        {desc !== null && typeof desc === 'string' ? (
          <Text className="room-tile__content__desc" variant="b2">
            {twemojify(desc, undefined, true)}
          </Text>
        ) : (
          desc
        )}
      </div>
      {options !== null && <div className="room-tile__options">{options}</div>}
    </div>
  );
}

RoomTile.propTypes = {
  avatarSrc: PropTypes.string,
  name: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  inviterName: PropTypes.string,
  memberCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  desc: PropTypes.node,
  options: PropTypes.node,
};

export default RoomTile;
