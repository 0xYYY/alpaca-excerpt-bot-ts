#!/usr/bin/env bash

PROJECT_ID=$(gcloud config list --format 'value(core.project)')

function join_array {
    local arr=("$@")
    local result="$(
        IFS=,
        echo "${arr[*]}"
    )"
    echo "$result"
}

ENVVARS=(
    "CHANNEL_CHAT_ID=-1001320803687"
)

SECRETS=(
    "BOT_TOKEN=ALPACA_TELEGRAM_BOT_TOKEN:latest"
)

gcloud functions deploy alpaca-excerpt-bot --region=us-central1 --memory=128Mi --runtime nodejs16 \
    --allow-unauthenticated --entry-point=handlePubSub --trigger-topic=noon \
    --set-env-vars="$(join_array "${ENVVARS[@]}")" --set-secrets="$(join_array "${SECRETS[@]}")" \
    --gen2
