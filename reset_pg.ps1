$hba = "C:\Program Files\PostgreSQL\16\data\pg_hba.conf"
(Get-Content $hba) -replace 'scram-sha-256', 'trust' | Set-Content $hba
Restart-Service -Name postgresql-x64-16
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';"
(Get-Content $hba) -replace 'trust', 'scram-sha-256' | Set-Content $hba
Restart-Service -Name postgresql-x64-16
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "CREATE DATABASE jewelry_store;"
