import { Context, EventFunction } from "@google-cloud/functions-framework/build/src/functions";
import { PubsubMessage } from "@google-cloud/pubsub/build/src/publisher";
import cheerio from "cheerio";

import TelegramBot = require("node-telegram-bot-api");

const axios = require("axios"); // eslint-disable-line @typescript-eslint/no-var-requires

function log(severity: string, message: string) {
    const entry = Object.assign({
        severity: severity.toUpperCase(),
        message: message,
    });
    console.log(JSON.stringify(entry));
}

async function extractExcerpt(): Promise<string> {
    // Get DefiLlama Round Up content and parse as DOM.
    const res = await axios.get("https://defillama.com/roundup");
    const $ = cheerio.load(res.data);

    // Extract items from topic of interests.
    const target_topics = new Set(["MEV ⚡️", "Security 🛡", "Development ⚙️"]);
    const excerpt: string[] = [];
    let current_topic = "START";
    // The `div` after the title `h1` contains the actual content.
    const content = $('h1:contains("Daily news roundup with the 🦙") + div');
    // `h3`: topic titles, `a`: items.
    content.find("h3, a").each((_, e) => {
        let line: string;
        if (e.name === "h3") {
            const topic = $(e).text().trim();
            current_topic = topic;
            line = `*${topic}*`;
        } else {
            const item = $(e).text().replace(/\s+/g, " ");
            const link = $(e).attr("href");
            line = `${item}\n${link}\n`.replace(
                // To send message text as MarkdownV2 format, the following characters need to
                // be escaped. (ref: https://core.telegram.org/bots/api#markdownv2-style)
                /[_*[\]()~`>#+-=|{}.!]/g,
                (x: string) => `\\${x}`
            );
        }
        if (target_topics.has(current_topic)) {
            excerpt.push(line);
        }
    });

    // Produce final result by prepending title.
    const title = "*🦙 Excerpt from [DefiLlama Round Up](https://t.me/defillama_tg)*";
    const result = excerpt.length > 0 ? `${title}\n\n${excerpt.join("\n")}` : "";

    return result;
}

export const handlePubSub: EventFunction = async (message: PubsubMessage, _context: Context) => {
    const data = message.attributes || {};
    if (!("alpaca" in data)) {
        return;
    }

    // Extract excerpt from https://defillama.com/roundup.
    let excerpt: string;
    try {
        excerpt = await extractExcerpt();
    } catch (e) {
        log("error", `Failed to extract excerpt from DefiLlama Round Up content: ${e}`);
        return;
    }
    if (excerpt.length == 0) {
        log("warn", "Excerpt is empty.");
        return;
    }
    log("info", `Extracted Excerpt: ${excerpt}`);

    // Send excerpt to channel.
    const botToken = process.env.BOT_TOKEN;
    if (botToken === undefined) {
        log("error", "Environment variable `BOT_TOKEN` is not set.");
        return;
    }
    const channelId = Number(process.env.CHANNEL_CHAT_ID);
    if (Number.isNaN(channelId)) {
        log("error", "Environment variable `CHANNEL_CHAT_ID` is not set.");
        return;
    }
    try {
        const bot = new TelegramBot(botToken);
        await bot.sendMessage(channelId, excerpt, {
            disable_web_page_preview: true,
            parse_mode: "MarkdownV2",
        });
    } catch (e) {
        log("error", `Failed to send excerpt: ${e}`);
        return;
    }
    log("info", "Successfully sent excerpt to channel.");
};
