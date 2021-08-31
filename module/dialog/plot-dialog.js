export class PlotDialog extends Dialog {

  constructor(actorId, combatantId, name, receiver, options) {
    super(options);
    this.actorId = actorId;
    this.combatantId = combatantId;
    this.name = name;
    this.receiver = receiver;
    
    this.ready = false;

    this.plot = ["?"];
    this.select = null;

    this.data = {
      title: "Plot Dialog",
      content: this._getContent(),
      buttons: {}
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
    html.find("#ready").click(this._ready.bind(this));
  }

  _getContent() {
    var content = `
    <h2 class="plot-header">${this.name}
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

    content += `</div><hr><button type="button" class="await" id="ready">Ready</button>`

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

  async _ready(event) {
    event.preventDefault();
    this.ready = !this.ready;
    
    if (this.ready) {
      $(event.currentTarget).removeClass("await");
      $(event.currentTarget).addClass("ready");
      $(event.currentTarget).text("Cancel");
    } else {
      $(event.currentTarget).removeClass("ready");
      $(event.currentTarget).addClass("await");
      $(event.currentTarget).text("Ready");
    }
    
    let chatData = {"content": (this.ready) ? game.i18n.localize("Shinobigami.ReadyPlot") : game.i18n.localize("Shinobigami.AwaitPlot"), "speaker": ChatMessage.getSpeaker({ alias: this.name })};
    ChatMessage.create(chatData);
  
    if (game.user.id === this.receiver) {
      let plot = game.shinobigami.plot.find(a => (a.actorId === this.actorId && a.combatant === this.combatantId));
      plot.ready = this.ready;
      plot.dice = this.plot;
      
      Hooks.call("checkPlot");
      
    } else
      game.socket.emit("system.shinobigami", {id: "resp", sender: game.user.id, receiver: this.receiver, data: { actorId: this.actorId, combatantId: this.combatantId, dice: this.plot, ready: this.ready } });
    
  }


}
