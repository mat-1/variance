import React from 'react';
import './PeopleSelector.scss';

import { twemojify } from '../../../util/twemojify';

import { blurOnBubbling } from '../../atoms/button/script';

import Text from '../../atoms/text/Text';
import Avatar from '../../atoms/avatar/Avatar';

function PeopleSelector({
  avatarSrc,
  name,
  color,
  peopleRole,
  onClick,
}: {
  avatarSrc: string | undefined;
  name: string;
  color: string;
  peopleRole: string | undefined;
  onClick: () => void;
}) {
  return (
    <div className="people-selector__container">
      <button
        className="people-selector"
        onMouseUp={(e) => blurOnBubbling(e, '.people-selector')}
        onClick={onClick}
        type="button"
      >
        <Avatar imageSrc={avatarSrc} text={name} bgColor={color} size="extra-small" />
        <Text className="people-selector__name" variant="b1">
          {twemojify(name)}
        </Text>
        {peopleRole !== null && (
          <Text className="people-selector__role" variant="b3">
            {peopleRole}
          </Text>
        )}
      </button>
    </div>
  );
}

export default PeopleSelector;
