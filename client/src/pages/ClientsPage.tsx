import React, { useState } from 'react';
import {
  Title,
  Text,
  Group,
  Stack,
  Button,
  Paper,
  Table,
  Badge,
  ActionIcon,
  Tooltip,
  CopyButton,
  Box,
  SimpleGrid,
  Card,
} from '@mantine/core';
import {
  UserPlus,
  Share2,
  ExternalLink,
  Copy,
  Check,
  Building,
  Mail,
  FolderKanban,
  Shield,
  Trash2,
} from 'lucide-react';
import { Client } from '../types';
import { notifications } from '@mantine/notifications';

interface ClientsPageProps {
  clients: Client[];
  onOpenNewClient: () => void;
  onDeleteClient: (id: number) => void;
}

export const ClientsPage: React.FC<ClientsPageProps> = ({
  clients,
  onOpenNewClient,
  onDeleteClient,
}) => {
  return (
    <Stack gap="xl">
      <Group justify="space-between" align="center" wrap="wrap">
        <Box>
          <Title order={2} fw={800} style={{ letterSpacing: '-0.5px' }}>
            Client Management
          </Title>
          <Text size="sm" c="dimmed">
            Manage client profiles and access their zero-login shareable progress portals
          </Text>
        </Box>

        <Button
          leftSection={<UserPlus size={16} />}
          color="indigo"
          onClick={onOpenNewClient}
        >
          Add Client
        </Button>
      </Group>

      {clients.length === 0 ? (
        <Paper withBorder p={50} radius="md" style={{ textAlign: 'center' }}>
          <Building size={48} style={{ opacity: 0.3, margin: '0 auto 16px' }} />
          <Title order={4} mb={4}>
            No clients added yet
          </Title>
          <Text size="sm" c="dimmed" mb="lg">
            Add a client to assign projects and generate unique client portal links.
          </Text>
          <Button
            leftSection={<UserPlus size={16} />}
            color="indigo"
            onClick={onOpenNewClient}
          >
            Add First Client
          </Button>
        </Paper>
      ) : (
        <Paper withBorder radius="md">
          <Table.ScrollContainer minWidth={640}>
            <Table verticalSpacing="md" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Client & Company</Table.Th>
                  <Table.Th>Contact</Table.Th>
                  <Table.Th>Active Projects</Table.Th>
                  <Table.Th>Share Token</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Portal Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {clients.map((client) => {
                  const portalUrl = `${window.location.origin}/portal/${client.share_token}`;

                  return (
                    <Table.Tr key={client.id}>
                      <Table.Td>
                        <Box>
                          <Text size="sm" fw={700}>
                            {client.name}
                          </Text>
                          {client.company && (
                            <Group gap={4} c="dimmed">
                              <Building size={12} />
                              <Text size="xs">{client.company}</Text>
                            </Group>
                          )}
                        </Box>
                      </Table.Td>

                      <Table.Td>
                        {client.email ? (
                          <Group gap={4}>
                            <Mail size={12} color="#64748b" />
                            <Text size="xs">{client.email}</Text>
                          </Group>
                        ) : (
                          <Text size="xs" c="dimmed">
                            —
                          </Text>
                        )}
                      </Table.Td>

                      <Table.Td>
                        <Badge variant="light" color="indigo" size="sm">
                          {client.project_count || 0} Projects
                        </Badge>
                      </Table.Td>

                      <Table.Td>
                        <Group gap="xs">
                          <Badge variant="outline" color="gray" size="xs" style={{ fontFamily: 'monospace' }}>
                            {client.share_token.substring(0, 10)}...
                          </Badge>
                        </Group>
                      </Table.Td>

                      <Table.Td style={{ textAlign: 'right' }}>
                        <Group gap="xs" justify="flex-end">
                          <CopyButton value={portalUrl} timeout={2000}>
                            {({ copied, copy }) => (
                              <Tooltip label={copied ? 'Copied URL!' : 'Copy Portal Share URL'}>
                                <Button
                                  variant="light"
                                  color={copied ? 'teal' : 'indigo'}
                                  size="xs"
                                  leftSection={copied ? <Check size={14} /> : <Copy size={14} />}
                                  onClick={() => {
                                    copy();
                                    notifications.show({
                                      title: 'Copied',
                                      message: 'Client Portal link copied to clipboard',
                                      color: 'teal',
                                    });
                                  }}
                                >
                                  {copied ? 'Copied' : 'Copy Link'}
                                </Button>
                              </Tooltip>
                            )}
                          </CopyButton>

                          <Tooltip label="Open Client Portal in New Tab">
                            <ActionIcon
                              variant="subtle"
                              color="indigo"
                              size="md"
                              onClick={() => window.open(portalUrl, '_blank')}
                            >
                              <ExternalLink size={16} />
                            </ActionIcon>
                          </Tooltip>

                          <Tooltip label="Delete Client">
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              size="md"
                              onClick={() => onDeleteClient(client.id)}
                            >
                              <Trash2 size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      )}
    </Stack>
  );
};
