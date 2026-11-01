import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { contentFactoryTools } from '@/constants/content-factory';
import { ContentFactoryWorkspace } from '@/features/content-factory/content-factory-workspace';

type Props = Readonly<{ params: Promise<{ tool: string }> }>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tool: slug } = await params;
  const tool = contentFactoryTools.find((item) => item.slug === slug);
  return tool ? { title: tool.label } : { title: 'Content Factory' };
}

export default async function ContentFactoryToolPage({ params }: Props) {
  const { tool } = await params;
  if (!contentFactoryTools.some((item) => item.slug === tool)) notFound();
  return <ContentFactoryWorkspace toolSlug={tool} />;
}
