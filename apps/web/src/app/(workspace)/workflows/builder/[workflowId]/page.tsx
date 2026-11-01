import type { Metadata } from 'next';
import { WorkflowBuilder } from '@/features/workflow-builder/workflow-builder';

export const metadata: Metadata = {
  title: 'Workflow Builder',
  description: 'Build workflows visually with backend-configured nodes.',
};

export default async function WorkflowEditorPage({
  params,
}: Readonly<{ params: Promise<{ workflowId: string }> }>) {
  const { workflowId } = await params;
  return <WorkflowBuilder initialWorkflowId={workflowId === 'new' ? null : workflowId} />;
}
