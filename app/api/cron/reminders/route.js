import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize a Supabase Admin client to bypass RLS for server-side automated tasks
// Ensure these environment variables are set in your deployment (e.g. Vercel)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Serverless API Route handling automated webhook triggers from Supabase pg_cron.
 * Protected by a Bearer token.
 */
export async function POST(request) {
  try {
    // 1. Verify authorization header to ensure only our Supabase cron can trigger this
    const authHeader = request.headers.get('authorization');
    const expectedToken = `Bearer ${process.env.CRON_SECRET || 'CRON_SECRET_123'}`;
    
    if (authHeader !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event } = await request.json();

    if (event === 'daily_reminders') {
      console.log('Cron Job Executing: Daily Reminders');

      // 2. Fetch data that requires action: e.g. Freelancers who haven't responded to contract offers
      // Or Jobs that have pending proposals older than 3 days
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const { data: pendingProposals, error } = await supabaseAdmin
        .from('proposals')
        .select(`
          id, job_id, client_id:jobs(client_id)
        `)
        .eq('status', 'pending')
        .lt('created_at', threeDaysAgo.toISOString());

      if (error) {
        console.error('Database query failed:', error);
        return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
      }

      // 3. Process records and trigger email delivery service (Resend, AWS SES, SendGrid, etc.)
      const totalRemindersToSend = pendingProposals?.length || 0;
      
      for (const proposal of pendingProposals || []) {
        // Mocking an email submission task
        // await sendEmail({
        //   to: proposal.client_id.email,
        //   subject: "You have unreviewed proposals waiting!",
        //   body: "Don't forget to review your proposals for your active jobs."
        // });
        console.log(`Email mock triggered for: Client of Job ${proposal.job_id}`);
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Daily reminders executed successfully',
        emails_sent: totalRemindersToSend 
      }, { status: 200 });
    }

    return NextResponse.json({ error: 'Unknown event' }, { status: 400 });
  } catch (err) {
    console.error('Execution Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
