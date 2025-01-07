import React from 'react';
import PropTypes from 'prop-types';
import './NotificationBadge.scss';

import Text from '../text/Text';

function NotificationBadge({ alert = false, content = null }) {
  const notificationClass = alert ? ' notification-badge--alert' : '';
  return (
    <div className={`notification-badge${notificationClass}`}>
      {content !== null && (
        <Text variant="b3" weight="bold">
          {content}
        </Text>
      )}
    </div>
  );
}

NotificationBadge.propTypes = {
  alert: PropTypes.bool,
  content: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default NotificationBadge;
