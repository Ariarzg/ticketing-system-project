'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@heroui/react';
import { t } from '../strings.fa';
import { useMe } from './use-me';

/** True for the supervisor. Anyone else gets the "forbidden" toast and goes back to the tickets. */
export function useSupervisorOnly() {
	const router = useRouter();
	const { data: me } = useMe();
	// Strict Mode runs mount effects twice in dev; warn only once
	const warned = useRef(false);

	useEffect(() => {
		if (me && me.role !== 'supervisor' && !warned.current) {
			warned.current = true;
			toast.danger(t.errors.forbidden);
			router.replace('/tickets');
		}
	}, [me, router]);

	return me?.role === 'supervisor';
}
