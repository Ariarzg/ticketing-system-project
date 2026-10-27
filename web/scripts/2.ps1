# v1.2 Step 11: hand tests for organizations. Run from web\ while `bun run dev` is running.
$h = "http://localhost:3000"
# The charset makes Windows PowerShell 5.1 send names (like the default's Persian one) as UTF-8.
$json = "application/json; charset=utf-8"

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

# Sign up a client in an organization, or log in if the email already exists. Returns the session.
function Use-Client($name, $email, $orgId) {
  $body = @{ name = $name; email = $email; password = "Passw0rd!"; organizationId = $orgId } | ConvertTo-Json
  try { Invoke-RestMethod -Uri "$h/api/auth/signup" -Method Post -Body $body -ContentType $json -SessionVariable s | Out-Null }
  catch { Invoke-RestMethod -Uri "$h/api/auth/login" -Method Post -Body $body -ContentType $json -SessionVariable s | Out-Null }
  $s
}

function Orgs { (Invoke-RestMethod -Uri "$h/api/organizations").items }

function Add-Org($name, $session) {
  Try-Api { Invoke-RestMethod -Uri "$h/api/organizations" -Method Post -Body (@{ name = $name } | ConvertTo-Json) -ContentType $json -WebSession $session }
}

# --- Setup ---
Invoke-RestMethod -Uri "$h/api/auth/login" -Method Post -Body (@{ email = "supervisor@ticketing.com"; password = "Supervisor@1234" } | ConvertTo-Json) -ContentType $json -SessionVariable sup | Out-Null
$defaultId = (Orgs | Where-Object isDefault).id
$alis = Use-Client "Ali Rezaei" "ali@example.com" $defaultId

# --- Organizations ---
Check "1. The public list, no session (expect: one row, isDefault True)"
Orgs | Format-Table name, isDefault | Out-Host

Check "2. The supervisor is in the default organization (expect: True)"
(Invoke-RestMethod -Uri "$h/api/auth/me" -WebSession $sup).user.organizationId -eq $defaultId

Check "3. Add 'Sample Co' (expect: ok), again (expect: 409 org_name_taken), a 1-letter name (expect: 400), as a client (expect: 403)"
Add-Org "Sample Co" $sup
Add-Org "Sample Co" $sup
Add-Org "S" $sup
Add-Org "Client Co" $alis
$sampleId = (Orgs | Where-Object name -eq "Sample Co").id

Check "4. Maryam signs up in Sample Co (expect: True); a made-up organization id (expect: 400 invalid_input)"
$maris = Use-Client "Maryam Hosseini" "maryam@example.com" $sampleId
(Invoke-RestMethod -Uri "$h/api/auth/me" -WebSession $maris).user.organizationId -eq $sampleId
$bad = @{ name = "Nobody"; email = "nobody@example.com"; password = "Passw0rd!"; organizationId = [guid]::NewGuid().ToString() } | ConvertTo-Json
Try-Api { Invoke-RestMethod -Uri "$h/api/auth/signup" -Method Post -Body $bad -ContentType $json }

Check "5. Maryam's ticket carries Sample Co (expect: True)"
$body = @{ title = "Refund request for duplicate payment"; description = "Created by hand to test the API"; priority = "high" } | ConvertTo-Json
$tid = (Invoke-RestMethod -Uri "$h/api/tickets" -Method Post -Body $body -ContentType $json -WebSession $maris).id
(Invoke-RestMethod -Uri "$h/api/tickets/$tid" -WebSession $sup).ticket.organizationId -eq $sampleId

Check "6. Filter by organization as the supervisor (expect: only Maryam's ticket); a bad id (expect: 400)"
(Invoke-RestMethod -Uri "$h/api/tickets?organization=$sampleId" -WebSession $sup).items | Format-Table title, authorName | Out-Host
Try-Api { Invoke-RestMethod -Uri "$h/api/tickets?organization=abc" -WebSession $sup }

Check "7. Rename to 'Sample Company' (expect: ok), rename it to the default's name (expect: 409 org_name_taken), a client renames (expect: 403)"
$rename = { param($id, $name, $session) Try-Api { Invoke-RestMethod -Uri "$h/api/organizations/$id" -Method Patch -Body (@{ name = $name } | ConvertTo-Json) -ContentType $json -WebSession $session } }
& $rename $sampleId "Sample Company" $sup
& $rename $sampleId ((Orgs | Where-Object isDefault).name) $sup
& $rename $sampleId "Hacked" $alis

Check "8. Delete the default (expect: 409 org_is_default), delete as a client (expect: 403), an unknown id (expect: 404)"
$delete = { param($id, $session) Try-Api { Invoke-RestMethod -Uri "$h/api/organizations/$id" -Method Delete -WebSession $session } }
& $delete $defaultId $sup
& $delete $sampleId $alis
& $delete ([guid]::NewGuid().ToString()) $sup

Check "9. Delete Sample Company (expect: ok); Maryam and her ticket moved to the default (expect: True, True); one organization left (expect: 1)"
& $delete $sampleId $sup
(Invoke-RestMethod -Uri "$h/api/auth/me" -WebSession $maris).user.organizationId -eq $defaultId
(Invoke-RestMethod -Uri "$h/api/tickets/$tid" -WebSession $sup).ticket.organizationId -eq $defaultId
@(Orgs).Count