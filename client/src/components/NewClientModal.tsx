import React, { useState } from 'react';
import {
  Modal,
  TextInput,
  Button,
  Group,
  Stack,
  Text,
  Alert,
} from '@mantine/core';
import { ShieldCheck, Info } from 'lucide-react';

interface NewClientModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (clientData: {
    name: string;
    email?: string;
    company?: string;
  }) => Promise<void>;
}

export const NewClientModal: React.FC<NewClientModalProps> = ({
  opened,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim() || undefined,
        company: company.trim() || undefined,
      });
      setName('');
      setEmail('');
      setCompany('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={700}>Add New Client</Text>}
      radius="md"
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Client Contact Name"
            placeholder="e.g. Sarah Jenkins"
            required
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
          />

          <TextInput
            label="Company / Brand"
            placeholder="e.g. Acme Corporation"
            value={company}
            onChange={(e) => setCompany(e.currentTarget.value)}
          />

          <TextInput
            label="Email Address"
            type="email"
            placeholder="sarah@acmecorp.com"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
          />

          <Alert
            icon={<ShieldCheck size={16} />}
            title="Cryptographic Share Token"
            color="indigo"
            radius="md"
            variant="light"
          >
            A 64-character unique cryptographic token will be automatically generated.
            The client can view project progress and download deliverables without creating an account.
          </Alert>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" color="indigo" loading={submitting}>
              Add Client
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
