import React, { useState, useEffect, useRef } from 'react';
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
  Box,
  Image,
  ActionIcon,
  Tooltip,
  Paper,
  Loader,
} from '@mantine/core';
import { UploadCloud, Image as ImageIcon, Trash2, Check } from 'lucide-react';
import { Task, TaskPriority, TaskStatus } from '../types';
import { api } from '../api/client';
import { notifications } from '@mantine/notifications';

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
    image_url?: string | null;
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
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setIsClientVisible(task.is_client_visible);
      setDueDate(task.due_date ? task.due_date.substring(0, 10) : '');
      setImageUrl(task.image_url || null);
    } else {
      setTitle('');
      setDescription('');
      setStatus(defaultStatus);
      setPriority('medium');
      setIsClientVisible(true);
      setDueDate('');
      setImageUrl(null);
    }
  }, [task, defaultStatus, opened]);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/tasks/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success && res.data.data?.image_url) {
        setImageUrl(res.data.data.image_url);
        notifications.show({
          title: 'Image Attached',
          message: 'Task cover image uploaded successfully',
          color: 'gray',
          icon: <Check size={16} />,
        });
      }
    } catch (err: any) {
      notifications.show({
        title: 'Upload Failed',
        message: err.response?.data?.error || 'Could not upload image',
        color: 'red',
      });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setImageUrl(null);
  };

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
        image_url: imageUrl || null,
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
      radius="lg"
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {/* Task Cover Image Upload Section */}
          <Box>
            <Text size="xs" fw={600} mb={6}>
              Task Cover Image / Screenshot
            </Text>

            {imageUrl ? (
              <Box style={{ position: 'relative', borderRadius: 12, overflow: 'hidden' }}>
                <Image
                  src={imageUrl}
                  alt="Task cover"
                  h={160}
                  radius="md"
                  fit="cover"
                  fallbackSrc="https://placehold.co/600x400/18181b/ffffff?text=Image+Preview"
                />
                <Tooltip label="Remove image">
                  <ActionIcon
                    color="red"
                    variant="filled"
                    size="sm"
                    radius="xl"
                    style={{ position: 'absolute', top: 8, right: 8 }}
                    onClick={handleRemoveImage}
                  >
                    <Trash2 size={14} />
                  </ActionIcon>
                </Tooltip>
              </Box>
            ) : (
              <Paper
                withBorder
                p="md"
                radius="lg"
                style={{
                  borderStyle: 'dashed',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handleImageFileChange}
                />
                <Group justify="center" gap="xs">
                  {uploadingImage ? (
                    <Loader size="sm" color="green" />
                  ) : (
                    <UploadCloud size={18} color="var(--accent-primary)" />
                  )}
                  <Text size="xs" fw={500} c="dimmed">
                    {uploadingImage ? 'Uploading image...' : 'Upload cover or screenshot (JPG, PNG, WebP)'}
                  </Text>
                </Group>
              </Paper>
            )}
          </Box>

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
            color="green"
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" radius="xl" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" color="green" radius="xl" loading={submitting}>
              {task ? 'Save Changes' : 'Create Task'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
