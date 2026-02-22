import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, planHtml } = await req.json();

    if (!to || !subject || !planHtml) {
      return new Response(JSON.stringify({ error: "Missing required fields: to, subject, planHtml" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use Supabase built-in SMTP to send email via the Auth admin API
    // Since we don't have an external email service, we'll use the Lovable AI gateway
    // to format and return a mailto link as a fallback
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // Build a clean HTML email
    const emailHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 30px; color: #1a1a1a; direction: rtl; background: #f9fafb; }
          .container { max-width: 700px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
          h2 { color: #1e3a5f; margin-bottom: 8px; font-size: 20px; }
          h4 { font-size: 14px; margin: 16px 0 6px; font-weight: 600; color: #1e3a5f; }
          p, li { font-size: 13px; line-height: 1.8; color: #444; }
          ul { padding-right: 20px; margin: 8px 0; }
          .section { margin-bottom: 16px; padding: 14px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fafbfc; }
          .header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #1e3a5f; }
          .footer { text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          ${planHtml}
          <div class="footer">
            تم إرسال هذه الخطة من نظام أُفُق - منصة المتابعة التربوية
          </div>
        </div>
      </body>
      </html>
    `;

    // Return the formatted email data for client-side mailto
    // Since we don't have an external SMTP service configured,
    // we provide the HTML content and a mailto link
    const plainText = planHtml.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    const truncatedText = plainText.substring(0, 1500);

    return new Response(JSON.stringify({
      success: true,
      emailHtml,
      mailtoLink: `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(truncatedText)}`,
      to,
      subject,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in send-plan-email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
