'use client';

import React from 'react';
import { MovieForm } from '@/components/admin/MovieForm';

export default function NewMoviePage() {
  return <MovieForm isEdit={false} />;
}
