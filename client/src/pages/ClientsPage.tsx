import React from 'react';
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
} from '@mantine/core';
import {
  UserPlus,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Mail,
  Building,
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
          <Title order={2} fw={700} style={{ letterSpacing: '-0.5px' }}>
            Client Management
          </Title>
          <Text size="sm" c="dimmed">
            Manage client profiles and access their zero-login shareable progress portals
          </Text>
        </Box>

        <Button
          leftSection={<UserPlus size={16} />}
          color="dark"
          onClick={onOpenNewClient}
        >
          Add Client
        </Button>
      </Group>

      {clients.length === 0 ? (
        <Paper withBorder p={50} radius="sm" style={{ textAlign: 'center' }}>
          <Building size={40} style={{ opacity: 0.3, margin: '0 auto 16px' }} />
          <Title order={4} mb={4}>
            No clients added yet
          </Title>
          <Text size="sm" c="dimmed" mb="lg">
            Add a client to assign projects and generate unique client portal links.
          </Text>
          <Button
            leftSection={<UserPlus size={16} />}
            color="dark"
            onClick={onOpenNewClient}
          >
            Add First Client
          </Button>
        </Paper>
      ) : (
        <Paper withBorder radius="sm" style={{ backgroundColor: 'var(--bg-card)' }}>
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
                        <Group gap="sm">
                          <Box>
                            <Text size="sm" fw={600}>
                              {client.name}
                            </Text>
                            {client.company && (
                              <Text size="xs" c="dimmed">
                                {client.company}
                              </Text>
                            )}
                          </Box>
                        </Group>
                      </Table.Td>

                      <Table.Td>
                        {client.email ? (
                          <Group gap={6}>
                            <Mail size={14} color="var(--text-secondary)" />
                            <Text size="xs" c="dimmed">
                              {client.email}
                            </Text>
                          </Group>
                        ) : (
                          <Text size="xs" c="dimmed">
                            —
                          </Text>
                        )}
                      </Table.Td>

                      <Table.Td>
                        <Badge variant="outline" color="dark" size="xs">
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
                                  variant="default"
                                  size="xs"
                                  leftSection={copied ? <Check size={14} /> : <Copy size={14} />}
                                  onClick={() => {
                                    copy();
                                    notifications.show({
                                      title: 'Copied',
                                      message: 'Client Portal link copied to clipboard',
                                      color: 'gray',
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
                              color="gray"
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
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Are you sure you want to delete client "${client.name}" and all associated projects?`
                                  )
                                ) {
                                  onDeleteClient(client.id);
                                }
                              }}
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
