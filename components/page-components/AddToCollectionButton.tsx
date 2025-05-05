'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type AddToCollectionButtonProps = {
  chat_id: string | number;
  message_id: string | number;
};

const AddToCollectionButton = ({ chat_id, message_id }: AddToCollectionButtonProps) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const newErrors: typeof errors = {};
    if (!form.title.trim()) newErrors.title = 'Title is required.';
    if (!form.description.trim()) newErrors.description = 'Description is required.';
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/copilots/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, chat_id, message_id }),
      });

      const json = await res.json();
      console.log('Submitted:', json);

      setForm({ title: '', description: '' });
      setOpen(false);
    } catch (err) {
      console.error('API Error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button >Add to Collection</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add to Collection</DialogTitle>
          <DialogDescription>
            Provide a title and description to save this message to your collection.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Input
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
          </div>
          <div>
            <Textarea
              placeholder="Description"
              value={form.description}
              rows={4}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
          </div>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddToCollectionButton;
