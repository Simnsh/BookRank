"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function BookStagePage() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");

  function handleAddBook() {
    // MVP placeholder: later this becomes a Server Action that saves to Supabase
    console.log({ title, author, category });

    // reset
    setTitle("");
    setAuthor("");
    setCategory("");
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
          <div className="flex items-center gap-3 rounded-md border p-3">
            <div className="text-sm font-semibold w-8 text-center">1</div>
            <div className="flex-1">
              <div className="font-medium">Atomic Habits</div>
              <div className="text-sm text-muted-foreground">James Clear</div>
            </div>
            <Checkbox />
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full">Add a book</Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a book</DialogTitle>
                <DialogDescription>
                  Add a new book to the bottom of your ranked list.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g. The Psychology of Money"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="author">Author</Label>
                  <Input
                    id="author"
                    placeholder="e.g. Morgan Housel"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category (optional)</Label>
                  <Input
                    id="category"
                    placeholder="e.g. Investing"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={handleAddBook}
                  disabled={!title.trim() || !author.trim()}
                >
                  Add
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </main>
  );
}
