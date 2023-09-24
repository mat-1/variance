import { openSearch, toggleRoomSettings } from '../action/navigation';
import navigation from '../state/navigation';
import { markAsRead } from '../action/notifications';

function shouldFocusMessageField(code) {
  // do not focus on F keys
  if (/^F\d+$/.test(code)) return false;

  // do not focus on numlock/scroll lock
  if (
    code.metaKey ||
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

function listenKeyboard(e: KeyboardEvent) {
  // Ctrl/Cmd +
  if (e.ctrlKey || e.metaKey) {
    // open search modal
    if (e.key === 'k') {
      e.preventDefault();
      if (navigation.isRawModalVisible) return;
      openSearch();
    }

    // focus message field on paste
    if (e.key === 'v') {
      if (navigation.isRawModalVisible) return;
      const msgTextarea = document.getElementById('message-textarea');
      const { activeElement } = document;
      if (
        activeElement !== msgTextarea &&
        ['input', 'textarea'].includes(activeElement.tagName.toLowerCase())
      )
        return;
      msgTextarea?.focus();
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

    if (['input', 'textarea'].includes(document.activeElement.tagName.toLowerCase())) {
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

function initHotkeys() {
  document.body.addEventListener('keydown', listenKeyboard);
}

function removeHotkeys() {
  document.body.removeEventListener('keydown', listenKeyboard);
}

export { initHotkeys, removeHotkeys };
