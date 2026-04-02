import * as React from "react";

type CompositionHandlers<T extends HTMLElement> = {
  onKeyDown?: React.KeyboardEventHandler<T>;
  onCompositionStart?: React.CompositionEventHandler<T>;
  onCompositionEnd?: React.CompositionEventHandler<T>;
};

export function useComposition<T extends HTMLElement>(
  handlers: CompositionHandlers<T>
) {
  const onCompositionStart = React.useCallback<React.CompositionEventHandler<T>>(
    (event) => {
      handlers.onCompositionStart?.(event);
    },
    [handlers]
  );

  const onCompositionEnd = React.useCallback<React.CompositionEventHandler<T>>(
    (event) => {
      handlers.onCompositionEnd?.(event);
    },
    [handlers]
  );

  const onKeyDown = React.useCallback<React.KeyboardEventHandler<T>>(
    (event) => {
      handlers.onKeyDown?.(event);
    },
    [handlers]
  );

  return {
    onCompositionStart,
    onCompositionEnd,
    onKeyDown,
  };
}
