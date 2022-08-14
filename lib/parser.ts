import { handlePropsParse, midReplace } from "./utils";
import { murmurHash } from "ohash";

enum Delimiters {
  "opening_tag_start" = "<",
  "closing_tag_short_end" = "/>",
}

interface Return {
  type: "icon" | "component" | "schema";
  name: string;
  props: Record<string, any>;
  hash: string;
}

export class Parser {
  private html: string;
  private currIdx: number = 0;
  constructor(_html) {
    this.html = _html;
  }
  private readUntil(until: string) {
    const uptillIdx = this.html.indexOf(until, this.currIdx);
    const result = this.html.slice(this.currIdx, uptillIdx + until.length);
    this.currIdx = uptillIdx + until.length;
    return result;
  }
  private read() {
    this.currIdx += 1;
    return this.html.charAt(this.currIdx - 1);
  }
  private readSourceAvailable() {
    return this.currIdx !== this.html.length;
  }
  *parse(): Generator<Return, string, string> {
    function parseTHEProps(
      component_name,
      hashNeeded: boolean = false,
    ): [Object, string] {
      const key_value_pair = this.readUntil(
        Delimiters.closing_tag_short_end,
      ).trim();
      let props = {};
      let pair = "";
      for (let char of key_value_pair) {
        if (char === " ") {
          if (pair) {
            pair = "";
            // construct the key and value
            let [key, value] = pair.trim().split("=");
            value = value.slice(1, -1);
            if (key.startsWith(":")) {
              key = key.slice(1);
              value = handlePropsParse(value, key, component_name);
            }
            props[key] = value;
          }
          continue;
        } else {
          pair += char;
        }
      }
      return [
        props,
        hashNeeded
          ? murmurHash(component_name + key_value_pair).toString()
          : "",
      ];
    }
    const parseProps = parseTHEProps.bind(this);
    while (this.readSourceAvailable()) {
      const char = this.read();
      // maybe a custom component
      if (char === Delimiters.opening_tag_start) {
        const startingIndex = this.currIdx - 1;
        const firstLetterOfComponent = this.read();
        const component_name =
          firstLetterOfComponent + this.readUntil(" ").trim();

        /**
         * Schema component
         */
        if (component_name.startsWith("Schema")) {
          let [props] = parseProps(component_name);
          yield {
            type: "schema",
            name: component_name.split("Schema")[1],
            props,
            hash: "",
          };
          const endingIndex = this.currIdx;
          this.currIdx = startingIndex + 1;
          this.html = midReplace(startingIndex, endingIndex, this.html, "");
          /**
           * User Component
           */
        } else if (/^[A-Z]/.test(component_name)) {
          let [props, hash] = parseProps(component_name, true);
          const renderedValue = yield {
            type: "component",
            name: component_name,
            props,
            hash,
          };
          const endingIndex = this.currIdx;
          this.currIdx = startingIndex + renderedValue.length - 1;
          this.html = midReplace(
            startingIndex,
            endingIndex,
            this.html,
            renderedValue,
          );
          /**
           * Icon component
           */
        } else if (component_name.startsWith("i-")) {
          let [props] = parseProps(component_name);
          const renderedValue: string = yield {
            type: "icon",
            name: component_name,
            props,
            hash: "",
          };
          const endingIndex = this.currIdx;
          this.currIdx = startingIndex + renderedValue.length - 1;
          this.html = midReplace(
            startingIndex,
            endingIndex,
            this.html,
            renderedValue,
          );
        }
      }
    }
    return this.html.trim();
  }
}
