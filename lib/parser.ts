import { handlePropsParse, midReplace } from "./utils";
import { objectHash, murmurHash } from "ohash";

interface ParseType {
  name: string;
  props: Record<string, any>;
  children?: string;
  hash: string;
}
export function* Parse(
  html: string,
  selector: RegExp,
): Generator<ParseType, string, string> {
  let currIdx = -1;
  function incrementIdx() {
    currIdx++;
  }
  function readNextChar() {
    return html.charAt(currIdx);
  }
  function readUntil(test: RegExp) {
    let result = "";
    while (readSourceAvailable()) {
      incrementIdx();
      const token = readNextChar();
      if (test.test(readNextChar())) {
        currIdx--;
        return result;
      } else {
        result += token;
      }
    }
  }
  function readSourceAvailable() {
    // since we increment first and then read
    return currIdx + 1 !== html.length;
  }

  function parseElementHeader(elemName: string): [Object, boolean] {
    let props = {};
    let key = "";
    while (readSourceAvailable()) {
      incrementIdx();
      const nextChar = readNextChar();
      if (nextChar === "/") {
        incrementIdx();
        if (readNextChar() === ">") {
          return [props, true];
        }
      } else if (nextChar === "=" && html.charAt(currIdx + 1) === '"') {
        incrementIdx(); // to skip the starting quote
        const value = readUntil(/\"/);
        if (key.startsWith(":")) {
          props[key.slice(1)] = handlePropsParse(value, key, elemName);
        } else {
          props[key] = value;
        }
        incrementIdx(); // since we are aware that quote is gonna be the next char
      } else if (nextChar === ">") {
        return [props, false];
      }
    }
  }

  function replaceResultAndUpdateIdxAccordingly(startingIdx, renderedValue) {
    const endingIndex = currIdx;
    currIdx = startingIdx + renderedValue.length; // cause of the way we update
    html = midReplace(startingIdx, endingIndex, html, renderedValue);
  }

  interface Component {
    name: string;
    hash: string;
    props: Object;
    startIdx: number;
  }
  const store: Map<string, Component[]> = new Map();

  function updateStore(compInfo: Component) {
    if (store.has(compInfo.name)) {
      store.set(compInfo.name, store.get(compInfo.name).concat([compInfo]));
    } else {
      store.set(compInfo.name, [compInfo]);
    }
  }

  function retrieveFromStore(elemName: string) {
    return store.get(elemName).pop();
  }

  while (readSourceAvailable()) {
    incrementIdx();
    const token = readNextChar();
    if (token === "<") {
      const startIdx = currIdx;
      const elementName = readUntil(/ |\//);
      if (selector.test(elementName)) {
        let props, shortend;
        if (html.charAt(currIdx + 1) === "/") {
          // resolve this edge case
          [props, shortend] = parseElementHeader(elementName);
          incrementIdx(); // important
        } else {
          [props, shortend] = [{}, true];
        }
        const hash = murmurHash(
          objectHash({ props, name: elementName }),
        ).toString();
        if (shortend) {
          const result = yield { props, name: elementName, hash };
          replaceResultAndUpdateIdxAccordingly(startIdx, result);
        } else {
          updateStore({ name: elementName, props, startIdx, hash });
        }
      }
    } else if (token === "<") {
      incrementIdx();
      const nextToken = readNextChar();
      if (nextToken === "/") {
        const elemName = readUntil(/\>/);
        if (store.has(elemName)) {
          incrementIdx(); // so that replaceResult func picks up the end idx correctly
          const compInfo = retrieveFromStore(elemName);
          const children = html.slice(
            compInfo.startIdx,
            currIdx - (3 + elemName.length),
          );
          const result = yield {
            name: compInfo.name,
            props: compInfo.props,
            hash: compInfo.hash,
            children,
          };
          replaceResultAndUpdateIdxAccordingly(compInfo.startIdx, result);
        }
      }
    }
  }
  return html;
}
