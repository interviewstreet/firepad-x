import * as monaco from "monaco-editor";

export interface IMonacoEditorUtilsAdapter {
  getTrackedRangeStickiness(option: keyof typeof monaco.editor.TrackedRangeStickiness): monaco.editor.TrackedRangeStickiness;
  getEditorOption(option: string): any;
  getCursorChangeReason(option: keyof typeof monaco.editor.CursorChangeReason): monaco.editor.CursorChangeReason;
  getContentWidgetPositionPreference(option: keyof typeof monaco.editor.ContentWidgetPositionPreference): monaco.editor.ContentWidgetPositionPreference;
  Range: typeof monaco.Range;
}

export class NativeMonacoEditorUtils implements IMonacoEditorUtilsAdapter {
  getTrackedRangeStickiness(option: keyof typeof monaco.editor.TrackedRangeStickiness): monaco.editor.TrackedRangeStickiness {
    return monaco.editor.TrackedRangeStickiness[option];
  }

  getEditorOption(option: string) {
    // @ts-ignore
    return monaco.editor.EditorOption[option];
  }

  getCursorChangeReason(option: keyof typeof monaco.editor.CursorChangeReason): monaco.editor.CursorChangeReason {
    return monaco.editor.CursorChangeReason[option];
  }

  getContentWidgetPositionPreference(option: keyof typeof monaco.editor.ContentWidgetPositionPreference): monaco.editor.ContentWidgetPositionPreference {
    return monaco.editor.ContentWidgetPositionPreference[option];
  }

  Range = monaco.Range;
}
