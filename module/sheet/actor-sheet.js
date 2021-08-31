/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class ShinobigamiActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["shinobigami", "sheet", "actor"],
      template: "systems/shinobigami/templates/actor-sheet.html",
      width: 850,
      height: 800,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "skill"}],
      dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData(options) {
    let isOwner = false;
    let isEditable = this.isEditable;
    let data = super.getData(options);
    let items = {};
    let actorData = {};

    isOwner = this.document.isOwner;
    isEditable = this.isEditable;
    

    // The Actor's data
    actorData = this.actor.data.toObject(false);
    data.actor = actorData;
    data.data = actorData.data;
    data.data.isOwner = isOwner;

    // Owned Items
    data.items = Array.from(this.actor.items.values());
    data.items = data.items.map( i => {
      i.data.id = i.id;
      return i.data;
    });
    
    data.dtypes = ["String", "Number", "Boolean"];

    data.data.tables = [];
    for (var i = 2; i <= 12; ++i) {
        data.data.tables.push({line: [], number: i});
        for (var j = 0; j < 6; ++j) {
            var name = String.fromCharCode(65 + j);
            data.data.tables[i - 2].line.push({ id: `col-${j}-${i-2}`, title: `Shinobigami.${name}${i}`, name: `data.talent.table.${j}.${i - 2}`, state: data.data.talent.table[j][i - 2].state, num: data.data.talent.table[j][i - 2].num, stop: data.data.talent.table[j][i - 2].stop });
        }
    }

    actorData.abilityList = [];
    actorData.bondList = [];
    actorData.itemList = [];
    actorData.finishList = [];
    actorData.backgroundList = [];

    for (let i of data.items) {
        if (i.type === 'ability')
            actorData.abilityList.push(i);
        else if (i.type == 'bond')
            actorData.bondList.push(i);
        else if (i.type == 'item')
            actorData.itemList.push(i);
        else if (i.type == 'finish')
            actorData.finishList.push(i);
        else if (i.type == 'background')
            actorData.backgroundList.push(i);
    }

    return data;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    html.find(".talent-name").parent().on('mouseenter', (event) => {
      event.preventDefault();

      let name = $(event.currentTarget);
      let dialog = $("#talent-description");
      let nameData = name.find(".talent-name")[0].dataset;
      let num = nameData.num;

      dialog.text(name.text() + " / " + num);
      dialog.css({"left": parseInt(name.offset().left)+10, "top": parseInt(name.offset().top)+28});
      dialog.show();

    }).on('mouseleave', (event) => {
      $("#talent-description").hide();

    });

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    html.find(".talent-name").on('mousedown', this._onRouteTalent.bind(this));

    // Owned Item management
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Update Inventory Item
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.getOwnedItem(li.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      this.actor.deleteOwnedItem(li.data("itemId"));
      li.slideUp(200, () => this.render(false));
    });


    // Talent
    html.find('.item-label').click(this._showItemDetails.bind(this));
    html.find(".echo-item").click(this._echoItemDescription.bind(this));

    // Use Item
    html.find(".use-item").click(this._useItem.bind(this));

    if (this.actor.owner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }

  }

  /* -------------------------------------------- */

  /** @override */
  setPosition(options={}) {
    const position = super.setPosition(options);
    const sheetBody = this.element.find(".sheet-body");
    const bodyHeight = position.height;
    sheetBody.css("height", bodyHeight);
    return position;
  }

  /* -------------------------------------------- */

  /** @override */
  async _updateObject(event, formData) {
    let target = event.currentTarget;

    if (target == undefined || (target.name.indexOf("data.talent") == -1 && target.name.indexOf("data.health.state") == -1) )
      return await this.object.update(formData);

    await this.object.update(formData);
    this._updateFormData(formData);
    
    return await this.object.update(formData);
  }


  /* -------------------------------------------- */
  
  async _onRouteTalent(event) {
    if (event.button == 2 || event.which == 3)
      this._setStopTalent(event);
    else
      this._onRollTalent(event);
  }
  
  async _setStopTalent(event) {
    event.preventDefault();
    let table = duplicate(this.actor.data.data.talent.table);
    
    let dataset = event.currentTarget.dataset;
    let id = dataset.id.split("-");
    
    table[id[1]][id[2]].stop = !table[id[1]][id[2]].stop;
    await this.actor.update({"data.talent.table": table});
    
    let formData = {};
    this._updateFormData(formData);
    await this.object.update(formData);
    
  }

  async _onRollTalent(event) {
    event.preventDefault();
    let dataset = event.currentTarget.dataset;
    let num = dataset.num;
    let title = dataset.title;
    
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

    let roll = new Roll("2d6");
    roll.roll();
    chatData.content = await renderTemplate("systems/shinobigami/templates/roll.html", {
        formula: roll.formula,
        flavor: null,
        user: game.user.id,
        tooltip: await roll.getTooltip(),
        total: Math.round(roll.total * 100) / 100,
        num: num
    });

    if (game.dice3d) {
        game.dice3d.showForRoll(roll, game.user, true, chatData.whisper, chatData.blind).then(displayed => ChatMessage.create(chatData));;
    } else {
        chatData.sound = CONFIG.sounds.dice;
        ChatMessage.create(chatData);
    }
  }


    /* -------------------------------------------- */
  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const type = header.dataset.type;

    const name = `New ${type.capitalize()}`;
    const itemData = {
      name: name,
      type: type
    };
    return this.actor.createOwnedItem(itemData);
  }

  _showItemDetails(event) {
    event.preventDefault();
    const toggler = $(event.currentTarget);
    const item = toggler.parents('.item');
    const description = item.find('.item-description');

    toggler.toggleClass('open');
    description.slideToggle();
  }

  _echoItemDescription(event) {
    event.preventDefault();
    const itemDocument = $(event.currentTarget).parents('.item');
    const itemId = itemDocument[0].dataset.itemId;
    
    const item = this.actor.items.get(itemId);

    let title = item.data.name;
    let description = item.data.data.description;

    if (item.data.type == 'ability') {
      if (item.data.img != 'icons/svg/mystery-man.svg')
        title = `<img src="${item.data.img}" width="40" height="40">&nbsp&nbsp<b>${title}</b>` 

      description = `<table style="text-align: center;">
                      <tr>
                        <th>${game.i18n.localize("Shinobigami.Type")}</th>
                        <th>${game.i18n.localize("Shinobigami.Gap")}</th>
                        <th>${game.i18n.localize("Shinobigami.Cost")}</th>
                        <th>${game.i18n.localize("Shinobigami.Talent")}</th>
                      </tr>

                      <tr>
                        <td>${item.data.data.type}</td>
                        <td>${item.data.data.gap}</td>
                        <td>${item.data.data.cost}</td>
                        <td>${item.data.data.talent}</td>
                      </tr>
                    </table>${description}`
    }

    else if (item.data.type == 'bond') {
      if (item.data.img != 'icons/svg/mystery-man.svg')
        title = `<img src="${item.data.img}" width="40" height="40">&nbsp&nbsp<b>${title}</b>` 

      description = `<table style="text-align: center;">
                      <tr>
                        <th>${game.i18n.localize("Shinobigami.Residence")}</th>
                        <th>${game.i18n.localize("Shinobigami.Secret")}</th>
                        <th>${game.i18n.localize("Shinobigami.Finish")}</th>
                        <th>${game.i18n.localize("Shinobigami.Feeling")}</th>
                      </tr>

                      <tr>
                        <td>${(item.data.data.residence) ? "O" : "X"}</td>
                        <td>${(item.data.data.secret) ? "O" : "X"}</td>
                        <td>${(item.data.data.finish) ? "O" : "X"}</td>
                        <td>${item.data.data.feeling}</td>
                      </tr>
                    </table>${description}`
    }
    
    else if (item.data.type == 'background') {
      if (item.data.img != 'icons/svg/mystery-man.svg')
        title = `<img src="${item.data.img}" width="40" height="40">&nbsp&nbsp<b>${title}</b>` 

      description = `<table style="text-align: center;">
                      <tr>
                        <th>${game.i18n.localize("Shinobigami.Type")}</th>
                        <th>${game.i18n.localize("Shinobigami.RequireEXP")}</th>
                      </tr>

                      <tr>
                        <td>${(item.data.data.type == "pros") ? '<i class="fas fa-grin-alt"></i>' : '<i class="fas fa-frown"></i>'}</td>
                        <td>${item.data.data.exp}</td>
                      </tr>
                    </table>${description}`
    }
    
    else if (item.data.type == 'finish') {
      if (item.data.img != 'icons/svg/mystery-man.svg')
        title = `<img src="${item.data.img}" width="40" height="40">&nbsp&nbsp<b>${title}</b>` 

      description = `<table style="text-align: center;">
                      <tr>
                        <th>${game.i18n.localize("Shinobigami.Type")}</th>
                        <th>${game.i18n.localize("Shinobigami.Talent")}</th>
                      </tr>

                      <tr>
                        <td>${item.data.data.type}</td>
                        <td>${item.data.data.talent}</td>
                      </tr>
                    </table>${description}`
      
    }
    
    else if (item.data.type == "item") {
      if (item.data.img != 'icons/svg/mystery-man.svg')
        title = `<img src="${item.data.img}" width="40" height="40">&nbsp&nbsp<b>${title} X ${item.data.data.quantity}</b>` 
    }
    
    // GM rolls.
    let chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: "<h2>" + title + "</h2>" + description
    };

    ChatMessage.create(chatData);

  }

  async _useItem(event) {
    event.preventDefault();
    const useButton = $(event.currentTarget);
    const item = this.actor.getOwnedItem(useButton.parents('.item')[0].dataset.itemId);

    if (item.data.data.quantity > 0) {
      await item.update({'data.quantity': item.data.data.quantity - 1});
  
      // GM rolls.
      let chatData = {
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: "<h3>" + game.i18n.localize("Shinobigami.UseItem") + ": " + item.data.name + "</h3>"
      };
  
      let rollMode = game.settings.get("core", "rollMode");
      if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");
      if (rollMode === "selfroll") chatData["whisper"] = [game.user.id];
      if (rollMode === "blindroll") chatData["blind"] = true;
  
      ChatMessage.create(chatData);

    }
  
  }
  
  _updateFormData(formData) {
    let table = this._getTalentTable();
    
    for (var i = 0; i < 6; ++i)
    for (var j = 0; j < 11; ++j)
      formData[`data.talent.table.${i}.${j}.num`] = table[i][j].num;

  }

  _getTalentTable() {
    let health = this.actor.data.data.health.state;
    let table = JSON.parse(JSON.stringify(this.actor.data.data.talent.table));
    let curiosity = this.actor.data.data.talent.curiosity;
    let gap = this.actor.data.data.talent.gap;
    let nodes = [];
    
    let overflowX = this.actor.data.data.talent.overflowX;
    let overflowY = this.actor.data.data.talent.overflowY;
    
    for (var i = 0; i < 6; ++i)
    for (var j = 0; j < 11; ++j) {
      if (table[i][j].state == true && table[i][j].stop == false && health[i] == false) {
        nodes.push({x: i, y: j});
        table[i][j].num = "5";
      } else
        table[i][j].num = "12";
    }

    let dx = [0, 0, 1, -1];
    let dy = [1, -1, 0, 0];
    let move = [1, 1, 2, 2];
    for (var i = 0; i < nodes.length; ++i) {
      let queue = [nodes[i]];

      while (queue.length != 0) {
        let now = queue[0];
        queue.shift();
        
        if (+table[now.x][now.y].num == 12)
          continue;

        for (var d = 0; d < 4; ++d) {
          var nx = now.x + dx[d];
          var ny = now.y + dy[d];
          var m = move[d];

          if (overflowX && (nx < 0 || nx >= 6) )
            nx = (nx < 0) ? 5 : 0;
          if (overflowY && (ny < 0 || ny >= 11) )
            ny = (ny < 0) ? 10 : 0;
          
          if (nx < 0 || nx >= 6 || ny < 0 || ny >= 11)
            continue;

          let g = ( (now.x == 0 && nx == 5) || (now.x == 5 && nx == 0) ) ? gap[0] : gap[(nx > now.x) ? nx : now.x];
          if (m == 2 && g)
            m = 1;

          if (Number(table[nx][ny].num) > Number(table[now.x][now.y].num) + m) {
            table[nx][ny].num = String(Number(table[now.x][now.y].num) + m);
            queue.push({x: nx, y: ny});
          }
        }
      }
    }

    return table;
  }

}
