import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Initialize Admin client with service role key
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  try {
    const { userId, newBalance } = await req.json();
    const { error } = await supabaseAdmin
      .from("user_profiles")
      .update({ cashavailable: newBalance })
      .eq("id", userId);
    if (error) {
      console.error("[updateUserBalance] Error:", error.message);
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("[updateUserBalance] Exception:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
