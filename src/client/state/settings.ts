import EventEmitter from 'events';
import appDispatcher from '../dispatcher';

import cons from './cons';
import { ThemeSettings } from './themes/themeSettings';
import { loadThemeFromUrl } from './themes/loadTheme';

function getSettings(): Record<string, unknown> | null {
  const settings = localStorage.getItem('settings');
  if (settings === null) return null;
  return JSON.parse(settings);
}

function setSettings(key: string, value: unknown) {
  let settings = getSettings();
  if (settings === null) settings = {};
  settings[key] = value;
  localStorage.setItem('settings', JSON.stringify(settings));
}

class Settings extends EventEmitter {
  isTouchScreenDevice: boolean;

  themeSettings: ThemeSettings;

  isMarkdown: boolean;

  isPeopleDrawer: boolean;

  hideMembershipEvents: boolean;

  hideNickAvatarEvents: boolean;

  sendMessageOnEnter: boolean;

  onlyAnimateOnHover: boolean;

  _showNotifications: boolean;

  isNotificationSounds: boolean;

  showRoomListAvatar: boolean;

  showYoutubeEmbedPlayer: boolean;

  showUrlPreview: boolean;

  sendReadReceipts: boolean;

  clearUrls: boolean;

  constructor() {
    super();

    this.isTouchScreenDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    this.themeSettings = this.getThemeSettings();

    this.isMarkdown = this.getIsMarkdown();
    this.isPeopleDrawer = this.getIsPeopleDrawer();
    this.hideMembershipEvents = this.getHideMembershipEvents();
    this.hideNickAvatarEvents = this.getHideNickAvatarEvents();
    this.sendMessageOnEnter = this.getSendOnEnter();
    this.onlyAnimateOnHover = this.getOnlyAnimateOnHover();
    this._showNotifications = this.getShowNotifications();
    this.isNotificationSounds = this.getIsNotificationSounds();
    this.showRoomListAvatar = this.getShowRoomListAvatar();
    this.showYoutubeEmbedPlayer = this.getShowYoutubeEmbedPlayer();
    this.showUrlPreview = this.getShowUrlPreview();
    this.sendReadReceipts = this.getSendReadReceipts();
    this.clearUrls = this.getClearUrls();
  }

  getThemeSettings(): ThemeSettings {
    if (this.themeSettings !== undefined) return this.themeSettings;

    const settings = getSettings();
    const themeSettings = ThemeSettings.fromSettings(settings ?? {});

    return themeSettings;
  }

  updateThemeSettings(): void {
    const settings = this.getThemeSettings().toSettings();

    Object.entries(settings).forEach(([key, value]) => {
      setSettings(key, value);
    });
  }

  setThemeId(themeId: string): void {
    this.themeSettings.setThemeId(themeId);
    this.updateThemeSettings();
    this.themeSettings.applyTheme();
  }

  async setCustomThemeUrl(url: string) {
    this.themeSettings.setCustomThemeUrl(url);
    // save here so if loading the theme fails then the url is still saved
    this.updateThemeSettings();
    const themeStyle = await loadThemeFromUrl(url);
    this.themeSettings.setCustomThemeStyle(themeStyle);
    this.themeSettings.applyTheme();
    this.updateThemeSettings();
  }

  toggleUseSystemTheme() {
    this.themeSettings.useSystemTheme = !this.themeSettings.useSystemTheme;
    this.updateThemeSettings();
    this.themeSettings.applyTheme();

    this.emit(cons.events.settings.SYSTEM_THEME_TOGGLED, this.themeSettings.useSystemTheme);
  }

  getIsMarkdown(): boolean {
    if (typeof this.isMarkdown === 'boolean') return this.isMarkdown;

    const settings = getSettings();
    if (settings === null) return true;
    if (typeof settings.isMarkdown !== 'boolean') return true;
    return settings.isMarkdown;
  }

  getHideMembershipEvents(): boolean {
    if (typeof this.hideMembershipEvents === 'boolean') return this.hideMembershipEvents;

    const settings = getSettings();
    if (settings === null) return false;
    if (typeof settings.hideMembershipEvents !== 'boolean') return false;
    return settings.hideMembershipEvents;
  }

  getHideNickAvatarEvents(): boolean {
    if (typeof this.hideNickAvatarEvents === 'boolean') return this.hideNickAvatarEvents;

    const settings = getSettings();
    if (settings === null) return true;
    if (typeof settings.hideNickAvatarEvents !== 'boolean') return true;
    return settings.hideNickAvatarEvents;
  }

  getSendOnEnter(): boolean {
    if (typeof this.sendMessageOnEnter === 'boolean') return this.sendMessageOnEnter;

    const settings = getSettings();

    const defaultSendOnEnter = !this.isTouchScreenDevice;

    if (settings === null) return defaultSendOnEnter;
    if (typeof settings.sendMessageOnEnter !== 'boolean') return defaultSendOnEnter;
    return settings.sendMessageOnEnter;
  }

  getOnlyAnimateOnHover(): boolean {
    if (typeof this.onlyAnimateOnHover === 'boolean') return this.onlyAnimateOnHover;

    const settings = getSettings();
    if (settings === null) return true;
    if (typeof settings.onlyAnimateOnHover !== 'boolean') return true;
    return settings.onlyAnimateOnHover;
  }

  getIsPeopleDrawer(): boolean {
    if (typeof this.isPeopleDrawer === 'boolean') return this.isPeopleDrawer;

    const settings = getSettings();
    if (settings === null) return true;
    if (typeof settings.isPeopleDrawer !== 'boolean') return true;
    return settings.isPeopleDrawer;
  }

  get showNotifications(): boolean {
    if (window.Notification?.permission !== 'granted') return false;
    return this._showNotifications;
  }

  getShowNotifications(): boolean {
    if (typeof this._showNotifications === 'boolean') return this._showNotifications;

    const settings = getSettings();
    if (settings === null) return true;
    if (typeof settings.showNotifications !== 'boolean') return true;
    return settings.showNotifications;
  }

  getIsNotificationSounds(): boolean {
    if (typeof this.isNotificationSounds === 'boolean') return this.isNotificationSounds;

    const settings = getSettings();
    if (settings === null) return true;
    if (typeof settings.isNotificationSounds !== 'boolean') return true;
    return settings.isNotificationSounds;
  }

  toggleShowRoomListAvatar() {
    this.showRoomListAvatar = !this.showRoomListAvatar;
    setSettings('showRoomListAvatar', this.showRoomListAvatar);

    this.emit(cons.events.settings.SHOW_ROOM_LIST_AVATAR_TOGGLED, this.showRoomListAvatar);
  }

  getShowRoomListAvatar(): boolean {
    if (typeof this.showRoomListAvatar === 'boolean') return this.showRoomListAvatar;

    const settings = getSettings();
    if (settings === null) return false;
    if (typeof settings.showRoomListAvatar !== 'boolean') return false;
    return settings.showRoomListAvatar;
  }

  toggleShowYoutubeEmbedPlayer() {
    this.showYoutubeEmbedPlayer = !this.showYoutubeEmbedPlayer;
    setSettings('showYoutubeEmbedPlayer', this.showYoutubeEmbedPlayer);

    this.emit(cons.events.settings.SHOW_YOUTUBE_EMBED_PLAYER_TOGGLED, this.showYoutubeEmbedPlayer);
  }

  getShowYoutubeEmbedPlayer(): boolean {
    if (typeof this.showYoutubeEmbedPlayer === 'boolean') return this.showYoutubeEmbedPlayer;

    const settings = getSettings();
    if (settings === null) return false;
    if (typeof settings.showYoutubeEmbedPlayer !== 'boolean') return false;
    return settings.showYoutubeEmbedPlayer;
  }

  toggleShowUrlPreview() {
    this.showUrlPreview = !this.showUrlPreview;
    setSettings('showUrlPreview', this.showUrlPreview);

    this.emit(cons.events.settings.SHOW_URL_PREVIEW_TOGGLED, this.showUrlPreview);
  }

  getShowUrlPreview(): boolean {
    if (typeof this.showUrlPreview === 'boolean') return this.showUrlPreview;

    const settings = getSettings();
    if (settings === null) return false;
    if (typeof settings.showUrlPreview !== 'boolean') return false;
    return settings.showUrlPreview;
  }

  getSendReadReceipts(): boolean {
    if (typeof this.sendReadReceipts === 'boolean') return this.sendReadReceipts;

    const settings = getSettings();
    if (settings === null) return true;
    if (typeof settings.sendReadReceipts !== 'boolean') return true;
    return settings.sendReadReceipts;
  }

  getClearUrls(): boolean {
    if (typeof this.clearUrls === 'boolean') return this.clearUrls;

    const settings = getSettings();
    if (settings === null) return true;
    if (typeof settings.clearUrls !== 'boolean') return true;
    return settings.clearUrls;
  }

  setter(action: { type: string }) {
    const actions = {
      [cons.actions.settings.TOGGLE_SYSTEM_THEME]: () => {
        this.toggleUseSystemTheme();
      },
      [cons.actions.settings.TOGGLE_MARKDOWN]: () => {
        this.isMarkdown = !this.isMarkdown;
        setSettings('isMarkdown', this.isMarkdown);
        this.emit(cons.events.settings.MARKDOWN_TOGGLED, this.isMarkdown);
      },
      [cons.actions.settings.TOGGLE_PEOPLE_DRAWER]: () => {
        this.isPeopleDrawer = !this.isPeopleDrawer;
        setSettings('isPeopleDrawer', this.isPeopleDrawer);
        this.emit(cons.events.settings.PEOPLE_DRAWER_TOGGLED, this.isPeopleDrawer);
      },
      [cons.actions.settings.TOGGLE_MEMBERSHIP_EVENT]: () => {
        this.hideMembershipEvents = !this.hideMembershipEvents;
        setSettings('hideMembershipEvents', this.hideMembershipEvents);
        this.emit(cons.events.settings.MEMBERSHIP_EVENTS_TOGGLED, this.hideMembershipEvents);
      },
      [cons.actions.settings.TOGGLE_NICKAVATAR_EVENT]: () => {
        this.hideNickAvatarEvents = !this.hideNickAvatarEvents;
        setSettings('hideNickAvatarEvents', this.hideNickAvatarEvents);
        this.emit(cons.events.settings.NICKAVATAR_EVENTS_TOGGLED, this.hideNickAvatarEvents);
      },
      [cons.actions.settings.TOGGLE_SEND_MESSAGE_ON_ENTER]: () => {
        this.sendMessageOnEnter = !this.sendMessageOnEnter;
        setSettings('sendMessageOnEnter', this.sendMessageOnEnter);
        this.emit(cons.events.settings.SEND_ON_ENTER_TOGGLED, this.sendMessageOnEnter);
      },
      [cons.actions.settings.TOGGLE_ONLY_ANIMATE_ON_HOVER]: () => {
        this.onlyAnimateOnHover = !this.onlyAnimateOnHover;
        setSettings('onlyAnimateOnHover', this.onlyAnimateOnHover);
        this.emit(cons.events.settings.ONLY_ANIMATE_ON_HOVER_TOGGLED, this.onlyAnimateOnHover);
      },
      [cons.actions.settings.TOGGLE_NOTIFICATIONS]: async () => {
        if (window.Notification?.permission !== 'granted') {
          this._showNotifications = false;
        } else {
          this._showNotifications = !this._showNotifications;
        }
        setSettings('showNotifications', this._showNotifications);
        this.emit(cons.events.settings.NOTIFICATIONS_TOGGLED, this._showNotifications);
      },
      [cons.actions.settings.TOGGLE_NOTIFICATION_SOUNDS]: () => {
        this.isNotificationSounds = !this.isNotificationSounds;
        setSettings('isNotificationSounds', this.isNotificationSounds);
        this.emit(cons.events.settings.NOTIFICATION_SOUNDS_TOGGLED, this.isNotificationSounds);
      },
      [cons.actions.settings.TOGGLE_SHOW_ROOM_LIST_AVATAR]: () => {
        this.toggleShowRoomListAvatar();
      },
      [cons.actions.settings.TOGGLE_SHOW_YOUTUBE_EMBED_PLAYER]: () => {
        this.toggleShowYoutubeEmbedPlayer();
      },
      [cons.actions.settings.TOGGLE_SHOW_URL_PREVIEW]: () => {
        this.toggleShowUrlPreview();
      },
      [cons.actions.settings.TOGGLE_READ_RECEIPTS]: () => {
        this.sendReadReceipts = !this.sendReadReceipts;
        setSettings('sendReadReceipts', this.sendReadReceipts);
        this.emit(cons.events.settings.READ_RECEIPTS_TOGGLED, this.sendReadReceipts);
      },
      [cons.actions.settings.TOGGLE_CLEAR_URLS]: () => {
        this.clearUrls = !this.clearUrls;
        setSettings('clearUrls', this.clearUrls);
        this.emit(cons.events.settings.CLEAR_URLS_TOGGLED, this.clearUrls);
      },
    };

    actions[action.type]?.();
  }
}

const settings = new Settings();
appDispatcher.register(settings.setter.bind(settings));

export default settings;
