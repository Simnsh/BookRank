"use client";

import { useEffect, useState } from "react";
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
import { TrashIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Book = {
  id: string;
  title: string;
  author: string;
  category: string | null;
  rank: number;
  status: "ACTIVE" | "COMPLETED";
  completed_at: string | null;
};

type BooksProps = {
  activeBooks: Book[];
  completedBooks: Book[];
};

type SortableBookItemProps = {
  book: Book;
  onComplete: (bookId: string, checked: boolean) => void;
};

function SortableBookItem({ book, onComplete }: SortableBookItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: book.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-md border p-3 bg-background ${
        isDragging ? "shadow-md opacity-80" : ""
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="text-sm font-semibold w-8 text-center cursor-grab active:cursor-grabbing"
        title="Drag to reorder"
      >
        {book.rank}
      </div>

      <div className="flex-1">
        <div className="font-medium">{book.title}</div>
        <div className="text-sm text-muted-foreground">{book.author}</div>
        {book.category && (
          <Badge variant="secondary" className="mt-1">
            {book.category}
          </Badge>
        )}
      </div>

      <Checkbox
        checked={false}
        onCheckedChange={() => onComplete(book.id, true)}
      />
    </div>
  );
}

export default function Books({ activeBooks, completedBooks }: BooksProps) {
  const router = useRouter();
  const supabase = createClient();

  const [localActiveBooks, setLocalActiveBooks] = useState<Book[]>(activeBooks);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setLocalActiveBooks(activeBooks);
  }, [activeBooks]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = localActiveBooks.findIndex(
      (book) => book.id === active.id,
    );
    const newIndex = localActiveBooks.findIndex((book) => book.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const previousBooks = localActiveBooks;
    const reorderedBooks = arrayMove(localActiveBooks, oldIndex, newIndex).map(
      (book, index) => ({
        ...book,
        rank: index + 1,
      }),
    );

    setLocalActiveBooks(reorderedBooks);

    // Step 1: move all active ranks temporarily out of the way
    for (let i = 0; i < reorderedBooks.length; i++) {
      const book = reorderedBooks[i];
      const { error } = await supabase
        .from("books")
        .update({ rank: 1000 + i })
        .eq("id", book.id);

      if (error) {
        setLocalActiveBooks(previousBooks);
        alert(error.message);
        return;
      }
    }

    // Step 2: assign final ranks 1..n
    for (let i = 0; i < reorderedBooks.length; i++) {
      const book = reorderedBooks[i];
      const { error } = await supabase
        .from("books")
        .update({ rank: i + 1 })
        .eq("id", book.id);

      if (error) {
        setLocalActiveBooks(previousBooks);
        alert(error.message);
        return;
      }
    }

    router.refresh();
  }

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
      localActiveBooks.length === 0
        ? 1
        : Math.max(...localActiveBooks.map((b) => b.rank)) + 1;

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

  async function handleComplete(bookId: string, checked: boolean) {
    if (checked) {
      const bookToComplete = localActiveBooks.find(
        (book) => book.id === bookId,
      );

      if (!bookToComplete) {
        alert("Book not found.");
        return;
      }

      const completedRank = bookToComplete.rank;

      const { error: completeError } = await supabase
        .from("books")
        .update({
          status: "COMPLETED",
          completed_at: new Date().toISOString(),
        })
        .eq("id", bookId);

      if (completeError) {
        alert(completeError.message);
        return;
      }

      const booksToShift = localActiveBooks.filter(
        (book) => book.rank > completedRank,
      );

      for (const book of booksToShift) {
        const { error: shiftError } = await supabase
          .from("books")
          .update({ rank: book.rank - 1 })
          .eq("id", book.id);

        if (shiftError) {
          alert(shiftError.message);
          return;
        }
      }
    } else {
      const restoredRank =
        localActiveBooks.length === 0
          ? 1
          : Math.max(...localActiveBooks.map((b) => b.rank)) + 1;

      const { error } = await supabase
        .from("books")
        .update({
          status: "ACTIVE",
          completed_at: null,
          rank: restoredRank,
        })
        .eq("id", bookId);

      if (error) {
        alert(error.message);
        return;
      }
    }

    router.refresh();
  }

  //   async function handleMoveUp(bookId: string) {
  //     const currentBook = localActiveBooks.find((book) => book.id === bookId);

  //     if (!currentBook || currentBook.rank === 1) {
  //       return;
  //     }

  //     const previousBook = localActiveBooks.find(
  //       (book) => book.rank === currentBook.rank - 1,
  //     );

  //     if (!previousBook) {
  //       return;
  //     }

  //     const { error: error1 } = await supabase
  //       .from("books")
  //       .update({ rank: -1 })
  //       .eq("id", currentBook.id);

  //     if (error1) {
  //       alert(error1.message);
  //       return;
  //     }

  //     const { error: error2 } = await supabase
  //       .from("books")
  //       .update({ rank: currentBook.rank })
  //       .eq("id", previousBook.id);

  //     if (error2) {
  //       alert(error2.message);
  //       return;
  //     }

  //     const { error: error3 } = await supabase
  //       .from("books")
  //       .update({ rank: currentBook.rank - 1 })
  //       .eq("id", currentBook.id);

  //     if (error3) {
  //       alert(error3.message);
  //       return;
  //     }

  //     router.refresh();
  //   }

  //   async function handleMoveDown(bookId: string) {
  //     const currentBook = localActiveBooks.find((book) => book.id === bookId);

  //     if (!currentBook || currentBook.rank === localActiveBooks.length) {
  //       return;
  //     }

  //     const nextBook = localActiveBooks.find(
  //       (book) => book.rank === currentBook.rank + 1,
  //     );

  //     if (!nextBook) {
  //       return;
  //     }

  //     const { error: error1 } = await supabase
  //       .from("books")
  //       .update({ rank: -1 })
  //       .eq("id", currentBook.id);

  //     if (error1) {
  //       alert(error1.message);
  //       return;
  //     }

  //     const { error: error2 } = await supabase
  //       .from("books")
  //       .update({ rank: currentBook.rank })
  //       .eq("id", nextBook.id);

  //     if (error2) {
  //       alert(error2.message);
  //       return;
  //     }

  //     const { error: error3 } = await supabase
  //       .from("books")
  //       .update({ rank: currentBook.rank + 1 })
  //       .eq("id", currentBook.id);

  //     if (error3) {
  //       alert(error3.message);
  //       return;
  //     }

  //     router.refresh();
  //   }

  async function handleDeleteBook(bookId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this book?",
    );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase.from("books").delete().eq("id", bookId);

    if (error) {
      alert(error.message);
      return;
    }

    router.refresh();
  }

  return (
    <>
      <div className="space-y-4">
        {localActiveBooks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active books yet. Add your first book.
          </p>
        ) : (
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localActiveBooks.map((book) => book.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {localActiveBooks.map((book) => (
                  <SortableBookItem
                    key={book.id}
                    book={book}
                    onComplete={handleComplete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

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
                  placeholder="e.g. The Psychology of Money"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label>Author</Label>
                <Input
                  placeholder="e.g. Morgan Housel"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label>Category</Label>
                <Input
                  placeholder="e.g. Investing"
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

      {/* ----------------- Completed Books ---------------------------*/}

      <div className="space-y-4 pt-4">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Completed
        </h2>

        {completedBooks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No completed books yet.
          </p>
        ) : (
          completedBooks.map((book) => (
            <div
              key={book.id}
              className="flex items-center gap-3 rounded-md border p-3 opacity-80"
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => handleDeleteBook(book.id)}
              >
                {/* 🗑️ */}
                <TrashIcon className="h-4 w-4" />
              </Button>

              <div className="flex-1">
                <div className="font-medium">{book.title}</div>

                <div className="text-sm text-muted-foreground">
                  {book.author}
                </div>

                {book.category && (
                  <Badge variant="secondary" className="mt-1">
                    {book.category}
                  </Badge>
                )}

                {book.completed_at && (
                  <div className="text-xs text-muted-foreground">
                    Completed{" "}
                    {new Date(book.completed_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                )}
              </div>

              <Checkbox
                checked={true}
                onCheckedChange={() => handleComplete(book.id, false)}
              />
            </div>
          ))
        )}
      </div>
    </>
  );
}
