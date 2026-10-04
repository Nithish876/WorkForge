import React, { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  TextInput,
  Select,
  Button,
  Group,
  Text,
  Avatar,
  Badge,
  Paper,
  ActionIcon,
  Tooltip,
  Divider,
  Alert,
  Loader,
  Center,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Users, UserPlus, Trash2, Shield, AlertCircle, Check } from 'lucide-react';
import { api } from '../api/client';
import { ProjectCollaborator, CollaboratorRole } from '../types';

interface CollaboratorsModalProps {
  opened: boolean;
  onClose: () => void;
  projectId: number;
  projectTitle: string;
  isOwner: boolean;
  onCollaboratorChange?: () => void;
}

export const CollaboratorsModal: React.FC<CollaboratorsModalProps> = ({
  opened,
  onClose,
  projectId,
  projectTitle,
  isOwner,
  onCollaboratorChange,
}) => {
  const [collaborators, setCollaborators] = useState<ProjectCollaborator[]>([]);
  const [owner, setOwner] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<CollaboratorRole>('contributor');
  const [inviting, setInviting] = useState(false);

  const fetchCollaborators = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await api.get(`/projects/${projectId}/collaborators`);
      if (res.data?.success) {
        setCollaborators(res.data.data.collaborators || []);
        setOwner(res.data.data.owner || null);
      }
    } catch (err: any) {
      notifications.show({
        title: 'Error',
        message: err.response?.data?.message || 'Failed to load team collaborators',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (opened && projectId) {
      fetchCollaborators();
    }
  }, [opened, projectId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      notifications.show({
        title: 'Validation',
        message: 'Please provide a valid email address',
        color: 'red',
      });
      return;
    }

    setInviting(true);
    try {
      const res = await api.post(`/projects/${projectId}/collaborators`, {
        email: inviteEmail.trim(),
        name: inviteName.trim() || undefined,
        role: inviteRole,
      });

      if (res.data?.success) {
        notifications.show({
          title: 'Collaborator Invited',
          message: res.data.message || 'Invitation sent successfully',
          color: 'green',
          icon: <Check size={16} />,
        });
        setInviteEmail('');
        setInviteName('');
        setInviteRole('contributor');
        fetchCollaborators();
        onCollaboratorChange?.();
      }
    } catch (err: any) {
      notifications.show({
        title: 'Invite Failed',
        message: err.response?.data?.message || 'Could not invite collaborator',
        color: 'red',
      });
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (userId: number, userName: string) => {
    try {
      const res = await api.delete(`/projects/${projectId}/collaborators/${userId}`);
      if (res.data?.success) {
        notifications.show({
          title: 'Removed',
          message: `${userName} was removed from the project`,
          color: 'gray',
        });
        fetchCollaborators();
        onCollaboratorChange?.();
      }
    } catch (err: any) {
      notifications.show({
        title: 'Error',
        message: err.response?.data?.message || 'Failed to remove collaborator',
        color: 'red',
      });
    }
  };

  const handleRoleChange = async (userId: number, newRole: CollaboratorRole) => {
    try {
      const res = await api.put(`/projects/${projectId}/collaborators/${userId}`, {
        role: newRole,
      });
      if (res.data?.success) {
        notifications.show({
          title: 'Updated',
          message: `Collaborator permissions updated to ${newRole}`,
          color: 'gray',
        });
        fetchCollaborators();
        onCollaboratorChange?.();
      }
    } catch (err: any) {
      notifications.show({
        title: 'Error',
        message: err.response?.data?.message || 'Failed to update permissions',
        color: 'red',
      });
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <Users size={18} />
          <Text fw={700}>Project Collaborators</Text>
        </Group>
      }
      size="lg"
      radius="lg"
    >
      <Stack gap="md">
        <Text size="xs" c="dimmed">
          Manage who can collaborate on <Text span fw={600}>"{projectTitle}"</Text>.
          Only the project owner can invite or modify team members.
        </Text>

        {/* Owner Card */}
        {owner && (
          <Paper withBorder p="sm" radius="lg">
            <Group justify="space-between">
              <Group gap="sm">
                <Avatar color="green" radius="xl" size="md">
                  {owner.name?.substring(0, 2).toUpperCase()}
                </Avatar>
                <div>
                  <Group gap={6}>
                    <Text size="sm" fw={600}>
                      {owner.name}
                    </Text>
                    <Badge size="xs" variant="filled" color="green" radius="xl">
                      Project Owner
                    </Badge>
                  </Group>
                  <Text size="xs" c="dimmed">
                    {owner.email}
                  </Text>
                </div>
              </Group>
              <Tooltip label="Full administrative control over this project">
                <Badge size="xs" variant="outline" color="green" radius="xl" leftSection={<Shield size={10} />}>
                  Owner Permission
                </Badge>
              </Tooltip>
            </Group>
          </Paper>
        )}

        {/* Invite Form (Owner Only) */}
        {isOwner && (
          <Paper withBorder p="sm" radius="lg" style={{ backgroundColor: 'var(--bg-surface)' }}>
            <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="xs">
              Invite New Collaborator
            </Text>
            <form onSubmit={handleInvite}>
              <Stack gap="xs">
                <Group grow align="flex-start">
                  <TextInput
                    placeholder="colleague@domain.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.currentTarget.value)}
                    required
                    size="sm"
                  />
                  <TextInput
                    placeholder="Name (Optional)"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.currentTarget.value)}
                    size="sm"
                  />
                </Group>
                <Group justify="space-between">
                  <Select
                    data={[
                      { value: 'contributor', label: 'Contributor (Can edit tasks & upload assets)' },
                      { value: 'viewer', label: 'Viewer (Read-only project access)' },
                    ]}
                    value={inviteRole}
                    onChange={(val) => setInviteRole((val as CollaboratorRole) || 'contributor')}
                    size="xs"
                    style={{ flex: 1, maxWidth: 360 }}
                  />
                  <Button
                    type="submit"
                    size="xs"
                    color="green"
                    radius="xl"
                    leftSection={<UserPlus size={14} />}
                    loading={inviting}
                  >
                    Invite
                  </Button>
                </Group>
              </Stack>
            </form>
          </Paper>
        )}

        <Divider label="Active Team Members" labelPosition="center" />

        {/* Collaborators List */}
        {loading ? (
          <Center p="lg">
            <Loader size="sm" color="green" />
          </Center>
        ) : collaborators.length === 0 ? (
          <Paper withBorder p="md" radius="lg" style={{ textAlign: 'center' }}>
            <Text size="xs" c="dimmed">
              No additional collaborators invited yet.
            </Text>
            {isOwner && (
              <Text size="xs" c="dimmed" mt={4}>
                Use the form above to invite team members to collaborate on tasks and milestones.
              </Text>
            )}
          </Paper>
        ) : (
          <Stack gap="xs">
            {collaborators.map((c) => (
              <Paper key={c.id} withBorder p="sm" radius="lg">
                <Group justify="space-between">
                  <Group gap="sm">
                    <Avatar color="gray" radius="xl" size="sm">
                      {c.user_name ? c.user_name.substring(0, 2).toUpperCase() : 'CO'}
                    </Avatar>
                    <div>
                      <Group gap={6}>
                        <Text size="sm" fw={600}>
                          {c.user_name}
                        </Text>
                        <Badge
                          size="xs"
                          variant="outline"
                          radius="xl"
                          color={c.role === 'contributor' ? 'green' : 'gray'}
                        >
                          {c.role.toUpperCase()}
                        </Badge>
                      </Group>
                      <Text size="xs" c="dimmed">
                        {c.user_email}
                      </Text>
                    </div>
                  </Group>

                  <Group gap="xs">
                    {isOwner ? (
                      <>
                        <Select
                          size="xs"
                          value={c.role}
                          data={[
                            { value: 'contributor', label: 'Contributor' },
                            { value: 'viewer', label: 'Viewer' },
                          ]}
                          onChange={(val) =>
                            handleRoleChange(c.user_id, (val as CollaboratorRole) || 'contributor')
                          }
                          style={{ width: 120 }}
                        />
                        <Tooltip label="Remove from project">
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            size="sm"
                            radius="xl"
                            onClick={() => handleRemove(c.user_id, c.user_name || 'Collaborator')}
                          >
                            <Trash2 size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </>
                    ) : (
                      <Badge size="xs" variant="light" color="gray" radius="xl">
                        {c.role}
                      </Badge>
                    )}
                  </Group>
                </Group>
              </Paper>
            ))}
          </Stack>
        )}

        <Group justify="flex-end" mt="sm">
          <Button variant="default" size="sm" radius="xl" onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
