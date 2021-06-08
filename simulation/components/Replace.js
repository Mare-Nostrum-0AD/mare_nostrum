function Replace() {}

Replace.prototype.Schema = "<a:help>This unit, upon creation, will immediately transform into one of a selection of other units, chosen at random.</a:help>" +
	"<zeroOrMore>" +
		"<element a:help='One possible choice'>" +
			"<anyName />" +
			"<element name='Template' a:help='Template; supports {civ} and {native} parsing.'>" +
				"<text />" +
			"</element>" +
			"<element name='Weight' a:help='Value determining the likelihood this template will be chosen.'>" +
				"<data type='positiveInteger' />" +
			"</element>" +
		"</element>" +
	"</zeroOrMore>";

Replace.prototype.Replace = function()
{
	let cmpPlayer = QueryOwnerInterface(this.entity);
	let cmpIdentity = Engine.QueryInterface(this.entity, IID_Identity);
	let templates = [];
	for (let key in this.template)
	{
		let weight = Math.round(ApplyValueModificationsToEntity("Replace/" + key + "/Weight", this.template[key].Weight, this.entity));
		let rawTemplate = this.template[key].Template;
		let parsedTemplate = rawTemplate.indexOf('{native}') !== -1 ?
			parseCivTemplate(rawTemplate, /\{native\}/g, cmpIdentity.GetCiv()) :
			parseCivTemplate(rawTemplate, /\{civ\}/g, cmpPlayer.GetCiv());
		if (!parsedTemplate)
			continue;
		for (let i = 0; i < weight; i++)
		{
			templates.push(parsedTemplate);
		}
	}
	if (!templates || !templates.length)
		return this.entity;
	const template = pickRandom(templates);
	return EntityTransformer.ChangeEntityTemplate(this.entity, template);
};// end Replace.prototype.Replace

Replace.prototype.OnEntityCreated = function()
{
	this.Replace();
};

Replace.prototype.OnInitGame = function()
{
	this.Replace();
};

Engine.RegisterComponentType(IID_Replace, "Replace", Replace);
