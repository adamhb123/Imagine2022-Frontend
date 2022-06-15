// Definition of "primitive" is loose here
export type PrimitiveTypeString =
  | "boolean"
  | "number"
  | "bigint"
  | "string"
  | "symbol"
  | "object";

export const stringToPrimitive = (
  string: string,
  desiredPrimitive: PrimitiveTypeString
) => {
  return {
    boolean: () => (string === "true" ? true : false),
    number: () => Number(string),
    bigint: () => BigInt(string),
    string: () => string,
    symbol: () => Symbol(string),
    object: () => JSON.parse(string),
  }[desiredPrimitive]();
};

export const buildPath = (...args: string[]) => {
  return args
    .map((part, i) => {
      if (i === 0) {
        return part.trim().replace(/[\/]*$/g, "");
      } else {
        return part.trim().replace(/(^[\/]*|[\/]*$)/g, "");
      }
    })
    .filter((x) => x.length)
    .join("/");
};

export const toggleVisibility = (
  elem: HTMLElement,
  visNullDefault?: string
) => {
  elem.style.visibility =
    elem.style.visibility !== ""
      ? elem.style.visibility === "visible"
        ? "hidden"
        : "visible"
      : typeof visNullDefault !== "undefined"
      ? visNullDefault
      : "hidden";
};

export const hideParentOnClick = (eventOrElement: MouseEvent | HTMLElement) => {
  let elem =
    eventOrElement instanceof MouseEvent
      ? (eventOrElement.target as HTMLElement).parentNode
      : eventOrElement;
  [].slice
    .call(elem?.children)
    .forEach((child: HTMLElement) => toggleVisibility(child));
  toggleVisibility(elem as HTMLElement);
};

export const getElementFromMouseEvent = (
  event: MouseEvent,
  fallbackId?: string
): HTMLElement => {
  let element = event.target as HTMLElement | null;
  if (!element) {
    if (fallbackId)
      element = document.getElementById(fallbackId) as HTMLElement;
    else {
      throw new Error(
        `elementClickedSafeguard: couldn't find element with fallbackId: ${fallbackId}`
      );
    }
  }
  return element;
};
