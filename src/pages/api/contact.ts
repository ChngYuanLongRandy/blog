import type { APIRoute } from "astro";
import { Resend } from "resend";

export const prerender = false;

const CONTACT_RECIPIENT = "chngyuanlong@gmail.com";

export const POST: APIRoute = async ({ request, redirect }) => {
  const formData = await request.formData();
  const name = formData.get("name")?.toString().trim() ?? "";
  const email = formData.get("email")?.toString().trim() ?? "";
  const subject = formData.get("subject")?.toString().trim() ?? "";
  const message = formData.get("message")?.toString().trim() ?? "";

  // honeypot: real visitors never see or fill this field, so any value
  // means a bot submitted the form. Pretend it succeeded so bots don't
  // learn to avoid the field.
  const honeypot = formData.get("company")?.toString().trim() ?? "";
  if (honeypot) {
    return redirect("/contact?status=success");
  }

  if (!name || !email || !message) {
    return redirect("/contact?status=error");
  }

  // Resend rejects addresses without a dotted domain (e.g. "me@localhost"),
  // which browsers' type="email" check still allows.
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) {
    return redirect("/contact?status=invalid-email");
  }

  const apiKey = import.meta.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set");
    return redirect("/contact?status=error");
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: "Contact Form <onboarding@resend.dev>",
    to: CONTACT_RECIPIENT,
    replyTo: email,
    subject: subject ? `[Contact Form] ${subject}` : `New message from ${name}`,
    text: `From: ${name} <${email}>\n\n${message}`,
  });

  if (error) {
    console.error("Resend error:", error);
    return redirect("/contact?status=error");
  }

  return redirect("/contact?status=success");
};
