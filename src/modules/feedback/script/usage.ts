export const USAGE = `Usage: bun scripts/feedback.ts <command>
  list [--all] [--topic <t>]      unread feedback (--all: every entry), oldest first
  read <id...> | read --all       mark feedback read
  poll <question> --option <text> (2-10 times) [--hours 24] [--multi] [--guild <id>]
                                  post a poll in the server's poll channel
  polls                           the polls posted so far
  results <id>                    votes and voters of a poll
  say <text> [--guild <id>] [--close <poll id>]...
                                  post a message in the server's poll channel, then end those polls
  close <id...>                   end polls now (Discord finalises the votes)`;
