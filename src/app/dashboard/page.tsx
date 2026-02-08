import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { getMeetings } from '@/app/actions/meetings';
import { MeetingCard } from '@/components/meeting/MeetingCard';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Dashboard | MeetingMind',
};

async function MeetingsList() {
  const result = await getMeetings();

  if (!result.success || !result.data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load meetings</p>
      </div>
    );
  }

  if (result.data.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-[var(--muted-foreground)] mb-4">No meetings yet</p>
          <Link href="/upload">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Upload Your First Meeting
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {result.data.map((meeting) => (
        <MeetingCard key={meeting.id} meeting={meeting} />
      ))}
    </div>
  );
}

function MeetingsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="h-48">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Your Meetings</h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            Manage and analyze your meeting recordings
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/upload">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Meeting
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters (visual only for now) */}
      <div className="flex gap-2 mb-6">
        <Button variant="outline" size="sm">
          <LayoutGrid className="w-4 h-4 mr-2" />
          Grid
        </Button>
        <Button variant="ghost" size="sm">
          <List className="w-4 h-4 mr-2" />
          List
        </Button>
      </div>

      {/* Meetings Grid */}
      <Suspense fallback={<MeetingsSkeleton />}>
        <MeetingsList />
      </Suspense>
    </div>
  );
}