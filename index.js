require("dotenv").config();

const { App } = require("@slack/bolt");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true
});

const mockDB = []

app.command("auditbot-log", async ({ command, ack, respond }) => {
  await ack();
  const args = command.text.trim().split(" ");
  const type = args[0].toLowerCase();
  const amount = args[1];
  const reason = args.slice(2).join(" ");
  if (args < 3) {
    return respond({ text: "Usage: /auditbot-log <type> <amount> <reason>" });
  }
  if (type !== "income" && type !== "expense") {
    return respond({ text: "Invalid type. Must be 'income' or 'expense'." });
  }
  if (isNaN(amount)) {
    return respond({ text: "Amount must be a number." });
  }
  if (reason.length > 100) {
    return respond({ text: "Reason must be less than 100 characters." });
  }
  const event = {
    type,
    amount,
    reason,
    timestamp: Date.now()
  }
  mockDB.push(event);
  return respond({ text: `Event logged successfully: ${JSON.stringify(event)}` });
});

app.command("auditbot-balance", async ({ command, ack, respond }) => {
  await ack();
  let totalGain = 0;
  let totalLoss = 0;
  for (const event of mockDB) {
    if (event.type === "income") {
      totalGain += event.amount;
    } else {
      totalLoss += event.amount;
    }
  }
  const balance = totalGain - totalLoss;
  return respond({ text: `Total gain: ${totalGain}, Total loss: ${totalLoss}, Balance: ${balance}` });
});

app.command("auditbot-help", async ({ command, ack, respond }) => {
  await ack();
  return respond({ text: `Available commands:
  /auditbot-log <type> <amount> <reason> - Log an event
  /auditbot-balance - Get the current balance
  /auditbot-help - Show this help message` });
});

app.command("auditbot-history", async ({ command, ack, respond }) => {
  await ack();
  const history = mockDB.map(event => `${event.type} ${event.amount} ${event.reason} ${new Date(event.timestamp).toLocaleString()}`).join("\n");
  return respond({ text: `History:\n${history}` });
});