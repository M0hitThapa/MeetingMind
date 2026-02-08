'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MeetingComparator } from '@/components/tambo/MeetingComparator';
import { useToast } from '@/hooks/useToast';
import type { Meeting, ComparisonResult } from '@/types';

interface CompareClientProps {
    meetings: Meeting[];
}

export function CompareClient({ meetings }: CompareClientProps) {
    const [selectedMeetings, setSelectedMeetings] = useState<string[]>([]);
    const [comparison, setComparison] = useState<ComparisonResult | null>(null);
    const [loading, setLoading] = useState(false);
    const { error: showError } = useToast();

    const toggleMeeting = (id: string) => {
        setSelectedMeetings(prev =>
            prev.includes(id)
                ? prev.filter(m => m !== id)
                : [...prev, id]
        );
    };

    const handleCompare = async () => {
        if (selectedMeetings.length < 2) {
            showError('Please select at least 2 meetings to compare');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/meetings/compare', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ meetingIds: selectedMeetings }),
            });

            if (!response.ok) throw new Error('Comparison failed');

            const { data } = await response.json();
            setComparison(data);
        } catch (err) {
            showError('Failed to compare meetings');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold mb-2">Compare Meetings</h1>
            <p className="text-muted-foreground mb-8">
                Analyze patterns and trends across multiple meetings
            </p>

            <div className="grid lg:grid-cols-3 gap-8">
                
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Select Meetings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {meetings.map((meeting) => (
                                <div
                                    key={meeting.id}
                                    className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-(--accent)/5 transition-colors cursor-pointer"
                                    onClick={() => toggleMeeting(meeting.id)}
                                >
                                    <Checkbox
                                        checked={selectedMeetings.includes(meeting.id)}
                                        onCheckedChange={() => toggleMeeting(meeting.id)}
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{meeting.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(meeting.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Button
                            className="w-full mt-4"
                            disabled={selectedMeetings.length < 2 || loading}
                            onClick={handleCompare}
                        >
                            {loading ? 'Analyzing...' : `Compare (${selectedMeetings.length})`}
                        </Button>
                    </CardContent>
                </Card>


                <div className="lg:col-span-2">
                    {comparison ? (
                        <MeetingComparator data={comparison as any} />
                    ) : (
                        <Card className="h-full flex items-center justify-center min-h-[400px]">
                            <CardContent className="text-center">
                                <p className="text-muted-foreground">
                                    Select meetings and click compare to see insights
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
