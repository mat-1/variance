import { VerificationRequest } from 'matrix-js-sdk/lib/crypto-api';
import { EmojiData } from '../../app/organisms/emoji-board/EmojiBoard';
import appDispatcher from '../dispatcher';
import cons from '../state/cons';
import { TargetDevice } from '../../app/organisms/emoji-verification/EmojiVerification';

export function selectTab(tabId: string) {
  appDispatcher.dispatch({
    type: cons.actions.navigation.SELECT_TAB,
    tabId,
  });
}

export function selectSpace(roomId: string) {
  appDispatcher.dispatch({
    type: cons.actions.navigation.SELECT_SPACE,
    roomId,
  });
}

export function selectRoom(roomId: string, eventId?: string, threadId?: string) {
  appDispatcher.dispatch({
    type: cons.actions.navigation.SELECT_ROOM,
    roomId,
    eventId,
    threadId,
  });
}

// Open navigation on compact screen sizes
export function openNavigation() {
  appDispatcher.dispatch({
    type: cons.actions.navigation.OPEN_NAVIGATION,
  });
}

export function openSpaceSettings(roomId: string, tabText: string) {
  appDispatcher.dispatch({
    type: cons.actions.navigation.OPEN_SPACE_SETTINGS,
    roomId,
    tabText,
  });
}

export function openSpaceManage(roomId: string) {
  appDispatcher.dispatch({
    type: cons.actions.navigation.OPEN_SPACE_MANAGE,
    roomId,
  });
}

export function openSpaceAddExisting(roomId: string) {
  appDispatcher.dispatch({
    type: cons.actions.navigation.OPEN_SPACE_ADDEXISTING,
    roomId,
  });
}

export function toggleRoomSettings(tabText: string) {
  appDispatcher.dispatch({
    type: cons.actions.navigation.TOGGLE_ROOM_SETTINGS,
    tabText,
  });
}

export function openShortcutSpaces() {
  appDispatcher.dispatch({
    type: cons.actions.navigation.OPEN_SHORTCUT_SPACES,
  });
}

export function openInviteList() {
  appDispatcher.dispatch({
    type: cons.actions.navigation.OPEN_INVITE_LIST,
  });
}

export function openPublicRooms(searchTerm: string) {
  appDispatcher.dispatch({
    type: cons.actions.navigation.OPEN_PUBLIC_ROOMS,
    searchTerm,
  });
}

export function openCreateRoom(isSpace: boolean = false, parentId: string | null = null) {
  appDispatcher.dispatch({
    type: cons.actions.navigation.OPEN_CREATE_ROOM,
    isSpace,
    parentId,
  });
}

export function openJoinAlias(term: string) {
  appDispatcher.dispatch({
    type: cons.actions.navigation.OPEN_JOIN_ALIAS,
    term,
  });
}

export function openInviteUser(roomId: string, searchTerm: string) {
  appDispatcher.dispatch({
    type: cons.actions.navigation.OPEN_INVITE_USER,
    roomId,
    searchTerm,
  });
}

export function openProfileViewer(userId: string, roomId: string) {
  appDispatcher.dispatch({
    type: cons.actions.navigation.OPEN_PROFILE_VIEWER,
    userId,
    roomId,
  });
}

export function openSettings(tabText: string) {
  appDispatcher.dispatch({
    type: cons.actions.navigation.OPEN_SETTINGS,
    tabText,
  });
}

export function openEmojiBoard(
  cords,
  requestEmojiCallback: (emoji: EmojiData) => void,
  allowTextReactions: boolean,
) {
  appDispatcher.dispatch({
    type: cons.actions.navigation.OPEN_EMOJIBOARD,
    cords,
    requestEmojiCallback,
    allowTextReactions,
  });
}

export function openReadReceipts(roomId: string, userIds: string[]) {
  appDispatcher.dispatch({
    type: cons.actions.navigation.OPEN_READRECEIPTS,
    roomId,
    userIds,
  });
}

export function openViewSource(event: string) {
  appDispatcher.dispatch({
    type: cons.actions.navigation.OPEN_VIEWSOURCE,
    event,
  });
}

export function replyTo(userId: string, eventId: string, body: string, formattedBody: string) {
  appDispatcher.dispatch({
    type: cons.actions.navigation.CLICK_REPLY_TO,
    userId,
    eventId,
    body,
    formattedBody,
  });
}

export function openSearch(term: string) {
  appDispatcher.dispatch({
    type: cons.actions.navigation.OPEN_SEARCH,
    term,
  });
}

export function openReusableContextMenu(
  placement: 'top' | 'right' | 'bottom' | 'left',
  cords,
  render,
  afterClose?,
) {
  appDispatcher.dispatch({
    type: cons.actions.navigation.OPEN_REUSABLE_CONTEXT_MENU,
    placement,
    cords,
    render,
    afterClose,
  });
}

export function openReusableDialog(title, render, afterClose) {
  appDispatcher.dispatch({
    type: cons.actions.navigation.OPEN_REUSABLE_DIALOG,
    title,
    render,
    afterClose,
  });
}

export function openEmojiVerification(request: VerificationRequest, targetDevice: TargetDevice) {
  appDispatcher.dispatch({
    type: cons.actions.navigation.OPEN_EMOJI_VERIFICATION,
    request,
    targetDevice,
  });
}
