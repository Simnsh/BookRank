"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Book = {
  id: string;
  title: string;
  author: string;
  category: string | null;
  rank: number;
};

export default function Books({ books }: { books: Book[] }) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  async function handleAddBook(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedAuthor = author.trim();
    const trimmedCategory = category.trim();

    if (!trimmedTitle || !trimmedAuthor) {
      alert("Title and author are required.");
      return;
    }

    const nextRank =
      books.length === 0 ? 1 : Math.max(...books.map((b) => b.rank)) + 1;

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("You must be logged in to add a book.");
      return;
    }

    const { error } = await supabase.from("books").insert({
      user_id: user.id,
      title: trimmedTitle,
      author: trimmedAuthor,
      category: trimmedCategory || null,
      rank: nextRank,
      status: "ACTIVE",
    });

    if (error) {
      alert(error.message);
      return;
    }

    setTitle("");
    setAuthor("");
    setCategory("");
    setIsOpen(false);

    router.refresh();
  }

  return (
    <>
      {books.map((book) => (
        <div
          key={book.id}
          className="flex items-center gap-3 rounded-md border p-3"
        >
          <div className="text-sm font-semibold w-8 text-center">
            {book.rank}
          </div>

          <div className="flex-1">
            <div className="font-medium">{book.title}</div>
            <div className="text-sm text-muted-foreground">{book.author}</div>
            {book.category && (
              <div className="text-xs text-muted-foreground">
                {book.category}
              </div>
            )}
          </div>

          <Checkbox />
        </div>
      ))}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="w-full">Add a book</Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a book</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddBook}>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label>Author</Label>
                <Input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label>Category</Label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="submit">Add</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
