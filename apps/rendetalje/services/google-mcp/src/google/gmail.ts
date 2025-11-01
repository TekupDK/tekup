import { getGmail } from "./auth";

const USER_ID = "me";

export async function searchThreads(query: string, maxResults = 25, readMask?: string[]) {
  const gmail = getGmail();
  const { data } = await gmail.users.threads.list({ userId: USER_ID, q: query, maxResults });
  
  if (!data.threads || data.threads.length === 0) {
    return [];
  }

  // If readMask specified, get detailed thread info
  if (readMask && readMask.length > 0) {
    const threadIds = data.threads.map(t => t.id!);
    const detailedThreads = await Promise.all(
      threadIds.map(async (id) => {
        try {
          const threadData = await gmail.users.threads.get({
            userId: USER_ID,
            id,
            format: 'metadata',
            metadataHeaders: ['From', 'To', 'Subject', 'Date'],
          });
          
          const thread = threadData.data;
          const messages = thread.messages || [];
          const latestMessage = messages[messages.length - 1];
          const headers = latestMessage?.payload?.headers || [];
          
          const getHeader = (name: string) => headers.find((h: any) => h.name === name)?.value || '';
          
          return {
            id: thread.id,
            snippet: thread.snippet,
            date: getHeader('Date'),
            participants: {
              from: getHeader('From'),
              to: getHeader('To'),
            },
            subject: getHeader('Subject'),
            bodySnippet: thread.snippet,
          };
        } catch (e) {
          return data.threads!.find(t => t.id === id);
        }
      })
    );
    return detailedThreads;
  }

  return data.threads || [];
}

export async function getThread(threadId: string) {
  const gmail = getGmail();
  const { data } = await gmail.users.threads.get({ 
    userId: USER_ID, 
    id: threadId, 
    format: "full" 
  });
  return data;
}

export async function sendReply(input: { threadId: string; body: string; to?: string; subject?: string; }) {
  // Build RFC822 message for reply
  const lines: string[] = [];
  if (input.to) lines.push(`To: ${input.to}`);
  if (input.subject) lines.push(`Subject: ${input.subject}`);
  lines.push("Content-Type: text/plain; charset=\"UTF-8\"");
  lines.push("");
  lines.push(input.body);
  const raw = Buffer.from(lines.join("\r\n")).toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
  const gmail = getGmail();
  const { data } = await gmail.users.messages.send({ userId: USER_ID, requestBody: { threadId: input.threadId, raw } });
  return data;
}

export async function applyLabels(input: { threadId: string; add: string[]; remove?: string[] }) {
  const gmail = getGmail();
  const { data } = await gmail.users.threads.modify({
    userId: USER_ID,
    id: input.threadId,
    requestBody: {
      addLabelIds: input.add,
      removeLabelIds: input.remove || [],
    },
  });
  return data;
}


