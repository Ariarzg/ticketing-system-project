import { isStaff, type Role, type Status } from './constants';

export type TicketAction =
	| { type: 'reply' }
	| { type: 'set_status'; to: Status };

export type TransitionErrorCode =
	| 'ticket_closed'
	| 'forbidden'
	| 'invalid_transition';

export class TransitionError extends Error {
	constructor(public code: TransitionErrorCode) {
		super(code);
	}
}

/** Statuses staff (agents and supervisors) may set by hand. "open" is only the starting status. */
const STAFF_TARGETS: Status[] = ['in_progress', 'answered', 'closed'];

export function transition(
	current: Status,
	action: TicketAction,
	role: Role,
): Status {
	if (current === 'closed') throw new TransitionError('ticket_closed');

	if (action.type === 'reply') {
		// The supervisor assigns and supervises; only the client and the assigned agent write (D25).
		if (role === 'supervisor') throw new TransitionError('forbidden');
		return role === 'agent' ? 'answered' : 'in_progress';
	}

	if (!isStaff(role)) throw new TransitionError('forbidden');
	if (!STAFF_TARGETS.includes(action.to) || action.to === current) {
		throw new TransitionError('invalid_transition');
	}
	return action.to;
}
