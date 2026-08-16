import type { Metadata } from 'next';
import ClaimsManagementForClaimManager from '@/components/claims-manager/ClaimsManagerDashboard';

export const metadata: Metadata = {
  title: 'Dashboard | Shurokkha',
  description: 'Welcome to your insurance management dashboard',
};

export default function ClaimManagementPage() {
  return (
    <ClaimsManagementForClaimManager />
  );
}
