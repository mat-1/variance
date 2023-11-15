/* eslint-disable react/prop-types */
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './RoomViewInput.scss';

import { ReactEditor } from 'slate-react';
import { Editor, Transforms } from 'slate';

import EventEmitter from 'events';

import initMatrix from '../../../client/initMatrix';
import cons from '../../../client/state/cons';
import settings from '../../../client/state/settings';
import { openEmojiBoard, openReusableContextMenu } from '../../../client/action/navigation';
import navigation from '../../../client/state/navigation';
import { bytesToSize, getEventCords } from '../../../util/common';
import { getUsername } from '../../../util/matrixUtil';
import { colorMXID } from '../../../util/colorMXID';

import Text from '../../atoms/text/Text';
import RawIcon from '../../atoms/system-icons/RawIcon';
import IconButton from '../../atoms/button/IconButton';
import { MessageReply } from '../../molecules/message/Message';
import { MarkdownInput, flattenNodes } from '../../molecules/markdown-input/MarkdownInput';

import StickerBoard from '../sticker-board/StickerBoard';
import { confirmDialog } from '../../molecules/confirm-dialog/ConfirmDialog';

import CirclePlusIC from '../../../../public/res/ic/outlined/circle-plus.svg';
import EmojiIC from '../../../../public/res/ic/outlined/emoji.svg';
import SendIC from '../../../../public/res/ic/outlined/send.svg';
import StickerIC from '../../../../public/res/ic/outlined/sticker.svg';
import ShieldIC from '../../../../public/res/ic/outlined/shield.svg';
import VLCIC from '../../../../public/res/ic/outlined/vlc.svg';
import VolumeFullIC from '../../../../public/res/ic/outlined/volume-full.svg';
import FileIC from '../../../../public/res/ic/outlined/file.svg';
import CrossIC from '../../../../public/res/ic/outlined/cross.svg';

import commands from './commands';
import RoomTimeline from '../../../client/state/RoomTimeline';

const CMD_REGEX = /(^\/|:|@)(\S*)$/;
let isTyping = false;
let isCmdActivated = false;
let cmdCursorPos = null;

function RoomViewInput({
  roomId,
  threadId,
  roomTimeline,
  viewEvent,
}: {
  roomId: string;
  threadId?: string;
  roomTimeline: RoomTimeline;
  viewEvent: EventEmitter;
}) {
  const [attachment, setAttachment] = useState(null);
  const [replyTo, setReplyTo] = useState(null);

  const editor = useRef<ReactEditor>(null);
  const editorElRef = useRef<HTMLDivElement>(null);
  const inputBaseRef = useRef<HTMLDivElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const uploadProgressRef = useRef<HTMLSpanElement>(null);
  const rightOptionsRef = useRef<HTMLDivElement>(null);

  const TYPING_TIMEOUT = 5000;
  const mx = initMatrix.matrixClient;
  const { roomsInput } = initMatrix;

  let readOnly = false;

  function requestFocusInput() {
    if (editor.current === null) return;
    ReactEditor.focus(editor.current);
  }

  useEffect(() => {
    roomsInput.on(cons.events.roomsInput.ATTACHMENT_SET, setAttachment);
    viewEvent.on('focus_msg_input', requestFocusInput);
    return () => {
      roomsInput.removeListener(cons.events.roomsInput.ATTACHMENT_SET, setAttachment);
      viewEvent.removeListener('focus_msg_input', requestFocusInput);
    };
  }, [roomsInput, viewEvent]);

  function getEditorContent() {
    const content = editor.current.children;
    return flattenNodes(content);
  }

  function clearEditor() {
    Transforms.delete(editor.current, {
      at: {
        anchor: editor.current.start([]),
        focus: editor.current.end([]),
      },
    });
  }

  const sendIsTyping = (isT) => {
    mx.sendTyping(roomId, isT, isT ? TYPING_TIMEOUT : undefined);
    isTyping = isT;

    if (isT === true) {
      setTimeout(() => {
        if (isTyping) sendIsTyping(false);
      }, TYPING_TIMEOUT);
    }
  };

  function uploadingProgress(myRoomId, { loaded, total }) {
    if (myRoomId !== roomId) return;
    const progressPer = Math.round((loaded * 100) / total);
    uploadProgressRef.current.textContent = `Uploading: ${bytesToSize(loaded)}/${bytesToSize(
      total,
    )} (${progressPer}%)`;
    inputBaseRef.current.style.backgroundImage = `linear-gradient(90deg, var(--bg-surface-hover) ${progressPer}%, var(--bg-surface-low) ${progressPer}%)`;
  }
  function clearAttachment(myRoomId) {
    if (roomId !== myRoomId) return;
    setAttachment(null);
    inputBaseRef.current.style.backgroundImage = 'unset';
    uploadInputRef.current.value = null;
  }

  function rightOptionsA11Y(A11Y: boolean) {
    if (rightOptionsRef.current === null) return;
    const rightOptions = rightOptionsRef.current.children;
    for (let index = 0; index < rightOptions.length; index += 1) {
      const el = rightOptions[index] as HTMLElement;
      el.tabIndex = A11Y ? 0 : -1;
    }
  }

  function activateCmd(prefix: string) {
    isCmdActivated = true;
    rightOptionsA11Y(false);
    viewEvent.emit('cmd_activate', prefix);
  }
  function deactivateCmd() {
    isCmdActivated = false;
    cmdCursorPos = null;
    rightOptionsA11Y(true);
  }
  function deactivateCmdAndEmit() {
    deactivateCmd();
    viewEvent.emit('cmd_deactivate');
  }
  function setCursorPosition(pos: number) {
    setTimeout(() => {
      ReactEditor.focus(editor.current);
      Transforms.select(editor.current, { path: [0, 0], offset: pos });
    }, 0);
  }
  function replaceCmdWith(msg: string | null, cursor: number, replacement: string): string | null {
    if (msg === null) return null;
    const targetInput = msg.slice(0, cursor);
    const cmdParts = targetInput.match(CMD_REGEX);
    const leadingInput = msg.slice(0, cmdParts.index);
    if (replacement.length > 0) setCursorPosition(leadingInput.length + replacement.length);
    return leadingInput + replacement + msg.slice(cursor);
  }

  function focusInput() {
    if (settings.isTouchScreenDevice) return;

    // check if editor.current is in the DOM
    if (!document.body.contains(editorElRef.current)) return;

    ReactEditor.focus(editor.current);
    Transforms.select(editor.current, Editor.end(editor.current, []));
  }

  function setEditorContent(replaceWith: string) {
    clearEditor();
    editor.current.insertText(replaceWith);
    deactivateCmd();
    focusInput();
  }

  function firedCmd(cmdData) {
    const msg = getEditorContent();
    const replaceWith = replaceCmdWith(
      msg,
      cmdCursorPos,
      typeof cmdData?.replace !== 'undefined' ? cmdData.replace : '',
    );
    setEditorContent(replaceWith);
  }

  function setUpReply(userId, eventId, body, formattedBody) {
    setReplyTo({ userId, eventId, body });
    roomsInput.setReplyTo(roomId, {
      userId,
      eventId,
      body,
      formattedBody,
    });
    focusInput();
  }

  useEffect(() => {
    roomsInput.on(cons.events.roomsInput.UPLOAD_PROGRESS_CHANGES, uploadingProgress);
    roomsInput.on(cons.events.roomsInput.ATTACHMENT_CANCELED, clearAttachment);
    roomsInput.on(cons.events.roomsInput.FILE_UPLOADED, clearAttachment);
    viewEvent.on('cmd_fired', firedCmd);
    navigation.on(cons.events.navigation.REPLY_TO_CLICKED, setUpReply);
    if (editor?.current !== null) {
      isTyping = false;
      setEditorContent(roomsInput.getMessage(roomId));
      setAttachment(roomsInput.getAttachment(roomId));
      setReplyTo(roomsInput.getReplyTo(roomId));
    }
    return () => {
      roomsInput.removeListener(cons.events.roomsInput.UPLOAD_PROGRESS_CHANGES, uploadingProgress);
      roomsInput.removeListener(cons.events.roomsInput.ATTACHMENT_CANCELED, clearAttachment);
      roomsInput.removeListener(cons.events.roomsInput.FILE_UPLOADED, clearAttachment);
      viewEvent.removeListener('cmd_fired', firedCmd);
      navigation.removeListener(cons.events.navigation.REPLY_TO_CLICKED, setUpReply);
      if (isCmdActivated) deactivateCmd();
      if (editor?.current === null) return;

      const msg = getEditorContent();
      // inputBaseRef.current.style.backgroundImage = 'unset';
      if (msg.trim() === '') {
        roomsInput.setMessage(roomId, '');
        return;
      }
      roomsInput.setMessage(roomId, msg);
    };
  }, [roomId]);

  const sendBody = async (
    body: string,
    options?: {
      msgType?: string;
      autoMarkdown?: boolean;
    },
  ) => {
    const opt = options ?? {};
    if (!opt.msgType) opt.msgType = 'm.text';
    if (typeof opt.autoMarkdown !== 'boolean') opt.autoMarkdown = true;
    if (roomsInput.isSending(roomId)) return;
    sendIsTyping(false);

    roomsInput.setMessage(roomId, body);
    if (attachment !== null) {
      roomsInput.setAttachment(roomId, attachment);
    }
    readOnly = true;

    await roomsInput.sendInput(roomId, threadId, opt);
    readOnly = false;
    focusInput();

    clearEditor();
    editor.current.insertText(roomsInput.getMessage(roomId));

    if (replyTo !== null) setReplyTo(null);
  };

  const processCommand = (cmdBody) => {
    const spaceIndex = cmdBody.indexOf(' ');
    const cmdName = cmdBody.slice(1, spaceIndex > -1 ? spaceIndex : undefined);
    const cmdData = spaceIndex > -1 ? cmdBody.slice(spaceIndex + 1) : '';
    if (!commands[cmdName]) {
      confirmDialog('Invalid Command', `"${cmdName}" is not a valid command.`, 'Alright');
      return;
    }
    if (['me', 'shrug', 'plain', 'html', 'rainbow'].includes(cmdName)) {
      commands[cmdName].exe(roomId, cmdData, sendBody);
      return;
    }
    commands[cmdName].exe(roomId, cmdData);
  };

  const sendMessage = async () => {
    requestAnimationFrame(() => deactivateCmdAndEmit());
    const msgBody = getEditorContent().trim();
    if (msgBody.startsWith('/')) {
      processCommand(msgBody.trim());
      editor.current.deleteFragment();
      return;
    }
    if (msgBody === '' && attachment === null) return;
    sendBody(msgBody);
  };

  const handleSendSticker = async (data) => {
    roomsInput.sendSticker(roomId, data);
  };

  function processTyping(msg) {
    const isEmptyMsg = msg === '';

    if (isEmptyMsg && isTyping) {
      sendIsTyping(false);
      return;
    }
    if (!isEmptyMsg && !isTyping) {
      sendIsTyping(true);
    }
  }

  function getCursorPosition() {
    return editor.current.selection.anchor.offset;
  }

  function recognizeCmd(rawInput: string) {
    const cursor = getCursorPosition();
    const targetInput = rawInput.slice(0, cursor);

    const cmdParts = targetInput.match(CMD_REGEX);
    if (cmdParts === null) {
      if (isCmdActivated) deactivateCmdAndEmit();
      return;
    }
    const cmdPrefix = cmdParts[1];
    const cmdSlug = cmdParts[2];

    if (cmdPrefix === ':') {
      // skip emoji autofill command if link is suspected.
      const checkForLink = targetInput.slice(0, cmdParts.index);
      if (checkForLink.match(/(http|https|mailto|matrix|ircs|irc)$/)) {
        deactivateCmdAndEmit();
        return;
      }
    }

    cmdCursorPos = cursor;
    if (cmdSlug === '') {
      activateCmd(cmdPrefix);
      return;
    }
    if (!isCmdActivated) activateCmd(cmdPrefix);
    viewEvent.emit('cmd_process', cmdPrefix, cmdSlug);
  }

  const handleCreateEditor = (e: ReactEditor) => {
    editor.current = e;
  };

  const handleMsgTyping = (e) => {
    const msg = flattenNodes(e);
    recognizeCmd(msg);
    if (!isCmdActivated) processTyping(msg);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      roomsInput.cancelReplyTo(roomId);
      setReplyTo(null);
    }
    if (e.key === 'Enter' && settings.sendMessageOnEnter && e.shiftKey === false) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handlePaste = (e) => {
    if (e.clipboardData === false) {
      return;
    }

    if (e.clipboardData.items === undefined) {
      return;
    }

    for (let i = 0; i < e.clipboardData.items.length; i += 1) {
      const item = e.clipboardData.items[i];
      if (item.type.indexOf('image') !== -1) {
        const image = item.getAsFile();
        if (attachment === null) {
          setAttachment(image);
          if (image !== null) {
            roomsInput.setAttachment(roomId, image);
            return;
          }
        } else {
          return;
        }
      }
    }
  };

  function addEmoji(emoji) {
    editor.current.insertText(emoji.unicode);
    ReactEditor.focus(editor.current);
  }

  const handleUploadClick = () => {
    if (attachment === null) uploadInputRef.current.click();
    else {
      roomsInput.cancelAttachment(roomId);
    }
  };
  function uploadFileChange(e) {
    const file = e.target.files.item(0);
    setAttachment(file);
    if (file !== null) roomsInput.setAttachment(roomId, file);
  }

  useEffect(() => {
    const focusOnLive = () => {
      ReactEditor.focus(editor.current);
    };
    roomTimeline.addListener(cons.events.roomTimeline.SCROLL_TO_LIVE, focusOnLive);
    return () => {
      roomTimeline.removeListener(cons.events.roomTimeline.SCROLL_TO_LIVE, focusOnLive);
    };
  });

  function renderInputs() {
    const canISend = roomTimeline.room.currentState.maySendMessage(mx.getUserId());
    const tombstoneEvent = roomTimeline.room.currentState.getStateEvents('m.room.tombstone')[0];
    if (!canISend || tombstoneEvent) {
      return (
        <Text className="room-input__alert">
          {tombstoneEvent
            ? tombstoneEvent.getContent()?.body ??
              'This room has been replaced and is no longer active.'
            : 'You do not have permission to post to this room'}
        </Text>
      );
    }
    return (
      <>
        <div
          className={`room-input__option-container${
            attachment === null ? '' : ' room-attachment__option'
          }`}
        >
          <input
            onChange={uploadFileChange}
            style={{ display: 'none' }}
            ref={uploadInputRef}
            type="file"
          />
          <IconButton
            onClick={handleUploadClick}
            tooltip={attachment === null ? 'Upload' : 'Cancel'}
            src={CirclePlusIC}
          />
        </div>
        <div ref={inputBaseRef} className="room-input__input-container">
          {roomTimeline.isEncrypted() && <RawIcon size="extra-small" src={ShieldIC} />}
          <MarkdownInput
            onChange={handleMsgTyping}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            onCreateEditor={handleCreateEditor}
            readOnly={readOnly}
            ref={editorElRef}
            placeholder="Send a message..."
          />
        </div>
        <div ref={rightOptionsRef} className="room-input__option-container">
          <IconButton
            onClick={(e) => {
              openReusableContextMenu(
                'top',
                (() => {
                  const cords = getEventCords(e);
                  cords.y -= 20;
                  return cords;
                })(),
                (closeMenu) => (
                  <StickerBoard
                    roomId={roomId}
                    onSelect={(data) => {
                      handleSendSticker(data);
                      closeMenu();
                    }}
                  />
                ),
              );
            }}
            tooltip="Sticker"
            src={StickerIC}
          />
          <IconButton
            onClick={(e) => {
              const cords = getEventCords(e);
              cords.x += document.dir === 'rtl' ? -80 : 80;
              cords.y -= 250;
              openEmojiBoard(cords, addEmoji);
            }}
            tooltip="Emoji"
            src={EmojiIC}
          />
          <IconButton onClick={sendMessage} tooltip="Send" src={SendIC} />
        </div>
      </>
    );
  }

  function attachFile() {
    const fileType = attachment.type.slice(0, attachment.type.indexOf('/'));
    return (
      <div className="room-attachment">
        <div
          className={`room-attachment__preview${
            fileType !== 'image' ? ' room-attachment__icon' : ''
          }`}
        >
          {fileType === 'image' && (
            <img alt={attachment.name} src={URL.createObjectURL(attachment)} />
          )}
          {fileType === 'video' && <RawIcon src={VLCIC} />}
          {fileType === 'audio' && <RawIcon src={VolumeFullIC} />}
          {fileType !== 'image' && fileType !== 'video' && fileType !== 'audio' && (
            <RawIcon src={FileIC} />
          )}
        </div>
        <div className="room-attachment__info">
          <Text variant="b1">{attachment.name}</Text>
          <Text variant="b3">
            <span ref={uploadProgressRef}>{`size: ${bytesToSize(attachment.size)}`}</span>
          </Text>
        </div>
      </div>
    );
  }

  function attachReply() {
    return (
      <div className="room-reply">
        <IconButton
          onClick={() => {
            roomsInput.cancelReplyTo(roomId);
            setReplyTo(null);
          }}
          src={CrossIC}
          tooltip="Cancel reply"
          size="extra-small"
        />
        <MessageReply
          userId={replyTo.userId}
          onKeyDown={handleKeyDown}
          name={getUsername(replyTo.userId)}
          color={colorMXID(replyTo.userId)}
          body={replyTo.body}
        />
      </div>
    );
  }

  return (
    <>
      {replyTo !== null && attachReply()}
      {attachment !== null && attachFile()}
      <form
        className="room-input"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        {renderInputs()}
      </form>
    </>
  );
}

export default RoomViewInput;
