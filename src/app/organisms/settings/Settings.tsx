import React, { useState, useEffect } from 'react';
import './Settings.scss';

import initMatrix from '../../../client/initMatrix';
import cons from '../../../client/state/cons';
import settings from '../../../client/state/settings';
import navigation from '../../../client/state/navigation';
import {
  toggleSystemTheme,
  toggleMarkdown,
  toggleMembershipEvents,
  toggleNickAvatarEvents,
  toggleNotifications,
  toggleNotificationSounds,
  toggleSendMessageOnEnter,
  toggleOnlyAnimateOnHover,
  toggleShowRoomListAvatar,
  toggleShowYoutubeEmbedPlayer,
  toggleShowUrlPreview,
  toggleReadReceipts,
  toggleClearUrls,
} from '../../../client/action/settings';
import { usePermission } from '../../hooks/usePermission';

import Text from '../../atoms/text/Text';
import IconButton from '../../atoms/button/IconButton';
import Button from '../../atoms/button/Button';
import Toggle from '../../atoms/button/Toggle';
import Tabs, { ITabItem } from '../../atoms/tabs/Tabs';
import { MenuHeader } from '../../atoms/context-menu/ContextMenu';
import SegmentedControls from '../../atoms/segmented-controls/SegmentedControls';

import PopupWindow from '../../molecules/popup-window/PopupWindow';
import SettingTile from '../../molecules/setting-tile/SettingTile';
import ImportE2ERoomKeys from '../../molecules/import-export-e2e-room-keys/ImportE2ERoomKeys';
import ExportE2ERoomKeys from '../../molecules/import-export-e2e-room-keys/ExportE2ERoomKeys';
import { ImagePackUser, ImagePackGlobal } from '../../molecules/image-pack/ImagePack';
import GlobalNotification from '../../molecules/global-notification/GlobalNotification';
import KeywordNotification from '../../molecules/global-notification/KeywordNotification';
import IgnoreUserList from '../../molecules/global-notification/IgnoreUserList';

import ProfileEditor from '../profile-editor/ProfileEditor';
import CrossSigning from './CrossSigning';
import KeyBackup from './KeyBackup';
import DeviceManage from './DeviceManage';

import SunIC from '../../../../public/res/ic/outlined/sun.svg';
import UserIC from '../../../../public/res/ic/outlined/user.svg';
import EmojiIC from '../../../../public/res/ic/outlined/emoji.svg';
import LockIC from '../../../../public/res/ic/outlined/lock.svg';
import BellIC from '../../../../public/res/ic/outlined/bell.svg';
import InfoIC from '../../../../public/res/ic/outlined/info.svg';
import PowerIC from '../../../../public/res/ic/outlined/power.svg';
import CrossIC from '../../../../public/res/ic/outlined/cross.svg';
import AccessibilityIC from '../../../../public/res/ic/outlined/accessibility.svg';
import BackArrowIC from '../../../../public/res/ic/outlined/chevron-left.svg';
import ShieldUserIC from '../../../../public/res/ic/outlined/shield-user.svg';

import CinnySVG from '../../../../public/res/svg/cinny.svg';
import { confirmDialog } from '../../molecules/confirm-dialog/ConfirmDialog';
import Input from '../../atoms/input/Input';

let capabilities = {
  privateReadReceipts: false,
};

function AccountSection() {
  return (
    <div className="settings-account">
      <div className="settings-account__card">
        <MenuHeader>Profile</MenuHeader>
        <ProfileEditor userId={initMatrix.matrixClient.getUserId()} />
      </div>
    </div>
  );
}

function AppearanceSection() {
  const [, updateState] = useState({});

  function handleLoadThemeFromUrl(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const url = formData.get('url') as string;

    settings.setCustomThemeUrl(url);

    updateState({});
  }

  return (
    <div className="settings-appearance">
      <div className="settings-appearance__card">
        <MenuHeader>Theme</MenuHeader>
        <SettingTile
          title="Follow system theme"
          options={
            <Toggle
              isActive={settings.themeSettings.useSystemTheme}
              onToggle={() => {
                toggleSystemTheme();
                updateState({});
              }}
            />
          }
          content={<Text variant="b3">Use light or dark mode based on the system settings.</Text>}
        />
        <SettingTile
          title="Theme"
          content={
            <>
              <SegmentedControls
                selectedId={settings.themeSettings.getThemeId()}
                segments={Array.from(settings.themeSettings.themeIdToName).map(
                  ([themeId, themeName]) => ({
                    text: themeName,
                    id: themeId,
                  }),
                )}
                onSelect={(themeId: string) => {
                  if (settings.themeSettings.useSystemTheme) toggleSystemTheme();
                  settings.setThemeId(themeId);
                  updateState({});
                }}
              />
              {settings.themeSettings.getThemeId() === 'custom' && (
                <form
                  className="settings-appearance__load-theme-from-url-form"
                  onSubmit={handleLoadThemeFromUrl}
                >
                  <Input
                    label="Load theme from URL (uses Element's theme format)"
                    name="url"
                    value={settings.themeSettings.getCustomThemeUrl()}
                  />
                  <Button
                    variant="primary"
                    type="submit"
                    className="settings-appearance__load-theme-from-url-btn"
                  >
                    Load
                  </Button>
                </form>
              )}
            </>
          }
        />
        <SettingTile
          title="Show room-list avatar"
          options={
            <Toggle
              isActive={settings.showRoomListAvatar}
              onToggle={() => {
                toggleShowRoomListAvatar();
                updateState({});
              }}
            />
          }
          content={<Text variant="b3">Will show room avatars in the room list.</Text>}
        />
      </div>
      <div className="settings-appearance__card">
        <MenuHeader>URL Previews</MenuHeader>
        <SettingTile
          title="Show URL previews"
          options={
            <Toggle
              isActive={settings.showUrlPreview}
              onToggle={() => {
                toggleShowUrlPreview();
                updateState({});
              }}
            />
          }
          content={<Text variant="b3">Show additional info about URLs.</Text>}
        />
        <SettingTile
          title="Show YouTube embed player"
          options={
            <Toggle
              isActive={settings.showYoutubeEmbedPlayer}
              onToggle={() => {
                toggleShowYoutubeEmbedPlayer();
                updateState({});
              }}
              disabled={!settings.showUrlPreview}
            />
          }
          content={<Text variant="b3">Will show a YouTube embed player for youtube links.</Text>}
        />
      </div>
      <div className="settings-appearance__card">
        <MenuHeader>Room messages</MenuHeader>
        <SettingTile
          title="Markdown formatting"
          options={
            <Toggle
              isActive={settings.isMarkdown}
              onToggle={() => {
                toggleMarkdown();
                updateState({});
              }}
            />
          }
          content={<Text variant="b3">Format messages with markdown syntax before sending.</Text>}
        />
        <SettingTile
          title="Hide membership events"
          options={
            <Toggle
              isActive={settings.hideMembershipEvents}
              onToggle={() => {
                toggleMembershipEvents();
                updateState({});
              }}
            />
          }
          content={
            <Text variant="b3">
              Hide membership change messages from room timeline. (Join, Leave, Invite, Kick and
              Ban)
            </Text>
          }
        />
        <SettingTile
          title="Hide nick/avatar events"
          options={
            <Toggle
              isActive={settings.hideNickAvatarEvents}
              onToggle={() => {
                toggleNickAvatarEvents();
                updateState({});
              }}
            />
          }
          content={
            <Text variant="b3">Hide nick and avatar change messages from room timeline.</Text>
          }
        />
      </div>
    </div>
  );
}

function AccessibilitySection() {
  const [, updateState] = useState({});

  return (
    <div className="settings-accessibility">
      <div className="settings-accessibility__card">
        <MenuHeader>Chat input</MenuHeader>
        <SettingTile
          title="Send message on enter"
          options={
            <Toggle
              isActive={settings.sendMessageOnEnter}
              onToggle={() => {
                toggleSendMessageOnEnter();
                updateState({});
              }}
            />
          }
          content={<Text variant="b3">Send the typed message when the enter key is pressed.</Text>}
        />
      </div>

      <div className="settings-accessibility__card">
        <MenuHeader>Animations</MenuHeader>
        <SettingTile
          title="Only animate GIFs on hover"
          options={
            <Toggle
              isActive={settings.onlyAnimateOnHover}
              onToggle={() => {
                toggleOnlyAnimateOnHover();
                updateState({});
              }}
            />
          }
          content={
            <Text variant="b3">Play animations only when the mouse is hovering over them.</Text>
          }
        />
      </div>
    </div>
  );
}

function NotificationsSection() {
  const [permission, setPermission] = usePermission(
    'notifications',
    window.Notification?.permission,
  );

  const [, updateState] = useState({});

  const renderOptions = () => {
    if (window.Notification === undefined) {
      return (
        <Text className="settings-notifications__not-supported">
          Not supported in this browser.
        </Text>
      );
    }

    if (permission === 'granted') {
      return (
        <Toggle
          isActive={settings._showNotifications}
          onToggle={() => {
            toggleNotifications();
            setPermission(window.Notification?.permission);
            updateState({});
          }}
        />
      );
    }

    return (
      <Button
        variant="primary"
        onClick={() => window.Notification.requestPermission().then(setPermission)}
      >
        Request permission
      </Button>
    );
  };

  return (
    <>
      <div className="settings-notifications">
        <MenuHeader>Notification & Sound</MenuHeader>
        <SettingTile
          title="Desktop notification"
          options={renderOptions()}
          content={<Text variant="b3">Show desktop notification when new messages arrive.</Text>}
        />
        <SettingTile
          title="Notification Sound"
          options={
            <Toggle
              isActive={settings.isNotificationSounds}
              onToggle={() => {
                toggleNotificationSounds();
                updateState({});
              }}
            />
          }
          content={<Text variant="b3">Play sound when new messages arrive.</Text>}
        />
      </div>
      <GlobalNotification />
      <KeywordNotification />
      <IgnoreUserList />
    </>
  );
}

function EmojiSection() {
  return (
    <>
      <div className="settings-emoji__card">
        <ImagePackUser />
      </div>
      <div className="settings-emoji__card">
        <ImagePackGlobal />
      </div>
    </>
  );
}

function SecuritySection() {
  return (
    <div className="settings-security">
      <div className="settings-security__card">
        <MenuHeader>Cross signing and backup</MenuHeader>
        <CrossSigning />
        <KeyBackup />
      </div>
      <DeviceManage />
      <div className="settings-security__card">
        <MenuHeader>Export/Import encryption keys</MenuHeader>
        <SettingTile
          title="Export E2E room keys"
          content={
            <>
              <Text variant="b3">
                Export end-to-end encryption room keys to decrypt old messages in other session. In
                order to encrypt keys you need to set a password, which will be used while
                importing.
              </Text>
              <ExportE2ERoomKeys />
            </>
          }
        />
        <SettingTile
          title="Import E2E room keys"
          content={
            <>
              <Text variant="b3">
                {
                  "To decrypt older messages, Export E2EE room keys from Element (Settings > Security & Privacy > Encryption > Cryptography) and import them here. Imported keys are encrypted so you'll have to enter the password you set in order to decrypt it."
                }
              </Text>
              <ImportE2ERoomKeys />
            </>
          }
        />
      </div>
    </div>
  );
}

function PrivacySection() {
  const [, updateState] = useState({});
  return (
    <div className="settings-privacy">
      <div className="settings-security__card">
        <MenuHeader>Presence</MenuHeader>
        <SettingTile
          title="Send read receipts"
          options={
            <Toggle
              /** Always allow to switch receipts on. */
              disabled={!capabilities.privateReadReceipts && settings.sendReadReceipts}
              isActive={settings.sendReadReceipts}
              onToggle={() => {
                toggleReadReceipts();
                updateState({});
              }}
            />
          }
          content={
            <>
              <Text variant="b3">Let other people know what messages you read.</Text>
              {!capabilities.privateReadReceipts && (
                <Text variant="b3">
                  Making your read receipts private requires a compatible homeserver.
                </Text>
              )}
            </>
          }
        />
      </div>

      <div className="settings-security__card">
        <MenuHeader>Messages</MenuHeader>
        <SettingTile
          title="Clear URLs"
          options={
            <Toggle
              /** Always allow to switch receipts on. */
              isActive={settings.clearUrls}
              onToggle={() => {
                toggleClearUrls();
                updateState({});
              }}
            />
          }
          content={
            <Text variant="b3">
              Automatically remove tracking parameters from links you send and receive.
            </Text>
          }
        />
      </div>
    </div>
  );
}

function AboutSection() {
  return (
    <div className="settings-about">
      <div className="settings-about__card">
        <MenuHeader>Application</MenuHeader>
        <div className="settings-about__branding">
          <img width="60" height="60" src={CinnySVG} alt="Variance logo" />
          <div>
            <Text variant="h2" weight="medium">
              Variance
              <span
                className="text text-b3"
                style={{ margin: '0 var(--sp-extra-tight)' }}
              >{`v${cons.version}`}</span>
            </Text>
            <Text>The good Matrix client</Text>

            <div className="settings-about__btns">
              <Button onClick={() => window.open('https://github.com/mat-1/variance')}>
                Source code
              </Button>
              <Button onClick={() => initMatrix.clearCacheAndReload()} variant="danger">
                Clear cache & reload
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="settings-about__card">
        <MenuHeader>Credits</MenuHeader>
        <div className="settings-about__credits">
          <ul>
            <li>
              <Text>
                <a
                  href="https://github.com/cinnyapp/cinny"
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  Cinny
                </a>{' '}
                is ©{' '}
                <a
                  href="https://github.com/cinnyapp/cinny/graphs/contributors"
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  Cinny contributors
                </a>{' '}
                used under the terms of{' '}
                <a
                  href="https://www.gnu.org/licenses/agpl-3.0.en.html"
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  AGPL-3.0
                </a>
                .
              </Text>
            </li>
            <li>
              <Text>
                The{' '}
                <a
                  href="https://github.com/matrix-org/matrix-js-sdk"
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  matrix-js-sdk
                </a>{' '}
                is ©{' '}
                <a href="https://matrix.org/foundation" rel="noreferrer noopener" target="_blank">
                  The Matrix.org Foundation C.I.C
                </a>{' '}
                used under the terms of{' '}
                <a
                  href="http://www.apache.org/licenses/LICENSE-2.0"
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  Apache 2.0
                </a>
                .
              </Text>
            </li>
            <li>
              <Text>
                The{' '}
                <a
                  href="https://github.com/discord/twemoji"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Twemoji
                </a>{' '}
                emoji art is ©{' '}
                <a
                  href="https://github.com/discord/twemoji"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Twitter, Discord, and other contributors
                </a>{' '}
                used under the terms of{' '}
                <a
                  href="https://creativecommons.org/licenses/by/4.0/"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  CC-BY 4.0
                </a>
                .
              </Text>
            </li>
            <li>
              <Text>
                The{' '}
                <a
                  href="https://material.io/design/sound/sound-resources.html"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Material sound resources
                </a>{' '}
                are ©{' '}
                <a href="https://google.com" target="_blank" rel="noreferrer noopener">
                  Google
                </a>{' '}
                used under the terms of{' '}
                <a
                  href="https://creativecommons.org/licenses/by/4.0/"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  CC-BY 4.0
                </a>
                .
              </Text>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export const tabText = {
  ACCOUNT: 'Account',
  APPEARANCE: 'Appearance',
  ACCESSIBILITY: 'Accessibility',
  NOTIFICATIONS: 'Notifications',
  EMOJI: 'Emoji',
  SECURITY: 'Security',
  PRIVACY: 'Privacy',
  ABOUT: 'About',
};
const tabItems: ITabItem<undefined>[] = [
  {
    text: tabText.ACCOUNT,
    iconSrc: UserIC,
    disabled: false,
    render: () => <AccountSection />,
  },
  {
    text: tabText.APPEARANCE,
    iconSrc: SunIC,
    disabled: false,
    render: () => <AppearanceSection />,
  },
  {
    text: tabText.ACCESSIBILITY,
    iconSrc: AccessibilityIC,
    disabled: false,
    render: () => <AccessibilitySection />,
  },
  {
    text: tabText.NOTIFICATIONS,
    iconSrc: BellIC,
    disabled: false,
    render: () => <NotificationsSection />,
  },
  {
    text: tabText.EMOJI,
    iconSrc: EmojiIC,
    disabled: false,
    render: () => <EmojiSection />,
  },
  {
    text: tabText.SECURITY,
    iconSrc: LockIC,
    disabled: false,
    render: () => <SecuritySection />,
  },
  {
    text: tabText.PRIVACY,
    iconSrc: ShieldUserIC,
    disabled: false,
    render: () => <PrivacySection />,
  },
  {
    text: tabText.ABOUT,
    iconSrc: InfoIC,
    disabled: false,
    render: () => <AboutSection />,
  },
];

function useWindowToggle(
  setSelectedTab: (tab: ITabItem<undefined>) => void,
): [boolean, () => void] {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const openSettings = (tab: string) => {
      const tabItem = tabItems.find((item) => item.text === tab);
      if (tabItem) setSelectedTab(tabItem);
      setIsOpen(true);
    };
    navigation.on(cons.events.navigation.SETTINGS_OPENED, openSettings);
    return () => {
      navigation.removeListener(cons.events.navigation.SETTINGS_OPENED, openSettings);
    };
  }, [setSelectedTab]);

  const requestClose = () => setIsOpen(false);

  return [isOpen, requestClose];
}

async function getCapabilities() {
  const mx = initMatrix.matrixClient;
  capabilities = {
    privateReadReceipts: (
      await Promise.all([
        mx.doesServerSupportUnstableFeature('org.matrix.msc2285.stable'),
        mx.isVersionSupported('v1.4'),
      ])
    ).some((res) => res === true),
  };
}

function Settings() {
  const [selectedTab, setSelectedTab] = useState<ITabItem<undefined> | undefined>(tabItems[0]);
  const [isOpen, requestClose] = useWindowToggle(setSelectedTab);

  useEffect(() => {
    getCapabilities();
  }, []);

  const handleTabChange = (tabItem: ITabItem<undefined>) => setSelectedTab(tabItem);
  const handleLogout = async () => {
    if (
      await confirmDialog(
        'Logout',
        'Are you sure that you want to logout your session?',
        'Logout',
        'danger',
      )
    ) {
      initMatrix.logout();
    }
  };

  return (
    <PopupWindow
      isOpen={isOpen}
      className="settings-window"
      title={
        <>
          <IconButton
            src={BackArrowIC}
            className={`settings-window__back-btn${
              selectedTab === undefined ? ' settings-window__back-btn-hidden' : ''
            }`}
            tooltip="Return to list"
            onClick={() => setSelectedTab(undefined)}
          />
          <Text variant="s1" weight="medium" primary>
            Settings
          </Text>
        </>
      }
      contentOptions={
        <>
          <Button variant="danger" iconSrc={PowerIC} onClick={handleLogout}>
            Logout
          </Button>
          <IconButton src={CrossIC} onClick={requestClose} tooltip="Close" />
        </>
      }
      onRequestClose={requestClose}
      extraLarge
    >
      {isOpen && (
        <div className="settings-window__content">
          <Tabs
            items={tabItems}
            defaultSelected={tabItems.findIndex((item) => item.text === selectedTab?.text)}
            onSelect={handleTabChange}
          />
        </div>
      )}
    </PopupWindow>
  );
}

export default Settings;
