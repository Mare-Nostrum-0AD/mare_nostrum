GameSettingControls.StartingResources = class StartingResources extends GameSettingControlDropdown
{
	constructor(...args)
	{
		super(...args);

		this.dropdown.list = g_StartingResources.Title;
		this.dropdown.list_data = g_StartingResources.Resources.map((_, idx) => idx);

		this.sprintfArgs = {};

		g_GameSettings.startingResources.watch(() => this.render(), ["resources", "perPlayer"]);
		g_GameSettings.map.watch(() => this.render(), ["type"]);
		this.render();
	}

	// generate label for each resource level
	generateLabel(resources)
	{
		return Object.keys(resources).map((res) => sprintf('%s: %d', res, resources[res])).join("\n");
	}

	onHoverChange()
	{
		let tooltip = this.Tooltip;
		if (this.dropdown.hovered != -1)
		{
			let resources = g_StartingResources.Resources[this.dropdown.hovered];
			this.sprintfArgs.resources =
				Object.keys(resources).map((res) => sprintf('%d %s', resources[res], res)).join(', ');
			tooltip = sprintf(this.HoverTooltip, this.sprintfArgs);
		}
		this.dropdown.tooltip = tooltip;
	}

	render()
	{
		this.setEnabled(g_GameSettings.map.type != "scenario" && !g_GameSettings.startingResources.perPlayer);
		if (g_GameSettings.startingResources.perPlayer)
			this.label.caption = this.PerPlayerCaption;
		else
			this.setSelectedValue(g_GameSettings.startingResources.index);
	}

	getAutocompleteEntries()
	{
		return g_StartingResources.Title;
	}

	onSelectionChange(itemIdx)
	{
		let resources = g_StartingResources.Resources[itemIdx];
		g_GameSettings.startingResources.index = itemIdx;
		g_GameSettings.startingResources.label = this.generateLabel(resources);
		g_GameSettings.startingResources.setResources(resources);
		this.gameSettingsController.setNetworkInitAttributes();
	}
};

GameSettingControls.StartingResources.prototype.TitleCaption =
	translate("Starting Resources");

GameSettingControls.StartingResources.prototype.Tooltip =
	translate("Select the game's starting resources.");

GameSettingControls.StartingResources.prototype.HoverTooltip =
	translate("Initial amount of each resource: %(resources)s.");

GameSettingControls.StartingResources.prototype.PerPlayerCaption =
	translateWithContext("starting resources", "Per Player");

GameSettingControls.StartingResources.prototype.AutocompleteOrder = 0;
