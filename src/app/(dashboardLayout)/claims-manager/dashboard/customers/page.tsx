import type { Metadata } from 'next';
import ClaimsManagerDashboard from '@/components/claims-manager/ClaimsManagerDashboard';
import ClaimManagerOverview from '@/components/claims-manager/ClaimManagerOverview';
import ClaimManagerCustomerManagement from '@/components/customer/ClaimManagerCustomerManagement';

export const metadata: Metadata = {
  title: 'Dashboard | Shurokkha',
  description: 'Welcome to your insurance management dashboard',
};

export default function ClaimManagerCustomerManagementPage() {
  return (
    <ClaimManagerCustomerManagement />
  );
}