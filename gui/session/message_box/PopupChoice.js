class PopupChoice extends SessionMessageBox
{
	constructor({ title, text, width, height, choices })
	{
		super();
		this.Caption = text;
		if (title)
			this.Title = title;
		if (width)
			this.Width = width;
		if (height)
			this.Height = height;
		if (choices)
		{
			this.Buttons = choices.map(([caption, cmd]) => ({
				caption,
				"onPress": cmd ?
					function() {
						Engine.PostNetworkCommand({
							...cmd,
							"type": "execute-component-function"
						});
					} :
					null
			}));
		}
	}
}

DeleteSelectionConfirmation.prototype.Title = translate("Choice");
DeleteSelectionConfirmation.prototype.Buttons = [
	{
		"caption": translate("Ok")
	}
];
