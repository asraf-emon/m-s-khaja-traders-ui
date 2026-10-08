'use client';

import { useParams } from 'next/navigation';
import { StaffProfile } from '@/features/staff-admin';

export default function Page() {
  const params = useParams<{ id: string }>();
  return <StaffProfile id={params.id} />;
}
