import React from 'react';
import PropTypes from 'prop-types';
import './RoomSelector.scss';
import { NotificationCountType, type Thread } from 'matrix-js-sdk';

import { twemojify } from '../../../util/twemojify';
import { backgroundColorMXID } from '../../../util/colorMXID';

import Text from '../../atoms/text/Text';
import Avatar from '../../atoms/avatar/Avatar';
import NotificationBadge from '../../atoms/badge/NotificationBadge';
import { blurOnBubbling } from '../../atoms/button/script';
import { selectRoom } from '../../../client/action/navigation';

interface RoomSelectorWrapperProps {
  isSelected: boolean;
  isMuted: boolean;
  isUnread: boolean;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  content: React.ReactNode;
  options: React.ReactNode;
  onContextMenu: React.MouseEventHandler<HTMLButtonElement>;
}

function RoomSelectorWrapper({
  isSelected,
  isMuted = false,
  isUnread,
  onClick,
  content,
  options = null,
  onContextMenu = null,
}: RoomSelectorWrapperProps) {
  const classes = ['room-selector'];
  if (isMuted) classes.push('room-selector--muted');
  if (isUnread) classes.push('room-selector--unread');
  if (isSelected) classes.push('room-selector--selected');

  return (
    <div className={classes.join(' ')}>
      <button
        className="room-selector__content"
        type="button"
        onClick={onClick}
        onMouseUp={(e) => blurOnBubbling(e, '.room-selector__content')}
        onContextMenu={onContextMenu}
      >
        {content}
      </button>
      <div className="room-selector__options">{options}</div>
    </div>
  );
}
RoomSelectorWrapper.propTypes = {
  isSelected: PropTypes.bool.isRequired,
  isMuted: PropTypes.bool,
  isUnread: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  content: PropTypes.node.isRequired,
  options: PropTypes.node,
  onContextMenu: PropTypes.func,
};

interface RoomSelectorProps {
  name: string;
  parentName: string | null;
  roomId: string;
  imageSrc?: string;
  iconSrc?: string;
  isSelected: boolean;
  isMuted: boolean;
  isUnread: boolean;
  notificationCount: string | number;
  isAlert: boolean;
  options: React.ReactNode;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  onContextMenu: React.MouseEventHandler<HTMLButtonElement>;
}

function RoomSelector({
  name,
  parentName = null,
  roomId,
  imageSrc = null,
  iconSrc = null,
  isSelected = false,
  isMuted = false,
  isUnread,
  notificationCount,
  isAlert,
  options = null,
  onClick,
  onContextMenu = null,
}: RoomSelectorProps) {
  return (
    <RoomSelectorWrapper
      isSelected={isSelected}
      isMuted={isMuted}
      isUnread={isUnread}
      content={
        <>
          <Avatar
            text={name}
            bgColor={backgroundColorMXID(roomId)}
            imageSrc={imageSrc}
            iconColor="var(--ic-surface-low)"
            iconSrc={iconSrc}
            size="extra-small"
          />
          <Text variant="b1" weight={isUnread ? 'medium' : 'normal'}>
            {twemojify(name)}
            {parentName && (
              <Text variant="b3" span>
                {' — '}
                {twemojify(parentName)}
              </Text>
            )}
          </Text>
          {isUnread && (
            <NotificationBadge
              alert={isAlert}
              content={notificationCount !== 0 ? notificationCount : null}
            />
          )}
        </>
      }
      options={options}
      onClick={onClick}
      onContextMenu={onContextMenu}
    />
  );
}
RoomSelector.propTypes = {
  name: PropTypes.string.isRequired,
  parentName: PropTypes.string,
  roomId: PropTypes.string.isRequired,
  imageSrc: PropTypes.string,
  iconSrc: PropTypes.string,
  isSelected: PropTypes.bool,
  isMuted: PropTypes.bool,
  isUnread: PropTypes.bool.isRequired,
  notificationCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  isAlert: PropTypes.bool.isRequired,
  options: PropTypes.node,
  onClick: PropTypes.func.isRequired,
  onContextMenu: PropTypes.func,
};

export default RoomSelector;

interface ThreadSelectorProps {
  thread: Thread;
  isSelected: boolean;
  isMuted: boolean;
}

export function ThreadSelector({ thread, isSelected, isMuted }: ThreadSelectorProps) {
  const { rootEvent } = thread;

  const notificationCount = thread.room.getThreadUnreadNotificationCount(
    thread.id,
    NotificationCountType.Total,
  );
  const highlightNotificationCount = thread.room.getThreadUnreadNotificationCount(
    thread.id,
    NotificationCountType.Highlight,
  );
  const isUnread = !isMuted && notificationCount > 0;
  const isAlert = highlightNotificationCount > 0;

  const name = rootEvent?.getContent()?.body ?? 'Unknown thread';

  const onClick = () => {
    selectRoom(thread.roomId, undefined, thread.id);
  };

  return (
    <RoomSelectorWrapper
      isSelected={isSelected}
      isMuted={isMuted}
      isUnread={!isMuted && notificationCount > 0}
      content={
        <>
          <div className="thread-selector__lines">{/* TODO */}</div>
          <Text variant="b1" weight={isUnread ? 'medium' : 'normal'}>
            {twemojify(name)}
          </Text>
          {isUnread && (
            <NotificationBadge
              alert={isAlert}
              content={notificationCount > 0 ? notificationCount : null}
            />
          )}
        </>
      }
      options={<div />}
      onClick={onClick}
      onContextMenu={() => {}}
    />
  );
}
