/* eslint-disable import/prefer-default-export */
import React, { lazy, Suspense } from 'react';
import EMOJI_REGEX from 'emojibase-regex';

import linkifyHtml from 'linkify-html';
import * as linkify from 'linkifyjs';
import parse from 'html-react-parser';
import { sanitizeText } from './sanitize';
import { clearUrlsFromHtml } from './clear-urls/clearUrls';

export const TWEMOJI_BASE_URL = '/public/emoji/';

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
 * @param shouldLinkify convert links to html tags (default: false)
 * @param sanitize sanitize html text (default: true)
 * @param maths render maths (default: false)
 * @returns React component
 */
export function twemojify(
  text: string,
  opts?: { className?: string },
  shouldLinkify: boolean = false,
  sanitize: boolean = true,
  maths: boolean = false,
): React.ReactNode {
  if (typeof text !== 'string') return text;
  let content = text;

  if (sanitize) {
    content = sanitizeText(content);
  }

  // RegExp based on emoji's official Unicode standards
  // http://www.unicode.org/Public/UNIDATA/EmojiSources.txt
  content = content.replace(EMOJI_REGEX, (match) => {
    // remove unnecessary variation selector codepoint
    const cleanedMatch = match.indexOf('\u200d') < 0 ? match.replaceAll('\uFE0F', '') : match;
    // concatenate codepoints with -
    const emoji = [...cleanedMatch].map((c) => c.codePointAt(0)!.toString(16)).join('-');

    const className = opts?.className ? `emoji ${opts.className}` : 'emoji';

    return `<img class="${className}" src="${TWEMOJI_BASE_URL}${emoji}.svg" alt="${match}" />`;
  });

  if (shouldLinkify) {
    content = linkifyHtml(content, {
      target: '_blank',
      rel: 'noreferrer noopener',
    });
  }

  content = clearUrlsFromHtml(content);

  return parse(content, maths ? mathOptions : null);
}
