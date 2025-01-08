import React from 'react';
import PropTypes from 'prop-types';
import './SidebarAvatar.scss';

import { twemojify } from '../../../util/twemojify';

import Text from '../../atoms/text/Text';
import Tooltip from '../../atoms/tooltip/Tooltip';
import { blurOnBubbling } from '../../atoms/button/script';

const SidebarAvatar = React.forwardRef(
  (
    {
      className = '',
      tooltip,
      active = false,
      onClick = undefined,
      onContextMenu = undefined,
      avatar,
      notificationBadge = null,
    }: {
      className?: string;
      tooltip?: string;
      active?: boolean;
      onClick?: () => void;
      onContextMenu?: () => void;
      avatar?: React.ReactNode;
      notificationBadge?: React.ReactNode;
    },
    ref,
  ) => {
    const classes = ['sidebar-avatar'];
    if (active) classes.push('sidebar-avatar--active');
    if (className) classes.push(className);
    return (
      <Tooltip content={<Text variant="b1">{twemojify(tooltip)}</Text>} placement="right">
        <button
          ref={ref}
          className={classes.join(' ')}
          type="button"
          onMouseUp={(e) => blurOnBubbling(e, '.sidebar-avatar')}
          onClick={onClick}
          onContextMenu={onContextMenu}
        >
          {avatar}
          {notificationBadge}
        </button>
      </Tooltip>
    );
  },
);

SidebarAvatar.propTypes = {
  className: PropTypes.string,
  tooltip: PropTypes.string.isRequired,
  active: PropTypes.bool,
  onClick: PropTypes.func,
  onContextMenu: PropTypes.func,
  avatar: PropTypes.node.isRequired,
  notificationBadge: PropTypes.node,
};

export default SidebarAvatar;
