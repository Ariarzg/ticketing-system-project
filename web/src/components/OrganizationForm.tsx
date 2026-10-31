'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, FieldError, Input, Label, TextField } from '@heroui/react';
import { LoadingButton } from '@/components/LoadingButton';
import { t } from '@/lib/strings.fa';

/** The name field and its buttons, for adding and renaming an organization. */
export function OrganizationForm({
	initialName = '',
	submitLabel,
	isPending,
	onSubmit,
	cancelHref = '/organizations',
}: {
	initialName?: string;
	submitLabel: string;
	isPending: boolean;
	onSubmit: (name: string) => void;
	/** Where "cancel" goes: back where the form was opened from. */
	cancelHref?: string;
}) {
	const router = useRouter();
	const [name, setName] = useState(initialName);

	return (
		<form
			className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-5 shadow-[var(--surface-shadow)] sm:p-6"
			onSubmit={(e) => {
				e.preventDefault();
				if (!isPending) onSubmit(name.trim());
			}}
		>
			{/* The same limits as organizationSchema in lib/validation/organizations.ts. */}
			<TextField
				fullWidth
				isRequired
				maxLength={100}
				validate={(v) =>
					v.trim().length < 2 ? t.organizations.nameTooShort : null
				}
				value={name}
				onChange={setName}
			>
				<Label>{t.organizations.name}</Label>
				{/* Empty, dir="auto" would turn the Persian placeholder left-to-right. */}
				<Input
					dir={name ? 'auto' : 'rtl'}
					placeholder={t.organizations.namePlaceholder}
				/>
				<FieldError />
			</TextField>
			<div className="flex items-center justify-end gap-2 border-t border-separator pt-5">
				<Button
					variant="tertiary"
					onPress={() => router.push(cancelHref)}
				>
					{t.common.cancel}
				</Button>
				<LoadingButton
					type="submit"
					variant="primary"
					isPending={isPending}
				>
					{submitLabel}
				</LoadingButton>
			</div>
		</form>
	);
}
