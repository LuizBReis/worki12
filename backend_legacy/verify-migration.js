
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Optional for cleanup

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY in .env');
    console.error('Current Env:', {
        url: supabaseUrl ? 'Set' : 'Missing',
        key: supabaseKey ? 'Set' : 'Missing'
    });
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
// Admin client for forced cleanup
const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

async function runTest() {
    console.log('🚀 Starting Supabase Migration Verification...');
    const timestamp = Date.now();
    const clientEmail = `client_${timestamp}@example.com`;
    const freelancerEmail = `free_${timestamp}@example.com`;
    const password = 'Password123!';

    try {
        // 1. Sign Up Client
        console.log(`\n👤 Signing up Client: ${clientEmail}`);
        const { data: clientAuth, error: clientError } = await supabase.auth.signUp({
            email: clientEmail,
            password: password,
            options: {
                data: {
                    firstName: 'Test',
                    lastName: 'Client',
                    role: 'CLIENT',
                    companyName: 'Test Corp'
                }
            }
        });
        if (clientError) throw new Error(`Client SignUp failed: ${clientError.message}`);
        console.log(`✅ Client created: ${clientAuth.user.id}`);
        const clientId = clientAuth.user.id;

        // 2. Sign Up Freelancer
        console.log(`\n👤 Signing up Freelancer: ${freelancerEmail}`);
        const { data: freeAuth, error: freeError } = await supabase.auth.signUp({
            email: freelancerEmail,
            password: password,
            options: {
                data: {
                    firstName: 'Test',
                    lastName: 'Freelancer',
                    role: 'FREELANCER'
                }
            }
        });
        if (freeError) throw new Error(`Freelancer SignUp failed: ${freeError.message}`);
        console.log(`✅ Freelancer created: ${freeAuth.user.id}`);
        const freeId = freeAuth.user.id;

        // Login as Client to get Session
        const { data: clientSession } = await supabase.auth.signInWithPassword({ email: clientEmail, password });
        const clientClient = createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: `Bearer ${clientSession.session.access_token}` } }
        });

        // 3. Create Job (Edge Function)
        console.log('\n💼 Client creating Job via jobs-api...');
        const { data: job, error: jobError } = await clientClient.functions.invoke('jobs-api', {
            body: {
                action: 'create',
                payload: {
                    title: `Test Job ${timestamp}`,
                    description: 'This is a test job from migration verification script.',
                    budget: 1000,
                    skills: ['Node.js', 'Supabase'] // Should create skills if missing
                }
            }
        });
        if (jobError) throw new Error(`Job Create failed: ${jobError.message}`);
        if (!job || !job.id) throw new Error(`Job Create returned invalid data: ${JSON.stringify(job)}`);
        console.log(`✅ Job created: ${job.id} - ${job.title}`);

        // Login as Freelancer
        const { data: freeSession } = await supabase.auth.signInWithPassword({ email: freelancerEmail, password });
        const freeClient = createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: `Bearer ${freeSession.session.access_token}` } }
        });

        // 4. List Jobs (Direct Select)
        console.log('\n📋 Freelancer searching for jobs...');
        const { data: jobs, error: listError } = await freeClient
            .from('Job')
            .select('*')
            .eq('id', job.id);

        if (listError) throw new Error(`List Jobs failed: ${listError.message}`);
        if (jobs.length === 0) throw new Error('Freelancer could not find the created job');
        console.log(`✅ Found job: ${jobs[0].title}`);

        // 5. Apply to Job (Edge Function)
        console.log('\n📝 Freelancer applying to job...');
        const { data: app, error: appError } = await freeClient.functions.invoke('jobs-api', {
            body: {
                action: 'apply',
                payload: { jobId: job.id }
            }
        });
        if (appError) throw new Error(`Apply failed: ${JSON.stringify(appError)}`); // Edge function error format?
        // Note: apply returns { message: 'Applied' } or similar?
        // Let's check invoke return.
        console.log(`✅ Applied Response:`, app);

        // 6. Verify Application status (Direct Select)
        const { data: application, error: verifyAppError } = await freeClient
            .from('JobApplication')
            .select('*')
            .eq('jobId', job.id)
            .eq('applicantId', freeId)
            .single();
        if (verifyAppError) throw new Error(`Verify App failed: ${verifyAppError.message}`);
        console.log(`✅ Application verified in DB: Status=${application.status}`);

        // 7. Client Starts Conversation (Insert Conversation)
        console.log('\n💬 Client starting chat...');
        // Client needs to find application first?
        // Or just Insert Conversation?
        const { data: conv, error: convError } = await clientClient
            .from('Conversation')
            .insert({ applicationId: application.id })
            .select()
            .single();

        // If it fails, maybe manual insert policy issue?
        if (convError) throw new Error(`Create Conversation failed: ${convError.message}`);
        console.log(`✅ Conversation created: ${conv.id}`);

        // 8. Client Sends Message
        console.log('\n📨 Client sending message...');
        const { data: msg, error: msgError } = await clientClient
            .from('Message')
            .insert({
                conversationId: conv.id,
                senderId: clientId,
                content: 'Hello, I like your profile!'
            })
            .select()
            .single();
        if (msgError) throw new Error(`Send Message failed: ${msgError.message}`);
        console.log(`✅ Message sent: "${msg.content}"`);

        // 9. Public Users (Direct Select)
        console.log('\n👥 Checking User Profile Public Access...');
        const { data: publicProfile, error: profileError } = await freeClient
            .from('User')
            .select('firstName, lastName')
            .eq('id', clientId) // Freelancer viewing Client
            .single();
        if (profileError) throw new Error(`Public Profile check failed: ${profileError.message}`);
        console.log(`✅ Fetched Client Profile: ${publicProfile.firstName} ${publicProfile.lastName}`);


        console.log('\n🎉 SUCCESS! All migration steps verified.');

        // Cleanup (Optional)
        if (supabaseAdmin) {
            console.log('\n🧹 Cleaning up test users...');
            await supabaseAdmin.auth.admin.deleteUser(clientId);
            await supabaseAdmin.auth.admin.deleteUser(freeId);
            console.log('✅ Cleanup complete.');
        }

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        console.error('Full Error:', JSON.stringify(error, null, 2));
        if (error.cause) console.error('Cause:', error.cause);
        process.exit(1);
    }
}

runTest();
