# 🦙 Alpaca Excerpt Bot

Extract news under topics of interest (MEV, security, development) from [DefiLlama Round Up](https://defillama.com/roundup)
and forward to my own Telegram [channel](https://t.me/iq30_tg).

## Architecture

The script itself is quite simple. Actually, more work is done on figuring out and setting up the
environment where it runs. I chose to deploy the bot on Google Cloud Functions (a serverless
platform). The following chart describe the overall architecture.

```mermaid
flowchart LR
    A("Daily Cron Jub<br>(Cloud Scheduler)")
    B("Topic<br>(Cloud Pub/Sub)")
    C("Bot Script<br>(Cloud Functions)")
    A -- publish --> B
    C -- subscribe --> B
```

The cron job will publish an event to the topic daily, triggering the bot function to execute its
logic to crawl the Round Up content from DefiLlama's website, extract relevant news, and then send
an excerpt to my TG channel.

## Requirements

-   A [Google Cloud](https://cloud.google.com) account.
-   Set up a [Scheduler](https://cloud.google.com/secret-manager/docs/create-secret) for the daily
    cron job.
-   Set up a [Pub/Sub](https://cloud.google.com/pubsub/docs/publish-receive-messages-console) topic.
-   Obtain a [Telegram bot token](https://core.telegram.org/bots) and store it in [Secret Manager](https://cloud.google.com/secret-manager/docs/create-secret).
-   Install [`gcloud`](https://cloud.google.com/sdk/gcloud) command line tool.

## Deploy

```bash
yarn fix
yarn compile
yarn deploy
```

## License

[MIT](./LICENSE)
