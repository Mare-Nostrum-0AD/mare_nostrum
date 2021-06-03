/**
 * Currently limited to at most 3 buttons per message box.
 * The convention is to have "cancel" appear first.
 */
function init(data)
{
	// Set title
	Engine.GetGUIObjectByName("textInputTitleBar").caption = data.title;

	// Set subject
	let textInputTextObj = Engine.GetGUIObjectByName("textInputText");
	textInputTextObj.caption = data.message;
	if (data.font)
		textInputTextObj.font = data.font;

	// Set starting input
	let textInputInputObj = Engine.GetGUIObjectByName("textInputInput");
	textInputInputObj.caption = data.input;
	if (data.font)
		textInputInputObj.font = data.font;

	// Default behaviour
	let textInputCancelHotkey = Engine.GetGUIObjectByName("textInputCancelHotkey");
	textInputCancelHotkey.onPress = Engine.PopGuiPage;

	// Calculate size
	let textInputLRDiff = data.width / 2;
	let textInputUDDiff = data.height / 2;
	Engine.GetGUIObjectByName("textInputMain").size = "50%-" + textInputLRDiff + " 50%-" + textInputUDDiff + " 50%+" + textInputLRDiff + " 50%+" + textInputUDDiff;

	let captions = data.buttonCaptions || [translate("OK")];

	// Set button captions and visibility
	let textInputButton = [];
	captions.forEach((caption, i) => {
		textInputButton[i] = Engine.GetGUIObjectByName("textInputButton" + (i + 1));
		textInputButton[i].caption = caption;
		textInputButton[i].hidden = false;
		textInputButton[i].onPress = () => {
			Engine.PopGuiPage([i, textInputInputObj.caption]);
		};

		// Convention: Cancel is the first button
		if (i == 0)
			textInputCancelHotkey.onPress = textInputButton[i].onPress;
	});

	// Distribute buttons horizontally
	let y1 = "100%-46";
	let y2 = "100%-18";
	switch (captions.length)
	{
	case 1:
		textInputButton[0].size = "18 " + y1 + " 100%-18 " + y2;
		break;
	case 2:
		textInputButton[0].size = "18 " + y1 + " 50%-5 " + y2;
		textInputButton[1].size = "50%+5 " + y1 + " 100%-18 " + y2;
		break;
	case 3:
		textInputButton[0].size = "18 " + y1 + " 33%-5 " + y2;
		textInputButton[1].size = "33%+5 " + y1 + " 66%-5 " + y2;
		textInputButton[2].size = "66%+5 " + y1 + " 100%-18 " + y2;
		break;
	}
}
