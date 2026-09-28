import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle browser preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        error: "Method not allowed",
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }

  try {
    // --------------------------------------------------
    // 1. Validate environment variables
    // --------------------------------------------------
    if (
      !RESEND_API_KEY ||
      !SUPABASE_URL ||
      !SUPABASE_SERVICE_ROLE_KEY
    ) {
      console.error("Missing required environment variables");

      return new Response(
        JSON.stringify({
          error: "Server configuration error",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // --------------------------------------------------
    // 2. Read and validate request
    // --------------------------------------------------
    const { email, language = "en" } = await req.json();

    if (
      !email ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return new Response(
        JSON.stringify({
          error: "Invalid email address",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const isArabic = language === "ar";

    // --------------------------------------------------
    // 3. Prepare MIHZAM confirmation email
    // --------------------------------------------------
    const subject = isArabic
      ? "مِحْزَم | تم تسجيل طلبك للوصول المبكر"
      : "MIHZAM | Early Access Request Received";

    const html = isArabic
      ? `
      <div
        dir="rtl"
        style="
          font-family: Arial, sans-serif;
          max-width: 640px;
          margin: auto;
          padding: 36px;
          color: #181818;
          line-height: 1.9;
          text-align: right;
        "
      >
        <h2 style="margin-bottom: 28px;">
          مِحْزَم
        </h2>

        <p>مرحبًا،</p>

        <p>
          نشكرك على اهتمامك بـ <strong>مِحْزَم</strong>.
        </p>

        <p>
          تم تسجيل طلبك بنجاح للانضمام إلى قائمة الوصول المبكر.
        </p>

        <p>
          نعمل في مِحْزَم على تطوير تجربة لدعم القرار الاستثماري،
          تساعد المستثمر على قراءة بيانات السوق بصورة أكثر وضوحًا،
          وفهم المخاطر بصورة أعمق، وتحويل البيانات إلى معلومات منظمة
          تدعم قرارات أكثر وعيًا وانضباطًا.
        </p>

        <p>
          فلسفتنا بسيطة: لا نريد أن نضيف مزيدًا من البيانات أمام المستثمر،
          بل نريد أن نجعل البيانات الموجودة أكثر قابلية للفهم والاستخدام
          عند بناء القرار.
        </p>

        <p>
          سيبقى القرار الاستثماري النهائي بيد المستثمر،
          بينما يعمل  مِحْزَم على دعم جودة عملية اتخاذ القرار
          وفهم المخاطر المحيطة به.
        </p>

        <p>
          سيتم التواصل معك عند بدء المرحلة التالية من الوصول المبكر،
          وسنوافيك بأي تحديثات مهمة حول الإطلاق.
        </p>

        <p style="margin-top: 32px;">
          شكرًا لثقتك واهتمامك بـ  مِحْزَم.
        </p>

        <p>
          فريق  مِحْزَم
        </p>

        <hr
          style="
            border: none;
            border-top: 1px solid #e5e5e5;
            margin: 32px 0 20px;
          "
        />

        <p
          style="
            font-size: 12px;
            color: #777;
            line-height: 1.7;
          "
        >
           مِحْزَم منصة لدعم جودة القرار وفهم المخاطر،
          ولا تتخذ القرار الاستثماري نيابة عن المستخدم.
        </p>
      </div>
      `
      : `
      <div
        style="
          font-family: Arial, sans-serif;
          max-width: 640px;
          margin: auto;
          padding: 36px;
          color: #181818;
          line-height: 1.8;
        "
      >
        <h2 style="margin-bottom: 28px;">
          MIHZAM
        </h2>

        <p>Hello,</p>

        <p>
          Thank you for your interest in <strong>MIHZAM</strong>.
        </p>

        <p>
          Your request to join the MIHZAM early access list
          has been successfully registered.
        </p>

        <p>
          We are building an investment decision-support experience
          designed to help investors read market data more clearly,
          understand risk more deeply, and transform market information
          into structured insights that support more informed and
          disciplined decisions.
        </p>

        <p>
          Our philosophy is simple: rather than adding more data,
          MIHZAM aims to make existing information easier to understand
          and more useful throughout the decision-making process.
        </p>

        <p>
          The final investment decision always remains with the investor,
          while MIHZAM supports the quality of the decision process
          and the understanding of the risks surrounding it.
        </p>

        <p>
          We will contact you when the next stage of early access begins
          and keep you informed of important launch updates.
        </p>

        <p style="margin-top: 32px;">
          Thank you for your trust and interest in MIHZAM.
        </p>

        <p>
          MIHZAM Team
        </p>

        <hr
          style="
            border: none;
            border-top: 1px solid #e5e5e5;
            margin: 32px 0 20px;
          "
        />

        <p
          style="
            font-size: 12px;
            color: #777;
            line-height: 1.7;
          "
        >
          MIHZAM supports decision quality and risk understanding.
          It does not make investment decisions on behalf of the user.
        </p>
      </div>
      `;

    // --------------------------------------------------
    // 4. Send email through Resend
    // --------------------------------------------------
    const resendResponse = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "MIHZAM <info@mihzam.com>",
          to: [cleanEmail],
          subject,
          html,
        }),
      },
    );

    const resendData = await resendResponse.json();

    // --------------------------------------------------
    // 5. Handle Resend failure
    // --------------------------------------------------
    if (!resendResponse.ok) {
      console.error("Resend error:", resendData);

      return new Response(
        JSON.stringify({
          error: "Unable to send confirmation email",
          details: resendData,
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }
        // --------------------------------------------------
    // 6. Send MIHZAM admin notification
    // --------------------------------------------------
    try {
      const adminResponse = await fetch(
        "https://api.resend.com/emails",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "MIHZAM <info@mihzam.com>",
            to: ["info@mihzam.com", "murdi1@gmail.com"],
            subject: "🔔 New MIHZAM Early Access Signup",
            html: `
              <h2>New Early Access Signup</h2>
              <p><strong>Email:</strong> ${cleanEmail}</p>
              <p><strong>Language:</strong> ${language}</p>
              <p><strong>Source:</strong> MIHZAM Website</p>
            `,
          }),
        },
      );

      if (!adminResponse.ok) {
        const adminError = await adminResponse.json();
        console.error("Admin notification error:", adminError);
      }
    } catch (adminError) {
      console.error("Admin notification failed:", adminError);
    }


    // --------------------------------------------------
    // 7. Update subscriber record
    // --------------------------------------------------
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
    );

    const { error: updateError } = await supabaseAdmin
      .from("early_access")
      .update({
        status: "sent",
        last_email_sent_at: new Date().toISOString(),
      })
      .eq("email", cleanEmail);

    if (updateError) {
      console.error(
        "Email sent, but subscriber status update failed:",
        updateError,
      );

      return new Response(
        JSON.stringify({
          success: true,
          warning: "Email sent but database status update failed",
          email: cleanEmail,
          resend_id: resendData?.id ?? null,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // --------------------------------------------------
    // 8. Success
    // --------------------------------------------------
    return new Response(
      JSON.stringify({
        success: true,
        message: "Confirmation email sent",
        email: cleanEmail,
        status: "sent",
        resend_id: resendData?.id ?? null,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Function error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});