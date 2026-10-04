import React, { useState, useEffect } from 'react';
import {
  Title,
  Text,
  Group,
  Stack,
  Tabs,
  Badge,
  Button,
  ActionIcon,
  Progress,
  Paper,
  Box,
  CopyButton,
  Tooltip,
  Loader,
  Center,
  Select,
} from '@mantine/core';
import {
  KanbanSquare,
  GitCommit,
  UploadCloud,
  Settings,
  Share2,
  ExternalLink,
  Check,
  Copy,
  Calendar,
  FolderGit2,
  ArrowLeft,
  Trash2,
  Users,
  Globe,
  Lock,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Project, Task, Asset, Client, TaskStatus, TaskPriority, ProjectStatus } from '../types';
import { api } from '../api/client';
import { KanbanBoard } from '../components/KanbanBoard';
import { GitHubTimeline } from '../components/GitHubTimeline';
import { AssetVault } from '../components/AssetVault';
import { TaskModal } from '../components/TaskModal';
import { CollaboratorsModal } from '../components/CollaboratorsModal';
import { notifications } from '@mantine/notifications';

interface ProjectDetailPageProps {
  clients: Client[];
  onProjectUpdated: () => void;
  onProjectDeleted: (id: number) => void;
}

export const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({
  clients,
  onProjectUpdated,
  onProjectDeleted,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = parseInt(id || '', 10);

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string | null>('board');

  // Task Modal state
  const [taskModalOpened, setTaskModalOpened] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultTaskStatus, setDefaultTaskStatus] = useState<TaskStatus>('todo');

  // Collaborators Modal state
  const [collaboratorsModalOpened, setCollaboratorsModalOpened] = useState<boolean>(false);

  const fetchProjectData = async () => {
    if (isNaN(projectId)) return;
    setLoading(true);
    try {
      const [projRes, tasksRes, assetsRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/projects/${projectId}/tasks`),
        api.get(`/projects/${projectId}/assets`),
      ]);

      if (projRes.data?.success) {
        setProject(projRes.data.data);
      }
      if (tasksRes.data?.success) {
        setTasks(tasksRes.data.data);
      }
      if (assetsRes.data?.success) {
        setAssets(assetsRes.data.data);
      }
    } catch (err: any) {
      notifications.show({
        title: 'Error',
        message: 'Could not load project details',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const handleTogglePublic = async () => {
    if (!project) return;
    const newPublic = !project.is_public;
    setProject({ ...project, is_public: newPublic });
    try {
      await api.patch(`/projects/${project.id}`, { is_public: newPublic });
      onProjectUpdated();
      notifications.show({
        title: newPublic ? 'Project Made Public' : 'Project Made Private',
        message: newPublic
          ? 'This project will now appear on your public profile showcase.'
          : 'This project is now private and only accessible to collaborators and client.',
        color: newPublic ? 'green' : 'yellow',
      });
    } catch {
      fetchProjectData();
    }
  };

  const handleStatusChange = async (newStatus: ProjectStatus) => {
    if (!project) return;
    setProject({ ...project, status: newStatus });
    try {
      await api.patch(`/projects/${project.id}`, { status: newStatus });
      onProjectUpdated();
      notifications.show({
        title: 'Status Updated',
        message: `Project marked as ${newStatus}`,
        color: 'teal',
      });
    } catch {
      fetchProjectData();
    }
  };

  const handleOpenTaskModal = (task?: Task, defaultStatus: TaskStatus = 'todo') => {
    setEditingTask(task || null);
    setDefaultTaskStatus(defaultStatus);
    setTaskModalOpened(true);
  };

  const handleSaveTask = async (taskData: {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    is_client_visible: boolean;
    due_date?: string | null;
  }) => {
    try {
      if (editingTask) {
        const res = await api.patch(`/tasks/${editingTask.id}`, taskData);
        if (res.data?.success && res.data.data) {
          setTasks(tasks.map((t) => (t.id === editingTask.id ? res.data.data : t)));
        }
      } else {
        const res = await api.post(`/projects/${projectId}/tasks`, taskData);
        if (res.data?.success && res.data.data) {
          setTasks([...tasks, res.data.data]);
        }
      }
      onProjectUpdated();
      notifications.show({
        title: 'Success',
        message: editingTask ? 'Task updated' : 'Task created',
        color: 'teal',
      });
    } catch (err: any) {
      notifications.show({
        title: 'Error',
        message: err.response?.data?.error || 'Could not save task',
        color: 'red',
      });
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter((t) => t.id !== taskId));
      onProjectUpdated();
      notifications.show({
        title: 'Task Deleted',
        message: 'Task removed from project',
        color: 'teal',
      });
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Could not delete task',
        color: 'red',
      });
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    if (window.confirm('Are you sure you want to delete this project and all associated tasks/files?')) {
      try {
        await api.delete(`/projects/${project.id}`);
        onProjectDeleted(project.id);
        navigate('/');
        notifications.show({
          title: 'Project Deleted',
          message: 'Project has been removed',
          color: 'teal',
        });
      } catch {
        notifications.show({
          title: 'Error',
          message: 'Could not delete project',
          color: 'red',
        });
      }
    }
  };

  if (loading) {
    return (
      <Center p={80}>
        <Loader size="lg" color="green" />
      </Center>
    );
  }

  if (!project) {
    return (
      <Paper withBorder p="xl" radius="md" style={{ textAlign: 'center' }}>
        <Text size="lg" fw={700}>
          Project Not Found
        </Text>
        <Button mt="md" variant="light" color="green" onClick={() => navigate('/')}>
          Return to Dashboard
        </Button>
      </Paper>
    );
  }

  const client = clients.find((c) => c.id === project.client_id);
  const portalUrl = client?.share_token
    ? `${window.location.origin}/portal/${client.share_token}`
    : null;

  const completedCount = tasks.filter((t) => t.status === 'done').length;
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <Stack gap="lg">
      {/* Back button & Title Section */}
      <Group justify="space-between" align="flex-start" wrap="wrap">
        <Box>
          <Button
            variant="subtle"
            color="gray"
            size="xs"
            radius="xl"
            leftSection={<ArrowLeft size={14} />}
            onClick={() => navigate('/')}
            mb={6}
          >
            All Projects
          </Button>

          <Group gap="xs" mb={4} wrap="wrap">
            <Title order={2} fw={800} style={{ letterSpacing: '-0.5px' }}>
              {project.title}
            </Title>
            <Tooltip
              label={
                project.is_public
                  ? 'Visible on public profile showcase. Click to make Private.'
                  : 'Private project (only owner, team & client can access). Click to make Public.'
              }
            >
              <Badge
                size="sm"
                variant="light"
                radius="xl"
                color={project.is_public ? 'green' : 'yellow'}
                leftSection={project.is_public ? <Globe size={12} /> : <Lock size={12} />}
                style={{ cursor: 'pointer' }}
                onClick={handleTogglePublic}
              >
                {project.is_public ? 'PUBLIC' : 'PRIVATE'}
              </Badge>
            </Tooltip>
            <Select
              size="xs"
              data={[
                { value: 'active', label: 'Active' },
                { value: 'completed', label: 'Completed' },
                { value: 'on_hold', label: 'On Hold' },
              ]}
              value={project.status}
              onChange={(val) => handleStatusChange(val as ProjectStatus)}
              style={{ width: 120 }}
            />
          </Group>

          <Group gap="md" wrap="wrap">
            <Text size="sm" c="dimmed">
              Client:{' '}
              <Text span fw={600} style={{ color: 'var(--text-primary)' }}>
                {project.client_name || client?.name}
              </Text>
              {(project.client_company || client?.company) && ` (${project.client_company || client?.company})`}
            </Text>

            {project.deadline && (
              <Group gap={4} c="dimmed">
                <Calendar size={14} />
                <Text size="xs">Due {new Date(project.deadline).toLocaleDateString()}</Text>
              </Group>
            )}

            {project.github_repo && (
              <Group gap={4} c="dimmed">
                <FolderGit2 size={14} />
                <Text size="xs">{project.github_repo}</Text>
              </Group>
            )}
          </Group>
        </Box>

        <Group gap="xs">
          <Button
            variant="default"
            size="sm"
            radius="xl"
            leftSection={<Users size={15} />}
            onClick={() => setCollaboratorsModalOpened(true)}
          >
            Team {project.collaborators_count ? `(${project.collaborators_count})` : ''}
          </Button>

          {portalUrl && (
            <CopyButton value={portalUrl} timeout={2000}>
              {({ copied, copy }) => (
                <Button
                  variant="default"
                  size="sm"
                  radius="xl"
                  leftSection={copied ? <Check size={16} color="var(--accent-primary)" /> : <Share2 size={16} />}
                  onClick={() => {
                    copy();
                    notifications.show({
                      title: 'Client Portal Link Copied',
                      message: 'Share this link with your client for zero-login view',
                      color: 'green',
                    });
                  }}
                >
                  {copied ? 'Copied Share Link' : 'Client Share Portal'}
                </Button>
              )}
            </CopyButton>
          )}

          {portalUrl && (
            <Tooltip label="Open client view in new tab">
              <ActionIcon
                variant="default"
                size="lg"
                radius="xl"
                onClick={() => window.open(portalUrl, '_blank')}
              >
                <ExternalLink size={18} />
              </ActionIcon>
            </Tooltip>
          )}

          <Tooltip label="Delete project">
            <ActionIcon
              variant="subtle"
              color="red"
              size="lg"
              radius="xl"
              onClick={handleDeleteProject}
            >
              <Trash2 size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      {/* Quick Progress Banner */}
      <Paper withBorder p="md" radius="lg" style={{ backgroundColor: 'var(--bg-card)' }}>
        <Group justify="space-between" mb={6}>
          <Text size="xs" fw={700} c="dimmed">
            Overall Project Health
          </Text>
          <Text size="xs" fw={700}>
            {progressPct}% ({completedCount}/{tasks.length} tasks completed)
          </Text>
        </Group>
        <Progress value={progressPct} color="green" radius="xl" size="sm" />
      </Paper>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={setActiveTab} color="green">
        <Tabs.List mb="md">
          <Tabs.Tab
            value="board"
            leftSection={<KanbanSquare size={16} />}
            rightSection={<Badge size="xs" variant="outline" color="green" radius="xl">{tasks.length}</Badge>}
          >
            Kanban Board
          </Tabs.Tab>

          <Tabs.Tab
            value="github"
            leftSection={<GitCommit size={16} />}
          >
            GitHub Activity
          </Tabs.Tab>

          <Tabs.Tab
            value="assets"
            leftSection={<UploadCloud size={16} />}
            rightSection={<Badge size="xs" variant="outline" color="green" radius="xl">{assets.length}</Badge>}
          >
            Deliverables & Assets
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="board">
          <KanbanBoard
            projectId={project.id}
            tasks={tasks}
            onTasksChange={setTasks}
            onOpenTaskModal={handleOpenTaskModal}
            onDeleteTask={handleDeleteTask}
          />
        </Tabs.Panel>

        <Tabs.Panel value="github">
          <GitHubTimeline
            projectId={project.id}
            githubRepo={project.github_repo}
          />
        </Tabs.Panel>

        <Tabs.Panel value="assets">
          <AssetVault
            projectId={project.id}
            assets={assets}
            onAssetUploaded={(newAsset) => setAssets([newAsset, ...assets])}
            onAssetDeleted={(deletedId) => setAssets(assets.filter((a) => a.id !== deletedId))}
          />
        </Tabs.Panel>
      </Tabs>

      {/* Task Creation & Edit Modal */}
      <TaskModal
        opened={taskModalOpened}
        onClose={() => setTaskModalOpened(false)}
        onSubmit={handleSaveTask}
        task={editingTask}
        defaultStatus={defaultTaskStatus}
      />

      {/* Collaborators Management Modal */}
      <CollaboratorsModal
        opened={collaboratorsModalOpened}
        onClose={() => setCollaboratorsModalOpened(false)}
        projectId={project.id}
        projectTitle={project.title}
        isOwner={project.user_role === 'owner' || !project.user_role}
        onCollaboratorChange={fetchProjectData}
      />
    </Stack>
  );
};
