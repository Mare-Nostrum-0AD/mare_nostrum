const scenarioVictoryTimeMinutes = 90;

const scenarioIntroAthen = 
`The Carthaginians are invading your colony. Defeat them or survive for ${scenarioVictoryTimeMinutes} minutes in order to win.`;

const scenarioIntroCart = 
`You have found a Greek colony infringing on your territory. Defeat them within ${scenarioVictoryTimeMinutes} minutes in order to win.`;

const scenarioBriefing = 
`The Sicilian Wars, or Greco-Punic Wars, were a series of conflicts fought
between ancient Carthage and the Greek city-states led by Syracuse, Sicily over
control of Sicily and the western Mediterranean between 580 and 265 BC.

Carthage's economic success and its dependence on seaborne trade led to the
creation of a powerful navy to discourage both pirates and rival nations. They
had inherited their naval strength and experience from their forebears, the
Phoenicians, but had increased it because, unlike the Phoenicians, the Punics
did not want to rely on a foreign nation's aid. This, coupled with its success
and growing hegemony, brought Carthage into increasing conflict with the
Greeks, the other major power contending for control of the central
Mediterranean.

The Greeks, like the Phoenicians, were expert sailors who had established
thriving colonies throughout the Mediterranean. These two rivals fought their
wars on the island of Sicily, which lay close to Carthage. From their earliest
days, both the Greeks and Phoenicians had been attracted to the large island,
establishing a large number of colonies and trading posts along its coasts.
Small battles had been fought between these settlements for centuries.

No Carthaginian records of the war exist today because when the city was
destroyed in 146 BC by the Romans, the books from Carthage's library were
distributed among the nearby African tribes. None remain on the topic of
Carthaginian history. As a result, most of what we know about the Sicilian Wars
comes from Greek historians.

Source: https://en.wikipedia.org/wiki/Sicilian_Wars`;

Trigger.prototype.DisplayScenarioBriefing = function(playerID)
{
	const cmpGuiInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
	cmpGuiInterface.PushPopupRequest({
		"players":		[playerID],
		"title": 		"History",
		"text":			scenarioBriefing,
		"width":		600,
		"height":		600,
	});
};

Trigger.prototype.DisplayScenarioIntro = function()
{
	const cmpGuiInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
	const getPopupSettings = (playerID, text) => ({
		"players":		[playerID],
		"title": 		"Introduction",
		"text":			text,
		"width":		500,
		"height":		200,
		"choices":		[
			["Ok", null],
			["Read More", {
				"entities":	[SYSTEM_ENTITY],
				"iid":		IID_Trigger,
				"func":		"DisplayScenarioBriefing",
				"args":		[playerID]
			}]
		]
	});
	cmpGuiInterface.PushPopupRequest(getPopupSettings(1, scenarioIntroAthen));
	cmpGuiInterface.PushPopupRequest(getPopupSettings(2, scenarioIntroCart));
};

Trigger.prototype.ChoiceFreeUnits = function(playerID, unitClasses)
{
	const cmpPlayerManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_PlayerManager);
	const playerEnt = cmpPlayerManager.GetPlayerByID(playerID);
	const modifiers = Object.fromEntries(Resources.GetCodes().map(code => ["Cost/Resources/" + code, [{ "affects": unitClasses, "replace": 0 }]]));
	const cmpModifiersManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_ModifiersManager);
	cmpModifiersManager.AddModifiers("script_free_units", modifiers, playerEnt);
};

Trigger.prototype.RequestChoiceFreeUnits = function()
{
	const cmpGuiInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
	const cmpPlayerManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_PlayerManager);
	const humanPlayers = cmpPlayerManager.GetNonGaiaPlayers().filter(id => !QueryPlayerIDInterface(id).IsAI());
	for (const playerID of humanPlayers)
	{
		const choiceFreeInfantry = {
			"entities":	[SYSTEM_ENTITY],
			"iid":		IID_Trigger,
			"func":		"ChoiceFreeUnits",
			"args":		[playerID, ["Infantry"]]
		};
		const choiceFreeCavalry = {
			"entities":	[SYSTEM_ENTITY],
			"iid":		IID_Trigger,
			"func":		"ChoiceFreeUnits",
			"args":		[playerID, ["Cavalry"]]
		};
		cmpGuiInterface.PushPopupRequest({
			"players":		[playerID],
			"title": 		"Choice: Free Units",
			"text":			"Would you like to train free infantry or free cavalry for this match?",
			"choices":		[
				["Infantry", choiceFreeInfantry],
				["Cavalry", choiceFreeCavalry]
			]
		});
	}
};

Trigger.prototype.SetupScenario = function()
{
	const cmpTimer = Engine.QueryInterface(SYSTEM_ENTITY, IID_Timer);
	cmpTimer.SetTimeout(SYSTEM_ENTITY, IID_Trigger, "RequestChoiceFreeUnits", 500);
};

{
	const cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger);
	cmpTrigger.RegisterTrigger("OnInitGame", "SetupScenario", { "enabled": true });
	cmpTrigger.RegisterTrigger("OnInitGame", "DisplayScenarioIntro", { "enabled": true });
}
