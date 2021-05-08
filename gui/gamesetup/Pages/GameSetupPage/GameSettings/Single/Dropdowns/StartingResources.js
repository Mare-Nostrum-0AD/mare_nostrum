GameSettingControls.StartingResources = class extends GameSettingControlDropdown
{
	constructor(...args)
	{
		super(...args);

		this.dropdown.list = g_StartingResources.Title;
		this.dropdown.list_data = g_StartingResources.Resources.map((_, idx) => idx);

		this.perPlayer = false;
		this.sprintfArgs = {};
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

	onMapChange(mapData)
	{
		let mapValue;
		if (mapData &&
			mapData.settings &&
			mapData.settings.StartingResources !== undefined)
			mapValue = mapData.settings.StartingResources;

		if (mapValue !== undefined && mapValue != g_GameAttributes.settings.StartingResources)
		{
			g_GameAttributes.settings.StartingResources = mapValue;
			this.gameSettingsControl.updateGameAttributes();
		}

		let isScenario = g_GameAttributes.mapType == "scenario";

		this.perPlayer =
			isScenario &&
			mapData && mapData.settings && mapData.settings.PlayerData &&
			mapData.settings.PlayerData.some(pData => pData && pData.Resources !== undefined);

		this.setEnabled(!isScenario && !this.perPlayer);

		if (this.perPlayer)
			this.label.caption = this.PerPlayerCaption;
	}

	onGameAttributesChange()
	{
		if (g_GameAttributes.settings.StartingResources === undefined)
		{
			let resources = g_StartingResources.Resources[g_StartingResources.Default];
			g_GameAttributes.settings.StartingResources = resources;
			g_GameAttributes.settings.StartingResourcesIndex = g_StartingResources.Default;
			g_GameAttributes.settings.StartingResourcesLabel = this.generateLabel(resources);
			this.gameSettingsControl.updateGameAttributes();
		}
	}

	onGameAttributesBatchChange()
	{
		if (!this.perPlayer)
			this.setSelectedValue(g_GameAttributes.settings.StartingResourcesIndex);
	}

	getAutocompleteEntries()
	{
		return g_StartingResources.Title;
	}

	onSelectionChange(itemIdx)
	{
		let resources = g_StartingResources.Resources[itemIdx];
		g_GameAttributes.settings.StartingResources = resources;
		g_GameAttributes.settings.StartingResourcesIndex = itemIdx;
		g_GameAttributes.settings.StartingResourcesLabel = this.generateLabel(resources);
		this.gameSettingsControl.updateGameAttributes();
		this.gameSettingsControl.setNetworkGameAttributes();
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
