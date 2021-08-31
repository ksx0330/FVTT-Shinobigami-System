export class PlotDialog extends Dialog {

  constructor(actor, actors, combat, options) {
    super(options);
    this.actor = actor;
    this.actors = actors;

    this.combat = combat;
    this.plot = ["?"];
    this.select = null;

    this.data = {
      title: "Plot Dialog",
      content: this._getContent(),
      buttons: {
        "ready": {
            icon: '<i class="fas fa-check"></i>',
            label: "Ready",
            callback: () => this._ready()
        }
      }
    }
  }

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      template: "templates/hud/dialog.html",
      classes: ["dialog", "shinobigami"],
      width: 400
    });
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    html.find(".plot").click(this._selectDice.bind(this));
    html.find(".select").click(this._swapDice.bind(this));
    html.find(".add-dice").click(this._addDice.bind(this));
    html.find(".remove-dice").click(this._removeDice.bind(this));
  }

  _getContent() {
    var content = `
    <h2 class="plot-header">${this.actor.name}
      <div class="dice-controls" style="float: right">
        <button type="button" class="add-dice">
          <i class="fas fa-plus"></i>
        </button>
        <button type="button" class="remove-dice">
          <i class="fas fa-minus"></i>
        </button>
      </div></h2><div id="plot-dices" class="dice-lists dice-lists-md">`

    content += `<div class="plot" data-index="0">?</div> `;
    content += `</div><hr><div id="select-dices" class="dice-lists dice-lists-md">`

    let range = ["1","2","3","4","5","6","?"]
    for (let d of range)
      content += `<div class="select" data-num="${d}">${d}</div>`;

    content += `</div><hr>`

    return content;
  }

  _addDice(event) {
    event.preventDefault();

    $(event.currentTarget.closest(".dialog-content")).find("#plot-dices").append(`<div class="plot dice" data-index="${this.plot.length}">?</div> `);
    this.plot.push("?");

    $(event.currentTarget.closest(".dialog-content")).find(".plot").last().click(this._selectDice.bind(this));
  }

  _removeDice(event) {
    event.preventDefault();
    this.plot.pop();
    $(event.currentTarget.closest(".dialog-content")).find(".plot").last().remove();
  }

  _selectDice(event) {
    event.preventDefault();

    if ($(event.currentTarget).hasClass("dice-select")) {
      $(event.currentTarget).removeClass("dice-select");

      this.select = null;
      return;
    }

    $(event.currentTarget).parent().find(".dice-select").removeClass("dice-select");
    $(event.currentTarget).addClass("dice-select");

    this.select = event.currentTarget;
  }

  _swapDice(event) {
    event.preventDefault();

    if (this.select != null) {
      this.plot[this.select.dataset.index] = event.currentTarget.dataset.num;

      $(this.select).text(event.currentTarget.dataset.num);
      $(this.select).removeClass("dice-select");

      this.select = null;
    }
  }

  async _ready() {
    await this.actor.setFlag("shinobigami", "plot", {state: true, dice: this.plot});
    let chatData = {"content": game.i18n.localize("Shinobigami.ReadyPlot"), "speaker": ChatMessage.getSpeaker({ actor: this.actor })};
    ChatMessage.create(chatData);

    console.log(this.actor);
    console.log(this.actors);

    let list = [];
    for (let actor of this.actors) {
      if (!actor.data.flags["shinobigami"].plot.state)
        return;
      else
        list.push({actor: actor, dice: actor.data.flags["shinobigami"].plot.dice});
    }

    let content = `<table><colgroup><col style="width: 30%"><col style="width: 70%"></colgroup>`;
    for (let l of list) {
      content += `<tr><th>${l.actor.name}</th><td class="dice-lists dice-lists-sm">`;
      for (let [index, d] of l.dice.entries()) {
        if (d == "?") {
          d = new Roll("1d6").roll().total;
          l.dice[index] = d;
          content += `<div class="random">${d}</div> `
        } else
          content += `<div>${d}</div> `
      }
      content += `</td></tr>`;
    }
    content += `</table>`;
    
    chatData = {"content": content, "speaker": ChatMessage.getSpeaker({ alias: "PLOT" })};
    ChatMessage.create(chatData);

    if (this.combat) {
      let updates = [];
      for (let actor of this.actors)
        updates.push({_id: actor.combatId, initiative: actor.data.flags["shinobigami"].plot.dice[0]});
      await game.combat.updateEmbeddedDocuments("Combatant", updates);
    }
  }


}
