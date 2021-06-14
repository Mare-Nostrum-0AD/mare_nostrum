# Mare Nostrum: a total overhaul mod of 0AD: Empires Ascendant
Mare Nostrum aims to take 0AD: Empires Ascendant to new heights by creating a richer, more realistic experience of city-building and statecraft.
Grow your nation from a small village of 100 to a vast empire holding sway over hundreds of thousands. Please the masses by building monuments and wonders that would make even the gods envious. As your nation grows, so too will the complexity of governing it. Will you choose to rule over a peaceful merchant republic, or a warmongering autocracy?

## Setting
Mare Nostrum portrays the civilizations of Eurasia and Africa during Classical Antiquity, circa 750 BC to 476 AD. In particular, it focuses on the societies that grew up along the shores of the Mediterranean Sea, which the Roman Empire would come to know as _Mare Nostrum_ ("Our Sea").

## Basics of Gameplay
Mare Nostrum gives every civil center a "civic population." This is distinct from the number of units you control, which represent a labor force recruited from your civic population. Typically, you will start with a Village with a civic population of 100. Every civil center has a basic growth rate of 5 citizens every 10 seconds; however, you can augment this growth rate by building houses and other civic buildings. Once your Village reaches a population of 500, it upgrades (automatically, at no cost) to a Town, unlocking the Town Phase.

Each civil center can ultimately pass through four levels: Village, Town (population 500), City (population 5,000), and Metropolis (population 25,000). Each subsequent upgrade, in addition to unlocking new phases, provides bonuses to units and buildings in the immediate vicinity of the civil center.

In the very early game, building civic buildings will be sufficient to grow your population. However, as each city's population grows, it becomes progressively more difficult to attract new citizens. This reflects the historical reality that ancient cities usually had abysmal death rates due to cramped living conditions and poor sanitation, and could only sustain their populations by attracting a steady stream of immigrants. Ultimately, you will need to attract more citizens to your civil centers by promoting trade. Typically, your city will grow by 2-3 citizens for every unit of goods that traders bring to its market.

In the City Phase, most factions can further augment their cities' growth rates by building Monuments – amenities such as theaters and bathhouses that attract more people to city life. This becomes almost a necessity to bring your City's population up to the 25,000 needed to become a Metropolis.

## New Resources
In addition to the four basic resources in Empires Ascendant, Mare Nostrum adds Wealth and Manpower.

Wealth is required to build temples, monuments, and wonders, as well as to train healers and hire mercenaries and champion units.
It is primarily earned via trade, with supplemental sources of wealth including cash crops (i.e. vineyards, olive groves) and wares (currently produced at the blacksmith).
Occassionally, a map may include a silver or gold deposit you can mine (NOT IMPLEMENTED YET).
Wealth is relatively unimportant in the early game, but becomes increasingly important in the mid-to-late game.

Manpower represents the pool of soldiers and laborers available for you to recruit from your civil centers. It is unique in that it cannot be bartered or traded to other players as tribute.
Every unit costs at least one unit of manpower, besides mercenaries. You typically start a match with at least 150 manpower.
Be careful, as a village only generates one unit of manpower every 30 seconds, so losing an army of 100+ in a failed rush can have disastrous consequences.
As your civil centers grow, so too does their manpower production rate; typically, a civil center's manpower production rate will increase by one for every 1,000 additional citizens.
Ultimately, manpower is meant to provide a decisive advantage in the late game to players who grew their cities faster.

In future releases, what is now known as the "Population Limit" will be renamed to the "Command Limit", to avoid confusion with the Civic Population.

## New Phases
Mare Nostrum has a total of five phases to advance through: Village, Town, City, Hegemon, and Empire. The first three phases are mostly identical to their counterparts in Empires Ascendant. The Hegemon Phase unlocks your faction's wonder plus either a palace or a choice of patron temples. The Empire Phase unlocks a massive population (command) limit bonus, plus a massive increase in your units' speed.

The phase requirements are as follows:

	- Village Phase: default
	- Town Phase: one Town (population 500)
	- City Phase: one City (population 5,000)
	- Hegemon Phase: one Metropolis (population 25,000)
	- Empire Phase: three Metropoli + one Wonder

## Miscellaneous Features
- Civil Center stats have been completely rebalanced:
	- Villages, the starting civil center, only cost 300 wood and 300 stone, but have half the armor of Empires Ascendant civil centers, and can only garrison 10 units.
	- Villages also lack the ability to shoot arrows. Towns and above can shoot arrows, and have progressively higher garrison limits and health, but all have an arrow limit of 10.
	- Military Colonies cost more than Villages, but start off with the same population as Towns, and with higher Resistance.
- Female Citizens have been replaced by a mixed-gender Citizen class, which more or less the same stats as female citizens.
- Citizen Soldiers can no longer gather grain, fruit, or wood, but can still gather most other resources.
- Created a new AI, Delphi Bot, fine tuned to work with Mare Nostrum. Built from a fork of Petra Bot.
- Every faction gets a Government Center (an Assembly or Palace, available in either the City Phase or Hegemon Phase, respectively). Government Centers train heroes and allow you to choose different styles of government (i.e. Democracy vs. Tyranny) and implement policies such as taxation.
- Every faction gets to build a temple to a patron deity upon reaching the City or Hegemon Phase. A Patron Temple provides certain bonuses based on the nature of the patron deity (i.e. fertility bonuses for a Temple of Demeter, military bonuses for a Temple of Athena Nike). Each player can only build one Patron Temple.
- Fields only allow three workers by default, but this number increases to five with a Farmhouse nearby, and seven if the farmhouse is upgraded to a Granary. Unlike Empires Ascendant, field workers _increase_ their productivity for every additional worker tasked to the same field, instead of experiencing diminishing returns.
- Metal and Stone mines have had their maximum workers reduced to 10 for large mines and 5 for small mines. This is intended to incentivize building multiple civil centres to increase your resource gather rate.
- Most factions get a "cash crop" resource field (i.e. vineyards, olive groves) from which they can gather a small amount of wealth.
	- Britons and Gauls can garrison sheep in corrals to gain a small trickle of wealth (represents harvesting wool).
- Mercenaries require a payment (upkeep) of 5 wealth every 20 seconds. If they are not paid, they rebel (switch loyalty to Gaia). To accommodate for the Carthaginians' heavy reliance on mercenaries, I have given the Carthaginian market a small wealth trickle.
- Domestic animals can produce food in the form of milk by grazing at pastures, a new food resource available on some random maps. This will play a larger role in gameplay when nomadic factions are eventually integrated into the game.
- Siege towers can now capture walls and other structures. Their capture attack strength, as well as their firepower, can be increased by garrisoning more troops inside. At the same time, the strength of their ranged attack has been reduced. This is intended to bring them closer to their historical role as devices for capturing fortifications.
- Certain structures have been classed as "Sturdy", including Stone Walls, Forts, City Centers, and Metropolis Centers. Sturdy structures cannot be damaged by organic units, only siege engines.
- Elephants have had a significant portion of their Crush attack converted to Hack attack. Due to the previous feature, they cannot attack heavy fortifications, meaning that, while they are still incredibly powerful, they cannot completely replace siege units.
- Pigs can transform into flaming pigs, which weaken the attack of nearby elephants. They also decrease elephants' capture points, and in large enough numbers can reduce an elephant's capture points to zero, at which point they go rogue (switch loyalty to Gaia) and become a hazard to their own faction's soldiers.
- Every faction's merchant ships can transform into fire ships. Just like Iberian fire ships, they burn for a while before self-destructing, dealing damage to any nearby ships in the process.
- Siege rams are capturable. (This feature was created to compensate for the excessively strong rams of A23; I am considering removing it for A25, given that Empires Ascendant has already rebalanced their stats)
- Docks have been split into two structures: Shipyards and Ports. Shipyards train warships and fishermen, while Ports train merchant ships, fishermen, and land traders. Only ports work as markets, but both work as resource dropsites.
- Only one Market can be built per civil center (for this purpose, Ports are classified as Markets).
- Civil Centers eject garrisoned units when their health is reduced to 40%. This makes it easier to capture a civil center without destroying it.
- Civil Centers have names, which are assigned randomly at construction from a list of names for each faction. They can be renamed later. City names are held in json files under simulation/data/cities.
- In addition to "Random", the faction selection menu allows you to choose a faction randomly from a subset of available factions (i.e. Greeks, Barbarians). This feature is ported from the mod [Random Civ Selection Groups](https://github.com/hopeless-ponderer/random_civ_groups_0ad).
- One new Random map: Western Mediterranean. Spans the entire western half of the Mediterranean Sea, from the Illyrian Coast to the Pillars of Hercules. Perfect for reenacting the Punic War.
- Three new map sizes: Mega I, Mega II, and Mega III. (Note: some maps will encounter errors rendering elevated terrain at these sizes, I'm working on fixing that)
- Every faction gets a supply wagon to act as a resource dropsite when they start in Nomad mode.

## Contributing
Mare Nostrum is an open source project, and I invite anyone to contribute. I'd especially love some artists to join the team, as I have limited graphic design skills and no idea how to use Blender.

For features that need fixing or implementing, take a look at the issues page or [TODO.md](./TODO.md).

If you want to add a new feature, or modify an existing one, please open a Feature Request as an issue so we can discuss it first. Once I give you the go-ahead, feel free to open a pull request.

Before contributing, please read [CONTRIBUTING.md](./CONTRIBUTING.md).
