import type { Metadata } from 'next';
import { WorkflowListPage } from '@/features/workflow-builder/workflow-list-page';

export const metadata: Metadata = {
  title: 'Workflows',
  description: 'Manage, search, import, and publish workflows.',
};

export default function WorkflowsPage() {
  return <WorkflowListPage />;
}
