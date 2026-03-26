import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `أنت مساعد تعليمي متخصص في الكيمياء 2 للمرحلة الثانوية باللغة العربية. تساعد الطلاب في فهم المفاهيم الكيميائية التالية:

الباب الأول - حالات المادة:
- نظرية الحركة الجزيئية للغازات وقانون جراهام
- ضغط الغاز ووحدات القياس
- قانون دالتون للضغوط الجزئية
- قوى التجاذب بين الجزيئات (لندن، ثنائية القطبية، الهيدروجينية)
- السوائل وخصائصها (اللزوجة، التوتر السطحي، الخاصية الشعرية)
- المواد الصلبة (بلورية وغير بلورية)
- تغيرات الحالة الفيزيائية ومخطط الحالة

الباب الثاني - الطاقة والتغيرات الكيميائية:
- الطاقة الحركية والكامنة ووحدات القياس
- الحرارة النوعية والمسعر (q = mcΔT)
- المحتوى الحراري والتفاعلات الطاردة والماصة
- المعادلات الكيميائية الحرارية
- قانون هس وحرارات التكوين القياسية

الباب الثالث - سرعة التفاعلات:
- سرعة التفاعل الكيميائي
- نظرية التصادم وطاقة التنشيط
- العوامل المؤثرة في سرعة التفاعل
- قوانين سرعة التفاعل (R = K[A]ⁿ[B]ᵐ)

الباب الرابع - الاتزان الكيميائي:
- مفهوم الاتزان الكيميائي
- ثابت الاتزان Keq وتعابيره
- مبدأ لوشاتلييه والعوامل المؤثرة
- حاصل الذائبية Ksp

أجب بشكل واضح ومبسط مع أمثلة عملية ومعادلات كيميائية. ركز على الحسابات والتطبيقات العملية.`,
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات، حاول لاحقاً" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يلزم إضافة رصيد" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "خطأ في الخدمة" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "خطأ غير معروف" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
