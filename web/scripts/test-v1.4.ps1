# v1.4 Step 6: hand tests for reviewing agent replies. Run from web\ while `bun run dev` is running.
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

$defaultId = ((Invoke-RestMethod -Uri "$h/api/organizations").items | Where-Object isDefault).id
function New-Client($name, $email) {
  $body = @{ name = $name; email = $email; password = "Passw0rd!"; organizationId = $defaultId } | ConvertTo-Json
  Invoke-RestMethod -Uri "$h/api/auth/signup" -Method Post -Body $body -ContentType $json -SessionVariable s | Out-Null
  $s
}
function Me($session) { (Invoke-RestMethod -Uri "$h/api/auth/me" -WebSession $session).user }
function Status($session) { (Invoke-RestMethod -Uri "$h/api/tickets/$tid" -WebSession $session).ticket.status }
function Messages($session) { @((Invoke-RestMethod -Uri "$h/api/tickets/$tid/messages" -WebSession $session).items) }
function Say($text, $session) {
  (Invoke-RestMethod -Uri "$h/api/tickets/$tid/messages" -Method Post -Body (@{ body = $text } | ConvertTo-Json) -ContentType $json -WebSession $session).message
}
function Review($messageId, $body, $session, $ticketId = $tid) {
  Try-Api { Invoke-RestMethod -Uri "$h/api/tickets/$ticketId/messages/$messageId/review" -Method Post -Body ($body | ConvertTo-Json) -ContentType $json -WebSession $session }
}

# --- Setup: supervisor, a client with a ticket, an agent assigned to it ---
Invoke-RestMethod -Uri "$h/api/auth/login" -Method Post -Body (@{ email = "supervisor@ticketing.com"; password = "Supervisor@1234" } | ConvertTo-Json) -ContentType $json -SessionVariable sup | Out-Null
$cli = New-Client "Client $stamp" "review-client-$stamp@example.com"
$agt = New-Client "Agent $stamp" "review-agent-$stamp@example.com"
Invoke-RestMethod -Uri "$h/api/users/$((Me $agt).slug)/promote" -Method Post -WebSession $sup | Out-Null
$tid = (Invoke-RestMethod -Uri "$h/api/tickets" -Method Post -Body (@{ title = "Review test $stamp"; description = "Created by the v1.4 test script" } | ConvertTo-Json) -ContentType $json -WebSession $cli).id
Invoke-RestMethod -Uri "$h/api/tickets/$tid/assign" -Method Post -Body (@{ agentId = (Me $agt).id; priority = "medium" } | ConvertTo-Json) -ContentType $json -WebSession $sup | Out-Null

Check "1. The agent replies: it waits (expect: pending), the client sees nothing (expect: 0), the status stays (expect: open)"
$m1 = Say "First agent reply" $agt
$m1.review.status
(Messages $cli).Count
Status $sup

Check "2. The supervisor's 'Message confirmation needed' view has it (expect: True), with a count (expect: 1 or more)"
$view = Invoke-RestMethod -Uri "$h/api/tickets?review=1" -WebSession $sup
[bool]($view.items | Where-Object id -eq $tid)
$view.reviewCount

Check "3. The client reviews (expect: 403), the agent reviews (expect: 403), the ticket cannot be closed now (expect: 409 pending_review)"
Review $m1.id @{ action = "confirm" } $cli
Review $m1.id @{ action = "confirm" } $agt
Try-Api { Invoke-RestMethod -Uri "$h/api/tickets/$tid/status" -Method Patch -Body (@{ status = "closed" } | ConvertTo-Json) -ContentType $json -WebSession $sup }

Check "4. Confirm (expect: ok), again (expect: 409 already_reviewed); the client now sees it (expect: First agent reply), status (expect: answered), the agent sees (expect: confirmed)"
Review $m1.id @{ action = "confirm" } $sup
Review $m1.id @{ action = "confirm" } $sup
(Messages $cli | Select-Object -Last 1).body
Status $sup
((Messages $agt) | Where-Object id -eq $m1.id).review.status

Check "5. The client replies (expect: in_progress), the agent replies, the supervisor changes it (expect: ok)"
$null = Say "Client follow-up" $cli
Status $sup
$m2 = Say "Second agent reply, rough" $agt
Review $m2.id @{ action = "change"; body = "Second agent reply, edited by the supervisor" } $sup

Check "6. The client sees only the edited text (expect: True False), the agent sees both (expect: changed, the rough text, the edited text), status (expect: answered)"
$cliBodies = (Messages $cli).body
[bool]($cliBodies -contains "Second agent reply, edited by the supervisor")
[bool]($cliBodies -contains "Second agent reply, rough")
$seen = (Messages $agt) | Where-Object id -eq $m2.id
"$($seen.review.status) | $($seen.body) | $($seen.review.editedBody)"
Status $sup

Check "7. The client replies, the agent replies, the supervisor denies it (expect: ok); status stays (expect: in_progress); the client never sees it (expect: False); the agent sees the note (expect: denied | Please add the refund date)"
$null = Say "Client second follow-up" $cli
$m3 = Say "Third agent reply" $agt
Review $m3.id @{ action = "deny"; note = "Please add the refund date" } $sup
Status $sup
[bool]((Messages $cli).body -contains "Third agent reply")
$seen = (Messages $agt) | Where-Object id -eq $m3.id
"$($seen.review.status) | $($seen.review.note)"

Check "8. Bad reviews: an empty change (expect: 400), a denial without a note (expect: 400), the message under another ticket id (expect: 404), a made-up message (expect: 404)"
$m4 = Say "Fourth agent reply" $agt
Review $m4.id @{ action = "change"; body = "" } $sup
Review $m4.id @{ action = "deny" } $sup
Review $m4.id @{ action = "confirm" } $sup ([guid]::NewGuid().ToString())
Review ([guid]::NewGuid().ToString()) @{ action = "confirm" } $sup

Check "9. While a reply waits, the agent cannot mark the ticket answered (expect: 409 pending_review), and the status stays (expect: in_progress)"
Try-Api { Invoke-RestMethod -Uri "$h/api/tickets/$tid/status" -Method Patch -Body (@{ status = "answered" } | ConvertTo-Json) -ContentType $json -WebSession $agt }
Status $sup

Check "10. Client messages carry no review data (expect: True), and once nothing waits the ticket leaves the view and can close (expect: False, ok)"
Review $m4.id @{ action = "confirm" } $sup | Out-Null
[bool](-not ((Messages $cli) | Where-Object { $_.review }))
[bool]((Invoke-RestMethod -Uri "$h/api/tickets?review=1" -WebSession $sup).items | Where-Object id -eq $tid)
Try-Api { Invoke-RestMethod -Uri "$h/api/tickets/$tid/status" -Method Patch -Body (@{ status = "closed" } | ConvertTo-Json) -ContentType $json -WebSession $sup }
