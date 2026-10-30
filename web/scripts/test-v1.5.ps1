# v1.5 Step 6: hand tests for attachments. Run from web\ while `bun run dev` is running.
# Multipart requests go through curl.exe, because Windows PowerShell 5.1 has no -Form.
$h = "http://localhost:3000"
$json = "application/json; charset=utf-8"
$stamp = Get-Date -Format "MMddHHmmss"
$dir = Join-Path $env:TEMP "ticketing-v1.5"
New-Item -ItemType Directory -Force $dir | Out-Null

function Check($label) { Write-Host "`n== $label" -ForegroundColor Cyan }

$defaultId = ((Invoke-RestMethod -Uri "$h/api/organizations").items | Where-Object isDefault).id
function New-Client($name, $email) {
  $body = @{ name = $name; email = $email; password = "Passw0rd!"; organizationId = $defaultId } | ConvertTo-Json
  Invoke-RestMethod -Uri "$h/api/auth/signup" -Method Post -Body $body -ContentType $json -SessionVariable s | Out-Null
  $s
}
function Me($session) { (Invoke-RestMethod -Uri "$h/api/auth/me" -WebSession $session).user }
function Cookie($session) { $session.Cookies.GetCookies($h)["session"].Value }

# Sends a multipart form. Each part is "name=value" or "files=@path". Returns the status and the parsed body.
function Send-Form($path, $session, [string[]]$parts) {
  $curlArgs = @("-s", "-w", '\n%{http_code}', "-b", "session=$(Cookie $session)")
  foreach ($p in $parts) { $curlArgs += @("-F", $p) }
  $lines = @(& curl.exe @curlArgs "$h$path")
  $body = $lines[0..($lines.Count - 2)] -join ""
  [pscustomobject]@{ Status = [int]$lines[-1]; Data = ($body | ConvertFrom-Json) }
}
function Reply($session, [string[]]$parts) { Send-Form "/api/tickets/$tid/messages" $session $parts }
function Show($result) { "$($result.Status) $($result.Data.error)" }

# Opens an attachment through our route and prints the status. The body goes to $out; the headers stay for Show-Headers.
function Open-File($id, $session, $out = "NUL") {
  $cookie = if ($session) { @("-b", "session=$(Cookie $session)") } else { @() }
  $script:headers = @(& curl.exe -s -D - -o $out @cookie "$h/api/attachments/$id")
  ($script:headers[0] -split " ")[1]
}
# The headers of the last Open-File that decide how the browser treats the file. No "location": it never redirects.
function Show-Headers {
  ($script:headers | Select-String -Pattern "^content-type:", "^content-disposition:", "^x-content-type-options:", "^location:").Line
}
function Review($messageId, $body) {
  Invoke-RestMethod -Uri "$h/api/tickets/$tid/messages/$messageId/review" -Method Post -Body ($body | ConvertTo-Json) -ContentType $json -WebSession $sup | Out-Null
  "ok"
}

# --- Files: a 1x1 PNG, a tiny PDF, a text file, an HTML page (refused) and a ZIP one byte over the limit ---
[IO.File]::WriteAllBytes("$dir\pixel.png", [Convert]::FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="))
Set-Content "$dir\report.pdf" "%PDF-1.4 test" -Encoding Ascii
Set-Content "$dir\notes.txt" "plain text" -Encoding Ascii
Set-Content "$dir\page.html" "<script>alert(1)</script>" -Encoding Ascii
[IO.File]::WriteAllBytes("$dir\big.zip", (New-Object byte[] (4MB + 1)))

# --- People: the supervisor, a client, another client, an agent (promoted while they have no tickets) ---
Invoke-RestMethod -Uri "$h/api/auth/login" -Method Post -Body (@{ email = "supervisor@ticketing.com"; password = "Supervisor@1234" } | ConvertTo-Json) -ContentType $json -SessionVariable sup | Out-Null
$cli = New-Client "Client $stamp" "files-client-$stamp@example.com"
$other = New-Client "Other $stamp" "files-other-$stamp@example.com"
$agt = New-Client "Agent $stamp" "files-agent-$stamp@example.com"
Invoke-RestMethod -Uri "$h/api/users/$((Me $agt).slug)/promote" -Method Post -WebSession $sup | Out-Null

Check "1. The client files a ticket with a picture (expect: 201); the ticket lists it (expect: 1 pixel.png image/png 70)"
$r = Send-Form "/api/tickets" $cli @("title=Files test $stamp", "description=Created by the v1.5 test script", "files=@$dir\pixel.png")
$r.Status
$tid = $r.Data.id
# Every later check needs this ticket. A 500 here is nearly always missing or wrong storage keys: read the server log.
if (-not $tid) { Write-Host "Stopped: no ticket was created. See the dev server's log." -ForegroundColor Red; exit 1 }
$files = @((Invoke-RestMethod -Uri "$h/api/tickets/$tid" -WebSession $cli).ticket.attachments)
"$($files.Count) $($files[0].name) $($files[0].type) $($files[0].size)"
$png = $files[0].id

Check "2. The client opens it from our own server (expect: 200; image/png, inline; filename*=UTF-8''pixel.png, nosniff, no location) and gets the same bytes (expect: 70 of 70)"
Open-File $png $cli "$dir\got.png"
Show-Headers
"$((Get-Item "$dir\got.png").Length) of $((Get-Item "$dir\pixel.png").Length)"

Check "3. Nobody else gets it: no session (expect: 401), another client (expect: 404), an agent it is not assigned to (expect: 404); the supervisor does (expect: 200)"
Open-File $png $null
Open-File $png $other
Open-File $png $agt
Open-File $png $sup

Check "4. Once the ticket is assigned, the agent gets it (expect: 200)"
Invoke-RestMethod -Uri "$h/api/tickets/$tid/assign" -Method Post -Body (@{ agentId = (Me $agt).id; priority = "medium" } | ConvertTo-Json) -ContentType $json -WebSession $sup | Out-Null
Open-File $png $agt

Check "5. The rules: an HTML page (expect: 400 file_type), four files (expect: 400 too_many_files), over 4 MB (expect: 400 files_too_large), no text and no file (expect: 400 invalid_input)"
Show (Reply $cli @("body=x", "files=@$dir\page.html"))
Show (Reply $cli @("body=x", "files=@$dir\notes.txt", "files=@$dir\notes.txt", "files=@$dir\notes.txt", "files=@$dir\notes.txt"))
Show (Reply $cli @("body=x", "files=@$dir\big.zip"))
Show (Reply $cli @("body="))

Check "6. The agent replies with only a PDF (expect: 201 pending 1); the client sees no reply (expect: 0) and cannot open the file (expect: 404); the agent can (expect: 200)"
$r = Reply $agt @("files=@$dir\report.pdf")
"$($r.Status) $($r.Data.message.review.status) $(@($r.Data.message.attachments).Count)"
$m1 = $r.Data.message.id
$pdf = $r.Data.message.attachments[0].id
@((Invoke-RestMethod -Uri "$h/api/tickets/$tid/messages" -WebSession $cli).items).Count
Open-File $pdf $cli
Open-File $pdf $agt

Check "7. The supervisor confirms (expect: ok); the client sees the reply with its file (expect: 1 report.pdf), and it downloads (expect: 200; application/pdf, attachment; filename*=UTF-8''report.pdf, nosniff)"
Review $m1 @{ action = "confirm" }
$seen = (Invoke-RestMethod -Uri "$h/api/tickets/$tid/messages" -WebSession $cli).items | Where-Object id -eq $m1
"$(@($seen.attachments).Count) $($seen.attachments[0].name)"
Open-File $pdf $cli
Show-Headers

Check "8. The agent replies with text and a file, and the supervisor denies it (expect: ok); the client cannot open that file (expect: 404), the agent still can (expect: 200)"
$r = Reply $agt @("body=Here is a text file", "files=@$dir\notes.txt")
Review $r.Data.message.id @{ action = "deny"; note = "Wrong file" }
$txt = $r.Data.message.attachments[0].id
Open-File $txt $cli
Open-File $txt $agt

Check "9. A JSON reply without files still works, as in v1.4 (expect: 201, then 0)"
$res = Invoke-WebRequest -Uri "$h/api/tickets/$tid/messages" -Method Post -Body (@{ body = "Plain JSON reply" } | ConvertTo-Json) -ContentType $json -WebSession $cli -UseBasicParsing
$res.StatusCode
@(($res.Content | ConvertFrom-Json).message.attachments).Count

Check "10. After closing (expect: ok), a reply with a file is refused before anything is stored (expect: 409 ticket_closed)"
Invoke-RestMethod -Uri "$h/api/tickets/$tid/status" -Method Patch -Body (@{ status = "closed" } | ConvertTo-Json) -ContentType $json -WebSession $sup | Out-Null
"ok"
Show (Reply $cli @("body=Too late", "files=@$dir\notes.txt"))
