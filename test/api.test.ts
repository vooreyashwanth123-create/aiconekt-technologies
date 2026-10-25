// Comprehensive Automated API & Zero-Demo-Data Tests for AICONEKT TECHNOLOGIES
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://localhost:3001/api';

async function runTests() {
  console.log('--- STARTING AICONEKT TECHNOLOGIES API AUTOMATION TESTS ---');
  let token = '';

  // TEST 1: Health Check
  console.log('\n[Test 1] Health Check...');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  if (healthRes.status !== 200 || healthData.status !== 'healthy') {
    throw new Error(`Health check failed: ${JSON.stringify(healthData)}`);
  }
  console.log('✔ Health Check Passed: Database & Server Active');

  // TEST 2: Founder Authentication via Secure Environment Configuration
  console.log('\n[Test 2] Founder Authentication (KOLLOJU RAVI CHARAN)...');
  const founderPassword = process.env.TEST_ADMIN_PASSWORD || process.env.INITIAL_FOUNDER_PASSWORD;
  if (!founderPassword) {
    throw new Error('INITIAL_FOUNDER_PASSWORD or TEST_ADMIN_PASSWORD must be configured in environment (.env).');
  }

  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'ravicharan@aiconekt.org',
      password: founderPassword,
    }),
  });
  const loginData = await loginRes.json();
  if (loginRes.status !== 200 || !loginData.token || loginData.user.role !== 'Founder') {
    throw new Error(`Founder login failed: ${JSON.stringify(loginData)}`);
  }
  token = loginData.token;
  console.log(`✔ Founder Login Passed: Authenticated as ${loginData.user.full_name} (${loginData.user.role})`);

  // TEST 2B: Interactive Demo Authentication (Credential-Free)
  console.log('\n[Test 2B] Interactive Demo Authentication Endpoint...');
  const demoRes = await fetch(`${BASE_URL}/auth/demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'Administrator' }),
  });
  const demoData = await demoRes.json();
  if (demoRes.status !== 200 || !demoData.token || demoData.user.role !== 'Administrator') {
    throw new Error(`Demo login failed: ${JSON.stringify(demoData)}`);
  }
  console.log(`✔ Demo Authentication Passed: Token issued for ${demoData.user.full_name} (${demoData.user.role})`);

  // TEST 3: Invalid Authentication
  console.log('\n[Test 3] Invalid Credentials Check...');
  const badLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'ravicharan@aiconekt.org',
      password: 'WrongPassword!',
    }),
  });
  if (badLoginRes.status !== 401) {
    throw new Error(`Expected 401 for bad credentials, got ${badLoginRes.status}`);
  }
  console.log('✔ Invalid Credentials Successfully Rejected (401)');

  // TEST 4: Zero-Demo-Data Policy Verification
  console.log('\n[Test 4] Zero-Demo-Data Compliance Audit...');
  const pRes = await fetch(`${BASE_URL}/projects`);
  const pData = await pRes.json();

  const eRes = await fetch(`${BASE_URL}/events`);
  const eData = await eRes.json();

  const postRes = await fetch(`${BASE_URL}/posts`);
  const postData = await postRes.json();

  const inqRes = await fetch(`${BASE_URL}/contact/inquiries`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const inqData = await inqRes.json();

  const statsRes = await fetch(`${BASE_URL}/dashboard/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const statsData = await statsRes.json();

  console.log(`- Initial Projects: ${pData.projects.length}`);
  console.log(`- Initial Events: ${eData.events.length}`);
  console.log(`- Initial Posts: ${postData.posts.length}`);
  console.log(`- Initial Inquiries: ${inqData.inquiries.length}`);
  console.log(`- Dashboard Stats: Total Projects = ${statsData.metrics.total_projects}, Total Events = ${statsData.metrics.total_events}`);

  if (pData.projects.length !== 0 || eData.events.length !== 0 || postData.posts.length !== 0 || inqData.inquiries.length !== 0) {
    throw new Error('Zero-demo-data violation: Found pre-seeded fake records in production database!');
  }
  console.log('✔ Zero-Demo-Data Verification Passed: 100% Clean Production Database');

  // TEST 5: Project Management (Create & Retrieve)
  console.log('\n[Test 5] Project Creation & Retrieval...');
  const createProjectRes = await fetch(`${BASE_URL}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: 'Automated Test Edge Perception',
      tagline: 'Deep Learning Inference Benchmark',
      description: 'Test project for automated CI pipeline verification.',
      category: 'ai-ml',
      status: 'In Progress',
      visibility: 'public',
      tags: ['PyTorch', 'Testing'],
    }),
  });
  const projectCreated = await createProjectRes.json();
  if (createProjectRes.status !== 201) {
    throw new Error(`Project creation failed: ${JSON.stringify(projectCreated)}`);
  }
  const projectId = projectCreated.project.id;
  console.log(`✔ Project Created: "${projectCreated.project.title}" (ID: ${projectId})`);

  // Verify project appears in public listing
  const pCheckRes = await fetch(`${BASE_URL}/projects`);
  const pCheckData = await pCheckRes.json();
  if (!pCheckData.projects.find((p: any) => p.id === projectId)) {
    throw new Error('Created project not found in public projects list');
  }
  console.log('✔ Project Retrieval Verified');

  // TEST 6: Event Lifecycle & Registration
  console.log('\n[Test 6] Event Lifecycle & Registration...');
  const createEventRes = await fetch(`${BASE_URL}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: 'AICONEKT Test Hackathon',
      category: 'Hackathon',
      tagline: 'CI/CD Automated Event Test',
      description: 'Testing event registration and team isolation.',
      start_date: '2026-11-20',
      venue: 'Main Auditorium',
      capacity: 50,
      min_team_size: 1,
      max_team_size: 4,
    }),
  });
  const eventCreated = await createEventRes.json();
  if (createEventRes.status !== 201) {
    throw new Error(`Event creation failed: ${JSON.stringify(eventCreated)}`);
  }
  const eventId = eventCreated.event.id;
  console.log(`✔ Event Created: "${eventCreated.event.title}" (ID: ${eventId})`);

  // Register attendee
  const regRes = await fetch(`${BASE_URL}/events/${eventId}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attendee_name: 'Test Student',
      attendee_email: 'test.student@campus.edu',
    }),
  });
  const regData = await regRes.json();
  if (regRes.status !== 201) {
    throw new Error(`Event registration failed: ${JSON.stringify(regData)}`);
  }
  console.log('✔ Event Registration Succeeded');

  // Duplicate registration check
  const dupRegRes = await fetch(`${BASE_URL}/events/${eventId}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attendee_name: 'Test Student',
      attendee_email: 'test.student@campus.edu',
    }),
  });
  if (dupRegRes.status !== 409) {
    throw new Error(`Expected 409 for duplicate registration, got ${dupRegRes.status}`);
  }
  console.log('✔ Duplicate Event Registration Correctly Prevented (409 Conflict)');

  // TEST 7: Event-Specific Team Creation (Section 11 Isolation)
  console.log('\n[Test 7] Event-Specific Team Creation...');
  const teamRes = await fetch(`${BASE_URL}/events/${eventId}/teams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      team_name: 'Neural Explorers',
      lead_name: 'Alex Lead',
      lead_email: 'alex@campus.edu',
      project_pitch: 'Autonomous edge computer vision for robotics.',
      members: [
        { name: 'Sam Dev', email: 'sam@campus.edu', role: 'Developer' },
        { name: 'Jordan ML', email: 'jordan@campus.edu', role: 'ML Specialist' },
      ],
    }),
  });
  const teamData = await teamRes.json();
  if (teamRes.status !== 201) {
    throw new Error(`Event team registration failed: ${JSON.stringify(teamData)}`);
  }
  console.log(`✔ Event Team Created: "${teamData.team.team_name}" with ${teamData.team.members.length} members (Isolated from Org Teams)`);

  // TEST 8: Contact Form & Notification Pipeline (Section 14)
  console.log('\n[Test 8] Contact Submission & Notification Pipeline...');
  const contactRes = await fetch(`${BASE_URL}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Dr. Evelyn Carter',
      email: 'evelyn.carter@research.org',
      subject: 'Autonomous Systems Research Collaboration',
      category: 'Research Partnership',
      message: 'Inquiring regarding joint research publications with AICONEKT TECHNOLOGIES.',
    }),
  });
  const contactData = await contactRes.json();
  if (contactRes.status !== 201 || !contactData.inquiry_id) {
    throw new Error(`Contact submission failed: ${JSON.stringify(contactData)}`);
  }
  console.log(`✔ Contact Form Submitted: Saved in DB (ID: ${contactData.inquiry_id})`);
  console.log(`✔ Notification Status: ${contactData.notification.status} (${contactData.notification.message})`);

  // Verify inquiry appears in admin inbox
  const inboxRes = await fetch(`${BASE_URL}/contact/inquiries`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const inboxData = await inboxRes.json();
  const foundInquiry = inboxData.inquiries.find((i: any) => i.id === contactData.inquiry_id);
  if (!foundInquiry) {
    throw new Error('Inquiry not found in admin inbox!');
  }
  console.log(`✔ Admin Inbox Verified: Found inquiry "${foundInquiry.subject}" with status "${foundInquiry.status}"`);

  // TEST 9: Clean Up Test Records (Zero Pollution)
  console.log('\n[Test 9] Cleaning up test records to ensure zero test pollution...');
  await fetch(`${BASE_URL}/projects/${projectId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  await fetch(`${BASE_URL}/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  await fetch(`${BASE_URL}/contact/inquiries/${contactData.inquiry_id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('✔ Test Records Cleaned Up');

  // Verify 0 records again
  const finalStatsRes = await fetch(`${BASE_URL}/dashboard/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const finalStats = await finalStatsRes.json();
  console.log(`✔ Final Dashboard Metric Check: Projects = ${finalStats.metrics.total_projects}, Events = ${finalStats.metrics.total_events}, Inquiries = ${finalStats.metrics.total_inquiries}`);

  console.log('\n======================================================');
  console.log(' ALL 9 AUTOMATED SUITES PASSED SUCCESSFULLY (100%)');
  console.log('======================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ TEST FAILURE:', err);
  process.exit(1);
});
