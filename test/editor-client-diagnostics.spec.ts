import { IDatabaseAdapter } from "../src/database-adapter";
import { IEditorAdapter } from "../src/editor-adapter";
import { EditorClient } from "../src/editor-client";
import { TextOperation } from "../src/text-operation";

type Callbacks = Record<string, (...args: unknown[]) => void>;

const SECRET = "SECRET_DOCUMENT_TEXT";

function setup() {
  let editorCallbacks: Callbacks = {};
  let databaseCallbacks: Callbacks = {};
  let text = "";

  const editorAdapter = {
    registerCallbacks: (c: Callbacks) => {
      editorCallbacks = c;
    },
    registerUndo: jest.fn(),
    registerRedo: jest.fn(),
    getCursor: () => null,
    setCursor: jest.fn(),
    setInitiated: jest.fn(),
    getText: () => text,
    applyOperation: jest.fn(),
    invertOperation: jest.fn(),
  };
  const databaseAdapter = {
    registerCallbacks: (c: Callbacks) => {
      databaseCallbacks = c;
    },
    sendOperation: jest.fn(),
    sendCursor: jest.fn(),
    isCurrentUser: () => false,
  };
  const client = new EditorClient(
    (databaseAdapter as unknown) as IDatabaseAdapter,
    (editorAdapter as unknown) as IEditorAdapter
  );

  return {
    client,
    // local edit: appends `str`, with an explicit (possibly inconsistent) inverse operation
    typeLocally: (str: string, inverse: TextOperation) => {
      const op = new TextOperation()
        .retain(text.length, null)
        .insert(str, null);
      text += str;
      editorCallbacks.change(op, inverse);
    },
    receiveRemote: (op: TextOperation) => databaseCallbacks.operation(op),
  };
}

describe("EditorClient apply-failure diagnostics", () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it("does not log when a remote operation applies cleanly", () => {
    const { client, typeLocally, receiveRemote } = setup();
    typeLocally("ab", new TextOperation().retain(0, null).delete(2));
    expect(() =>
      receiveRemote(new TextOperation().insert("XY", null).retain(0, null))
    ).not.toThrow();
    expect(errorSpy).not.toHaveBeenCalled();
    client.dispose();
  });

  it("logs lengths (never content) and rethrows when applying fails", () => {
    const { client, typeLocally, receiveRemote } = setup();
    // inverse with a wrong base length (3 + 1) to make the undo stack inconsistent
    typeLocally(
      SECRET,
      new TextOperation().retain(0, null).delete(SECRET.length + 1)
    );

    expect(() =>
      receiveRemote(new TextOperation().insert("XY", null).retain(0, null))
    ).toThrow("Both operations have to have the same base length");

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const [message, details] = errorSpy.mock.calls[0];
    expect(message).toBe("[firepad] Failed to apply remote operation");
    expect(details).toMatchObject({
      message: "Both operations have to have the same base length",
      clientState: "awaitingConfirm",
      editorLength: SECRET.length,
    });
    // Both stacks are read by private field name; assert they are really found,
    // so a rename in the undo manager fails this test instead of silently
    // turning the diagnostics into nulls.
    expect(details.undoStack).toMatchObject({ depth: 1 });
    expect(details.redoStack).toMatchObject({ depth: 0 });
    expect(details.remoteOperation).toEqual({ base: 0, target: 2 });
    expect(JSON.stringify(details)).not.toContain(SECRET);
    client.dispose();
  });

  it("stops logging after the first few failures", () => {
    const { client, typeLocally, receiveRemote } = setup();
    typeLocally(
      SECRET,
      new TextOperation().retain(0, null).delete(SECRET.length + 1)
    );

    // Once the client is in a bad state every later remote operation fails the same way.
    for (let i = 0; i < 10; i++) {
      expect(() =>
        receiveRemote(new TextOperation().insert("X", null).retain(2, null))
      ).toThrow();
    }

    // 5 detailed logs, then 1 notice that logging stopped, then silence.
    expect(errorSpy).toHaveBeenCalledTimes(6);
    expect(errorSpy.mock.calls[5][0]).toContain("will not be logged");
    client.dispose();
  });
});
