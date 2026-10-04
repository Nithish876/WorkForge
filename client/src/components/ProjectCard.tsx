import React, { useState } from 'react';
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
  Copy,
  ExternalLink,
  Clock,
  CheckCircle2,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'teal';
      case 'completed':
        return 'blue';
      case 'on_hold':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const shareToken = client?.share_token;
  const portalUrl = shareToken
    ? `${window.location.origin}/portal/${shareToken}`
    : null;

  return (
    <Card
      withBorder
      shadow="sm"
      radius="md"
      className="kanban-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
      }}
    >
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Box style={{ flex: 1 }}>
            <Group gap="xs" mb={4}>
              <Badge size="sm" variant="light" color={getStatusColor(project.status)}>
                {project.status.replace('_', ' ').toUpperCase()}
              </Badge>
              {project.github_repo && (
                <Badge
                  size="sm"
                  variant="outline"
                  color="gray"
                  leftSection={<FolderGit2 size={12} />}
                >
                  {project.github_repo.split('/')[1] || project.github_repo}
                </Badge>
              )}
            </Group>

            <Text
              fw={700}
              size="lg"
              lineClamp={1}
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              {project.title}
            </Text>
          </Box>
        </Group>

        <Text size="xs" c="dimmed" fw={500}>
          Client: <Text span fw={600} c="indigo">{project.client_name || client?.name || 'Assigned Client'}</Text>
          {(project.client_company || client?.company) && ` (${project.client_company || client?.company})`}
        </Text>

        {project.description && (
          <Text size="sm" c="dimmed" lineClamp={2} style={{ minHeight: 38 }}>
            {project.description}
          </Text>
        )}

        <Box my="xs">
          <Group justify="space-between" mb={4}>
            <Text size="xs" fw={600} c="dimmed">
              Progress
            </Text>
            <Text size="xs" fw={700} c="indigo">
              {project.progress_percentage || 0}% ({project.completed_task_count || 0}/{project.task_count || 0} tasks)
            </Text>
          </Group>
          <Progress
            value={project.progress_percentage || 0}
            size="sm"
            radius="xl"
            color="indigo"
            striped={project.status === 'active'}
            animated={project.status === 'active'}
          />
        </Box>

        {project.deadline && (
          <Group gap={6} c="dimmed">
            <Calendar size={14} />
            <Text size="xs">Due {new Date(project.deadline).toLocaleDateString()}</Text>
          </Group>
        )}
      </Stack>

      <Group justify="space-between" mt="md" pt="sm" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <Button
          variant="light"
          color="indigo"
          size="xs"
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
                  color={copied ? 'teal' : 'gray'}
                  variant="subtle"
                  size="md"
                  onClick={() => {
                    copy();
                    notifications.show({
                      title: 'Link Copied',
                      message: 'Client Portal read-only link copied to clipboard!',
                      color: 'teal',
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
