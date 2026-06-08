$rules = Get-Content 'C:\SCRAPP-ENTERPRISE\scrapp-webapp-cinema\.agent\04-ui-design-rules.md' -Raw -Encoding UTF8
$blueprint = Get-Content 'C:\SCRAPP-ENTERPRISE\scrapp-webapp-cinema\.agent\stitch-blueprint.md' -Raw -Encoding UTF8
$combined = $rules + "`n`n" + $blueprint
$bytes = [System.Text.Encoding]::UTF8.GetBytes($combined)
$base64 = [System.Convert]::ToBase64String($bytes)
Write-Output $base64
