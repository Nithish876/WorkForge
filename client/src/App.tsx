import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import {
  MantineProvider,
  AppShell,
  Center,
  Loader,
  Drawer,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Notifications, notifications } from '@mantine/notifications';
import { theme } from './theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './api/client';
import { Project, Client } from './types';
import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ClientsPage } from './pages/ClientsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { ClientPortalPage } from './pages/ClientPortalPage';
import { NewProjectModal } from './components/NewProjectModal';
import { NewClientModal } from './components/NewClientModal';

// Protected App Layout
const ProtectedLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [opened, { toggle, close }] = useDisclosure();

  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [selectedClientId, setSelectedClientId] = useState<number | undefined>();

  // Modals
  const [projectModalOpened, setProjectModalOpened] = useState(false);
  const [clientModalOpened, setClientModalOpened] = useState(false);

  const fetchData = async () => {
    try {
      const [projRes, clientRes] = await Promise.all([
        api.get('/projects'),
        api.get('/clients'),
      ]);
      if (projRes.data?.success) setProjects(projRes.data.data);
      if (clientRes.data?.success) setClients(clientRes.data.data);
    } catch {
      // handled
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const handleCreateProject = async (data: any) => {
    try {
      const res = await api.post('/projects', data);
      if (res.data?.success && res.data.data) {
        setProjects([res.data.data, ...projects]);
        notifications.show({
          title: 'Project Created',
          message: `${data.title} added to your workspace`,
          color: 'teal',
        });
      }
    } catch (err: any) {
      notifications.show({
        title: 'Error',
        message: err.response?.data?.error || 'Could not create project',
        color: 'red',
      });
      throw err;
    }
  };

  const handleCreateClient = async (data: any) => {
    try {
      const res = await api.post('/clients', data);
      if (res.data?.success && res.data.data) {
        setClients([res.data.data, ...clients]);
        notifications.show({
          title: 'Client Added',
          message: `${data.name} profile initialized with share portal`,
          color: 'teal',
        });
      }
    } catch (err: any) {
      notifications.show({
        title: 'Error',
        message: err.response?.data?.error || 'Could not create client',
        color: 'red',
      });
      throw err;
    }
  };

  const handleDeleteClient = async (id: number) => {
    if (window.confirm('Delete this client and associated projects?')) {
      try {
        await api.delete(`/clients/${id}`);
        setClients(clients.filter((c) => c.id !== id));
        setProjects(projects.filter((p) => p.client_id !== id));
        notifications.show({
          title: 'Client Deleted',
          message: 'Client removed',
          color: 'teal',
        });
      } catch {
        notifications.show({
          title: 'Error',
          message: 'Could not delete client',
          color: 'red',
        });
      }
    }
  };

  if (isLoading) {
    return (
      <Center mih="100vh">
        <Loader size="lg" color="indigo" />
      </Center>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 260,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Header opened={opened} toggle={toggle} />
      </AppShell.Header>

      <AppShell.Navbar>
        <Navbar
          clients={clients}
          selectedClientId={selectedClientId}
          onSelectClient={setSelectedClientId}
          onOpenNewProject={() => setProjectModalOpened(true)}
          onOpenNewClient={() => setClientModalOpened(true)}
          onCloseMobileDrawer={close}
        />
      </AppShell.Navbar>

      <AppShell.Main>
        <Routes>
          <Route
            path="/"
            element={
              <DashboardPage
                projects={projects}
                clients={clients}
                loading={loadingData}
                selectedClientId={selectedClientId}
                onSelectClient={setSelectedClientId}
                onOpenNewProject={() => setProjectModalOpened(true)}
              />
            }
          />
          <Route
            path="/projects"
            element={
              <DashboardPage
                projects={projects}
                clients={clients}
                loading={loadingData}
                selectedClientId={selectedClientId}
                onSelectClient={setSelectedClientId}
                onOpenNewProject={() => setProjectModalOpened(true)}
              />
            }
          />
          <Route
            path="/projects/:id"
            element={
              <ProjectDetailPage
                clients={clients}
                onProjectUpdated={fetchData}
                onProjectDeleted={(id) => setProjects(projects.filter((p) => p.id !== id))}
              />
            }
          />
          <Route
            path="/clients"
            element={
              <ClientsPage
                clients={clients}
                onOpenNewClient={() => setClientModalOpened(true)}
                onDeleteClient={handleDeleteClient}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell.Main>

      {/* Global Modals */}
      <NewProjectModal
        opened={projectModalOpened}
        onClose={() => setProjectModalOpened(false)}
        clients={clients}
        onSubmit={handleCreateProject}
        onOpenNewClient={() => setClientModalOpened(true)}
      />

      <NewClientModal
        opened={clientModalOpened}
        onClose={() => setClientModalOpened(false)}
        onSubmit={handleCreateClient}
      />
    </AppShell>
  );
};

export const App: React.FC = () => {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <Notifications position="top-right" />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Zero-login Client Portal Route (Accessible without freelancer login) */}
            <Route path="/portal/:token" element={<ClientPortalPage />} />

            {/* Freelancer Login Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Freelancer Dashboard Routes */}
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </MantineProvider>
  );
};

export default App;
