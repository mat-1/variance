import React from 'react';
import PropTypes from 'prop-types';

import { twemojify } from '../../../util/twemojify';

import initMatrix from '../../../client/initMatrix';
import {
  openSpaceSettings,
  openSpaceManage,
  openInviteUser,
} from '../../../client/action/navigation';
import { markAsRead } from '../../../client/action/notifications';
import { leave } from '../../../client/action/room';

import { MenuHeader, MenuItem } from '../../atoms/context-menu/ContextMenu';

import CategoryIC from '../../../../public/res/ic/outlined/category.svg';
import CategoryFilledIC from '../../../../public/res/ic/filled/category.svg';
import TickMarkIC from '../../../../public/res/ic/outlined/tick-mark.svg';
import AddUserIC from '../../../../public/res/ic/outlined/add-user.svg';
import SettingsIC from '../../../../public/res/ic/outlined/settings.svg';
import HashSearchIC from '../../../../public/res/ic/outlined/hash-search.svg';
import LeaveArrowIC from '../../../../public/res/ic/outlined/leave-arrow.svg';
import PinIC from '../../../../public/res/ic/outlined/pin.svg';
import PinFilledIC from '../../../../public/res/ic/filled/pin.svg';

import { confirmDialog } from '../confirm-dialog/ConfirmDialog';

function SpaceOptions({ roomId, afterOptionSelect }) {
  const mx = initMatrix.matrixClient;
  const { roomList } = initMatrix;
  const room = mx.getRoom(roomId);
  const canInvite = room?.canInvite(mx.getUserId());

  const handleMarkAsRead = () => {
    const spaceChildren = roomList.getCategorizedSpaces([roomId]);
    spaceChildren?.forEach((childIds) => {
      childIds?.forEach((childId) => {
        markAsRead(childId);
      });
    });
    afterOptionSelect();
  };
  const handleInviteClick = () => {
    openInviteUser(roomId, null);
    afterOptionSelect();
  };
  const handleSettingsClick = () => {
    openSpaceSettings(roomId, null);
    afterOptionSelect();
  };
  const handleManageRoom = () => {
    openSpaceManage(roomId);
    afterOptionSelect();
  };

  const handleLeaveClick = async () => {
    afterOptionSelect();
    const isConfirmed = await confirmDialog(
      'Leave space',
      `Are you sure that you want to leave "${room.name}" space?`,
      'Leave',
      'danger',
    );
    if (!isConfirmed) return;
    leave(roomId);
  };

  return (
    <div style={{ maxWidth: 'calc(var(--navigation-drawer-width) - var(--sp-normal))' }}>
      <MenuHeader>
        {twemojify(`Options for ${initMatrix.matrixClient.getRoom(roomId)?.name}`)}
      </MenuHeader>
      <MenuItem iconSrc={TickMarkIC} onClick={handleMarkAsRead}>
        Mark as read
      </MenuItem>
      <MenuItem iconSrc={AddUserIC} onClick={handleInviteClick} disabled={!canInvite}>
        Invite
      </MenuItem>
      <MenuItem onClick={handleManageRoom} iconSrc={HashSearchIC}>
        Manage rooms
      </MenuItem>
      <MenuItem onClick={handleSettingsClick} iconSrc={SettingsIC}>
        Settings
      </MenuItem>
      <MenuItem variant="danger" onClick={handleLeaveClick} iconSrc={LeaveArrowIC}>
        Leave
      </MenuItem>
    </div>
  );
}

SpaceOptions.defaultProps = {
  afterOptionSelect: null,
};

SpaceOptions.propTypes = {
  roomId: PropTypes.string.isRequired,
  afterOptionSelect: PropTypes.func,
};

export default SpaceOptions;
