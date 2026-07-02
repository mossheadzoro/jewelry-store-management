$hba = "C:\Program Files\PostgreSQL\16\data\pg_hba.conf"
$bin = "C:\Program Files\PostgreSQL\16\bin"
(Get-Content $hba) -replace 'scram-sha-256', 'trust' | Set-Content $hba
& "$bin\pg_ctl.exe" reload -D "C:\Program Files\PostgreSQL\16\data"
Start-Sleep -Seconds 2
& "$bin\psql.exe" -U postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';"
(Get-Content $hba) -replace 'trust', 'scram-sha-256' | Set-Content $hba
& "$bin\pg_ctl.exe" reload -D "C:\Program Files\PostgreSQL\16\data"
Start-Sleep -Seconds 2
& "$bin\psql.exe" -U postgres -c "CREATE DATABASE jewelry_store;"
