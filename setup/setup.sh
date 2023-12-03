#!/bin/bash

# Update and install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql.service

# Run PostgreSQL commands
sudo -iu postgres psql <<EOF
CREATE DATABASE parqe;
CREATE USER app WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE parqe TO app;
\q
EOF

# Install Python requirements
pip install -r requirements.txt