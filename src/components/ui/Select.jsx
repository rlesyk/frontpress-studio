import { forwardRef } from 'react';
import { baseControlCls, hasWidthClass } from './Input.jsx';

// Native <select> with appearance stripped + an absolutely-positioned chevron.
// Width comes from the consumer's className on the wrapper (e.g. `w-32`); the
// inner <select> always fills the wrapper.
const Select = forwardRef(function Select(
  { className = '', children, ...rest },
  ref
) {
  const wrapperWidth = hasWidthClass(className) ? '' : 'w-full';
  return (
    <span className={`relative block ${wrapperWidth} ${className}`}>
      <select
        ref={ref}
        className={`${baseControlCls} w-full appearance-none pr-8`}
        {...rest}
      >
        {children}
      </select>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </span>
  );
});

export default Select;
