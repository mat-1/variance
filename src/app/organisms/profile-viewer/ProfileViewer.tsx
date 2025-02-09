import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './ProfileViewer.scss';

import { twemojify } from '../../../util/twemojify';

import initMatrix from '../../../client/initMatrix';
import cons from '../../../client/state/cons';
import navigation from '../../../client/state/navigation';
import {
  selectRoom,
  openReusableContextMenu,
  openViewSource,
} from '../../../client/action/navigation';
import * as roomActions from '../../../client/action/room';

import {
  getUsername,
  getUsernameOfRoomMember,
  getPowerLabel,
  hasDMWith,
  hasDevices,
} from '../../../util/matrixUtil';
import { getEventCords } from '../../../util/common';
import { backgroundColorMXID } from '../../../util/colorMXID';

import Text from '../../atoms/text/Text';
import Chip from '../../atoms/chip/Chip';
import IconButton from '../../atoms/button/IconButton';
import Input from '../../atoms/input/Input';
import Avatar from '../../atoms/avatar/Avatar';
import Button from '../../atoms/button/Button';
import { MenuItem } from '../../atoms/context-menu/ContextMenu';
import PowerLevelSelector from '../../molecules/power-level-selector/PowerLevelSelector';
import Dialog from '../../molecules/dialog/Dialog';

import ShieldEmptyIC from '../../../../public/res/ic/outlined/shield-empty.svg';
import ChevronRightIC from '../../../../public/res/ic/outlined/chevron-right.svg';
import ChevronBottomIC from '../../../../public/res/ic/outlined/chevron-bottom.svg';
import CrossIC from '../../../../public/res/ic/outlined/cross.svg';
import CmdIC from '../../../../public/res/ic/outlined/cmd.svg';

import { useForceUpdate } from '../../hooks/useForceUpdate';
import { confirmDialog } from '../../molecules/confirm-dialog/ConfirmDialog';
import { Device, DeviceMap, EventTimeline, EventType, RoomMemberEvent } from 'matrix-js-sdk';

function ModerationTools({ roomId, userId }) {
  const mx = initMatrix.matrixClient;
  const room = mx.getRoom(roomId);
  const roomMember = room.getMember(userId);

  const myPowerLevel = room.getMember(mx.getUserId())?.powerLevel || 0;
  const powerLevel = roomMember?.powerLevel || 0;
  const canIKick =
    roomMember?.membership === 'join' &&
    room.currentState.hasSufficientPowerLevelFor('kick', myPowerLevel) &&
    powerLevel < myPowerLevel;
  const canIBan =
    ['join', 'leave'].includes(roomMember?.membership) &&
    room.currentState.hasSufficientPowerLevelFor('ban', myPowerLevel) &&
    powerLevel < myPowerLevel;

  const handleKick = (e) => {
    e.preventDefault();
    const kickReason = e.target.elements['kick-reason']?.value.trim();
    roomActions.kick(roomId, userId, kickReason !== '' ? kickReason : undefined);
  };

  const handleBan = (e) => {
    e.preventDefault();
    const banReason = e.target.elements['ban-reason']?.value.trim();
    roomActions.ban(roomId, userId, banReason !== '' ? banReason : undefined);
  };

  return (
    <div className="moderation-tools">
      {canIKick && (
        <form onSubmit={handleKick}>
          <Input label="Kick reason" name="kick-reason" />
          <Button type="submit">Kick</Button>
        </form>
      )}
      {canIBan && (
        <form onSubmit={handleBan}>
          <Input label="Ban reason" name="ban-reason" />
          <Button type="submit">Ban</Button>
        </form>
      )}
    </div>
  );
}
ModerationTools.propTypes = {
  roomId: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
};

function SessionInfo({ userId }: { userId: string }) {
  const [devices, setDevices] = useState<Map<string, Device> | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const mx = initMatrix.matrixClient;

  useEffect(() => {
    let isUnmounted = false;

    async function loadDevices() {
      try {
        const crypto = mx.getCrypto()!;
        const myDevices = await crypto.getUserDeviceInfo([userId], true);

        if (isUnmounted) return;
        setDevices(myDevices.get(userId) ?? new Map());
      } catch {
        setDevices(new Map());
      }
    }
    loadDevices();

    return () => {
      isUnmounted = true;
    };
  }, [userId]);

  function renderSessionChips() {
    if (!isVisible) return null;
    return (
      <div className="session-info__chips">
        {devices === null && <Text variant="b2">Loading sessions...</Text>}
        {devices?.size === 0 && <Text variant="b2">No sessions found.</Text>}
        {devices !== null &&
          devices
            .entries()
            .map(([deviceId, device]) => (
              <Chip key={deviceId} iconSrc={ShieldEmptyIC} text={device.displayName || deviceId} />
            ))}
      </div>
    );
  }

  return (
    <div className="session-info">
      <MenuItem
        onClick={() => setIsVisible(!isVisible)}
        iconSrc={isVisible ? ChevronBottomIC : ChevronRightIC}
      >
        <Text variant="b2">{`View ${
          devices?.length > 0 ? `${devices.length} ` : ''
        }sessions`}</Text>
      </MenuItem>
      {renderSessionChips()}
    </div>
  );
}

SessionInfo.propTypes = {
  userId: PropTypes.string.isRequired,
};

function ProfileFooter({ roomId, userId, onRequestClose }) {
  const [isCreatingDM, setIsCreatingDM] = useState(false);
  const [isIgnoring, setIsIgnoring] = useState(false);
  const [isUserIgnored, setIsUserIgnored] = useState(initMatrix.matrixClient.isUserIgnored(userId));

  const isMountedRef = useRef(true);
  const mx = initMatrix.matrixClient;
  const room = mx.getRoom(roomId);
  const member = room.getMember(userId);
  const isInvitable = member?.membership !== 'join' && member?.membership !== 'ban';

  const [isInviting, setIsInviting] = useState(false);
  const [isInvited, setIsInvited] = useState(member?.membership === 'invite');

  const myPowerlevel = room.getMember(mx.getUserId())?.powerLevel || 0;
  const userPL = room.getMember(userId)?.powerLevel || 0;
  const canIKick =
    room.currentState.hasSufficientPowerLevelFor('kick', myPowerlevel) && userPL < myPowerlevel;

  const isBanned = member?.membership === 'ban';

  const onCreated = (dmRoomId) => {
    if (isMountedRef.current === false) return;
    setIsCreatingDM(false);
    selectRoom(dmRoomId);
    onRequestClose();
  };

  useEffect(() => {
    const { roomList } = initMatrix;
    roomList.on(cons.events.roomList.ROOM_CREATED, onCreated);
    return () => {
      isMountedRef.current = false;
      roomList.removeListener(cons.events.roomList.ROOM_CREATED, onCreated);
    };
  }, []);
  useEffect(() => {
    setIsUserIgnored(initMatrix.matrixClient.isUserIgnored(userId));
    setIsIgnoring(false);
    setIsInviting(false);
  }, [userId]);

  const openDM = async () => {
    // Check and open if user already have a DM with userId.
    const dmRoomId = hasDMWith(userId);
    if (dmRoomId) {
      selectRoom(dmRoomId);
      onRequestClose();
      return;
    }

    // Create new DM
    try {
      setIsCreatingDM(true);
      await roomActions.createDM(userId, await hasDevices(userId));
    } catch {
      if (isMountedRef.current === false) return;
      setIsCreatingDM(false);
    }
  };

  const toggleIgnore = async () => {
    const isIgnored = mx.getIgnoredUsers().includes(userId);

    try {
      setIsIgnoring(true);
      if (isIgnored) {
        await roomActions.unignore([userId]);
      } else {
        await roomActions.ignore([userId]);
      }

      if (isMountedRef.current === false) return;
      setIsUserIgnored(!isIgnored);
      setIsIgnoring(false);
    } catch {
      setIsIgnoring(false);
    }
  };

  const toggleInvite = async () => {
    try {
      setIsInviting(true);
      let isInviteSent = false;
      if (isInvited) await roomActions.kick(roomId, userId);
      else {
        await roomActions.invite(roomId, userId);
        isInviteSent = true;
      }
      if (isMountedRef.current === false) return;
      setIsInvited(isInviteSent);
      setIsInviting(false);
    } catch {
      setIsInviting(false);
    }
  };

  return (
    <div className="profile-viewer__buttons">
      <Button variant="primary" onClick={openDM} disabled={isCreatingDM}>
        {isCreatingDM ? 'Creating room...' : 'Message'}
      </Button>
      {isBanned && canIKick && (
        <Button variant="positive" onClick={() => roomActions.unban(roomId, userId)}>
          Unban
        </Button>
      )}
      {(isInvited ? canIKick : room.canInvite(mx.getUserId())) && isInvitable && (
        <Button onClick={toggleInvite} disabled={isInviting}>
          {isInvited
            ? `${isInviting ? 'Disinviting...' : 'Disinvite'}`
            : `${isInviting ? 'Inviting...' : 'Invite'}`}
        </Button>
      )}
      <Button
        variant={isUserIgnored ? 'positive' : 'danger'}
        onClick={toggleIgnore}
        disabled={isIgnoring}
      >
        {isUserIgnored
          ? `${isIgnoring ? 'Unignoring...' : 'Unignore'}`
          : `${isIgnoring ? 'Ignoring...' : 'Ignore'}`}
      </Button>
    </div>
  );
}
ProfileFooter.propTypes = {
  roomId: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
  onRequestClose: PropTypes.func.isRequired,
};

function useToggleDialog(): [boolean, string | null, string | null, () => void, () => void] {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = (uId: string, rId: string) => {
      setIsOpen(true);
      setUserId(uId);
      setRoomId(rId);
    };
    navigation.on(cons.events.navigation.PROFILE_VIEWER_OPENED, loadProfile);
    return () => {
      navigation.removeListener(cons.events.navigation.PROFILE_VIEWER_OPENED, loadProfile);
    };
  }, []);

  const closeDialog = () => setIsOpen(false);

  const afterClose = () => {
    setUserId(null);
    setRoomId(null);
  };

  return [isOpen, roomId, userId, closeDialog, afterClose];
}

function useRerenderOnProfileChange(roomId: string | null, userId: string | null) {
  const mx = initMatrix.matrixClient;
  const [, forceUpdate] = useForceUpdate();
  useEffect(() => {
    const handleProfileChange = (mEvent, member) => {
      if (
        mEvent.getRoomId() === roomId &&
        (member.userId === userId || member.userId === mx.getUserId())
      ) {
        forceUpdate();
      }
    };
    mx.on(RoomMemberEvent.PowerLevel, handleProfileChange);
    mx.on(RoomMemberEvent.Membership, handleProfileChange);
    return () => {
      mx.removeListener(RoomMemberEvent.PowerLevel, handleProfileChange);
      mx.removeListener(RoomMemberEvent.Membership, handleProfileChange);
    };
  }, [roomId, userId]);
}

function ProfileViewer() {
  const [isOpen, roomId, userId, closeDialog, handleAfterClose] = useToggleDialog();
  useRerenderOnProfileChange(roomId, userId);

  const mx = initMatrix.matrixClient;
  const room = roomId ? mx.getRoom(roomId) : null;

  const renderProfile = () => {
    if (!userId) {
      console.error('called ProfileViewer without userId');
      return null;
    }
    if (!room) {
      console.error('called ProfileViewer without room');
      return null;
    }

    const roomMember = room.getMember(userId);
    const username = roomMember ? getUsernameOfRoomMember(roomMember) : getUsername(userId);
    const avatarMxc = roomMember?.getMxcAvatarUrl?.() || mx.getUser(userId)?.avatarUrl;
    const avatarUrl =
      avatarMxc && avatarMxc !== 'null' ? mx.mxcUrlToHttp(avatarMxc, 80, 80, 'crop') : null;

    const powerLevel = roomMember?.powerLevel || 0;
    const myPowerLevel = room.getMember(mx.getUserId()!)?.powerLevel || 0;

    const canChangeRole =
      room
        .getLiveTimeline()
        .getState(EventTimeline.FORWARDS)!
        .maySendEvent(EventType.RoomPowerLevels, mx.getUserId()!) &&
      (powerLevel < myPowerLevel || userId === mx.getUserId());

    const handleChangePowerLevel = async (newPowerLevel: number) => {
      if (newPowerLevel === powerLevel) return;
      const SHARED_POWER_MSG =
        'You will not be able to undo this change as you are promoting the user to have the same power level as yourself. Are you sure?';
      const DEMOTING_MYSELF_MSG =
        'You will not be able to undo this change as you are demoting yourself. Are you sure?';

      const isSharedPower = newPowerLevel === myPowerLevel;
      const isDemotingMyself = userId === mx.getUserId();
      if (isSharedPower || isDemotingMyself) {
        const isConfirmed = await confirmDialog(
          'Change power level',
          isSharedPower ? SHARED_POWER_MSG : DEMOTING_MYSELF_MSG,
          'Change',
          'caution',
        );
        if (!isConfirmed) return;
        roomActions.setPowerLevel(roomId, userId, newPowerLevel);
      } else {
        roomActions.setPowerLevel(roomId, userId, newPowerLevel);
      }
    };

    const handlePowerSelector = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      openReusableContextMenu('bottom', getEventCords(e, '.btn-surface'), (closeMenu) => (
        <PowerLevelSelector
          value={powerLevel}
          max={myPowerLevel}
          onSelect={(pl) => {
            closeMenu();
            handleChangePowerLevel(pl);
          }}
        />
      ));
    };

    return (
      <div className="profile-viewer">
        <div className="profile-viewer__user">
          <Avatar
            imageSrc={avatarUrl}
            text={username}
            bgColor={backgroundColorMXID(userId)}
            size="large"
          />
          <div className="profile-viewer__user__info">
            <Text variant="s1" weight="medium">
              {twemojify(username)}
            </Text>
            <Text variant="b3">{twemojify(userId)}</Text>
          </div>

          <div className="profile-viewer__user__role">
            <Text variant="b3">Role</Text>
            <Button
              onClick={canChangeRole ? handlePowerSelector : undefined}
              iconSrc={canChangeRole ? ChevronBottomIC : undefined}
            >
              {`${getPowerLabel(powerLevel) || 'Member'} - ${powerLevel}`}
            </Button>
          </div>
        </div>
        <ModerationTools roomId={roomId} userId={userId} />
        <SessionInfo userId={userId} />
        {userId !== mx.getUserId() && (
          <ProfileFooter roomId={roomId} userId={userId} onRequestClose={closeDialog} />
        )}
      </div>
    );
  };

  const handleOpenViewSource = () => () => {
    if (!userId) {
      console.error('called handleOpenViewSource without userId');
      return null;
    }
    if (!room) {
      console.error('called handleOpenViewSource without room');
      return null;
    }

    const roomMember = room.getMember(userId);
    if (!roomMember) {
      console.error("called handleOpenViewSource on a user that's not in the room");
      return null;
    }
    const memberEvent = roomMember.events.member;

    if (!memberEvent) {
      console.error('called handleOpenViewSource on a member without an event');
      return null;
    }

    // close the menu
    closeDialog();

    openViewSource(memberEvent);
  };

  return (
    <Dialog
      className="profile-viewer__dialog"
      isOpen={isOpen}
      title={room?.name ?? ''}
      onAfterClose={handleAfterClose}
      onRequestClose={closeDialog}
      contentOptions={
        <>
          <IconButton src={CmdIC} onClick={handleOpenViewSource()} tooltip="View source" />
          <IconButton src={CrossIC} onClick={closeDialog} tooltip="Close" />
        </>
      }
    >
      {roomId ? renderProfile() : <div />}
    </Dialog>
  );
}

export default ProfileViewer;
