import { Meta, StoryObj } from 'storybook-react-rsbuild';
import { BaseItem, EditionCoordinates, Matrix, MatrixProps } from './Matrix';
import { Circle, Group, Text } from 'react-konva';
import { Html } from 'react-konva-utils';
import { ComponentProps, useCallback, useState } from 'react';

import type Konva from 'konva';

const initialTasks = [
  { id: 'origin', x: 0, y: 0, label: '', color: '#fff', radius: 8 },
];

const meta: Meta<typeof Matrix> = {
  title: 'Matrix/Matrix',
  component: Matrix,
};
export default meta;

type QuadrantFn = (editing: EditionCoordinates | null) => { color: string; radius: number }

function makeQuadrantHandler({
  q1,
  q2,
  q3,
  q4,
}: {
  q1?: QuadrantFn;
  q2?: QuadrantFn;
  q3?: QuadrantFn;
  q4?: QuadrantFn;
}) {
  return (editing: EditionCoordinates | null) => {
    const x = editing?.firstLayer?.x ?? 0;

    const y = -(editing?.firstLayer?.y ?? 0);

    if (x > 0 && y > 0 && q1) return q1(editing);
    if (x < 0 && y > 0 && q2) return q2(editing);
    if (x < 0 && y < 0 && q3) return q3(editing);
    if (x > 0 && y < 0 && q4) return q4(editing);

    return { color: '#cccccc', radius: 32 };
  };
}


const exaggeratedGetQuadrantProps = makeQuadrantHandler({
  q1: (editing) => {
    const x = editing?.firstLayer?.x ?? 0;

    const red = Math.min(255, 160 + Math.floor(Math.abs(x) / 8));
    const green = 80;
    const blue = 80;
    return {
      color: `rgb(${red},${green},${blue})`,
      radius: 32 + Math.floor(Math.abs(x) / 30),
    };
  },
  q2: (editing) => {
    const x = editing?.firstLayer?.x ?? 0;
    const y = -(editing?.firstLayer?.y ?? 0);
    const green = Math.min(255, 160 + Math.floor(Math.abs(y) / 8));
    const red = 80;
    const blue = 80;
    const darkness = Math.max(0, 255 - Math.floor(Math.abs(x) / 8));
    return {
      color: `rgb(${red},${Math.floor(green * darkness / 255)},${blue})`,
      radius: 32 + Math.floor(Math.abs(y) / 30),
    };
  },
  q3: () => {
    // Use a dark gray for strong contrast with white text
    return { color: '#222831', radius: 32 };
  },
  q4: (editing) => {
    const y = -(editing?.firstLayer?.y ?? 0);
    // Use a deep blue for strong contrast with white text
    const blue = Math.min(255, 120 + Math.floor(Math.abs(y) / 8));
    return {
      color: `rgb(40,80,${blue})`,
      radius: 32 + Math.floor(Math.abs(y) / 30),
    };
  },
});

function TaskItem({ task, dispatch }: { task: BaseItem & { color: string; radius: number }, dispatch: any }) {
  const [editing, setEditing] = useState(false);


  const onDoubleClick = useCallback((event: Konva.KonvaEventObject<MouseEvent>) => {
    event.cancelBubble = true;
    setEditing(true);
  }, [])

  return (
      <Group
        x={task.x}
        y={task.y}
        draggable={!!task.label}
        onDragEnd={(e) => {
          const abs = e.target.getAbsolutePosition();
          const { color, radius } = exaggeratedGetQuadrantProps({ stage: abs, firstLayer: e.target.getPosition() });
          dispatch({
            type: 'update',
            id: task.id,
            updates: {
              x: e.target.x(),
              y: e.target.y(),
              color,
              radius,
            },
          });
        }}
        onDblClick={onDoubleClick}
      >
        <Circle radius={task.radius} fill={task.color} />
        {task.label && !editing && (
          <Text text={task.label} fontSize={18} fill="#fff" x={-16} y={-10} />
        )}

        {editing && (
          <Html>
            <HtmlInputFormOverlay
              action={(formData: FormData) => {
                const value = formData.get('editLabel')
                dispatch({ type: 'update', id: task.id, updates: { label: value } });
                setEditing(false);
              }}
              onBlur={() => setEditing(false)}
            />
          </Html>
        )}
      </Group>

  );
}

function HtmlInputFormOverlay(props: ComponentProps<'form'>){
  return (
    <form
      style={{
        display: 'grid',
        background: '#222',
        color: '#fff',
        border: '1px solid #888',
        borderRadius: 4,
        padding: '2px 6px',
        fontSize: 16,
      }}
      {...props}
    >
      <input
        type="text"
        name="editLabel"
        autoFocus
        placeholder="Edit label"
        style={{ background: 'inherit', color: 'inherit', border: 'none', outline: 'none', fontSize: 16 }}
      />
      <button>Save</button>
    </form>
  );
}

export const QuadrantTasks: StoryObj<
  MatrixProps<BaseItem & { color: string; radius: number }>
> = {
  args: {
    renderInput(editing, setEditing, dispatch) {
      return (
        <form
          style={{display: 'grid'}}
          action={function (formData) {
            const taskname = formData.get('taskName') as string;
            const x = editing?.firstLayer.x ?? 0;
            const y = editing?.firstLayer.y ?? 0;
            const { color, radius } = exaggeratedGetQuadrantProps(editing);
            dispatch({
              type: 'add',
              item: {
                id: Math.random().toString(36).substring(2, 15),
                x,
                y,
                label: taskname,
                color,
                radius,
              },
            });
            setEditing(null);
          }}
        >
          <input
            type="text"
            name="taskName"
            autoFocus
            placeholder="Task name"
          />
          <button>Save</button>
        </form>
      );
    },
    initialItems: initialTasks,
    height: window.innerHeight - 10,
    width: window.innerWidth - 10,
    renderItem(task, dispatch) {
      return <TaskItem key={task.id} task={task} dispatch={dispatch} />;
    },
  },
  name: 'Matrix with 4 Tasks in Each Quadrant',
};
