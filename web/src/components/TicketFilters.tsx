"use client";

import { Tabs } from "@heroui/react";
import { DEPARTMENTS, PRIORITIES, STATUSES, type Status } from "@/lib/constants";
import { t } from "@/lib/strings.fa";
import { SearchBox } from "./SearchBox";
import { SelectField } from "./SelectField";

const priorityOptions = [
  { id: "all", label: t.filters.allPriorities },
  ...PRIORITIES.map((id) => ({ id, label: t.priority[id] })),
];
const departmentOptions = [
  { id: "all", label: t.filters.allDepartments },
  ...DEPARTMENTS.map((id) => ({ id, label: t.department[id] })),
];

export function TicketFilters({
  params,
  setParams,
  isAgent,
  statusCounts,
  attentionCount,
}: {
  params: URLSearchParams;
  /** Changes several URL parameters in one navigation. A null value removes the parameter. */
  setParams: (updates: Record<string, string | null>) => void;
  isAgent: boolean;
  /** Undefined while the list loads, so the tabs show no number instead of a false zero. */
  statusCounts?: Record<Status, number>;
  attentionCount?: number;
}) {
  const view = params.get("attention") === "1" ? "attention" : (params.get("status") ?? "all");
  const total = statusCounts ? STATUSES.reduce((sum, s) => sum + statusCounts[s], 0) : undefined;
  const pick = (key: string) => (value: string) => setParams({ [key]: value === "all" ? null : value });

  // The tabs set either ?status=... or ?attention=1, never both.
  function selectView(key: string) {
    setParams({
      attention: key === "attention" ? "1" : null,
      status: key === "attention" || key === "all" ? null : key,
    });
  }

  const tabs: { id: string; label: string; count?: number }[] = [
    ...(isAgent ? [{ id: "attention", label: t.filters.attention, count: attentionCount }] : []),
    { id: "all", label: t.filters.all, count: total },
    ...STATUSES.map((s) => ({ id: s, label: t.status[s], count: statusCounts?.[s] })),
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Six tabs do not fit a phone, and HeroUI's scroll arrows are labelled in English, so small screens get a select. */}
      <SelectField
        className="md:hidden"
        label={t.filters.viewLabel}
        hideLabel
        value={view}
        options={tabs.map((tab) => ({
          id: tab.id,
          label: tab.count === undefined ? tab.label : `${tab.label} (${tab.count.toLocaleString("fa-IR")})`,
        }))}
        onChange={selectView}
      />
      <Tabs className="hidden md:block" selectedKey={view} onSelectionChange={(key) => selectView(String(key))}>
        <Tabs.ListContainer className="overflow-x-auto">
          <Tabs.List aria-label={t.filters.viewLabel}>
            {tabs.map((tab) => (
              <Tabs.Tab key={tab.id} id={tab.id} className="whitespace-nowrap">
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ms-2 text-xs tabular-nums text-muted">{tab.count.toLocaleString("fa-IR")}</span>
                )}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>

      <div className="flex flex-wrap items-center gap-3">
        <SearchBox
          className="w-full sm:w-80"
          value={params.get("q") ?? ""}
          onChange={(v) => setParams({ q: v.trim() || null })}
          label={t.filters.search}
          placeholder={isAgent ? t.filters.searchAgentPlaceholder : t.filters.searchClientPlaceholder}
        />
        <SelectField
          hideLabel
          className="min-w-36 flex-1 sm:w-44 sm:flex-none"
          label={t.tickets.colPriority}
          value={params.get("priority") ?? "all"}
          options={priorityOptions}
          onChange={pick("priority")}
        />
        {isAgent && (
          <SelectField
            hideLabel
            className="min-w-36 flex-1 sm:w-44 sm:flex-none"
            label={t.tickets.colDepartment}
            value={params.get("department") ?? "all"}
            options={departmentOptions}
            onChange={pick("department")}
          />
        )}
      </div>
    </div>
  );
}
