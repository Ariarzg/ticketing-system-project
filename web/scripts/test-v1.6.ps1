# v1.6: hand tests for agent and organization pages. Run from web\ while `bun run dev` is running.
$h = "http://localhost:3000"
$json = "application/json; charset=utf-8"
$stamp = Get-Date -Format "MMddHHmmss"

function Check($label) { Write-Host "`n== $label" -ForegroundColor Cyan }

# Runs one API call and prints only its status code (the body is not needed).
function Code([scriptblock]$call) {
  try { & $call | Out-Null; "200" }
  catch { [int]$_.Exception.Response.StatusCode }
}
function Login($email, $password) {
  Invoke-RestMethod -Uri "$h/api/auth/login" -Method Post -Body (@{ email = $email; password = $password } | ConvertTo-Json) -ContentType $json -SessionVariable s | Out-Null
  $s
}
function New-Client($name, $email, $orgId) {
  $body = @{ name = $name; email = $email; password = "Passw0rd!"; organizationId = $orgId } | ConvertTo-Json
  Invoke-RestMethod -Uri "$h/api/auth/signup" -Method Post -Body $body -ContentType $json -SessionVariable s | Out-Null
  $s
}
function Me($session) { (Invoke-RestMethod -Uri "$h/api/auth/me" -WebSession $session).user }
function New-Ticket($session, $title) {
  (Invoke-RestMethod -Uri "$h/api/tickets" -Method Post -Body (@{ title = $title; description = "Created by the v1.6 test script" } | ConvertTo-Json) -ContentType $json -WebSession $session).id
}
function Assign($ticketId, $agentId) {
  Invoke-RestMethod -Uri "$h/api/tickets/$ticketId/assign" -Method Post -Body (@{ agentId = $agentId; priority = "medium" } | ConvertTo-Json) -ContentType $json -WebSession $sup | Out-Null
}

# --- Setup: a new organization with two clients; two agents; four tickets ---
$sup = Login "supervisor@ticketing.com" "Supervisor@1234"
$org = (Invoke-RestMethod -Uri "$h/api/organizations" -Method Post -Body (@{ name = "Org $stamp" } | ConvertTo-Json) -ContentType $json -WebSession $sup).organization.id
$cliA = New-Client "Client A $stamp" "org-a-$stamp@example.com" $org
$cliB = New-Client "Client B $stamp" "org-b-$stamp@example.com" $org
$agt1 = New-Client "Agent One $stamp" "agent-one-$stamp@example.com" $org
$agt2 = New-Client "Agent Two $stamp" "agent-two-$stamp@example.com" $org
$a1 = Me $agt1; $a2 = Me $agt2
Invoke-RestMethod -Uri "$h/api/users/$($a1.slug)/promote" -Method Post -WebSession $sup | Out-Null
Invoke-RestMethod -Uri "$h/api/users/$($a2.slug)/promote" -Method Post -WebSession $sup | Out-Null
$t1 = New-Ticket $cliA "First $stamp"
$t2 = New-Ticket $cliA "Second $stamp"
$t3 = New-Ticket $cliB "Third $stamp"
$t4 = New-Ticket $cliB "Fourth $stamp"
Assign $t1 $a1.id; Assign $t2 $a1.id; Assign $t3 $a2.id
Invoke-RestMethod -Uri "$h/api/tickets/$t1/status" -Method Patch -Body (@{ status = "closed" } | ConvertTo-Json) -ContentType $json -WebSession $sup | Out-Null

Check "1. The agents list counts each agent's tickets: Agent One (expect: 1 active, 1 closed), Agent Two (expect: 1 active, 0 closed)"
$agents = (Invoke-RestMethod -Uri "$h/api/agents?q=$stamp" -WebSession $sup).items
$agents | ForEach-Object { "$($_.name): $($_.activeTickets) active, $($_.closedTickets) closed" }

Check "2. Agent One's profile as the supervisor lists the assigned tickets (expect: total 2, closed 1, 2 tickets, the active one first: Second)"
$p = Invoke-RestMethod -Uri "$h/api/users/$($a1.slug)" -WebSession $sup
"total $($p.stats.total), closed $($p.stats.closed), $(@($p.tickets).Count) tickets, first: $($p.tickets[0].title -replace ' \d+$', '')"

Check "3. Agent One sees the same on their own profile (expect: 2), but not Agent Two's profile (expect: 404); a client cannot open it (expect: 404)"
@((Invoke-RestMethod -Uri "$h/api/users/$($a1.slug)" -WebSession $agt1).tickets).Count
Code { Invoke-RestMethod -Uri "$h/api/users/$($a2.slug)" -WebSession $agt1 }
Code { Invoke-RestMethod -Uri "$h/api/users/$($a1.slug)" -WebSession $cliA }

Check "4. The organization's page: its active tickets, not the closed one (expect: 3 tickets: Fourth, Second, Third, sorted here) and its users, the two clients only, since agents move to the default organization (expect: 2 users: client, client)"
$o = Invoke-RestMethod -Uri "$h/api/organizations/$org" -WebSession $sup
"$($o.organization.name -replace ' \d+$', '') | $(@($o.tickets).Count) tickets: $((@($o.tickets) | ForEach-Object { $_.title -replace ' \d+$', '' } | Sort-Object) -join ', ')"
"$(@($o.users).Count) users: $((@($o.users) | ForEach-Object { $_.role }) -join ', ')"

Check "5. The default organization lists staff first (expect: supervisor, then agents)"
$def = ((Invoke-RestMethod -Uri "$h/api/organizations").items | Where-Object isDefault).id
((Invoke-RestMethod -Uri "$h/api/organizations/$def" -WebSession $sup).users | Select-Object -First 3 | ForEach-Object { $_.role }) -join ", "

Check "6. Only the supervisor opens an organization: an agent (expect: 403), a client (expect: 403), no session (expect: 401), an unknown id (expect: 404)"
Code { Invoke-RestMethod -Uri "$h/api/organizations/$org" -WebSession $agt1 }
Code { Invoke-RestMethod -Uri "$h/api/organizations/$org" -WebSession $cliA }
Code { Invoke-RestMethod -Uri "$h/api/organizations/$org" }
Code { Invoke-RestMethod -Uri "$h/api/organizations/00000000-0000-4000-8000-000000000000" -WebSession $sup }
