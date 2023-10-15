import React, { useEffect, useRef } from 'react';
import './Math.scss';

import katex from 'katex';
import 'katex/dist/katex.min.css';

import 'katex/dist/contrib/copy-tex';

const Math = React.memo(
  ({
    content,
    throwOnError,
    errorColor,
    displayMode,
  }: {
    content: string;
    throwOnError?: boolean;
    errorColor?: string;
    displayMode?: boolean;
  }) => {
    const ref = useRef(null);

    useEffect(() => {
      katex.render(content, ref.current, { throwOnError, errorColor, displayMode });
    }, [content, throwOnError, errorColor, displayMode]);

    return <span ref={ref} />;
  },
);

export default Math;
