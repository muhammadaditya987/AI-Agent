import type { Metadata } from 'next';
import { OperationsDashboard } from './operations-dashboard';

export const metadata: Metadata = {
  title: 'Overview',
  description: 'Live operational status for the AI Agency platform.',
};

export default function DashboardPage() {
  return <OperationsDashboard />;
}