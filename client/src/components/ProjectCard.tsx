import React from 'react';
import {
  Card,
  Text,
  Badge,
  Group,
  Progress,
  Button,
  ActionIcon,
  Tooltip,
  Stack,
  Box,
  CopyButton,
} from '@mantine/core';
import {
  KanbanSquare,
  Calendar,
  FolderGit2,
  Share2,
  Check,
  Users,
  Lock,
  Globe2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Project, Client } from '../types';
import { notifications } from '@mantine/notifications';

interface ProjectCardProps {
  project: Project;
  client?: Client;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, client }) => {
  const navigate = useNavigate();

  const shareToken = client?.share_token;
  const portalUrl = shareToken
    ? `${window.location.origin}/portal/${shareToken}`
    : null;

  const isCollaborator = project.user_role && project.user_role !== 'owner';

  return (
    <Card
      withBorder
      shadow="xs"
      radius="lg"
      className="kanban-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        backgroundColor: 'var(--bg-card)',
      }}
    >
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Box style={{ flex: 1 }}>
            <Group gap="xs" mb={6} wrap="wrap">
              <Badge size="xs" variant="light" color="green" radius="xl">
                {project.status.replace('_', ' ').toUpperCase()}
              </Badge>

              {project.is_public === false ? (
                <Badge size="xs" variant="outline" color="yellow" radius="xl" leftSection={<Lock size={10} />}>
                  PRIVATE
                </Badge>
              ) : (
                <Badge size="xs" variant="outline" color="green" radius="xl" leftSection={<Globe2 size={10} />}>
                  PUBLIC
                </Badge>
              )}

              {isCollaborator ? (
                <Badge size="xs" variant="filled" color="green" radius="xl" leftSection={<Users size={10} />}>
                  {project.user_role?.toUpperCase()}
                </Badge>
              ) : (
                project.collaborators_count ? (
                  <Badge size="xs" variant="outline" color="gray" radius="xl" leftSection={<Users size={10} />}>
                    {project.collaborators_count} {project.collaborators_count === 1 ? 'member' : 'members'}
                  </Badge>
                ) : null
              )}

              {project.github_repo && (
                <Badge
                  size="xs"
                  variant="outline"
                  color="gray"
                  radius="xl"
                  leftSection={<FolderGit2 size={10} />}
                >
                  {project.github_repo.split('/')[1] || project.github_repo}
                </Badge>
              )}
            </Group>

            <Text
              fw={700}
              size="md"
              lineClamp={1}
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              {project.title}
            </Text>
          </Box>
        </Group>

        <Text size="xs" c="dimmed">
          Client: <Text span fw={600} c="green">{project.client_name || client?.name || 'Assigned Client'}</Text>
          {(project.client_company || client?.company) && ` (${project.client_company || client?.company})`}
        </Text>

        {project.description && (
          <Text size="xs" c="dimmed" lineClamp={2} style={{ minHeight: 34 }}>
            {project.description}
          </Text>
        )}

        <Box my="xs">
          <Group justify="space-between" mb={4}>
            <Text size="xs" fw={600} c="dimmed">
              Progress
            </Text>
            <Text size="xs" fw={700} c="green">
              {project.progress_percentage || 0}% ({project.completed_task_count || 0}/{project.task_count || 0} tasks)
            </Text>
          </Group>
          <Progress
            value={project.progress_percentage || 0}
            size="sm"
            radius="xl"
            color="green"
          />
        </Box>

        {project.deadline && (
          <Group gap={6} c="dimmed">
            <Calendar size={13} color="var(--accent-primary)" />
            <Text size="xs">Due {new Date(project.deadline).toLocaleDateString()}</Text>
          </Group>
        )}
      </Stack>

      <Group justify="space-between" mt="md" pt="sm" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <Button
          variant="light"
          color="green"
          size="xs"
          radius="xl"
          leftSection={<KanbanSquare size={14} />}
          onClick={() => navigate(`/projects/${project.id}`)}
          style={{ flex: 1 }}
        >
          Open Board
        </Button>

        {portalUrl && (
          <CopyButton value={portalUrl} timeout={2000}>
            {({ copied, copy }) => (
              <Tooltip label={copied ? 'Portal link copied!' : 'Copy Client Portal Link'}>
                <ActionIcon
                  color={copied ? 'teal' : 'green'}
                  variant="subtle"
                  size="md"
                  radius="xl"
                  onClick={() => {
                    copy();
                    notifications.show({
                      title: 'Link Copied',
                      message: 'Client Portal read-only link copied to clipboard!',
                      color: 'green',
                      icon: <Check size={16} />,
                    });
                  }}
                >
                  {copied ? <Check size={16} /> : <Share2 size={16} />}
                </ActionIcon>
              </Tooltip>
            )}
          </CopyButton>
        )}
      </Group>
    </Card>
  );
};
