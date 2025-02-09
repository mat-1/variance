import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import './ViewSource.scss';

import hljs from 'highlight.js';
import hljsJson from 'highlight.js/lib/languages/json';

import type { MatrixEvent } from 'matrix-js-sdk';

import cons from '../../../client/state/cons';
import navigation from '../../../client/state/navigation';

import IconButton from '../../atoms/button/IconButton';
import { MenuHeader } from '../../atoms/context-menu/ContextMenu';
import ScrollView from '../../atoms/scroll/ScrollView';
import PopupWindow from '../../molecules/popup-window/PopupWindow';

import CrossIC from '../../../../public/res/ic/outlined/cross.svg';

hljs.registerLanguage('json', hljsJson);

function ViewSourceBlock({ title, json }: { title: string; json: Record<string, unknown> }) {
  return (
    <div className="view-source__card">
      <MenuHeader>{title}</MenuHeader>
      <ScrollView horizontal vertical={false} autoHide>
        <pre className="text text-b1">
          <code
            className="language-json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: hljs.highlight(JSON.stringify(json, null, 2), {
                language: 'json',
              }).value,
            }}
          />
        </pre>
      </ScrollView>
    </div>
  );
}
ViewSourceBlock.propTypes = {
  title: PropTypes.string.isRequired,
  json: PropTypes.shape({}).isRequired,
};

function ViewSource() {
  const [isOpen, setIsOpen] = useState(false);
  const [event, setEvent] = useState<MatrixEvent | null>(null);

  useEffect(() => {
    const loadViewSource = (e: MatrixEvent) => {
      setEvent(e);
      setIsOpen(true);
    };
    navigation.on(cons.events.navigation.VIEWSOURCE_OPENED, loadViewSource);
    return () => {
      navigation.removeListener(cons.events.navigation.VIEWSOURCE_OPENED, loadViewSource);
    };
  }, []);

  const handleAfterClose = () => {
    setEvent(null);
  };

  const renderViewSource = () => (
    <div className="view-source">
      {event!.isEncrypted() && (
        <ViewSourceBlock title="Decrypted source" json={event!.getEffectiveEvent()} />
      )}
      <ViewSourceBlock title="Original source" json={event!.event} />
    </div>
  );

  return (
    <PopupWindow
      isOpen={isOpen}
      title="View source"
      onAfterClose={handleAfterClose}
      onRequestClose={() => setIsOpen(false)}
      contentOptions={<IconButton src={CrossIC} onClick={() => setIsOpen(false)} tooltip="Close" />}
    >
      {event ? renderViewSource() : <div />}
    </PopupWindow>
  );
}

export default ViewSource;
