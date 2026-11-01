import { WorkspaceLayout } from '@/layouts/workspace-layout';

export default function WorkspaceRouteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <WorkspaceLayout>{children}</WorkspaceLayout>;
}