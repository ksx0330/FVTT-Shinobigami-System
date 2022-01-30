
export class ShinobigamiActor extends Actor {

  prepareData() {
    super.prepareData();
    
    console.log(this);

  }

  async rollTalent(title, num, add) {
    if (add) {
      this._onRollDice(title, null, num); 
      return;
    }
    
    new Dialog({
        title: "Please put the additional value",
        content: `<p><input type='text' id='add'></p><script>$("#add").focus()</script>`,
        buttons: {
          confirm: {
            icon: '<i class="fas fa-check"></i>',
            label: "Confirm",
            callback: () => this._onRollDice(title, $("#add").val(), num)
          }
        },
        default: "confirm"
    }).render(true);
    
  }

  async _onRollDice(title, add, num) {
    
    // GM rolls.
    let chatData = {
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: "<h2><b>" + title + "</b></h2>"
    };

    let rollMode = game.settings.get("core", "rollMode");
    if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");
    if (rollMode === "selfroll") chatData["whisper"] = [game.user.id];
    if (rollMode === "blindroll") chatData["blind"] = true;

    let formula = "2d6";
    if (add != null)
      formula += (add < 0) ? `${add}` : `+${add}`
    let roll = new Roll(formula);
    await roll.roll();
    let d = roll.terms[0].total;
    
    chatData.content = await renderTemplate("systems/shinobigami/templates/roll.html", {
        formula: roll.formula,
        flavor: null,
        user: game.user.id,
        tooltip: await roll.getTooltip(),
        total: Math.round(roll.total * 100) / 100,
        special: d == 12,
        fumble: d == 2,
        num: num
    });

    if (game.dice3d) {
        game.dice3d.showForRoll(roll, game.user, true, chatData.whisper, chatData.blind).then(displayed => ChatMessage.create(chatData));;
    } else {
        chatData.sound = CONFIG.sounds.dice;
        ChatMessage.create(chatData);
    }
  }

}
