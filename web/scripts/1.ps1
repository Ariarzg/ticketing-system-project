# v1.1 Step 9: hand tests for the supervisor role. Run from web\ while `bun run dev` is running.
$h = "http://localhost:3000"
$json = "application/json"

function Check($label) { Write-Host "`n== $label" -ForegroundColor Cyan }

# Runs one API call. Prints "ok", or the status and error body instead of stopping the script.
function Try-Api([scriptblock]$call) {
  try { & $call | Out-Null; "ok" }
  catch { "$([int]$_.Exception.Response.StatusCode) $($_.ErrorDetails.Message)" }
}

# Sign up a client, or log in if the email already exists. Returns the session.
function Use-Client($name, $email, $dept) {
  $body = @{ name = $name; email = $email; password = "Passw0rd!"; department = $dept } | ConvertTo-Json
  try { Invoke-RestMethod -Uri "$h/api/auth/signup" -Method Post -Body $body -ContentType $json -SessionVariable s | Out-Null }
  catch { Invoke-RestMethod -Uri "$h/api/auth/login" -Method Post -Body $body -ContentType $json -SessionVariable s | Out-Null }
  $s
}

function Promote($slug, $session) {
  Try-Api { Invoke-RestMethod -Uri "$h/api/users/$slug/promote" -Method Post -WebSession $session }
}

function Set-Status($status) {
  Try-Api { Invoke-RestMethod -Uri "$h/api/tickets/$tid/status" -Method Patch -Body (@{ status = $status } | ConvertTo-Json) -ContentType $json -WebSession $sup }
}

# --- Setup ---
$alis = Use-Client "Ali Rezaei" "ali@example.com" "technical"
$maris = Use-Client "Maryam Hosseini" "maryam@example.com" "billing"
$reza = Use-Client "Reza Ahmadi" "reza@example.com" "technical"
Invoke-RestMethod -Uri "$h/api/auth/login" -Method Post -Body (@{ email = "supervisor@ticketing.com"; password = "Supervisor@1234" } | ConvertTo-Json) -ContentType $json -SessionVariable sup | Out-Null

$aliSlug = (Invoke-RestMethod -Uri "$h/api/auth/me" -WebSession $alis).user.slug
$marSlug = (Invoke-RestMethod -Uri "$h/api/auth/me" -WebSession $maris).user.slug
$rezaSlug = (Invoke-RestMethod -Uri "$h/api/auth/me" -WebSession $reza).user.slug

# Ali files one ticket, so he cannot be promoted
$body = @{ title = "Cannot log in after password change"; description = "Created by hand to test the API"; priority = "high" } | ConvertTo-Json
$tid = (Invoke-RestMethod -Uri "$h/api/tickets" -Method Post -Body $body -ContentType $json -WebSession $alis).id

# --- Promotion ---
Check "1. Who am I (expect: supervisor)"
(Invoke-RestMethod -Uri "$h/api/auth/me" -WebSession $sup).user.role

Check "2. Users list (expect: Ali, Maryam, Reza) and number of agents (expect: 0)"
(Invoke-RestMethod -Uri "$h/api/users" -WebSession $sup).items | Format-Table name, openTickets | Out-Host
@((Invoke-RestMethod -Uri "$h/api/agents" -WebSession $sup).items).Count

Check "3. A client promotes Reza (expect: 403)"
Promote $rezaSlug $alis

Check "4. Supervisor promotes Ali, who has a ticket (expect: 409 has_tickets)"
Promote $aliSlug $sup

Check "5. Supervisor promotes Reza (expect: ok)"
Promote $rezaSlug $sup

Check "6. Reza again (expect: 409 not_a_client), then an unknown slug (expect: 404)"
Promote $rezaSlug $sup
Promote "nobody" $sup

Check "7. Agents list (expect: Reza), then users list (expect: Ali, Maryam)"
(Invoke-RestMethod -Uri "$h/api/agents" -WebSession $sup).items | Format-Table name, email | Out-Host
(Invoke-RestMethod -Uri "$h/api/users" -WebSession $sup).items | Format-Table name | Out-Host

Check "8. Reza's old session is an agent now (expect: agent), he promotes Maryam (expect: 403), he lists agents (expect: 403)"
(Invoke-RestMethod -Uri "$h/api/auth/me" -WebSession $reza).user.role
Promote $marSlug $reza
Try-Api { Invoke-RestMethod -Uri "$h/api/agents" -WebSession $reza }

# --- The supervisor as staff ---
Check "9. Supervisor sees every ticket (expect: Ali's ticket), and so does Reza (expect: 1 or more)"
(Invoke-RestMethod -Uri "$h/api/tickets" -WebSession $sup).items | Format-Table title, authorName, status | Out-Host
@((Invoke-RestMethod -Uri "$h/api/tickets" -WebSession $reza).items).Count

Check "10. Supervisor replies (expect: supervisor, then answered)"
$msg = Invoke-RestMethod -Uri "$h/api/tickets/$tid/messages" -Method Post -Body (@{ body = "Looking into it." } | ConvertTo-Json) -ContentType $json -WebSession $sup
$msg.message.authorRole
(Invoke-RestMethod -Uri "$h/api/tickets/$tid" -WebSession $sup).ticket.status

Check "11. In progress (expect: ok), close (expect: ok), close again (expect: 409 ticket_closed)"
Set-Status "in_progress"
Set-Status "closed"
Set-Status "closed"

Check "12. Supervisor opens Reza's profile (expect: agent)"
(Invoke-RestMethod -Uri "$h/api/users/$rezaSlug" -WebSession $sup).user.role

Check "13. The old agent account (expect: 401)"
Try-Api { Invoke-RestMethod -Uri "$h/api/auth/login" -Method Post -Body (@{ email = "agent@ticketing.com"; password = "Agent@1234" } | ConvertTo-Json) -ContentType $json }