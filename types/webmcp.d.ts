import 'react';

/**
 * Declarative WebMCP attributes: the browser (or the polyfill) turns an
 * annotated form into a tool, deriving the schema from the named controls.
 * @see https://github.com/webmachinelearning/webmcp
 */
declare module 'react' {
  interface FormHTMLAttributes<T> {
    toolname?: string;
    tooldescription?: string;
    toolautosubmit?: boolean;
  }
}
