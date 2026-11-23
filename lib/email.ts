type LeadEmailInput = { name: string; company: string; email: string; country: string; phone: string; product: string; quantity: string; message: string };

export async function notifyNewLead(lead: LeadEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.LEAD_NOTIFICATION_EMAIL;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !recipient || !from) return;

  const text = [
    "A new enquiry was submitted on the Sky Plastic website.",
    `Name: ${lead.name}`,
    `Company: ${lead.company || "Not provided"}`,
    `Email: ${lead.email}`,
    `Country: ${lead.country || "Not provided"}`,
    `Phone: ${lead.phone || "Not provided"}`,
    `Product: ${lead.product || "Not specified"}`,
    `Quantity: ${lead.quantity || "Not specified"}`,
    "",
    lead.message,
  ].join("\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [recipient], reply_to: lead.email, subject: `New website enquiry — ${lead.name}`, text }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) console.error("Lead notification email failed:", response.status);
  } catch (error) {
    console.error("Lead notification email failed:", error);
  }
}
