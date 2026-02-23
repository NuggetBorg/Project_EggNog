const axios = require('axios');

// --- PASTE YOUR TOKEN BELOW ---
// Make sure there are NO spaces inside the quotes
const RAW_TOKEN = "eyJhbGciOiJFUzI1NiIsImtpZCI6Ijc2NDZkYWQ2LTkzZTAtNDRjYi05YTY2LWVmMjhhOTUzYTIwZiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2p2cWFjaHZyYmt2cnNyc2V5eW9oLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIzM2VhZWFlOC0wYTk2LTRkMmUtODk4MC0yNjI5NWYyNTBkM2QiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzcxNTU1NTc3LCJpYXQiOjE3NzE1NTE5NzcsImVtYWlsIjoiamFjay5tYXVzdDIwMDVAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6ImphY2subWF1c3QyMDA1QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInN1YiI6IjMzZWFlYWU4LTBhOTYtNGQyZS04OTgwLTI2Mjk1ZjI1MGQzZCJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzcxNTUxOTc3fV0sInNlc3Npb25faWQiOiIyMDI2ZGYzNS1lYTM0LTQ3MGMtYTg4Yy1lZjUxMjJkZWJlOTYiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.YcVna2eyMbLnxZChM-mBNnemnRyY4biBemLq4z8Hel832-kkpTLliZwDs0uU7NwchLOCllGfLyy_E2ShakDUjg";

const TOKEN = RAW_TOKEN.trim(); // This removes accidental spaces

const newProduct = {
    name: "Final Test Nog",
    description: "Testing RLS one last time.",
    price: 15.99,
    stock: 10,
    image_url: "final_test.jpg"
};

async function testPost() {
    console.log("Attempting to send product to server...");
    try {
        const response = await axios.post('http://localhost:5000/api/products', newProduct, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        console.log("✅ SUCCESS! Product added to database.");
        console.log("Server Response:", response.data);
    } catch (error) {
        console.error("❌ FAILED!");
        if (error.response) {
            // This tells us exactly what the server/Supabase didn't like
            console.error("Status:", error.response.status);
            console.error("Message:", error.response.data.error || error.response.data);
        } else {
            console.error("Error Message:", error.message);
        }
    }
}

testPost();