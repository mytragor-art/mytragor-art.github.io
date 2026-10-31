$ErrorActionPreference = 'Stop'
$credentialText = "protocol=https`nhost=github.com`n`n" | git credential fill
$credential = @{}
foreach ($line in $credentialText) { if ($line -match '^([^=]+)=(.*)$') { $credential[$matches[1]]=$matches[2] } }
if (-not $credential.password) { throw 'Credencial GitHub não encontrada.' }
$headers=@{ Authorization="Bearer $($credential.password)"; Accept='application/vnd.github+json'; 'X-GitHub-Api-Version'='2022-11-28'; 'User-Agent'='Mytragor-Publisher' }
$body=@{source=@{branch='main';path='/'}} | ConvertTo-Json -Depth 3
$result=Invoke-RestMethod -Method Post -Uri 'https://api.github.com/repos/mytragor-art/mytragor-art.github.io/pages' -Headers $headers -Body $body -ContentType 'application/json'
[PSCustomObject]@{status='ativado';url=$result.html_url;cname=$result.cname} | ConvertTo-Json -Compress
