import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Books from "@/components/books";
import LogoutButton from "@/components/logout-button";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: activeBooks, error: activeError } = await supabase
    .from("books")
    .select("id, title, author, category, rank, status, completed_at")
    .eq("status", "ACTIVE")
    .order("rank", { ascending: true });

  const { data: completedBooks, error: completedError } = await supabase
    .from("books")
    .select("id, title, author, category, rank, status, completed_at")
    .eq("status", "COMPLETED")
    .order("completed_at", { ascending: false });

  if (activeError) {
    throw new Error(activeError.message);
  }

  if (completedError) {
    throw new Error(completedError.message);
  }

  return (
    <main className="min-h-screen p-6 flex items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>BookStack</CardTitle>
              <Badge variant="secondary">MVP</Badge>
            </div>

            <LogoutButton />
          </div>

          <p className="text-sm text-muted-foreground">
            Rank your books. Finish one at a time.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <Books
            activeBooks={activeBooks ?? []}
            completedBooks={completedBooks ?? []}
          />
        </CardContent>
      </Card>
    </main>
  );
}
