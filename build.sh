#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install dependencies
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --noinput

