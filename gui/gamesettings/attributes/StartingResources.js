/**
 * TODO: There should be a dialog allowing to specify starting resources per player
 */
GameSettings.prototype.Attributes.StartingResources = class StartingResources extends GameSetting
{
	init()
	{
		this.resourceManager = new Resources();
		this.defaultValue = this.getDefaultValue("StartingResources", "Resources") || this.resourceManager.GetCodes().reduce((accum, curr) => {
			accum[curr] = 300;
			return accum;
		}, {});
		this.perPlayer = undefined;
		this.setResources(this.defaultValue);
		this.settings.map.watch(() => this.onMapChange(), ["map"]);
	}

	toInitAttributes(attribs)
	{
		if (this.perPlayer)
		{
			if (!attribs.settings.PlayerData)
				attribs.settings.PlayerData = [];
			while (attribs.settings.PlayerData.length < this.perPlayer.length)
				attribs.settings.PlayerData.push({});
			for (let i in this.perPlayer)
				if (this.perPlayer[i])
					attribs.settings.PlayerData[i].Resources = this.perPlayer[i];
		}
		attribs.settings.StartingResources = this.resources;
		attribs.settings.StartingResourcesIndex = this.index;
		attribs.settings.StartingResourcesLabel = this.label;
	}

	fromInitAttributes(attribs)
	{
		if (this.getLegacySetting(attribs, "StartingResources") !== undefined)
		{
			this.setResources(this.getLegacySetting(attribs, "StartingResources"));
			this.index = +this.getLegacySetting(attribs, "StartingResourcesIndex");
			this.label = this.getLegacySetting(attribs, "StartingResourcesLabel");
		}
	}

	onMapChange()
	{
		this.perPlayer = undefined;
		if (this.settings.map.type != "scenario")
			return;
		if (!!this.getMapSetting("PlayerData") &&
		     this.getMapSetting("PlayerData").some(data => data.Resources))
			this.perPlayer = this.getMapSetting("PlayerData").map(data => data.Resources || undefined);
		else if (!this.getMapSetting("StartingResources"))
			this.setResources(this.defaultValue);
		else
			this.setResources(this.getMapSetting("StartingResources"));
	}

	setResources(res)
	{
		if (typeof res === 'number')
		{
			this.resources = this.resourceManager.GetCodes().reduce((accum, curr) => {
				accum[curr] = res;
				return accum;
			}, {});
		}
		else
		{
			this.resources = res;
		}
	}
};
