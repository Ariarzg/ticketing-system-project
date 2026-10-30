'use client';

import { useState } from 'react';
import { Button, TextArea } from '@heroui/react';
import {
	PencilSimpleIcon,
	ProhibitIcon,
	SealCheckIcon,
} from '@phosphor-icons/react';
import { LoadingButton } from '@/components/LoadingButton';
import { useReviewMessage, type MessageDto } from '@/lib/hooks/use-messages';
import { t } from '@/lib/strings.fa';

type Mode = 'buttons' | 'change' | 'deny';

/** Supervisor only: confirm, change or deny one agent reply that waits for review (D27). */
export function ReviewControls({
	ticketId,
	message,
}: {
	ticketId: string;
	message: MessageDto;
}) {
	const review = useReviewMessage(ticketId);
	const [mode, setMode] = useState<Mode>('buttons');
	const [text, setText] = useState('');
	const busy = review.isPending && review.variables?.messageId === message.id;

	function open(next: 'change' | 'deny') {
		setText(next === 'change' ? message.body : '');
		setMode(next);
	}

	function send() {
		const value = text.trim();
		if (!value || busy) return;
		review.mutate(
			mode === 'change' ?
				{ messageId: message.id, action: 'change', body: value }
			:	{ messageId: message.id, action: 'deny', note: value },
		);
	}

	if (mode === 'buttons') {
		return (
			<div className="flex flex-wrap gap-2">
				<LoadingButton
					size="sm"
					variant="primary"
					isPending={busy}
					icon={<SealCheckIcon size={16} />}
					onPress={() =>
						review.mutate({ messageId: message.id, action: 'confirm' })
					}
				>
					{t.review.confirm}
				</LoadingButton>
				<Button
					size="sm"
					variant="secondary"
					isDisabled={busy}
					onPress={() => open('change')}
				>
					<PencilSimpleIcon size={16} />
					{t.review.change}
				</Button>
				<Button
					size="sm"
					variant="danger-soft"
					isDisabled={busy}
					onPress={() => open('deny')}
				>
					<ProhibitIcon size={16} />
					{t.review.deny}
				</Button>
			</div>
		);
	}

	return (
		<form
			className="flex w-full min-w-64 flex-col gap-2"
			onSubmit={(e) => {
				e.preventDefault();
				send();
			}}
		>
			<TextArea
				aria-label={mode === 'change' ? t.review.changeLabel : t.review.denyLabel}
				// Empty, dir="auto" would turn the Persian placeholder left-to-right.
				dir={text ? 'auto' : 'rtl'}
				rows={3}
				fullWidth
				value={text}
				onChange={(e) => setText(e.target.value)}
				placeholder={mode === 'deny' ? t.review.denyPlaceholder : undefined}
			/>
			<div className="flex justify-end gap-2">
				<Button
					size="sm"
					variant="tertiary"
					isDisabled={busy}
					onPress={() => setMode('buttons')}
				>
					{t.common.cancel}
				</Button>
				<LoadingButton
					type="submit"
					size="sm"
					variant={mode === 'deny' ? 'danger' : 'primary'}
					isPending={busy}
					isDisabled={text.trim() === ''}
				>
					{mode === 'change' ? t.review.sendChanged : t.review.sendDeny}
				</LoadingButton>
			</div>
		</form>
	);
}
