# Todo
Please feel free to contribute if you see anything you can do here. If there is anything you would like to see added to this list, please create an issue.

## First priorities
- Fix trader gui
- Choose specific names for Persian, Carthaginian merchant temples
- Integrate distance build restrictions into delphi bot, especially for choosing market locations
- Create monuments for all civs:
	- Celts
	- Iberians
	- Carthaginians
	- Mauryans
- Create library/academy monument for Athenians
- Change walls to low/high distinction instead of three phases
	- Create meshes for low walls
	- Implement walls for Mauryans
- Create "light battering ram" for town phase, trainable at barracks or blacksmith

## Secondary priorities
- Create statistics tracker for city population
- Create unique structure artwork for special temples.
- Implement population resource trickle for cities
- Fix structure tree display to not double-display phase V
- Create "port" structure - a dock that functions as a bartermarket, can only be build near cities, and can only train fisherman and merchants
	- Turn current dock into separate military "shipyard" structure
- Create builder/engineer unit to build structures of city level and higher
- Create gold, silver resource supplies
- Create palaces for all civs
- Create civ-specific auras for palaces
- Allow training native units from captured cities, which can themselves build native structures
- Ensure loyalty decreasing aura for burning pigs works
- Implement plagues (see below)
- Create "Advancement Victory" where goal is to reach the Empire Phase
- Create government pair technologies for palace
- Create "manpower" resource - untradeable, unbarterable, and unsharable. Only gained through a per-population trickle at cities. Necessary for creating all units plus founding colonies.

## General priorities
- Ensure accuracy of patron deity choices. This should be a continuous process.

## New Civs
### Near East
- Phoenicians
- Assyrians
- Nabatean Arabs
- Judeans
- Armenians
### Europe
- Etruscans
- Italics (Latins + Umbrii + Samnites)
- Ionian Greeks
- Dorian Greeks
- Thracians
### Africa
- Numidians
### Nomads
- Scythians
- Bedouin Arabs

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
