import { useState } from 'react';
import { Button, Field } from './ui/index.js';
import MediaPicker from './MediaPicker.jsx';

/**
 * Default sidebar field for a post's featured image. Stores the picked URL
 * under `meta.image` in front matter. Reuses the existing MediaPicker (own
 * `open` state — modals don't conflict with the in-editor picker since only
 * one is mounted-and-open at a time).
 *
 * Empty value = no image. Calling `onChange('')` from the parent should
 * remove the key from the meta payload entirely (not write `image: ""`).
 */
export default function FeaturedImageField({ value, onChange, pagePath }) {
  const [open, setOpen] = useState(false);

  return (
    <Field label="Featured image">
      {value ? (
        <div className="space-y-2">
          <img
            src={value}
            alt=""
            className="w-full rounded-md border border-zinc-200 object-cover"
          />
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="btn-sm"
              onClick={() => setOpen(true)}
            >
              Replace
            </Button>
            <Button
              variant="ghost"
              className="btn-sm"
              onClick={() => onChange('')}
            >
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="secondary"
          className="btn-sm"
          onClick={() => setOpen(true)}
        >
          Pick image
        </Button>
      )}

      <MediaPicker
        open={open}
        onClose={() => setOpen(false)}
        pagePath={pagePath}
        onPick={(url) => {
          onChange(url);
          setOpen(false);
        }}
      />
    </Field>
  );
}
