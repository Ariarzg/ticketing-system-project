# v1.3 Step 6: hand tests for assigning tickets. Run from web\ while `bun run dev` is running.
$h = "http://localhost:3000"
$json = "application/json; charset=utf-8"
$stamp = Get-Date -Format "MMddHHmmss"

function Check($label) { Write-Host "`n== $label" -ForegroundColor Cyan }

# Runs one API call. Prints "ok", or the status and error body instead of stopping the script.
function Try-Api([scriptblock]$call) {
  try { & $call | Out-Null; "ok" }
  catch {
    $res = $_.Exception.Response
    $body = $_.ErrorDetails.Message
    # Windows PowerShell 5.1 often leaves ErrorDetails empty; the body is still in the response stream.
    if (-not $body -and $res -and $res.GetResponseStream) {
      try { $s = $res.GetResponseStream(); $s.Position = 0; $body = (New-Object System.IO.StreamReader($s)).ReadToEnd() } catch {}
    }
    "$([int]$res.StatusCode) $body"
  }
}

function Login($email, $password) {
  Invoke-RestMethod -Uri "$h/api/auth/login" -Method Post -Body (@{ email = $email; password = $password } | ConvertTo-Json) -ContentType $json -SessionVariable s | Out-Null
  $s
}

$defaultId = ((Invoke-RestMethod -Uri "$h/api/organizations").items | Where-Object isDefault).id
function New-Client($name, $email) {
  $body = @{ name = $name; email = $email; password = "Passw0rd!"; organizationId = $defaultId } | ConvertTo-Json
  Invoke-RestMethod -Uri "$h/api/auth/signup" -Method Post -Body $body -ContentType $json -SessionVariable s | Out-Null
  $s
}
function Me($session) { (Invoke-RestMethod -Uri "$h/api/auth/me" -WebSession $session).user }
function Ticket($id, $session) { (Invoke-RestMethod -Uri "$h/api/tickets/$id" -WebSession $session).ticket }
function Assign($id, $agentId, $priority, $session) {
  Try-Api { Invoke-RestMethod -Uri "$h/api/tickets/$id/assign" -Method Post -Body (@{ agentId = $agentId; priority = $priority } | ConvertTo-Json) -ContentType $json -WebSession $session }
}
function New-Ticket($title, $session) {
  $body = @{ title = $title; description = "Created by the v1.3 test script" } | ConvertTo-Json
  (Invoke-RestMethod -Uri "$h/api/tickets" -Method Post -Body $body -ContentType $json -WebSession $session).id
}

# --- Setup: supervisor, two clients, two agents (promoted while they have no tickets) ---
$sup = Login "supervisor@ticketing.com" "Supervisor@1234"
$ali = New-Client "Ali $stamp" "ali-$stamp@example.com"
$mar = New-Client "Maryam $stamp" "maryam-$stamp@example.com"
$agA = New-Client "Agent A $stamp" "agent-a-$stamp@example.com"
$agB = New-Client "Agent B $stamp" "agent-b-$stamp@example.com"
$agAMe = Me $agA; $agBMe = Me $agB; $aliMe = Me $ali; $marMe = Me $mar
Invoke-RestMethod -Uri "$h/api/users/$($agAMe.slug)/promote" -Method Post -WebSession $sup | Out-Null
Invoke-RestMethod -Uri "$h/api/users/$($agBMe.slug)/promote" -Method Post -WebSession $sup | Out-Null

Check "1. A client files a ticket with no priority (expect: two empty brackets, for the client and for the supervisor)"
$tid = New-Ticket "Cannot log in $stamp" $ali
"client sees priority: [$((Ticket $tid $ali).priority)]"
"supervisor sees priority: [$((Ticket $tid $sup).priority)]"
$marTid = New-Ticket "Refund request $stamp" $mar

Check "2. Before assigning: agent A cannot read it (expect: 404), the supervisor's 'Agents needed' list has it (expect: True)"
Try-Api { Invoke-RestMethod -Uri "$h/api/tickets/$tid" -WebSession $agA }
$needed = Invoke-RestMethod -Uri "$h/api/tickets?unassigned=1" -WebSession $sup
[bool]($needed.items | Where-Object id -eq $tid)
"unassignedCount: $($needed.unassignedCount)"

Check "3. The supervisor replies (expect: 403 forbidden)"
Try-Api { Invoke-RestMethod -Uri "$h/api/tickets/$tid/messages" -Method Post -Body (@{ body = "Supervisor reply" } | ConvertTo-Json) -ContentType $json -WebSession $sup }

Check "4. A client assigns (expect: 403), an agent assigns (expect: 403), a client chosen as agent (expect: 400 invalid_input)"
Assign $tid $agAMe.id "high" $ali
Assign $tid $agAMe.id "high" $agA
Assign $tid $marMe.id "high" $sup

Check "5. The supervisor assigns agent A with high priority (expect: ok), then again (expect: 409 already_assigned)"
Assign $tid $agAMe.id "high" $sup
Assign $tid $agBMe.id "low" $sup

Check "6. Agent A reads it (expect: high), agent B cannot read it or change its status (expect: 404 twice)"
(Ticket $tid $agA).priority
Try-Api { Invoke-RestMethod -Uri "$h/api/tickets/$tid" -WebSession $agB }
Try-Api { Invoke-RestMethod -Uri "$h/api/tickets/$tid/status" -Method Patch -Body (@{ status = "closed" } | ConvertTo-Json) -ContentType $json -WebSession $agB }

Check "7. The client still sees no priority and no agent (expect: two empty brackets)"
$seen = Ticket $tid $ali
"priority: [$($seen.priority)] assignee: [$($seen.assigneeId)]"

Check "8. Agent A replies (expect: answered), the client replies (expect: in_progress)"
Invoke-RestMethod -Uri "$h/api/tickets/$tid/messages" -Method Post -Body (@{ body = "Agent A reply" } | ConvertTo-Json) -ContentType $json -WebSession $agA | Out-Null
(Ticket $tid $sup).status
Invoke-RestMethod -Uri "$h/api/tickets/$tid/messages" -Method Post -Body (@{ body = "Client reply" } | ConvertTo-Json) -ContentType $json -WebSession $ali | Out-Null
(Ticket $tid $sup).status

Check "9. The supervisor still changes status (expect: ok, then answered)"
Try-Api { Invoke-RestMethod -Uri "$h/api/tickets/$tid/status" -Method Patch -Body (@{ status = "answered" } | ConvertTo-Json) -ContentType $json -WebSession $sup }
(Ticket $tid $sup).status

Check "10. A client's priority filter is ignored (expect: True: same count with and without it)"
$all = (Invoke-RestMethod -Uri "$h/api/tickets" -WebSession $ali).total
$low = (Invoke-RestMethod -Uri "$h/api/tickets?priority=low" -WebSession $ali).total
$all -eq $low

Check "11. Agent lists: A's tickets are only Ali's (expect: True), B has none (expect: 0)"
$aList = (Invoke-RestMethod -Uri "$h/api/tickets" -WebSession $agA).items
[bool](@($aList).Count -ge 1 -and -not ($aList | Where-Object id -eq $marTid))
(Invoke-RestMethod -Uri "$h/api/tickets" -WebSession $agB).total

Check "12. Agent users: A's list has Ali but not Maryam (expect: True False), A opens Maryam's profile (expect: 404), Ali's (expect: 1 ticket)"
$aUsers = (Invoke-RestMethod -Uri "$h/api/users" -WebSession $agA).items
[bool]($aUsers | Where-Object slug -eq $aliMe.slug)
[bool]($aUsers | Where-Object slug -eq $marMe.slug)
Try-Api { Invoke-RestMethod -Uri "$h/api/users/$($marMe.slug)" -WebSession $agA }
(Invoke-RestMethod -Uri "$h/api/users/$($aliMe.slug)" -WebSession $agA).stats.total

Check "13. The supervisor closes Maryam's unassigned ticket: it leaves 'Agents needed' (expect: False), and cannot be assigned (expect: 409 ticket_closed)"
Invoke-RestMethod -Uri "$h/api/tickets/$marTid/status" -Method Patch -Body (@{ status = "closed" } | ConvertTo-Json) -ContentType $json -WebSession $sup | Out-Null
[bool]((Invoke-RestMethod -Uri "$h/api/tickets?unassigned=1" -WebSession $sup).items | Where-Object id -eq $marTid)
Assign $marTid $agAMe.id "low" $sup
