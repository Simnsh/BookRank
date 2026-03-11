import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Books from "@/components/books";
import LogoutButton from "@/components/logout-button";
import { Button } from "@/components/ui/button";

type Book = {
  id: string;
  title: string;
  author: string;
  category: string | null;
  rank: number;
  status: "ACTIVE" | "COMPLETED";
  completed_at: string | null;
};

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let activeBooks: Book[] = [];
  let completedBooks: Book[] = [];

  if (user) {
    const { data: activeData, error: activeError } = await supabase
      .from("books")
      .select("id, title, author, category, rank, status, completed_at")
      .eq("status", "ACTIVE")
      .order("rank", { ascending: true });

    const { data: completedData, error: completedError } = await supabase
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

    activeBooks = activeData ?? [];
    completedBooks = completedData ?? [];
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

            {user ? (
              <LogoutButton />
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/signup">Sign up</Link>
                </Button>
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Rank your books. Finish one at a time.
          </p>

          {!user ? (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-medium">Guest mode is active</p>
                  <CardDescription className="text-xs text-amber-900">
                    Try adding, ranking, and completing books now. Your list
                    will disappear when you leave unless you create an account.
                  </CardDescription>
                </div>

                <Button asChild size="sm">
                  <Link href="/signup">Save my list</Link>
                </Button>
              </div>
            </div>
          ) : null}
        </CardHeader>

        <CardContent className="space-y-6">
          <Books
            activeBooks={activeBooks}
            completedBooks={completedBooks}
            isGuest={!user}
          />
        </CardContent>
      </Card>
    </main>
  );
}
