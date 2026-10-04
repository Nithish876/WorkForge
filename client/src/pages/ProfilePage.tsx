import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Stack,
  Group,
  Text,
  Avatar,
  Badge,
  Button,
  Grid,
  SimpleGrid,
  Progress,
  ActionIcon,
  Tooltip,
  Divider,
  Modal,
  TextInput,
  Textarea,
  Loader,
  Center,
  Box,
  Anchor,
  useComputedColorScheme,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  Globe,
  Github,
  Twitter,
  Linkedin,
  MapPin,
  Calendar,
  FolderGit2,
  CheckCircle2,
  Flame,
  Award,
  ExternalLink,
  Edit3,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Globe2,
} from 'lucide-react';
import { api } from '../api/client';
import { UserProfile, Project, ActivityDay } from '../types';
import { useNavigate, useParams } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const computedColorScheme = useComputedColorScheme('dark', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit Profile modal state
  const [editOpened, setEditOpened] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState('');
  const [editHeadline, setEditHeadline] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editGithub, setEditGithub] = useState('');
  const [editTwitter, setEditTwitter] = useState('');
  const [editLinkedin, setEditLinkedin] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const endpoint = id ? `/users/${id}/public` : '/users/profile';
      const res = await api.get(endpoint);
      if (res.data?.success) {
        const data: UserProfile = res.data.data;
        setProfile(data);
        setEditName(data.name || '');
        setEditHeadline(data.headline || '');
        setEditBio(data.bio || '');
        setEditLocation(data.location || '');
        setEditWebsite(data.website || '');
        setEditGithub(data.github_username || '');
        setEditTwitter(data.twitter_username || '');
        setEditLinkedin(data.linkedin_url || '');
      }
    } catch (err: any) {
      notifications.show({
        title: 'Error',
        message: err.response?.data?.message || 'Could not load user profile',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/users/profile', {
        name: editName.trim(),
        headline: editHeadline.trim() || null,
        bio: editBio.trim() || null,
        location: editLocation.trim() || null,
        website: editWebsite.trim() || null,
        github_username: editGithub.trim() || null,
        twitter_username: editTwitter.trim() || null,
        linkedin_url: editLinkedin.trim() || null,
      });

      if (res.data?.success) {
        setProfile(res.data.data);
        setEditOpened(false);
        notifications.show({
          title: 'Saved',
          message: 'Profile updated successfully',
          color: 'green',
        });
      }
    } catch (err: any) {
      notifications.show({
        title: 'Save Failed',
        message: err.response?.data?.message || 'Failed to update profile',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Center mih="60vh">
        <Loader size="md" color="green" />
      </Center>
    );
  }

  if (!profile) {
    return (
      <Center mih="60vh">
        <Paper withBorder p="xl" radius="lg" style={{ textAlign: 'center' }}>
          <Text fw={600} mb="xs">
            Profile Not Found
          </Text>
          <Button variant="light" color="green" size="xs" radius="xl" onClick={() => navigate('/')}>
            Back to Dashboard
          </Button>
        </Paper>
      </Center>
    );
  }

  // Strictly filter public projects only (private projects are never shown on profile)
  const publicProjects = (profile.public_projects || []).filter((p) => p.is_public === true);

  // Group heatmap days into columns of 7 days (weeks)
  const heatmap = profile.metrics.activity_heatmap || [];
  const weeks: ActivityDay[][] = [];
  for (let i = 0; i < heatmap.length; i += 7) {
    weeks.push(heatmap.slice(i, i + 7));
  }

  // Upwork emerald green activity heatmap shades
  const getHeatmapColor = (level: 0 | 1 | 2 | 3) => {
    if (isDark) {
      switch (level) {
        case 3:
          return '#14a800'; // Signature Upwork green
        case 2:
          return '#0f8200';
        case 1:
          return '#24523b';
        default:
          return '#162e22'; // Subtle background cell
      }
    } else {
      switch (level) {
        case 3:
          return '#14a800';
        case 2:
          return '#54cb54';
        case 1:
          return '#a3e8a3';
        default:
          return '#e2f0e2';
      }
    }
  };

  return (
    <Container size="xl" py="lg">
      <Stack gap="lg">
        {/* User Profile Card */}
        <Paper withBorder p="xl" radius="lg" style={{ backgroundColor: 'var(--bg-card)' }}>
          <Grid align="center" gutter="lg">
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Group gap="lg" align="flex-start">
                <Avatar
                  size={84}
                  radius="lg"
                  color="green"
                  style={{
                    border: '2px solid var(--accent-primary)',
                    fontSize: 28,
                    fontWeight: 700,
                  }}
                >
                  {profile.name.substring(0, 2).toUpperCase()}
                </Avatar>

                <div style={{ flex: 1 }}>
                  <Group justify="space-between" align="center" mb={4}>
                    <Group gap="xs">
                      <Text size="xl" fw={700}>
                        {profile.name}
                      </Text>
                      {profile.is_owner && (
                        <Badge size="xs" variant="light" color="green" radius="xl">
                          Verified Lead
                        </Badge>
                      )}
                    </Group>

                    {profile.is_owner && (
                      <Button
                        size="xs"
                        variant="light"
                        color="green"
                        radius="xl"
                        leftSection={<Edit3 size={14} />}
                        onClick={() => setEditOpened(true)}
                      >
                        Edit Profile
                      </Button>
                    )}
                  </Group>

                  {profile.headline && (
                    <Text size="sm" fw={500} c="dimmed" mb="xs">
                      {profile.headline}
                    </Text>
                  )}

                  {profile.bio && (
                    <Text size="sm" mb="md" style={{ lineHeight: 1.6, maxWidth: 640 }}>
                      {profile.bio}
                    </Text>
                  )}

                  {/* Metadata & Links Row */}
                  <Group gap="md" wrap="wrap">
                    {profile.location && (
                      <Group gap={4}>
                        <MapPin size={14} color="var(--accent-primary)" />
                        <Text size="xs" c="dimmed">
                          {profile.location}
                        </Text>
                      </Group>
                    )}

                    <Group gap={4}>
                      <Calendar size={14} color="var(--accent-primary)" />
                      <Text size="xs" c="dimmed">
                        Member since {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                      </Text>
                    </Group>

                    {profile.website && (
                      <Anchor
                        href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                        target="_blank"
                        rel="noreferrer"
                        size="xs"
                        c="green"
                        fw={500}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <Globe size={14} />
                        Website
                        <ExternalLink size={10} />
                      </Anchor>
                    )}

                    {profile.github_username && (
                      <Anchor
                        href={`https://github.com/${profile.github_username}`}
                        target="_blank"
                        rel="noreferrer"
                        size="xs"
                        c="green"
                        fw={500}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <Github size={14} />
                        github.com/{profile.github_username}
                        <ExternalLink size={10} />
                      </Anchor>
                    )}

                    {profile.twitter_username && (
                      <Anchor
                        href={`https://x.com/${profile.twitter_username}`}
                        target="_blank"
                        rel="noreferrer"
                        size="xs"
                        c="green"
                        fw={500}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <Twitter size={14} />
                        @{profile.twitter_username}
                        <ExternalLink size={10} />
                      </Anchor>
                    )}

                    {profile.linkedin_url && (
                      <Anchor
                        href={profile.linkedin_url.startsWith('http') ? profile.linkedin_url : `https://${profile.linkedin_url}`}
                        target="_blank"
                        rel="noreferrer"
                        size="xs"
                        c="green"
                        fw={500}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <Linkedin size={14} />
                        LinkedIn
                        <ExternalLink size={10} />
                      </Anchor>
                    )}
                  </Group>
                </div>
              </Group>
            </Grid.Col>

            {/* Quick Metrics Glance */}
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper withBorder p="md" radius="lg" style={{ backgroundColor: 'var(--bg-surface)' }}>
                <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="xs">
                  Dedication Summary
                </Text>
                <SimpleGrid cols={2} spacing="xs">
                  <Box>
                    <Text size="xs" c="dimmed">
                      Contributions
                    </Text>
                    <Text size="lg" fw={700} c="green">
                      {profile.metrics.total_contributions}
                    </Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">
                      Active Streak
                    </Text>
                    <Group gap={4}>
                      <Flame size={16} strokeWidth={2.4} color="#14a800" />
                      <Text size="lg" fw={700} c="green">
                        {profile.metrics.current_streak_days} days
                      </Text>
                    </Group>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">
                      Completed Tasks
                    </Text>
                    <Text size="lg" fw={700}>
                      {profile.metrics.total_tasks_completed}
                    </Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">
                      Completion Rate
                    </Text>
                    <Text size="lg" fw={700}>
                      {profile.metrics.completion_rate_percentage}%
                    </Text>
                  </Box>
                </SimpleGrid>
              </Paper>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* GitHub-style Dedication & Work Involvement Heatmap */}
        <Paper withBorder p="lg" radius="lg" style={{ backgroundColor: 'var(--bg-card)' }}>
          <Group justify="space-between" mb="sm">
            <Group gap="xs">
              <TrendingUp size={16} color="#14a800" />
              <Text fw={700} size="sm">
                Work Involvement & Contribution Activity
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              {profile.metrics.total_contributions} recorded activities in the last 12 weeks
            </Text>
          </Group>

          <Box style={{ overflowX: 'auto', paddingBottom: 6 }}>
            <Group gap={3} wrap="nowrap" align="flex-start">
              {weeks.map((week, wIndex) => (
                <Stack key={wIndex} gap={3}>
                  {week.map((day) => (
                    <Tooltip
                      key={day.date}
                      label={`${day.count} contributions on ${day.date}`}
                      position="top"
                      withArrow
                    >
                      <Box
                        className="heatmap-cell"
                        style={{
                          backgroundColor: getHeatmapColor(day.level),
                        }}
                      />
                    </Tooltip>
                  ))}
                </Stack>
              ))}
            </Group>
          </Box>

          <Group justify="space-between" align="center" mt="sm">
            <Text size="11px" c="dimmed">
              Tracks task executions, milestone releases, and code repository commits.
            </Text>
            <Group gap={4} align="center">
              <Text size="11px" c="dimmed">
                Less
              </Text>
              <Box className="heatmap-cell" style={{ backgroundColor: getHeatmapColor(0) }} />
              <Box className="heatmap-cell" style={{ backgroundColor: getHeatmapColor(1) }} />
              <Box className="heatmap-cell" style={{ backgroundColor: getHeatmapColor(2) }} />
              <Box className="heatmap-cell" style={{ backgroundColor: getHeatmapColor(3) }} />
              <Text size="11px" c="dimmed">
                More
              </Text>
            </Group>
          </Group>
        </Paper>

        {/* Public Projects Showcase */}
        <div>
          <Group justify="space-between" mb="sm">
            <Group gap="xs">
              <Globe2 size={18} color="#14a800" />
              <Text fw={700} size="md">
                Public Projects Showcase ({publicProjects.length})
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              Only public deliverables are visible here. Private projects remain confidential.
            </Text>
          </Group>

          {publicProjects.length === 0 ? (
            <Paper withBorder p="xl" radius="lg" style={{ textAlign: 'center' }}>
              <Text size="sm" c="dimmed">
                No public projects to display yet. Projects marked as public in project settings appear here.
              </Text>
            </Paper>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              {publicProjects.map((proj) => (
                <Paper
                  key={proj.id}
                  withBorder
                  p="md"
                  radius="lg"
                  className="kanban-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <Group justify="space-between" align="flex-start" mb="xs">
                      <div>
                        <Text fw={700} size="md">
                          {proj.title}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {proj.client_company || proj.client_name || 'Independent Client'}
                        </Text>
                      </div>
                      <Badge size="xs" variant="light" color="green" radius="xl">
                        {proj.status.toUpperCase()}
                      </Badge>
                    </Group>

                    {proj.description && (
                      <Text size="xs" c="dimmed" lineClamp={2} mb="sm">
                        {proj.description}
                      </Text>
                    )}
                  </div>

                  <div>
                    <Group justify="space-between" mb={4}>
                      <Text size="xs" c="dimmed">
                        Deliverable Progress
                      </Text>
                      <Text size="xs" fw={600} c="green">
                        {proj.progress_percentage || 0}%
                      </Text>
                    </Group>
                    <Progress
                      value={proj.progress_percentage || 0}
                      size="xs"
                      color="green"
                      radius="xl"
                      mb="sm"
                    />

                    <Group justify="space-between" align="center" pt="xs" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      {proj.github_repo ? (
                        <Group gap={4}>
                          <FolderGit2 size={13} color="var(--accent-primary)" />
                          <Text size="xs" c="dimmed">
                            {proj.github_repo}
                          </Text>
                        </Group>
                      ) : (
                        <Box />
                      )}

                      <Button
                        size="xs"
                        variant="light"
                        color="green"
                        radius="xl"
                        rightSection={<ArrowUpRight size={13} />}
                        onClick={() => navigate(`/projects/${proj.id}`)}
                      >
                        View Project
                      </Button>
                    </Group>
                  </div>
                </Paper>
              ))}
            </SimpleGrid>
          )}
        </div>
      </Stack>

      {/* Edit Profile Modal */}
      <Modal
        opened={editOpened}
        onClose={() => setEditOpened(false)}
        title={<Text fw={700}>Edit Profile & Links</Text>}
        size="md"
        radius="lg"
      >
        <form onSubmit={handleSaveProfile}>
          <Stack gap="sm">
            <TextInput
              label="Full Name"
              value={editName}
              onChange={(e) => setEditName(e.currentTarget.value)}
              required
            />
            <TextInput
              label="Headline / Professional Title"
              placeholder="e.g. Principal Full-Stack Architect"
              value={editHeadline}
              onChange={(e) => setEditHeadline(e.currentTarget.value)}
            />
            <Textarea
              label="Bio"
              placeholder="Brief summary of your background, technical specialties, or services..."
              minRows={3}
              value={editBio}
              onChange={(e) => setEditBio(e.currentTarget.value)}
            />
            <TextInput
              label="Location"
              placeholder="City, State / Country or Remote"
              value={editLocation}
              onChange={(e) => setEditLocation(e.currentTarget.value)}
            />
            <Divider label="Online Presence & Social Links" labelPosition="center" my="xs" />
            <TextInput
              label="Personal Website URL"
              placeholder="https://yourportfolio.dev"
              value={editWebsite}
              onChange={(e) => setEditWebsite(e.currentTarget.value)}
            />
            <TextInput
              label="GitHub Username"
              placeholder="octocat"
              value={editGithub}
              onChange={(e) => setEditGithub(e.currentTarget.value)}
            />
            <TextInput
              label="Twitter / X Handle"
              placeholder="username (without @)"
              value={editTwitter}
              onChange={(e) => setEditTwitter(e.currentTarget.value)}
            />
            <TextInput
              label="LinkedIn Profile URL"
              placeholder="https://linkedin.com/in/username"
              value={editLinkedin}
              onChange={(e) => setEditLinkedin(e.currentTarget.value)}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="default" radius="xl" onClick={() => setEditOpened(false)}>
                Cancel
              </Button>
              <Button type="submit" color="green" radius="xl" loading={saving}>
                Save Profile
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
};
