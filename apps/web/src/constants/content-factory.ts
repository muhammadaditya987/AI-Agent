import {
  Clapperboard,
  FileText,
  Image,
  Lightbulb,
  Music2,
  Search,
  Tags,
  WandSparkles,
} from 'lucide-react';

export const contentFactoryTools = [
  { slug: 'youtube-ideas', label: 'YouTube Ideas', icon: Lightbulb, asset: 'songIdea', outputLabel: 'Video idea' },
  { slug: 'keyword-research', label: 'Keyword Research', icon: Search, asset: 'seoKeywords', outputLabel: 'Research keywords' },
  { slug: 'lyrics-generator', label: 'Lyrics Generator', icon: Music2, asset: 'lyrics', outputLabel: 'Lyrics' },
  { slug: 'suno-prompt', label: 'Suno Prompt', icon: WandSparkles, asset: 'sunoPrompt', outputLabel: 'Music prompt' },
  { slug: 'google-flow-prompt', label: 'Google Flow Prompt', icon: Clapperboard, asset: 'googleFlowPrompt', outputLabel: 'Google Flow prompt' },
  { slug: 'thumbnail-prompt', label: 'Thumbnail Prompt', icon: Image, asset: 'thumbnailPrompt', outputLabel: 'Thumbnail prompt' },
  { slug: 'video-prompt', label: 'Video Prompt', icon: Clapperboard, asset: 'googleFlowPrompt', outputLabel: 'Video prompt' },
  { slug: 'metadata-generator', label: 'Metadata Generator', icon: FileText, asset: 'title', outputLabel: 'Video title' },
  { slug: 'seo-generator', label: 'SEO Generator', icon: Tags, asset: 'seoKeywords', outputLabel: 'SEO keywords' },
] as const;

export const contentFactoryWorkflowSteps = ['Input', 'Generate', 'Preview', 'Save', 'Publish'] as const;
