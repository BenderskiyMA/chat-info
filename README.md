# Chat Info

Rocket chat internal App for list chat or channel information (Creator, moderators, owners)

Application register three setting value:
user_token: string 
user_id: string
host_url: string 

All are required.

Credentials used for get room roles information via next API endpoint:

/api/v1/roles.getUsersInRole?role=<role-name>&roomid=<room-id-string>

User for this must have only two permissions:
Access Permissions Screen
View Other User Channels

You cat get credentials by setting permission of generate_personal_access_token for the user(his role) (after getting token you can revoke this permission). Login with it's
login-password. Go to Account/Personal Access token page. Provide name for the token and press Add button. Then, copy
generated values of token and userId and pass them to settings in application's info page.



## Documentation

Here are some links to examples and documentation:

- [Rocket.Chat Apps TypeScript Definitions Documentation](https://rocketchat.github.io/Rocket.Chat.Apps-engine/)
- [Rocket.Chat Apps TypeScript Definitions Repository](https://github.com/RocketChat/Rocket.Chat.Apps-engine)
- [Example Rocket.Chat Apps](https://github.com/graywolf336/RocketChatApps)
- Community Forums
  - [App Requests](https://forums.rocket.chat/c/rocket-chat-apps/requests)
  - [App Guides](https://forums.rocket.chat/c/rocket-chat-apps/guides)
  - [Top View of Both Categories](https://forums.rocket.chat/c/rocket-chat-apps)
- [#rocketchat-apps on Open.Rocket.Chat](https://open.rocket.chat/channel/rocketchat-apps)
