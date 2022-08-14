export function handlePropsParse(
  value: string,
  key: string,
  component: string,
) {
  let type = "";
  let result;
  try {
    if (!Number.isNaN(value)) {
      type = "number";
      result = +value;
    } else if (/\{.*?\}/.test(value)) {
      type = "object";
      result = JSON.parse(value);
    } else if (/\[.*?\]/.test(value)) {
      type = "array";
      result = JSON.parse(value);
    } else {
      type = "string";
      result = value;
    }
  } catch (e) {
    throw new Error(
      `"Error: parsing of the value of ${key} failed as type ${type} of component ${component}`,
    );
  }
  return result;
}

export function midReplace(start, end, payload, toReplace) {
  return payload.substring(0, start) + toReplace + payload.substring(end);
}
