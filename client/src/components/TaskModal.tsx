import React, { useState, useEffect } from 'react';
import {
  Modal,
  TextInput,
  Textarea,
  Select,
  Switch,
  Button,
  Group,
  Stack,
  Text,
} from '@mantine/core';
import { Task, TaskPriority, TaskStatus } from '../types';

interface TaskModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (taskData: {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    is_client_visible: boolean;
    due_date?: string | null;
  }) => Promise<void>;
  task?: Task | null;
  defaultStatus?: TaskStatus;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  opened,
  onClose,
  onSubmit,
  task,
  defaultStatus = 'todo',
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [isClientVisible, setIsClientVisible] = useState(true);
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setIsClientVisible(task.is_client_visible);
      setDueDate(task.due_date ? task.due_date.substring(0, 10) : '');
    } else {
      setTitle('');
      setDescription('');
      setStatus(defaultStatus);
      setPriority('medium');
      setIsClientVisible(true);
      setDueDate('');
    }
  }, [task, defaultStatus, opened]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        is_client_visible: isClientVisible,
        due_date: dueDate || null,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={700}>{task ? 'Edit Task' : 'Create New Task'}</Text>}
      radius="md"
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Task Title"
            placeholder="e.g. Integrate Stripe webhook listeners"
            required
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
          />

          <Textarea
            label="Description"
            placeholder="Technical details, acceptance criteria, or client notes..."
            minRows={3}
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
          />

          <Group grow>
            <Select
              label="Column / Status"
              data={[
                { value: 'todo', label: 'To Do' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'review', label: 'Under Review' },
                { value: 'done', label: 'Done' },
              ]}
              value={status}
              onChange={(val) => setStatus((val as TaskStatus) || 'todo')}
            />

            <Select
              label="Priority"
              data={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
              ]}
              value={priority}
              onChange={(val) => setPriority((val as TaskPriority) || 'medium')}
            />
          </Group>

          <TextInput
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.currentTarget.value)}
          />

          <Switch
            label="Visible to Client on Portal"
            description="Toggle off to keep internal technical items hidden from the client view"
            checked={isClientVisible}
            onChange={(e) => setIsClientVisible(e.currentTarget.checked)}
            color="indigo"
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" color="indigo" loading={submitting}>
              {task ? 'Save Changes' : 'Create Task'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
