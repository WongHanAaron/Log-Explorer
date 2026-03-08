# Contracts

This feature does not expose any new public APIs or external interfaces. The only
message schema introduced—`{ type:'log', level?:string, text:string }` sent from a
webview to the host—is internal and handled entirely within the extension. There is
no published contract for third parties.