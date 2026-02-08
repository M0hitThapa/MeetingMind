'use client'

import { createMeeting } from "@/app/actions/meetings"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Button } from "../ui/button"

export const MeetingForm = () => {

    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        
        
        const result = await createMeeting({
            title: formData.get('title') as string || 'Untitled Meeting',
            audioUrl: 'https://example.com/placeholder.mp3', 
            fileType: 'audio',
            hasVideo: false,
        })

        if (result.error) {
            setError(result.error)
        }

        setIsLoading(false)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create New Meeting</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="title" className="block text-sm font-medium mb-2">
                            Meeting Title
                        </Label>
                        <Input id="title" name="title" placeholder="example" required />

                    </div>
                    {error && (
                        <p className="text-sm text-red-500">{error}</p>
                    )}

                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Creating...' : "Create Meeting"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}