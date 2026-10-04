import React, { useState } from 'react';
import {
  Container,
  Paper,
  Tabs,
  TextInput,
  PasswordInput,
  Button,
  Title,
  Text,
  Stack,
  Divider,
  Box,
} from '@mantine/core';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';

export const LoginPage: React.FC = () => {
  const { login, register, demoLogin } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<string | null>('login');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState('alex@freelancer.io');
  const [loginPassword, setLoginPassword] = useState('password123');

  // Register form
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      notifications.show({
        title: 'Welcome back',
        message: 'Successfully signed in to WorkForge',
        color: 'gray',
      });
      navigate('/');
    } catch (err: any) {
      notifications.show({
        title: 'Authentication Failed',
        message: err.message || 'Invalid email or password',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(registerName, registerEmail, registerPassword);
      notifications.show({
        title: 'Account Created',
        message: 'Welcome to WorkForge!',
        color: 'gray',
      });
      navigate('/');
    } catch (err: any) {
      notifications.show({
        title: 'Registration Error',
        message: err.message || 'Could not register account',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setDemoLoading(true);
    try {
      await demoLogin();
      notifications.show({
        title: 'Demo Session Active',
        message: 'Logged in as Alex Rivers (Freelance Lead)',
        color: 'gray',
      });
      navigate('/');
    } catch (err: any) {
      notifications.show({
        title: 'Demo Login Error',
        message: err.message,
        color: 'red',
      });
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <Container size="xs" py={60}>
      <Stack align="center" gap="xs" mb="xl">
        <Box
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #14a800 0%, #108a00 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(20, 168, 0, 0.28)',
          }}
        >
          <Layers size={26} strokeWidth={2.4} />
        </Box>
        <Title order={2} fw={800} style={{ letterSpacing: '-0.5px' }}>
          WorkForge
        </Title>
        <Text size="xs" c="dimmed">
          Project Management & Collaboration Suite
        </Text>
      </Stack>

      <Paper withBorder shadow="sm" p="xl" radius="lg" style={{ backgroundColor: 'var(--bg-card)' }}>
        <Tabs value={tab} onChange={setTab} color="green">
          <Tabs.List grow mb="lg">
            <Tabs.Tab value="login" fw={600}>
              Sign In
            </Tabs.Tab>
            <Tabs.Tab value="register" fw={600}>
              Create Account
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="login">
            <form onSubmit={handleLogin}>
              <Stack gap="md">
                <TextInput
                  label="Email"
                  placeholder="alex@freelancer.io"
                  
                  leftSection={<Mail size={16} />}
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.currentTarget.value)}
                />

                <PasswordInput
                  label="Password"
                  placeholder="Your password"
                  leftSection={<Lock size={16} />}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.currentTarget.value)}
                />

                <Button
                  type="submit"
                  fullWidth
                  color="green"
                  radius="xl"
                  loading={loading}
                  rightSection={<ArrowRight size={16} />}
                >
                  Sign In
                </Button>
              </Stack>
            </form>
          </Tabs.Panel>

          <Tabs.Panel value="register">
            <form onSubmit={handleRegister}>
              <Stack gap="md">
                <TextInput
                  label="Full Name"
                  placeholder="Alex Rivers"
                  leftSection={<User size={16} />}
                  required
                  value={registerName}
                  onChange={(e) => setRegisterName(e.currentTarget.value)}
                />

                <TextInput
                  label="Email"
                  placeholder="alex@freelancer.io"
                  leftSection={<Mail size={16} />}
                  required
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.currentTarget.value)}
                />

                <PasswordInput
                  label="Password"
                  placeholder="At least 6 characters"
                  leftSection={<Lock size={16} />}
                  required
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.currentTarget.value)}
                />

                <Button
                  type="submit"
                  fullWidth
                  color="green"
                  radius="xl"
                  loading={loading}
                  rightSection={<ArrowRight size={16} />}
                >
                  Create Account
                </Button>
              </Stack>
            </form>
          </Tabs.Panel>
        </Tabs>

        <Divider my="lg" label="or explore with sample data" labelPosition="center" />

        <Button
          fullWidth
          variant="default"
          radius="xl"
          loading={demoLoading}
          leftSection={<ShieldCheck size={16} color="var(--accent-primary)" />}
          onClick={handleDemo}
        >
          1-Click Demo Login (Alex Rivers)
        </Button>
      </Paper>
    </Container>
  );
};
