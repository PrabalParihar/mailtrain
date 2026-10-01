import { MailcraftApp } from '@/ui/app';
import { localMode } from '@/server/auth';
export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ screen?: string[] }>;
}) {
  return (
    <MailcraftApp
      screen={(await params).screen ?? []}
      local={localMode()}
      clerkConfigured={!!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    />
  );
}
