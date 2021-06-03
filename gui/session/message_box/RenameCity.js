class RenameCity extends SessionTextInputBox
{
	constructor(renameCity, oldName)
	{
		super();
		this.Input = oldName;
		this.renameCity = (newName) => {
			if (!newName || !newName.length)
				return;

			renameCity(newName);
		};
	}
}

RenameCity.prototype.Title = translate("Rename City");
RenameCity.prototype.Caption = translate("Set new city name:");
RenameCity.prototype.Buttons = [
	{
		"caption": translate("Set Name"),
		"onPress": function(input) { this.renameCity(input);  }
	}
];
