import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TodoDashboard } from '@/components/tambo/TodoDashboard';
import { StudyDashboard } from '@/components/tambo/StudyDashboard';
import { getUserTasks, getTaskStats } from '@/app/actions/tasks';
import { getStudyStats, getReviewSession } from '@/app/actions/flashcards';
import { ListTodo, Brain, Calendar } from 'lucide-react';
import { cookies } from 'next/headers';

const USER_ID_COOKIE = 'meetingmind_user_id';

export const metadata = {
  title: 'Productivity | MeetingMind',
};

export default async function ProductivityPage() {
  
  const cookieStore = await cookies();
  const userId = cookieStore.get(USER_ID_COOKIE)?.value || 'anonymous';
  
  
  const [tasksResult, statsResult, studyResult] = await Promise.all([
    getUserTasks(userId),
    getTaskStats(userId),
    getStudyStats(),
  ]);

  const tasks = tasksResult.success ? tasksResult.data || [] : [];
  const stats = statsResult.success ? statsResult.data : undefined;
  const studyStats = studyResult.success ? studyResult.data : undefined;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Productivity Hub</h1>
        <p className="text-[var(--muted-foreground)] mt-1">
          Manage tasks and accelerate learning
        </p>
      </div>

      <Tabs defaultValue="tasks">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="tasks">
            <ListTodo className="w-4 h-4 mr-2" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="study">
            <Brain className="w-4 h-4 mr-2" />
            Study
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <Calendar className="w-4 h-4 mr-2" />
            Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-6">
          <TodoDashboard
            data={{
              tasks: tasks as any,
              stats: stats ? {
                total: stats.total,
                completed: stats.byStatus?.completed || 0,
                overdue: stats.overdue,
                upcoming: stats.upcoming,
                inProgress: stats.byStatus?.in_progress || 0,
                blocked: stats.byStatus?.blocked || 0,
              } : {
                total: 0,
                completed: 0,
                overdue: 0,
                upcoming: 0,
                inProgress: 0,
                blocked: 0,
              }
            }}
          />
        </TabsContent>

        <TabsContent value="study" className="mt-6">
          {studyStats ? (
            <StudyDashboard data={studyStats as any} />
          ) : (
            <div className="text-center py-12 text-[var(--muted-foreground)]">
              Failed to load study data
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <div className="text-center py-12 text-[var(--muted-foreground)]">
            Calendar integration coming soon
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}