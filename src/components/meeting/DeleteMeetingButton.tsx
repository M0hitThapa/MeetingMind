'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { deleteMeeting } from "@/app/actions/meetings"

interface DeleteButtonProps {
  meetingId: string
}

export function DeleteButton({ meetingId }: DeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    await deleteMeeting(meetingId)
    
  }

  return (
    <Button 
      type="button" 
      variant="destructive" 
      onClick={handleDelete}
      disabled={isDeleting}
    >
      {isDeleting ? 'Deleting...' : 'Delete'}
    </Button>
  )
}