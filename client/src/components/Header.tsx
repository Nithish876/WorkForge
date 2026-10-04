import React from 'react';
import {
  Group,
  Burger,
  Text,
  ActionIcon,
  useMantineColorScheme,
  useComputedColorScheme,
  Menu,
  Avatar,
  Box,
  Badge,
} from '@mantine/core';
import { Layers, Sun, Moon, LogOut, User as UserIcon, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  opened: boolean;
  toggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ opened, toggle }) => {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('dark', { getInitialValueInEffect: true });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isDark = computedColorScheme === 'dark';

  return (
    <Box
      h="100%"
      px="md"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
      }}
    >
      <Group gap="sm">
        <Burger
          opened={opened}
          onClick={toggle}
          hiddenFrom="sm"
          size="sm"
          aria-label="Toggle navigation"
        />

        <Group
          gap="xs"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          <Box
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
            }}
          >
            <Layers size={18} />
          </Box>
          <Box>
            <Text fw={700} size="md" style={{ letterSpacing: '-0.3px', lineHeight: 1.2 }}>
              ProjectForge
            </Text>
            <Text size="10px" c="dimmed" fw={500}>
              Freelance & Business Ops
            </Text>
          </Box>
        </Group>
      </Group>

      <Group gap="sm">
        <Badge
          variant="light"
          color="indigo"
          visibleFrom="md"
          leftSection={<Shield size={12} />}
        >
          Functional MVC Core
        </Badge>

        <ActionIcon
          onClick={() => setColorScheme(isDark ? 'light' : 'dark')}
          variant="default"
          size="lg"
          aria-label="Toggle color scheme"
        >
          {isDark ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
        </ActionIcon>

        {user && (
          <Menu position="bottom-end" shadow="md" width={200}>
            <Menu.Target>
              <Group gap="xs" style={{ cursor: 'pointer' }}>
                <Avatar color="indigo" radius="xl" size="sm">
                  {user.name.substring(0, 2).toUpperCase()}
                </Avatar>
                <Box visibleFrom="sm" style={{ textAlign: 'left' }}>
                  <Text size="sm" fw={600} lineClamp={1}>
                    {user.name}
                  </Text>
                  <Text size="xs" c="dimmed" lineClamp={1}>
                    {user.email}
                  </Text>
                </Box>
              </Group>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>Signed in as</Menu.Label>
              <Menu.Item leftSection={<UserIcon size={14} />} disabled>
                {user.email}
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<LogOut size={14} />}
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
                Sign out
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>
    </Box>
  );
};
