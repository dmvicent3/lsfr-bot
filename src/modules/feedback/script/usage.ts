export const USAGE = `Usage: bun scripts/feedback.ts <command>
  list [--all] [--topic <t>]      unread feedback (--all: every entry), oldest first
  read <id...> | read --all       mark feedback read
  poll <question> --option <text> (2-10 times) [--hours 24] [--multi] [--guild <id>]
                                  post a poll in the server's poll channel
  polls                           the polls posted so far
  results <id>                    votes and voters of a poll`;
