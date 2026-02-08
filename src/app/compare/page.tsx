import { getMeetings } from '@/app/actions/meetings';
import { CompareClient } from '@/components/compare/CompareClient';

export const metadata = {
  title: 'Compare Meetings | MeetingMind',
};

export default async function ComparePage() {
  const { data: meetings = [] } = await getMeetings();

  
  const serializedMeetings = meetings.map((meeting: any) => ({
    ...meeting,
    createdAt: meeting.createdAt.toISOString(),
    updatedAt: meeting.updatedAt.toISOString(),
  }));

  return <CompareClient meetings={serializedMeetings as any} />;
}