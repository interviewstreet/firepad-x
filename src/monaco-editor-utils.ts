import * as monaco from "monaco-editor";

/**
 * Monaco editor is built from vscode source, If we use firepad-x in vscode
 * we cannot add monaco-editor as a dependency as it will increase the bundle size
 * and we are just adding duplicate code which already exists in vscode
 * 
 * So we have created a adapter which provides native monaco editor utils
 * when used without vscode and when used with vscode the vscode consumer
 * provide vscode specific editor utils
 * 
 * For a normal consumer of firepad this should make no difference as 
 * NativeMonacoEditorUtils is used by default
 */
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
