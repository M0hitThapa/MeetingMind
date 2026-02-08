import { MeetingUploader } from '@/components/meeting/MeetingUploader';

export const metadata = {
  title: 'Upload Meeting | MeetingMind',
};

export default function UploadPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Upload Meeting</h1>
        <p className="text-muted-foreground">
          Upload your audio or video recording for AI analysis
        </p>
      </div>
      
      <MeetingUploader />
    </div>
  );
}