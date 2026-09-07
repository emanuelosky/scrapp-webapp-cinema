const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const urlMatch = env.match(/PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/PUBLIC_SUPABASE_ANON_KEY=(.*)/);

if (!urlMatch || !keyMatch) {
  console.error("Could not find Supabase credentials in .env");
  process.exit(1);
}

const url = urlMatch[1].trim();
const key = keyMatch[1].trim();

async function updatePromo() {
  // First, fetch the promos
  const res = await fetch(`${url}/rest/v1/promo_banners?select=*`, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  });
  const data = await res.json();
  console.log("Current promos:", data);

  // Now, update the one that has 'tickets' to 'boletos'
  for (const promo of data) {
    if (promo.message && promo.message.toLowerCase().includes('tickets')) {
      const newMessage = promo.message.replace(/tickets/gi, 'boletos');
      console.log(`Updating promo ${promo.id} to: ${newMessage}`);
      
      // Since anon key is likely blocked by RLS for writes, we need the SERVICE_ROLE_KEY
      const serviceKeyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);
      if (serviceKeyMatch) {
          const serviceKey = serviceKeyMatch[1].trim();
          const updateRes = await fetch(`${url}/rest/v1/promo_banners?id=eq.${promo.id}`, {
            method: 'PATCH',
            headers: {
              'apikey': serviceKey,
              'Authorization': `Bearer ${serviceKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({ message: newMessage })
          });
          console.log("Update result:", await updateRes.json());
      } else {
          console.log("No SERVICE_ROLE_KEY found, cannot update.");
      }
    }
  }
}

updatePromo().catch(console.error);
