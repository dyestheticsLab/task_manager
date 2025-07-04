import React, {
  useState,
  useReducer,
  ComponentProps,
  useCallback,
} from 'react';
import { Stage, Layer, Line, Group } from 'react-konva';

import type Konva from 'konva';
import './Matrix.css';
import { Html } from 'react-konva-utils';

export interface BaseItem {
  id: string;
  x: number;
  y: number;
  label: string;
}

const scaleBy = 1.2;

function zoom(this: Konva.Stage, event: Konva.KonvaEventObject<WheelEvent>) {
  const { evt } = event;
  const oldScale = this.scaleX();
  const pointer = this.getPointerPosition();

  if (!pointer) return;

  const mousePointTo = {
    x: (pointer.x - this.x()) / oldScale,
    y: (pointer.y - this.y()) / oldScale,
  };

  const direction = evt.deltaY < 0 ? 1 : -1;

  const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

  this.scale({
    x: newScale,
    y: newScale,
  });

  const newPos = {
    x: pointer.x - mousePointTo.x * newScale,
    y: pointer.y - mousePointTo.y * newScale,
  };

  this.position(newPos);
}

export interface MatrixProps<T extends BaseItem> {
  width?: number;
  height?: number;
  initialItems?: T[];
  renderItem: (
    item: T,
    dispatch: React.Dispatch<ItemAction<T>>,
  ) => React.ReactNode;
  renderInput: (
    editing: EditionCoordinates | null,
    setEditing: React.Dispatch<React.SetStateAction<EditionCoordinates | null>>,
    dispatch: React.Dispatch<ItemAction<T>>,
  ) => React.ReactNode;
  containerProps?: ComponentProps<'div'>;
  onCanvasDblClick?: (coords: EditionCoordinates) => void;
}

type ItemAction<T extends BaseItem> =
  | { type: 'add'; item: T }
  | { type: 'bulkAdd'; items: T[] }
  | { type: 'init'; items: T[] }
  | { type: 'update'; id: string; updates: Partial<T> }
  | { type: 'bulkUpdate'; predicate: (item: T) => boolean; updates: Partial<T> }
  | { type: 'delete'; id?: string; predicate?: (item: T) => boolean }
  | { type: 'bulkDelete'; predicate: (item: T) => boolean };

function itemsReducer<T extends BaseItem>(
  state: T[],
  action: ItemAction<T>,
): T[] {
  switch (action.type) {
    case 'add':
      return [...state, action.item];
    case 'bulkAdd':
      return [...state, ...action.items];
    case 'init':
      return action.items;
    case 'update':
      return state.map((t) =>
        t.id === action.id ? { ...t, ...action.updates } : t
      );
    case 'bulkUpdate':
      return state.map((t) =>
        action.predicate(t) ? { ...t, ...action.updates } : t
      );
    case 'delete':
      if (action.id) {
        return state.filter((t) => t.id !== action.id);
      } else if (action.predicate) {
        return state.filter((t) => !action.predicate!(t));
      }
      return state;
    case 'bulkDelete':
      return state.filter((t) => !action.predicate(t));
    default:
      return state;
  }
}

const infinite = 10000;

export interface EditionCoordinates {
  stage: {
    x: number;
    y: number;
  };
  firstLayer: {
    x: number;
    y: number;
  };
}

export function Matrix<T extends BaseItem>({
  width = 800,
  height = 800,
  initialItems,
  renderItem,
  renderInput,
  containerProps,
  onCanvasDblClick,
}: MatrixProps<T>) {
  const [stagePos] = useState(() => ({ x: width / 2, y: height / 2 }));

  const [items, dispatch] = useReducer(itemsReducer<T>, initialItems ?? []);
  const [editing, setEditing] = useState<null | EditionCoordinates>(null);

  const handleDblClick = useCallback(function (
    this: Konva.Stage,
    event: Konva.KonvaEventObject<MouseEvent>,
  ) {
    const isHere = event.target === this

    if (isHere) {
      const positon = this.getPointerPosition();
      const [firstLayer] = this.getLayers();
      const layerPosition = firstLayer.getRelativePointerPosition();
      if (!positon || !layerPosition) return;
      const coords = {
        firstLayer: layerPosition,
        stage: positon,
      };
      setEditing(coords);
      if (typeof onCanvasDblClick === 'function') {
        onCanvasDblClick(coords);
      }
    }
  }, [onCanvasDblClick]);

  return (
    <div
      {...containerProps}
      className={`matrix-container ${containerProps?.className ?? ''}`}
    >
      <div className="matrix-axis-overlay-vertical">
        <span className="matrix-axis-label-vertical">Important</span>
        <svg
          width="16"
          height={height}
          viewBox={`0 0 16 ${height}`}
          className="matrix-axis-arrow-vertical"
        >
          <line
            x1="8"
            y1={height - 10}
            x2="8"
            y2="0"
            stroke="#fff"
            strokeWidth="3"
            markerEnd="url(#arrowhead)"
          />
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="8"
              refX="4"
              refY="4"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <polygon points="0 0, 8 4, 0 8" fill="#fff" />
            </marker>
          </defs>
        </svg>
      </div>
      <div className="matrix-axis-overlay-horizontal">
        <svg
          width={width}
          height="16"
          viewBox={`0 0 ${width} 16`}
          className="matrix-axis-arrow-horizontal"
        >
          <line
            x1="0"
            y1="8"
            x2={width - 10}
            y2="8"
            stroke="#fff"
            strokeWidth="3"
            markerEnd="url(#arrowhead2)"
          />
          <defs>
            <marker
              id="arrowhead2"
              markerWidth="8"
              markerHeight="8"
              refX="4"
              refY="4"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <polygon points="0 0, 8 4, 0 8" fill="#fff" />
            </marker>
          </defs>
        </svg>
        <span className="matrix-axis-label-horizontal">Urgent</span>
      </div>
      <Stage
        width={width}
        height={height}
        onWheel={zoom}
        x={0}
        y={0}
        offsetX={0}
        offsetY={0}
        draggable={true}
        onDblClick={handleDblClick}
        style={{ background: 'transparent' }}
      >
        <Layer x={stagePos.x} y={stagePos.y}>
          <Line
            points={[-infinite, 0, infinite, 0]}
            stroke="#60a5fa"
            strokeWidth={4}
          />
          <Line
            points={[0, -infinite, 0, infinite]}
            stroke="#60a5fa"
            strokeWidth={4}
          />
          <Group>{items.map((item) => renderItem(item, dispatch))}</Group>
          {editing && <Html
            groupProps={{
              x:editing.firstLayer.x,
              y:editing.firstLayer.y
            }}
          >
            {renderInput(editing, setEditing, dispatch)}
          </Html>
            }
        </Layer>
      </Stage>
      
    </div>
  );
}

export default Matrix;
