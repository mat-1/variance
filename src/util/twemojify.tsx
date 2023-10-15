/* eslint-disable import/prefer-default-export */
import React, { lazy, Suspense } from 'react';

import linkifyHtml from 'linkify-html';
import * as linkify from 'linkifyjs';
import parse from 'html-react-parser';
import twemoji from 'twemoji';
import { sanitizeText } from './sanitize';
import { clearUrlsFromHtml } from './clear-urls/clearUrls';

export const TWEMOJI_BASE_URL = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/';

const Math = lazy(() => import('../app/atoms/math/Math'));

const mathOptions = {
  replace: (node) => {
    const maths = node.attribs?.['data-mx-maths'];
    if (maths) {
      return (
        <Suspense fallback={<code>{maths}</code>}>
          <Math
            content={maths}
            throwOnError={false}
            errorColor="var(--tc-danger-normal)"
            displayMode={node.name === 'div'}
          />
        </Suspense>
      );
    }
    return null;
  },
};

linkify.registerCustomProtocol('gopher');
linkify.registerCustomProtocol('gemini');

/**
 * @param text text to twemojify
 * @param opts options for twemoji.parse
 * @param shouldLinkify convert links to html tags (default: false)
 * @param sanitize sanitize html text (default: true)
 * @param maths render maths (default: false)
 * @returns React component
 */
export function twemojify(
  text: string,
  opts?: { base?: string; className?: string },
  shouldLinkify: boolean = false,
  sanitize: boolean = true,
  maths: boolean = false,
): React.ReactNode {
  if (typeof text !== 'string') return text;
  let content = text;
  const options = opts ?? { base: TWEMOJI_BASE_URL };
  if (!options.base) {
    options.base = TWEMOJI_BASE_URL;
  }

  if (sanitize) {
    content = sanitizeText(content);
  }

  content = twemoji.parse(content, options);
  if (shouldLinkify) {
    content = linkifyHtml(content, {
      target: '_blank',
      rel: 'noreferrer noopener',
    });
  }

  content = clearUrlsFromHtml(content);

  return parse(content, maths ? mathOptions : null);
}
