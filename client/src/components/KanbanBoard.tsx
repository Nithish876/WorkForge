import React from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import {
  Paper,
  Text,
  Badge,
  Group,
  Stack,
  ActionIcon,
  Tooltip,
  Card,
  Button,
  Box,
  Image,
  useMantineColorScheme,
} from '@mantine/core';
import {
  Plus,
  Calendar,
  Eye,
  EyeOff,
  Trash2,
  ImageIcon,
} from 'lucide-react';
import { Task, TaskStatus, TaskPriority } from '../types';
import { api } from '../api/client';
import { notifications } from '@mantine/notifications';

interface KanbanBoardProps {
  projectId: number;
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  onOpenTaskModal: (task?: Task, defaultStatus?: TaskStatus) => void;
  onDeleteTask: (taskId: number) => void;
}

interface ColumnDef {
  id: TaskStatus;
  title: string;
  color: string;
}

const COLUMNS: ColumnDef[] = [
  { id: 'todo', title: 'To Do', color: 'gray' },
  { id: 'in_progress', title: 'In Progress', color: 'green' },
  { id: 'review', title: 'Under Review', color: 'yellow' },
  { id: 'done', title: 'Done', color: 'green' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  projectId: _projectId,
  tasks,
  onTasksChange,
  onOpenTaskModal,
  onDeleteTask,
}) => {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'high':
        return 'red';
      case 'medium':
        return 'yellow';
      case 'low':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const taskId = parseInt(draggableId, 10);
    const destStatus = destination.droppableId as TaskStatus;

    // Clone tasks array
    const newTasks = Array.from(tasks);
    const draggedTaskIndex = newTasks.findIndex((t) => t.id === taskId);
    if (draggedTaskIndex === -1) return;

    const [movedTask] = newTasks.splice(draggedTaskIndex, 1);
    movedTask.status = destStatus;

    // Destination column tasks
    const destTasks = newTasks.filter((t) => t.status === destStatus);
    destTasks.splice(destination.index, 0, movedTask);

    // Update sort_order for destination tasks
    destTasks.forEach((t, idx) => {
      t.sort_order = idx;
    });

    const otherTasks = newTasks.filter((t) => t.status !== destStatus);
    const reorderedTasks = [...otherTasks, ...destTasks];

    onTasksChange(reorderedTasks);

    try {
      await api.patch(`/tasks/${taskId}`, {
        status: destStatus,
        sort_order: destination.index,
      });
    } catch {
      onTasksChange(tasks);
      notifications.show({
        title: 'Error',
        message: 'Failed to update task status on server',
        color: 'red',
      });
    }
  };

  const handleToggleClientVisibility = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedVisible = !task.is_client_visible;

    // Optimistic update
    const updatedTasks = tasks.map((t) =>
      t.id === task.id ? { ...t, is_client_visible: updatedVisible } : t
    );
    onTasksChange(updatedTasks);

    try {
      await api.patch(`/tasks/${task.id}`, {
        is_client_visible: updatedVisible,
      });
      notifications.show({
        title: 'Visibility Updated',
        message: updatedVisible
          ? 'Task is now visible on the Client Portal'
          : 'Task is now hidden from the Client Portal',
        color: 'gray',
        autoClose: 2000,
      });
    } catch {
      onTasksChange(tasks);
    }
  };

  return (
    <Box>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Box
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
            overflowX: 'auto',
            paddingBottom: 16,
          }}
        >
          {COLUMNS.map((col) => {
            const columnTasks = tasks
              .filter((t) => t.status === col.id)
              .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);

            return (
              <Box
                key={col.id}
                style={{
                  minWidth: 280,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Paper
                  withBorder
                  p="sm"
                  radius="lg"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Group justify="space-between" mb="xs">
                    <Group gap="xs">
                      <Badge color={col.color} variant={col.id === 'in_progress' ? 'filled' : 'light'} size="xs" radius="xl">
                        {columnTasks.length}
                      </Badge>
                      <Text fw={700} size="sm">
                        {col.title}
                      </Text>
                    </Group>

                    <ActionIcon
                      variant="subtle"
                      size="sm"
                      radius="xl"
                      color="gray"
                      onClick={() => onOpenTaskModal(undefined, col.id)}
                    >
                      <Plus size={16} />
                    </ActionIcon>
                  </Group>

                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <Stack
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        gap="xs"
                        style={{
                          flex: 1,
                          minHeight: 350,
                          backgroundColor: snapshot.isDraggingOver
                            ? 'rgba(20, 168, 0, 0.08)'
                            : 'transparent',
                          borderRadius: 12,
                          padding: 4,
                          transition: 'background-color 0.2s ease',
                        }}
                      >
                        {columnTasks.map((task, index) => (
                          <Draggable
                            key={task.id}
                            draggableId={String(task.id)}
                            index={index}
                          >
                            {(dragProvided, dragSnapshot) => (
                              <Card
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                withBorder
                                radius="lg"
                                p="sm"
                                shadow={dragSnapshot.isDragging ? 'lg' : 'xs'}
                                className="kanban-card"
                                style={{
                                  ...dragProvided.draggableProps.style,
                                  backgroundColor: 'var(--bg-card)',
                                  borderColor: dragSnapshot.isDragging
                                    ? 'var(--accent-primary)'
                                    : 'var(--border-subtle)',
                                  cursor: 'grab',
                                  overflow: 'hidden',
                                }}
                                onClick={() => onOpenTaskModal(task)}
                              >
                                {task.image_url && (
                                  <Card.Section mb="sm">
                                    <Image
                                      src={task.image_url}
                                      height={125}
                                      alt={task.title}
                                      fit="cover"
                                      fallbackSrc="https://placehold.co/600x300/18181b/ffffff?text=Task+Image"
                                    />
                                  </Card.Section>
                                )}

                                <Group justify="space-between" align="flex-start" mb={6}>
                                  <Group gap={6}>
                                    <Badge
                                      size="xs"
                                      variant="light"
                                      color={getPriorityColor(task.priority)}
                                    >
                                      {task.priority.toUpperCase()}
                                    </Badge>
                                    {task.image_url && (
                                      <Tooltip label="Image attached">
                                        <Badge size="xs" variant="outline" color="gray" leftSection={<ImageIcon size={10} />}>
                                          Image
                                        </Badge>
                                      </Tooltip>
                                    )}
                                  </Group>

                                  <Group gap={4}>
                                    <Tooltip
                                      label={
                                        task.is_client_visible
                                          ? 'Visible to Client in Portal'
                                          : 'Hidden from Client Portal (Internal)'
                                      }
                                    >
                                      <ActionIcon
                                        size="xs"
                                        variant="subtle"
                                        radius="xl"
                                        color={task.is_client_visible ? 'green' : 'gray'}
                                        onClick={(e) => handleToggleClientVisibility(task, e)}
                                      >
                                        {task.is_client_visible ? (
                                          <Eye size={13} />
                                        ) : (
                                          <EyeOff size={13} />
                                        )}
                                      </ActionIcon>
                                    </Tooltip>

                                    <ActionIcon
                                      size="xs"
                                      variant="subtle"
                                      radius="xl"
                                      color="red"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteTask(task.id);
                                      }}
                                    >
                                      <Trash2 size={13} />
                                    </ActionIcon>
                                  </Group>
                                </Group>

                                <Text size="sm" fw={600} mb={4} lineClamp={2}>
                                  {task.title}
                                </Text>

                                {task.description && (
                                  <Text size="xs" c="dimmed" lineClamp={2} mb={8}>
                                    {task.description}
                                  </Text>
                                )}

                                {task.due_date && (
                                  <Group gap={4} mt={6} c="dimmed">
                                    <Calendar size={12} />
                                    <Text size="11px">
                                      {new Date(task.due_date).toLocaleDateString()}
                                    </Text>
                                  </Group>
                                )}
                              </Card>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}

                        {columnTasks.length === 0 && !snapshot.isDraggingOver && (
                          <Box
                            p="md"
                            style={{
                              textAlign: 'center',
                              border: '1px dashed var(--border-subtle)',
                              borderRadius: 12,
                              marginTop: 8,
                            }}
                          >
                            <Text size="xs" c="dimmed">
                              No tasks in {col.title.toLowerCase()}
                            </Text>
                          </Box>
                        )}
                      </Stack>
                    )}
                  </Droppable>

                  <Button
                    variant="subtle"
                    color="gray"
                    size="xs"
                    radius="xl"
                    leftSection={<Plus size={14} />}
                    mt="xs"
                    fullWidth
                    onClick={() => onOpenTaskModal(undefined, col.id)}
                  >
                    Add Task
                  </Button>
                </Paper>
              </Box>
            );
          })}
        </Box>
      </DragDropContext>
    </Box>
  );
};
