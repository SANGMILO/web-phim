'use client';

import { Trash2 } from 'lucide-react';
import { deleteMovie } from './actions';

export function DeleteMovieButton({ id, title }: { id: string; title: string }) {
  return (
    <form
      action={deleteMovie}
      onSubmit={(event) => {
        if (!window.confirm(`Xóa “${title}”? Thao tác này không thể hoàn tác.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="btn btn-ghost" type="submit" style={{ color: 'var(--accent-crimson)' }}>
        <Trash2 size={14} /> Xóa
      </button>
    </form>
  );
}

