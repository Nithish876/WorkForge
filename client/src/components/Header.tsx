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
} from '@mantine/core';
import { Layers, Sun, Moon, LogOut, User as UserIcon } from 'lucide-react';
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
        borderBottom: `1px solid var(--border-subtle)`,
        backgroundColor: 'var(--bg-app)',
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
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #108a00 0%, #14a800 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(20, 168, 0, 0.35)',
            }}
          >
            <Layers size={18} strokeWidth={2.4} />
          </Box>
          <Box>
            <Text fw={700} size="sm" style={{ letterSpacing: '-0.3px', lineHeight: 1.2 }}>
              WorkForge
            </Text>
            <Text size="11px" c="dimmed" fw={500}>
              Freelancer & Agency Ops
            </Text>
          </Box>
        </Group>
      </Group>

      <Group gap="sm">
        <ActionIcon
          onClick={() => setColorScheme(isDark ? 'light' : 'dark')}
          variant="default"
          size="lg"
          radius="xl"
          aria-label="Toggle color scheme"
          style={{
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          {isDark ? <Sun size={17} strokeWidth={1.7} color="#14a800" /> : <Moon size={17} strokeWidth={1.7} color="#108a00" />}
        </ActionIcon>

        {user && (
          <Menu position="bottom-end" shadow="md" width={220} radius="md">
            <Menu.Target>
              <Group gap="xs" style={{ cursor: 'pointer' }}>
                <Avatar color="green" radius="xl" size="sm">
                  {user.name.substring(0, 2).toUpperCase()}
                </Avatar>
                <Box visibleFrom="sm" style={{ textAlign: 'left' }}>
                  <Text size="xs" fw={600} lineClamp={1}>
                    {user.name}
                  </Text>
                  <Text size="10px" c="dimmed" lineClamp={1}>
                    {user.email}
                  </Text>
                </Box>
              </Group>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>Signed in as</Menu.Label>
              <Menu.Item
                leftSection={<UserIcon size={14} />}
                onClick={() => navigate('/profile')}
              >
                Profile & Portfolio
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
