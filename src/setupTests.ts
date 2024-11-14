// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// > ReferenceError: TextDecoder is not defined
// TextDecoder is not supported by jsdom; the following is a workaround
// see: https://github.com/jsdom/jsdom/issues/2524#issuecomment-897707183
import { TextDecoder, TextEncoder } from "util";

global.TextEncoder = TextEncoder;
// @ts-ignore
global.TextDecoder = TextDecoder;
