/* eslint-disable react/prop-types */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import './Message.scss';

import { find } from 'linkifyjs';
import {
  MatrixEvent,
  MatrixEventEvent,
  MsgType,
  RoomEvent,
  THREAD_RELATION_TYPE,
  Thread,
  getHttpUriForMxc,
} from 'matrix-js-sdk';
import { twemojify } from '../../../util/twemojify';

import initMatrix from '../../../client/initMatrix';
import settings from '../../../client/state/settings';
import {
  getUsername,
  getUsernameOfRoomMember,
  parseReply,
  trimHTMLReply,
} from '../../../util/matrixUtil';
import { getEventCords } from '../../../util/common';
import { redactEvent, sendReaction } from '../../../client/action/roomTimeline';
import {
  openEmojiBoard,
  openProfileViewer,
  openReadReceipts,
  openViewSource,
  replyTo,
  selectRoom,
} from '../../../client/action/navigation';
import { sanitizeCustomHtml } from '../../../util/sanitize';

import Text from '../../atoms/text/Text';
import RawIcon from '../../atoms/system-icons/RawIcon';
import Button from '../../atoms/button/Button';
import Tooltip from '../../atoms/tooltip/Tooltip';
import Input from '../../atoms/input/Input';
import Avatar from '../../atoms/avatar/Avatar';
import IconButton from '../../atoms/button/IconButton';
import Time from '../../atoms/time/Time';
import ContextMenu, {
  MenuHeader,
  MenuItem,
  MenuBorder,
} from '../../atoms/context-menu/ContextMenu';
import * as Media from '../media/Media';

import ReplyArrowIC from '../../../../public/res/ic/outlined/reply-arrow.svg';
import EmojiAddIC from '../../../../public/res/ic/outlined/emoji-add.svg';
import VerticalMenuIC from '../../../../public/res/ic/outlined/vertical-menu.svg';
import PencilIC from '../../../../public/res/ic/outlined/pencil.svg';
import TickMarkIC from '../../../../public/res/ic/outlined/tick-mark.svg';
import CmdIC from '../../../../public/res/ic/outlined/cmd.svg';
import BinIC from '../../../../public/res/ic/outlined/bin.svg';
import HashPlusIC from '../../../../public/res/ic/outlined/hash-plus.svg';
import LockIC from '../../../../public/res/ic/outlined/lock.svg';

import { confirmDialog } from '../confirm-dialog/ConfirmDialog';
import { getBlobSafeMimeType } from '../../../util/mimetypes';
import { html, plain } from '../../../util/markdown';
import { Embed } from '../media/Media';
import RoomTimeline from '../../../client/state/RoomTimeline';
import { backgroundColorMXID, colorMXID } from '../../../util/colorMXID';

export function PlaceholderMessage() {
  return (
    <div className="ph-msg">
      <div className="ph-msg__avatar-container">
        <div className="ph-msg__avatar" />
      </div>
      <div className="ph-msg__main-container">
        <div className="ph-msg__header" />
        <div className="ph-msg__body">
          <div />
          <div />
          <div />
          <div />
        </div>
      </div>
    </div>
  );
}

const MessageAvatar = React.memo(
  ({
    roomId,
    avatarSrc,
    userId,
    username,
  }: {
    roomId: string;
    avatarSrc: string;
    userId: string;
    username: string;
  }) => {
    // fetch avatar
    const decryptedAvatarSrcPromise = avatarSrc
      ? Media.getUrl(avatarSrc, undefined, undefined)
      : undefined;

    const [decryptedAvatarSrc, setDecryptedAvatarSrc] = useState<string | undefined>(undefined);
    useEffect(() => {
      decryptedAvatarSrcPromise?.then((src) => setDecryptedAvatarSrc(src));
    }, [decryptedAvatarSrcPromise]);

    return (
      <div className="message__avatar-container">
        <button
          type="button"
          aria-label="View profile"
          onClick={() => openProfileViewer(userId, roomId)}
        >
          <Avatar
            imageSrc={decryptedAvatarSrc}
            text={username}
            bgColor={backgroundColorMXID(userId)}
            size="small"
          />
        </button>
      </div>
    );
  },
);

const MessageHeader = React.memo(
  ({
    userId,
    username,
    timestamp,
    fullTime,
  }: {
    userId: string;
    username: string;
    timestamp: number;
    fullTime?: boolean;
  }) => (
    <div className="message__header">
      <Text
        style={{ color: colorMXID(userId) }}
        className="message__profile"
        variant="b1"
        weight="medium"
        span
      >
        <span>{twemojify(username)}</span>
        <span>{twemojify(userId)}</span>
      </Text>
      <div className="message__time">
        <Text variant="b3">
          <Time timestamp={timestamp} fullTime={fullTime} />
        </Text>
      </div>
    </div>
  ),
);

export function MessageReply({ name, color, body }) {
  return (
    <div className="message__reply">
      <Text variant="b2">
        <RawIcon color={color} size="extra-small" src={ReplyArrowIC} />
        <span style={{ color }}>{twemojify(name)}</span> {twemojify(body)}
      </Text>
    </div>
  );
}

MessageReply.propTypes = {
  name: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  body: PropTypes.string.isRequired,
};

const MessageReplyWrapper = React.memo(
  ({ roomTimeline, eventId }: { roomTimeline: RoomTimeline; eventId: string }) => {
    const [reply, setReply] = useState<{
      to: string;
      color: string;
      body: string;
      event: MatrixEvent | null;
    } | null>(null);
    const isMountedRef = useRef(true);

    useEffect(() => {
      const mx = initMatrix.matrixClient;
      const timelineSet = roomTimeline.getUnfilteredTimelineSet();
      const loadReply = async () => {
        try {
          const eTimeline = await mx.getEventTimeline(timelineSet, eventId);
          if (!eTimeline) return;
          await roomTimeline.decryptAllEventsOfTimeline(eTimeline);

          let mEvent = eTimeline.getTimelineSet().findEventById(eventId)!;

          const editedList = roomTimeline.editedTimeline.get(mEvent.getId()!);
          if (editedList) {
            mEvent = editedList[editedList.length - 1];
          }

          const rawBody = mEvent.getContent().body;
          const username = getUsernameOfRoomMember(mEvent.sender);

          if (isMountedRef.current === false) return;
          const fallbackBody = mEvent.isRedacted()
            ? '*** This message has been deleted ***'
            : '*** Unable to load reply ***';
          let parsedBody = parseReply(rawBody)?.body ?? rawBody ?? fallbackBody;
          if (editedList && parsedBody.startsWith(' * ')) {
            parsedBody = parsedBody.slice(3);
          }

          setReply({
            to: username,
            color: colorMXID(mEvent.getSender() ?? ''),
            body: parsedBody,
            event: mEvent,
          });
        } catch {
          setReply({
            to: '** Unknown user **',
            color: 'var(--tc-danger-normal)',
            body: '*** Unable to load reply ***',
            event: null,
          });
        }
      };
      loadReply();

      return () => {
        isMountedRef.current = false;
      };
    }, [eventId, roomTimeline]);

    const focusReply = (
      ev: React.KeyboardEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>,
    ) => {
      if (!ev.key || ev.key === ' ' || ev.key === 'Enter') {
        if (ev.key) ev.preventDefault();
        if (reply?.event === null) return;
        if (reply?.event.isRedacted()) return;
        roomTimeline.loadEventTimeline(eventId);
      }
    };

    return (
      <div
        className="message__reply-wrapper"
        onClick={focusReply}
        onKeyDown={focusReply}
        role="button"
        tabIndex={0}
      >
        {reply !== null && <MessageReply name={reply.to} color={reply.color} body={reply.body} />}
      </div>
    );
  },
);

const MessageBody = React.memo(
  ({
    senderName,
    body,
    isCustomHTML,
    isEdited,
    msgType,
    messageStatus,
  }: {
    senderName: string;
    body: string;
    isCustomHTML?: boolean;
    isEdited?: boolean;
    msgType?: string;
    messageStatus: string | null;
  }) => {
    // if body is not string it is a React element.
    if (typeof body !== 'string') return <div className="message__body">{body}</div>;

    let content = null;
    if (isCustomHTML) {
      try {
        content = twemojify(
          sanitizeCustomHtml(initMatrix.matrixClient, body),
          undefined,
          true,
          false,
          true,
        );
      } catch {
        console.error('Malformed custom html: ', body);
        content = twemojify(body, undefined);
      }
    } else {
      content = twemojify(body, undefined, true);
    }

    // Determine if this message should render with large emojis
    // Criteria:
    // - Contains only emoji
    // - Contains no more than 10 emoji
    let emojiOnly = false;
    if (content.type === 'img') {
      // If this messages contains only a single (inline) image
      emojiOnly = true;
    } else if (content.constructor.name === 'Array') {
      // Otherwise, it might be an array of images / texb

      // Count the number of emojis
      const nEmojis = content.filter((e) => e.type === 'img').length;

      // Make sure there's no text besides whitespace and variation selector U+FE0F
      if (
        nEmojis <= 10 &&
        content.every(
          (element) =>
            (typeof element === 'object' && element.type === 'img') ||
            (typeof element === 'string' && /^[\s\ufe0f]*$/g.test(element)),
        )
      ) {
        emojiOnly = true;
      }
    }

    if (!isCustomHTML) {
      // If this is a plaintext message, wrap it in a <p> element (automatically applying
      // white-space: pre-wrap) in order to preserve newlines
      content = <span className="message__body-plain">{content}</span>;
    }

    return (
      <div
        className={`message__body message__body-status-${messageStatus} ${msgType === 'm.bad.encrypted' ? 'message__body-bad-encryption' : ''}`}
      >
        <div dir="auto" className={`text ${emojiOnly ? 'text-h1' : 'text-b1'}`}>
          {msgType === 'm.bad.encrypted' && (
            <>
              <RawIcon size="extra-small" src={LockIC} color="var(--tc-danger-high)" />{' '}
            </>
          )}
          {msgType === 'm.emote' && (
            <>
              {'* '}
              {twemojify(senderName)}{' '}
            </>
          )}
          {content}
          {isEdited && (
            <Text className="message__body-edited" variant="b3" span>
              (edited)
            </Text>
          )}
        </div>
      </div>
    );
  },
);

function MessageEdit({ body, onSave, onCancel }) {
  const editInputRef = useRef(null);

  useEffect(() => {
    // makes the cursor end up at the end of the line instead of the beginning
    editInputRef.current.value = '';
    editInputRef.current.value = body;
  }, [body]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }

    if (e.key === 'Enter' && settings.sendMessageOnEnter && e.shiftKey === false) {
      e.preventDefault();
      onSave(editInputRef.current.value, body);
    }
  };

  return (
    <form
      className="message__edit"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(editInputRef.current.value, body);
      }}
    >
      <Input
        forwardRef={editInputRef}
        onKeyDown={handleKeyDown}
        value={body}
        placeholder="Edit message"
        required
        resizable
        autoFocus
      />
      <div className="message__edit-btns">
        <Button type="submit" variant="primary">
          Save
        </Button>
        <Button onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
MessageEdit.propTypes = {
  body: PropTypes.string.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

function getMyEmojiEvent(
  emojiKey: string,
  eventId: string,
  roomTimeline: RoomTimeline,
): MatrixEvent | null {
  const mx = initMatrix.matrixClient;
  const rEvents = roomTimeline.reactionTimeline.get(eventId);
  let rEvent: MatrixEvent | null = null;
  rEvents?.find((rE) => {
    if (rE.getRelation() === null) return false;
    if (rE.getRelation().key === emojiKey && rE.getSender() === mx.getUserId()) {
      rEvent = rE;
      return true;
    }
    return false;
  });
  return rEvent;
}

function toggleEmoji(
  roomId: string,
  eventId: string,
  emojiKey: string,
  shortcode: string,
  roomTimeline: RoomTimeline,
) {
  const myAlreadyReactEvent = getMyEmojiEvent(emojiKey, eventId, roomTimeline);
  if (myAlreadyReactEvent) {
    const rId = myAlreadyReactEvent.getId();
    if (rId.startsWith('~')) return;
    redactEvent(roomId, rId);
    return;
  }
  sendReaction(roomId, eventId, emojiKey, shortcode);
}

function pickEmoji(
  e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  roomId: string,
  eventId: string,
  roomTimeline: RoomTimeline,
) {
  openEmojiBoard(
    getEventCords(e),
    (emoji) => {
      toggleEmoji(roomId, eventId, emoji.mxc ?? emoji.unicode, emoji.shortcodes[0], roomTimeline);
      // simulate a click to the react button to hide the emojiboard
      const target = e.target as HTMLButtonElement;
      target.click();
    },
    true,
  );
}

function genReactionMsg(userIds: string[], reaction: string, shortcode: string) {
  return (
    <>
      {userIds.map((userId, index) => (
        <React.Fragment key={userId}>
          {twemojify(getUsername(userId))}
          {index < userIds.length - 1 && (
            <span style={{ opacity: '.6' }}>{index === userIds.length - 2 ? ' and ' : ', '}</span>
          )}
        </React.Fragment>
      ))}
      <span style={{ opacity: '.6' }}>{' reacted with '}</span>
      {twemojify(shortcode ? `:${shortcode}:` : reaction, { className: 'react-emoji' })}
    </>
  );
}

function MessageReaction({ reaction, shortcode = undefined, count, users, isActive, onClick }) {
  let customEmojiUrl = null;
  if (reaction.match(/^mxc:\/\/\S+$/)) {
    customEmojiUrl = initMatrix.matrixClient.mxcUrlToHttp(reaction);
  }
  return (
    <Tooltip
      className="msg__reaction-tooltip"
      content={
        <Text variant="b2">
          {users.length > 0
            ? genReactionMsg(users, reaction, shortcode)
            : 'Unable to load who has reacted'}
        </Text>
      }
    >
      <button
        onClick={onClick}
        type="button"
        className={`msg__reaction${isActive ? ' msg__reaction--active' : ''}`}
      >
        {customEmojiUrl ? (
          <img
            className="react-emoji"
            draggable="false"
            alt={shortcode ?? reaction}
            src={customEmojiUrl}
          />
        ) : (
          twemojify(reaction, { className: 'react-emoji' })
        )}
        <Text variant="b3" className="msg__reaction-count">
          {count}
        </Text>
      </button>
    </Tooltip>
  );
}
MessageReaction.propTypes = {
  reaction: PropTypes.node.isRequired,
  shortcode: PropTypes.string,
  count: PropTypes.number.isRequired,
  users: PropTypes.arrayOf(PropTypes.string).isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

function MessageReactionGroup({ roomTimeline, mEvent }) {
  const { roomId, room, reactionTimeline } = roomTimeline;
  const mx = initMatrix.matrixClient;
  const reactions = {};
  const canSendReaction = room.currentState.maySendEvent('m.reaction', mx.getUserId());

  const eventReactions = reactionTimeline.get(mEvent.getId());
  const addReaction = (key, shortcode, count, senderId, isActive) => {
    let reaction = reactions[key];
    if (reaction === undefined) {
      reaction = {
        count: 0,
        users: [],
        isActive: false,
      };
    }
    if (shortcode) reaction.shortcode = shortcode;
    if (count) {
      reaction.count = count;
    } else {
      reaction.users.push(senderId);
      reaction.count = reaction.users.length;
      if (isActive) reaction.isActive = isActive;
    }

    reactions[key] = reaction;
  };
  if (eventReactions) {
    eventReactions.forEach((rEvent) => {
      if (rEvent.getRelation() === null) return;
      const reaction = rEvent.getRelation();
      const senderId = rEvent.getSender();
      const { shortcode } = rEvent.getContent();
      const isActive = senderId === mx.getUserId();

      addReaction(reaction.key, shortcode, undefined, senderId, isActive);
    });
  } else {
    // Use aggregated reactions
    const aggregatedReaction = mEvent.getServerAggregatedRelation('m.annotation')?.chunk;
    if (!aggregatedReaction) return null;
    aggregatedReaction.forEach((reaction) => {
      if (reaction.type !== 'm.reaction') return;
      addReaction(reaction.key, undefined, reaction.count, undefined, false);
    });
  }

  return (
    <div className="message__reactions text text-b3 noselect">
      {Object.keys(reactions).map((key) => (
        <MessageReaction
          key={key}
          reaction={key}
          shortcode={reactions[key].shortcode}
          count={reactions[key].count}
          users={reactions[key].users}
          isActive={reactions[key].isActive}
          onClick={() => {
            toggleEmoji(roomId, mEvent.getId(), key, reactions[key].shortcode, roomTimeline);
          }}
        />
      ))}
      {canSendReaction && (
        <IconButton
          onClick={(e) => {
            pickEmoji(e, roomId, mEvent.getId(), roomTimeline);
          }}
          src={EmojiAddIC}
          size="extra-small"
          tooltip="Add reaction"
        />
      )}
    </div>
  );
}
MessageReactionGroup.propTypes = {
  roomTimeline: PropTypes.shape({}).isRequired,
  mEvent: PropTypes.shape({}).isRequired,
};

function isMedia(mEvent: MatrixEvent) {
  return (
    mEvent.getContent()?.msgtype === MsgType.File ||
    mEvent.getContent()?.msgtype === MsgType.Image ||
    mEvent.getContent()?.msgtype === MsgType.Audio ||
    mEvent.getContent()?.msgtype === MsgType.Video ||
    mEvent.getType() === 'm.sticker'
  );
}

function shouldShowThreadSummary(mEvent: MatrixEvent, roomTimeline: RoomTimeline) {
  return (
    mEvent.isThreadRoot &&
    // there must be events in the threadW
    (mEvent.getThread()?.length ?? 0) > 0 &&
    // don't show the thread summary if we're in a thread
    roomTimeline.thread === undefined
  );
}

// if editedTimeline has mEventId then pass editedMEvent else pass mEvent to openViewSource
function handleOpenViewSource(mEvent: MatrixEvent, roomTimeline: RoomTimeline) {
  const eventId = mEvent.getId();
  if (!eventId) {
    console.error('called handleOpenViewSource on an event without an id', mEvent);
    return;
  }
  const { editedTimeline } = roomTimeline ?? {};
  let editedMEvent;
  if (editedTimeline?.has(eventId)) {
    const editedList = editedTimeline.get(eventId);
    editedMEvent = editedList[editedList.length - 1];
  }
  openViewSource(editedMEvent !== undefined ? editedMEvent : mEvent);
}

const MessageOptions = React.memo(
  ({
    roomTimeline,
    mEvent,
    edit,
    reply,
  }: {
    roomTimeline: RoomTimeline;
    mEvent: MatrixEvent;
    edit: (editing: boolean) => void;
    reply: () => void;
  }) => {
    const { roomId, room } = roomTimeline;
    const mx = initMatrix.matrixClient;
    const senderId = mEvent.getSender();
    const eventId = mEvent.getId();
    if (!eventId) {
      console.warn('Message without id', mEvent);
      return null;
    }

    const myUserId = mx.getUserId();
    if (!myUserId) {
      console.warn('No user id in MessageOptions, this should not be possible');
      return null;
    }

    const myPowerlevel = room.getMember(myUserId)?.powerLevel;
    const canIRedact = room.currentState.hasSufficientPowerLevelFor('redact', myPowerlevel);
    const canSendReaction = room.currentState.maySendEvent('m.reaction', myUserId);
    const canCreateThread =
      room.currentState.maySendEvent('m.thread', myUserId) &&
      // this message is already a thread
      !shouldShowThreadSummary(mEvent, roomTimeline) &&
      // can't create threads in threads
      roomTimeline.thread === undefined;

    const createThread = () => {
      room.createThread(eventId, mEvent, [mEvent], true);
      selectRoom(roomId, eventId, eventId);
    };

    return (
      <div className="message__options">
        {canSendReaction && (
          <IconButton
            onClick={(e) => pickEmoji(e, roomId, eventId, roomTimeline)}
            src={EmojiAddIC}
            size="extra-small"
            tooltip="Add reaction"
          />
        )}
        <IconButton onClick={() => reply()} src={ReplyArrowIC} size="extra-small" tooltip="Reply" />
        {canCreateThread && (
          <IconButton
            onClick={() => createThread()}
            src={HashPlusIC}
            size="extra-small"
            tooltip="Create thread"
          />
        )}
        {senderId === mx.getUserId() && !isMedia(mEvent) && (
          <IconButton onClick={() => edit(true)} src={PencilIC} size="extra-small" tooltip="Edit" />
        )}
        <ContextMenu
          content={() => (
            <>
              <MenuHeader>Options</MenuHeader>
              <MenuItem
                iconSrc={TickMarkIC}
                onClick={() => openReadReceipts(roomId, roomTimeline.getEventReaders(mEvent))}
              >
                Read receipts
              </MenuItem>
              <MenuItem iconSrc={CmdIC} onClick={() => handleOpenViewSource(mEvent, roomTimeline)}>
                View source
              </MenuItem>
              {(canIRedact || senderId === mx.getUserId()) && (
                <>
                  <MenuBorder />
                  <MenuItem
                    variant="danger"
                    iconSrc={BinIC}
                    onClick={(ev) => confirmRedact(eventId, roomId, ev)}
                  >
                    Delete
                  </MenuItem>
                </>
              )}
            </>
          )}
          render={(toggleMenu) => (
            <IconButton
              onClick={toggleMenu}
              src={VerticalMenuIC}
              size="extra-small"
              tooltip="Options"
            />
          )}
        />
      </div>
    );
  },
);

async function confirmRedact(eventId: string, roomId: string, ev?: MouseEvent) {
  const isConfirmed = await confirmDialog(
    'Delete message',
    'Are you sure that you want to delete this message?',
    'Delete',
    'danger',
    ev,
  );
  if (!isConfirmed) return;
  redactEvent(roomId, eventId);
}

const MessageThreadSummary = React.memo(({ thread }: { thread: Thread }) => {
  const [lastReply, setLastReply] = useState(thread.lastReply());

  // can't have empty threads
  if (thread.length === 0) return null;

  const lastSender = lastReply?.sender;
  const lastSenderAvatarSrc =
    lastSender?.getAvatarUrl(initMatrix.matrixClient.baseUrl, 36, 36, 'crop', true, false) ??
    undefined;

  function selectThread() {
    selectRoom(thread.roomId, undefined, thread.rootEvent?.getId());
  }

  thread.on(RoomEvent.Timeline, () => {
    setLastReply(thread.lastReply());
  });

  return (
    <button className="message__threadSummary" onClick={selectThread} type="button">
      <div className="message__threadSummary-count">
        <Text>
          {thread.length} message{thread.length > 1 ? 's' : ''} ›
        </Text>
      </div>
      <div className="message__threadSummary-lastReply">
        {lastReply ? (
          <>
            {lastSender ? (
              <>
                <Avatar
                  imageSrc={lastSenderAvatarSrc}
                  text={lastSender?.name}
                  bgColor={backgroundColorMXID(lastSender?.userId)}
                  size="ultra-small"
                />
                <span className="message__threadSummary-lastReply-sender">
                  <Text span>{lastSender?.name}</Text>{' '}
                </span>
              </>
            ) : (
              <span className="message__threadSummary-lastReply-sender">
                <Text span>Unknown user</Text>{' '}
              </span>
            )}
            <span className="message__threadSummary-lastReply-body">
              <Text span>{lastReply.getContent().body}</Text>
            </span>
          </>
        ) : (
          <Text>Couldn&apos;t load latest message</Text>
        )}
      </div>
    </button>
  );
});

function genMediaContent(matrixEvent: MatrixEvent) {
  const mx = initMatrix.matrixClient;
  const mContent = matrixEvent.getContent();
  if (!mContent || !mContent.body)
    return <span style={{ color: 'var(--bg-danger)' }}>Malformed event</span>;

  let mediaMXC = mContent?.url;
  const isEncryptedFile = typeof mediaMXC === 'undefined';
  if (isEncryptedFile) mediaMXC = mContent?.file?.url;

  let thumbnailMXC = mContent?.info?.thumbnail_url;

  if (typeof mediaMXC === 'undefined' || mediaMXC === '')
    return <span style={{ color: 'var(--bg-danger)' }}>Malformed event</span>;

  let msgType = matrixEvent.getContent()?.msgtype;
  const safeMimetype = getBlobSafeMimeType(mContent.info?.mimetype);
  if (matrixEvent.getType() === 'm.sticker') {
    msgType = 'm.sticker';
  } else if (safeMimetype === 'application/octet-stream') {
    msgType = 'm.file';
  }

  const blurhash = mContent?.info?.['xyz.amorgan.blurhash'];

  switch (msgType) {
    case MsgType.File:
      return (
        <Media.File
          name={mContent.body}
          link={mx.mxcUrlToHttp(mediaMXC)}
          type={mContent.info?.mimetype}
          file={mContent.file || null}
        />
      );
    case MsgType.Image:
      return (
        <Media.Image
          name={mContent.body}
          width={typeof mContent.info?.w === 'number' ? mContent.info?.w : null}
          height={typeof mContent.info?.h === 'number' ? mContent.info?.h : null}
          link={mx.mxcUrlToHttp(
            mediaMXC,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            true,
          )}
          file={isEncryptedFile ? mContent.file : null}
          type={mContent.info?.mimetype}
          blurhash={blurhash}
        />
      );
    case 'm.sticker':
      return (
        <Media.Sticker
          name={mContent.body}
          width={typeof mContent.info?.w === 'number' ? mContent.info?.w : null}
          height={typeof mContent.info?.h === 'number' ? mContent.info?.h : null}
          link={mx.mxcUrlToHttp(mediaMXC)}
          file={isEncryptedFile ? mContent.file : null}
          type={mContent.info?.mimetype}
        />
      );
    case MsgType.Audio:
      return (
        <Media.Audio
          name={mContent.body}
          link={mx.mxcUrlToHttp(mediaMXC)}
          type={mContent.info?.mimetype}
          file={mContent.file || null}
        />
      );
    case MsgType.Video:
      if (typeof thumbnailMXC === 'undefined') {
        thumbnailMXC = mContent.info?.thumbnail_file?.url || null;
      }
      return (
        <Media.Video
          name={mContent.body}
          link={mx.mxcUrlToHttp(mediaMXC)}
          thumbnail={thumbnailMXC === null ? null : mx.mxcUrlToHttp(thumbnailMXC)}
          thumbnailFile={isEncryptedFile ? mContent.info?.thumbnail_file : null}
          thumbnailType={mContent.info?.thumbnail_info?.mimetype || null}
          width={typeof mContent.info?.w === 'number' ? mContent.info?.w : null}
          height={typeof mContent.info?.h === 'number' ? mContent.info?.h : null}
          file={isEncryptedFile ? mContent.file : null}
          type={mContent.info?.mimetype}
          blurhash={blurhash}
        />
      );
    default:
      return <span style={{ color: 'var(--bg-danger)' }}>Malformed event</span>;
  }
}

function getEditedBody(editedMEvent: MatrixEvent) {
  const newContent = editedMEvent.getContent()['m.new_content'];
  if (typeof newContent === 'undefined') return [null, false, null];

  const isCustomHTML = newContent.format === 'org.matrix.custom.html';
  const parsedContent = parseReply(newContent.body);
  if (parsedContent === null) {
    return [newContent.body, isCustomHTML, newContent.formatted_body ?? null];
  }
  return [parsedContent.body, isCustomHTML, newContent.formatted_body ?? null];
}

function findLinks(body: string) {
  return find(body, 'url').filter((v, i, a) => a.findIndex((v2) => v2.href === v.href) === i);
}

export function Message({
  mEvent,
  isBodyOnly = false,
  roomTimeline = null,
  focus = false,
  fullTime = false,
  isEdit = false,
  setEdit = null,
  cancelEdit = null,
}: {
  mEvent: MatrixEvent;
  isBodyOnly?: boolean;
  roomTimeline?: RoomTimeline;
  focus?: boolean;
  fullTime?: boolean;
  isEdit?: boolean;
  setEdit?: (eventId: string) => void;
  cancelEdit?: () => void;
}) {
  const roomId = mEvent.getRoomId()!;
  if (!roomId) {
    console.warn('Message without room id', mEvent);
  }
  const { editedTimeline, reactionTimeline } = roomTimeline ?? {};

  const className = ['message', isBodyOnly ? 'message--body-only' : 'message--full'];
  if (focus) className.push('message--focus');
  const content = mEvent.getContent();
  const eventId = mEvent.getId();

  // make the message transparent while sending and red if it failed sending
  const [messageStatus, setMessageStatus] = useState(mEvent.status);

  useEffect(() => {
    const onStatusEvent = (e: MatrixEvent) => {
      setMessageStatus(e.status);
      if (e.status === 'sent') {
        // only remove the listener after it's actually sent
        mEvent.removeListener(MatrixEventEvent.Status, onStatusEvent);
      }
    };
    mEvent.addListener(MatrixEventEvent.Status, onStatusEvent);
    return () => {
      mEvent.removeListener(MatrixEventEvent.Status, onStatusEvent);
    };
  }, [mEvent]);

  if (!initMatrix.matrixClient) return null;

  const msgType = content?.msgtype;

  const senderId = mEvent.getSender();
  let { body } = content;

  // we do this instead of mEvent.sender since that one is sometimes incomplete (like, missing username or avatar).
  // also guarantees that the username/avatar is always the newest one.
  const sender = senderId ? roomTimeline?.room.getMember(senderId) : undefined;

  let username = sender ? getUsernameOfRoomMember(sender) : getUsername(senderId!);
  let avatarMxcUrl = sender?.getMxcAvatarUrl() || mEvent.sender?.getMxcAvatarUrl();

  // MSC4144, used by mautrix discord bridge
  const beeperProfile = mEvent.getContent()['com.beeper.per_message_profile'];
  if (beeperProfile) {
    if (beeperProfile.displayname) {
      username = beeperProfile.displayname;
    }
    if (beeperProfile.avatar_url) {
      avatarMxcUrl = beeperProfile.avatar_url;
    }
  }
  const avatarSrc = getHttpUriForMxc(
    initMatrix.matrixClient.baseUrl,
    avatarMxcUrl,
    36,
    36,
    'crop',
    true,
    false,
    true,
  );

  let isCustomHTML = content.format === 'org.matrix.custom.html';
  let customHTML = isCustomHTML ? content.formatted_body : null;

  const edit = useCallback(() => {
    if (eventId && setEdit) setEdit(eventId);
  }, [setEdit, eventId]);
  const reply = useCallback(() => {
    if (eventId && senderId) replyTo(senderId, eventId, body, customHTML);
  }, [body, customHTML, eventId, senderId]);

  if (!eventId) {
    // if the message doesn't have an id then there's nothing to do
    console.warn('Message without id', mEvent);
    return null;
  }

  if (msgType === 'm.emote') className.push('message--type-emote');

  const isEdited = editedTimeline ? editedTimeline.has(eventId) : false;
  const haveReactions = reactionTimeline
    ? reactionTimeline.has(eventId) || !!mEvent.getServerAggregatedRelation('m.annotation')
    : false;
  const eventRelation = mEvent.getRelation();
  const isReply =
    !!mEvent.replyEventId &&
    // don't render thread fallback replies
    !(eventRelation?.rel_type === THREAD_RELATION_TYPE.name && eventRelation?.is_falling_back);

  if (isEdited) {
    const editedList = editedTimeline.get(eventId);
    const editedMEvent = editedList[editedList.length - 1];
    [body, isCustomHTML, customHTML] = getEditedBody(editedMEvent);
  }

  if (isReply) {
    body = parseReply(body)?.body ?? body;
    customHTML = trimHTMLReply(customHTML);
  }

  if (typeof body !== 'string') body = '';

  return (
    <div className={className.join(' ')}>
      {isBodyOnly ? (
        <div className="message__avatar-container" />
      ) : (
        <MessageAvatar
          roomId={roomId}
          avatarSrc={avatarSrc}
          userId={senderId}
          username={username}
        />
      )}
      <div className="message__main-container">
        {!isBodyOnly && (
          <MessageHeader
            userId={senderId}
            username={username}
            timestamp={mEvent.getTs()}
            fullTime={fullTime}
          />
        )}
        {roomTimeline && isReply && (
          <MessageReplyWrapper roomTimeline={roomTimeline} eventId={mEvent.replyEventId} />
        )}

        {!isEdit && (
          <MessageBody
            senderName={username}
            isCustomHTML={isCustomHTML}
            body={isMedia(mEvent) ? genMediaContent(mEvent) : (customHTML ?? body)}
            msgType={msgType}
            isEdited={isEdited}
            messageStatus={messageStatus}
          />
        )}
        {settings.showUrlPreview &&
          msgType === 'm.text' &&
          findLinks(body).map((link) => <Embed key={link.href} link={link.href} />)}
        {isEdit && (
          <MessageEdit
            body={
              customHTML
                ? html(customHTML, { kind: 'edit', onlyPlain: true }).plain
                : plain(body, { kind: 'edit', onlyPlain: true }).plain
            }
            onSave={(newBody, oldBody) => {
              cancelEdit?.();
              if (newBody === '') {
                confirmRedact(eventId, roomId);
                return;
              }
              if (newBody !== oldBody) {
                initMatrix.roomsInput.sendEditedMessage(roomId, mEvent, newBody);
              }
            }}
            onCancel={cancelEdit}
          />
        )}
        {haveReactions && <MessageReactionGroup roomTimeline={roomTimeline} mEvent={mEvent} />}
        {roomTimeline && !isEdit && (
          <MessageOptions roomTimeline={roomTimeline} mEvent={mEvent} edit={edit} reply={reply} />
        )}
        {roomTimeline && shouldShowThreadSummary(mEvent, roomTimeline) && (
          <MessageThreadSummary thread={mEvent.thread} />
        )}
      </div>
    </div>
  );
}
Message.propTypes = {
  mEvent: PropTypes.shape({}).isRequired,
  isBodyOnly: PropTypes.bool,
  roomTimeline: PropTypes.shape({}),
  focus: PropTypes.bool,
  fullTime: PropTypes.bool,
  isEdit: PropTypes.bool,
  setEdit: PropTypes.func,
  cancelEdit: PropTypes.func,
};
