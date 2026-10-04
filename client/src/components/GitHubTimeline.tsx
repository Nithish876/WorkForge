import React, { useEffect, useState } from 'react';
import {
  Timeline,
  Text,
  Badge,
  Group,
  Paper,
  Loader,
  Center,
  Button,
  Box,
  Anchor,
} from '@mantine/core';
import { GitCommit, ExternalLink, RefreshCw, AlertCircle, FolderGit2 } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { GitHubCommit } from '../types';
import { api } from '../api/client';

interface GitHubTimelineProps {
  projectId: number;
  githubRepo?: string | null;
}

export const GitHubTimeline: React.FC<GitHubTimelineProps> = ({ projectId, githubRepo }) => {
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCommits = async () => {
    if (!githubRepo) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/projects/${projectId}/github-commits`);
      if (res.data?.success && Array.isArray(res.data.data)) {
        setCommits(res.data.data);
      }
    } catch (err: any) {
      setError('Unable to fetch recent repository commits.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommits();
  }, [projectId, githubRepo]);

  if (!githubRepo) {
    return (
      <Paper withBorder p="xl" radius="md" style={{ textAlign: 'center' }}>
        <FolderGit2 size={40} style={{ opacity: 0.4, margin: '0 auto 12px' }} />
        <Text fw={600} size="md">
          No GitHub Repository Linked
        </Text>
        <Text size="sm" c="dimmed" mt={4} mb="md">
          Link a GitHub repository (e.g., owner/repo) in the project settings to automatically track commits.
        </Text>
      </Paper>
    );
  }

  if (loading) {
    return (
      <Center p="xl">
        <Loader size="md" color="dark" />
      </Center>
    );
  }

  return (
    <Paper withBorder p="md" radius="md">
      <Group justify="space-between" mb="lg">
        <Box>
          <Group gap="xs">
            <FolderGit2 size={18} />
            <Text fw={700} size="md">
              Repository Activity: {githubRepo}
            </Text>
          </Group>
          <Text size="xs" c="dimmed">
            Last 5 verified commits synchronized from GitHub API
          </Text>
        </Box>

        <Button
          variant="default"
          size="xs"
          leftSection={<RefreshCw size={14} />}
          onClick={fetchCommits}
        >
          Refresh
        </Button>
      </Group>

      {error ? (
        <Group gap="xs" c="red" p="sm">
          <AlertCircle size={16} />
          <Text size="sm">{error}</Text>
        </Group>
      ) : commits.length === 0 ? (
        <Text size="sm" c="dimmed" p="sm">
          No commits recorded yet in this repository.
        </Text>
      ) : (
        <Timeline active={commits.length} bulletSize={24} lineWidth={2} color="dark">
          {commits.map((c) => {
            let timeAgo = '';
            try {
              timeAgo = formatDistanceToNow(parseISO(c.date), { addSuffix: true });
            } catch {
              timeAgo = c.date;
            }

            return (
              <Timeline.Item
                key={c.sha}
                bullet={<GitCommit size={14} />}
                title={
                  <Group gap="xs" wrap="nowrap">
                    <Text size="sm" fw={600}>
                      {c.message}
                    </Text>
                    <Badge size="xs" variant="outline" color="dark">
                      {c.sha}
                    </Badge>
                  </Group>
                }
              >
                <Group justify="space-between" mt={4}>
                  <Text size="xs" c="dimmed">
                    Committed by <Text span fw={600}>{c.author}</Text> • {timeAgo}
                  </Text>
                  <Anchor
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    size="xs"
                    c="dimmed"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    View Commit <ExternalLink size={12} />
                  </Anchor>
                </Group>
              </Timeline.Item>
            );
          })}
        </Timeline>
      )}
    </Paper>
  );
};
