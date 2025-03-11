/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './EmojiBoard.scss';

import { emojiGroups, emojis } from './emoji';
import availableEmojis from './available-emoji';
import initMatrix from '../../../client/initMatrix';
import cons from '../../../client/state/cons';
import navigation from '../../../client/state/navigation';
import AsyncSearch from '../../../util/AsyncSearch';
import { addRecentEmoji, getRecentEmojis } from './recent';
import { TWEMOJI_BASE_URL } from '../../../util/twemojify';

import Text from '../../atoms/text/Text';
import RawIcon from '../../atoms/system-icons/RawIcon';
import IconButton from '../../atoms/button/IconButton';
import Input from '../../atoms/input/Input';
import ScrollView from '../../atoms/scroll/ScrollView';

import SearchIC from '../../../../public/res/ic/outlined/search.svg';
import RecentClockIC from '../../../../public/res/ic/outlined/recent-clock.svg';
import EmojiIC from '../../../../public/res/ic/outlined/emoji.svg';
import DogIC from '../../../../public/res/ic/outlined/dog.svg';
import CupIC from '../../../../public/res/ic/outlined/cup.svg';
import BallIC from '../../../../public/res/ic/outlined/ball.svg';
import PhotoIC from '../../../../public/res/ic/outlined/photo.svg';
import BulbIC from '../../../../public/res/ic/outlined/bulb.svg';
import PeaceIC from '../../../../public/res/ic/outlined/peace.svg';
import FlagIC from '../../../../public/res/ic/outlined/flag.svg';

const ROW_EMOJIS_COUNT = 7;

const EmojiGroup = React.memo(
  ({
    name,
    groupEmojis,
  }: {
    name?: string;
    groupEmojis: {
      length: number;
      unicode: string;
      hexcode: string;
      mxc: string;
      shortcode: string;
      shortcodes: string[] | undefined;
    }[];
  }) => {
    function getEmojiBoard() {
      const emojiBoard = [];
      const totalEmojis = groupEmojis.length;

      for (let r = 0; r < totalEmojis; r += ROW_EMOJIS_COUNT) {
        const emojiRow = [];
        for (let c = r; c < r + ROW_EMOJIS_COUNT; c += 1) {
          const emojiIndex = c;
          if (emojiIndex >= totalEmojis) break;
          const emoji = groupEmojis[emojiIndex];
          emojiRow.push(
            <span key={emojiIndex}>
              {emoji.hexcode ? (
                // This is a unicode emoji, and should be rendered with twemoji
                <img
                  loading="lazy"
                  src={`${TWEMOJI_BASE_URL}${emoji.hexcode.toLowerCase()}.svg`}
                  alt={emoji.unicode}
                  unicode={emoji.unicode}
                  shortcodes={emoji.shortcodes?.toString()}
                  hexcode={emoji.hexcode}
                  className="emoji"
                />
              ) : (
                // This is a custom emoji, and should be render as an mxc
                <img
                  className="emoji"
                  draggable="false"
                  loading="lazy"
                  alt={emoji.shortcode}
                  unicode={`:${emoji.shortcode}:`}
                  shortcodes={emoji.shortcode}
                  src={initMatrix.matrixClient.mxcUrlToHttp(emoji.mxc)}
                  data-mx-emoticon={emoji.mxc}
                />
              )}
            </span>,
          );
        }
        emojiBoard.push(
          <div key={r} className="emoji-row">
            {emojiRow}
          </div>,
        );
      }
      return emojiBoard;
    }

    return (
      <div className="emoji-group">
        {name && (
          <Text className="emoji-group__header" variant="b2" weight="bold">
            {name}
          </Text>
        )}
        {groupEmojis.length !== 0 && <div className="emoji-set noselect">{getEmojiBoard()}</div>}
      </div>
    );
  },
);

EmojiGroup.propTypes = {
  name: PropTypes.string.isRequired,
  groupEmojis: PropTypes.arrayOf(
    PropTypes.shape({
      length: PropTypes.number,
      unicode: PropTypes.string,
      hexcode: PropTypes.string,
      mxc: PropTypes.string,
      shortcode: PropTypes.string,
      shortcodes: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
    }),
  ).isRequired,
};

const asyncSearch = new AsyncSearch();
asyncSearch.setup(emojis, { keys: ['shortcode'], isContain: true, limit: 40 });
function SearchedEmoji({ searchedEmojis }) {
  if (searchedEmojis === null) return false;

  return (
    <EmojiGroup
      key="-1"
      name={searchedEmojis.emojis.length === 0 ? 'No search result found' : undefined}
      groupEmojis={searchedEmojis.emojis}
    />
  );
}

export interface EmojiData {
  unicode: string;
  hexcode: string;
  shortcodes: string[];
  mxc: string | null;
}

function EmojiBoard({
  onSelect,
  searchRef,
  allowTextReactions,
}: {
  onSelect: (emoji: EmojiData) => void;
  searchRef: React.MutableRefObject<HTMLInputElement>;
  allowTextReactions: boolean;
}) {
  const scrollEmojisRef = useRef<HTMLDivElement>(null);
  const emojiInfo = useRef<HTMLDivElement>(null);

  function isTargetNotEmoji(target: HTMLElement) {
    return target.classList.contains('emoji') === false;
  }
  function getEmojiDataFromTarget(target: HTMLElement): EmojiData {
    const unicode = target.getAttribute('unicode');
    const hexcode = target.getAttribute('hexcode');
    const mxc = target.getAttribute('data-mx-emoticon');
    const shortcodesString: string | null = target.getAttribute('shortcodes') ?? null;
    const shortcodes = shortcodesString ? shortcodesString.split(',') : [];
    return {
      unicode,
      hexcode,
      shortcodes,
      mxc,
    };
  }

  function selectEmoji(e: MouseEvent) {
    const target = e.target as HTMLElement | null;
    if (!target || isTargetNotEmoji(target)) return;

    const emoji = getEmojiDataFromTarget(target);
    onSelect(emoji);
    if (emoji.hexcode) addRecentEmoji(emoji.unicode);
  }

  function setEmojiInfo(emoji: { shortcode: string; src: string | HTMLElement; unicode: string }) {
    const infoEmoji = emojiInfo.current.firstElementChild.firstElementChild;
    const infoShortcode = emojiInfo.current.lastElementChild;

    infoEmoji.src = emoji.src;
    infoEmoji.alt = emoji.unicode;
    infoShortcode.textContent = `:${emoji.shortcode}:`;
  }

  function hoverEmoji(e: MouseEvent) {
    const target = e.target as HTMLImageElement | null;
    if (!target || isTargetNotEmoji(target)) return;

    const { shortcodes, unicode } = getEmojiDataFromTarget(target);
    const { src } = target;

    if (shortcodes === undefined) {
      searchRef.current.placeholder = 'Search';
      setEmojiInfo({
        unicode: '🙂',
        shortcode: 'slight_smile',
        src: `${TWEMOJI_BASE_URL}1f642.svg`,
      });
      return;
    }
    if (searchRef.current.placeholder === shortcodes[0]) return;
    searchRef.current.setAttribute('placeholder', shortcodes[0]);
    setEmojiInfo({ shortcode: shortcodes[0], src, unicode });
  }

  const [searchTerm, setSearchTerm] = useState('');

  function handleSearchChange() {
    const term = searchRef.current.value;

    const emoji = availableEmojis.flatMap(({ emoticons }) => emoticons);
    emoji.push(...emojis);
    asyncSearch.setup(emoji, { keys: ['shortcode'], isContain: true, limit: 40 });

    asyncSearch.search(term);
    scrollEmojisRef.current.scrollTop = 0;
    setSearchTerm(term);
  }

  function reactWithText() {
    onSelect({
      unicode: searchTerm,
      hexcode: '',
      shortcodes: [],
      mxc: null,
    });
  }

  const [recentEmojis, setRecentEmojis] = useState([]);
  const [searchedEmojis, setSearchedEmojis] = useState(null);

  const recentOffset = recentEmojis.length > 0 ? 1 : 0;

  useEffect(() => {
    const onOpen = () => {
      searchRef.current.value = '';
      handleSearchChange();

      // only update when board is getting opened to prevent shifting UI
      setRecentEmojis(getRecentEmojis(3 * ROW_EMOJIS_COUNT));
    };

    navigation.on(cons.events.navigation.EMOJIBOARD_OPENED, onOpen);
    return () => {
      navigation.removeListener(cons.events.navigation.EMOJIBOARD_OPENED, onOpen);
    };
  }, []);

  function handleSearchEmoji(resultEmojis, term) {
    if (term === '' || resultEmojis.length === 0) {
      if (term === '') setSearchedEmojis(null);
      else setSearchedEmojis({ emojis: [] });
      return;
    }
    setSearchedEmojis({ emojis: resultEmojis });
  }

  useEffect(() => {
    asyncSearch.on(asyncSearch.RESULT_SENT, handleSearchEmoji);
    return () => {
      asyncSearch.removeListener(asyncSearch.RESULT_SENT, handleSearchEmoji);
    };
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    // on enter key select the first emoji
    if (e.key === 'Enter') {
      if (!scrollEmojisRef.current) {
        return;
      }
      const firstEmojiEl = scrollEmojisRef.current.querySelector('.emoji');
      if (firstEmojiEl) {
        firstEmojiEl.click();
        e.preventDefault();
      } else if (allowTextReactions) {
        // if no emoji is present, react with text
        reactWithText();
      }
    }
  }

  function openGroup(groupOrder) {
    let tabIndex = groupOrder;
    const $emojiContent = scrollEmojisRef.current.firstElementChild;
    const groupCount = $emojiContent.childElementCount;
    if (groupCount > emojiGroups.length) {
      tabIndex += groupCount - emojiGroups.length - availableEmojis.length - recentOffset;
    }
    $emojiContent.children[tabIndex].scrollIntoView();
  }

  return (
    <div id="emoji-board" className="emoji-board">
      <ScrollView invisible>
        <div className="emoji-board__nav">
          {recentEmojis.length > 0 && (
            <IconButton
              onClick={() => openGroup(0)}
              src={RecentClockIC}
              tooltip="Recent"
              tooltipPlacement="left"
            />
          )}
          <div className="emoji-board__nav-custom">
            {availableEmojis.map((pack) => {
              const src = initMatrix.matrixClient.mxcUrlToHttp(
                pack.avatarUrl ?? pack.getEmojis()[0].mxc,
              );
              return (
                <IconButton
                  onClick={() => openGroup(recentOffset + pack.packIndex)}
                  src={src}
                  key={pack.packIndex}
                  tooltip={pack.displayName ?? 'Unknown'}
                  tooltipPlacement="left"
                  isImage
                />
              );
            })}
          </div>
          <div className="emoji-board__nav-twemoji">
            {[
              [0, EmojiIC, 'Smilies'],
              [1, DogIC, 'Animals'],
              [2, CupIC, 'Food'],
              [3, BallIC, 'Activities'],
              [4, PhotoIC, 'Travel'],
              [5, BulbIC, 'Objects'],
              [6, PeaceIC, 'Symbols'],
              [7, FlagIC, 'Flags'],
            ].map(([indx, ico, name]) => (
              <IconButton
                onClick={() => openGroup(recentOffset + availableEmojis.length + indx)}
                key={indx}
                src={ico}
                tooltip={name}
                tooltipPlacement="left"
              />
            ))}
          </div>
        </div>
      </ScrollView>
      <div className="emoji-board__content">
        <div className="emoji-board__content__search">
          <RawIcon size="small" src={SearchIC} />
          <Input
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            forwardRef={searchRef}
            placeholder="Search"
          />
        </div>
        <div className="emoji-board__content__emojis">
          <ScrollView ref={scrollEmojisRef} autoHide>
            <div onMouseMove={hoverEmoji} onClick={selectEmoji}>
              <SearchedEmoji searchedEmojis={searchedEmojis} />
              {/* don't show other categories when searching */}
              {searchTerm === '' && (
                <>
                  {recentEmojis.length > 0 && (
                    <EmojiGroup name="Recently used" groupEmojis={recentEmojis} />
                  )}
                  {availableEmojis.map((pack) => (
                    <EmojiGroup
                      name={pack.displayName ?? 'Unknown'}
                      key={pack.packIndex}
                      groupEmojis={pack.getEmojis()}
                      className="custom-emoji-group"
                    />
                  ))}
                  {emojiGroups.map((group) => (
                    <EmojiGroup key={group.name} name={group.name} groupEmojis={group.emojis} />
                  ))}
                </>
              )}
            </div>
          </ScrollView>
        </div>
        {allowTextReactions && searchTerm !== '' && (
          <button
            onClick={reactWithText}
            type="button"
            className="emoji-board__content__react-with-text"
          >
            <Text>React with &quot;{searchTerm}&quot;</Text>
          </button>
        )}
        <div ref={emojiInfo} className="emoji-board__content__info">
          <div>
            <img alt=":slight_smile:" src={`${TWEMOJI_BASE_URL}1f642.svg`} className="emoji" />
          </div>
          <Text>:slight_smile:</Text>
        </div>
      </div>
    </div>
  );
}

EmojiBoard.propTypes = {
  onSelect: PropTypes.func.isRequired,
  searchRef: PropTypes.shape({}).isRequired,
};

export default EmojiBoard;
