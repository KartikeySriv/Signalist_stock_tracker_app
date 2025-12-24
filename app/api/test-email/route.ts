import { NextRequest, NextResponse } from 'next/server';
import { transporter } from '@/lib/nodemailer';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing nodemailer configuration...');
    console.log('📧 Email:', process.env.NODEMAILER_EMAIL);
    console.log('🔑 Password exists:', !!process.env.NODEMAILER_PASSWORD);

    // Verify connection
    const verified = await transporter.verify();
    console.log('✅ Transporter verified:', verified);

    if (!verified) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transporter verification failed',
          details: 'Connection to Gmail SMTP server could not be established',
        },
        { status: 500 }
      );
    }

    // Send a test email
    const testEmail = process.env.NODEMAILER_EMAIL;
    if (!testEmail) {
      return NextResponse.json(
        {
          success: false,
          error: 'NODEMAILER_EMAIL environment variable is not set',
        },
        { status: 400 }
      );
    }

    const info = await transporter.sendMail({
      from: `"Signalist Test" <${testEmail}>`,
      to: testEmail,
      subject: '🧪 Signalist Email Test - Configuration Check',
      text: 'If you received this email, nodemailer is working correctly!',
      html: `
        <h2>✅ Signalist Email System Test</h2>
        <p>Nodemailer is configured correctly!</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <p>You can now safely delete this test email.</p>
      `,
    });

    console.log('✅ Email sent successfully:', info.messageId);

    return NextResponse.json(
      {
        success: true,
        message: 'Test email sent successfully',
        messageId: info.messageId,
        testEmail: testEmail,
        details:
          'Check your inbox for a test email. If you received it, nodemailer is working!',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Email test failed:', error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    // Provide specific error guidance
    let guidance = '';
    if (errorMessage.includes('Invalid login')) {
      guidance =
        '\n❌ Invalid credentials. Check your app password is correct.';
    } else if (errorMessage.includes('ECONNREFUSED')) {
      guidance =
        '\n❌ Connection refused. Check your internet connection or Gmail SMTP settings.';
    } else if (errorMessage.includes('getaddrinfo ENOTFOUND')) {
      guidance = '\n❌ Cannot reach Gmail server. Check your network connection.';
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Email test failed',
        message: errorMessage + guidance,
        advice:
          'If the error is "Invalid login", regenerate your Google App Password',
      },
      { status: 500 }
    );
  }
}
