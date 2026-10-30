// file: src/components/MessageBubble.tsx
import { Avatar } from '@heroui/react';
import { isStaff, type Role } from '@/lib/constants';
import { formatDate, formatRelative } from '@/lib/dates';
import type { AttachmentDto } from '@/lib/files';
import { initials } from '@/lib/initials';
import { t } from '@/lib/strings.fa';
import { Attachments } from './Attachments';

/** How a bubble is drawn. Only staff ever see anything but "default" (D27). */
export type BubbleTone = 'default' | 'muted' | 'warning' | 'danger';

/**
 * One message. The first bubble of every thread is the ticket description (D17).
 * dir="auto" lets each message align by its own language, so English inside a Persian page reads correctly.
 * `grouped` is a follow-up from the same author a few minutes later: no avatar or name line, and closer to the one before.
 */
export function MessageBubble({
	author,
	role,
	body,
	createdAt,
	mine,
	ourSide = mine,
	grouped = false,
	tone = 'default',
	footer,
	attachments = [],
}: {
	author: string;
	role?: Role;
	body: string;
	createdAt: string;
	/** Written by the viewer: drawn in the accent colour. */
	mine: boolean;
	/** On the viewer's side of the thread: staff on one side, the client on the other. */
	ourSide?: boolean;
	grouped?: boolean;
	tone?: BubbleTone;
	/** Shown under the bubble, also when it is grouped: the review mark and the supervisor's buttons. */
	footer?: React.ReactNode;
	/** Files sent with the message, shown under the text (D28). */
	attachments?: AttachmentDto[];
}) {
	const staff = role !== undefined && isStaff(role);
	const toneClass = {
		default:
			mine ?
				'bg-accent text-accent-foreground'
			:	'bg-surface-secondary text-foreground',
		// A dashed outline instead of fading: the text keeps its full contrast.
		muted: 'border border-dashed border-border bg-surface text-foreground',
		warning: 'bg-warning-soft text-warning-soft-foreground',
		danger: 'bg-danger-soft text-danger-soft-foreground',
	}[tone];
	return (
		<div
			className={`flex items-end gap-2.5 ${ourSide ? 'flex-row-reverse' : ''} ${grouped ? '-mt-3.5' : ''}`}
		>
			{grouped ?
				// Keeps the bubble lined up with the one above, where the avatar is.
				<span className="w-8 shrink-0" />
			:	<Avatar
					size="sm"
					color={staff ? 'accent' : 'default'}
					variant="soft"
					className="shrink-0"
				>
					<Avatar.Fallback>{initials(author)}</Avatar.Fallback>
				</Avatar>
			}
			<div
				className={`flex max-w-[82%] flex-col gap-1 ${ourSide ? 'items-end' : 'items-start'}`}
			>
				{!grouped && (
					<div className="flex items-center gap-2 px-1 text-xs text-muted">
						<span className="font-medium text-foreground">{author}</span>
						{/* `role &&` again so TypeScript knows role is set inside. */}
						{role && staff && (
							<span className="rounded-full bg-accent-soft px-1.5 leading-5 text-accent-soft-foreground">
								{t.role[role]}
							</span>
						)}
						<time
							dateTime={createdAt}
							title={formatDate(createdAt)}
						>
							{formatRelative(createdAt)}
						</time>
					</div>
				)}
				{/* A reply may be files only (D28). */}
				{body && (
					<p
						dir="auto"
						title={grouped ? formatDate(createdAt) : undefined}
						className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-base leading-relaxed ${toneClass}`}
					>
						{body}
					</p>
				)}
				<Attachments
					files={attachments}
					ourSide={ourSide}
				/>
				{footer && (
					<div
						className={`flex w-full flex-col gap-2 px-1 ${ourSide ? 'items-end' : 'items-start'}`}
					>
						{footer}
					</div>
				)}
			</div>
		</div>
	);
}
