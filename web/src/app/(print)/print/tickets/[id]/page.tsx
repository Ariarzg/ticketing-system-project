'use client';

import { useParams } from 'next/navigation';
import { PrintSheet, ReportSections } from '@/components/PrintSheet';
import { isStaff, type Role } from '@/lib/constants';
import { formatDate } from '@/lib/dates';
import { formatSize, isImage, type AttachmentDto } from '@/lib/files';
import { useMe } from '@/lib/hooks/use-me';
import { useMessages, type MessageReview } from '@/lib/hooks/use-messages';
import { useOrganizationName } from '@/lib/hooks/use-organizations';
import { useTicket } from '@/lib/hooks/use-tickets';
import { useAgents } from '@/lib/hooks/use-users';
import { ticketRef } from '@/lib/reports';
import { t } from '@/lib/strings.fa';

/**
 * One ticket to print or save as PDF (D30): its details, then the description and every message, with
 * pictures in full. It shows what the viewer sees on the ticket page: a client only delivered replies (D27).
 */
export default function TicketReportPage() {
	const { id } = useParams<{ id: string }>();
	const { data: me } = useMe();
	const { data: ticket, error } = useTicket(id);
	const { data: messages, error: messagesError } = useMessages(id);
	const organization = useOrganizationName(ticket?.organizationId ?? '');
	const { data: agents } = useAgents('', me?.role === 'supervisor');

	const staff = me ? isStaff(me.role) : false;
	// The agent's name: the supervisor reads it from the agents list, an agent only ever sees their own tickets.
	const agentName =
		!ticket?.assigneeId ? t.exports.unassigned
		: ticket.assigneeId === me?.id ? me.name
		: agents?.find((a) => a.id === ticket.assigneeId)?.name;
	const ready = !!(
		me &&
		ticket &&
		messages &&
		organization !== undefined &&
		(!staff || agentName)
	);

	return (
		<PrintSheet
			kind={t.exports.ticketTitle}
			title={ticket?.title}
			ready={ready}
			failed={!!(error || messagesError)}
		>
			{ready && ticket && messages && (
				<>
					<ReportSections
						sections={[
							{
								title: t.exports.details,
								pairs: [
									[t.exports.ref, ticketRef(ticket.id)],
									[t.exports.status, t.status[ticket.status]],
									...(staff ?
										([
											[
												t.exports.priority,
												ticket.priority ?
													t.priority[ticket.priority]
												:	t.priority.unset,
											],
											[t.exports.agent, agentName ?? ''],
										] as [string, string][])
									:	[]),
									[t.exports.organization, organization ?? ''],
									[t.exports.author, ticket.authorName],
									[t.exports.created, formatDate(ticket.createdAt)],
									[t.exports.updated, formatDate(ticket.updatedAt)],
								],
							},
						]}
					/>

					<section className="mt-8">
						<h2 className="mb-2 text-base font-bold">{t.exports.description}</h2>
						<PrintMessage
							author={ticket.authorName}
							role="client"
							createdAt={ticket.createdAt}
							body={ticket.description}
							files={ticket.attachments}
						/>
					</section>

					<section className="mt-8">
						<h2 className="mb-2 text-base font-bold">{t.exports.messages}</h2>
						{messages.length === 0 ?
							<p className="text-sm text-neutral-600">{t.exports.noMessages}</p>
						:	messages.map((m) => (
								<PrintMessage
									key={m.id}
									author={m.authorName}
									role={m.authorRole}
									createdAt={m.createdAt}
									body={m.body}
									files={m.attachments}
								>
									{/* Clients get review: null, so this is staff only. */}
									{m.review && <ReviewLines review={m.review} />}
								</PrintMessage>
							))
						}
					</section>
				</>
			)}
		</PrintSheet>
	);
}

function PrintMessage({
	author,
	role,
	createdAt,
	body,
	files,
	children,
}: {
	author: string;
	role: Role;
	createdAt: string;
	body: string;
	files: AttachmentDto[];
	children?: React.ReactNode;
}) {
	const images = files.filter((f) => isImage(f.type));
	const others = files.filter((f) => !isImage(f.type));
	return (
		<article className="border-b border-neutral-200 py-3">
			<p className="text-xs text-neutral-600">
				<span
					dir="auto"
					className="font-bold text-neutral-900"
				>
					{author}
				</span>
				{' · '}
				{t.role[role]} · {formatDate(createdAt)}
			</p>
			{body && (
				<p
					dir="auto"
					className="mt-1.5 text-right text-sm leading-relaxed whitespace-pre-wrap break-words"
				>
					{body}
				</p>
			)}
			{images.map((f) => (
				<figure
					key={f.id}
					className="mt-2 break-inside-avoid"
				>
					{/* A plain img: next/image cannot fetch a file that sits behind our login. */}
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={`/api/attachments/${f.id}`}
						alt={f.name}
						className="max-h-[120mm] max-w-full rounded border border-neutral-300"
					/>
					<figcaption className="mt-1 text-xs text-neutral-500">
						<bdi>{f.name}</bdi>
					</figcaption>
				</figure>
			))}
			{others.length > 0 && (
				<ul className="mt-2 text-xs text-neutral-600">
					{others.map((f) => (
						<li key={f.id}>
							{t.files.attach}: <bdi>{f.name}</bdi> ({formatSize(f.size)})
						</li>
					))}
				</ul>
			)}
			{children}
		</article>
	);
}

/** What the supervisor did with an agent's reply, as on the ticket page (D27). */
function ReviewLines({ review }: { review: MessageReview }) {
	const line = 'mt-1.5 text-xs text-neutral-600';
	if (review.status === 'pending') return <p className={line}>{t.review.pending}</p>;
	if (review.status === 'confirmed') return <p className={line}>{t.review.confirmed}</p>;
	const changed = review.status === 'changed';
	return (
		<div className="mt-2 border-s-2 border-neutral-400 ps-3">
			<p className="text-xs text-neutral-600">
				{changed ? t.review.changed : t.review.denied}
			</p>
			<p
				dir="auto"
				className="mt-1 text-right text-sm whitespace-pre-wrap break-words"
			>
				{changed ? review.editedBody : `${t.review.denyNote}: ${review.note}`}
			</p>
		</div>
	);
}
