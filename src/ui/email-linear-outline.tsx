'use client';

import type { Block } from '@/domain/email';
import { BlockFields } from './email-block-fields';
import type {ColumnEditorActions} from './email-column-controls';

export function EmailLinearOutline({
  sections,
  readOnly,
  locale,
  direction,
  onChangeBlock,
  onMove,
  onRemove,
  onSelect,
  columnActions,
}: {
  sections: Block[];
  readOnly: boolean;
  locale: string;
  direction: 'ltr' | 'rtl';
  onChangeBlock: (block: Block) => void;
  onMove: (id: string, position: number) => void;
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
  columnActions?: ColumnEditorActions;
}) {
  return (
    <section className="linear-email-outline panel" aria-label="Linear email Outline" lang="en" dir="ltr">
      <h2>Edit in Outline</h2>
      {sections.length === 0 ? (
        <p className="muted">This email has no blocks. Use Add block to start writing.</p>
      ) : (
        <ol className="linear-block-list">
          {sections.map((block, index) => (
            <li key={block.id}>
              <fieldset data-linear-block={block.id} onFocusCapture={() => onSelect(block.id)}>
                <legend>Block {index + 1} · {block.type}</legend>
                <BlockFields
                  block={block}
                  readOnly={readOnly}
                  locale={locale}
                  direction={direction}
                  linear
                  columnActions={columnActions}
                  onChange={(next) => {
                    if (!readOnly) onChangeBlock(next);
                  }}
                />
                <div className="linear-block-controls">
                  <button
                    type="button"
                    aria-label={`Move ${block.type} ${index + 1} up`}
                    disabled={readOnly || index === 0}
                    onClick={() => {
                      if (!readOnly && index > 0) onMove(block.id, index - 1);
                    }}
                  >
                    Move up
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${block.type} ${index + 1} down`}
                    disabled={readOnly || index === sections.length - 1}
                    onClick={() => {
                      if (!readOnly && index < sections.length - 1) onMove(block.id, index + 1);
                    }}
                  >
                    Move down
                  </button>
                  <label>
                    Move to position
                    <select
                      aria-label={`Move ${block.type} ${index + 1} to position`}
                      value={index}
                      disabled={readOnly}
                      onChange={(event) => {
                        if (!readOnly) onMove(block.id, Number(event.target.value));
                      }}
                    >
                      {sections.map((section, position) => (
                        <option key={section.id} value={position}>{position + 1}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    aria-label={`Delete ${block.type} ${index + 1}`}
                    disabled={readOnly}
                    onClick={() => {
                      if (!readOnly) onRemove(block.id);
                    }}
                  >
                    Delete block
                  </button>
                </div>
              </fieldset>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
