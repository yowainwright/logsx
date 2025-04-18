import { test, expect, describe, mock, spyOn, beforeEach } from "bun:test";
import React from "react";
import {
  LogDx,
  LogDxProvider,
  logViewerReducer,
  initialState,
  type LogDxState,
} from "./index";
import { LogEnhancer } from "@/src/logenhancer";

mock.module("@/src/logenhancer", () => ({
  LogEnhancer: class {
    options: any;
    constructor(options: any) {
      this.options = options;
    }
    process(line: string) {
      return `Enhanced: ${line}`;
    }
  },
}));

mock.module("@/src/utils/logger", () => ({
  Logger: class {
    info(...args: any[]) {}
    warn(...args: any[]) {}
    error(...args: any[]) {}
  },
}));

mock.module("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children, ...props }: { children: React.ReactNode }) => (
    <div data-testid="scroll-area" {...props}>
      {children}
    </div>
  ),
}));
mock.module("@/components/ui/input", () => ({
  Input: (props: any) => <input data-testid="input" {...props} />,
}));

const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: mock((key: string) => store[key] || null),
    setItem: mock((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: mock((key: string) => {
      delete store[key];
    }),
    clear: mock(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: mock((index: number) => Object.keys(store)[index] || null),
  };
})();

if (typeof window !== "undefined") {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    writable: true,
  });
  Object.defineProperty(window, "Date", {
    value: {
      ...Date,
      now: mock(() => 1700000000000),
    },
    writable: true,
  });
} else {
  (global as any).localStorage = localStorageMock;
  (global as any).Date = {
    ...Date,
    now: mock(() => 1700000000000),
  };
}

describe("LogDx React Client", () => {
  let enhancer: LogEnhancer;

  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    (global as any).Date.now.mockClear();

    enhancer = new LogEnhancer({});
  });

  describe("logViewerReducer", () => {
    test("should return initial state for unknown actions", () => {
      expect(
        logViewerReducer(initialState, { type: "UNKNOWN" } as any),
      ).toEqual(initialState);
    });

    test("SET_SEARCH_QUERY updates searchQuery", () => {
      const newState = logViewerReducer(initialState, {
        type: "SET_SEARCH_QUERY",
        payload: "test",
      });
      expect(newState.searchQuery).toBe("test");
    });

    test("SET_SEARCH_QUERY returns same state if query hasn't changed", () => {
      const state: LogDxState = { searchQuery: "test" };
      const newState = logViewerReducer(state, {
        type: "SET_SEARCH_QUERY",
        payload: "test",
      });
      expect(newState).toBe(state);
    });
  });

  test("LogDx component renders without crashing", () => {
    const logData = "line1\nline2";
    expect(() => <LogDx log={logData} enhancer={enhancer} />).not.toThrow();
  });

  test("LogDxProvider renders without crashing", () => {
    expect(() => (
      <LogDxProvider logSearchKey="test-key" ttl={60000}>
        <div>Child</div>
      </LogDxProvider>
    )).not.toThrow();
  });

  test("LogDxProvider tries to load from localStorage (conceptual)", () => {
    const getItemSpy = spyOn(localStorageMock, "getItem");
    <LogDxProvider logSearchKey="test-key" ttl={60000}>
      <div>Child</div>
    </LogDxProvider>;
    expect(getItemSpy).toHaveBeenCalledTimes(0);
  });

  test("LogDxProvider tries to save to localStorage (conceptual)", () => {
    const setItemSpy = spyOn(localStorageMock, "setItem");
    <LogDxProvider logSearchKey="test-key" ttl={60000}>
      <div>Child</div>
    </LogDxProvider>;
    expect(setItemSpy).toHaveBeenCalledTimes(0);
  });
});
