import { NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/lib/inngest/client';

/**
 * Test endpoint to manually trigger a signup event
 * This helps verify the Inngest -> Email flow is working
 * 
 * Usage: POST http://localhost:3000/api/test-signup
 */
export async function POST(request: NextRequest) {
  try {
    const testEmail = 'test.user@example.com';
    const testName = 'Test User';

    console.log('🧪 Testing Inngest signup flow...');
    console.log(`📧 Sending event for: ${testEmail}`);

    // Send the same event that gets triggered during signup
    const result = await inngest.send({
      name: 'app/user.created',
      data: {
        email: testEmail,
        name: testName,
        country: 'United States',
        investmentGoals: 'Long-term growth',
        riskTolerance: 'Moderate',
        preferredIndustry: 'Technology',
      },
    });

    console.log('✅ Inngest event sent:', result);

    return NextResponse.json(
      {
        success: true,
        message: 'Test signup event triggered',
        details: `Event sent for ${testEmail}. Check the Inngest dashboard at http://localhost:8288 and email server logs.`,
        eventId: result.ids?.[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Test signup failed:', error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        success: false,
        error: 'Test signup event failed',
        message: errorMessage,
        advice: 'Check your Inngest configuration and ensure the event handler is properly registered',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      info: 'Test Signup Endpoint',
      method: 'POST',
      body: 'Empty (uses hardcoded test data)',
      description:
        'Triggers the app/user.created event to test the welcome email flow',
      usage: 'curl -X POST http://localhost:3000/api/test-signup',
      note: 'Monitor the server console and Inngest dashboard for logs',
    },
    { status: 200 }
  );
}
