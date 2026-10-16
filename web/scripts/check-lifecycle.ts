import assert from "node:assert/strict";
import type { Role, Status } from "../src/lib/constants";
import { transition, TransitionError, type TicketAction } from "../src/lib/lifecycle";

type Case = [Status, TicketAction, Role, Status | "ticket_closed" | "forbidden" | "invalid_transition"];

const reply: TicketAction = { type: "reply" };
const set = (to: Status): TicketAction => ({ type: "set_status", to });

const cases: Case[] = [
  ["open", reply, "agent", "answered"],
  ["in_progress", reply, "agent", "answered"],
  ["answered", reply, "agent", "answered"],
  ["open", reply, "client", "in_progress"],
  ["answered", reply, "client", "in_progress"],
  ["in_progress", reply, "client", "in_progress"],
  ["open", set("in_progress"), "agent", "in_progress"],
  ["answered", set("in_progress"), "agent", "in_progress"],
  ["in_progress", set("answered"), "agent", "answered"],
  ["open", set("closed"), "agent", "closed"],
  ["answered", set("closed"), "agent", "closed"],
  ["open", set("closed"), "client", "forbidden"],
  ["answered", set("in_progress"), "client", "forbidden"],
  ["in_progress", set("in_progress"), "agent", "invalid_transition"],
  ["in_progress", set("open"), "agent", "invalid_transition"],
  ["closed", reply, "agent", "ticket_closed"],
  ["closed", reply, "client", "ticket_closed"],
  ["closed", set("in_progress"), "agent", "ticket_closed"],
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
