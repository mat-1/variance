import React, { useCallback, useMemo, useState } from 'react';
import { Editable, ReactEditor, Slate, withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import { Text, Descendant, createEditor } from 'slate';
import './MarkdownInput.scss';
import { SingleASTNode } from '@khanacademy/simple-markdown';
import PropTypes from 'prop-types';
import { mdParser } from '../../../util/markdown';
import { getShortcodeToEmoji } from '../../organisms/emoji-board/custom-emoji';

function Leaf({
  attributes,
  children,
  leaf,
}: {
  attributes: string[];
  children: string[];
  leaf: {
    classes?: string[];
  };
}) {
  return (
    <span {...attributes} className={leaf.classes?.join(' ')}>
      {children}
    </span>
  );
}

Leaf.propTypes = {
  attributes: PropTypes.arrayOf(PropTypes.string),
  children: PropTypes.arrayOf(PropTypes.string),
  leaf: PropTypes.shape({
    classes: PropTypes.arrayOf(PropTypes.string),
  }),
};

/**
 * Flatten Slate nodes into a single string.
 * @param nodes Slate nodes, you can get this from ReactEditor.children
 * @returns The flattened string
 */
export function flattenNodes(nodes: Descendant[]): string {
  const flat = nodes
    .map((node) => {
      if (Text.isText(node)) {
        return node.text;
      }
      return flattenNodes(node.children);
    })
    .join('\n');
  return flat;
}

export function MarkdownInput({
  onChange,
  onPaste,
  onKeyDown,
  placeholder,
  onCreateEditor,
  readOnly,
}: {
  onChange: (value: Descendant[]) => void;
  onPaste: (event: React.ClipboardEvent<HTMLDivElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  placeholder: string;
  onCreateEditor: (editor: ReactEditor) => void;
  readOnly?: boolean;
}) {
  const renderLeaf = useCallback((props) => <Leaf {...props} />, []);
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  onCreateEditor(editor);

  const decorate = useCallback(([node, path]) => {
    const ranges = [];
    if (!Text.isText(node)) {
      return ranges;
    }

    let position = 0;

    // let bold = false;
    // let italic = false;
    const enabledStyles = new Set<string>();

    function readSyntax(text: string) {
      const start = position;
      // read bytes until the first character of item.content is found
      let prefix = '';
      while (position < node.text.length && node.text[position] !== text[0]) {
        prefix += node.text[position];
        position += 1;
      }
      if (start !== position) {
        ranges.push({
          anchor: { path, offset: start },
          focus: { path, offset: start + prefix.length },
          classes: ['syntax'],
        });
      }
    }

    function addRanges(content: SingleASTNode[] | string) {
      if (typeof content === 'string') {
        const start = position;
        readSyntax(content);
        const prefixLength = position - start;
        position += content.length;
        if (enabledStyles.size > 0) {
          ranges.push({
            anchor: { path, offset: start + prefixLength },
            focus: { path, offset: position },
            classes: [...enabledStyles],
          });
        }
        return;
      }

      for (let i = 0; i < content.length; i += 1) {
        const item = content[i];
        if (item.content) {
          let style: string | undefined;
          if (item.type === 'strong') style = 'bold';
          if (item.type === 'em') style = 'italic';
          if (item.type === 'inlineCode') style = 'inline-code';
          if (item.type === 'del') style = 'strikethrough';
          if (item.type === 'u') style = 'underline';

          if (style) enabledStyles.add(style);
          addRanges(item.content);
          if (style) enabledStyles.delete(style);
        }
      }
    }

    // const emojis = getShortcodeToEmoji(this.matrixClient, [room, ...parentRooms]);

    const content = mdParser(node.text, {
      userNames: [],
      emojis: {},
    });

    addRanges(content);

    // add final syntax range
    if (position < node.text.length) {
      ranges.push({
        anchor: { path, offset: position },
        focus: { path, offset: node.text.length },
        classes: ['syntax'],
      });
    }

    return ranges;
  }, []);

  const initialValue: Descendant[] = [
    {
      children: [{ text: '' }],
    },
  ];

  const [isEmpty, setIsEmpty] = useState(true);

  const onChangeInternal = (value: Descendant[]) => {
    const text = flattenNodes(value);
    setIsEmpty(text.length === 0);
    if (onChange) onChange(value);
  };

  return (
    <div className={`markdown-input${readOnly ? ' read-only' : ''}`}>
      <Slate editor={editor} initialValue={initialValue} onChange={onChangeInternal}>
        <Editable
          decorate={decorate}
          renderLeaf={renderLeaf}
          placeholder={placeholder}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          readOnly={readOnly}
          className={`markdown-input__editable${isEmpty ? ' empty' : ''}`}
        />
      </Slate>
    </div>
  );
}
