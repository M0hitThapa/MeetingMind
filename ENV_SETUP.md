# MeetingMind Environment Variables

Copy these to your `.env` file:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/meetingmind"

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"

# AssemblyAI
ASSEMBLYAI_API_KEY="your-assemblyai-api-key"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# Tambo AI - Required for AI components
NEXT_PUBLIC_TAMBO_API_KEY="your-tambo-api-key"
NEXT_PUBLIC_TAMBO_ENVIRONMENT="production"
```

## Getting API Keys

- **Tambo AI**: Get your API key from https://tambo.ai/dashboard
- **AssemblyAI**: Get your API key from https://www.assemblyai.com/
- **OpenAI**: Get your API key from https://platform.openai.com/
- **Vercel Blob**: Create a token at https://vercel.com/dashboard
