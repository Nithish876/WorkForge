import React, { useState } from 'react';
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
  useMantineColorScheme,
} from '@mantine/core';
import {
  Plus,
  Calendar,
  Eye,
  EyeOff,
  Trash2,
  Edit2,
  Clock,
  AlertCircle,
  CheckCircle2,
  CheckCircle,
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
  badgeVariant: 'light' | 'filled' | 'outline';
}

const COLUMNS: ColumnDef[] = [
  { id: 'todo', title: 'To Do', color: 'gray', badgeVariant: 'light' },
  { id: 'in_progress', title: 'In Progress', color: 'indigo', badgeVariant: 'light' },
  { id: 'review', title: 'Under Review', color: 'orange', badgeVariant: 'light' },
  { id: 'done', title: 'Done', color: 'teal', badgeVariant: 'light' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  projectId,
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
        return 'teal';
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
    const sourceStatus = source.droppableId as TaskStatus;
    const destStatus = destination.droppableId as TaskStatus;

    // Clone tasks array
    const newTasks = Array.from(tasks);
    const draggedTaskIndex = newTasks.findIndex((t) => t.id === taskId);
    if (draggedTaskIndex === -1) return;

    const [movedTask] = newTasks.splice(draggedTaskIndex, 1);
    movedTask.status = destStatus;

    // Get all tasks in destination column
    const destTasks = newTasks.filter((t) => t.status === destStatus);
    destTasks.splice(destination.index, 0, movedTask);

    // Re-index sort_order for destination tasks
    destTasks.forEach((t, idx) => {
      t.sort_order = idx;
    });

    // Recombine all tasks
    const otherTasks = newTasks.filter((t) => t.status !== destStatus);
    const updatedFullList = [...otherTasks, ...destTasks];

    // Optimistic UI update
    onTasksChange(updatedFullList);

    try {
      await api.patch(`/tasks/${taskId}/move`, {
        newStatus: destStatus,
        newSortOrder: destination.index,
      });
    } catch (err: any) {
      // Revert if API fails
      onTasksChange(tasks);
      notifications.show({
        title: 'Move Failed',
        message: 'Could not sync task movement with the server',
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
        color: updatedVisible ? 'teal' : 'gray',
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
                  radius="md"
                  style={{
                    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Group justify="space-between" mb="xs">
                    <Group gap="xs">
                      <Badge color={col.color} variant="filled" size="sm">
                        {columnTasks.length}
                      </Badge>
                      <Text fw={700} size="sm">
                        {col.title}
                      </Text>
                    </Group>

                    <ActionIcon
                      variant="subtle"
                      size="sm"
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
                            ? isDark
                              ? 'rgba(99, 102, 241, 0.12)'
                              : 'rgba(99, 102, 241, 0.08)'
                            : 'transparent',
                          borderRadius: 8,
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
                                radius="md"
                                p="sm"
                                shadow={dragSnapshot.isDragging ? 'lg' : 'xs'}
                                className="kanban-card"
                                style={{
                                  ...dragProvided.draggableProps.style,
                                  backgroundColor: isDark ? '#0f172a' : '#ffffff',
                                  borderColor: dragSnapshot.isDragging
                                    ? '#6366f1'
                                    : isDark
                                    ? '#334155'
                                    : '#e2e8f0',
                                  cursor: 'grab',
                                }}
                                onClick={() => onOpenTaskModal(task)}
                              >
                                <Group justify="space-between" align="flex-start" mb={6}>
                                  <Badge
                                    size="xs"
                                    variant="light"
                                    color={getPriorityColor(task.priority)}
                                  >
                                    {task.priority.toUpperCase()}
                                  </Badge>

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
                                        color={task.is_client_visible ? 'teal' : 'gray'}
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
                              border: `1px dashed ${isDark ? '#334155' : '#cbd5e1'}`,
                              borderRadius: 8,
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
