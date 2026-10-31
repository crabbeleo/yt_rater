import { createClient } from "@/lib/supabase/server";

export const instant = false;

export default async function TestDb() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("videos").select("*");

  return (
    <pre className="p-8">
      {error ? `Error: ${error.message}` : `Connected. videos rows: ${data.length}`}
    </pre>
  );
}