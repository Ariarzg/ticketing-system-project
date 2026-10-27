import type { Metadata } from 'next';
import { t } from '@/lib/strings.fa';

// Only sets the browser tab title; the pages themselves are client components and cannot export metadata.
export const metadata: Metadata = { title: t.organizations.title };

export default function OrganizationsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
