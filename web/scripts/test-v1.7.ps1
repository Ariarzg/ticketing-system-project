# v1.7: hand tests for the exports. Run from web\ while `bun run dev` is running.
$h = "http://localhost:3000"
$json = "application/json; charset=utf-8"
$stamp = Get-Date -Format "MMddHHmmss"

function Check($label) { Write-Host "`n== $label" -ForegroundColor Cyan }

# Runs one API call and prints only its status code.
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
  (Invoke-RestMethod -Uri "$h/api/tickets" -Method Post -Body (@{ title = $title; description = "Created by the v1.7 test script" } | ConvertTo-Json) -ContentType $json -WebSession $session).id
}
function Reply($session, $ticketId, $text) {
  (Invoke-RestMethod -Uri "$h/api/tickets/$ticketId/messages" -Method Post -Body (@{ body = $text } | ConvertTo-Json) -ContentType $json -WebSession $session).message.id
}
function Review($ticketId, $messageId, $body) {
  Invoke-RestMethod -Uri "$h/api/tickets/$ticketId/messages/$messageId/review" -Method Post -Body ($body | ConvertTo-Json) -ContentType $json -WebSession $sup | Out-Null
}
# Downloads a CSV export: the raw bytes (to see the UTF-8 mark) and the text.
function Get-Csv($path, $session) {
  $res = Invoke-WebRequest -Uri "$h$path" -WebSession $session -UseBasicParsing
  $bytes = $res.RawContentStream.ToArray()
  [pscustomobject]@{
    Type = $res.Headers["Content-Type"]
    Disposition = $res.Headers["Content-Disposition"]
    Bom = ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF)
    Text = [Text.Encoding]::UTF8.GetString($bytes)
  }
}
# The fields of the CSV line that starts with this ticket's reference (no quoted commas in it).
function Ticket-Fields($csv, $ticketId) {
  $ref = "#" + $ticketId.Substring(0, 8).ToUpper()
  $line = ($csv.Text -split "`r`n") | Where-Object { $_.StartsWith("$ref,") } | Select-Object -First 1
  @($line -split ",")
}

# --- Setup: an organization with one client and three tickets; an agent who answers one and is denied once ---
$sup = Login "supervisor@ticketing.com" "Supervisor@1234"
$org = (Invoke-RestMethod -Uri "$h/api/organizations" -Method Post -Body (@{ name = "Export Org $stamp" } | ConvertTo-Json) -ContentType $json -WebSession $sup).organization.id
$cli = New-Client "Export Client $stamp" "export-client-$stamp@example.com" $org
$other = New-Client "Other Client $stamp" "export-other-$stamp@example.com" $org
$agt = New-Client "Export Agent $stamp" "export-agent-$stamp@example.com" $org
$cliUser = Me $cli; $otherUser = Me $other; $agtUser = Me $agt
Invoke-RestMethod -Uri "$h/api/users/$($agtUser.slug)/promote" -Method Post -WebSession $sup | Out-Null
$t1 = New-Ticket $cli "Plain title $stamp"
$t2 = New-Ticket $cli "=1+2 formula $stamp"
$t3 = New-Ticket $cli "Printer, scanner $stamp"
Invoke-RestMethod -Uri "$h/api/tickets/$t1/assign" -Method Post -Body (@{ agentId = $agtUser.id; priority = "high" } | ConvertTo-Json) -ContentType $json -WebSession $sup | Out-Null
$m1 = Reply $agt $t1 "First answer"
Review $t1 $m1 @{ action = "confirm" }
$m2 = Reply $agt $t1 "Second answer"
Review $t1 $m2 @{ action = "deny"; note = "Not yet" }
Invoke-RestMethod -Uri "$h/api/tickets/$t3/status" -Method Patch -Body (@{ status = "closed" } | ConvertTo-Json) -ContentType $json -WebSession $sup | Out-Null

Check "1. The agent's report: replies and outcomes (expect: replies 2, answered tickets 1, confirmed 1, changed 0, denied 1, pending 0) and the assigned tickets (expect: 1)"
$a = Invoke-RestMethod -Uri "$h/api/users/$($agtUser.slug)/export" -WebSession $sup
$s = $a.agentStats
"replies $($s.replies), answered tickets $($s.answeredTickets), confirmed $($s.confirmed), changed $($s.changed), denied $($s.denied), pending $($s.pending)"
@($a.tickets).Count

Check "2. The client's report for the supervisor (expect: 3 tickets, staff view True, the assigned one carries its agent: Export Agent)"
$c = Invoke-RestMethod -Uri "$h/api/users/$($cliUser.slug)/export" -WebSession $sup
"$(@($c.tickets).Count) tickets, staff view $($c.staffView), agent: $((@($c.tickets) | Where-Object id -eq $t1).assigneeName -replace ' \d+$', '')"

Check "3. The same report as CSV: a CSV file named after the client, with the UTF-8 mark and CRLF lines (expect: text/csv; charset=utf-8, True, True, True)"
$csv = Get-Csv "/api/users/$($cliUser.slug)/export?format=csv" $sup
$csv.Type
$csv.Disposition -like "attachment;*filename*=UTF-8''Export%20Client*.csv"
$csv.Bom
$csv.Text.Contains("`r`n")

Check "4. CSV cells: a staff ticket row has 9 fields (expect: 9), the formula title starts with an apostrophe (expect: True), the comma title is quoted (expect: True)"
@(Ticket-Fields $csv $t1).Count
$csv.Text.Contains(",'=1+2 formula $stamp,")
$csv.Text.Contains(",`"Printer, scanner $stamp`",")

Check "5. The client's own report hides priority and agent (expect: False, then 0 tickets with a priority or agent, then 7 fields per CSV row)"
$own = Invoke-RestMethod -Uri "$h/api/users/$($cliUser.slug)/export" -WebSession $cli
$own.staffView
@(@($own.tickets) | Where-Object { $_.priority -or $_.assigneeName }).Count
@(Ticket-Fields (Get-Csv "/api/users/$($cliUser.slug)/export?format=csv" $cli) $t1).Count

Check "6. The agent's report of the client holds only the agent's tickets (expect: 1)"
@((Invoke-RestMethod -Uri "$h/api/users/$($cliUser.slug)/export" -WebSession $agt).tickets).Count

Check "7. The organization's report: every ticket, closed too (expect: 3 tickets, 1 closed), every member (expect: 2, both clients; the agent moved to the default organization)"
$o = Invoke-RestMethod -Uri "$h/api/organizations/$org/export" -WebSession $sup
"$(@($o.tickets).Count) tickets, $($o.stats.closed) closed"
"$(@($o.members).Count) members: $((@($o.members) | ForEach-Object { $_.role }) -join ', ')"

Check "8. Who may export: another client's report (expect: 404), an agent's report of a client who is not theirs (expect: 404), the organization as agent (expect: 403) and as client (expect: 403), no session (expect: 401)"
Code { Invoke-RestMethod -Uri "$h/api/users/$($otherUser.slug)/export" -WebSession $cli }
Code { Invoke-RestMethod -Uri "$h/api/users/$($otherUser.slug)/export" -WebSession $agt }
Code { Invoke-RestMethod -Uri "$h/api/organizations/$org/export" -WebSession $agt }
Code { Invoke-RestMethod -Uri "$h/api/organizations/$org/export" -WebSession $cli }
Code { Invoke-RestMethod -Uri "$h/api/organizations/$org/export?format=csv" }
