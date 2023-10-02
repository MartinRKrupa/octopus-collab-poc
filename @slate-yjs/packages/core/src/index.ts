import { RelativeRange } from './model/types';
import {
  CursorEditor,
  CursorState,
  CursorStateChangeEvent,
  RemoteCursorChangeEventListener,
  withCursors,
  WithCursorsOptions,
  withYHistory,
  WithYHistoryOptions,
  withYjs,
  WithYjsOptions,
  YHistoryEditor,
  YjsEditor,
} from './plugins';
import { slateNodesToInsertDelta, yTextToSlateElement, deltaInsertToSlateNode } from './utils/convert';
import { yTextToInsertDelta, normalizeInsertDelta, getInsertDeltaLength, getInsertLength, sliceInsertDelta  } from './utils/delta';
import { applyYjsEvents, translateYjsEvent } from './applyToSlate';
import { applySlateOp } from './applyToYjs';
import {
  relativePositionToSlatePoint,
  relativeRangeToSlateRange,
  slatePointToRelativePosition,
  slateRangeToRelativeRange,
} from './utils/position';

export {
  withYjs,
  WithYjsOptions,
  YjsEditor,
  // History plugin
  withYHistory,
  WithYHistoryOptions,
  YHistoryEditor,
  // Base cursor plugin
  CursorEditor,
  WithCursorsOptions,
  withCursors,
  CursorState,
  RemoteCursorChangeEventListener,
  CursorStateChangeEvent,
  // Utils
  RelativeRange,
  yTextToSlateElement,
  slateNodesToInsertDelta,
  slateRangeToRelativeRange,
  relativeRangeToSlateRange,
  slatePointToRelativePosition,
  relativePositionToSlatePoint,
  deltaInsertToSlateNode,
  //YS vs SLATEJS conversions
  applyYjsEvents, 
  translateYjsEvent,
  applySlateOp,
  //Deltas info
  yTextToInsertDelta, 
  normalizeInsertDelta, 
  getInsertDeltaLength, 
  getInsertLength, 
  sliceInsertDelta
};
