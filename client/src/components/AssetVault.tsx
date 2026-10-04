import React, { useState } from 'react';
import {
  Paper,
  Text,
  Group,
  Table,
  Button,
  ActionIcon,
  Badge,
  Stack,
  Box,
  rem,
  Tooltip,
} from '@mantine/core';
import { Dropzone, FileWithPath } from '@mantine/dropzone';
import {
  UploadCloud,
  File,
  FileText,
  Image as ImageIcon,
  Archive,
  Download,
  Trash2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Asset } from '../types';
import { api } from '../api/client';
import { notifications } from '@mantine/notifications';

interface AssetVaultProps {
  projectId: number;
  assets: Asset[];
  onAssetUploaded: (newAsset: Asset) => void;
  onAssetDeleted: (assetId: number) => void;
}

export const AssetVault: React.FC<AssetVaultProps> = ({
  projectId,
  assets,
  onAssetUploaded,
  onAssetDeleted,
}) => {
  const [uploading, setUploading] = useState<boolean>(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string, filename: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon size={18} color="#3b82f6" />;
    }
    if (mimeType.includes('pdf')) {
      return <FileText size={18} color="#ef4444" />;
    }
    if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('rar')) {
      return <Archive size={18} color="#f59e0b" />;
    }
    return <File size={18} color="#6366f1" />;
  };

  const handleDrop = async (files: FileWithPath[]) => {
    if (files.length === 0) return;

    setUploading(true);
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploaded_by', 'freelancer');

      try {
        const res = await api.post(`/projects/${projectId}/assets`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (res.data?.success && res.data.data) {
          onAssetUploaded(res.data.data);
          notifications.show({
            title: 'Uploaded',
            message: `${file.name} uploaded successfully`,
            color: 'teal',
            icon: <Check size={16} />,
          });
        }
      } catch (err: any) {
        notifications.show({
          title: 'Upload Failed',
          message: err.response?.data?.error || `Failed to upload ${file.name}`,
          color: 'red',
          icon: <AlertCircle size={16} />,
        });
      }
    }
    setUploading(false);
  };

  const handleDelete = async (assetId: number) => {
    try {
      await api.delete(`/assets/${assetId}`);
      onAssetDeleted(assetId);
      notifications.show({
        title: 'Deleted',
        message: 'File removed from server',
        color: 'teal',
      });
    } catch (err: any) {
      notifications.show({
        title: 'Delete Failed',
        message: 'Could not delete file',
        color: 'red',
      });
    }
  };

  const handleDownload = (asset: Asset) => {
    const token = localStorage.getItem('pm_token');
    const downloadUrl = `/api/assets/${asset.id}/download?token=${encodeURIComponent(token || '')}`;
    window.open(downloadUrl, '_blank');
  };

  return (
    <Stack gap="md">
      <Dropzone
        onDrop={handleDrop}
        loading={uploading}
        maxSize={50 * 1024 ** 2}
        radius="md"
        p="xl"
      >
        <Group justify="center" gap="xl" mih={120} style={{ pointerEvents: 'none' }}>
          <Dropzone.Accept>
            <UploadCloud size={48} color="#6366f1" />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <AlertCircle size={48} color="#ef4444" />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <UploadCloud size={48} color="#64748b" />
          </Dropzone.Idle>

          <Box style={{ textAlign: 'center' }}>
            <Text size="md" fw={600} inline>
              Drag files here or click to select deliverables
            </Text>
            <Text size="xs" c="dimmed" inline mt={7}>
              Attach design deliverables, contracts, specifications, or archives (up to 50MB per file)
            </Text>
          </Box>
        </Group>
      </Dropzone>

      <Paper withBorder radius="md">
        <Box p="md" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <Group justify="space-between">
            <Text fw={700} size="sm">
              Project Deliverables & Assets ({assets.length})
            </Text>
            <Text size="xs" c="dimmed">
              Direct local storage on Express
            </Text>
          </Group>
        </Box>

        {assets.length === 0 ? (
          <Box p="xl" style={{ textAlign: 'center' }}>
            <Text size="sm" c="dimmed">
              No files uploaded for this project yet. Use the dropzone above to store project assets.
            </Text>
          </Box>
        ) : (
          <Table.ScrollContainer minWidth={500}>
            <Table verticalSpacing="sm" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Size</Table.Th>
                  <Table.Th>Source</Table.Th>
                  <Table.Th>Uploaded</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {assets.map((asset) => (
                  <Table.Tr key={asset.id}>
                    <Table.Td>
                      <Group gap="xs">
                        {getFileIcon(asset.mime_type, asset.original_name)}
                        <Text size="sm" fw={600} lineClamp={1}>
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
                        color={asset.uploaded_by === 'client' ? 'blue' : 'green'}
                      >
                        {asset.uploaded_by.toUpperCase()}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {new Date(asset.created_at).toLocaleDateString()}
                      </Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>
                      <Group gap={6} justify="flex-end">
                        <Tooltip label="Download file">
                          <ActionIcon
                            variant="default"
                            size="sm"
                            onClick={() => handleDownload(asset)}
                          >
                            <Download size={14} />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label="Delete file">
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            size="sm"
                            onClick={() => handleDelete(asset.id)}
                          >
                            <Trash2 size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Paper>
    </Stack>
  );
};
