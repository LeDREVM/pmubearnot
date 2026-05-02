// netlify/functions/pmu-proxy.js
// Proxy serverless pour l'API PMU — contourne le CORS

const PMU_BASE = "https://offline.turfinfo.api.pmu.fr/rest/client/7/programme";

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
  };

  // Preflight CORS
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  // Paramètres : date, reunion, course
  const { date, reunion, course } = event.queryStringParameters || {};

  if (!date) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Paramètre 'date' requis (ex: 25042026)" }),
    };
  }

  // Construction de l'URL PMU
  let url = `${PMU_BASE}/${date}`;
  if (reunion) url += `/R${reunion}`;
  if (reunion && course) url += `/C${course}/participants`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      return {
        statusCode: res.status,
        headers,
        body: JSON.stringify({ error: `PMU API error: ${res.status}` }),
      };
    }

    const data = await res.json();
    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
