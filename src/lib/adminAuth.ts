import { supabaseAdmin } from "@/lib/supabase";

export async function verifyAdmin(req: Request): Promise<boolean> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);
  
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
        console.error("Admin Auth Error:", error?.message);
        return false;
    }
    return true;
  } catch (err) {
    console.error("Admin Auth Error:", err);
    return false;
  }
}
