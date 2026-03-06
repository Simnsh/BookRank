import Books from "@/components/books";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: books, error } = await supabase
    .from("books")
    .select("id, title, author, category, rank, status")
    .eq("status", "ACTIVE")
    .order("rank", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="min-h-screen p-6 flex items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle>BookStack</CardTitle>
            <Badge variant="secondary">MVP</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Rank your books. Finish one at a time.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <Books books={books ?? []} />
        </CardContent>
      </Card>
    </main>
  );
}
