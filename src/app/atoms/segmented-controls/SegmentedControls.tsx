import React, { useState, useEffect } from 'react';
import './SegmentedControls.scss';

import { blurOnBubbling } from '../button/script';

import Text from '../text/Text';
import RawIcon from '../system-icons/RawIcon';

function SegmentedControls({
  selectedId,
  segments,
  onSelect,
}: {
  selectedId: string;
  segments: {
    iconSrc?: string;
    text?: string;
    id: string;
  }[];
  onSelect: (id: string) => void;
}) {
  const [select, setSelect] = useState(selectedId);

  function selectSegment(segmentId: string) {
    setSelect(segmentId);
    onSelect(segmentId);
  }

  useEffect(() => {
    setSelect(selectedId);
  }, [selectedId]);

  return (
    <div className="segmented-controls">
      {segments.map((segment) => (
        <button
          key={Math.random().toString(20).slice(2, 6)}
          className={`segment-btn${select === segment.id ? ' segment-btn--active' : ''}`}
          type="button"
          onClick={() => selectSegment(segment.id)}
          onMouseUp={(e) => blurOnBubbling(e, '.segment-btn')}
        >
          <div className="segment-btn__base">
            {segment.iconSrc && <RawIcon size="small" src={segment.iconSrc} />}
            {segment.text && <Text variant="b2">{segment.text}</Text>}
          </div>
        </button>
      ))}
    </div>
  );
}

export default SegmentedControls;
