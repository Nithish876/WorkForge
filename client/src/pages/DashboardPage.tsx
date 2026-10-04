import React, { useState, useMemo } from 'react';
import {
  Title,
  Text,
  Group,
  Stack,
  Button,
  TextInput,
  Select,
  SimpleGrid,
  Paper,
  Box,
  Loader,
  Center,
} from '@mantine/core';
import {
  Plus,
  Search,
  Briefcase,
  KanbanSquare,
  CheckCircle2,
  Users,
  Layers,
} from 'lucide-react';
import { Project, Client } from '../types';
import { ProjectCard } from '../components/ProjectCard';

interface DashboardPageProps {
  projects: Project[];
  clients: Client[];
  loading: boolean;
  selectedClientId?: number;
  onSelectClient: (id?: number) => void;
  onOpenNewProject: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  projects,
  clients,
  loading,
  selectedClientId,
  onSelectClient,
  onOpenNewProject,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Computed metrics
  const activeProjects = projects.filter((p) => p.status === 'active');
  const totalTasks = projects.reduce((acc, p) => acc + (p.task_count || 0), 0);
  const completedTasks = projects.reduce((acc, p) => acc + (p.completed_task_count || 0), 0);
  const avgCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
        (p.client_name && p.client_name.toLowerCase().includes(search.toLowerCase()));

      const matchesClient = selectedClientId ? p.client_id === selectedClientId : true;
      const matchesStatus = statusFilter === 'all' ? true : p.status === statusFilter;

      return matchesSearch && matchesClient && matchesStatus;
    });
  }, [projects, search, selectedClientId, statusFilter]);

  if (loading) {
    return (
      <Center p={80}>
        <Loader size="lg" color="green" />
      </Center>
    );
  }

  return (
    <Stack gap="xl">
      {/* Top Header */}
      <Group justify="space-between" align="center" wrap="wrap">
        <Box>
          <Title order={2} fw={700} style={{ letterSpacing: '-0.5px' }}>
            Projects Dashboard
          </Title>
          <Text size="sm" c="dimmed">
            Manage deliverables, collaborator teams, and GitHub activity
          </Text>
        </Box>

        <Button
          leftSection={<Plus size={16} />}
          color="green"
          radius="xl"
          onClick={onOpenNewProject}
        >
          New Project
        </Button>
      </Group>

      {/* Stats Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
        <Paper withBorder p="md" radius="lg" style={{ backgroundColor: 'var(--bg-card)' }}>
          <Group justify="space-between">
            <Box>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                Active Projects
              </Text>
              <Text fw={700} size="xl" mt={4}>
                {activeProjects.length}
              </Text>
            </Box>
            <Box
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: 'rgba(20, 168, 0, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
              }}
            >
              <Briefcase size={18} />
            </Box>
          </Group>
        </Paper>

        <Paper withBorder p="md" radius="lg" style={{ backgroundColor: 'var(--bg-card)' }}>
          <Group justify="space-between">
            <Box>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                Total Tasks
              </Text>
              <Text fw={700} size="xl" mt={4}>
                {totalTasks}
              </Text>
            </Box>
            <Box
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: 'rgba(20, 168, 0, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
              }}
            >
              <KanbanSquare size={18} />
            </Box>
          </Group>
        </Paper>

        <Paper withBorder p="md" radius="lg" style={{ backgroundColor: 'var(--bg-card)' }}>
          <Group justify="space-between">
            <Box>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                Completion Rate
              </Text>
              <Text fw={700} size="xl" mt={4}>
                {avgCompletion}%
              </Text>
            </Box>
            <Box
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: 'rgba(20, 168, 0, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
              }}
            >
              <CheckCircle2 size={18} />
            </Box>
          </Group>
        </Paper>

        <Paper withBorder p="md" radius="lg" style={{ backgroundColor: 'var(--bg-card)' }}>
          <Group justify="space-between">
            <Box>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                Active Clients
              </Text>
              <Text fw={700} size="xl" mt={4}>
                {clients.length}
              </Text>
            </Box>
            <Box
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: 'rgba(20, 168, 0, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
              }}
            >
              <Users size={18} />
            </Box>
          </Group>
        </Paper>
      </SimpleGrid>

      {/* Filters and Search Bar */}
      <Paper withBorder p="sm" radius="lg" style={{ backgroundColor: 'var(--bg-surface)' }}>
        <Group justify="space-between" wrap="wrap" gap="md">
          <TextInput
            placeholder="Search projects by title, scope, client..."
            leftSection={<Search size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ flex: 1, minWidth: 220 }}
          />

          <Group gap="sm" wrap="wrap">
            <Select
              data={[
                { value: 'all', label: 'All Statuses' },
                { value: 'active', label: 'Active Only' },
                { value: 'completed', label: 'Completed' },
                { value: 'on_hold', label: 'On Hold' },
              ]}
              value={statusFilter}
              onChange={(val) => setStatusFilter(val || 'all')}
              style={{ width: 140 }}
            />

            <Select
              data={[
                { value: '', label: 'All Clients' },
                ...clients.map((c) => ({
                  value: String(c.id),
                  label: c.name,
                })),
              ]}
              value={selectedClientId ? String(selectedClientId) : ''}
              onChange={(val) => onSelectClient(val ? parseInt(val, 10) : undefined)}
              style={{ width: 160 }}
            />
          </Group>
        </Group>
      </Paper>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Paper withBorder p={50} radius="lg" style={{ textAlign: 'center' }}>
          <Layers size={40} style={{ opacity: 0.3, margin: '0 auto 16px', color: 'var(--accent-primary)' }} />
          <Title order={4} mb={4}>
            No projects found
          </Title>
          <Text size="sm" c="dimmed" mb="lg">
            {search || selectedClientId || statusFilter !== 'all'
              ? 'Try adjusting your filters or search keywords.'
              : 'Get started by creating your first client project.'}
          </Text>
          <Button
            leftSection={<Plus size={16} />}
            color="green"
            radius="xl"
            onClick={onOpenNewProject}
          >
            Create First Project
          </Button>
        </Paper>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              client={clients.find((c) => c.id === project.client_id)}
            />
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
};
