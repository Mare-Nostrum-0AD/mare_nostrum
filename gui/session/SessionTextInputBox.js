/**
 * This is the same as a regular MessageBox, but it pauses if it is
 * a single-player game, until the player answered the dialog.
 */
class SessionTextInputBox
{
	display()
	{
		this.onPageOpening();

		Engine.PushGuiPage(
			"page_textInput.xml",
			{
				"width": this.Width,
				"height": this.Height,
				"title": this.Title,
				"message": this.Caption,
				"input": this.Input,
				"buttonCaptions": this.Buttons ? this.Buttons.map(button => button.caption) : undefined,
			},
			this.onPageClosed.bind(this));
	}

	onPageOpening()
	{
		closeOpenDialogs();
		g_PauseControl.implicitPause();
	}

	onPageClosed([buttonId, input])
	{
		if (this.Buttons && this.Buttons[buttonId].onPress)
			this.Buttons[buttonId].onPress.call(this, input);

		if (Engine.IsGameStarted())
			resumeGame();
	}
}

SessionTextInputBox.prototype.Width = 400;
SessionTextInputBox.prototype.Height = 200;
