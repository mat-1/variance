/* eslint-disable no-restricted-globals */
/* eslint-disable no-useless-return */

import { openSearch, toggleRoomSettings } from '../action/navigation';
import navigation from '../state/navigation';
import { markAsRead } from '../action/notifications';

let hotkeysInitialized = false;
function initHotkeys() {
  if (hotkeysInitialized) removeHotkeys();
  hotkeysInitialized = true;

  document.body.addEventListener('keydown', listenKeyboard);

  // detect browser forward and back
  window.addEventListener('popstate', listenPopState);
  history.pushState({ back: true }, '', '');
  history.pushState({ present: true }, '', '');
  history.pushState({ forward: true }, '', '');
  history.back();
}

function removeHotkeys() {
  document.body.removeEventListener('keydown', listenKeyboard);
  window.removeEventListener('popstate', listenPopState);

  hotkeysInitialized = false;
}

function listenKeyboard(e: KeyboardEvent) {
  // Ctrl/Cmd +
  if (e.ctrlKey || e.metaKey) {
    // open search modal
    if (e.key === 'k') {
      e.preventDefault();
      if (navigation.isRawModalVisible) return;
      openSearch('');
    }

    // focus message field on paste
    if (e.key === 'v') {
      if (navigation.isRawModalVisible) return;
      const msgTextarea = document.getElementById('message-textarea');
      const { activeElement } = document;
      if (
        activeElement &&
        activeElement !== msgTextarea &&
        ['input', 'textarea'].includes(activeElement.tagName.toLowerCase())
      )
        return;
      msgTextarea?.focus();
    }
  }

  function navigateRoomSelector(direction: 'up' | 'down') {
    // find the room-selector--selected and then select the one before/after it

    const selectedRoomSelector = document.querySelector('.room-selector--selected');
    const allRoomSelectors = document.querySelectorAll('.room-selector');

    if (selectedRoomSelector) {
      const selectedRoomIndex = Array.from(allRoomSelectors).indexOf(selectedRoomSelector);
      const nextRoomSelector = allRoomSelectors[
        selectedRoomIndex + (direction === 'up' ? -1 : 1)
      ] as HTMLDivElement;
      if (nextRoomSelector) {
        // click the inner .room-selector__content
        const roomSelectorContent = nextRoomSelector.querySelector(
          '.room-selector__content',
        ) as HTMLDivElement;
        roomSelectorContent.click();
        // scroll the room into view
        nextRoomSelector.scrollIntoView({
          behavior: 'instant',
          block: 'nearest',
          inline: 'nearest',
        });
      }
    }
  }
  function navigateSpaceSelector(index: number) {
    const allSpaceSelectors = document.querySelectorAll('.sidebar-avatar');
    // skip the first one for consistency with discord since it's "Home"
    const spaceIndex = index + 1;

    const spaceSelector = allSpaceSelectors[spaceIndex] as HTMLDivElement;
    if (spaceSelector) spaceSelector.click();
  }

  if (e.altKey) {
    // alt + arrow navigates rooms
    if (e.key === 'ArrowUp') {
      navigateRoomSelector('up');
      return;
    }
    if (e.key === 'ArrowDown') {
      navigateRoomSelector('down');
      return;
    }
  }

  if (e.ctrlKey) {
    // ctrl + number navigates spaces
    if (Number.isInteger(+e.key)) {
      const index = +e.key - 1;
      navigateSpaceSelector(index);
      return;
    }
  }

  if (!e.ctrlKey && !e.altKey && !e.metaKey) {
    if (navigation.isRawModalVisible) return;

    if (e.key === 'Escape') {
      if (navigation.isRoomSettings) {
        toggleRoomSettings();
        return;
      }
      if (navigation.selectedRoomId) {
        markAsRead(navigation.selectedRoomId);
        return;
      }
    }

    if (
      document.activeElement &&
      ['input', 'textarea'].includes(document.activeElement.tagName.toLowerCase())
    ) {
      return;
    }

    // focus the text field on most keypresses
    if (shouldFocusMessageField(e.code)) {
      // press any key to focus and type in message field
      const msgTextarea = document.getElementsByClassName(
        'markdown-input__editable',
      )?.[0] as HTMLTextAreaElement;
      msgTextarea?.focus();
    }
  }
}

function shouldFocusMessageField(code: string) {
  // do not focus on F keys
  if (/^F\d+$/.test(code)) return false;

  // do not focus on numlock/scroll lock
  if (
    code.startsWith('OS') ||
    code.startsWith('Meta') ||
    code.startsWith('Shift') ||
    code.startsWith('Alt') ||
    code.startsWith('Control') ||
    code.startsWith('Arrow') ||
    code === 'Tab' ||
    code === 'Space' ||
    code === 'Enter' ||
    code === 'NumLock' ||
    code === 'ScrollLock'
  ) {
    return false;
  }

  return true;
}

function listenPopState(e: PopStateEvent) {
  if (e.state.forward) {
    history.go(-1);

    handleBrowserForward();
  } else if (e.state.back) {
    history.go(1);

    handleBrowserBack();
  }
}

function handleBrowserForward() {
  // open members list room-header__members-btn
  const membersBtnEl = document.querySelector('.room-header__members-btn') as HTMLDivElement | null;
  if (membersBtnEl && membersBtnEl.checkVisibility()) {
    membersBtnEl.click();
    return;
  }

  // open the current room room-selector--selected
  const selectedRoomEl = document.querySelector(
    '.room-selector--selected .room-selector__content',
  ) as HTMLDivElement | null;
  const roomWrapperEl = document.querySelector('.room__wrapper') as HTMLDivElement | null;
  if (
    selectedRoomEl &&
    selectedRoomEl.checkVisibility() &&
    (!roomWrapperEl || !roomWrapperEl.checkVisibility())
  ) {
    selectedRoomEl.click();
    return;
  }

  navigation._navigateForward();
}

function handleBrowserBack() {
  // close room settings if open
  const roomViewDroppedEl = document.querySelector(
    '.room-settings__header-btn',
  ) as HTMLDivElement | null;
  if (roomViewDroppedEl && roomViewDroppedEl.checkVisibility()) {
    roomViewDroppedEl.click();
    return;
  }

  // open the drawer if the button is visible
  const roomHeaderBackBtnEl = document.querySelector(
    '.room-header__back-btn',
  ) as HTMLDivElement | null;
  if (roomHeaderBackBtnEl && roomHeaderBackBtnEl.checkVisibility()) {
    roomHeaderBackBtnEl.click();
    return;
  }

  navigation._navigateBack();
}

export { initHotkeys, removeHotkeys };
