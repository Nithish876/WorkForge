import React, { useState } from 'react';
import {
  Container,
  Paper,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Tabs,
  Stack,
  Group,
  Box,
  Badge,
  Divider,
} from '@mantine/core';
import { Layers, Lock, Mail, User, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';

export const LoginPage: React.FC = () => {
  const { login, register, demoLogin } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<string | null>('login');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      notifications.show({
        title: 'Welcome Back',
        message: 'Successfully logged in to ProjectForge',
        color: 'teal',
      });
      navigate('/');
    } catch (err: any) {
      notifications.show({
        title: 'Login Error',
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
        message: 'Welcome to ProjectForge!',
        color: 'teal',
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
        color: 'indigo',
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
      <Stack align="center" gap="sm" mb="xl">
        <Box
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
          }}
        >
          <Layers size={24} />
        </Box>
        <Text fw={800} size="xl" style={{ letterSpacing: '-0.5px' }}>
          ProjectForge
        </Text>
        <Badge variant="light" color="indigo" size="sm">
          Freelancers & Independent Agencies
        </Badge>
      </Stack>

      <Paper withBorder shadow="md" p="xl" radius="md">
        <Tabs value={tab} onChange={setTab} color="indigo">
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
                  color="indigo"
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
                  color="indigo"
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
          variant="light"
          color="indigo"
          loading={demoLoading}
          leftSection={<ShieldCheck size={16} />}
          onClick={handleDemo}
        >
          1-Click Demo Login (Alex Rivers)
        </Button>
      </Paper>
    </Container>
  );
};
