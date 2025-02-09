import React, { FormEventHandler } from 'react';
import './Input.scss';

import TextareaAutosize from 'react-autosize-textarea';

function Input({
  id = undefined,
  label = '',
  name = '',
  value = '',
  placeholder = '',
  required = false,
  type = 'text',
  onChange = undefined,
  forwardRef = undefined,
  resizable = false,
  minHeight = 46,
  onResize = undefined,
  state = 'normal',
  onKeyDown = undefined,
  disabled = false,
  autoFocus = false,
}: {
  id?: string;
  label?: string;
  name?: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
  onChange?: FormEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  forwardRef?: React.Ref<HTMLInputElement | HTMLTextAreaElement>;
  resizable?: boolean;
  minHeight?: number;
  onResize?: (_event: Event) => void;
  state?: 'normal' | 'success' | 'error';
  onKeyDown?: (_event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <div className="input-container">
      {label !== '' && (
        <label className="input__label text-b2" htmlFor={id}>
          {label}
        </label>
      )}
      {resizable ? (
        <TextareaAutosize
          dir="auto"
          style={{ minHeight: `${minHeight}px` }}
          name={name}
          id={id}
          className={`input input--resizable${state !== 'normal' ? ` input--${state}` : ''}`}
          ref={forwardRef as React.Ref<HTMLTextAreaElement>}
          type={type}
          placeholder={placeholder}
          required={required}
          defaultValue={value}
          autoComplete="off"
          onChange={onChange}
          onResize={onResize}
          onKeyDown={onKeyDown}
          disabled={disabled}
          autoFocus={autoFocus}
          // react complains if we don't have these two
          onPointerEnterCapture={undefined}
          onPointerLeaveCapture={undefined}
        />
      ) : (
        <input
          dir="auto"
          ref={forwardRef as React.Ref<HTMLInputElement>}
          id={id}
          name={name}
          className={`input ${state !== 'normal' ? ` input--${state}` : ''}`}
          type={type}
          placeholder={placeholder}
          required={required}
          defaultValue={value}
          autoComplete="off"
          onChange={onChange}
          onKeyDown={onKeyDown}
          disabled={disabled}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={autoFocus}
        />
      )}
    </div>
  );
}

export default Input;
