import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Progress,
  Badge,
  Card,
  SimpleGrid,
  Button,
  ActionIcon,
  Table,
  Box,
  Divider,
  Loader,
  Center,
  Tabs,
  Tooltip,
} from '@mantine/core';
import { Dropzone, FileWithPath } from '@mantine/dropzone';
import {
  Shield,
  Layers,
  CheckCircle2,
  Clock,
  Download,
  UploadCloud,
  FileText,
  File,
  Image as ImageIcon,
  Archive,
  ExternalLink,
  Mail,
  User,
  AlertCircle,
  Check,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { PortalData, PortalProject, Asset } from '../types';
import axios from 'axios';
import { notifications } from '@mantine/notifications';

export const ClientPortalPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingProjectId, setUploadingProjectId] = useState<number | null>(null);

  const fetchPortalData = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/portal/${token}`);
      if (res.data?.success && res.data.data) {
        setData(res.data.data);
      } else {
        setError(res.data?.error || 'Unable to access client portal.');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          'Invalid or expired client portal link. Please check your URL.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, [token]);

  const handleClientDrop = async (projectId: number, files: FileWithPath[]) => {
    if (files.length === 0 || !token) return;

    setUploadingProjectId(projectId);
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        await axios.post(`/api/portal/${token}/projects/${projectId}/assets`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        notifications.show({
          title: 'File Delivered',
          message: `${file.name} successfully shared with your project lead!`,
          color: 'teal',
          icon: <Check size={16} />,
        });
      } catch (err: any) {
        notifications.show({
          title: 'Upload Failed',
          message: err.response?.data?.error || `Could not upload ${file.name}`,
          color: 'red',
        });
      }
    }
    setUploadingProjectId(null);
    fetchPortalData();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon size={18} color="#3b82f6" />;
    if (mimeType.includes('pdf')) return <FileText size={18} color="#ef4444" />;
    if (mimeType.includes('zip') || mimeType.includes('tar')) return <Archive size={18} color="#f59e0b" />;
    return <File size={18} color="#6366f1" />;
  };

  if (loading) {
    return (
      <Center mih="100vh">
        <Stack align="center" gap="sm">
          <Loader size="lg" color="indigo" />
          <Text size="sm" c="dimmed">
            Loading your Client Portal...
          </Text>
        </Stack>
      </Center>
    );
  }

  if (error || !data) {
    return (
      <Container size="sm" py={100}>
        <Paper withBorder p="xl" radius="md" style={{ textAlign: 'center' }}>
          <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
          <Title order={3} mb={6}>
            Portal Unavailable
          </Title>
          <Text size="sm" c="dimmed" mb="lg">
            {error || 'The share token provided is invalid or has expired.'}
          </Text>
        </Paper>
      </Container>
    );
  }

  return (
    <Box mih="100vh" py="xl" px="md" style={{ backgroundColor: 'var(--bg-app)' }}>
      <Container size="lg">
        {/* Client Portal Header */}
        <Paper withBorder p="lg" radius="md" mb="xl" className="glass-panel">
          <Group justify="space-between" align="center" wrap="wrap">
            <Group gap="md">
              <Box
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                }}
              >
                <Layers size={22} />
              </Box>

              <Box>
                <Group gap="xs">
                  <Title order={3} fw={800}>
                    {data.client.name}
                  </Title>
                  {data.client.company && (
                    <Badge variant="light" color="indigo">
                      {data.client.company}
                    </Badge>
                  )}
                </Group>
                <Text size="xs" c="dimmed">
                  Client Collaboration & Progress Portal
                </Text>
              </Box>
            </Group>

            <Box style={{ textAlign: 'right' }}>
              <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                Project Lead
              </Text>
              <Text size="sm" fw={700}>
                {data.freelancer.name}
              </Text>
              <Text size="xs" c="dimmed">
                {data.freelancer.email}
              </Text>
            </Box>
          </Group>
        </Paper>

        {/* Projects Section */}
        {data.projects.length === 0 ? (
          <Paper withBorder p="xl" radius="md" style={{ textAlign: 'center' }}>
            <Text size="md" c="dimmed">
              No active projects are currently assigned to this portal.
            </Text>
          </Paper>
        ) : (
          <Stack gap="xl">
            {data.projects.map((proj) => (
              <Paper key={proj.id} withBorder p="xl" radius="md" shadow="sm">
                {/* Project Header */}
                <Group justify="space-between" align="flex-start" mb="md" wrap="wrap">
                  <Box>
                    <Group gap="xs" mb={4}>
                      <Badge
                        size="sm"
                        variant="filled"
                        color={proj.status === 'completed' ? 'teal' : 'indigo'}
                      >
                        {proj.status.toUpperCase()}
                      </Badge>
                      {proj.deadline && (
                        <Text size="xs" c="dimmed">
                          Target Delivery: {new Date(proj.deadline).toLocaleDateString()}
                        </Text>
                      )}
                    </Group>
                    <Title order={2} fw={800} style={{ letterSpacing: '-0.3px' }}>
                      {proj.title}
                    </Title>
                    {proj.description && (
                      <Text size="sm" c="dimmed" mt={4} maw={700}>
                        {proj.description}
                      </Text>
                    )}
                  </Box>

                  <Box style={{ minWidth: 160 }}>
                    <Text size="xs" fw={700} c="dimmed" ta="right" mb={4}>
                      Overall Completion
                    </Text>
                    <Group gap="xs" justify="flex-end" mb={4}>
                      <Text size="xl" fw={800} c="indigo">
                        {proj.progressPercentage}%
                      </Text>
                    </Group>
                    <Progress
                      value={proj.progressPercentage}
                      color="indigo"
                      size="md"
                      radius="xl"
                      striped={proj.status === 'active'}
                      animated={proj.status === 'active'}
                    />
                  </Box>
                </Group>

                <Divider my="lg" />

                {/* Friendly Client Task Lists */}
                <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg" mb="xl">
                  {/* What We're Working On */}
                  <Card withBorder radius="md" p="md">
                    <Group justify="space-between" mb="xs">
                      <Group gap="xs">
                        <Clock size={16} color="#6366f1" />
                        <Text fw={700} size="sm">
                          What We're Working On
                        </Text>
                      </Group>
                      <Badge size="xs" variant="light" color="indigo">
                        {proj.inProgressTasks.length}
                      </Badge>
                    </Group>

                    <Stack gap="xs" mt="xs">
                      {proj.inProgressTasks.length === 0 ? (
                        <Text size="xs" c="dimmed" py="sm">
                          No active items currently in progress.
                        </Text>
                      ) : (
                        proj.inProgressTasks.map((t) => (
                          <Paper key={t.id} withBorder p="xs" radius="sm">
                            <Text size="xs" fw={600}>
                              {t.title}
                            </Text>
                            {t.due_date && (
                              <Text size="10px" c="dimmed" mt={2}>
                                Target: {new Date(t.due_date).toLocaleDateString()}
                              </Text>
                            )}
                          </Paper>
                        ))
                      )}
                    </Stack>
                  </Card>

                  {/* Under Review */}
                  <Card withBorder radius="md" p="md">
                    <Group justify="space-between" mb="xs">
                      <Group gap="xs">
                        <AlertCircle size={16} color="#f59e0b" />
                        <Text fw={700} size="sm">
                          Ready for Review
                        </Text>
                      </Group>
                      <Badge size="xs" variant="light" color="orange">
                        {proj.reviewTasks.length}
                      </Badge>
                    </Group>

                    <Stack gap="xs" mt="xs">
                      {proj.reviewTasks.length === 0 ? (
                        <Text size="xs" c="dimmed" py="sm">
                          No items currently pending review.
                        </Text>
                      ) : (
                        proj.reviewTasks.map((t) => (
                          <Paper key={t.id} withBorder p="xs" radius="sm">
                            <Text size="xs" fw={600}>
                              {t.title}
                            </Text>
                          </Paper>
                        ))
                      )}
                    </Stack>
                  </Card>

                  {/* Recently Finished */}
                  <Card withBorder radius="md" p="md">
                    <Group justify="space-between" mb="xs">
                      <Group gap="xs">
                        <CheckCircle2 size={16} color="#10b981" />
                        <Text fw={700} size="sm">
                          Recently Finished
                        </Text>
                      </Group>
                      <Badge size="xs" variant="light" color="teal">
                        {proj.completedTasksList.length}
                      </Badge>
                    </Group>

                    <Stack gap="xs" mt="xs">
                      {proj.completedTasksList.length === 0 ? (
                        <Text size="xs" c="dimmed" py="sm">
                          Completed milestones will appear here.
                        </Text>
                      ) : (
                        proj.completedTasksList.map((t) => (
                          <Paper key={t.id} withBorder p="xs" radius="sm">
                            <Group gap="xs">
                              <CheckCircle2 size={12} color="#10b981" />
                              <Text size="xs" fw={600} lineClamp={1}>
                                {t.title}
                              </Text>
                            </Group>
                          </Paper>
                        ))
                      )}
                    </Stack>
                  </Card>
                </SimpleGrid>

                {/* Client Asset Box: Deliverables & Upload */}
                <Paper withBorder p="md" radius="md">
                  <Title order={4} fw={700} mb="xs">
                    Deliverables & Shared Documents
                  </Title>
                  <Text size="xs" c="dimmed" mb="md">
                    Download completed deliverables or supply assets directly to your project team.
                  </Text>

                  {proj.assets.length === 0 ? (
                    <Box p="md" mb="md" style={{ textAlign: 'center' }}>
                      <Text size="xs" c="dimmed">
                        No deliverables uploaded yet.
                      </Text>
                    </Box>
                  ) : (
                    <Table.ScrollContainer minWidth={480} mb="md">
                      <Table verticalSpacing="xs">
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>File</Table.Th>
                            <Table.Th>Size</Table.Th>
                            <Table.Th>Uploaded By</Table.Th>
                            <Table.Th style={{ textAlign: 'right' }}>Download</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {proj.assets.map((asset) => (
                            <Table.Tr key={asset.id}>
                              <Table.Td>
                                <Group gap="xs">
                                  {getFileIcon(asset.mime_type)}
                                  <Text size="xs" fw={600}>
                                    {asset.original_name}
                                  </Text>
                                </Group>
                              </Table.Td>
                              <Table.Td>
                                <Text size="xs" c="dimmed">
                                  {formatFileSize(asset.file_size)}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Badge
                                  size="xs"
                                  variant="light"
                                  color={asset.uploaded_by === 'client' ? 'teal' : 'indigo'}
                                >
                                  {asset.uploaded_by === 'client' ? 'You (Client)' : 'Freelancer'}
                                </Badge>
                              </Table.Td>
                              <Table.Td style={{ textAlign: 'right' }}>
                                <Button
                                  component="a"
                                  href={asset.download_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  size="xs"
                                  variant="light"
                                  color="indigo"
                                  leftSection={<Download size={12} />}
                                >
                                  Download
                                </Button>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    </Table.ScrollContainer>
                  )}

                  {/* Client File Upload Box */}
                  <Dropzone
                    onDrop={(files) => handleClientDrop(proj.id, files)}
                    loading={uploadingProjectId === proj.id}
                    maxSize={50 * 1024 ** 2}
                    radius="md"
                    p="md"
                  >
                    <Group justify="center" gap="md" style={{ pointerEvents: 'none' }}>
                      <UploadCloud size={32} color="#6366f1" />
                      <Box style={{ textAlign: 'left' }}>
                        <Text size="sm" fw={600}>
                          Need to supply assets or feedback files?
                        </Text>
                        <Text size="xs" c="dimmed">
                          Drag and drop files here to upload directly to this project (images, documents, archives)
                        </Text>
                      </Box>
                    </Group>
                  </Dropzone>
                </Paper>
              </Paper>
            ))}
          </Stack>
        )}
      </Container>
    </Box>
  );
};
