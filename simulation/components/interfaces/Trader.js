Engine.RegisterInterface("Trader");

// Message in the form { "trader": number, "market": number, "goods": object }
// Broadcast whenever a trader arrives at a market with goods
Engine.RegisterMessageType("TradePerformed");
