import React, { useEffect, useRef, useState } from 'react';

import cons from '../../../client/state/cons';
import navigation from '../../../client/state/navigation';
import settings from '../../../client/state/settings';

import ContextMenu from '../../atoms/context-menu/ContextMenu';
import EmojiBoard, { EmojiData } from './EmojiBoard';

let requestCallback: ((emoji: EmojiData) => void) | null = null;
let isEmojiBoardVisible = false;
function EmojiBoardOpener() {
  const openerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [allowTextReactions, setAllowTextReactions] = useState(false);

  function openEmojiBoard(
    cords,
    requestEmojiCallback: (emoji: EmojiData) => void,
    doAllowTextReactions: boolean,
  ) {
    if (!openerRef.current) {
      console.error('EmojiBoardOpener: openerRef.current is null');
      return;
    }

    if (requestCallback !== null || isEmojiBoardVisible) {
      requestCallback = null;
      if (cords.detail === 0) openerRef.current.click();
      return;
    }

    openerRef.current.style.transform = `translate(${cords.x}px, ${cords.y}px)`;
    requestCallback = requestEmojiCallback;
    setAllowTextReactions(doAllowTextReactions);
    openerRef.current.click();
  }

  function afterEmojiBoardToggle(isVisible: boolean) {
    isEmojiBoardVisible = isVisible;
    if (isVisible) {
      if (!settings.isTouchScreenDevice) searchRef.current?.focus();
    } else {
      setTimeout(() => {
        if (!isEmojiBoardVisible) requestCallback = null;
      }, 500);
    }
  }

  function addEmoji(emoji: EmojiData) {
    requestCallback(emoji);
  }

  useEffect(() => {
    navigation.on(cons.events.navigation.EMOJIBOARD_OPENED, openEmojiBoard);
    return () => {
      navigation.removeListener(cons.events.navigation.EMOJIBOARD_OPENED, openEmojiBoard);
    };
  }, []);

  return (
    <ContextMenu
      content={
        <EmojiBoard
          onSelect={addEmoji}
          searchRef={searchRef}
          allowTextReactions={allowTextReactions}
        />
      }
      afterToggle={afterEmojiBoardToggle}
      render={(toggleMenu) => (
        <input
          ref={openerRef}
          onClick={toggleMenu}
          type="button"
          style={{
            width: '32px',
            height: '32px',
            backgroundColor: 'transparent',
            position: 'absolute',
            top: 0,
            left: 0,
            padding: 0,
            border: 'none',
            visibility: 'hidden',
          }}
        />
      )}
    />
  );
}

export default EmojiBoardOpener;
