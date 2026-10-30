import assert from 'node:assert/strict';
import type { Role, Status } from '../src/lib/constants';
import {
	transition,
	TransitionError,
	type TicketAction,
} from '../src/lib/lifecycle';

type Case = [
	Status,
	TicketAction,
	Role,
	Status | 'ticket_closed' | 'forbidden' | 'invalid_transition',
];

const reply: TicketAction = { type: 'reply' };
const deliver: TicketAction = { type: 'deliver' };
const set = (to: Status): TicketAction => ({ type: 'set_status', to });

const cases: Case[] = [
	// An agent's reply waits for review and leaves the status alone (D27).
	['open', reply, 'agent', 'open'],
	['in_progress', reply, 'agent', 'in_progress'],
	['answered', reply, 'agent', 'answered'],
	['open', reply, 'client', 'in_progress'],
	['answered', reply, 'client', 'in_progress'],
	['in_progress', reply, 'client', 'in_progress'],
	['open', set('in_progress'), 'agent', 'in_progress'],
	['answered', set('in_progress'), 'agent', 'in_progress'],
	['in_progress', set('answered'), 'agent', 'answered'],
	['open', set('closed'), 'agent', 'closed'],
	['answered', set('closed'), 'agent', 'closed'],
	['open', set('closed'), 'client', 'forbidden'],
	['answered', set('in_progress'), 'client', 'forbidden'],
	['in_progress', set('in_progress'), 'agent', 'invalid_transition'],
	['in_progress', set('open'), 'agent', 'invalid_transition'],
	['closed', reply, 'agent', 'ticket_closed'],
	['closed', reply, 'client', 'ticket_closed'],
	['closed', set('in_progress'), 'agent', 'ticket_closed'],
	// The supervisor changes status like an agent but never replies (D23, D25).
	['open', reply, 'supervisor', 'forbidden'],
	['answered', set('in_progress'), 'supervisor', 'in_progress'],
	['open', set('closed'), 'supervisor', 'closed'],
	['closed', reply, 'supervisor', 'ticket_closed'],
	// Delivering a reviewed reply is what makes a ticket "answered" now (D1, D27).
	['open', deliver, 'supervisor', 'answered'],
	['in_progress', deliver, 'supervisor', 'answered'],
	['open', deliver, 'agent', 'forbidden'],
	['closed', deliver, 'supervisor', 'ticket_closed'],
];

for (const [status, action, role, expected] of cases) {
	let actual: string;
	try {
		actual = transition(status, action, role);
	} catch (e) {
		assert(e instanceof TransitionError);
		actual = e.code;
	}
	const label = `${status} + ${JSON.stringify(action)} by ${role}`;
	assert.equal(actual, expected, label);
	console.log(`ok  ${label} -> ${actual}`);
}
console.log(`\nAll ${cases.length} cases passed.`);
