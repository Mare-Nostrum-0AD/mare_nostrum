# Todo
Please feel free to contribute if you see anything you can do here. If there is anything you would like to see added to this list, please create an issue.

## First priorities
- Balance city growth rate
	- Implement City population drainage as part of growth rate /
	- Add house limit, tied to number of civ centres /
- Ensure city growth rate is readily apparent in gui
- Rewrite City.js to use event listeneres to register new/destroyed city members /
- Rewrite Market.js to trigger event listeners when trade takes place; use listeners in City.js /
- Improve Delphi bot
	- Make sure delphi bot mixes up trade routes
	- Allow building all available civic buildings via generic buildCivicBuilding function, replacing buildForge, buildTemple, etc.
	- Allow to build wealth resource supplies (olive groves, vineyards, etc.)
	- Make sure it can train merchant ships
- Implement archer skill growth; archers should start off weaker than other ranged units when first trained, then become stronger through experience
	- Create advanced, elite archer mixins
- Remove building ai from siege tower, ensure only usable for taking walls/other structures
	- Modify Attack component to allow garrisoned units to increase attack, allowing garrisoned infantry to increase siege tower capture attack
- Create champion mixin, refactor champion templates to inherit from standard unit templates and apply champion mixin
- Create library/academy monument for Athenians
- Create new palace actors for Hellenistic civs, kushites
- Rename Carthaginian embassies to Mercenary Camps
	- Allow to build one per town centre
	- Give them the same actors as Iberian/Gauls/Roman barracks/army camp
- Create gold, silver resource supplies
	- icons as well
- Implement directional resistance, allowing weaker flank and rear armor
- Rename "Population Limit" to "Command Limit", change icon
- Rebalance city manpower trickle
- Create skirmish replacers for different levels of civ centre
- Create range of different starting levels, selectable from a dropdown list:
	- Nomad
	- Village
	- Town
	- City

## Secondary priorities
- Ensure phase upgrade notifications are displayed correctly
- Create resource caps, which can be expanded by building structures and researching technologies
- Create local resources, which are stored locally by each resource dropsite and can only be used by nearby production queues and builders
- Choose specific names for Persian, Carthaginian merchant temples
- Create monuments for all civs:
	- Persians
	- Mauryas
	- Celts
	- Iberians
	- Alternatively, give Celts and Iberians rushing bonuses to offset their weaker city-building abilities
- Add "thrust" damage, for spear units
- Implement "Charge" attack. One-time, extremely strong attack that a unit generates by running a certain distance. Used for spear cav and ships
- Create city name manager, implement random city naming
	- Create gui widget for renaming cities (start with a cheat in the short run)
- Create dropdown sub-menus for random civ groups, to reduce clutter. Implement by adding "Category" to each civ.json, naming which sub-menu the group will be sorted into.
- Create unique structure artwork for special temples.
- Create builder/engineer unit to build structures of city level and higher
- Create civ-specific auras for palaces
- Allow training native units from captured cities, which can themselves build native structures
- Ensure loyalty decreasing aura for burning pigs works
- Implement plagues (see below)
- Create "Advancement Victory" where goal is to reach the Empire Phase
- Create "local" technologies, which have to be researched by each individual entity to enable certain auras and features
- Create Government GUI Panel
	 - Enabled by building palace
	 - allows setting taxation levels, implementing and de-implementing policies, choosing and switching government forms, etc.
	 - Different for each civ; settings specified by Government component. Can be either part of Player component or component of palace

## General priorities
- Ensure accuracy of patron deity choices. This should be a continuous process.
- Create more unique patron temples, instead of 4-5 cookie cutter temple types.
- Add new resource supplies to maps

## Classification of soldier strengths/weaknesses
- Infantry
	- Spearmen: cheap, quick to train; weak on their own, fairly strong in phalanx formation with heavy armor, available to certain civs. Strong vs. light cav, weak vs. swordsmen, light infantry
	- Pikemen: tank units, nearly invulnerable to pierce damage. especially strong in phalanx. However, slow-moving and vulnerable to outmaneuvering/flanking. Strong vs. cav, light infantry, weak vs. swordsmen
	- Swordsmen: most maneuverable melee infantry; relatively fast-moving. However, wear relatively light armor. Strong vs spearmen, pikemen, weak vs. ranged infantry, cavalry
	- Javelineer: cheap, quick to train. Maneuverable, fastest infantry unit. Starts off with strong attack straight out of training. Strong vs swordsmen, spearmen, weak vs pikemen, cavalry
	- Slinger: Medium train time and cost, deadly force to light infantry and cavalry over short distance. Moderate attack out of training, moderate skill acquisition through experience. Strong vs spearmen, swordsmen, javelineer, ranged cav, Weak vs. Pikemen, melee cav
	- Archer: Long train time and cost, eventually grows to be deadly at a long range. Weak attack and accuracy out of training, but will eventually become extremely strong through experience. Strong vs all light units, weak vs. pikemen, heavy cavalry
- Cavalry
	- Spear: strongest cavalry unit in formation; has strong charge attack that can mow down disorganized and light infantry. Strong vs swordsmen, ranged infantry, weak vs pikemen, massed spearmen
	- Sword: maneuverable, good raiders, possible counter to disorganized heavy cavalry. Strong vs light infantry, spear cavalry, ranged cavalry, weak vs spearmen, pikemen
	- Javelin: maneuverable, good raiders. Strong vs disorganized infantry, weak vs spearmen, pikemen, swordsmen, sword cavalry
	- Archer: Like foot archers, start off weak and become very strong through experience. Strong vs. All non-pike infantry at peak experience, weak-ish vs sword cavalry
- Implement GUIInterface for popup dialogs to be called from Trigger scripts

## New Civs
### Near East
- Phoenicians
- Nabatean Arabs
- Judeans
- Armenians
### Europe
- Syracusans
- Rhodians
- Epirotes
- Etruscans
- Ionian Greeks (non-selectable)
- Dorian Greeks (non-selectable)
### Asia
- Qin/Han China
- Vietnamese
- Kushans
- Greco-Bactrians
### Africa
- Numidians
### Nomads
- Xiongnu
- Scythians
- Bedouin Arabs (non-selectable?)

### New Feature - Plagues
Every city will have a chance of starting a plague at a given interval. In cities with a low population, the likelihood will be extremely small,
but as the population grows into the tens of thousands the likelihood of starting a plague will increase exponentially.
Like real world diseases, a plague will start in a latent phase where it is undetectable to players and produces no effect, but is already capable of spreading to other units
(primarily traders). Once the latent phase has ended, the affected city will begin to lose population by the hundreds at intervals of a few seconds, lasting for a minute or more.
The plague will emit an aura that drains health from nearby units, stops production queues, and reduces the max health and capture points of nearby buildings.
Merchants will act as carriers of plagues. Like cities, they will go throught a latent phase where they spread the plague without showing symptoms before entering a symptomatic phase where their health is drained. Because of this, the only effective way to stop the spread of a plague is to halt all trade until it passes.
Plagues will affect a city for a maximum of two minutes, and a minimum of one minute.
Once a player reaches the hegemon or empire phase, they may research technologies (i.e. "Public Sanitation") that will decrease the likelihood of their cities developing a plague, or at least mitigate the effects.

Plagues will function as a balancing feature to prevent players who are already ahead from coasting to victory, giving other players time to catch up.
