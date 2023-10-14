import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './RoomSettings.scss';

import { blurOnBubbling } from '../../atoms/button/script';

import initMatrix from '../../../client/initMatrix';
import cons from '../../../client/state/cons';
import navigation from '../../../client/state/navigation';
import { openInviteUser, toggleRoomSettings } from '../../../client/action/navigation';
import * as roomActions from '../../../client/action/room';

import Text from '../../atoms/text/Text';
import RawIcon from '../../atoms/system-icons/RawIcon';
import Header, { TitleWrapper } from '../../atoms/header/Header';
import Tabs from '../../atoms/tabs/Tabs';
import { MenuHeader, MenuItem } from '../../atoms/context-menu/ContextMenu';
import RoomProfile from '../../molecules/room-profile/RoomProfile';
import RoomSearch from '../../molecules/room-search/RoomSearch';
import RoomNotification from '../../molecules/room-notification/RoomNotification';
import RoomVisibility from '../../molecules/room-visibility/RoomVisibility';
import RoomAliases from '../../molecules/room-aliases/RoomAliases';
import RoomHistoryVisibility from '../../molecules/room-history-visibility/RoomHistoryVisibility';
import RoomEncryption from '../../molecules/room-encryption/RoomEncryption';
import RoomPermissions from '../../molecules/room-permissions/RoomPermissions';
import RoomMembers from '../../molecules/room-members/RoomMembers';
import RoomEmojis from '../../molecules/room-emojis/RoomEmojis';

import UserIC from '../../../../public/res/ic/outlined/user.svg';
import SettingsIC from '../../../../public/res/ic/outlined/settings.svg';
import EmojiIC from '../../../../public/res/ic/outlined/emoji.svg';
import SearchIC from '../../../../public/res/ic/outlined/search.svg';
import ShieldUserIC from '../../../../public/res/ic/outlined/shield-user.svg';
import LockIC from '../../../../public/res/ic/outlined/lock.svg';
import AddUserIC from '../../../../public/res/ic/outlined/add-user.svg';
import LeaveArrowIC from '../../../../public/res/ic/outlined/leave-arrow.svg';
import ChevronTopIC from '../../../../public/res/ic/outlined/chevron-top.svg';
import BackArrowIC from '../../../../public/res/ic/outlined/chevron-left.svg';

import { useForceUpdate } from '../../hooks/useForceUpdate';
import { confirmDialog } from '../../molecules/confirm-dialog/ConfirmDialog';
import IconButton from '../../atoms/button/IconButton';

const tabText = {
  GENERAL: 'General',
  SEARCH: 'Search',
  MEMBERS: 'Members',
  EMOJIS: 'Emojis',
  PERMISSIONS: 'Permissions',
  SECURITY: 'Security',
};

function GeneralSettings({ roomId }) {
  const mx = initMatrix.matrixClient;
  const room = mx.getRoom(roomId);
  const canInvite = room.canInvite(mx.getUserId());

  return (
    <>
      <div className="room-settings__card">
        <MenuHeader>Options</MenuHeader>
        <RoomProfile roomId={roomId} />

        <MenuItem disabled={!canInvite} onClick={() => openInviteUser(roomId)} iconSrc={AddUserIC}>
          Invite
        </MenuItem>
        <MenuItem
          variant="danger"
          onClick={async () => {
            const isConfirmed = await confirmDialog(
              'Leave room',
              `Are you sure that you want to leave "${room.name}" room?`,
              'Leave',
              'danger',
            );
            if (!isConfirmed) return;
            roomActions.leave(roomId);
          }}
          iconSrc={LeaveArrowIC}
        >
          Leave
        </MenuItem>
      </div>
      <div className="room-settings__card">
        <MenuHeader>Notification (Changing this will only affect you)</MenuHeader>
        <RoomNotification roomId={roomId} />
      </div>
      <div className="room-settings__card">
        <MenuHeader>Room visibility (who can join)</MenuHeader>
        <RoomVisibility roomId={roomId} />
      </div>
      <div className="room-settings__card">
        <MenuHeader>Room addresses</MenuHeader>
        <RoomAliases roomId={roomId} />
      </div>
    </>
  );
}

GeneralSettings.propTypes = {
  roomId: PropTypes.string.isRequired,
};

function SecuritySettings({ roomId }) {
  return (
    <>
      <div className="room-settings__card">
        <MenuHeader>Encryption</MenuHeader>
        <RoomEncryption roomId={roomId} />
      </div>
      <div className="room-settings__card">
        <MenuHeader>Message history visibility</MenuHeader>
        <RoomHistoryVisibility roomId={roomId} />
      </div>
    </>
  );
}
SecuritySettings.propTypes = {
  roomId: PropTypes.string.isRequired,
};

const tabItems = [
  {
    text: tabText.GENERAL,
    iconSrc: SettingsIC,
    disabled: false,
    render: (roomId) => <GeneralSettings roomId={roomId} />,
  },
  {
    text: tabText.SEARCH,
    iconSrc: SearchIC,
    disabled: false,
    render: (roomId) => <RoomSearch roomId={roomId} />,
  },
  {
    text: tabText.MEMBERS,
    iconSrc: UserIC,
    disabled: false,
    render: (roomId) => <RoomMembers roomId={roomId} />,
  },
  {
    text: tabText.EMOJIS,
    iconSrc: EmojiIC,
    disabled: false,
    render: (roomId) => <RoomEmojis roomId={roomId} />,
  },
  {
    text: tabText.PERMISSIONS,
    iconSrc: ShieldUserIC,
    disabled: false,
    render: (roomId) => <RoomPermissions roomId={roomId} />,
  },
  {
    text: tabText.SECURITY,
    iconSrc: LockIC,
    disabled: false,
    render: (roomId) => <SecuritySettings roomId={roomId} />,
  },
];

function RoomSettings({ roomId }) {
  const [, forceUpdate] = useForceUpdate();
  const [selectedTab, setSelectedTab] = useState(tabItems[0]);
  const room = initMatrix.matrixClient.getRoom(roomId);

  const handleTabChange = (tabItem) => {
    setSelectedTab(tabItem);
  };

  useEffect(() => {
    let mounted = true;
    const settingsToggle = (isVisible, tab) => {
      if (!mounted) return;
      if (isVisible) {
        const tabItem = tabItems.find((item) => item.text === tab);
        if (tabItem) setSelectedTab(tabItem);
        forceUpdate();
      } else setTimeout(() => forceUpdate(), 200);
    };
    navigation.on(cons.events.navigation.ROOM_SETTINGS_TOGGLED, settingsToggle);
    return () => {
      mounted = false;
      navigation.removeListener(cons.events.navigation.ROOM_SETTINGS_TOGGLED, settingsToggle);
    };
  }, [forceUpdate]);

  if (!navigation.isRoomSettings) return null;

  return (
    <div className="room-settings">
      <Header>
        <IconButton
          src={BackArrowIC}
          className={`room-settings__back-btn${
            selectedTab === undefined ? ' room-settings__back-btn-hidden' : ''
          }`}
          tooltip="Return to list"
          onClick={() => setSelectedTab(undefined)}
        />
        <button
          className="room-settings__header-btn"
          onClick={() => {
            toggleRoomSettings();
          }}
          type="button"
          onMouseUp={(e) => blurOnBubbling(e, '.room-settings__header-btn')}
        >
          <TitleWrapper>
            <Text variant="s1" weight="medium" primary>
              {`${room.name}`}
              <span style={{ color: 'var(--tc-surface-low)' }}> — room settings</span>
            </Text>
          </TitleWrapper>
          <RawIcon size="small" src={ChevronTopIC} />
        </button>
      </Header>
      <div className="room-settings__content">
        <Tabs
          items={tabItems}
          defaultSelected={tabItems.findIndex((item) => item.text === selectedTab?.text)}
          onSelect={handleTabChange}
          data={roomId}
        />
      </div>
    </div>
  );
}

RoomSettings.propTypes = {
  roomId: PropTypes.string.isRequired,
};

export default RoomSettings;
export { tabText };
