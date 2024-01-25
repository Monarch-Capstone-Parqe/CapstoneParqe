#!/bin/bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo service postgresql start
pip install -r setup/requirement.txt
