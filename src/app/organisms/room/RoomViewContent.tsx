/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/prop-types */
import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
  ReactElement,
} from 'react';
import PropTypes from 'prop-types';
import './RoomViewContent.scss';

import dateFormat from 'dateformat';
import { MatrixEvent } from 'matrix-js-sdk';
import { twemojify } from '../../../util/twemojify';

import initMatrix from '../../../client/initMatrix';
import cons from '../../../client/state/cons';
import navigation from '../../../client/state/navigation';
import { openProfileViewer } from '../../../client/action/navigation';
import { diffMinutes, isInSameDay, Throttle } from '../../../util/common';
import { markAsRead } from '../../../client/action/notifications';

import Divider from '../../atoms/divider/Divider';
import ScrollView from '../../atoms/scroll/ScrollView';
import { Message, PlaceholderMessage } from '../../molecules/message/Message';
import RoomIntro from '../../molecules/room-intro/RoomIntro';
import TimelineChange from '../../molecules/message/TimelineChange';

import { Store, useStore } from '../../hooks/useStore';
import { useForceUpdate } from '../../hooks/useForceUpdate';
import { parseTimelineChange } from './common';
import TimelineScroll from './TimelineScroll';
import EventLimit from './EventLimit';
import RoomTimeline from '../../../client/state/RoomTimeline';

const PAG_LIMIT = 50;
const MAX_MSG_DIFF_MINUTES = 5;
const PLACEHOLDER_COUNT = 2;
const PLACEHOLDERS_HEIGHT = 96 * PLACEHOLDER_COUNT;
const SCROLL_TRIGGER_POS = PLACEHOLDERS_HEIGHT * 4;

function loadingMsgPlaceholders(key: string, count: number = 2) {
  const pl: ReactElement[] = [];
  const genPlaceholders = () => {
    for (let i = 0; i < count; i += 1) {
      pl.push(<PlaceholderMessage key={`placeholder-${i}${key}`} />);
    }
    return pl;
  };

  return <React.Fragment key={`placeholder-container${key}`}>{genPlaceholders()}</React.Fragment>;
}

function RoomIntroContainer({
  event,
  timeline,
}: {
  event: MatrixEvent | null;
  timeline: RoomTimeline;
}) {
  const [, nameForceUpdate] = useForceUpdate();
  const mx = initMatrix.matrixClient;
  const { roomList } = initMatrix;
  const { room, thread } = timeline;

  // threads don't have a header
  if (thread !== undefined) {
    return null;
  }

  const roomTopic = room.currentState.getStateEvents('m.room.topic')[0]?.getContent().topic;
  const isDM = roomList.directs.has(timeline.roomId);
  let avatarSrc = room.getAvatarUrl(mx.baseUrl, 80, 80, 'crop');
  avatarSrc = isDM
    ? room.getAvatarFallbackMember()?.getAvatarUrl(mx.baseUrl, 80, 80, 'crop')
    : avatarSrc;

  const heading = isDM ? room.name : `Welcome to ${room.name}`;
  const topic = twemojify(roomTopic || '', undefined, true);
  const nameJsx = twemojify(room.name);
  const desc = isDM ? (
    <>
      This is the beginning of your direct message history with @<b>{nameJsx}</b>
      {'. '}
      {topic}
    </>
  ) : (
    <>
      {'This is the beginning of the '}
      <b>{nameJsx}</b>
      {' room. '}
      {topic}
    </>
  );

  useEffect(() => {
    const handleUpdate = () => nameForceUpdate();

    roomList.on(cons.events.roomList.ROOM_PROFILE_UPDATED, handleUpdate);
    return () => {
      roomList.removeListener(cons.events.roomList.ROOM_PROFILE_UPDATED, handleUpdate);
    };
  }, []);

  return (
    <RoomIntro
      roomId={timeline.roomId}
      avatarSrc={avatarSrc}
      name={room.name}
      heading={twemojify(heading)}
      desc={desc}
      time={event ? `Created at ${dateFormat(event.getDate(), 'dd mmmm yyyy, hh:MM TT')}` : null}
    />
  );
}

function handleOnClickCapture(e) {
  const { target, nativeEvent } = e;

  const userId = target.getAttribute('data-mx-pill');
  if (userId) {
    const roomId = navigation.selectedRoomId;
    openProfileViewer(userId, roomId);
  }

  const spoiler = nativeEvent.composedPath().find((el) => el?.hasAttribute?.('data-mx-spoiler'));
  if (spoiler) {
    if (!spoiler.classList.contains('data-mx-spoiler--visible')) e.preventDefault();
    spoiler.classList.toggle('data-mx-spoiler--visible');
  }
}

function renderEvent(
  roomTimeline: RoomTimeline,
  mEvent: MatrixEvent,
  prevMEvent: MatrixEvent | null,
  isFocus: boolean,
  isEdit: boolean,
  setEdit: (eventId: string) => void,
  cancelEdit: () => void,
) {
  const isBodyOnly =
    prevMEvent !== null &&
    prevMEvent.getSender() === mEvent.getSender() &&
    prevMEvent.getType() !== 'm.room.member' &&
    prevMEvent.getType() !== 'm.room.create' &&
    diffMinutes(mEvent.getDate(), prevMEvent.getDate()) <= MAX_MSG_DIFF_MINUTES;
  const timestamp = mEvent.getTs();

  if (mEvent.getType() === 'm.room.member') {
    const timelineChange = parseTimelineChange(mEvent);
    if (timelineChange === null) return <div key={mEvent.getId()} />;
    return (
      <TimelineChange
        key={mEvent.getId()}
        variant={timelineChange.variant}
        content={timelineChange.content}
        timestamp={timestamp}
      />
    );
  }
  return (
    <Message
      key={mEvent.getId()}
      mEvent={mEvent}
      isBodyOnly={isBodyOnly}
      roomTimeline={roomTimeline}
      focus={isFocus}
      fullTime={false}
      isEdit={isEdit}
      setEdit={setEdit}
      cancelEdit={cancelEdit}
    />
  );
}

function useTimeline(
  roomTimeline: RoomTimeline,
  eventId: string | null,
  readUptoEvtStore: Store<MatrixEvent>,
  eventLimitRef: React.RefObject<EventLimit>,
) {
  const [timelineInfo, setTimelineInfo] = useState(null);

  const setEventTimeline = async (eId: string | null) => {
    if (typeof eId === 'string') {
      const isLoaded = await roomTimeline.loadEventTimeline(eId);
      if (isLoaded) return;
      // if eventTimeline failed to load,
      // we will load live timeline as fallback.
    }
    roomTimeline.loadLiveTimeline();
  };

  useEffect(() => {
    const limit = eventLimitRef.current;
    const initTimeline = (eId: string) => {
      // NOTICE: eId can be id of readUpto, reply or specific event.
      // readUpTo: when user click jump to unread message button.
      // reply: when user click reply from timeline.
      // specific event when user open a link of event. behave same as ^^^^
      const readUpToId = roomTimeline.getReadUpToEventId();
      let focusEventIndex = -1;
      const isSpecificEvent = eId && eId !== readUpToId;

      if (isSpecificEvent) {
        focusEventIndex = roomTimeline.getEventIndex(eId);
      }
      if (!readUptoEvtStore.getItem() && roomTimeline.hasEventInTimeline(readUpToId)) {
        // either opening live timeline or jump to unread.
        readUptoEvtStore.setItem(roomTimeline.findEventByIdInTimelineSet(readUpToId)!);
      }
      if (readUptoEvtStore.getItem() && !isSpecificEvent) {
        focusEventIndex = roomTimeline.getUnreadEventIndex(readUptoEvtStore.getItem().getId());
      }

      if (focusEventIndex > -1) {
        limit.setFrom(focusEventIndex - Math.round(limit.maxEvents / 2));
      } else {
        limit.setFrom(roomTimeline.timeline.length - limit.maxEvents);
      }
      setTimelineInfo({ focusEventId: isSpecificEvent ? eId : null });
    };

    roomTimeline.on(cons.events.roomTimeline.READY, initTimeline);
    setEventTimeline(eventId);
    return () => {
      roomTimeline.removeListener(cons.events.roomTimeline.READY, initTimeline);
      limit.setFrom(0);
    };
  }, [roomTimeline, eventId]);

  return timelineInfo;
}

interface PageinateInfo {
  backwards: boolean;
  loaded: number;
}

function usePaginate(
  roomTimeline: RoomTimeline,
  readUptoEvtStore: Store<MatrixEvent>,
  forceUpdateLimit: () => void,
  timelineScrollRef: React.RefObject<TimelineScroll>,
  eventLimitRef: React.RefObject<EventLimit>,
): [PageinateInfo | null, () => void] {
  const [info, setInfo] = useState<PageinateInfo | null>(null);

  useEffect(() => {
    const handlePaginatedFromServer = (backwards: boolean, loaded: number) => {
      const limit = eventLimitRef.current;
      if (loaded === 0) return;
      if (!readUptoEvtStore.getItem()) {
        const readUpToId = roomTimeline.getReadUpToEventId();
        readUptoEvtStore.setItem(roomTimeline.findEventByIdInTimelineSet(readUpToId));
      }
      limit.paginate(backwards, PAG_LIMIT, roomTimeline.timeline.length);
      setTimeout(() =>
        setInfo({
          backwards,
          loaded,
        }),
      );
    };
    roomTimeline.on(cons.events.roomTimeline.PAGINATED, handlePaginatedFromServer);
    return () => {
      roomTimeline.removeListener(cons.events.roomTimeline.PAGINATED, handlePaginatedFromServer);
    };
  }, [roomTimeline]);

  const autoPaginate = useCallback(async () => {
    const timelineScroll = timelineScrollRef.current;
    const limit = eventLimitRef.current;
    if (roomTimeline.isOngoingPagination) return;
    const tLength = roomTimeline.timeline.length;

    if (timelineScroll.bottom < SCROLL_TRIGGER_POS) {
      if (limit.length < tLength) {
        // paginate from memory
        limit.paginate(false, PAG_LIMIT, tLength);
        forceUpdateLimit();
      } else if (roomTimeline.canPaginateForward()) {
        // paginate from server.
        await roomTimeline.paginateTimeline(false, PAG_LIMIT);
        return;
      }
    }
    if (timelineScroll.top < SCROLL_TRIGGER_POS) {
      if (limit.from > 0) {
        // paginate from memory
        limit.paginate(true, PAG_LIMIT, tLength);
        forceUpdateLimit();
      } else if (roomTimeline.canPaginateBackward()) {
        // paginate from server.
        await roomTimeline.paginateTimeline(true, PAG_LIMIT);
      }
    }
  }, [roomTimeline]);

  return [info, autoPaginate];
}

function useHandleScroll(
  roomTimeline: RoomTimeline,
  autoPaginate: (info: PageinateInfo) => void,
  readUptoEvtStore: Store<MatrixEvent>,
  forceUpdateLimit: () => void,
  timelineScrollRef: React.RefObject<TimelineScroll>,
  eventLimitRef: React.RefObject<EventLimit>,
) {
  const handleScroll = useCallback(() => {
    const timelineScroll = timelineScrollRef.current;
    const limit = eventLimitRef.current;
    requestAnimationFrame(() => {
      // emit event to toggle scrollToBottom button visibility
      const isAtBottom =
        timelineScroll.bottom < 16 &&
        !roomTimeline.canPaginateForward() &&
        limit.length >= roomTimeline.timeline.length;
      roomTimeline.emit(cons.events.roomTimeline.AT_BOTTOM, isAtBottom);
      if (isAtBottom && readUptoEvtStore.getItem()) {
        requestAnimationFrame(() => markAsRead(roomTimeline.roomId));
      }
    });
    autoPaginate();
  }, [roomTimeline]);

  const handleScrollToLive = useCallback(() => {
    const timelineScroll = timelineScrollRef.current;
    const limit = eventLimitRef.current;
    if (readUptoEvtStore.getItem()) {
      requestAnimationFrame(() => markAsRead(roomTimeline.roomId));
    }
    if (roomTimeline.isServingLiveTimeline()) {
      limit.setFrom(roomTimeline.timeline.length - limit.maxEvents);
      timelineScroll.scrollToBottom();
      forceUpdateLimit();
      return;
    }
    roomTimeline.loadLiveTimeline();
  }, [roomTimeline]);

  return [handleScroll, handleScrollToLive];
}

function useEventArrive(
  roomTimeline: RoomTimeline,
  readUptoEvtStore,
  timelineScrollRef,
  eventLimitRef,
) {
  const myUserId = initMatrix.matrixClient?.getUserId();
  const [newEvent, setEvent] = useState(null);

  useEffect(() => {
    const timelineScroll = timelineScrollRef.current;
    const limit = eventLimitRef.current;
    const trySendReadReceipt = (event) => {
      if (myUserId === event.getSender()) {
        requestAnimationFrame(() => markAsRead(roomTimeline.roomId));
        return;
      }
      const readUpToEvent = readUptoEvtStore.getItem();
      const readUpToId = roomTimeline.getReadUpToEventId();
      const isUnread = readUpToEvent ? readUpToEvent?.getId() === readUpToId : true;

      if (isUnread === false) {
        if (document.visibilityState === 'visible' && timelineScroll.bottom < 16) {
          requestAnimationFrame(() => markAsRead(roomTimeline.roomId));
        } else {
          readUptoEvtStore.setItem(roomTimeline.findEventByIdInTimelineSet(readUpToId));
        }
        return;
      }

      const { timeline } = roomTimeline;
      const unreadMsgIsLast = timeline[timeline.length - 2].getId() === readUpToId;
      if (unreadMsgIsLast) {
        requestAnimationFrame(() => markAsRead(roomTimeline.roomId));
      }
    };

    const handleEvent = (event: MatrixEvent) => {
      const tLength = roomTimeline.timeline.length;
      const isViewingLive = roomTimeline.isServingLiveTimeline() && limit.length >= tLength - 1;
      const isAttached = timelineScroll.bottom < SCROLL_TRIGGER_POS;

      if (isViewingLive && isAttached) {
        limit.setFrom(tLength - limit.maxEvents);
        trySendReadReceipt(event);
        setEvent(event);
        return;
      }
      const isRelates =
        event.getType() === 'm.reaction' || event.getRelation()?.rel_type === 'm.replace';
      if (isRelates) {
        setEvent(event);
        return;
      }

      if (isViewingLive) {
        // This stateUpdate will help to put the
        // loading msg placeholder at bottom
        setEvent(event);
      }
    };

    const handleEventRedact = (event) => setEvent(event);

    roomTimeline.on(cons.events.roomTimeline.EVENT, handleEvent);
    roomTimeline.on(cons.events.roomTimeline.EVENT_REDACTED, handleEventRedact);
    return () => {
      roomTimeline.removeListener(cons.events.roomTimeline.EVENT, handleEvent);
      roomTimeline.removeListener(cons.events.roomTimeline.EVENT_REDACTED, handleEventRedact);
    };
  }, [roomTimeline]);

  return newEvent;
}

let jumpToItemIndex = -1;

function RoomViewContent({
  eventId = null,
  roomTimeline,
}: {
  eventId: string | null;
  roomTimeline: RoomTimeline;
}) {
  const [throttle] = useState(new Throttle());

  const timelineSVRef = useRef(null);
  const timelineScrollRef = useRef<TimelineScroll | null>(null);
  const eventLimitRef = useRef<EventLimit | null>(null);
  const [editEventId, setEditEventId] = useState(null);
  const cancelEdit = () => setEditEventId(null);

  const readUptoEvtStore = useStore<MatrixEvent>(roomTimeline);
  const [onLimitUpdate, forceUpdateLimit] = useForceUpdate();

  const timelineInfo = useTimeline(roomTimeline, eventId, readUptoEvtStore, eventLimitRef);
  const [paginateInfo, autoPaginate] = usePaginate(
    roomTimeline,
    readUptoEvtStore,
    forceUpdateLimit,
    timelineScrollRef,
    eventLimitRef,
  );
  const [handleScroll, handleScrollToLive] = useHandleScroll(
    roomTimeline,
    autoPaginate,
    readUptoEvtStore,
    forceUpdateLimit,
    timelineScrollRef,
    eventLimitRef,
  );
  const newEvent = useEventArrive(roomTimeline, readUptoEvtStore, timelineScrollRef, eventLimitRef);

  const { timeline } = roomTimeline;

  useLayoutEffect(() => {
    if (!roomTimeline.initialized) {
      timelineScrollRef.current = new TimelineScroll(timelineSVRef.current);
      eventLimitRef.current = new EventLimit();
    }
  });

  // when active timeline changes
  useEffect(() => {
    if (!roomTimeline.initialized) return undefined;
    const timelineScroll = timelineScrollRef.current;

    if (timeline.length > 0) {
      if (jumpToItemIndex === -1) {
        timelineScroll.scrollToBottom();
      } else {
        timelineScroll.scrollToIndex(jumpToItemIndex, 80);
      }
      if (timelineScroll.bottom < 16 && !roomTimeline.canPaginateForward()) {
        const readUpToId = roomTimeline.getReadUpToEventId();
        if (readUptoEvtStore.getItem()?.getId() === readUpToId || readUpToId === null) {
          requestAnimationFrame(() => markAsRead(roomTimeline.roomId));
        }
      }
      jumpToItemIndex = -1;
    }
    autoPaginate();

    roomTimeline.on(cons.events.roomTimeline.SCROLL_TO_LIVE, handleScrollToLive);
    return () => {
      if (timelineSVRef.current === null) return;
      roomTimeline.removeListener(cons.events.roomTimeline.SCROLL_TO_LIVE, handleScrollToLive);
    };
  }, [timelineInfo]);

  // when paginating from server
  useEffect(() => {
    if (!roomTimeline.initialized) return;
    const timelineScroll = timelineScrollRef.current;
    timelineScroll.tryRestoringScroll();
    autoPaginate();
  }, [paginateInfo]);

  // when paginating locally
  useEffect(() => {
    if (!roomTimeline.initialized) return;
    const timelineScroll = timelineScrollRef.current;
    timelineScroll.tryRestoringScroll();
  }, [onLimitUpdate]);

  useEffect(() => {
    const timelineScroll = timelineScrollRef.current;
    if (!roomTimeline.initialized) return;
    if (
      timelineScroll.bottom < 16 &&
      !roomTimeline.canPaginateForward() &&
      document.visibilityState === 'visible'
    ) {
      timelineScroll.scrollToBottom();
    } else {
      timelineScroll.tryRestoringScroll();
    }
  }, [newEvent]);

  // up arrow to edit previous message
  const listenKeyArrowUp = useCallback(
    (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key !== 'ArrowUp') return;
      if (navigation.isRawModalVisible) return;

      const target = e.target as HTMLElement;

      if (!target.classList.contains('markdown-input__editable')) return;
      if (!target.classList.contains('empty')) return;

      const { timeline: tl, activeTimeline, liveTimeline, matrixClient: mx } = roomTimeline;
      const limit = eventLimitRef.current;
      if (activeTimeline !== liveTimeline) return;
      if (tl.length > limit.length) return;

      e.preventDefault();

      const mTypes = ['m.text'];
      for (let i = tl.length - 1; i >= 0; i -= 1) {
        const mE = tl[i];
        if (
          mE.getSender() === mx.getUserId() &&
          mE.getType() === 'm.room.message' &&
          mTypes.includes(mE.getContent()?.msgtype)
        ) {
          setEditEventId(mE.getId());
          return;
        }
      }
    },
    [roomTimeline],
  );
  // escape to scroll down and mark as read
  const listenKeyEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (editEventId !== null) return;
      roomTimeline.emit(cons.events.roomTimeline.SCROLL_TO_LIVE);
      // hide "scroll to bottom"
      roomTimeline.emit(cons.events.roomTimeline.AT_BOTTOM, true);
    },
    [editEventId, roomTimeline],
  );

  useEffect(() => {
    document.body.addEventListener('keydown', listenKeyArrowUp);
    document.body.addEventListener('keydown', listenKeyEscape);
    return () => {
      document.body.removeEventListener('keydown', listenKeyArrowUp);
      document.body.removeEventListener('keydown', listenKeyEscape);
    };
  }, [listenKeyArrowUp, listenKeyEscape]);

  const handleTimelineScroll = (event) => {
    const timelineScroll = timelineScrollRef.current;
    if (!event.target) return;

    throttle._(() => {
      const backwards = timelineScroll?.calcScroll();
      if (typeof backwards !== 'boolean') return;
      handleScroll(backwards);
    }, 200)();
  };

  const renderTimeline = (): ReactElement[] => {
    const tl: ReactElement[] = [];
    const limit = eventLimitRef.current;
    if (limit === null) return [];

    let itemCountIndex = 0;
    jumpToItemIndex = -1;
    const readUptoEvent = readUptoEvtStore.getItem();
    let unreadDivider = false;

    if (roomTimeline.canPaginateBackward() || limit.from > 0) {
      tl.push(loadingMsgPlaceholders(1, PLACEHOLDER_COUNT));
      itemCountIndex += PLACEHOLDER_COUNT;
    }
    for (let i = limit.from; i < limit.length; i += 1) {
      if (i >= timeline.length) break;
      const mEvent = timeline[i];
      const prevMEvent = timeline[i - 1] ?? null;

      if (i === 0 && !roomTimeline.canPaginateBackward()) {
        if (mEvent.getType() === 'm.room.create') {
          tl.push(
            <RoomIntroContainer key={mEvent.getId()} event={mEvent} timeline={roomTimeline} />,
          );
          itemCountIndex += 1;
          // eslint-disable-next-line no-continue
          continue;
        } else {
          tl.push(<RoomIntroContainer key="room-intro" event={null} timeline={roomTimeline} />);
          itemCountIndex += 1;
        }
      }

      let isNewEvent = false;
      if (!unreadDivider) {
        unreadDivider =
          !!readUptoEvent &&
          prevMEvent?.getTs() <= readUptoEvent.getTs() &&
          readUptoEvent.getTs() < mEvent.getTs();
        if (unreadDivider) {
          isNewEvent = true;
          tl.push(<Divider key={`new-${mEvent.getId()}`} variant="positive" text="New messages" />);
          itemCountIndex += 1;
          if (jumpToItemIndex === -1) jumpToItemIndex = itemCountIndex;
        }
      }
      const dayDivider = prevMEvent && !isInSameDay(mEvent.getDate(), prevMEvent.getDate());
      if (dayDivider) {
        tl.push(
          <Divider
            key={`divider-${mEvent.getId()}`}
            text={`${dateFormat(mEvent.getDate(), 'mmmm dd, yyyy')}`}
          />,
        );
        itemCountIndex += 1;
      }

      if (timelineInfo === null) {
        return [];
      }
      const focusId = timelineInfo?.focusEventId;
      const isFocus = focusId === mEvent.getId();
      if (isFocus) jumpToItemIndex = itemCountIndex;

      tl.push(
        renderEvent(
          roomTimeline,
          mEvent,
          isNewEvent ? null : prevMEvent,
          isFocus,
          editEventId === mEvent.getId(),
          setEditEventId,
          cancelEdit,
        ),
      );
      itemCountIndex += 1;
    }
    if (roomTimeline.canPaginateForward() || limit.length < timeline.length) {
      tl.push(loadingMsgPlaceholders(2, PLACEHOLDER_COUNT));
    }

    return tl;
  };

  return (
    <ScrollView onScroll={handleTimelineScroll} ref={timelineSVRef} autoHide>
      <div className="room-view__content" onClick={handleOnClickCapture}>
        <div className="timeline__wrapper">
          {roomTimeline.initialized ? renderTimeline() : loadingMsgPlaceholders('loading', 3)}
        </div>
      </div>
    </ScrollView>
  );
}

RoomViewContent.propTypes = {
  eventId: PropTypes.string,
  roomTimeline: PropTypes.shape({}).isRequired,
};

export default RoomViewContent;
