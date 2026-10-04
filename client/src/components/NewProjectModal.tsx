import React, { useState } from 'react';
import {
  Modal,
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  Stack,
  Text,
  Switch,
} from '@mantine/core';
import { Client, ProjectStatus } from '../types';

interface NewProjectModalProps {
  opened: boolean;
  onClose: () => void;
  clients: Client[];
  onSubmit: (projectData: {
    client_id: number;
    title: string;
    description: string;
    github_repo: string;
    status: ProjectStatus;
    deadline?: string | null;
    is_public?: boolean;
  }) => Promise<void>;
  onOpenNewClient: () => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  opened,
  onClose,
  clients,
  onSubmit,
  onOpenNewClient,
}) => {
  const [clientId, setClientId] = useState<string>(
    clients.length > 0 ? String(clients[0].id) : ''
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [deadline, setDeadline] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !clientId) return;

    setSubmitting(true);
    try {
      await onSubmit({
        client_id: parseInt(clientId, 10),
        title: title.trim(),
        description: description.trim(),
        github_repo: githubRepo.trim(),
        status,
        deadline: deadline || null,
        is_public: isPublic,
      });
      // Reset form
      setTitle('');
      setDescription('');
      setGithubRepo('');
      setStatus('active');
      setDeadline('');
      setIsPublic(true);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={700}>Create New Project</Text>}
      size="md"
      radius="lg"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Project Title"
            placeholder="e.g. SaaS Analytics Dashboard"
            required
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
          />

          <Stack gap={4}>
            <Select
              label="Assigned Client"
              placeholder="Select client"
              data={clients.map((c) => ({
                value: String(c.id),
                label: `${c.name} ${c.company ? `(${c.company})` : ''}`,
              }))}
              value={clientId}
              onChange={(val) => setClientId(val || '')}
              required
            />
            {clients.length === 0 && (
              <Button
                variant="subtle"
                size="xs"
                color="green"
                radius="xl"
                onClick={() => {
                  onClose();
                  onOpenNewClient();
                }}
              >
                No clients found. Click to add a client first.
              </Button>
            )}
          </Stack>

          <Textarea
            label="Description & Scope"
            placeholder="Brief scope, client expectations, deliverable summary..."
            minRows={2}
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
          />

          <TextInput
            label="GitHub Repository"
            placeholder="owner/repo (e.g. facebook/react)"
            description="Used to stream real-time commit timelines directly to the dashboard"
            value={githubRepo}
            onChange={(e) => setGithubRepo(e.currentTarget.value)}
          />

          <Group grow>
            <Select
              label="Status"
              data={[
                { value: 'active', label: 'Active' },
                { value: 'on_hold', label: 'On Hold' },
                { value: 'completed', label: 'Completed' },
              ]}
              value={status}
              onChange={(val) => setStatus((val as ProjectStatus) || 'active')}
            />

            <TextInput
              label="Target Deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.currentTarget.value)}
            />
          </Group>

          <Switch
            label="Public Project"
            description="Display this project in your public profile and portfolio showcase"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.currentTarget.checked)}
            color="green"
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" radius="xl" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" color="green" radius="xl" loading={submitting}>
              Create Project
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
