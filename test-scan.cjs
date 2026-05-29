const fs = require('fs');

async function testScan() {
  const fetch = (await import('node-fetch')).default;
  const FormData = (await import('form-data')).default;

  const form = new FormData();
  form.append('image', Buffer.from('fake-image-data'), {
    filename: 'food.jpg',
    contentType: 'image/jpeg'
  });

  try {
    const res = await fetch('http://127.0.0.1:3000/api/food/scan', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNzc4ODU1NDk0fQ.OzhZDpqDL7tytvD3klJsNARyn0MoyBUyEfXNFCxLnpo'
      },
      body: form
    });
    const data = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", data);
  } catch (e) {
    console.error("Error:", e);
  }
}

testScan();
