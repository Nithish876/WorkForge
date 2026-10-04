import React from 'react';
import {
  Stack,
  NavLink,
  Text,
  Button,
  Divider,
  ScrollArea,
  Badge,
  Group,
  Box,
} from '@mantine/core';
import {
  LayoutDashboard,
  Users,
  Plus,
  UserPlus,
  FolderKanban,
  ExternalLink,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Client } from '../types';

interface NavbarProps {
  clients: Client[];
  selectedClientId?: number;
  onSelectClient?: (id?: number) => void;
  onOpenNewProject: () => void;
  onOpenNewClient: () => void;
  onCloseMobileDrawer?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  clients,
  selectedClientId,
  onSelectClient,
  onOpenNewProject,
  onOpenNewClient,
  onCloseMobileDrawer,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (path: string) => {
    navigate(path);
    if (onCloseMobileDrawer) onCloseMobileDrawer();
  };

  return (
    <Stack justify="space-between" h="100%" p="sm" gap="xs">
      <ScrollArea style={{ flex: 1 }}>
        <Stack gap="xs">
          <Text size="xs" fw={700} c="dimmed" tt="uppercase" px="xs" mb={4}>
            Workspace
          </Text>

          <NavLink
            label="Dashboard & Projects"
            leftSection={<LayoutDashboard size={18} />}
            active={location.pathname === '/' || location.pathname.startsWith('/projects')}
            onClick={() => handleNav('/')}
            styles={{
              root: { borderRadius: 8 },
            }}
          />

          <NavLink
            label="Clients & Portals"
            leftSection={<Users size={18} />}
            active={location.pathname === '/clients'}
            onClick={() => handleNav('/clients')}
            rightSection={
              <Badge size="xs" variant="light" color="indigo">
                {clients.length}
              </Badge>
            }
            styles={{
              root: { borderRadius: 8 },
            }}
          />

          <Divider my="sm" />

          <Group justify="space-between" px="xs">
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">
              Client Filter
            </Text>
            {selectedClientId && (
              <Text
                size="xs"
                c="indigo"
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectClient?.(undefined)}
              >
                Clear
              </Text>
            )}
          </Group>

          <NavLink
            label="All Clients"
            leftSection={<FolderKanban size={16} />}
            active={selectedClientId === undefined && location.pathname === '/'}
            onClick={() => {
              onSelectClient?.(undefined);
              handleNav('/');
            }}
            styles={{ root: { borderRadius: 6 } }}
          />

          {clients.map((c) => (
            <NavLink
              key={c.id}
              label={c.name}
              description={c.company || undefined}
              active={selectedClientId === c.id}
              onClick={() => {
                onSelectClient?.(c.id);
                handleNav('/');
              }}
              rightSection={
                <Badge size="xs" variant="outline">
                  {c.project_count || 0}
                </Badge>
              }
              styles={{ root: { borderRadius: 6 } }}
            />
          ))}
        </Stack>
      </ScrollArea>

      <Box pt="xs" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <Stack gap="xs">
          <Button
            leftSection={<Plus size={16} />}
            fullWidth
            variant="filled"
            color="indigo"
            onClick={() => {
              onOpenNewProject();
              if (onCloseMobileDrawer) onCloseMobileDrawer();
            }}
          >
            New Project
          </Button>
          <Button
            leftSection={<UserPlus size={16} />}
            fullWidth
            variant="light"
            color="indigo"
            onClick={() => {
              onOpenNewClient();
              if (onCloseMobileDrawer) onCloseMobileDrawer();
            }}
          >
            Add Client
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
};
